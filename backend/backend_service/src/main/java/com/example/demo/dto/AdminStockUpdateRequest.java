package com.example.demo.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

@Data
public class AdminStockUpdateRequest {

    @NotNull
    @PositiveOrZero
    private Integer stockQuantity;
}
