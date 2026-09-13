package com.example.demo.controller;

import com.example.demo.dto.ProductResponse;
import com.example.demo.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public List<ProductResponse> getProducts(Authentication authentication) {
        return productService.getProductsForUser(authentication.getName());
    }

    @GetMapping("/priced")
    public List<ProductResponse> getPricedProducts(
            @RequestParam(required = false) String category,
            Authentication authentication) {
        return productService.getPricedProductsForUser(authentication.getName(), category);
    }

    @GetMapping("/{productId}")
    public ProductResponse getProductDetail(@PathVariable Long productId, Authentication authentication) {
        return productService.getProductDetail(productId, authentication.getName());
    }
}