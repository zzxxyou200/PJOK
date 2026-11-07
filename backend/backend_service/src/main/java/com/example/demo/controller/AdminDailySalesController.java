package com.example.demo.controller;

import com.example.demo.dto.AdminDailySalesResponse;
import com.example.demo.service.AdminDailySalesService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/sales")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDailySalesController {

    private final AdminDailySalesService adminDailySalesService;

    @GetMapping("/daily")
    public List<AdminDailySalesResponse> getDailySales() {
        return adminDailySalesService.getDailySales();
    }
}
