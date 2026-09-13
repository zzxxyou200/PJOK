package com.example.demo.repository;

import com.example.demo.entity.ProductSale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProductSaleRepository extends JpaRepository<ProductSale, Long> {

    @Query("""
            SELECT ps.productId, COALESCE(SUM(ps.quantity), 0)
            FROM ProductSale ps
            GROUP BY ps.productId
            """)
    List<Object[]> sumQuantityByProduct();
}