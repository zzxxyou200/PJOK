package com.example.demo.dto;

import java.math.BigDecimal;

public record OrganizationSummaryResponse(
        Long organizationId,
        String organizationName,
        String contactName,
        String contactPhone,
        long orderCount,
        BigDecimal orderTotal,
        BigDecimal paidTotal,
        BigDecimal outstandingTotal,
        int customPricedProductCount
) {
}
