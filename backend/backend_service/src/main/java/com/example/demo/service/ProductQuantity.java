package com.example.demo.service;

final class ProductQuantity {

    static final int UNITS_PER_BOX = 12;

    private ProductQuantity() {
    }

    static long toStockUnits(int quantity, String unitType) {
        return "BOX".equalsIgnoreCase(unitType)
                ? (long) quantity * UNITS_PER_BOX
                : quantity;
    }
}
