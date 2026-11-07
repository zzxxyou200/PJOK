package com.example.demo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "purchese_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "checkout_id", nullable = false)
    private String checkoutId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "product_name")
    private String productName;

    @Column(name = "serial_number")
    private String serialNumber;

    private BigDecimal price;

    @Column(nullable = false)
    private Integer amount;

    @Column(name = "unit_type")
    private String unitType;

    private BigDecimal total;

    @Column(name = "purchase_date")
    private LocalDateTime purchaseDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_status", length = 32)
    @Builder.Default
    private DeliveryStatus deliveryStatus = DeliveryStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", length = 32)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;
}