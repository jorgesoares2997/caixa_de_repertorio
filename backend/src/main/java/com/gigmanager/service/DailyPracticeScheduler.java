package com.gigmanager.service;

import com.gigmanager.domain.DailyPracticeLog;
import com.gigmanager.domain.Song;
import com.gigmanager.repository.DailyPracticeLogRepository;
import com.gigmanager.repository.SongRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class DailyPracticeScheduler {

    private final SongRepository songRepository;
    private final DailyPracticeLogRepository practiceLogRepository;
    private final JavaMailSender mailSender;
    private final WhatsAppService whatsAppService;

    @Value("${evolution-api.target-number}")
    private String targetNumber;

    @Value("${spring.mail.username}")
    private String mailFrom;

    public DailyPracticeScheduler(SongRepository songRepository,
                                  DailyPracticeLogRepository practiceLogRepository,
                                  JavaMailSender mailSender,
                                  WhatsAppService whatsAppService) {
        this.songRepository = songRepository;
        this.practiceLogRepository = practiceLogRepository;
        this.mailSender = mailSender;
        this.whatsAppService = whatsAppService;
    }

    @Scheduled(cron = "0 0 7 * * MON-FRI")
    public void scheduleDailyPractice() {
        List<Song> practiceList = new ArrayList<>();
        practiceList.addAll(songRepository.findRandomSongsByMasteryLevels(List.of(1, 2), 2));
        practiceList.addAll(songRepository.findRandomSongsByMasteryLevels(List.of(3, 4), 2));
        practiceList.addAll(songRepository.findRandomSongsByMasteryLevels(List.of(5), 1));

        if (practiceList.isEmpty()) return;

        StringBuilder sb = new StringBuilder();
        sb.append("🎵 *Rotina de Estudo Diário* 🎵\n\n");
        sb.append("Seu plano de estudo para hoje:\n\n");

        for (int i = 0; i < practiceList.size(); i++) {
            Song song = practiceList.get(i);
            String drillType = getDrillTypeForLevel(song.getMasteryLevel());

            sb.append(i + 1).append(". *").append(song.getTitle()).append("*\n");
            sb.append("   - Compositor: ").append(song.getComposer() != null ? song.getComposer() : "Desconhecido").append("\n");
            sb.append("   - Nível: ").append(song.getMasteryLevel()).append("\n");
            sb.append("   - Drill: ").append(drillType).append("\n\n");

            DailyPracticeLog log = DailyPracticeLog.builder()
                    .song(song)
                    .practiceDate(LocalDate.now())
                    .drillType(drillType)
                    .completed(false)
                    .build();
            practiceLogRepository.save(log);
        }

        String message = sb.toString();
        whatsAppService.sendMessage(targetNumber, message);
        sendEmail(message);
    }

    private String getDrillTypeForLevel(Integer level) {
        if (level == null) return "Prática geral";
        if (level <= 2) return "Aquisição densa: escuta ativa + leitura da forma/cifra.";
        if (level <= 4) return "Manutenção técnica: toque sem cifra, transporte para tons vizinhos.";
        return "Manutenção de linguagem: crie intro ou solo improvisado sobre a harmonia.";
    }

    private void sendEmail(String message) {
        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setFrom(mailFrom);
            mailMessage.setTo(mailFrom);
            mailMessage.setSubject("Rotina de Estudo - " + LocalDate.now());
            mailMessage.setText(message.replace("*", ""));
            mailSender.send(mailMessage);
        } catch (Exception e) {
            System.err.println("[DailyPracticeScheduler] Failed to send email: " + e.getMessage());
        }
    }
}
