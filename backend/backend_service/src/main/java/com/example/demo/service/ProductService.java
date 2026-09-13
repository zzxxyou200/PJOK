package com.example.demo.service;

import com.example.demo.dto.ProductResponse;
import com.example.demo.entity.Category;
import com.example.demo.entity.ProductItem;
import com.example.demo.entity.ProductPrice;
import com.example.demo.entity.User;
import com.example.demo.repository.ProductItemRepository;
import com.example.demo.repository.ProductPriceRepository;
import com.example.demo.repository.ProductSaleRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductItemRepository productItemRepository;
    private final ProductPriceRepository productPriceRepository;
    private final ProductSaleRepository productSaleRepository;
    private final UserRepository userRepository;

    public List<ProductResponse> getProductsForUser(String username) {
        Long organizationId = userRepository.findByUsername(username)
                .map(User::getOrganizationId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        List<ProductItem> items = productItemRepository.findAll();
        LocalDateTime now = LocalDateTime.now();
        Map<Long, Long> totalSold = loadTotalSold();

        return items.stream()
                .map(item -> toResponse(item, organizationId, now, totalSold))
                .toList();
    }

    public ProductResponse getProductDetail(Long productId, String username) {
        Long organizationId = userRepository.findByUsername(username)
                .map(User::getOrganizationId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        ProductItem item = productItemRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + productId));

        return toResponse(item, organizationId, LocalDateTime.now(), loadTotalSold());
    }

    public List<ProductResponse> getPricedProductsForUser(String username, String category) {
        Long organizationId = userRepository.findByUsername(username)
                .map(User::getOrganizationId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        if (organizationId == null) {
            return List.of();
        }

        LocalDateTime now = LocalDateTime.now();
        Set<Long> pricedProductIds = Set.copyOf(
                productPriceRepository.findProductIdsWithPrice(organizationId, now));

        boolean filterByCategory = category != null && !category.isBlank() && !category.equalsIgnoreCase("All");

        return productItemRepository.findAll().stream()
                .filter(item -> pricedProductIds.contains(item.getProductId()))
                .filter(item -> !filterByCategory || hasMatchingCategory(item, category))
                .map(item -> toResponse(item, organizationId, now, loadTotalSold()))
                .toList();
    }

    private Map<Long, Long> loadTotalSold() {
        return productSaleRepository.sumQuantityByProduct().stream()
                .collect(Collectors.toMap(
                        row -> ((Number) row[0]).longValue(),
                        row -> ((Number) row[1]).longValue()
                ));
    }

    private boolean hasMatchingCategory(ProductItem item, String category) {
        return item.getCategories() != null && item.getCategories().stream()
                .anyMatch(c -> category.equalsIgnoreCase(c.getName()));
    }

    private String primaryCategoryName(ProductItem item) {
        if (item.getCategories() == null || item.getCategories().isEmpty()) {
            return null;
        }
        return item.getCategories().stream()
                .min(Comparator.comparing(Category::getId))
                .map(Category::getName)
                .orElse(null);
    }

    private List<String> categoryNames(ProductItem item) {
        if (item.getCategories() == null) {
            return List.of();
        }
        return item.getCategories().stream()
                .sorted(Comparator.comparing(Category::getId))
                .map(Category::getName)
                .toList();
    }

    private ProductResponse toResponse(ProductItem item, Long organizationId, LocalDateTime now,
                                       Map<Long, Long> totalSold) {
        BigDecimal price = null;

        if (organizationId != null) {
            price = productPriceRepository
                    .findCurrentPrices(item.getProductId(), organizationId, now)
                    .stream()
                    .map(ProductPrice::getPrice)
                    .findFirst()
                    .orElse(null);
        }

        return ProductResponse.builder()
                .productId(item.getProductId())
                .productName(item.getProductName())
                .serialNumber(item.getSerialNumber())
                .conditionStatus(item.getConditionStatus())
                .itemStatus(item.getItemStatus())
                .category(primaryCategoryName(item))
                .categories(categoryNames(item))
                .warrantyStartDate(item.getWarrantyStartDate())
                .warrantyEndDate(item.getWarrantyEndDate())
                .note(item.getNote())
                .images(item.getImages())
                .price(price)
                .totalSold(totalSold.getOrDefault(item.getProductId(), 0L))
                .organizationId(organizationId)
                .build();
    }
}