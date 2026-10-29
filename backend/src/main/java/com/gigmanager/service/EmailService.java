package com.gigmanager.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gigmanager.domain.Gig;
import com.gigmanager.domain.GigItem;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${spring.mail.username:jorgesoares2997@gmail.com}")
    private String mailFrom;

    @Value("${app.mail.resend-api-key:${RESEND_API_KEY:}}")
    private String resendApiKey;

    @Value("${app.mail.resend-from:${RESEND_FROM:onboarding@resend.dev}}")
    private String resendFrom;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Sends the Gig Setlist via email with both the Show PDF and Study PDF attached.
     * Uses Resend HTTP REST API if RESEND_API_KEY is configured (cloud firewall-friendly),
     * otherwise falls back to standard SMTP JavaMailSender.
     */
    public boolean sendGigSetlistEmail(Gig gig, List<GigItem> items, byte[] showPdfBytes, byte[] studyPdfBytes, String recipientEmail) {
        String targetEmail = (recipientEmail != null && !recipientEmail.isBlank()) ? recipientEmail.trim() : mailFrom;
        String subject = "🎵 Escala do Show: " + gig.getTitle() + " • Caixa de Repertório";
        String htmlContent = buildGigEmailHtml(gig, items);

        Map<String, byte[]> attachments = new LinkedHashMap<>();
        if (showPdfBytes != null && showPdfBytes.length > 0) {
            attachments.put("setlist_show_" + sanitizeFilename(gig.getTitle()) + ".pdf", showPdfBytes);
        }
        if (studyPdfBytes != null && studyPdfBytes.length > 0) {
            attachments.put("setlist_estudo_" + sanitizeFilename(gig.getTitle()) + ".pdf", studyPdfBytes);
        }

        // 1. Resend API (HTTP 443)
        if (resendApiKey != null && !resendApiKey.isBlank()) {
            return sendViaResendMulti(targetEmail, subject, htmlContent, attachments);
        }

        // 2. SMTP JavaMailSender fallback
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(mailFrom, "Caixa de Repertório");
            helper.setReplyTo(mailFrom);
            helper.setTo(targetEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            for (Map.Entry<String, byte[]> entry : attachments.entrySet()) {
                helper.addAttachment(entry.getKey(), new ByteArrayResource(entry.getValue()), "application/pdf");
            }

            mailSender.send(mimeMessage);
            System.out.println("[EmailService] Successfully sent Gig setlist email via SMTP to " + targetEmail + " with " + attachments.size() + " attachments.");
            return true;
        } catch (Exception e) {
            System.err.println("[EmailService] Failed to send Gig setlist email via SMTP to " + targetEmail + ": " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Backward-compatible overload for single PDF attachment.
     */
    public boolean sendGigSetlistEmail(Gig gig, List<GigItem> items, byte[] pdfBytes, String recipientEmail) {
        return sendGigSetlistEmail(gig, items, pdfBytes, null, recipientEmail);
    }

    private boolean sendViaResendMulti(String targetEmail, String subject, String htmlContent, Map<String, byte[]> attachments) {
        try {
            Map<String, Object> payload = new HashMap<>();
            String from = (resendFrom != null && !resendFrom.isBlank()) ? resendFrom : "onboarding@resend.dev";
            payload.put("from", "Caixa de Repertório <" + from + ">");
            payload.put("to", List.of(targetEmail));
            payload.put("subject", subject);
            payload.put("html", htmlContent);

            if (attachments != null && !attachments.isEmpty()) {
                List<Map<String, String>> attList = new ArrayList<>();
                for (Map.Entry<String, byte[]> entry : attachments.entrySet()) {
                    Map<String, String> att = new HashMap<>();
                    att.put("filename", entry.getKey());
                    att.put("content", Base64.getEncoder().encodeToString(entry.getValue()));
                    attList.add(att);
                }
                payload.put("attachments", attList);
            }

            String json = objectMapper.writeValueAsString(payload);

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + resendApiKey.trim())
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                System.out.println("[EmailService] Successfully sent Gig setlist email via Resend to " + targetEmail);
                return true;
            } else {
                System.err.println("[EmailService] Resend API error (" + response.statusCode() + "): " + response.body());
                return false;
            }
        } catch (Exception e) {
            System.err.println("[EmailService] Error calling Resend API: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    private String buildGigEmailHtml(Gig gig, List<GigItem> items) {
        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html><html><head><meta charset='UTF-8'>");
        sb.append("<style>");
        sb.append("body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAFAFA; margin: 0; padding: 24px; color: #161616; }");
        sb.append(".container { max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 3px solid #161616; border-radius: 20px; box-shadow: 6px 6px 0px #161616; overflow: hidden; }");
        sb.append(".header { background: #161616; color: #FFFFFF; padding: 28px 24px; text-align: center; }");
        sb.append(".badge { display: inline-block; background: #D4FF00; color: #161616; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; padding: 4px 12px; border-radius: 999px; margin-bottom: 12px; border: 2px solid #161616; }");
        sb.append(".title { margin: 0; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }");
        sb.append(".subtitle { margin-top: 6px; font-size: 13px; opacity: 0.8; }");
        sb.append(".content { padding: 24px; }");
        sb.append(".meta-box { background: #F4F4F5; border: 2px solid #161616; border-radius: 12px; padding: 14px; margin-bottom: 20px; box-shadow: 2px 2px 0px #161616; }");
        sb.append(".meta-item { font-size: 13px; font-weight: 600; margin: 4px 0; color: #161616; }");
        sb.append(".meta-label { font-weight: 800; text-transform: uppercase; font-size: 11px; color: #71717A; margin-right: 6px; }");
        sb.append(".song-item { background: #FFFFFF; border: 2px solid #161616; border-radius: 10px; padding: 10px 14px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; box-shadow: 2px 2px 0px #161616; }");
        sb.append(".key-pill { background: #E9D5FF; color: #161616; font-weight: 800; font-size: 12px; padding: 3px 8px; border-radius: 6px; border: 1.5px solid #161616; }");
        sb.append(".pdf-banner { background: #D4FF00; border: 2px solid #161616; border-radius: 12px; padding: 14px; margin-top: 22px; text-align: center; font-weight: 800; font-size: 13px; color: #161616; box-shadow: 3px 3px 0px #161616; }");
        sb.append(".footer { background: #F4F4F5; border-top: 2px solid #161616; padding: 16px; text-align: center; font-size: 12px; font-weight: 600; color: #71717A; }");
        sb.append("</style></head><body>");

        sb.append("<div class='container'>");
        sb.append("<div class='header'>");
        sb.append("<div class='badge'>Escala do Show</div>");
        sb.append("<h1 class='title'>").append(gig.getTitle()).append("</h1>");
        sb.append("<p class='subtitle'>Repertório preparado no <b>Caixa de Repertório</b></p>");
        sb.append("</div>");

        sb.append("<div class='content'>");

        // Meta info
        sb.append("<div class='meta-box'>");
        if (gig.getEventDate() != null) {
            String dateFormatted = gig.getEventDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH'h'mm"));
            sb.append("<div class='meta-item'><span class='meta-label'>Data & Hora:</span> ").append(dateFormatted).append("</div>");
        }
        if (gig.getVenue() != null && !gig.getVenue().isBlank()) {
            sb.append("<div class='meta-item'><span class='meta-label'>Local:</span> ").append(gig.getVenue()).append("</div>");
        }
        if (gig.getRepresentative() != null) {
            sb.append("<div class='meta-item'><span class='meta-label'>Projeto:</span> ").append(gig.getRepresentative().getName()).append("</div>");
        }
        sb.append("<div class='meta-item'><span class='meta-label'>Total de Faixas:</span> ").append(items.size()).append("</div>");
        sb.append("</div>");

        // Setlist list preview
        sb.append("<h3 style='font-size: 15px; font-weight: 900; text-transform: uppercase; margin-bottom: 12px;'>Sequência de Músicas:</h3>");

        for (int i = 0; i < items.size(); i++) {
            GigItem item = items.get(i);
            String title = item.getSong().getTitle();
            String comp = item.getSong().getComposer() != null ? item.getSong().getComposer() : "";
            String key = item.getPerformanceKey() != null ? item.getPerformanceKey() : (item.getSong().getOriginalKey() != null ? item.getSong().getOriginalKey() : "-");

            sb.append("<div class='song-item'>");
            sb.append("<div>");
            sb.append("<span style='font-weight: 800; font-size: 13px; color: #161616;'>").append(i + 1).append(". ").append(title).append("</span>");
            if (!comp.isBlank()) {
                sb.append("<div style='font-size: 11px; color: #71717A; font-weight: 600;'>").append(comp).append("</div>");
            }
            sb.append("</div>");
            sb.append("<div><span class='key-pill'>Tom: ").append(key).append("</span></div>");
            sb.append("</div>");
        }

        // PDF attachment banner
        sb.append("<div class='pdf-banner'>");
        sb.append("📎 <b>2 PDFs anexados a este e-mail:</b><br/>");
        sb.append("<span style='font-size: 12px; font-weight: 600;'>");
        sb.append("• <b>PDF de Show:</b> 1 página única, ultra-enxuto para palco e visualização rápida.<br/>");
        sb.append("• <b>PDF de Estudo:</b> Completo com nível de domínio musical de cada faixa.");
        sb.append("</span>");
        sb.append("</div>");

        sb.append("</div>"); // content

        sb.append("<div class='footer'>");
        sb.append("Caixa de Repertório • Estúdio de Repertório & Gigs");
        sb.append("</div>");

        sb.append("</div>"); // container
        sb.append("</body></html>");

        return sb.toString();
    }

    private String sanitizeFilename(String input) {
        if (input == null) return "show";
        return input.trim().toLowerCase()
                .replaceAll("[^a-zA-Z0-9_-]", "_")
                .replaceAll("_+", "_");
    }
}
