package com.example.demo.service;

import com.example.demo.entity.PurchaseHistory;
import com.example.demo.repository.PurchaseHistoryRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AdminDailySalesServiceTest {

    @Test
    void groupsItemQuantitiesAndTotalsByPurchaseDateNewestFirst() {
        PurchaseHistoryRepository repository = mock(PurchaseHistoryRepository.class);
        when(repository.findAllByOrderByPurchaseDateDesc()).thenReturn(List.of(
                purchase(2026, 11, 7, 3, "150.00"),
                purchase(2026, 11, 7, 2, "50.00"),
                purchase(2026, 11, 6, 1, "25.00")
        ));

        var summaries = new AdminDailySalesService(repository).getDailySales();

        assertThat(summaries).hasSize(2);
        assertThat(summaries.get(0).date()).hasToString("2026-11-07");
        assertThat(summaries.get(0).quantity()).isEqualTo(5);
        assertThat(summaries.get(0).total()).isEqualByComparingTo("200.00");
        assertThat(summaries.get(1).date()).hasToString("2026-11-06");
        assertThat(summaries.get(1).quantity()).isEqualTo(1);
        assertThat(summaries.get(1).total()).isEqualByComparingTo("25.00");
    }

    @Test
    void ignoresRecordsWithoutPurchaseDate() {
        PurchaseHistoryRepository repository = mock(PurchaseHistoryRepository.class);
        when(repository.findAllByOrderByPurchaseDateDesc()).thenReturn(List.of(
                PurchaseHistory.builder().amount(1).total(new BigDecimal("10.00")).build()
        ));

        assertThat(new AdminDailySalesService(repository).getDailySales()).isEmpty();
    }

    private PurchaseHistory purchase(int year, int month, int day, int amount, String total) {
        return PurchaseHistory.builder()
                .purchaseDate(LocalDateTime.of(year, month, day, 9, 0))
                .amount(amount)
                .total(new BigDecimal(total))
                .build();
    }
}
