package com.example.demo.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CartAmountRequest {

    @NotNull(message = "amount is required")
    @Min(value = 1, message = "amount must be at least 1")
    private Integer amount;
}