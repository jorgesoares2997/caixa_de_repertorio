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
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class DailyPracticeScheduler {

    private final SongRepository songRepository;
    private final DailyPracticeLogRepository practiceLogRepository;
    private final JavaMailSender mailSender;
    private final RestTemplate restTemplate;

    @Value("${evolution-api.url}")
    private String evolutionApiUrl;

    @Value("${evolution-api.apikey}")
    private String evolutionApiKey;

    @Value("${evolution-api.instance}")
    private String evolutionApiInstance;

    @Value("${evolution-api.target-number}")
    private String targetNumber;

    @Value("${spring.mail.username}")
    private String mailFrom;

    public DailyPracticeScheduler(SongRepository songRepository,
                                  DailyPracticeLogRepository practiceLogRepository,
                                  JavaMailSender mailSender) {
        this.songRepository = songRepository;
        this.practiceLogRepository = practiceLogRepository;
        this.mailSender = mailSender;
        this.restTemplate = new RestTemplate();
    }

    // Cron expression for 7 AM from Monday to Friday
    @Scheduled(cron = "0 0 7 * * MON-FRI")
    public void scheduleDailyPractice() {
        List<Song> practiceList = new ArrayList<>();

        // 2 songs with mastery_level 1 or 2
        practiceList.addAll(songRepository.findRandomSongsByMasteryLevels(List.of(1, 2), 2));

        // 2 songs with mastery_level 3 or 4
        practiceList.addAll(songRepository.findRandomSongsByMasteryLevels(List.of(3, 4), 2));

        // 1 song with mastery_level 5
        practiceList.addAll(songRepository.findRandomSongsByMasteryLevels(List.of(5), 1));

        if (practiceList.isEmpty()) {
            return;
        }

        StringBuilder messageBuilder = new StringBuilder();
        messageBuilder.append("🎵 *Daily Practice Routine* 🎵\n\n");
        messageBuilder.append("Here is your study plan for today:\n\n");

        for (int i = 0; i < practiceList.size(); i++) {
            Song song = practiceList.get(i);
            String drillType = getDrillTypeForLevel(song.getMasteryLevel());
            
            messageBuilder.append((i + 1)).append(". *").append(song.getTitle()).append("*\n");
            messageBuilder.append("   - Composer: ").append(song.getComposer() != null ? song.getComposer() : "Unknown").append("\n");
            messageBuilder.append("   - Level: ").append(song.getMasteryLevel()).append("\n");
            messageBuilder.append("   - Drill: ").append(drillType).append("\n\n");

            DailyPracticeLog log = DailyPracticeLog.builder()
                    .song(song)
                    .practiceDate(LocalDate.now())
                    .drillType(drillType)
                    .completed(false)
                    .build();
            practiceLogRepository.save(log);
        }

        String finalMessage = messageBuilder.toString();

        sendWhatsAppMessage(finalMessage);
        sendEmail(finalMessage);
    }

    private String getDrillTypeForLevel(Integer level) {
        if (level == null) return "General practice";
        if (level <= 2) return "Dense acquisition: focus on listening + chart/form reading.";
        if (level <= 4) return "Technical maintenance: play without chart, transpose to neighboring keys.";
        return "Language maintenance: create intro/improvised solo over harmony.";
    }

    private void sendWhatsAppMessage(String message) {
        try {
            String url = evolutionApiUrl + "/message/sendText/" + evolutionApiInstance;
            Map<String, Object> body = Map.of(
                    "number", targetNumber,
                    "options", Map.of("delay", 1200, "presence", "composing"),
                    "textMessage", Map.of("text", message)
            );
            
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("apikey", evolutionApiKey);
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            
            org.springframework.http.HttpEntity<Map<String, Object>> entity = new org.springframework.http.HttpEntity<>(body, headers);
            
            restTemplate.postForEntity(url, entity, String.class);
        } catch (Exception e) {
            System.err.println("Failed to send WhatsApp message: " + e.getMessage());
        }
    }

    private void sendEmail(String message) {
        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setFrom(mailFrom);
            mailMessage.setTo(mailFrom); // Sending to self
            mailMessage.setSubject("Daily Practice Routine - " + LocalDate.now());
            mailMessage.setText(message.replace("*", "")); // Remove markdown asterisks for plain text email
            
            mailSender.send(mailMessage);
        } catch (Exception e) {
            System.err.println("Failed to send email: " + e.getMessage());
        }
    }
}
