package com.gigmanager.controller;

import com.gigmanager.domain.Representative;
import com.gigmanager.domain.RepresentativeSong;
import com.gigmanager.domain.enums.RepresentativeType;
import com.gigmanager.repository.GigRepository;
import com.gigmanager.repository.RepresentativeRepository;
import com.gigmanager.repository.RepresentativeSongRepository;
import com.gigmanager.service.PdfService;
import com.gigmanager.controller.dto.RepresentativeSongResponseDTO;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
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
    private final GigRepository gigRepository;
    private final PdfService pdfService;

    public RepresentativeController(
            RepresentativeRepository representativeRepository,
            RepresentativeSongRepository representativeSongRepository,
            GigRepository gigRepository,
            PdfService pdfService
    ) {
        this.representativeRepository = representativeRepository;
        this.representativeSongRepository = representativeSongRepository;
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
            @RequestParam(required = false, defaultValue = "COMPOSER") String groupBy,
            @RequestParam(required = false, defaultValue = "TITLE") String sortBy) {

        Representative representative = representativeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Representative not found"));
        
        List<RepresentativeSong> songs = representativeSongRepository.findByRepresentativeIdWithSong(id);

        byte[] pdfBytes = pdfService.generateRepresentativeRepertoirePdf(representative, songs, groupBy, sortBy);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"repertorio_" + representative.getName().replaceAll("\\s+", "_") + ".pdf\"")
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
}
