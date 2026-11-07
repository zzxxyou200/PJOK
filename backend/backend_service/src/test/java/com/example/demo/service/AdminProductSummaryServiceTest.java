package com.example.demo.service;

import com.example.demo.entity.PriceStatus;
import com.example.demo.entity.Category;
import com.example.demo.entity.ProductItem;
import com.example.demo.entity.ProductPrice;
import com.example.demo.repository.CategoryRepository;
import com.example.demo.repository.ProductItemRepository;
import com.example.demo.repository.ProductPriceRepository;
import com.example.demo.repository.ProductSaleRepository;
import com.example.demo.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminProductSummaryServiceTest {

    @Test
    void createsProductWithOrganizationPriceAndStock() {
        ProductItemRepository itemRepository = mock(ProductItemRepository.class);
        ProductPriceRepository priceRepository = mock(ProductPriceRepository.class);
        ProductSaleRepository saleRepository = mock(ProductSaleRepository.class);
        CategoryRepository categoryRepository = mock(CategoryRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        Category category = Category.builder().id(3L).name("อุปกรณ์").build();
        when(categoryRepository.findById(3L)).thenReturn(Optional.of(category));
        when(userRepository.existsByOrganizationId(2L)).thenReturn(true);
        when(itemRepository.save(any(ProductItem.class))).thenAnswer(invocation -> {
            ProductItem item = invocation.getArgument(0);
            item.setProductId(20L);
            return item;
        });
        when(priceRepository.findCurrentPrices(any(), any(), any())).thenReturn(List.of());

        var request = new com.example.demo.dto.AdminProductUpdateRequest();
        request.setProductName("  Keyboard ");
        request.setCategoryId(3L);
        request.setOrganizationId(2L);
        request.setNormalPrice(new BigDecimal("890.00"));
        request.setBoxPrice(new BigDecimal("9500.00"));
        request.setUnitType("ชิ้น");
        request.setStockQuantity(5);

        new AdminProductSummaryService(
                itemRepository,
                priceRepository,
                saleRepository,
                categoryRepository,
                userRepository
        ).createProduct(request);

        verify(itemRepository).save(any(ProductItem.class));
        verify(priceRepository).save(org.mockito.ArgumentMatchers.argThat(price ->
                price.getProductId().equals(20L)
                        && price.getOrganizationId().equals(2L)
                        && price.getPrice().compareTo(new BigDecimal("890.00")) == 0
                        && price.getBoxPrice().compareTo(new BigDecimal("9500.00")) == 0));
    }

    @Test
    void summarizesNormalPriceSoldQuantityAndAvailableStock() {
        ProductItemRepository itemRepository = mock(ProductItemRepository.class);
        ProductPriceRepository priceRepository = mock(ProductPriceRepository.class);
        ProductSaleRepository saleRepository = mock(ProductSaleRepository.class);
        CategoryRepository categoryRepository = mock(CategoryRepository.class);
        UserRepository userRepository = mock(UserRepository.class);

        ProductItem available = ProductItem.builder()
                .productId(1L)
                .productName("Laptop")
                .serialNumber("SN-001")
                .itemStatus("AVAILABLE")
                .images("laptop.png,other.png")
                .build();
        ProductItem sold = ProductItem.builder()
                .productId(2L)
                .productName("Mouse")
                .serialNumber("SN-002")
                .itemStatus("SOLD")
                .stockQuantity(0)
                .build();
        when(itemRepository.findAll()).thenReturn(List.of(available, sold));
        when(priceRepository.findAll()).thenReturn(List.of(
                ProductPrice.builder()
                        .productId(1L)
                        .organizationId(1L)
                        .price(new BigDecimal("1250.00"))
                        .boxPrice(new BigDecimal("14500.00"))
                        .status(PriceStatus.ACTIVE)
                        .effectiveFrom(LocalDateTime.now().minusDays(1))
                        .build()
        ));
        when(saleRepository.sumQuantityByProduct()).thenReturn(List.of(
                new Object[] { 1L, 4L },
                new Object[] { 2L, 7L }
        ));

        var summaries = new AdminProductSummaryService(
                itemRepository,
                priceRepository,
                saleRepository,
                categoryRepository,
                userRepository
        ).getProductSummary();

        assertThat(summaries).hasSize(2);
        assertThat(summaries.get(0).normalPrice()).isEqualByComparingTo("1250.00");
        assertThat(summaries.get(0).normalBoxPrice()).isEqualByComparingTo("14500.00");
        assertThat(summaries.get(0).totalSold()).isEqualTo(4);
        assertThat(summaries.get(0).remainingStock()).isEqualTo(1);
        assertThat(summaries.get(0).image()).isEqualTo("laptop.png");
        assertThat(summaries.get(1).normalPrice()).isNull();
        assertThat(summaries.get(1).totalSold()).isEqualTo(7);
        assertThat(summaries.get(1).remainingStock()).isZero();
    }
}
