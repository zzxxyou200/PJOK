package com.example.demo.repository;

import com.example.demo.entity.PurchaseHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PurchaseHistoryRepository extends JpaRepository<PurchaseHistory, Long> {

    List<PurchaseHistory> findByUserIdOrderByPurchaseDateDesc(String userId);

    List<PurchaseHistory> findAllByOrderByPurchaseDateDesc();

    List<PurchaseHistory> findByCheckoutIdOrderByPurchaseDateAsc(String checkoutId);
}