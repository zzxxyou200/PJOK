package com.example.demo.service;

import com.example.demo.dto.RequisitionItem;
import com.example.demo.dto.RequisitionReport;
import com.example.demo.entity.PurchaseHistory;
import com.example.demo.entity.User;
import com.example.demo.repository.PurchaseHistoryRepository;
import com.example.demo.repository.UserRepository;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Builds the ใบขอเบิกพัสดุราชการ view model from a user's full purchase history.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RequisitionReportService {

    private static final int BUDDHIST_YEAR_OFFSET = 543;
    private static final int QR_SIZE_PX = 512;
    private static final String DASH = "-";
    private static final String LOGO_RESOURCE = "/static/images/logo.png";

    private final PurchaseHistoryRepository purchaseHistoryRepository;
    private final UserRepository userRepository;

    @Value("${app.report.company-name}")
    private String companyName;

    @Value("${app.report.company-name-en}")
    private String companyNameEn;

    @Value("${app.report.department-name}")
    private String departmentName;

    @Value("${app.report.address}")
    private String address;

    @Value("${app.report.division}")
    private String division;

    @Value("${app.report.tax-id}")
    private String taxId;

    @Value("${app.report.phone}")
    private String phone;

    @Value("${app.report.document-no-prefix}")
    private String documentNoPrefix;

    @Value("${app.report.tracking-base-url}")
    private String trackingBaseUrl;

    @Transactional(readOnly = true)
    public RequisitionReport buildReport(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        List<PurchaseHistory> records = purchaseHistoryRepository
                .findByUserIdOrderByPurchaseDateDesc(String.valueOf(user.getId()));

        if (records.isEmpty()) {
            throw new ResponseStatusException(NOT_FOUND, "ไม่พบประวัติการซื้อ จึงไม่สามารถออกใบขอเบิกพัสดุได้");
        }

        Map<String, List<PurchaseHistory>> byOrder = groupByOrder(records);
        Map<String, String> orderNumbers = numberOrders(byOrder.keySet());
        List<RequisitionItem> items = toItems(byOrder, orderNumbers);

        LocalDateTime latest = records.get(0).getPurchaseDate();
        LocalDateTime earliest = records.stream()
                .map(PurchaseHistory::getPurchaseDate)
                .filter(Objects::nonNull)
                .min(Comparator.naturalOrder())
                .orElse(null);

        String documentNo = buildDocumentNo(latest, byOrder.size());

        return RequisitionReport.builder()
                .companyName(companyName)
                .companyNameEn(companyNameEn)
                .documentNo(documentNo)
                .documentDate(formatDateTimeBe(latest))
                .departmentName(departmentName)
                .address(address)
                .requesterName(user.getUsername())
                .referenceNo(DASH)
                .taxId(taxId)
                .division(division)
                .phone(phone)
                .logoDataUri(readResourceAsDataUri(LOGO_RESOURCE))
                .qrCodeDataUri(generateQrCodeDataUri(trackingBaseUrl + "?documentNo=" + documentNo))
                .orderCount(byOrder.size())
                .itemCount(items.size())
                .totalQuantity(String.valueOf(sumQuantity(records)))
                .periodStart(formatDateBe(earliest))
                .periodEnd(formatDateBe(latest))
                .grandTotal(money(sumTotal(records)))
                .items(items)
                .build();
    }

    private Map<String, List<PurchaseHistory>> groupByOrder(List<PurchaseHistory> records) {
        Map<String, List<PurchaseHistory>> byOrder = new LinkedHashMap<>();
        for (PurchaseHistory record : records) {
            byOrder.computeIfAbsent(record.getCheckoutId(), key -> new ArrayList<>()).add(record);
        }
        byOrder.values().forEach(orderItems -> orderItems.sort(
                Comparator.comparing(PurchaseHistory::getProductName,
                        Comparator.nullsLast(Comparator.naturalOrder()))));
        return byOrder;
    }

    private Map<String, String> numberOrders(Iterable<String> checkoutIds) {
        Map<String, String> orderNumbers = new LinkedHashMap<>();
        int sequence = 1;
        for (String checkoutId : checkoutIds) {
            orderNumbers.put(checkoutId, "%s-%04d".formatted(documentNoPrefix, sequence++));
        }
        return orderNumbers;
    }

    private List<RequisitionItem> toItems(Map<String, List<PurchaseHistory>> byOrder,
                                         Map<String, String> orderNumbers) {
        List<RequisitionItem> items = new ArrayList<>();
        int lineNo = 1;
        for (Map.Entry<String, List<PurchaseHistory>> entry : byOrder.entrySet()) {
            String orderNo = orderNumbers.get(entry.getKey());
            for (PurchaseHistory record : entry.getValue()) {
                items.add(RequisitionItem.builder()
                        .no(lineNo++)
                        .orderNo(orderNo)
                        .productName(blankToDash(record.getProductName()))
                        .serialNumber(blankToDash(record.getSerialNumber()))
                        .quantity(record.getAmount() == null ? "0" : String.valueOf(record.getAmount()))
                        .unit(blankToDash(record.getUnitType()))
                        .price(money(record.getPrice()))
                        .total(money(record.getTotal()))
                        .build());
            }
        }
        return items;
    }

    /** e.g. PI6908001 -> prefix + Buddhist short year + month + 3-digit order count. */
    private String buildDocumentNo(LocalDateTime reference, int orderCount) {
        if (reference == null) {
            return "%s000001".formatted(documentNoPrefix);
        }
        return "%s%02d%02d%03d".formatted(
                documentNoPrefix,
                (reference.getYear() + BUDDHIST_YEAR_OFFSET) % 100,
                reference.getMonthValue(),
                orderCount);
    }

    private BigDecimal sumTotal(List<PurchaseHistory> records) {
        return records.stream()
                .map(PurchaseHistory::getTotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private int sumQuantity(List<PurchaseHistory> records) {
        return records.stream()
                .map(PurchaseHistory::getAmount)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .sum();
    }

    private String money(BigDecimal value) {
        if (value == null) {
            return "0.00";
        }
        return value.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private String formatDateBe(LocalDateTime value) {
        if (value == null) {
            return DASH;
        }
        return "%02d/%02d/%d".formatted(
                value.getDayOfMonth(),
                value.getMonthValue(),
                value.getYear() + BUDDHIST_YEAR_OFFSET);
    }

    private String formatDateTimeBe(LocalDateTime value) {
        if (value == null) {
            return DASH;
        }
        return "%02d/%02d/%d %02d:%02d น.".formatted(
                value.getDayOfMonth(),
                value.getMonthValue(),
                value.getYear() + BUDDHIST_YEAR_OFFSET,
                value.getHour(),
                value.getMinute());
    }

    private String blankToDash(String value) {
        return value == null || value.isBlank() ? DASH : value.trim();
    }

    private String generateQrCodeDataUri(String content) {
        Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
        hints.put(EncodeHintType.CHARACTER_SET, StandardCharsets.UTF_8.name());
        hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
        hints.put(EncodeHintType.MARGIN, 1);

        try {
            BitMatrix matrix = new QRCodeWriter().encode(content, BarcodeFormat.QR_CODE, QR_SIZE_PX, QR_SIZE_PX, hints);
            ByteArrayOutputStream png = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", png);
            return toPngDataUri(png.toByteArray());
        } catch (WriterException | IOException e) {
            log.warn("Unable to generate QR code for requisition report", e);
            return null;
        }
    }

    /**
     * Inlines a classpath image as a data URI. Embedded images render in both the browser
     * and the OpenHTMLtoPDF pipeline, which cannot resolve a bare "/images/..." path.
     */
    private String readResourceAsDataUri(String resource) {
        try (InputStream in = getClass().getResourceAsStream(resource)) {
            if (in == null) {
                log.warn("Report resource not found on classpath: {}", resource);
                return null;
            }
            return toPngDataUri(in.readAllBytes());
        } catch (IOException e) {
            log.warn("Unable to read report resource: {}", resource, e);
            return null;
        }
    }

    private String toPngDataUri(byte[] bytes) {
        return "data:image/png;base64," + Base64.getEncoder().encodeToString(bytes);
    }
}
