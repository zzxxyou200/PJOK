package com.example.demo.service;

import com.example.demo.dto.OrganizationSummaryResponse;
import com.example.demo.entity.PriceStatus;
import com.example.demo.entity.ProductPrice;
import com.example.demo.entity.PurchaseHistory;
import com.example.demo.entity.User;
import com.example.demo.repository.ProductPriceRepository;
import com.example.demo.repository.PurchaseHistoryRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminOrganizationService {

    private final UserRepository userRepository;
    private final PurchaseHistoryRepository purchaseHistoryRepository;
    private final ProductPriceRepository productPriceRepository;

    @Transactional(readOnly = true)
    public List<OrganizationSummaryResponse> getSummaries() {
        List<User> users = userRepository.findAll();
        Map<String, User> usersById = users.stream()
                .collect(Collectors.toMap(user -> String.valueOf(user.getId()), user -> user));
        Map<Long, List<User>> usersByOrganization = users.stream()
                .filter(user -> user.getOrganizationId() != null)
                .collect(Collectors.groupingBy(
                        User::getOrganizationId,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        Map<Long, List<PurchaseHistory>> purchasesByOrganization = new LinkedHashMap<>();
        for (PurchaseHistory purchase : purchaseHistoryRepository.findAllByOrderByPurchaseDateDesc()) {
            User user = usersById.get(purchase.getUserId());
            if (user != null && user.getOrganizationId() != null) {
                purchasesByOrganization
                        .computeIfAbsent(user.getOrganizationId(), ignored -> new ArrayList<>())
                        .add(purchase);
            }
        }

        Set<Long> organizationIds = new LinkedHashSet<>(usersByOrganization.keySet());
        organizationIds.addAll(purchasesByOrganization.keySet());

        LocalDateTime now = LocalDateTime.now();
        return organizationIds.stream()
                .sorted(Comparator.naturalOrder())
                .map(organizationId -> summarize(
                        organizationId,
                        usersByOrganization.getOrDefault(organizationId, List.of()),
                        purchasesByOrganization.getOrDefault(organizationId, List.of()),
                        now
                ))
                .toList();
    }

    private OrganizationSummaryResponse summarize(
            Long organizationId,
            List<User> users,
            List<PurchaseHistory> purchases,
            LocalDateTime now) {
        Set<String> orderIds = purchases.stream()
                .map(PurchaseHistory::getCheckoutId)
                .collect(Collectors.toSet());
        BigDecimal orderTotal = sum(purchases, false);
        BigDecimal paidTotal = sum(purchases, true);
        BigDecimal outstandingTotal = orderTotal.subtract(paidTotal).max(BigDecimal.ZERO);

        String contactName = users.stream()
                .filter(user -> !"ROLE_ADMIN".equals(user.getRole()))
                .map(User::getUsername)
                .filter(name -> name != null && !name.isBlank())
                .distinct()
                .collect(Collectors.joining(", "));
        if (contactName.isBlank()) {
            contactName = "ไม่ระบุ";
        }

        int customPricedProducts = (int) productPriceRepository.findByOrganizationId(organizationId).stream()
                .filter(price -> isActive(price, now))
                .map(ProductPrice::getProductId)
                .distinct()
                .count();

        return new OrganizationSummaryResponse(
                organizationId,
                "หน่วยงาน #" + organizationId,
                contactName,
                "ไม่ระบุ",
                orderIds.size(),
                orderTotal,
                paidTotal,
                outstandingTotal,
                customPricedProducts
        );
    }

    private BigDecimal sum(List<PurchaseHistory> purchases, boolean paidOnly) {
        return purchases.stream()
                .filter(purchase -> !paidOnly || purchase.getPaymentStatus() == com.example.demo.entity.PaymentStatus.PAID)
                .map(PurchaseHistory::getTotal)
                .filter(total -> total != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private boolean isActive(ProductPrice price, LocalDateTime now) {
        return price.getStatus() == PriceStatus.ACTIVE
                && price.getEffectiveFrom() != null
                && !price.getEffectiveFrom().isAfter(now)
                && (price.getEffectiveTo() == null || !price.getEffectiveTo().isBefore(now));
    }
}
