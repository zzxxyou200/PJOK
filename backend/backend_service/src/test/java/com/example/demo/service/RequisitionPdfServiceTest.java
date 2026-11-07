package com.example.demo.service;

import com.example.demo.dto.RequisitionItem;
import com.example.demo.dto.RequisitionReport;
import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDResources;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import static org.assertj.core.api.Assertions.assertThat;

class RequisitionPdfServiceTest {

    private RequisitionPdfService pdfService;

    @BeforeEach
    void setUp() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");

        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.setTemplateResolver(resolver);

        pdfService = new RequisitionPdfService(engine);
        ReflectionTestUtils.setField(pdfService, "fontFamily", "Sarabun");
    }

    @Test
    void rendersPdfFromRequisitionTemplate() throws Exception {
        byte[] pdf = pdfService.render(sampleReport());

        assertThat(new String(pdf, 0, 5, StandardCharsets.ISO_8859_1)).isEqualTo("%PDF-");

        try (PDDocument doc = PDDocument.load(pdf)) {
            assertThat(doc.getNumberOfPages())
                    .as("a five item report must stay on one A4 page")
                    .isEqualTo(1);

            Map<String, PDFont> fonts = new TreeMap<>();
            for (PDPage page : doc.getPages()) {
                PDResources res = page.getResources();
                if (res == null) {
                    continue;
                }
                for (COSName key : res.getFontNames()) {
                    fonts.put(key.getName(), res.getFont(key));
                }
            }
            assertThat(fonts).isNotEmpty();
            assertThat(fonts.values())
                    .as("Thai glyphs require the registered Sarabun face, not a PDF base-14 font")
                    .allSatisfy(font -> {
                        assertThat(font.isEmbedded()).isTrue();
                        assertThat(font.getName()).contains("Sarabun");
                    });
        }

        assertThat(extractText(pdf))
                .as("Thai text must survive PDF generation")
                .contains("ใบขอเบิกพัสดุราชการ", "รวมทั้งสิ้น (บาท):", "18450.00", "ผู้ขอเบิก", "PI6908001");
    }

    private String extractText(byte[] pdf) throws Exception {
        try (PDDocument doc = PDDocument.load(pdf)) {
            return new PDFTextStripper().getText(doc);
        }
    }

    private RequisitionReport sampleReport() {
        return RequisitionReport.builder()
                .companyName("หจก.พี.เจ.โอเอ. เซ็นเตอร์")
                .companyNameEn("P.J. O.A. CENTER LIMITED PARTNERSHIP")
                .documentNo("PI6908001")
                .documentDate("05/09/2569 14:30 น.")
                .departmentName("กรมวิทยาศาสตร์และเทคโนโลยี")
                .address("ถนนพหลโยธิน เขตบางบัวทอง กรุงเทพมหานคร")
                .requesterName("officer01")
                .referenceNo("-")
                .taxId("0105549000123")
                .division("กองวิจัยและพัฒนาระบบสารสนเทศ")
                .phone("02-000-0000")
                .logoDataUri(logoDataUri())
                .qrCodeDataUri("data:image/png;base64," + Base64.getEncoder().encodeToString(logoBytes()))
                .orderCount(2)
                .itemCount(5)
                .totalQuantity("7")
                .periodStart("01/09/2569")
                .periodEnd("05/09/2569")
                .grandTotal("18450.00")
                .items(List.of(
                        row(1, "PI-0001", "คอมพิวเตอร์โน้ตบุ๊กสำหรับงานราชการ", "SN-ABC-0001", "1", "เครื่อง", "3500.00", "3500.00"),
                        row(2, "PI-0001", "เมาส์ไร้สาย", "SN-ABC-0002", "2", "ตัว", "450.00", "900.00"),
                        row(3, "PI-0002", "เครื่องพิมพ์เลเซอร์สี", "SN-ABC-0003", "3", "เครื่อง", "1200.00", "3600.00"),
                        row(4, "PI-0002", "ตู้เอกสาร 4 ชั้น", "SN-ABC-0004", "1", "ตู้", "2500.00", "2500.00"),
                        row(5, "PI-0002", "กระดาษ A4 80gsm", "-", "1", "กล่อง", "7950.00", "7950.00")))
                .build();
    }

    private RequisitionItem row(int no, String orderNo, String name, String sn,
                                String qty, String unit, String price, String total) {
        return RequisitionItem.builder()
                .no(no).orderNo(orderNo).productName(name).serialNumber(sn)
                .quantity(qty).unit(unit).price(price).total(total)
                .build();
    }

    private byte[] logoBytes() {
        try (InputStream in = getClass().getResourceAsStream("/static/images/logo.png")) {
            assertThat(in).as("logo.png must be on the classpath").isNotNull();
            return in.readAllBytes();
        } catch (java.io.IOException e) {
            throw new IllegalStateException(e);
        }
    }

    private String logoDataUri() {
        return "data:image/png;base64," + Base64.getEncoder().encodeToString(logoBytes());
    }
}
