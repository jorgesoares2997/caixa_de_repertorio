package com.gigmanager.service;

import com.gigmanager.domain.DailyPracticeLog;
import com.gigmanager.domain.Song;
import com.gigmanager.repository.DailyPracticeLogRepository;
import com.gigmanager.repository.SongRepository;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class DailyPracticeScheduler {

    private final SongRepository songRepository;
    private final DailyPracticeLogRepository practiceLogRepository;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:jorgesoares2997@gmail.com}")
    private String mailFrom;

    public DailyPracticeScheduler(
            SongRepository songRepository,
            DailyPracticeLogRepository practiceLogRepository,
            JavaMailSender mailSender
    ) {
        this.songRepository = songRepository;
        this.practiceLogRepository = practiceLogRepository;
        this.mailSender = mailSender;
    }

    public List<Song> getTodayPracticeSongs() {
        List<Song> practiceList = new ArrayList<>();
        // 2 songs level 1-2 (Dense Acquisition / learning)
        practiceList.addAll(songRepository.findRandomSongsByMasteryLevels(List.of(1, 2), 2));
        // 2 songs level 3-4 (Technical maintenance / polishing)
        practiceList.addAll(songRepository.findRandomSongsByMasteryLevels(List.of(3, 4), 2));
        // 1 song level 5 (Language maintenance / mastery)
        practiceList.addAll(songRepository.findRandomSongsByMasteryLevels(List.of(5), 1));

        // If list is small due to distribution, complete with random
        if (practiceList.size() < 5) {
            List<Song> fallback = songRepository.findRandomSongsByMasteryLevels(List.of(1, 2, 3, 4, 5), 5 - practiceList.size());
            for (Song s : fallback) {
                if (!practiceList.contains(s)) {
                    practiceList.add(s);
                }
            }
        }
        return practiceList;
    }

    public String getDrillTypeForLevel(Integer level) {
        if (level == null) return "Prática geral: leitura da forma e execução com metrônomo.";
        if (level <= 2) return "Aquisição Densa: escuta ativa da gravação original, mapa da forma e leitura cuidadosa da harmonia/cifra.";
        if (level <= 4) return "Manutenção Técnica: toque sem olhar a cifra, transporte mentalmente para tons vizinhos e teste variações de levada/groove.";
        return "Manutenção de Linguagem: crie uma introdução autoral, rearmonize trechos e pratique solos/linhas melódicas improvisadas.";
    }

    // Disparo automático programado: padrão às 08:00 todos os dias (customizável via app.practice.cron)
    @Scheduled(cron = "${app.practice.cron:0 0 8 * * *}")
    public void scheduleDailyPractice() {
        sendDailyPracticeEmail(mailFrom);
    }

    public boolean sendDailyPracticeEmail(String recipientEmail) {
        List<Song> practiceList = getTodayPracticeSongs();
        if (practiceList.isEmpty()) {
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

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(mailFrom, "Caixa de Repertório");
            helper.setTo(targetEmail);
            helper.setSubject("🎸 Rotina de Estudo Diário • " + formattedDate);

            String htmlContent = buildHtmlEmail(practiceList, formattedDate);
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
            System.out.println("[DailyPracticeScheduler] Successfully sent daily practice email to " + targetEmail);
            return true;
        } catch (Exception e) {
            System.err.println("[DailyPracticeScheduler] Failed to send email to " + targetEmail + ": " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    private String buildHtmlEmail(List<Song> songs, String dateStr) {
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
        sb.append(".song-card { background: #F4F4F5; border: 2px solid #161616; border-radius: 14px; padding: 16px; margin-bottom: 16px; box-shadow: 3px 3px 0px #161616; }");
        sb.append(".song-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }");
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
        sb.append("<p style='font-size: 14px; font-weight: 600; margin-bottom: 20px;'>Aqui estão as 5 faixas selecionadas estrategicamente para o seu estudo de hoje:</p>");

        for (int i = 0; i < songs.size(); i++) {
            Song s = songs.get(i);
            String drill = getDrillTypeForLevel(s.getMasteryLevel());
            String key = s.getOriginalKey() != null ? s.getOriginalKey() : "C";
            String genre = s.getGenre() != null ? s.getGenre() : "Geral";

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
            sb.append("<div class='song-composer'>").append(s.getComposer() != null ? s.getComposer() : "Compositor não informado").append(" • ").append(genre).append("</div>");
            sb.append("</td>");
            sb.append("<td align='right'>");
            sb.append("<span class='key-badge'>Tom: ").append(key).append("</span>");
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
