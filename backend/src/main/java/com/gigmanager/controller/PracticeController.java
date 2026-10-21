package com.gigmanager.controller;

import com.gigmanager.domain.Representative;
import com.gigmanager.domain.Song;
import com.gigmanager.domain.WeeklyPracticeConfig;
import com.gigmanager.repository.RepresentativeRepository;
import com.gigmanager.service.DailyPracticeScheduler;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/practice")
@CrossOrigin(origins = "*")
public class PracticeController {

    private final DailyPracticeScheduler practiceScheduler;
    private final RepresentativeRepository representativeRepository;

    public PracticeController(DailyPracticeScheduler practiceScheduler, RepresentativeRepository representativeRepository) {
        this.practiceScheduler = practiceScheduler;
        this.representativeRepository = representativeRepository;
    }

    @GetMapping("/today")
    public ResponseEntity<Map<String, Object>> getTodayPractice(
            @RequestParam(required = false) List<UUID> representativeIds
    ) {
        List<Song> songs = practiceScheduler.getTodayPracticeSongs(representativeIds);

        // Active filter reference
        List<UUID> activeFilterIds = (representativeIds != null && !representativeIds.isEmpty())
                ? representativeIds
                : practiceScheduler.getActiveWeeklyRepresentativeIds();

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

            Map<String, String> artistInfo = practiceScheduler.getArtistLinkForSong(s.getId(), activeFilterIds);
            map.put("performanceKey", artistInfo.getOrDefault("performanceKey", s.getOriginalKey()));
            map.put("artistName", artistInfo.get("artistName"));
            return map;
        }).toList();

        Map<String, Object> response = new HashMap<>();
        response.put("total", items.size());
        response.put("songs", items);
        response.put("activeFocus", buildActiveFocusMap());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getPracticeConfig() {
        return ResponseEntity.ok(buildActiveFocusMap());
    }

    @PostMapping("/config")
    public ResponseEntity<Map<String, Object>> savePracticeConfig(@RequestBody Map<String, Object> body) {
        List<UUID> repIds = new ArrayList<>();
        if (body != null && body.containsKey("representativeIds")) {
            Object raw = body.get("representativeIds");
            if (raw instanceof List<?> list) {
                for (Object item : list) {
                    if (item != null && !item.toString().isBlank()) {
                        try {
                            repIds.add(UUID.fromString(item.toString().trim()));
                        } catch (IllegalArgumentException ignored) {}
                    }
                }
            }
        }

        practiceScheduler.saveWeeklyFocus(repIds);
        return ResponseEntity.ok(buildActiveFocusMap());
    }

    @PostMapping("/send-email")
    public ResponseEntity<Map<String, Object>> sendDailyEmail(@RequestBody(required = false) Map<String, Object> body) {
        String email = null;
        List<UUID> repIds = new ArrayList<>();

        if (body != null) {
            if (body.get("email") != null) {
                email = body.get("email").toString().trim();
            }
            if (body.containsKey("representativeIds")) {
                Object raw = body.get("representativeIds");
                if (raw instanceof List<?> list) {
                    for (Object item : list) {
                        if (item != null && !item.toString().isBlank()) {
                            try {
                                repIds.add(UUID.fromString(item.toString().trim()));
                            } catch (IllegalArgumentException ignored) {}
                        }
                    }
                }
            }
        }

        boolean success = practiceScheduler.sendDailyPracticeEmail(email, repIds.isEmpty() ? null : repIds);

        if (success) {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Rotina de estudo enviada com sucesso para o e-mail!"
            ));
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Não foi possível enviar o e-mail. Verifique o endereço e a conexão SMTP."
            ));
        }
    }

    private Map<String, Object> buildActiveFocusMap() {
        Optional<WeeklyPracticeConfig> opt = practiceScheduler.getActiveWeeklyConfig();
        Map<String, Object> map = new HashMap<>();

        if (opt.isEmpty()) {
            map.put("isWeeklyActive", false);
            map.put("representativeIds", Collections.emptyList());
            map.put("representativeNames", Collections.emptyList());
            map.put("expiresAt", null);
            return map;
        }

        WeeklyPracticeConfig cfg = opt.get();
        List<UUID> repIds = practiceScheduler.getActiveWeeklyRepresentativeIds();
        List<String> names = new ArrayList<>();

        if (!repIds.isEmpty()) {
            List<Representative> reps = representativeRepository.findAllById(repIds);
            for (Representative r : reps) {
                names.add(r.getName());
            }
        }

        map.put("isWeeklyActive", !names.isEmpty());
        map.put("representativeIds", repIds.stream().map(UUID::toString).toList());
        map.put("representativeNames", names);
        map.put("expiresAt", cfg.getExpiresAt() != null ? cfg.getExpiresAt().toString() : null);
        return map;
    }
}
