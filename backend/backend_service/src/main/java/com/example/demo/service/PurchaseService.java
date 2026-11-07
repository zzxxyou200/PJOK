package com.example.demo.service;

import com.example.demo.dto.PurchaseHistoryResponse;
import com.example.demo.entity.Cart;
import com.example.demo.entity.ProductItem;
import com.example.demo.entity.PurchaseHistory;
import com.example.demo.entity.User;
import com.example.demo.repository.CartRepository;
import com.example.demo.repository.ProductItemRepository;
import com.example.demo.repository.PurchaseHistoryRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PurchaseService {

    private static final String STATUS_ACTIVE = "ACTIVE";

    private final CartRepository cartRepository;
    private final ProductItemRepository productItemRepository;
    private final PurchaseHistoryRepository purchaseHistoryRepository;
    private final UserRepository userRepository;

    private User resolveUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    public List<PurchaseHistoryResponse> checkout(String username, List<String> cartItemIds) {
        User user = resolveUser(username);
        String userId = String.valueOf(user.getId());

        Set<String> requestedIds = cartItemIds == null ? Set.of() : new HashSet<>(cartItemIds);

        List<Cart> toBuy = cartRepository
                .findByUserIdAndStatusOrderByCreateDtAsc(userId, STATUS_ACTIVE)
                .stream()
                .filter(cart -> requestedIds.contains(cart.getId()))
                .toList();

        if (toBuy.isEmpty()) {
            return List.of();
        }

        Set<Long> productIds = toBuy.stream()
                .map(cart -> Long.valueOf(cart.getProductId()))
                .collect(Collectors.toSet());
        Map<Long, ProductItem> itemsMap = loadItems(productIds);
        Map<Long, Long> requestedQuantities = toBuy.stream()
                .collect(Collectors.groupingBy(
                        cart -> Long.valueOf(cart.getProductId()),
                        Collectors.summingLong(cart -> ProductQuantity.toStockUnits(
                                cart.getAmount() == null ? 0 : cart.getAmount(),
                                cart.getUnitType()))
                ));
        requestedQuantities.forEach((productId, quantity) -> {
            ProductItem item = itemsMap.get(productId);
            int availableStock = item == null || item.getStockQuantity() == null ? 1 : item.getStockQuantity();
            if (quantity > availableStock) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.CONFLICT,
                        "Requested quantity exceeds available stock for product " + productId
                );
            }
        });
        requestedQuantities.forEach((productId, quantity) -> {
            ProductItem item = itemsMap.get(productId);
            if (item != null) {
                int remainingStock = Math.toIntExact(
                        (item.getStockQuantity() == null ? 1 : item.getStockQuantity()) - quantity);
                item.setStockQuantity(remainingStock);
                if (remainingStock == 0) {
                    item.setItemStatus("SOLD");
                }
            }
        });
        productItemRepository.saveAll(itemsMap.values());

        String checkoutId = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();

        List<PurchaseHistory> records = toBuy.stream()
                .map(cart -> toHistory(cart, checkoutId, userId, itemsMap.get(Long.valueOf(cart.getProductId())), now))
                .toList();

        List<PurchaseHistory> saved = purchaseHistoryRepository.saveAll(records);
        cartRepository.deleteAll(toBuy);
        cartRepository.flush();

        return saved.stream()
                .map(history -> toResponse(history, itemsMap.get(history.getProductId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PurchaseHistoryResponse> getHistory(String username) {
        User user = resolveUser(username);
        List<PurchaseHistory> records = purchaseHistoryRepository
                .findByUserIdOrderByPurchaseDateDesc(String.valueOf(user.getId()));

        Set<Long> productIds = records.stream()
                .map(PurchaseHistory::getProductId)
                .collect(Collectors.toSet());
        Map<Long, ProductItem> itemsMap = loadItems(productIds);

        return records.stream()
                .map(history -> toResponse(history, itemsMap.get(history.getProductId())))
                .toList();
    }

    private Map<Long, ProductItem> loadItems(Set<Long> productIds) {
        if (productIds.isEmpty()) {
            return Map.of();
        }
        return productItemRepository.findAllById(productIds).stream()
                .collect(Collectors.toMap(ProductItem::getProductId, Function.identity()));
    }

    private PurchaseHistory toHistory(Cart cart, String checkoutId, String userId, ProductItem item,
                                      LocalDateTime now) {
        BigDecimal price = cart.getPrice() == null ? null : BigDecimal.valueOf(cart.getPrice());
        BigDecimal total = price == null ? null : price.multiply(BigDecimal.valueOf(cart.getAmount()));

        return PurchaseHistory.builder()
                .checkoutId(checkoutId)
                .userId(userId)
                .productId(Long.valueOf(cart.getProductId()))
                .productName(item == null ? null : item.getProductName())
                .serialNumber(item == null ? null : item.getSerialNumber())
                .price(price)
                .amount(cart.getAmount())
                .unitType(cart.getUnitType())
                .total(total)
                .purchaseDate(now)
                .build();
    }

    private PurchaseHistoryResponse toResponse(PurchaseHistory history, ProductItem item) {
        String image = null;
        if (item != null && item.getImages() != null) {
            image = item.getImages().split(",")[0].trim();
        }
        return PurchaseHistoryResponse.builder()
                .id(history.getId())
                .checkoutId(history.getCheckoutId())
                .productId(history.getProductId())
                .productName(history.getProductName())
                .serialNumber(history.getSerialNumber())
                .image(image)
                .price(history.getPrice())
                .amount(history.getAmount())
                .unitType(history.getUnitType())
                .total(history.getTotal())
                .purchaseDate(history.getPurchaseDate())
                .build();
    }
}