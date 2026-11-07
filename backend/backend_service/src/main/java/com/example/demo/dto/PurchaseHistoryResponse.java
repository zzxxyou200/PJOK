package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class PurchaseHistoryResponse {
    private Long id;
    private String checkoutId;
    private Long productId;
    private String productName;
    private String serialNumber;
    private String image;
    private BigDecimal price;
    private Integer amount;
    private String unitType;
    private BigDecimal total;
    private LocalDateTime purchaseDate;
}