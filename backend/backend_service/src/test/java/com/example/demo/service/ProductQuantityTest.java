package com.example.demo.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ProductQuantityTest {

    @Test
    void convertsBoxesToTwelveStockUnits() {
        assertThat(ProductQuantity.toStockUnits(2, "BOX")).isEqualTo(24);
        assertThat(ProductQuantity.toStockUnits(2, "UNIT")).isEqualTo(2);
        assertThat(ProductQuantity.toStockUnits(2, null)).isEqualTo(2);
    }
}
