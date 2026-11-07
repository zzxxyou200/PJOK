package com.example.demo.controller;

import com.example.demo.dto.RequisitionReport;
import com.example.demo.service.RequisitionPdfService;
import com.example.demo.service.RequisitionReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.nio.charset.StandardCharsets;

@Controller
@RequestMapping("/api/reports/purchase-history")
@RequiredArgsConstructor
public class RequisitionReportController {

    private static final String TEMPLATE_VIEW = "report/requisition";
    private static final String PDF_FILENAME_PREFIX = "requisition-";

    private final RequisitionReportService reportService;
    private final RequisitionPdfService pdfService;

    /**
     * Printable HTML preview of ใบขอเบิกพัสดุราชการ for the signed-in user's full purchase history.
     */
    @GetMapping("/requisition")
    public String requisitionHtml(Authentication authentication, Model model) {
        model.addAttribute("report", reportService.buildReport(authentication.getName()));
        return TEMPLATE_VIEW;
    }

    /**
     * Same form as a downloadable PDF. Callers should fetch this with the bearer token and
     * open the response as a blob; the URL is not usable directly from window.open().
     */
    @GetMapping(value = "/requisition.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> requisitionPdf(Authentication authentication) {
        RequisitionReport report = reportService.buildReport(authentication.getName());
        byte[] pdf = pdfService.render(report);

        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(PDF_FILENAME_PREFIX + report.getDocumentNo() + ".pdf", StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(pdf.length)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(pdf);
    }
}
