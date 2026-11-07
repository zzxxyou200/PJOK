package com.example.demo.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class CheckoutRequest {

    @NotEmpty
    private List<String> cartItemIds;
}