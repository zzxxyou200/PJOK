package com.example.demo.dto;

import com.example.demo.entity.DeliveryStatus;
import com.example.demo.entity.PaymentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderStatusUpdateRequest {

    @NotNull
    private DeliveryStatus deliveryStatus;

    @NotNull
    private PaymentStatus paymentStatus;
}
