package com.example.demo.controller;

import com.example.demo.dto.CartAmountRequest;
import com.example.demo.dto.CartItemRequest;
import com.example.demo.dto.CartResponse;
import com.example.demo.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public List<CartResponse> getCart(Authentication authentication) {
        return cartService.getCart(authentication.getName());
    }

    @PostMapping
    @org.springframework.web.bind.annotation.ResponseStatus(HttpStatus.CREATED)
    public CartResponse addItem(@Valid @RequestBody CartItemRequest request,
                                Authentication authentication) {
        return cartService.addItem(authentication.getName(), request);
    }

    @PutMapping("/{cartId}")
    public ResponseEntity<CartResponse> updateAmount(@PathVariable String cartId,
                                                     @Valid @RequestBody CartAmountRequest request,
                                                     Authentication authentication) {
        CartResponse response = cartService.updateAmount(authentication.getName(), cartId, request);
        if (response == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{cartId}")
    public ResponseEntity<Void> removeItem(@PathVariable String cartId,
                                           Authentication authentication) {
        cartService.removeItem(authentication.getName(), cartId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> clearCart(Authentication authentication) {
        cartService.clearCart(authentication.getName());
        return ResponseEntity.noContent().build();
    }
}