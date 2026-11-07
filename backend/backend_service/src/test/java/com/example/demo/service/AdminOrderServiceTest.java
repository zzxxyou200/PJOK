package com.example.demo.service;

import com.example.demo.dto.AdminOrderResponse;
import com.example.demo.dto.OrderStatusUpdateRequest;
import com.example.demo.entity.DeliveryStatus;
import com.example.demo.entity.PaymentStatus;
import com.example.demo.entity.PurchaseHistory;
import com.example.demo.entity.User;
import com.example.demo.repository.PurchaseHistoryRepository;
import com.example.demo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AdminOrderServiceTest {

    private PurchaseHistoryRepository historyRepository;
    private UserRepository userRepository;
    private AdminOrderService service;

    @BeforeEach
    void setUp() {
        historyRepository = mock(PurchaseHistoryRepository.class);
        userRepository = mock(UserRepository.class);
        service = new AdminOrderService(historyRepository, userRepository);

        User user = new User();
        user.setId(7L);
        user.setOrganizationId(12L);
        when(userRepository.findAllById(Set.of(7L))).thenReturn(List.of(user));
    }

    @Test
    void groupsPurchaseLinesIntoOrderAndIncludesOrganizationAndTotal() {
        when(historyRepository.findAllByOrderByPurchaseDateDesc()).thenReturn(List.of(
                row("checkout-123456", "หมึกพิมพ์", "2.50"),
                row("checkout-123456", "กระดาษ", "100.00")
        ));

        List<AdminOrderResponse> orders = service.getOrders();

        assertThat(orders).hasSize(1);
        assertThat(orders.get(0).orderNumber()).isEqualTo("CHECKOUT-123456");
        assertThat(orders.get(0).organization()).isEqualTo("หน่วยงาน #12");
        assertThat(orders.get(0).items()).hasSize(2);
        assertThat(orders.get(0).total()).isEqualByComparingTo("102.50");
        assertThat(orders.get(0).deliveryStatus()).isEqualTo(DeliveryStatus.PENDING);
        assertThat(orders.get(0).paymentStatus()).isEqualTo(PaymentStatus.PENDING);
    }

    @Test
    void updatesStatusesAcrossEveryLineInAnOrder() {
        List<PurchaseHistory> records = List.of(
                row("checkout-123456", "หมึกพิมพ์", "2.50"),
                row("checkout-123456", "กระดาษ", "100.00")
        );
        when(historyRepository.findByCheckoutIdOrderByPurchaseDateAsc("checkout-123456"))
                .thenReturn(records);
        doAnswer(invocation -> invocation.getArgument(0))
                .when(historyRepository).saveAll(anyList());

        OrderStatusUpdateRequest request = new OrderStatusUpdateRequest();
        request.setDeliveryStatus(DeliveryStatus.SHIPPED);
        request.setPaymentStatus(PaymentStatus.PAID);

        AdminOrderResponse updated = service.updateStatus("checkout-123456", request);

        assertThat(records).allSatisfy(record -> {
            assertThat(record.getDeliveryStatus()).isEqualTo(DeliveryStatus.SHIPPED);
            assertThat(record.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        });
        assertThat(updated.deliveryStatus()).isEqualTo(DeliveryStatus.SHIPPED);
        assertThat(updated.paymentStatus()).isEqualTo(PaymentStatus.PAID);
    }

    private PurchaseHistory row(String checkoutId, String productName, String total) {
        return PurchaseHistory.builder()
                .checkoutId(checkoutId)
                .userId("7")
                .productName(productName)
                .amount(1)
                .total(new BigDecimal(total))
                .build();
    }
}
