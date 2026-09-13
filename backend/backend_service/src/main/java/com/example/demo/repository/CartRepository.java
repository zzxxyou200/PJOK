package com.example.demo.repository;

import com.example.demo.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, String> {

    List<Cart> findByUserIdAndStatusOrderByCreateDtAsc(String userId, String status);

    Optional<Cart> findByUserIdAndProductIdAndUnitTypeAndStatus(
            String userId, String productId, String unitType, String status);
}