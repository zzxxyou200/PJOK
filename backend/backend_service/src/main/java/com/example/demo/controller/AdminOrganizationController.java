package com.example.demo.controller;

import com.example.demo.dto.OrganizationSummaryResponse;
import com.example.demo.service.AdminOrganizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/organizations")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrganizationController {

    private final AdminOrganizationService adminOrganizationService;

    @GetMapping("/summary")
    public List<OrganizationSummaryResponse> getSummaries() {
        return adminOrganizationService.getSummaries();
    }
}
