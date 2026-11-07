package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RequisitionItem {

    private int no;
    private String orderNo;
    private String productName;
    private String serialNumber;
    private String quantity;
    private String unit;
    private String price;
    private String total;
}
