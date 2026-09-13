package com.example.demo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "cart")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cart {

    @Id
    @Column(name = "id", length = 255)
    private String id;

    @Column(name = "product_id", length = 255)
    private String productId;

    private Double price;

    @Column(name = "user_id", length = 255)
    private String userId;

    @Column(name = "create_dt")
    private LocalDate createDt;

    @Column(name = "update_dt")
    private LocalDate updateDt;

    @Column(name = "create_by", length = 255)
    private String createBy;

    @Column(name = "update_by", length = 255)
    private String updateBy;

    private Integer amount;

    private String status;

    @Column(name = "unit_type", length = 255)
    private String unitType;
}