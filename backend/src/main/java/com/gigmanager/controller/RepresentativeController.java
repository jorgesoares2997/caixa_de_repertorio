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
    public Representative createRepresentative(@RequestBody Representative representative) {
        if (representative.getActive() == null) {
            representative.setActive(true);
        }
        if (representative.getType() == null) {
            representative.setType(RepresentativeType.SINGER);
        }
        return representativeRepository.save(representative);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Representative> updateRepresentative(@PathVariable UUID id, @RequestBody Representative details) {
        return representativeRepository.findById(id)
                .map(rep -> {
                    rep.setName(details.getName());
                    if (details.getType() != null) {
                        rep.setType(details.getType());
                    }
                    rep.setContactInfo(details.getContactInfo());
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
                    List<RepresentativeSong> songs = representativeSongRepository.findByRepresentativeIdWithSong(id);
                    representativeSongRepository.deleteAll(songs);

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
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/export-pdf")
    public ResponseEntity<byte[]> exportRepertoire(
            @PathVariable UUID id,
            @RequestParam(required = false) List<String> genres,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false, defaultValue = "COMPOSER") String groupBy,
            @RequestParam(required = false, defaultValue = "TITLE") String sortBy) {

        Representative representative = representativeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Representative not found"));
        
        List<RepresentativeSong> songs = representativeSongRepository.findByRepresentativeIdWithSong(id);

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
                    .filter(rs -> rs.getSong() != null && rs.getSong().getGenre() != null &&
                            targetGenres.stream().anyMatch(tg -> rs.getSong().getGenre().toLowerCase().contains(tg)))
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
