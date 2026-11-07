package com.example.demo.service;

import com.example.demo.dto.RequisitionReport;
import com.example.demo.entity.PurchaseHistory;
import com.example.demo.entity.User;
import com.example.demo.repository.PurchaseHistoryRepository;
import com.example.demo.repository.UserRepository;
import com.google.zxing.BinaryBitmap;
import com.google.zxing.MultiFormatReader;
import com.google.zxing.client.j2se.BufferedImageLuminanceSource;
import com.google.zxing.common.HybridBinarizer;
import org.assertj.core.groups.Tuple;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RequisitionReportServiceTest {

    private PurchaseHistoryRepository historyRepository;
    private RequisitionReportService service;

    @BeforeEach
    void setUp() {
        historyRepository = mock(PurchaseHistoryRepository.class);
        UserRepository userRepository = mock(UserRepository.class);

        User user = new User();
        user.setId(7L);
        user.setUsername("officer01");
        when(userRepository.findByUsername("officer01")).thenReturn(Optional.of(user));

        // The repository already returns newest first, which fixes the order numbering.
        when(historyRepository.findByUserIdOrderByPurchaseDateDesc("7")).thenReturn(List.of(
                row("CHK-2", "คอมพิวเตอร์", 1, "1200.00", "1200.00", LocalDateTime.of(2026, 9, 5, 14, 30)),
                row("CHK-1", "กระดาษ A4", 2, "450.00", "900.00", LocalDateTime.of(2026, 9, 1, 9, 0))));

        service = new RequisitionReportService(historyRepository, userRepository);
        set("documentNoPrefix", "PI");
        set("companyName", "company");
        set("companyNameEn", "company en");
        set("departmentName", "department");
        set("address", "address");
        set("division", "division");
        set("taxId", "tax");
        set("phone", "phone");
        set("trackingBaseUrl", "https://example.test/track");
    }

    @Test
    void usesBuddhistEraShortYearInDocumentNumber() {
        // 2026 CE is 2569 BE, so the short year must read 69 and not 26.
        assertThat(service.buildReport("officer01").getDocumentNo()).isEqualTo("PI6909002");
    }

    @Test
    void groupsEveryOrderAndNumbersThemNewestFirst() {
        RequisitionReport report = service.buildReport("officer01");

        assertThat(report.getOrderCount()).isEqualTo(2);
        assertThat(report.getItemCount()).isEqualTo(2);
        assertThat(report.getItems())
                .extracting("orderNo", "no")
                .containsExactly(Tuple.tuple("PI-0001", 1), Tuple.tuple("PI-0002", 2));
    }

    @Test
    void convertsPeriodAndTotalsToBuddhistEraAndMoney() {
        RequisitionReport report = service.buildReport("officer01");

        assertThat(report.getPeriodStart()).isEqualTo("01/09/2569");
        assertThat(report.getPeriodEnd()).isEqualTo("05/09/2569");
        assertThat(report.getDocumentDate()).isEqualTo("05/09/2569 14:30 น.");
        assertThat(report.getGrandTotal()).isEqualTo("2100.00");
        assertThat(report.getTotalQuantity()).isEqualTo("3");
    }

    @Test
    void fallsBackToDashForMissingItemDetail() {
        PurchaseHistory sparse = new PurchaseHistory();
        sparse.setCheckoutId("CHK-9");
        sparse.setPurchaseDate(LocalDateTime.of(2026, 9, 9, 10, 0));
        when(historyRepository.findByUserIdOrderByPurchaseDateDesc("7")).thenReturn(List.of(sparse));

        RequisitionReport report = service.buildReport("officer01");

        assertThat(report.getItems())
                .extracting("productName", "serialNumber", "unit", "price", "total", "quantity")
                .containsExactly(Tuple.tuple("-", "-", "-", "0.00", "0.00", "0"));
        assertThat(report.getGrandTotal()).isEqualTo("0.00");
    }

    @Test
    void embedsScannableQrCodeCarryingTheTrackingUrlAndDocumentNumber() throws Exception {
        String qr = service.buildReport("officer01").getQrCodeDataUri();

        assertThat(qr).startsWith("data:image/png;base64,");
        assertThat(decodeQr(qr)).isEqualTo("https://example.test/track?documentNo=PI6909002");
    }

    @Test
    void rejectsWhenTheUserHasNoPurchaseHistory() {
        when(historyRepository.findByUserIdOrderByPurchaseDateDesc("7")).thenReturn(List.of());

        assertThatThrownBy(() -> service.buildReport("officer01"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("ไม่พบประวัติการซื้อ");
    }

    @Test
    void rejectsUnknownUser() {
        assertThatThrownBy(() -> service.buildReport("ghost"))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    private String decodeQr(String dataUri) throws Exception {
        byte[] png = Base64.getDecoder().decode(dataUri.substring(dataUri.indexOf(',') + 1));
        BufferedImage image = ImageIO.read(new ByteArrayInputStream(png));
        var source = new BufferedImageLuminanceSource(image);
        return new MultiFormatReader()
                .decode(new BinaryBitmap(new HybridBinarizer(source)))
                .getText();
    }

    private PurchaseHistory row(String checkoutId, String productName, int amount,
                                String price, String total, LocalDateTime date) {
        return PurchaseHistory.builder()
                .checkoutId(checkoutId)
                .userId("7")
                .productName(productName)
                .serialNumber("SN-" + checkoutId)
                .amount(amount)
                .unitType("ชิ้น")
                .price(new BigDecimal(price))
                .total(new BigDecimal(total))
                .purchaseDate(date)
                .build();
    }

    private void set(String field, Object value) {
        ReflectionTestUtils.setField(service, field, value);
    }
}
