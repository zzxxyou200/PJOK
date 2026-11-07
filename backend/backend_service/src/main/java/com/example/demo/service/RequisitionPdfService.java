package com.example.demo.service;

import com.example.demo.dto.RequisitionReport;
import com.openhtmltopdf.outputdevice.helper.BaseRendererBuilder;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Locale;

/**
 * Renders Thymeleaf reports to PDF with OpenHTMLtoPDF.
 *
 * <p>OpenHTMLtoPDF implements CSS 2.1 only, so templates must avoid flexbox, grid and
 * other CSS 3 layout. Thai glyphs are absent from the PDF base-14 fonts, which is why the
 * Sarabun faces have to be registered explicitly; both weights share one family name and
 * are told apart by the font weight passed to {@code useFont}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RequisitionPdfService {

    private static final String TEMPLATE = "report/requisition";
    private static final String REGULAR_FONT_RESOURCE = "/static/fonts/Sarabun-Regular.ttf";
    private static final String BOLD_FONT_RESOURCE = "/static/fonts/Sarabun-Bold.ttf";
    private static final int FONT_WEIGHT_REGULAR = 400;
    private static final int FONT_WEIGHT_BOLD = 700;

    private final SpringTemplateEngine templateEngine;

    @Value("${app.report.pdf-font-family}")
    private String fontFamily;

    public byte[] render(RequisitionReport report) {
        String html = renderHtml(report);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFont(() -> fontStream(REGULAR_FONT_RESOURCE), fontFamily,
                    FONT_WEIGHT_REGULAR, BaseRendererBuilder.FontStyle.NORMAL, true);
            builder.useFont(() -> fontStream(BOLD_FONT_RESOURCE), fontFamily,
                    FONT_WEIGHT_BOLD, BaseRendererBuilder.FontStyle.NORMAL, true);
            builder.toStream(out);
            builder.withHtmlContent(html, null);
            builder.run();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to render requisition PDF for document {}", report.getDocumentNo(), e);
            throw new IllegalStateException("Unable to render requisition PDF for document " + report.getDocumentNo(), e);
        }
    }

    private String renderHtml(RequisitionReport report) {
        Context context = new Context(Locale.forLanguageTag("th-TH"));
        context.setVariable("report", report);
        return templateEngine.process(TEMPLATE, context);
    }

    private InputStream fontStream(String resource) {
        InputStream stream = getClass().getResourceAsStream(resource);
        if (stream == null) {
            throw new IllegalStateException("Report font not found on classpath: " + resource);
        }
        return stream;
    }
}
