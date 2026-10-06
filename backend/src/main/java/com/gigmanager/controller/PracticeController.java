package com.gigmanager.controller;

import com.gigmanager.domain.Song;
import com.gigmanager.service.DailyPracticeScheduler;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/practice")
@CrossOrigin(origins = "*")
public class PracticeController {

    private final DailyPracticeScheduler practiceScheduler;

    public PracticeController(DailyPracticeScheduler practiceScheduler) {
        this.practiceScheduler = practiceScheduler;
    }

    @GetMapping("/today")
    public ResponseEntity<Map<String, Object>> getTodayPractice() {
        List<Song> songs = practiceScheduler.getTodayPracticeSongs();
        List<Map<String, Object>> items = songs.stream().map(s -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", s.getId());
            map.put("title", s.getTitle());
            map.put("composer", s.getComposer());
            map.put("genre", s.getGenre());
            map.put("originalKey", s.getOriginalKey());
            map.put("masteryLevel", s.getMasteryLevel());
            map.put("tempoBpm", s.getTempoBpm());
            map.put("drill", practiceScheduler.getDrillTypeForLevel(s.getMasteryLevel()));
            return map;
        }).toList();

        return ResponseEntity.ok(Map.of(
                "total", items.size(),
                "songs", items
        ));
    }

    @PostMapping("/send-email")
    public ResponseEntity<Map<String, Object>> sendDailyEmail(@RequestBody(required = false) Map<String, String> body) {
        String email = body != null ? body.get("email") : null;
        boolean success = practiceScheduler.sendDailyPracticeEmail(email);

        if (success) {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Rotina de estudo enviada com sucesso para o e-mail!"
            ));
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Não foi possível enviar o e-mail. Verifique as credenciais SMTP."
            ));
        }
    }
}
