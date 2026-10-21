package com.gigmanager.service;

import com.gigmanager.domain.DailyPracticeLog;
import com.gigmanager.domain.Representative;
import com.gigmanager.domain.RepresentativeSong;
import com.gigmanager.domain.Song;
import com.gigmanager.domain.WeeklyPracticeConfig;
import com.gigmanager.repository.DailyPracticeLogRepository;
import com.gigmanager.repository.RepresentativeRepository;
import com.gigmanager.repository.RepresentativeSongRepository;
import com.gigmanager.repository.SongRepository;
import com.gigmanager.repository.WeeklyPracticeConfigRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

@Service
public class DailyPracticeScheduler {

    private final SongRepository songRepository;
    private final DailyPracticeLogRepository practiceLogRepository;
    private final RepresentativeRepository representativeRepository;
    private final RepresentativeSongRepository representativeSongRepository;
    private final WeeklyPracticeConfigRepository configRepository;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:jorgesoares2997@gmail.com}")
    private String mailFrom;

    @Value("${app.mail.resend-api-key:${RESEND_API_KEY:}}")
    private String resendApiKey;

    @Value("${app.mail.resend-from:${RESEND_FROM:onboarding@resend.dev}}")
    private String resendFrom;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public DailyPracticeScheduler(
            SongRepository songRepository,
            DailyPracticeLogRepository practiceLogRepository,
            RepresentativeRepository representativeRepository,
            RepresentativeSongRepository representativeSongRepository,
            WeeklyPracticeConfigRepository configRepository,
            JavaMailSender mailSender
    ) {
        this.songRepository = songRepository;
        this.practiceLogRepository = practiceLogRepository;
        this.representativeRepository = representativeRepository;
        this.representativeSongRepository = representativeSongRepository;
        this.configRepository = configRepository;
        this.mailSender = mailSender;
    }

    /**
     * Retrieves the active weekly focus configuration.
     * If the current date is after the configured Sunday, the focus is considered expired and is cleaned up.
     */
    public Optional<WeeklyPracticeConfig> getActiveWeeklyConfig() {
        Optional<WeeklyPracticeConfig> opt = configRepository.findById("DEFAULT");
        if (opt.isEmpty()) {
            return Optional.empty();
        }

        WeeklyPracticeConfig config = opt.get();
        LocalDate today = LocalDate.now();

        if (config.getExpiresAt() != null && today.isAfter(config.getExpiresAt())) {
            // Expired on Sunday! Automatically reset to general repertoire
            configRepository.deleteById("DEFAULT");
            System.out.println("[DailyPracticeScheduler] Foco semanal expirou no domingo (" + config.getExpiresAt() + "). Voltando para modo Geral.");
            return Optional.empty();
        }

        if (config.getRepresentativeIds() == null || config.getRepresentativeIds().isBlank()) {
            return Optional.empty();
        }

        return Optional.of(config);
    }

    /**
     * Parses active representative UUIDs from the active weekly configuration.
     */
    public List<UUID> getActiveWeeklyRepresentativeIds() {
        return getActiveWeeklyConfig()
                .map(cfg -> Arrays.stream(cfg.getRepresentativeIds().split(","))
                        .map(String::trim)
                        .filter(s -> !s.isBlank())
                        .map(UUID::fromString)
                        .toList())
                .orElse(Collections.emptyList());
    }

    /**
     * Saves or clears the weekly focus. Valid until the upcoming Sunday (end of week).
     */
    public WeeklyPracticeConfig saveWeeklyFocus(List<UUID> representativeIds) {
        LocalDate today = LocalDate.now();
        LocalDate currentSunday = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));

        if (representativeIds == null || representativeIds.isEmpty()) {
            configRepository.deleteById("DEFAULT");
            return WeeklyPracticeConfig.builder()
                    .id("DEFAULT")
                    .representativeIds("")
                    .expiresAt(currentSunday)
                    .build();
        }

        String joinedIds = String.join(",", representativeIds.stream().map(UUID::toString).toList());
        WeeklyPracticeConfig config = WeeklyPracticeConfig.builder()
                .id("DEFAULT")
                .representativeIds(joinedIds)
                .expiresAt(currentSunday)
                .build();

        return configRepository.save(config);
    }

    /**
     * Selects today's practice songs.
     * If overrideRepresentativeIds is provided, filters by those artists.
     * Otherwise, checks the active weekly focus. If no active weekly focus, selects from general repertoire.
     */
    public List<Song> getTodayPracticeSongs(List<UUID> overrideRepresentativeIds) {
        List<UUID> repIds = (overrideRepresentativeIds != null && !overrideRepresentativeIds.isEmpty())
                ? overrideRepresentativeIds
                : getActiveWeeklyRepresentativeIds();

        List<Song> practiceList = new ArrayList<>();

        if (!repIds.isEmpty()) {
            // Draw from selected artists
            // 2 songs level 1-2 (Dense Acquisition)
            practiceList.addAll(songRepository.findRandomSongsByRepresentativesAndMasteryLevels(repIds, List.of(1, 2), 2));
            // 2 songs level 3-4 (Polishing / Maintenance)
            practiceList.addAll(songRepository.findRandomSongsByRepresentativesAndMasteryLevels(repIds, List.of(3, 4), 2));
            // 1 song level 5 (Fluency / Mastered)
            practiceList.addAll(songRepository.findRandomSongsByRepresentativesAndMasteryLevels(repIds, List.of(5), 1));

            // If not enough songs due to mastery distribution, complete with any songs from the selected artists
            if (practiceList.size() < 5) {
                List<Song> fallback = songRepository.findRandomSongsByRepresentatives(repIds, 5 - practiceList.size());
                for (Song s : fallback) {
                    if (!practiceList.contains(s) && practiceList.size() < 5) {
                        practiceList.add(s);
                    }
                }
            }
        } else {
            // General repertoire selection across all songs
            practiceList.addAll(songRepository.findRandomSongsByMasteryLevels(List.of(1, 2), 2));
            practiceList.addAll(songRepository.findRandomSongsByMasteryLevels(List.of(3, 4), 2));
            practiceList.addAll(songRepository.findRandomSongsByMasteryLevels(List.of(5), 1));

            if (practiceList.size() < 5) {
                List<Song> fallback = songRepository.findRandomSongsByMasteryLevels(List.of(1, 2, 3, 4, 5), 5 - practiceList.size());
                for (Song s : fallback) {
                    if (!practiceList.contains(s)) {
                        practiceList.add(s);
                    }
                }
            }
        }

        return practiceList;
    }

    public List<Song> getTodayPracticeSongs() {
        return getTodayPracticeSongs(null);
    }

    public String getDrillTypeForLevel(Integer level) {
        if (level == null) return "Prática geral: leitura da forma e execução com metrônomo.";
        if (level <= 2) return "Aquisição Densa: escuta ativa da gravação original, mapa da forma e leitura cuidadosa da harmonia/cifra.";
        if (level <= 4) return "Manutenção Técnica: toque sem olhar a cifra, transporte mentalmente para tons vizinhos e teste variações de levada/groove.";
        return "Manutenção de Linguagem: crie uma introdução autoral, rearmonize trechos e pratique solos/linhas melódicas improvisadas.";
    }

    /**
     * Automatic scheduled practice email: daily at 08:00 AM (America/Sao_Paulo timezone).
     */
    @Scheduled(cron = "${app.practice.cron:0 0 8 * * *}", zone = "${app.practice.zone:America/Sao_Paulo}")
    public void scheduleDailyPractice() {
        System.out.println("[DailyPracticeScheduler] Executing scheduled daily practice email at 08:00 BRT...");
        sendDailyPracticeEmail(mailFrom, null);
    }

    public boolean sendDailyPracticeEmail(String recipientEmail) {
        return sendDailyPracticeEmail(recipientEmail, null);
    }

    public boolean sendDailyPracticeEmail(String recipientEmail, List<UUID> overrideRepresentativeIds) {
        List<UUID> repIds = (overrideRepresentativeIds != null && !overrideRepresentativeIds.isEmpty())
                ? overrideRepresentativeIds
                : getActiveWeeklyRepresentativeIds();

        List<Song> practiceList = getTodayPracticeSongs(repIds);
        if (practiceList.isEmpty()) {
            System.err.println("[DailyPracticeScheduler] No songs available to send in daily practice email.");
            return false;
        }

        String targetEmail = (recipientEmail != null && !recipientEmail.isBlank()) ? recipientEmail : mailFrom;
        LocalDate today = LocalDate.now();
        String formattedDate = today.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

        // Save daily practice logs
        for (Song song : practiceList) {
            String drill = getDrillTypeForLevel(song.getMasteryLevel());
            DailyPracticeLog log = DailyPracticeLog.builder()
                    .song(song)
                    .practiceDate(today)
                    .drillType(drill)
                    .completed(false)
                    .build();
            practiceLogRepository.save(log);
        }

        // Fetch representative names and active Sunday expiration if filtered
        List<String> repNames = new ArrayList<>();
        LocalDate expiresAt = null;
        if (!repIds.isEmpty()) {
            List<Representative> reps = representativeRepository.findAllById(repIds);
            for (Representative r : reps) {
                repNames.add(r.getName());
            }
            expiresAt = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
        }

        String subject = repNames.isEmpty()
                ? "🎸 Rotina de Estudo Diário • " + formattedDate
                : "🎸 Rotina de Estudo [" + String.join(" + ", repNames) + "] • " + formattedDate;

        String htmlContent = buildHtmlEmail(practiceList, formattedDate, repNames, expiresAt);

        // 1. Prioritize HTTP REST API (Resend) - immune to cloud provider firewall blocking on ports 25, 465, 587
        if (resendApiKey != null && !resendApiKey.isBlank()) {
            return sendViaResend(targetEmail, subject, htmlContent);
        }

        // 2. Standard SMTP (JavaMailSender) fallback
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(mailFrom, "Caixa de Repertório");
            helper.setReplyTo(mailFrom);
            helper.setTo(targetEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
            System.out.println("[DailyPracticeScheduler] Successfully sent daily practice email via SMTP to " + targetEmail + " (Focus: " + (repNames.isEmpty() ? "Geral" : repNames) + ")");
            return true;
        } catch (Exception e) {
            System.err.println("[DailyPracticeScheduler] Failed to send email via SMTP to " + targetEmail + ": " + e.getMessage());
            System.err.println("[DailyPracticeScheduler] DIAGNÓSTICO: No Render (e outros hosts no plano gratuito), conexões de saída SMTP (portas 25, 465, 587) são bloqueadas por padrão, resultando em SocketTimeoutException.");
            System.err.println("[DailyPracticeScheduler] SOLUÇÃO RECOMENDADA: Crie uma conta gratuita em https://resend.com e adicione a variável RESEND_API_KEY no painel do Render para envio via API HTTPS (porta 443).");
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Sends email via Resend HTTP REST API over port 443 (HTTPS).
     * Works seamlessly in any cloud environment (Render, Railway, Fly.io, AWS) without SMTP port blocking.
     */
    private boolean sendViaResend(String targetEmail, String subject, String htmlContent) {
        try {
            Map<String, Object> payload = new HashMap<>();
            String from = (resendFrom != null && !resendFrom.isBlank()) ? resendFrom : "onboarding@resend.dev";
            payload.put("from", "Caixa de Repertório <" + from + ">");
            payload.put("to", List.of(targetEmail));
            payload.put("subject", subject);
            payload.put("html", htmlContent);

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
                System.out.println("[DailyPracticeScheduler] Successfully sent daily practice email via Resend API (HTTP 443) to " + targetEmail);
                return true;
            } else {
                System.err.println("[DailyPracticeScheduler] Resend API error (" + response.statusCode() + "): " + response.body());
                return false;
            }
        } catch (Exception e) {
            System.err.println("[DailyPracticeScheduler] Failed to send email via Resend API: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Resolves artist specific performance key and name for a song if linked.
     */
    public Map<String, String> getArtistLinkForSong(UUID songId, List<UUID> repFilterIds) {
        List<RepresentativeSong> links = representativeSongRepository.findBySongIdWithRepresentative(songId);
        if (links.isEmpty()) return Collections.emptyMap();

        RepresentativeSong target = null;
        if (repFilterIds != null && !repFilterIds.isEmpty()) {
            for (RepresentativeSong rs : links) {
                if (rs.getRepresentative() != null && repFilterIds.contains(rs.getRepresentative().getId())) {
                    target = rs;
                    break;
                }
            }
        }
        if (target == null) {
            target = links.get(0);
        }

        Map<String, String> map = new HashMap<>();
        if (target.getRepresentative() != null) {
            map.put("artistName", target.getRepresentative().getName());
        }
        if (target.getPerformanceKey() != null && !target.getPerformanceKey().isBlank()) {
            map.put("performanceKey", target.getPerformanceKey());
        }
        return map;
    }

    private String buildHtmlEmail(List<Song> songs, String dateStr, List<String> artistNames, LocalDate expiresAt) {
        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html><html><head><meta charset='UTF-8'>");
        sb.append("<style>");
        sb.append("body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAFAFA; margin: 0; padding: 24px; color: #161616; }");
        sb.append(".container { max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 3px solid #161616; border-radius: 20px; box-shadow: 6px 6px 0px #161616; overflow: hidden; }");
        sb.append(".header { background: #161616; color: #FFFFFF; padding: 28px 24px; text-align: center; }");
        sb.append(".badge { display: inline-block; background: #D4FF00; color: #161616; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; padding: 4px 12px; border-radius: 999px; margin-bottom: 12px; border: 2px solid #161616; }");
        sb.append(".title { margin: 0; font-size: 26px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }");
        sb.append(".subtitle { margin-top: 6px; font-size: 13px; opacity: 0.8; }");
        sb.append(".content { padding: 24px; }");
        sb.append(".focus-banner { background: #E9D5FF; border: 2px solid #161616; border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; box-shadow: 2px 2px 0px #161616; }");
        sb.append(".song-card { background: #F4F4F5; border: 2px solid #161616; border-radius: 14px; padding: 16px; margin-bottom: 16px; box-shadow: 3px 3px 0px #161616; }");
        sb.append(".song-title { font-size: 17px; font-weight: 800; text-transform: uppercase; margin: 0; color: #161616; }");
        sb.append(".song-composer { font-size: 12px; color: #71717A; font-weight: 600; margin: 2px 0 0 0; }");
        sb.append(".key-badge { display: inline-block; background: #E9D5FF; color: #161616; font-weight: 800; font-size: 12px; padding: 2px 8px; border-radius: 6px; border: 1.5px solid #161616; }");
        sb.append(".drill-box { background: #FFFFFF; border: 1.5px solid #161616; border-radius: 8px; padding: 10px; margin-top: 10px; font-size: 12px; line-height: 1.4; }");
        sb.append(".drill-label { font-weight: 800; color: #FF6B00; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; margin-bottom: 2px; }");
        sb.append(".level-badge { display: inline-block; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 6px; margin-right: 6px; }");
        sb.append(".footer { background: #F4F4F5; border-top: 2px solid #161616; padding: 18px; text-align: center; font-size: 12px; font-weight: 600; color: #71717A; }");
        sb.append("</style></head><body>");

        sb.append("<div class='container'>");
        sb.append("<div class='header'>");
        sb.append("<div class='badge'>Rotina de Estudo Diário</div>");
        sb.append("<h1 class='title'>Caixa de Repertório</h1>");
        sb.append("<p class='subtitle'>Treino balanceado para <b>").append(dateStr).append("</b> • Mantenha os grooves afiados!</p>");
        sb.append("</div>");

        sb.append("<div class='content'>");

        if (artistNames != null && !artistNames.isEmpty()) {
            String expStr = expiresAt != null ? expiresAt.format(DateTimeFormatter.ofPattern("dd/MM")) : "domingo";
            sb.append("<div class='focus-banner'>");
            sb.append("<div style='font-weight: 900; font-size: 13px; text-transform: uppercase; color: #161616; display: flex; align-items: center; gap: 6px;'>");
            sb.append("🎯 FOCO SEMANAL ATIVO: ").append(String.join(" • ", artistNames));
            sb.append("</div>");
            sb.append("<div style='font-size: 11px; font-weight: 600; color: #52525B; margin-top: 3px;'>");
            sb.append("Sugestões filtradas exclusivamente para os shows desta semana. Válido até domingo (").append(expStr).append("), quando retornará ao modo Geral.");
            sb.append("</div>");
            sb.append("</div>");
        }

        sb.append("<p style='font-size: 14px; font-weight: 600; margin-bottom: 20px;'>Aqui estão as 5 faixas selecionadas estrategicamente para o seu estudo de hoje:</p>");

        for (int i = 0; i < songs.size(); i++) {
            Song s = songs.get(i);
            String drill = getDrillTypeForLevel(s.getMasteryLevel());
            String origKey = s.getOriginalKey() != null ? s.getOriginalKey() : "C";
            String genre = s.getGenre() != null ? s.getGenre() : "Geral";

            // Check artist performance key
            Map<String, String> linkInfo = getArtistLinkForSong(s.getId(), null);
            String displayKey = linkInfo.getOrDefault("performanceKey", origKey);
            String artistName = linkInfo.get("artistName");

            String levelColor = "#FF6B00";
            String levelBg = "#FFEDD5";
            if (s.getMasteryLevel() != null && s.getMasteryLevel() >= 4) {
                levelColor = "#161616";
                levelBg = "#D4FF00";
            }

            sb.append("<div class='song-card'>");
            sb.append("<table width='100%' style='border-collapse: collapse;'><tr>");
            sb.append("<td>");
            sb.append("<div class='song-title'>").append(i + 1).append(". ").append(s.getTitle()).append("</div>");
            sb.append("<div class='song-composer'>").append(s.getComposer() != null ? s.getComposer() : "Compositor não informado").append(" • ").append(genre);
            if (artistName != null && !artistName.isBlank()) {
                sb.append(" <b style='color: #161616;'>[🎤 ").append(artistName).append("]</b>");
            }
            sb.append("</div>");
            sb.append("</td>");
            sb.append("<td align='right'>");
            sb.append("<span class='key-badge'>Tom: ").append(displayKey).append("</span>");
            sb.append("</td></tr></table>");

            sb.append("<div style='margin-top: 8px;'>");
            sb.append("<span class='level-badge' style='background: ").append(levelBg).append("; color: ").append(levelColor).append("; border: 1.5px solid #161616;'>Domínio Nível ").append(s.getMasteryLevel() != null ? s.getMasteryLevel() : 3).append("/5</span>");
            if (s.getTempoBpm() != null) {
                sb.append("<span style='font-size: 11px; font-weight: 700; color: #71717A;'>• ").append(s.getTempoBpm()).append(" BPM</span>");
            }
            sb.append("</div>");

            sb.append("<div class='drill-box'>");
            sb.append("<div class='drill-label'>🎯 Foco do Exercício:</div>");
            sb.append("<div>").append(drill).append("</div>");
            sb.append("</div>");

            sb.append("</div>");
        }

        sb.append("</div>");

        sb.append("<div class='footer'>");
        sb.append("💡 <i>Dica do Dia: Pratique sempre com metrônomo e priorize precisão rítmica antes de velocidade.</i><br/><br/>");
        sb.append("© Caixa de Repertório • Estúdio de Repertório & Gigs");
        sb.append("</div>");
        sb.append("</div>");
        sb.append("</body></html>");

        return sb.toString();
    }
}
