package com.example.demo.repository;

import com.example.demo.entity.PriceStatus;
import com.example.demo.entity.ProductPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ProductPriceRepository extends JpaRepository<ProductPrice, Long> {

    @Query("""
            SELECT p FROM ProductPrice p
            WHERE p.productId = :productId
              AND p.organizationId = :organizationId
              AND p.status = :status
              AND p.effectiveFrom <= :now
              AND (p.effectiveTo IS NULL OR p.effectiveTo >= :now)
            ORDER BY p.effectiveFrom DESC
            """)
    List<ProductPrice> findCurrentPrices(
            @Param("productId") Long productId,
            @Param("organizationId") Long organizationId,
            @Param("status") PriceStatus status,
            @Param("now") LocalDateTime now);

    List<ProductPrice> findByOrganizationId(Long organizationId);
}