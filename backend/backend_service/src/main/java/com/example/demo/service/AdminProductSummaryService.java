package com.example.demo.service;

import com.example.demo.dto.AdminProductSummaryResponse;
import com.example.demo.dto.AdminProductOptionsResponse;
import com.example.demo.dto.AdminProductUpdateRequest;
import com.example.demo.entity.PriceStatus;
import com.example.demo.entity.Category;
import com.example.demo.entity.ProductItem;
import com.example.demo.entity.ProductPrice;
import com.example.demo.repository.CategoryRepository;
import com.example.demo.repository.ProductItemRepository;
import com.example.demo.repository.ProductPriceRepository;
import com.example.demo.repository.ProductSaleRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminProductSummaryService {

    private static final long DEFAULT_ORGANIZATION_ID = 1L;

    private final ProductItemRepository productItemRepository;
    private final ProductPriceRepository productPriceRepository;
    private final ProductSaleRepository productSaleRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<AdminProductSummaryResponse> getProductSummary() {
        LocalDateTime now = LocalDateTime.now();
        Map<Long, Map<Long, ProductPrice>> pricesByProduct = productPriceRepository.findAll()
                .stream()
                .filter(price -> isActive(price, now))
                .collect(Collectors.groupingBy(
                        ProductPrice::getProductId,
                        Collectors.toMap(
                                ProductPrice::getOrganizationId,
                                        price -> price,
                                (first, second) -> first.getEffectiveFrom().isAfter(second.getEffectiveFrom())
                                        ? first
                                        : second
                        )
                ));
        Map<Long, Long> soldByProduct = productSaleRepository.sumQuantityByProduct().stream()
                .collect(Collectors.toMap(
                        row -> ((Number) row[0]).longValue(),
                        row -> ((Number) row[1]).longValue()
                ));

        return productItemRepository.findAll().stream()
                .sorted(Comparator.comparing(ProductItem::getProductId))
                .map(item -> toSummary(item, pricesByProduct, soldByProduct))
                .toList();
    }

    public AdminProductOptionsResponse getOptions() {
        List<AdminProductOptionsResponse.CategoryOption> categories = categoryRepository.findAll().stream()
                .sorted(Comparator.comparing(Category::getName))
                .map(category -> new AdminProductOptionsResponse.CategoryOption(
                        category.getId(),
                        category.getName()
                ))
                .toList();
        List<Long> organizationIds = userRepository.findAll().stream()
                .map(user -> user.getOrganizationId())
                .filter(organizationId -> organizationId != null)
                .distinct()
                .sorted()
                .toList();
        return new AdminProductOptionsResponse(categories, organizationIds);
    }

    @Transactional
    public void updateProduct(Long productId, AdminProductUpdateRequest request) {
        ProductItem item = productItemRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        Category category = resolveCategory(request.getCategoryId());
        validateOrganization(request.getOrganizationId());

        item.setProductName(request.getProductName().trim());
        item.setSerialNumber(request.getSerialNumber() == null ? null : request.getSerialNumber().trim());
        item.setCategories(new LinkedHashSet<>(Set.of(category)));
        item.setUnitType(request.getUnitType().trim());
        setStockQuantity(item, request.getStockQuantity());
        if (request.getImageData() != null && !request.getImageData().isBlank()) {
            validateImageData(request.getImageData());
            item.setImages(request.getImageData().trim());
        }
        productItemRepository.save(item);
        updateOrganizationPrice(
                productId, request.getOrganizationId(), request.getNormalPrice(), request.getBoxPrice());
    }

    @Transactional
    public void createProduct(AdminProductUpdateRequest request) {
        Category category = resolveCategory(request.getCategoryId());
        validateOrganization(request.getOrganizationId());
        if (request.getImageData() != null && !request.getImageData().isBlank()) {
            validateImageData(request.getImageData());
        }

        ProductItem item = ProductItem.builder()
                .productName(request.getProductName().trim())
                .itemStatus(request.getStockQuantity() == 0 ? "SOLD" : "AVAILABLE")
                .serialNumber(request.getSerialNumber() == null || request.getSerialNumber().isBlank()
                        ? null
                        : request.getSerialNumber().trim())
                .categories(new LinkedHashSet<>(Set.of(category)))
                .unitType(request.getUnitType().trim())
                .images(request.getImageData() == null || request.getImageData().isBlank()
                        ? null
                        : request.getImageData().trim())
                .build();
        setStockQuantity(item, request.getStockQuantity());
        ProductItem savedItem = productItemRepository.save(item);
        updateOrganizationPrice(
                savedItem.getProductId(), request.getOrganizationId(),
                request.getNormalPrice(), request.getBoxPrice());
    }

    private Category resolveCategory(Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category not found"));
    }

    private void validateOrganization(Long organizationId) {
        if (!userRepository.existsByOrganizationId(organizationId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Organization not found");
        }
    }

    @Transactional
    public void updateStock(Long productId, int stockQuantity) {
        ProductItem item = productItemRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        setStockQuantity(item, stockQuantity);
        productItemRepository.save(item);
    }

    private void setStockQuantity(ProductItem item, int stockQuantity) {
        item.setStockQuantity(stockQuantity);
        if (stockQuantity == 0) {
            item.setItemStatus("SOLD");
        } else if ("SOLD".equalsIgnoreCase(item.getItemStatus())) {
            item.setItemStatus("AVAILABLE");
        }
    }

    private void updateOrganizationPrice(
            Long productId, Long organizationId, BigDecimal price, BigDecimal boxPrice) {
        LocalDateTime now = LocalDateTime.now();
        List<ProductPrice> currentPrices = productPriceRepository
                .findCurrentPrices(productId, organizationId, now);
        if (!currentPrices.isEmpty()) {
            ProductPrice current = currentPrices.get(0);
            current.setPrice(price);
            current.setBoxPrice(boxPrice);
            productPriceRepository.save(current);
            return;
        }

        productPriceRepository.save(ProductPrice.builder()
                .productId(productId)
                .organizationId(organizationId)
                .price(price)
                .boxPrice(boxPrice)
                .effectiveFrom(now)
                .status(PriceStatus.ACTIVE)
                .note("Updated from admin product summary")
                .build());
    }

    private void validateImageData(String imageData) {
        boolean validDataUrl = imageData.matches(
                "^data:image/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$");
        boolean validHttpUrl = imageData.matches("^https?://\\S+$");
        if (imageData.length() > 1_500_000 || (!validDataUrl && !validHttpUrl)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or oversized image");
        }
    }

    private AdminProductSummaryResponse toSummary(
            ProductItem item,
            Map<Long, Map<Long, ProductPrice>> pricesByProduct,
            Map<Long, Long> soldByProduct) {
        String image = item.getImages() == null
                ? null
                : item.getImages().split(",")[0].trim();
        String category = item.getCategories() == null
                ? null
                : item.getCategories().stream()
                        .min(Comparator.comparing(categoryItem -> categoryItem.getId()))
                        .map(categoryItem -> categoryItem.getName())
                        .orElse(null);
        Map<Long, ProductPrice> productPrices = pricesByProduct.getOrDefault(item.getProductId(), Map.of());
        ProductPrice price = productPrices.get(DEFAULT_ORGANIZATION_ID);
        Map<Long, java.math.BigDecimal> organizationPrices = productPrices.entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, entry -> entry.getValue().getPrice()));
        Map<Long, java.math.BigDecimal> organizationBoxPrices = productPrices.entrySet().stream()
                .filter(entry -> entry.getValue().getBoxPrice() != null)
                .collect(Collectors.toMap(Map.Entry::getKey, entry -> entry.getValue().getBoxPrice()));
        long remainingStock = "AVAILABLE".equalsIgnoreCase(item.getItemStatus()) ? 1 : 0;

        return new AdminProductSummaryResponse(
                item.getProductId(),
                item.getProductName(),
                item.getSerialNumber(),
                image,
                category,
                price == null ? null : price.getPrice(),
                price == null ? null : price.getBoxPrice(),
                organizationPrices,
                organizationBoxPrices,
                item.getUnitType(),
                soldByProduct.getOrDefault(item.getProductId(), 0L),
                item.getStockQuantity() == null ? remainingStock : item.getStockQuantity()
        );
    }

    private boolean isActive(ProductPrice price, LocalDateTime now) {
        return price.getProductId() != null
                && price.getOrganizationId() != null
                && price.getStatus() == PriceStatus.ACTIVE
                && price.getEffectiveFrom() != null
                && !price.getEffectiveFrom().isAfter(now)
                && (price.getEffectiveTo() == null || !price.getEffectiveTo().isBefore(now));
    }
}
