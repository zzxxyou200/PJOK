package com.example.demo.controller;

import com.example.demo.dto.AdminOrderResponse;
import com.example.demo.dto.OrderStatusUpdateRequest;
import com.example.demo.service.AdminOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    private final AdminOrderService adminOrderService;

    @GetMapping
    public List<AdminOrderResponse> getOrders() {
        return adminOrderService.getOrders();
    }

    @PatchMapping("/{checkoutId}/status")
    public AdminOrderResponse updateStatus(@PathVariable String checkoutId,
                                           @Valid @RequestBody OrderStatusUpdateRequest request) {
        return adminOrderService.updateStatus(checkoutId, request);
    }
}
