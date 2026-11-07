package com.example.demo.dto;

import java.math.BigDecimal;
import java.util.Map;

public record AdminProductSummaryResponse(
        Long productId,
        String productName,
        String serialNumber,
        String image,
        String category,
        BigDecimal normalPrice,
        BigDecimal normalBoxPrice,
        Map<Long, BigDecimal> organizationPrices,
        Map<Long, BigDecimal> organizationBoxPrices,
        String unitType,
        long totalSold,
        long remainingStock
) {
}
