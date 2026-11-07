package com.example.demo.service;

import com.example.demo.entity.PaymentStatus;
import com.example.demo.entity.PriceStatus;
import com.example.demo.entity.ProductPrice;
import com.example.demo.entity.PurchaseHistory;
import com.example.demo.entity.User;
import com.example.demo.repository.ProductPriceRepository;
import com.example.demo.repository.PurchaseHistoryRepository;
import com.example.demo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AdminOrganizationServiceTest {

    private UserRepository userRepository;
    private PurchaseHistoryRepository purchaseHistoryRepository;
    private ProductPriceRepository productPriceRepository;
    private AdminOrganizationService service;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        purchaseHistoryRepository = mock(PurchaseHistoryRepository.class);
        productPriceRepository = mock(ProductPriceRepository.class);
        service = new AdminOrganizationService(
                userRepository,
                purchaseHistoryRepository,
                productPriceRepository
        );
    }

    @Test
    void summarizesOrdersPaymentsContactsAndOrganizationPricing() {
        User admin = user(1L, "admin", "ROLE_ADMIN", 12L);
        User contact = user(2L, "school-contact", "ROLE_USER", 12L);
        when(userRepository.findAll()).thenReturn(List.of(admin, contact));
        when(purchaseHistoryRepository.findAllByOrderByPurchaseDateDesc()).thenReturn(List.of(
                purchase("2", "order-1", "100.00", PaymentStatus.PAID),
                purchase("2", "order-1", "50.00", PaymentStatus.PENDING),
                purchase("2", "order-2", "25.00", PaymentStatus.PAID)
        ));
        when(productPriceRepository.findByOrganizationId(12L)).thenReturn(List.of(
                ProductPrice.builder()
                        .productId(4L)
                        .status(PriceStatus.ACTIVE)
                        .effectiveFrom(LocalDateTime.now().minusDays(1))
                        .build()
        ));

        var summary = service.getSummaries().get(0);

        assertThat(summary.organizationName()).isEqualTo("หน่วยงาน #12");
        assertThat(summary.contactName()).isEqualTo("school-contact");
        assertThat(summary.contactPhone()).isEqualTo("ไม่ระบุ");
        assertThat(summary.orderCount()).isEqualTo(2);
        assertThat(summary.orderTotal()).isEqualByComparingTo("175.00");
        assertThat(summary.paidTotal()).isEqualByComparingTo("125.00");
        assertThat(summary.outstandingTotal()).isEqualByComparingTo("50.00");
        assertThat(summary.customPricedProductCount()).isEqualTo(1);
    }

    private User user(Long id, String username, String role, Long organizationId) {
        return User.builder()
                .id(id)
                .username(username)
                .role(role)
                .organizationId(organizationId)
                .build();
    }

    private PurchaseHistory purchase(
            String userId,
            String checkoutId,
            String total,
            PaymentStatus paymentStatus) {
        return PurchaseHistory.builder()
                .userId(userId)
                .checkoutId(checkoutId)
                .total(new BigDecimal(total))
                .paymentStatus(paymentStatus)
                .build();
    }
}
