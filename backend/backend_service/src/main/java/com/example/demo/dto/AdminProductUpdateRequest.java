package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class AdminProductUpdateRequest {

    @NotBlank
    @Size(max = 255)
    private String productName;

    @Size(max = 255)
    private String serialNumber;

    @NotNull
    private Long categoryId;

    @NotNull
    private Long organizationId;

    @NotNull
    @PositiveOrZero
    private BigDecimal normalPrice;

    @NotNull
    @PositiveOrZero
    private BigDecimal boxPrice;

    @NotBlank
    @Size(max = 50)
    private String unitType;

    @NotNull
    @PositiveOrZero
    private Integer stockQuantity;

    @Size(max = 1500000)
    private String imageData;
}
