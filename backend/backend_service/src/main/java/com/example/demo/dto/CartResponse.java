package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class CartResponse {
    private String id;
    private Long productId;
    private String productName;
    private String serialNumber;
    private String image;
    private BigDecimal price;
    private Integer amount;
    private String unitType;
    private String status;
}