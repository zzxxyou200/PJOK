package com.example.demo.controller;

import com.example.demo.dto.AdminProductSummaryResponse;
import com.example.demo.dto.AdminProductOptionsResponse;
import com.example.demo.dto.AdminProductUpdateRequest;
import com.example.demo.dto.AdminStockUpdateRequest;
import com.example.demo.service.AdminProductSummaryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminProductSummaryController {

    private final AdminProductSummaryService adminProductSummaryService;

    @GetMapping("/summary")
    public List<AdminProductSummaryResponse> getProductSummary() {
        return adminProductSummaryService.getProductSummary();
    }

    @GetMapping("/options")
    public AdminProductOptionsResponse getOptions() {
        return adminProductSummaryService.getOptions();
    }

    @PostMapping
    public void createProduct(@Valid @RequestBody AdminProductUpdateRequest request) {
        adminProductSummaryService.createProduct(request);
    }

    @PutMapping("/{productId}")
    public void updateProduct(@PathVariable Long productId,
                              @Valid @RequestBody AdminProductUpdateRequest request) {
        adminProductSummaryService.updateProduct(productId, request);
    }

    @PatchMapping("/{productId}/stock")
    public void updateStock(@PathVariable Long productId,
                            @Valid @RequestBody AdminStockUpdateRequest request) {
        adminProductSummaryService.updateStock(productId, request.getStockQuantity());
    }
}
