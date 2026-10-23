package com.gigmanager.controller;

import com.gigmanager.domain.CustomGenre;
import com.gigmanager.domain.Song;
import com.gigmanager.repository.CustomGenreRepository;
import com.gigmanager.repository.SongRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/genres")
@CrossOrigin(origins = "*")
public class GenreController {

    private final CustomGenreRepository customGenreRepository;
    private final SongRepository songRepository;

    // Palette for assigning cohesive colors to genres
    private static final String[] PALETTE = {
            "#D4FF00", // lime
            "#E9D5FF", // lavender
            "#FF6B00", // orange
            "#FF0055", // cherry
            "#38BDF8", // sky
            "#34D399", // emerald
            "#FCD34D", // amber
            "#A78BFA", // violet
            "#F472B6"  // pink
    };

    public GenreController(CustomGenreRepository customGenreRepository, SongRepository songRepository) {
        this.customGenreRepository = customGenreRepository;
        this.songRepository = songRepository;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllGenres() {
        List<Song> allSongs = songRepository.findAll();
        List<CustomGenre> customList = customGenreRepository.findAll();

        Map<String, CustomGenre> customByName = new HashMap<>();
        for (CustomGenre cg : customList) {
            customByName.put(cg.getName().trim().toLowerCase(), cg);
        }

        // Group songs by trimmed lowercase genre
        Map<String, List<Song>> songsByGenre = new HashMap<>();
        for (Song s : allSongs) {
            String g = (s.getGenre() != null && !s.getGenre().isBlank()) ? s.getGenre().trim() : "Geral";
            songsByGenre.computeIfAbsent(g, k -> new ArrayList<>()).add(s);
        }

        // Also ensure every custom genre is present in map even if 0 songs yet
        for (CustomGenre cg : customList) {
            songsByGenre.putIfAbsent(cg.getName().trim(), new ArrayList<>());
        }

        List<Map<String, Object>> result = new ArrayList<>();
        int colorIdx = 0;

        for (Map.Entry<String, List<Song>> entry : songsByGenre.entrySet()) {
            String genreName = entry.getKey();
            List<Song> songs = entry.getValue();
            CustomGenre custom = customByName.get(genreName.toLowerCase());

            int count = songs.size();
            long lvl5 = songs.stream().filter(s -> s.getMasteryLevel() != null && s.getMasteryLevel() == 5).count();
            double avg = songs.isEmpty() ? 0.0 : songs.stream()
                    .mapToInt(s -> s.getMasteryLevel() != null ? s.getMasteryLevel() : 3)
                    .average().orElse(0.0);

            String color = (custom != null && custom.getColor() != null && !custom.getColor().isBlank())
                    ? custom.getColor()
                    : PALETTE[Math.abs(genreName.hashCode()) % PALETTE.length];

            Map<String, Object> map = new HashMap<>();
            map.put("id", custom != null ? custom.getId() : null);
            map.put("name", genreName);
            map.put("count", count);
            map.put("level5Count", lvl5);
            map.put("averageMastery", Math.round(avg * 10.0) / 10.0);
            map.put("color", color);
            map.put("isCustom", custom != null);

            result.add(map);
        }

        // Order by count descending, then alphabetical
        result.sort((a, b) -> {
            int cmp = Integer.compare((Integer) b.get("count"), (Integer) a.get("count"));
            if (cmp != 0) return cmp;
            return ((String) a.get("name")).compareToIgnoreCase((String) b.get("name"));
        });

        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<?> createGenre(@RequestBody Map<String, String> body) {
        String name = body != null ? body.get("name") : null;
        if (name == null || name.trim().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "O nome do estilo musical é obrigatório."));
        }

        String cleanName = name.trim();
        if (customGenreRepository.findByNameIgnoreCase(cleanName).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Este estilo musical já está cadastrado."));
        }

        String color = body.get("color");
        if (color == null || color.isBlank()) {
            color = PALETTE[Math.abs(cleanName.hashCode()) % PALETTE.length];
        }

        CustomGenre saved = customGenreRepository.save(CustomGenre.builder()
                .name(cleanName)
                .color(color.trim())
                .build());

        return ResponseEntity.ok(saved);
    }

    @PutMapping
    public ResponseEntity<?> updateGenre(@RequestBody Map<String, String> body) {
        String oldName = body != null ? body.get("oldName") : null;
        String newName = body != null ? body.get("newName") : null;
        String color = body != null ? body.get("color") : null;

        if (oldName == null || oldName.trim().isBlank() || newName == null || newName.trim().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Nome atual e novo nome são obrigatórios."));
        }

        String cleanOld = oldName.trim();
        String cleanNew = newName.trim();

        // 1. Update CustomGenre if exists
        Optional<CustomGenre> customOpt = customGenreRepository.findByNameIgnoreCase(cleanOld);
        if (customOpt.isPresent()) {
            CustomGenre cg = customOpt.get();
            cg.setName(cleanNew);
            if (color != null && !color.isBlank()) {
                cg.setColor(color.trim());
            }
            customGenreRepository.save(cg);
        } else if (color != null && !color.isBlank()) {
            customGenreRepository.save(CustomGenre.builder()
                    .name(cleanNew)
                    .color(color.trim())
                    .build());
        }

        // 2. Update any songs that had this genre
        List<Song> songsWithOldGenre = songRepository.findByGenreIgnoreCase(cleanOld);
        for (Song s : songsWithOldGenre) {
            s.setGenre(cleanNew);
            songRepository.save(s);
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Estilo musical atualizado com sucesso.",
                "updatedSongs", songsWithOldGenre.size()
        ));
    }

    @DeleteMapping("/{idOrName}")
    public ResponseEntity<?> deleteGenre(@PathVariable String idOrName) {
        if (idOrName == null || idOrName.trim().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Identificador ou nome do estilo é obrigatório."));
        }

        String cleanTarget = java.net.URLDecoder.decode(idOrName.trim(), java.nio.charset.StandardCharsets.UTF_8);
        String targetName = cleanTarget;

        // Try checking if it's a UUID
        try {
            UUID id = UUID.fromString(cleanTarget);
            Optional<CustomGenre> byId = customGenreRepository.findById(id);
            if (byId.isPresent()) {
                targetName = byId.get().getName();
                customGenreRepository.deleteById(id);
            }
        } catch (IllegalArgumentException e) {
            // Not a UUID, treated as genre name directly
        }

        // Check if any CustomGenre exists by that name
        Optional<CustomGenre> byName = customGenreRepository.findByNameIgnoreCase(targetName);
        byName.ifPresent(customGenreRepository::delete);

        // Update all songs with this genre to null
        List<Song> songs = songRepository.findByGenreIgnoreCase(targetName);
        for (Song s : songs) {
            s.setGenre(null);
            songRepository.save(s);
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Estilo musical '" + targetName + "' removido com sucesso.",
                "unlinkedSongs", songs.size()
        ));
    }
}
