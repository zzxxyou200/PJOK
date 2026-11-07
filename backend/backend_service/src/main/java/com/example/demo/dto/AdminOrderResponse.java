package com.example.demo.dto;

import com.example.demo.entity.DeliveryStatus;
import com.example.demo.entity.PaymentStatus;

import java.math.BigDecimal;
import java.util.List;

public record AdminOrderResponse(
        String orderNumber,
        String checkoutId,
        String organization,
        List<AdminOrderItemResponse> items,
        BigDecimal total,
        DeliveryStatus deliveryStatus,
        PaymentStatus paymentStatus
) {
}
