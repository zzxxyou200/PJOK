package com.example.demo.service;

import com.example.demo.dto.CartAmountRequest;
import com.example.demo.dto.CartItemRequest;
import com.example.demo.dto.CartResponse;
import com.example.demo.entity.Cart;
import com.example.demo.entity.ProductItem;
import com.example.demo.entity.ProductPrice;
import com.example.demo.entity.User;
import com.example.demo.repository.CartRepository;
import com.example.demo.repository.ProductItemRepository;
import com.example.demo.repository.ProductPriceRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CartService {

    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String DEFAULT_UNIT = "UNIT";

    private static String normalizeUnitType(String unitType) {
        if (unitType == null || unitType.isBlank()) {
            return DEFAULT_UNIT;
        }
        return unitType.trim().toUpperCase();
    }

    private final CartRepository cartRepository;
    private final ProductItemRepository productItemRepository;
    private final ProductPriceRepository productPriceRepository;
    private final UserRepository userRepository;

    private User resolveUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    @Transactional(readOnly = true)
    public List<CartResponse> getCart(String username) {
        User user = resolveUser(username);
        List<Cart> carts = cartRepository
                .findByUserIdAndStatusOrderByCreateDtAsc(String.valueOf(user.getId()), STATUS_ACTIVE);
        return toResponseList(carts);
    }

    public CartResponse addItem(String username, CartItemRequest request) {
        User user = resolveUser(username);

        ProductItem item = productItemRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        ProductPrice productPrice = productPriceRepository
                .findCurrentPrices(request.getProductId(), user.getOrganizationId(), LocalDateTime.now())
                .stream()
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No price available for this product"));

        String userId = String.valueOf(user.getId());
        String productId = String.valueOf(request.getProductId());
        String unitType = normalizeUnitType(request.getUnitType());
        int amount = request.getAmount() == null || request.getAmount() < 1 ? 1 : request.getAmount();
        BigDecimal price = "BOX".equals(unitType) ? productPrice.getBoxPrice() : productPrice.getPrice();
        if (price == null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "No price available for the selected unit type");
        }

        List<Cart> activeCarts = cartRepository
                .findByUserIdAndStatusOrderByCreateDtAsc(userId, STATUS_ACTIVE);
        List<Cart> matchingCarts = activeCarts.stream()
                .filter(existing -> productId.equals(existing.getProductId()))
                .filter(existing -> unitType.equals(normalizeUnitType(existing.getUnitType())))
                .toList();
        Cart cart = matchingCarts.isEmpty() ? null : matchingCarts.get(0);

        long cartedQuantity = activeCarts.stream()
                .filter(existing -> productId.equals(existing.getProductId()))
                .mapToLong(existing -> ProductQuantity.toStockUnits(
                        existing.getAmount() == null ? 0 : existing.getAmount(),
                        existing.getUnitType()))
                .sum();
        int availableStock = item.getStockQuantity() == null ? 1 : item.getStockQuantity();
        long requestedStockUnits = ProductQuantity.toStockUnits(amount, unitType);
        if (requestedStockUnits > availableStock - cartedQuantity) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Requested quantity exceeds available stock");
        }

        if (cart == null) {
            cart = Cart.builder()
                    .id(UUID.randomUUID().toString())
                    .productId(productId)
                    .userId(userId)
                    .price(price.doubleValue())
                    .createDt(LocalDate.now())
                    .updateDt(LocalDate.now())
                    .createBy(username)
                    .updateBy(username)
                    .amount(amount)
                    .status(STATUS_ACTIVE)
                    .unitType(unitType)
                    .build();
        } else {
            int existingQuantity = matchingCarts.stream()
                    .mapToInt(existing -> existing.getAmount() == null ? 0 : existing.getAmount())
                    .sum();
            cart.setAmount(existingQuantity + amount);
            cart.setPrice(price.doubleValue());
            cart.setUnitType(unitType);
            cart.setUpdateDt(LocalDate.now());
            cart.setUpdateBy(username);
            if (matchingCarts.size() > 1) {
                cartRepository.deleteAll(matchingCarts.subList(1, matchingCarts.size()));
            }
        }

        cart = cartRepository.saveAndFlush(cart);
        return toResponse(cart, item);
    }

    public CartResponse updateAmount(String username, String cartId, CartAmountRequest request) {
        User user = resolveUser(username);
        Cart cart = findActiveCartForUser(cartId, user);

        if (request.getAmount() == null || request.getAmount() < 1) {
            cartRepository.delete(cart);
            cartRepository.flush();
            return null;
        }

        ProductItem item = productItemRepository.findById(Long.valueOf(cart.getProductId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        String cartProductId = cart.getProductId();
        long otherCartQuantity = cartRepository
                .findByUserIdAndStatusOrderByCreateDtAsc(String.valueOf(user.getId()), STATUS_ACTIVE)
                .stream()
                .filter(existing -> !cartId.equals(existing.getId()))
                .filter(existing -> cartProductId.equals(existing.getProductId()))
                .mapToLong(existing -> ProductQuantity.toStockUnits(
                        existing.getAmount() == null ? 0 : existing.getAmount(),
                        existing.getUnitType()))
                .sum();
        int availableStock = item.getStockQuantity() == null ? 1 : item.getStockQuantity();
        long requestedStockUnits = ProductQuantity.toStockUnits(request.getAmount(), cart.getUnitType());
        if (requestedStockUnits > availableStock - otherCartQuantity) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Requested quantity exceeds available stock");
        }

        cart.setAmount(request.getAmount());
        cart.setUpdateDt(LocalDate.now());
        cart.setUpdateBy(username);
        cart = cartRepository.saveAndFlush(cart);
        return toResponse(cart, item);
    }

    public void removeItem(String username, String cartId) {
        User user = resolveUser(username);
        Cart cart = findActiveCartForUser(cartId, user);
        cartRepository.delete(cart);
        cartRepository.flush();
    }

    public void clearCart(String username) {
        User user = resolveUser(username);
        List<Cart> carts = cartRepository
                .findByUserIdAndStatusOrderByCreateDtAsc(String.valueOf(user.getId()), STATUS_ACTIVE);
        cartRepository.deleteAll(carts);
        cartRepository.flush();
    }

    private Cart findActiveCartForUser(String cartId, User user) {
        return cartRepository.findById(cartId)
                .filter(cart -> cart.getUserId().equals(String.valueOf(user.getId())))
                .filter(cart -> STATUS_ACTIVE.equals(cart.getStatus()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Cart item not found: " + cartId));
    }

    private List<CartResponse> toResponseList(List<Cart> carts) {
        Set<Long> productIds = carts.stream()
                .map(cart -> Long.valueOf(cart.getProductId()))
                .collect(Collectors.toSet());

        Map<Long, ProductItem> itemsMap = productItemRepository.findAllById(productIds).stream()
                .collect(Collectors.toMap(ProductItem::getProductId, Function.identity()));

        return carts.stream()
                .map(cart -> toResponse(cart, itemsMap.get(Long.valueOf(cart.getProductId()))))
                .toList();
    }

    private CartResponse toResponse(Cart cart, ProductItem item) {
        String image = null;
        if (item != null && item.getImages() != null) {
            image = item.getImages().split(",")[0].trim();
        }
        return CartResponse.builder()
                .id(cart.getId())
                .productId(cart.getProductId() == null ? null : Long.valueOf(cart.getProductId()))
                .productName(item == null ? null : item.getProductName())
                .serialNumber(item == null ? null : item.getSerialNumber())
                .image(image)
                .price(cart.getPrice() == null ? null : BigDecimal.valueOf(cart.getPrice()))
                .amount(cart.getAmount())
                .unitType(cart.getUnitType())
                .stockQuantity(item == null || item.getStockQuantity() == null
                        ? (item != null && "AVAILABLE".equalsIgnoreCase(item.getItemStatus()) ? 1 : 0)
                        : item.getStockQuantity())
                .status(cart.getStatus())
                .build();
    }
}