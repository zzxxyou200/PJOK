package com.example.demo.controller;

import com.example.demo.dto.CheckoutRequest;
import com.example.demo.dto.PurchaseHistoryResponse;
import com.example.demo.service.PurchaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/purchase-history")
@RequiredArgsConstructor
public class PurchaseHistoryController {

    private final PurchaseService purchaseService;

    @GetMapping
    public List<PurchaseHistoryResponse> getHistory(Authentication authentication) {
        return purchaseService.getHistory(authentication.getName());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public List<PurchaseHistoryResponse> checkout(@Valid @RequestBody CheckoutRequest request,
                                                  Authentication authentication) {
        return purchaseService.checkout(authentication.getName(), request.getCartItemIds());
    }
}