package com.gigmanager.controller;

import com.gigmanager.domain.Song;
import com.gigmanager.repository.SongRepository;
import com.gigmanager.service.PdfService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/songs")
@CrossOrigin(origins = "*") // Allows Next.js to access this locally
public class SongController {

    private final SongRepository songRepository;
    private final PdfService pdfService;

    public SongController(SongRepository songRepository, PdfService pdfService) {
        this.songRepository = songRepository;
        this.pdfService = pdfService;
    }

    @GetMapping
    public List<Song> getAllSongs() {
        return songRepository.findAll();
    }

    @PostMapping
    public Song createSong(@RequestBody Song song) {
        return songRepository.save(song);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Song> updateSong(@PathVariable UUID id, @RequestBody Song songDetails) {
        return songRepository.findById(id)
                .map(song -> {
                    song.setTitle(songDetails.getTitle());
                    song.setComposer(songDetails.getComposer());
                    song.setGenre(songDetails.getGenre());
                    song.setOriginalKey(songDetails.getOriginalKey());
                    song.setMasteryLevel(songDetails.getMasteryLevel());
                    song.setTempoBpm(songDetails.getTempoBpm());
                    song.setNotes(songDetails.getNotes());
                    return ResponseEntity.ok(songRepository.save(song));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/mastery")
    public ResponseEntity<Song> updateMasteryLevel(@PathVariable UUID id, @RequestBody Map<String, Integer> body) {
        return songRepository.findById(id)
                .map(song -> {
                    song.setMasteryLevel(body.get("level"));
                    return ResponseEntity.ok(songRepository.save(song));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSong(@PathVariable UUID id) {
        return songRepository.findById(id)
                .map(song -> {
                    songRepository.delete(song);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/portfolio/pdf")
    public ResponseEntity<byte[]> getPortfolioPdf(@RequestParam(required = false) String genre) {
        List<Song> songs = songRepository.findAll();
        if (genre != null && !genre.isBlank()) {
            songs = songs.stream().filter(s -> genre.equalsIgnoreCase(s.getGenre())).toList();
        }

        byte[] pdfBytes = pdfService.generatePortfolioPdf(songs, genre);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=portfolio.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}
