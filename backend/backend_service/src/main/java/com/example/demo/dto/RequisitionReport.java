package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RequisitionReport {

    // Header
    private String companyName;
    private String companyNameEn;
    private String documentNo;
    private String documentDate;

    // Data URIs so images survive server-side PDF rendering
    private String logoDataUri;
    private String qrCodeDataUri;

    // Requester / department block
    private String departmentName;
    private String address;
    private String requesterName;
    private String referenceNo;
    private String taxId;
    private String division;
    private String phone;

    // Aggregates
    private int orderCount;
    private int itemCount;
    private String totalQuantity;
    private String periodStart;
    private String periodEnd;
    private String grandTotal;

    private List<RequisitionItem> items;
}
