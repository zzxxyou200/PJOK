package com.example.demo.dto;

import java.util.List;

public record AdminProductOptionsResponse(
        List<CategoryOption> categories,
        List<Long> organizationIds
) {
    public record CategoryOption(Long id, String name) {
    }
}
