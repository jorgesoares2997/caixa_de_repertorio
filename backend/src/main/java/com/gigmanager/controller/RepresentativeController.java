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

    @Transactional
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRepresentative(@PathVariable UUID id) {
        return representativeRepository.findById(id)
                .map(rep -> {
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
            @RequestParam(required = false, defaultValue = "TITLE") String sortBy) {

        Representative representative = representativeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Representative not found"));
        
        List<RepresentativeSong> songs = representativeSongRepository.findByRepresentativeIdWithSong(id);

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

        byte[] pdfBytes = pdfService.generateRepresentativeRepertoirePdf(representative, songs, groupBy, sortBy);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"repertorio_" + representative.getName().replaceAll("\\s+", "_") + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    @GetMapping("/{id}/songs")
    public ResponseEntity<List<RepresentativeSongResponseDTO>> getSongsForRepresentative(@PathVariable UUID id) {
        List<RepresentativeSong> songs = representativeSongRepository.findByRepresentativeIdWithSong(id);
        List<RepresentativeSongResponseDTO> response = new ArrayList<>();

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
