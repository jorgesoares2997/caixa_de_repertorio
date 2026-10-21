package com.gigmanager.controller;

import com.gigmanager.domain.Representative;
import com.gigmanager.domain.RepresentativeSong;
import com.gigmanager.domain.Song;
import com.gigmanager.domain.SongMasteryHistory;
import com.gigmanager.repository.RepresentativeRepository;
import com.gigmanager.repository.RepresentativeSongRepository;
import com.gigmanager.repository.SongMasteryHistoryRepository;
import com.gigmanager.repository.SongRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    private final SongRepository songRepository;
    private final RepresentativeRepository representativeRepository;
    private final RepresentativeSongRepository representativeSongRepository;
    private final SongMasteryHistoryRepository masteryHistoryRepository;

    private static final String[] GENRE_COLORS = {
            "#D4FF00", // lime
            "#E9D5FF", // lavender
            "#FF6B00", // orange
            "#FF0055", // cherry
            "#38BDF8", // sky
            "#34D399", // emerald
            "#FCD34D", // amber
            "#A78BFA", // violet
            "#F472B6", // pink
            "#94A3B8"  // slate
    };

    public AnalyticsController(
            SongRepository songRepository,
            RepresentativeRepository representativeRepository,
            RepresentativeSongRepository representativeSongRepository,
            SongMasteryHistoryRepository masteryHistoryRepository
    ) {
        this.songRepository = songRepository;
        this.representativeRepository = representativeRepository;
        this.representativeSongRepository = representativeSongRepository;
        this.masteryHistoryRepository = masteryHistoryRepository;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardAnalytics(
            @RequestParam(defaultValue = "month") String period
    ) {
        List<Song> allSongs = songRepository.findAll();
        List<Representative> allReps = representativeRepository.findAll();
        List<RepresentativeSong> allRepSongs = representativeSongRepository.findAll();

        Map<String, Object> response = new HashMap<>();

        // 1. ARTIST STATS: "quantas músicas eu sei de cada um dos projetos registrados"
        Map<UUID, List<RepresentativeSong>> repSongsByRepId = allRepSongs.stream()
                .filter(rs -> rs.getRepresentative() != null && rs.getRepresentative().getId() != null)
                .collect(Collectors.groupingBy(rs -> rs.getRepresentative().getId()));

        List<Map<String, Object>> artistStats = new ArrayList<>();
        for (Representative rep : allReps) {
            List<RepresentativeSong> links = repSongsByRepId.getOrDefault(rep.getId(), Collections.emptyList());
            List<Song> songsForRep = links.stream()
                    .map(RepresentativeSong::getSong)
                    .filter(Objects::nonNull)
                    .toList();

            int total = songsForRep.size();
            long lvl5 = songsForRep.stream().filter(s -> s.getMasteryLevel() != null && s.getMasteryLevel() == 5).count();
            long lvl4 = songsForRep.stream().filter(s -> s.getMasteryLevel() != null && s.getMasteryLevel() == 4).count();
            long lvl3 = songsForRep.stream().filter(s -> s.getMasteryLevel() != null && s.getMasteryLevel() == 3).count();
            long lvl2 = songsForRep.stream().filter(s -> s.getMasteryLevel() != null && s.getMasteryLevel() == 2).count();
            long lvl1 = songsForRep.stream().filter(s -> s.getMasteryLevel() != null && s.getMasteryLevel() == 1).count();

            double avgMastery = songsForRep.isEmpty() ? 0.0 : songsForRep.stream()
                    .mapToInt(s -> s.getMasteryLevel() != null ? s.getMasteryLevel() : 3)
                    .average().orElse(0.0);

            Map<String, Object> repMap = new HashMap<>();
            repMap.put("representativeId", rep.getId());
            repMap.put("artistId", rep.getId());
            repMap.put("representativeName", rep.getName());
            repMap.put("artistName", rep.getName());
            repMap.put("type", rep.getType() != null ? rep.getType().toString() : "OTHER");
            repMap.put("artistType", rep.getType() != null ? rep.getType().toString() : "OTHER");
            repMap.put("totalSongs", total);
            repMap.put("averageMastery", Math.round(avgMastery * 10.0) / 10.0);
            repMap.put("level5Count", lvl5);
            repMap.put("level4Count", lvl4);
            repMap.put("level3Count", lvl3);
            repMap.put("level2Count", lvl2);
            repMap.put("level1Count", lvl1);
            repMap.put("levelBreakdown", Map.of(
                    "5", lvl5,
                    "4", lvl4,
                    "3", lvl3,
                    "2", lvl2,
                    "1", lvl1
            ));
            repMap.put("masteredCount", lvl5 + lvl4);
            repMap.put("masteredPercentage", total > 0 ? Math.round(((lvl5 + lvl4) * 100.0) / total) : 0);

            artistStats.add(repMap);
        }

        // Sort artists by total songs descending
        artistStats.sort((a, b) -> Integer.compare((Integer) b.get("totalSongs"), (Integer) a.get("totalSongs")));
        response.put("artistStats", artistStats);

        // 2. GENRE STATS: distribuição por estilo musical
        Map<String, List<Song>> songsByGenre = allSongs.stream()
                .collect(Collectors.groupingBy(s -> (s.getGenre() != null && !s.getGenre().isBlank()) ? s.getGenre().trim() : "Geral"));

        List<Map<String, Object>> genreStats = new ArrayList<>();
        int totalAllSongs = allSongs.size();
        int colorIdx = 0;

        for (Map.Entry<String, List<Song>> entry : songsByGenre.entrySet()) {
            String gName = entry.getKey();
            List<Song> songs = entry.getValue();
            int count = songs.size();
            long lvl5 = songs.stream().filter(s -> s.getMasteryLevel() != null && s.getMasteryLevel() == 5).count();
            double avg = songs.stream()
                    .mapToInt(s -> s.getMasteryLevel() != null ? s.getMasteryLevel() : 3)
                    .average().orElse(0.0);

            double percentage = totalAllSongs > 0 ? Math.round((count * 100.0) / totalAllSongs * 10.0) / 10.0 : 0.0;

            Map<String, Object> gMap = new HashMap<>();
            gMap.put("genre", gName);
            gMap.put("count", count);
            gMap.put("percentage", percentage);
            gMap.put("averageMastery", Math.round(avg * 10.0) / 10.0);
            gMap.put("level5Count", lvl5);
            gMap.put("color", GENRE_COLORS[colorIdx % GENRE_COLORS.length]);
            colorIdx++;

            genreStats.add(gMap);
        }

        // Sort genres by count descending
        genreStats.sort((a, b) -> Integer.compare((Integer) b.get("count"), (Integer) a.get("count")));
        response.put("genreStats", genreStats);

        // 3. TOP MASTERED GENRE: "balanço do estilo musical que eu mais domino"
        Map<String, Object> topMastered = null;
        double highestMastery = -1.0;

        for (Map<String, Object> gMap : genreStats) {
            int count = (Integer) gMap.get("count");
            double avg = (Double) gMap.get("averageMastery");

            // Look for genres with at least 3 songs for statistical significance
            if (count >= 3 && avg > highestMastery) {
                highestMastery = avg;
                topMastered = gMap;
            }
        }

        if (topMastered == null && !genreStats.isEmpty()) {
            topMastered = genreStats.get(0);
        }

        Map<String, Object> topMasteredInfo = new HashMap<>();
        if (topMastered != null) {
            topMasteredInfo.put("genre", topMastered.get("genre"));
            topMasteredInfo.put("averageMastery", topMastered.get("averageMastery"));
            topMasteredInfo.put("totalSongs", topMastered.get("count"));
            topMasteredInfo.put("level5Count", topMastered.get("level5Count"));
            topMasteredInfo.put("color", topMastered.get("color"));
            topMasteredInfo.put("summary", "Seu estilo com maior consistência técnica e prontidão para o palco.");
        }
        response.put("topMasteredGenre", topMasteredInfo);

        // 4. EVOLUTION STATS: "quais músicas evoluíram no último ano, mês ou semana"
        LocalDateTime cutoff;
        if ("week".equalsIgnoreCase(period)) {
            cutoff = LocalDateTime.now().minusDays(7);
        } else if ("year".equalsIgnoreCase(period)) {
            cutoff = LocalDateTime.now().minusDays(365);
        } else if ("all".equalsIgnoreCase(period)) {
            cutoff = LocalDateTime.of(2000, 1, 1, 0, 0);
        } else {
            // Default "month"
            cutoff = LocalDateTime.now().minusDays(30);
        }

        List<SongMasteryHistory> histories = masteryHistoryRepository.findRecentEvolutions(cutoff);
        List<Map<String, Object>> evolvedSongs = new ArrayList<>();
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

        // Map to quickly look up artist name by song id
        Map<UUID, String> repNameBySongId = allRepSongs.stream()
                .filter(rs -> rs.getSong() != null && rs.getSong().getId() != null && rs.getRepresentative() != null)
                .collect(Collectors.toMap(
                        rs -> rs.getSong().getId(),
                        rs -> rs.getRepresentative().getName(),
                        (existing, replacement) -> existing
                ));

        for (SongMasteryHistory h : histories) {
            Song s = h.getSong();
            if (s == null) continue;

            Map<String, Object> item = new HashMap<>();
            item.put("historyId", h.getId());
            item.put("songId", s.getId());
            item.put("title", s.getTitle());
            item.put("composer", s.getComposer());
            item.put("genre", s.getGenre() != null ? s.getGenre() : "Geral");
            item.put("artistName", s.getId() != null ? repNameBySongId.get(s.getId()) : null);
            item.put("previousLevel", h.getPreviousLevel() != null ? h.getPreviousLevel() : 1);
            item.put("newLevel", h.getNewLevel());
            item.put("levelGain", h.getNewLevel() - (h.getPreviousLevel() != null ? h.getPreviousLevel() : 1));
            item.put("changedAt", h.getChangedAt().format(dtf));
            item.put("rawDate", h.getChangedAt().toString());

            evolvedSongs.add(item);
        }

        // Build chart timeline buckets according to period
        List<Map<String, Object>> timeline = buildTimeline(histories, period);

        Map<String, Object> evolutionStats = new HashMap<>();
        evolutionStats.put("period", period);
        evolutionStats.put("totalEvolved", evolvedSongs.size());
        evolutionStats.put("timeline", timeline);
        evolutionStats.put("evolvedSongs", evolvedSongs);

        response.put("evolutionStats", evolutionStats);

        // General overall readiness summary
        long readyCount = allSongs.stream().filter(s -> s.getMasteryLevel() != null && s.getMasteryLevel() >= 4).count();
        response.put("overallReadiness", Map.of(
                "totalSongs", totalAllSongs,
                "readyForStageCount", readyCount,
                "readyPercentage", totalAllSongs > 0 ? Math.round((readyCount * 100.0) / totalAllSongs) : 0
        ));

        return ResponseEntity.ok(response);
    }

    private List<Map<String, Object>> buildTimeline(List<SongMasteryHistory> histories, String period) {
        List<Map<String, Object>> timeline = new ArrayList<>();
        DateTimeFormatter dayFmt = DateTimeFormatter.ofPattern("dd/MM");

        if ("week".equalsIgnoreCase(period)) {
            // 7 daily points for the last 7 days
            LocalDate today = LocalDate.now();
            for (int i = 6; i >= 0; i--) {
                LocalDate targetDate = today.minusDays(i);
                long count = histories.stream()
                        .filter(h -> h.getChangedAt().toLocalDate().isEqual(targetDate))
                        .count();

                timeline.add(Map.of(
                        "label", targetDate.format(dayFmt),
                        "count", count
                ));
            }
        } else if ("year".equalsIgnoreCase(period)) {
            // 12 monthly points
            DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("MMM/yy", new Locale("pt", "BR"));
            LocalDate today = LocalDate.now();
            for (int i = 11; i >= 0; i--) {
                LocalDate targetMonth = today.minusMonths(i);
                long count = histories.stream()
                        .filter(h -> h.getChangedAt().getYear() == targetMonth.getYear() &&
                                     h.getChangedAt().getMonth() == targetMonth.getMonth())
                        .count();

                timeline.add(Map.of(
                        "label", targetMonth.format(monthFmt),
                        "count", count
                ));
            }
        } else {
            // Month: 6 interval buckets of 5 days each
            LocalDate today = LocalDate.now();
            for (int i = 5; i >= 0; i--) {
                LocalDate start = today.minusDays((i + 1) * 5L);
                LocalDate end = today.minusDays(i * 5L);
                long count = histories.stream()
                        .filter(h -> {
                            LocalDate d = h.getChangedAt().toLocalDate();
                            return !d.isBefore(start) && !d.isAfter(end);
                        })
                        .count();

                timeline.add(Map.of(
                        "label", end.format(dayFmt),
                        "count", count
                ));
            }
        }

        return timeline;
    }
}
