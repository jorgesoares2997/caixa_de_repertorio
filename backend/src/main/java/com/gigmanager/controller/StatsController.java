package com.gigmanager.controller;

import com.gigmanager.repository.GigRepository;
import com.gigmanager.repository.SongRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
@CrossOrigin(origins = "*")
public class StatsController {

    private final SongRepository songRepository;
    private final GigRepository gigRepository;

    public StatsController(SongRepository songRepository, GigRepository gigRepository) {
        this.songRepository = songRepository;
        this.gigRepository = gigRepository;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getStats() {
        long totalSongs = songRepository.count();
        long level5Songs = songRepository.findAll().stream()
                .filter(s -> s.getMasteryLevel() != null && s.getMasteryLevel() == 5)
                .count();

        LocalDateTime now = LocalDateTime.now();
        var upcomingGigs = gigRepository.findAll().stream()
                .filter(g -> g.getEventDate() != null && g.getEventDate().isAfter(now))
                .sorted((a, b) -> a.getEventDate().compareTo(b.getEventDate()))
                .toList();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalSongs", totalSongs);
        stats.put("level5Songs", level5Songs);
        stats.put("upcomingGigs", upcomingGigs.size());

        if (!upcomingGigs.isEmpty()) {
            var next = upcomingGigs.get(0);
            stats.put("nextGigTitle", next.getTitle());
            stats.put("nextGigDate", next.getEventDate()
                    .format(DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH'h'mm")));
            stats.put("nextGigVenue", next.getVenue());
        } else {
            stats.put("nextGigTitle", null);
            stats.put("nextGigDate", null);
            stats.put("nextGigVenue", null);
        }

        return ResponseEntity.ok(stats);
    }
}
