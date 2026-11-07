package com.example.demo.service;

import com.example.demo.dto.AdminOrderItemResponse;
import com.example.demo.dto.AdminOrderResponse;
import com.example.demo.dto.OrderStatusUpdateRequest;
import com.example.demo.entity.DeliveryStatus;
import com.example.demo.entity.PaymentStatus;
import com.example.demo.entity.PurchaseHistory;
import com.example.demo.entity.User;
import com.example.demo.repository.PurchaseHistoryRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminOrderService {

    private final PurchaseHistoryRepository purchaseHistoryRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<AdminOrderResponse> getOrders() {
        List<PurchaseHistory> records = purchaseHistoryRepository.findAllByOrderByPurchaseDateDesc();
        Map<String, User> usersById = loadUsers(records);
        Map<String, List<PurchaseHistory>> orders = records.stream()
                .collect(Collectors.groupingBy(
                        PurchaseHistory::getCheckoutId,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        return orders.values().stream()
                .map(items -> toOrderResponse(items, usersById))
                .toList();
    }

    @Transactional
    public AdminOrderResponse updateStatus(String checkoutId, OrderStatusUpdateRequest request) {
        List<PurchaseHistory> records = purchaseHistoryRepository
                .findByCheckoutIdOrderByPurchaseDateAsc(checkoutId);
        if (records.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found");
        }

        DeliveryStatus deliveryStatus = request.getDeliveryStatus();
        PaymentStatus paymentStatus = request.getPaymentStatus();
        records.forEach(record -> {
            record.setDeliveryStatus(deliveryStatus);
            record.setPaymentStatus(paymentStatus);
        });
        List<PurchaseHistory> saved = purchaseHistoryRepository.saveAll(records);
        return toOrderResponse(saved, loadUsers(saved));
    }

    private Map<String, User> loadUsers(List<PurchaseHistory> records) {
        Set<Long> userIds = records.stream()
                .map(PurchaseHistory::getUserId)
                .map(Long::valueOf)
                .collect(Collectors.toSet());
        Map<String, User> usersById = new LinkedHashMap<>();
        userRepository.findAllById(userIds).forEach(user ->
                usersById.put(String.valueOf(user.getId()), user)
        );
        return usersById;
    }

    private AdminOrderResponse toOrderResponse(List<PurchaseHistory> records, Map<String, User> usersById) {
        PurchaseHistory first = records.get(0);
        User user = usersById.get(first.getUserId());
        String organization = user == null || user.getOrganizationId() == null
                ? "ไม่ระบุ"
                : "หน่วยงาน #" + user.getOrganizationId();
        BigDecimal total = records.stream()
                .map(PurchaseHistory::getTotal)
                .filter(value -> value != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        List<AdminOrderItemResponse> items = records.stream()
                .map(record -> new AdminOrderItemResponse(
                        record.getProductName(),
                        record.getAmount(),
                        record.getUnitType()
                ))
                .toList();
        String checkoutId = first.getCheckoutId();
        String orderNumber = checkoutId.matches("(?i)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")
                ? checkoutId.substring(0, 8).toUpperCase()
                : checkoutId.toUpperCase();

        return new AdminOrderResponse(
                orderNumber,
                checkoutId,
                organization,
                items,
                total,
                first.getDeliveryStatus() == null ? DeliveryStatus.PENDING : first.getDeliveryStatus(),
                first.getPaymentStatus() == null ? PaymentStatus.PENDING : first.getPaymentStatus()
        );
    }
}
