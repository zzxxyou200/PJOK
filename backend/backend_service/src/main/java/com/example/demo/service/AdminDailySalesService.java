package com.example.demo.service;

import com.example.demo.dto.AdminDailySalesResponse;
import com.example.demo.entity.PurchaseHistory;
import com.example.demo.repository.PurchaseHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.TreeMap;

@Service
@RequiredArgsConstructor
public class AdminDailySalesService {

    private final PurchaseHistoryRepository purchaseHistoryRepository;

    @Transactional(readOnly = true)
    public List<AdminDailySalesResponse> getDailySales() {
        TreeMap<LocalDate, DailyTotals> totalsByDate = new TreeMap<>();
        for (PurchaseHistory purchase : purchaseHistoryRepository.findAllByOrderByPurchaseDateDesc()) {
            if (purchase.getPurchaseDate() == null) {
                continue;
            }
            DailyTotals totals = totalsByDate.computeIfAbsent(
                    purchase.getPurchaseDate().toLocalDate(),
                    ignored -> new DailyTotals()
            );
            totals.quantity += purchase.getAmount() == null ? 0 : purchase.getAmount();
            if (purchase.getTotal() != null) {
                totals.total = totals.total.add(purchase.getTotal());
            }
        }

        return totalsByDate.descendingMap().entrySet().stream()
                .map(entry -> new AdminDailySalesResponse(
                        entry.getKey(),
                        entry.getValue().quantity,
                        entry.getValue().total
                ))
                .toList();
    }

    private static class DailyTotals {
        private long quantity;
        private BigDecimal total = BigDecimal.ZERO;
    }
}
