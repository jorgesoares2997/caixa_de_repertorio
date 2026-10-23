package com.gigmanager.controller;

import com.gigmanager.domain.Representative;
import com.gigmanager.domain.RepresentativeSong;
import com.gigmanager.domain.Song;
import com.gigmanager.domain.enums.RepresentativeType;
import com.gigmanager.repository.GigRepository;
import com.gigmanager.repository.RepresentativeRepository;
import com.gigmanager.repository.RepresentativeSongRepository;
import com.gigmanager.repository.SongRepository;
import com.gigmanager.service.PdfService;
import com.gigmanager.controller.dto.RepresentativeSongResponseDTO;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/representatives")
@CrossOrigin(origins = "*")
public class RepresentativeController {

    private final RepresentativeRepository representativeRepository;
    private final RepresentativeSongRepository representativeSongRepository;
    private final SongRepository songRepository;
    private final GigRepository gigRepository;
    private final PdfService pdfService;

    public RepresentativeController(
            RepresentativeRepository representativeRepository,
            RepresentativeSongRepository representativeSongRepository,
            SongRepository songRepository,
            GigRepository gigRepository,
            PdfService pdfService
    ) {
        this.representativeRepository = representativeRepository;
        this.representativeSongRepository = representativeSongRepository;
        this.songRepository = songRepository;
        this.gigRepository = gigRepository;
        this.pdfService = pdfService;
    }

    @GetMapping
    public List<Representative> getAllRepresentatives() {
        return representativeRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Representative> getRepresentativeById(@PathVariable UUID id) {
        return representativeRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createRepresentative(@RequestBody Representative representative) {
        if (representative.getName() == null || representative.getName().trim().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "O nome do artista ou projeto é obrigatório."));
        }
        representative.setName(representative.getName().trim());
        if (representative.getActive() == null) {
            representative.setActive(true);
        }
        if (representative.getType() == null) {
            representative.setType(RepresentativeType.SINGER);
        }
        if (representative.getContactInfo() != null && representative.getContactInfo().trim().isBlank()) {
            representative.setContactInfo(null);
        }
        Representative saved = representativeRepository.save(representative);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateRepresentative(@PathVariable UUID id, @RequestBody Representative details) {
        if (details.getName() == null || details.getName().trim().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "O nome do artista ou projeto é obrigatório."));
        }
        return representativeRepository.findById(id)
                .map(rep -> {
                    rep.setName(details.getName().trim());
                    if (details.getType() != null) {
                        rep.setType(details.getType());
                    }
                    rep.setContactInfo(details.getContactInfo() != null && !details.getContactInfo().trim().isBlank() ? details.getContactInfo().trim() : null);
                    if (details.getActive() != null) {
                        rep.setActive(details.getActive());
                    }
                    return ResponseEntity.ok(representativeRepository.save(rep));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private boolean isGeral(Representative rep) {
        return rep != null && "Geral".equalsIgnoreCase(rep.getName());
    }

    @Transactional
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRepresentative(@PathVariable UUID id) {
        return representativeRepository.findById(id)
                .map(rep -> {
                    if (isGeral(rep)) {
                        return ResponseEntity.badRequest().body(Map.of("message", "O projeto compilado 'Geral' é nativo e não pode ser excluído."));
                    }

                    // Remove links in representative_songs
                    representativeSongRepository.deleteByRepresentativeId(id);

                    // Unlink from gigs
                    gigRepository.findAll().stream()
                            .filter(g -> g.getRepresentative() != null && g.getRepresentative().getId().equals(id))
                            .forEach(g -> {
                                g.setRepresentative(null);
                                gigRepository.save(g);
                            });

                    representativeRepository.delete(rep);
                    return ResponseEntity.ok(Map.of("message", "Projeto/Artista excluído com sucesso", "id", id));
                })
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("message", "Artista ou projeto não encontrado.")));
    }

    @GetMapping("/{id}/export-pdf")
    public ResponseEntity<byte[]> exportRepertoire(
            @PathVariable UUID id,
            @RequestParam(required = false) List<String> genres,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "COMPOSER") String groupBy,
            @RequestParam(required = false, defaultValue = "TITLE") String sortBy,
            @RequestParam(required = false) String customTitle) {

        Representative representative = representativeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Representative not found"));
        
        List<RepresentativeSong> songs;
        if (isGeral(representative)) {
            // "Geral" represents the compilation of all songs across all artists/projects
            Map<UUID, RepresentativeSong> explicitMap = representativeSongRepository.findByRepresentativeIdWithSong(id).stream()
                    .filter(rs -> rs.getSong() != null)
                    .collect(Collectors.toMap(rs -> rs.getSong().getId(), rs -> rs, (a, b) -> a));

            songs = songRepository.findAll().stream()
                    .map(song -> {
                        RepresentativeSong explicit = explicitMap.get(song.getId());
                        if (explicit != null) {
                            return explicit;
                        }
                        return RepresentativeSong.builder()
                                .representative(representative)
                                .song(song)
                                .performanceKey(song.getOriginalKey() != null ? song.getOriginalKey() : "C")
                                .build();
                    })
                    .collect(Collectors.toList());
        } else {
            songs = representativeSongRepository.findByRepresentativeIdWithSong(id);
        }

        // Filter by search query if specified
        if (search != null && !search.isBlank()) {
            String q = search.trim().toLowerCase();
            songs = songs.stream()
                    .filter(rs -> rs.getSong() != null && (
                            (rs.getSong().getTitle() != null && rs.getSong().getTitle().toLowerCase().contains(q)) ||
                            (rs.getSong().getComposer() != null && rs.getSong().getComposer().toLowerCase().contains(q)) ||
                            (rs.getSong().getGenre() != null && rs.getSong().getGenre().toLowerCase().contains(q)) ||
                            (rs.getPerformanceKey() != null && rs.getPerformanceKey().toLowerCase().contains(q)) ||
                            (rs.getSong().getOriginalKey() != null && rs.getSong().getOriginalKey().toLowerCase().contains(q))
                    ))
                    .collect(Collectors.toList());
        }

        // Collect all target genres
        List<String> targetGenres = new ArrayList<>();
        if (genres != null && !genres.isEmpty()) {
            for (String g : genres) {
                if (g != null && !g.isBlank()) {
                    for (String part : g.split(",")) {
                        String clean = part.trim().toLowerCase();
                        if (!clean.isBlank() && !clean.equalsIgnoreCase("all") && !clean.equalsIgnoreCase("todos")) {
                            targetGenres.add(clean);
                        }
                    }
                }
            }
        }
        if (genre != null && !genre.isBlank()) {
            for (String part : genre.split(",")) {
                String clean = part.trim().toLowerCase();
                if (!clean.isBlank() && !clean.equalsIgnoreCase("all") && !clean.equalsIgnoreCase("todos") && !targetGenres.contains(clean)) {
                    targetGenres.add(clean);
                }
            }
        }

        // Filter by multiple genres if specified
        if (!targetGenres.isEmpty()) {
            songs = songs.stream()
                    .filter(rs -> {
                        if (rs.getSong() == null || rs.getSong().getGenre() == null) return false;
                        String songGenre = rs.getSong().getGenre().trim().toLowerCase();
                        return targetGenres.stream().anyMatch(tg ->
                                songGenre.contains(tg) || tg.contains(songGenre)
                        );
                    })
                    .collect(Collectors.toList());
        }

        byte[] pdfBytes = pdfService.generateRepresentativeRepertoirePdf(representative, songs, groupBy, sortBy, customTitle);
        String downloadName = (customTitle != null && !customTitle.isBlank()) ? customTitle.trim() : representative.getName();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"repertorio_" + downloadName.replaceAll("\\s+", "_") + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    @GetMapping("/{id}/songs")
    public ResponseEntity<List<RepresentativeSongResponseDTO>> getSongsForRepresentative(@PathVariable UUID id) {
        Representative representative = representativeRepository.findById(id).orElse(null);
        if (representative == null) {
            return ResponseEntity.notFound().build();
        }

        boolean isGeral = isGeral(representative);
        List<RepresentativeSongResponseDTO> response = new ArrayList<>();

        if (isGeral) {
            List<Song> allSongs = songRepository.findAll();
            List<RepresentativeSong> allRepSongs = representativeSongRepository.findAll();

            // Intersections: other representatives (excluding Geral) playing each song
            Map<UUID, List<RepresentativeSong>> repSongsBySongId = allRepSongs.stream()
                    .filter(rs -> rs.getSong() != null && rs.getRepresentative() != null && !rs.getRepresentative().getId().equals(id))
                    .collect(Collectors.groupingBy(rs -> rs.getSong().getId()));

            // Explicit customization for Geral if set
            Map<UUID, RepresentativeSong> explicitMap = allRepSongs.stream()
                    .filter(rs -> rs.getSong() != null && rs.getRepresentative() != null && rs.getRepresentative().getId().equals(id))
                    .collect(Collectors.toMap(rs -> rs.getSong().getId(), rs -> rs, (a, b) -> a));

            for (Song s : allSongs) {
                RepresentativeSong explicit = explicitMap.get(s.getId());
                String key = (explicit != null && explicit.getPerformanceKey() != null && !explicit.getPerformanceKey().isBlank())
                        ? explicit.getPerformanceKey()
                        : (s.getOriginalKey() != null ? s.getOriginalKey() : "C");

                List<RepresentativeSong> others = repSongsBySongId.getOrDefault(s.getId(), Collections.emptyList());
                List<RepresentativeSongResponseDTO.IntersectionDTO> intersections = others.stream()
                        .map(otherRs -> new RepresentativeSongResponseDTO.IntersectionDTO(
                                otherRs.getRepresentative().getName(),
                                otherRs.getPerformanceKey() != null ? otherRs.getPerformanceKey() : (otherRs.getSong().getOriginalKey() != null ? otherRs.getSong().getOriginalKey() : "C")
                        ))
                        .collect(Collectors.toList());

                response.add(new RepresentativeSongResponseDTO(
                        s.getId(),
                        s.getTitle(),
                        s.getComposer(),
                        s.getGenre(),
                        s.getMasteryLevel(),
                        key,
                        intersections
                ));
            }
        } else {
            List<RepresentativeSong> songs = representativeSongRepository.findByRepresentativeIdWithSong(id);
            for (RepresentativeSong rs : songs) {
                List<RepresentativeSong> allWithSong = representativeSongRepository.findBySongIdWithRepresentative(rs.getSong().getId());
                
                List<RepresentativeSongResponseDTO.IntersectionDTO> intersections = allWithSong.stream()
                    .filter(otherRs -> !otherRs.getRepresentative().getId().equals(id))
                    .map(otherRs -> new RepresentativeSongResponseDTO.IntersectionDTO(
                        otherRs.getRepresentative().getName(),
                        otherRs.getPerformanceKey() != null ? otherRs.getPerformanceKey() : rs.getSong().getOriginalKey()
                    ))
                    .collect(Collectors.toList());

                response.add(new RepresentativeSongResponseDTO(
                    rs.getSong().getId(),
                    rs.getSong().getTitle(),
                    rs.getSong().getComposer(),
                    rs.getSong().getGenre(),
                    rs.getSong().getMasteryLevel(),
                    rs.getPerformanceKey() != null ? rs.getPerformanceKey() : rs.getSong().getOriginalKey(),
                    intersections
                ));
            }
        }

        return ResponseEntity.ok(response);
    }

    @Transactional
    @PostMapping("/{representativeId}/songs/{songId}")
    public ResponseEntity<?> linkSongToRepresentative(
            @PathVariable UUID representativeId,
            @PathVariable UUID songId,
            @RequestParam(required = false) String performanceKey,
            @RequestParam(required = false) String specificNotes
    ) {
        Representative rep = representativeRepository.findById(representativeId).orElse(null);
        Song song = songRepository.findById(songId).orElse(null);

        if (rep == null || song == null) {
            return ResponseEntity.notFound().build();
        }

        List<RepresentativeSong> existing = representativeSongRepository.findByRepresentativeIdWithSong(representativeId);
        RepresentativeSong match = existing.stream()
                .filter(rs -> rs.getSong() != null && rs.getSong().getId().equals(songId))
                .findFirst()
                .orElse(null);

        if (match != null) {
            if (performanceKey != null && !performanceKey.isBlank()) {
                match.setPerformanceKey(performanceKey);
            }
            if (specificNotes != null) {
                match.setSpecificNotes(specificNotes);
            }
            representativeSongRepository.save(match);
        } else {
            RepresentativeSong rs = RepresentativeSong.builder()
                    .representative(rep)
                    .song(song)
                    .performanceKey(performanceKey != null && !performanceKey.isBlank() ? performanceKey : song.getOriginalKey())
                    .specificNotes(specificNotes)
                    .build();
            representativeSongRepository.save(rs);
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Música vinculada com sucesso ao artista " + rep.getName()
        ));
    }

    @Transactional
    @DeleteMapping("/{representativeId}/songs/{songId}")
    public ResponseEntity<?> unlinkSongFromRepresentative(
            @PathVariable UUID representativeId,
            @PathVariable UUID songId
    ) {
        Representative rep = representativeRepository.findById(representativeId).orElse(null);
        if (rep != null && isGeral(rep)) {
            List<RepresentativeSong> existing = representativeSongRepository.findByRepresentativeIdWithSong(representativeId);
            existing.stream()
                    .filter(rs -> rs.getSong() != null && rs.getSong().getId().equals(songId))
                    .findFirst()
                    .ifPresent(representativeSongRepository::delete);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "A música faz parte do acervo geral. Customizações individuais de tom foram restauradas."
            ));
        }

        List<RepresentativeSong> existing = representativeSongRepository.findByRepresentativeIdWithSong(representativeId);
        existing.stream()
                .filter(rs -> rs.getSong() != null && rs.getSong().getId().equals(songId))
                .findFirst()
                .ifPresent(representativeSongRepository::delete);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Música desvinculada com sucesso"
        ));
    }
}
