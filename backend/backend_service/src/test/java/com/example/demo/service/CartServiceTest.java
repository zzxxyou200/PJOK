package com.example.demo.service;

import com.example.demo.dto.CartItemRequest;
import com.example.demo.entity.Cart;
import com.example.demo.entity.PriceStatus;
import com.example.demo.entity.ProductItem;
import com.example.demo.entity.ProductPrice;
import com.example.demo.entity.User;
import com.example.demo.repository.CartRepository;
import com.example.demo.repository.ProductItemRepository;
import com.example.demo.repository.ProductPriceRepository;
import com.example.demo.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CartServiceTest {

    @Test
    void usesBoxPriceAndKeepsUnitCartSeparate() {
        CartRepository cartRepository = mock(CartRepository.class);
        ProductItemRepository itemRepository = mock(ProductItemRepository.class);
        ProductPriceRepository priceRepository = mock(ProductPriceRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        User user = User.builder().id(9L).username("buyer").organizationId(2L).build();
        ProductItem item = ProductItem.builder()
                .productId(4L)
                .productName("Paper")
                .itemStatus("AVAILABLE")
                .stockQuantity(24)
                .build();
        ProductPrice prices = ProductPrice.builder()
                .productId(4L)
                .organizationId(2L)
                .price(new BigDecimal("10.00"))
                .boxPrice(new BigDecimal("99.00"))
                .status(PriceStatus.ACTIVE)
                .build();
        Cart existingUnitCart = Cart.builder()
                .id("existing")
                .productId("4")
                .userId("9")
                .amount(3)
                .status("ACTIVE")
                .unitType("UNIT")
                .build();
        when(userRepository.findByUsername("buyer")).thenReturn(Optional.of(user));
        when(itemRepository.findById(4L)).thenReturn(Optional.of(item));
        when(priceRepository.findCurrentPrices(any(), any(), any())).thenReturn(List.of(prices));
        when(cartRepository.findByUserIdAndStatusOrderByCreateDtAsc("9", "ACTIVE"))
                .thenReturn(List.of(existingUnitCart));
        when(cartRepository.saveAndFlush(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CartItemRequest request = new CartItemRequest();
        request.setProductId(4L);
        request.setAmount(1);
        request.setUnitType("BOX");

        var result = new CartService(
                cartRepository, itemRepository, priceRepository, userRepository
        ).addItem("buyer", request);

        assertThat(result.getPrice()).isEqualByComparingTo("99.00");
        assertThat(result.getAmount()).isEqualTo(1);
        assertThat(result.getUnitType()).isEqualTo("BOX");
    }

    @Test
    void mergesLegacyNullUnitCartWhenAddingSameProduct() {
        CartRepository cartRepository = mock(CartRepository.class);
        ProductItemRepository itemRepository = mock(ProductItemRepository.class);
        ProductPriceRepository priceRepository = mock(ProductPriceRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        User user = User.builder().id(9L).username("buyer").organizationId(2L).build();
        ProductItem item = ProductItem.builder()
                .productId(4L)
                .productName("Paper")
                .itemStatus("AVAILABLE")
                .stockQuantity(10)
                .build();
        ProductPrice prices = ProductPrice.builder()
                .productId(4L)
                .organizationId(2L)
                .price(new BigDecimal("10.00"))
                .boxPrice(new BigDecimal("99.00"))
                .status(PriceStatus.ACTIVE)
                .build();
        Cart legacyCart = Cart.builder()
                .id("legacy")
                .productId("4")
                .userId("9")
                .amount(2)
                .status("ACTIVE")
                .build();
        when(userRepository.findByUsername("buyer")).thenReturn(Optional.of(user));
        when(itemRepository.findById(4L)).thenReturn(Optional.of(item));
        when(priceRepository.findCurrentPrices(any(), any(), any())).thenReturn(List.of(prices));
        when(cartRepository.findByUserIdAndStatusOrderByCreateDtAsc("9", "ACTIVE"))
                .thenReturn(List.of(legacyCart));
        when(cartRepository.saveAndFlush(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CartItemRequest request = new CartItemRequest();
        request.setProductId(4L);
        request.setAmount(1);
        request.setUnitType("UNIT");

        var result = new CartService(
                cartRepository, itemRepository, priceRepository, userRepository
        ).addItem("buyer", request);

        assertThat(result.getId()).isEqualTo("legacy");
        assertThat(result.getAmount()).isEqualTo(3);
        assertThat(result.getUnitType()).isEqualTo("UNIT");
    }
}
