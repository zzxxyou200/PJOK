package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "product_sales")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductSale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "organization_id")
    private Long organizationId;

    @Column(nullable = false)
    private Integer quantity;

    private BigDecimal price;

    @Column(name = "sale_date")
    private LocalDateTime saleDate;
}