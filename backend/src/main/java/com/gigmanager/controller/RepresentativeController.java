package com.gigmanager.controller;

import com.gigmanager.domain.Representative;
import com.gigmanager.repository.RepresentativeRepository;
import com.gigmanager.repository.RepresentativeSongRepository;
import com.gigmanager.domain.RepresentativeSong;
import com.gigmanager.service.PdfService;
import com.gigmanager.controller.dto.RepresentativeSongResponseDTO;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/representatives")
@CrossOrigin(origins = "*")
public class RepresentativeController {

    private final RepresentativeRepository representativeRepository;
    private final RepresentativeSongRepository representativeSongRepository;
    private final PdfService pdfService;

    public RepresentativeController(RepresentativeRepository representativeRepository,
                                    RepresentativeSongRepository representativeSongRepository,
                                    PdfService pdfService) {
        this.representativeRepository = representativeRepository;
        this.representativeSongRepository = representativeSongRepository;
        this.pdfService = pdfService;
    }

    @GetMapping
    public List<Representative> getAllRepresentatives() {
        return representativeRepository.findAll();
    }

    @PostMapping
    public Representative createRepresentative(@RequestBody Representative representative) {
        return representativeRepository.save(representative);
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
