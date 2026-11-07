package com.example.demo.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AdminDailySalesResponse(
        LocalDate date,
        long quantity,
        BigDecimal total
) {
}
