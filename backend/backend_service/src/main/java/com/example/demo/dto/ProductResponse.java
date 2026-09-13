package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class ProductResponse {
    private Long productId;
    private String productName;
    private String serialNumber;
    private String conditionStatus;
    private String itemStatus;
    private String category;
    private List<String> categories;
    private LocalDate warrantyStartDate;
    private LocalDate warrantyEndDate;
    private String note;
    private String images;
    private BigDecimal price;
    private Long totalSold;
    private Long organizationId;
}