package com.example.demo.service;

import com.example.demo.dto.ProductResponse;
import com.example.demo.entity.PriceStatus;
import com.example.demo.entity.ProductItem;
import com.example.demo.entity.ProductPrice;
import com.example.demo.entity.User;
import com.example.demo.repository.ProductItemRepository;
import com.example.demo.repository.ProductPriceRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductItemRepository productItemRepository;
    private final ProductPriceRepository productPriceRepository;
    private final UserRepository userRepository;

    public List<ProductResponse> getProductsForUser(String username) {
        Long organizationId = userRepository.findByUsername(username)
                .map(User::getOrganizationId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        List<ProductItem> items = productItemRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        return items.stream()
                .map(item -> toResponse(item, organizationId, now))
                .toList();
    }

    private ProductResponse toResponse(ProductItem item, Long organizationId, LocalDateTime now) {
        BigDecimal price = null;

        if (organizationId != null) {
            price = productPriceRepository
                    .findCurrentPrices(item.getProductId(), organizationId, PriceStatus.ACTIVE, now)
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
                .warrantyStartDate(item.getWarrantyStartDate())
                .warrantyEndDate(item.getWarrantyEndDate())
                .note(item.getNote())
                .price(price)
                .organizationId(organizationId)
                .build();
    }
}