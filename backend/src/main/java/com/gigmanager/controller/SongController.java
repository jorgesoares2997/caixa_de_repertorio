package com.gigmanager.controller;

import com.gigmanager.controller.dto.PageResponse;
import com.gigmanager.controller.dto.RepresentativeLinkDTO;
import com.gigmanager.controller.dto.SongDTO;
import com.gigmanager.domain.Representative;
import com.gigmanager.domain.RepresentativeSong;
import com.gigmanager.domain.Song;
import com.gigmanager.repository.DailyPracticeLogRepository;
import com.gigmanager.repository.GigItemRepository;
import com.gigmanager.repository.RepresentativeRepository;
import com.gigmanager.repository.RepresentativeSongRepository;
import com.gigmanager.repository.SongRepository;
import com.gigmanager.service.PdfService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
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
@RequestMapping("/api/songs")
@CrossOrigin(origins = "*") // Allows Next.js to access this locally
public class SongController {

    private final SongRepository songRepository;
    private final RepresentativeRepository representativeRepository;
    private final RepresentativeSongRepository representativeSongRepository;
    private final GigItemRepository gigItemRepository;
    private final DailyPracticeLogRepository dailyPracticeLogRepository;
    private final PdfService pdfService;

    public SongController(
            SongRepository songRepository,
            RepresentativeRepository representativeRepository,
            RepresentativeSongRepository representativeSongRepository,
            GigItemRepository gigItemRepository,
            DailyPracticeLogRepository dailyPracticeLogRepository,
            PdfService pdfService
    ) {
        this.songRepository = songRepository;
        this.representativeRepository = representativeRepository;
        this.representativeSongRepository = representativeSongRepository;
        this.gigItemRepository = gigItemRepository;
        this.dailyPracticeLogRepository = dailyPracticeLogRepository;
        this.pdfService = pdfService;
    }

    private SongDTO convertToDTO(Song song, List<RepresentativeSong> repSongs) {
        List<RepresentativeLinkDTO> linkDTOs = new ArrayList<>();
        if (repSongs != null) {
            for (RepresentativeSong rs : repSongs) {
                linkDTOs.add(RepresentativeLinkDTO.builder()
                        .representativeId(rs.getRepresentative().getId())
                        .representativeName(rs.getRepresentative().getName())
                        .performanceKey(rs.getPerformanceKey() != null ? rs.getPerformanceKey() : song.getOriginalKey())
                        .specificNotes(rs.getSpecificNotes())
                        .build());
            }
        }

        return SongDTO.builder()
                .id(song.getId())
                .title(song.getTitle())
                .composer(song.getComposer())
                .genre(song.getGenre())
                .originalKey(song.getOriginalKey())
                .masteryLevel(song.getMasteryLevel())
                .tempoBpm(song.getTempoBpm())
                .notes(song.getNotes())
                .lastPracticedAt(song.getLastPracticedAt())
                .representativeLinks(linkDTOs)
                .build();
    }

    @GetMapping
    public ResponseEntity<?> getAllSongs(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "title,asc") String sort
    ) {
        List<RepresentativeSong> allRepSongs = representativeSongRepository.findAll();
        Map<UUID, List<RepresentativeSong>> repSongsBySongId = allRepSongs.stream()
                .filter(rs -> rs.getSong() != null && rs.getSong().getId() != null)
                .collect(Collectors.groupingBy(rs -> rs.getSong().getId()));

        if (page == null && size == null) {
            List<Song> songs = songRepository.findAll(Sort.by(Sort.Direction.ASC, "title"));
            List<SongDTO> dtos = songs.stream()
                    .map(s -> convertToDTO(s, repSongsBySongId.getOrDefault(s.getId(), List.of())))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        }

        int pageNum = page != null ? Math.max(0, page) : 0;
        int pageSize = size != null ? Math.max(1, size) : 25;

        String[] sortParts = sort.split(",");
        String sortField = sortParts[0];
        Sort.Direction direction = (sortParts.length > 1 && sortParts[1].equalsIgnoreCase("desc"))
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;

        Pageable pageable = PageRequest.of(pageNum, pageSize, Sort.by(direction, sortField));
        Page<Song> songPage = songRepository.findAll(pageable);

        List<SongDTO> content = songPage.getContent().stream()
                .map(s -> convertToDTO(s, repSongsBySongId.getOrDefault(s.getId(), List.of())))
                .collect(Collectors.toList());

        PageResponse<SongDTO> pageResponse = PageResponse.<SongDTO>builder()
                .content(content)
                .pageNumber(songPage.getNumber())
                .pageSize(songPage.getSize())
                .totalElements(songPage.getTotalElements())
                .totalPages(songPage.getTotalPages())
                .first(songPage.isFirst())
                .last(songPage.isLast())
                .build();

        return ResponseEntity.ok(pageResponse);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SongDTO> getSongById(@PathVariable UUID id) {
        return songRepository.findById(id)
                .map(song -> {
                    List<RepresentativeSong> repSongs = representativeSongRepository.findBySongIdWithRepresentative(id);
                    return ResponseEntity.ok(convertToDTO(song, repSongs));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @Transactional
    @PostMapping
    public ResponseEntity<?> createSong(@RequestBody SongDTO songDTO) {
        if (songDTO.getTitle() == null || songDTO.getTitle().trim().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "O título da música é obrigatório."));
        }

        String cleanTitle = songDTO.getTitle().trim();
        String cleanComposer = songDTO.getComposer() != null && !songDTO.getComposer().trim().isBlank()
                ? songDTO.getComposer().trim()
                : null;

        // Block duplicate songs
        java.util.Optional<Song> duplicateOpt = findDuplicateSong(null, cleanTitle, cleanComposer);
        if (duplicateOpt.isPresent()) {
            Song existing = duplicateOpt.get();
            String composerStr = existing.getComposer() != null ? " (" + existing.getComposer() + ")" : "";
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "error", "DUPLICATE_SONG",
                    "message", "A música \"" + existing.getTitle() + composerStr + "\" já está cadastrada no acervo!",
                    "existingId", existing.getId()
            ));
        }

        Song song = Song.builder()
                .title(cleanTitle)
                .composer(cleanComposer)
                .genre(songDTO.getGenre() != null && !songDTO.getGenre().trim().isBlank() ? songDTO.getGenre().trim() : null)
                .originalKey(songDTO.getOriginalKey() != null ? songDTO.getOriginalKey() : "C")
                .masteryLevel(songDTO.getMasteryLevel() != null ? songDTO.getMasteryLevel() : 3)
                .tempoBpm(songDTO.getTempoBpm())
                .notes(songDTO.getNotes())
                .build();

        Song saved = songRepository.save(song);
        List<RepresentativeSong> createdRepSongs = new ArrayList<>();

        if (songDTO.getRepresentativeLinks() != null && !songDTO.getRepresentativeLinks().isEmpty()) {
            for (RepresentativeLinkDTO link : songDTO.getRepresentativeLinks()) {
                if (link.getRepresentativeId() != null) {
                    Representative rep = representativeRepository.findById(link.getRepresentativeId()).orElse(null);
                    if (rep != null) {
                        RepresentativeSong rs = RepresentativeSong.builder()
                                .song(saved)
                                .representative(rep)
                                .performanceKey(link.getPerformanceKey() != null && !link.getPerformanceKey().isBlank()
                                        ? link.getPerformanceKey()
                                        : saved.getOriginalKey())
                                .specificNotes(link.getSpecificNotes())
                                .build();
                        createdRepSongs.add(representativeSongRepository.save(rs));
                    }
                }
            }
        }

        return ResponseEntity.ok(convertToDTO(saved, createdRepSongs));
    }

    @Transactional
    @PutMapping("/{id}")
    public ResponseEntity<?> updateSong(@PathVariable UUID id, @RequestBody SongDTO songDTO) {
        if (songDTO.getTitle() == null || songDTO.getTitle().trim().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "O título da música é obrigatório."));
        }

        String cleanTitle = songDTO.getTitle().trim();
        String cleanComposer = songDTO.getComposer() != null && !songDTO.getComposer().trim().isBlank()
                ? songDTO.getComposer().trim()
                : null;

        // Block duplicate songs with other IDs
        java.util.Optional<Song> duplicateOpt = findDuplicateSong(id, cleanTitle, cleanComposer);
        if (duplicateOpt.isPresent()) {
            Song existing = duplicateOpt.get();
            String composerStr = existing.getComposer() != null ? " (" + existing.getComposer() + ")" : "";
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "error", "DUPLICATE_SONG",
                    "message", "Já existe outra música cadastrada com o título \"" + existing.getTitle() + composerStr + "\" no acervo!",
                    "existingId", existing.getId()
            ));
        }

        return songRepository.findById(id)
                .map(song -> {
                    song.setTitle(cleanTitle);
                    song.setComposer(cleanComposer);
                    song.setGenre(songDTO.getGenre() != null && !songDTO.getGenre().trim().isBlank() ? songDTO.getGenre().trim() : null);
                    song.setOriginalKey(songDTO.getOriginalKey());
                    song.setMasteryLevel(songDTO.getMasteryLevel() != null ? songDTO.getMasteryLevel() : song.getMasteryLevel());
                    song.setTempoBpm(songDTO.getTempoBpm());
                    song.setNotes(songDTO.getNotes());
                    Song saved = songRepository.save(song);

                    // Update representative links if provided
                    if (songDTO.getRepresentativeLinks() != null) {
                        representativeSongRepository.deleteBySongId(id);
                        List<RepresentativeSong> newRepSongs = new ArrayList<>();

                        for (RepresentativeLinkDTO link : songDTO.getRepresentativeLinks()) {
                            if (link.getRepresentativeId() != null) {
                                Representative rep = representativeRepository.findById(link.getRepresentativeId()).orElse(null);
                                if (rep != null) {
                                    RepresentativeSong rs = RepresentativeSong.builder()
                                            .song(saved)
                                            .representative(rep)
                                            .performanceKey(link.getPerformanceKey() != null && !link.getPerformanceKey().isBlank()
                                                    ? link.getPerformanceKey()
                                                    : saved.getOriginalKey())
                                            .specificNotes(link.getSpecificNotes())
                                            .build();
                                    newRepSongs.add(representativeSongRepository.save(rs));
                                }
                            }
                        }
                        return ResponseEntity.ok(convertToDTO(saved, newRepSongs));
                    }

                    List<RepresentativeSong> existingRepSongs = representativeSongRepository.findBySongIdWithRepresentative(id);
                    return ResponseEntity.ok(convertToDTO(saved, existingRepSongs));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/mastery")
    public ResponseEntity<Song> updateMasteryLevel(@PathVariable UUID id, @RequestBody Map<String, Integer> body) {
        return songRepository.findById(id)
                .map(song -> {
                    if (body.containsKey("level") && body.get("level") != null) {
                        song.setMasteryLevel(body.get("level"));
                    }
                    return ResponseEntity.ok(songRepository.save(song));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/genre")
    public ResponseEntity<SongDTO> updateSongGenre(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        return songRepository.findById(id)
                .map(song -> {
                    if (body.containsKey("genre")) {
                        String newGenre = body.get("genre");
                        song.setGenre(newGenre != null && !newGenre.isBlank() ? newGenre.trim() : null);
                    }
                    Song saved = songRepository.save(song);
                    List<RepresentativeSong> repSongs = representativeSongRepository.findBySongIdWithRepresentative(id);
                    return ResponseEntity.ok(convertToDTO(saved, repSongs));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @Transactional
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSong(@PathVariable UUID id) {
        return songRepository.findById(id)
                .map(song -> {
                    representativeSongRepository.deleteBySongId(id);
                    gigItemRepository.deleteBySongId(id);
                    dailyPracticeLogRepository.deleteBySongId(id);
                    songRepository.delete(song);
                    return ResponseEntity.ok(Map.of("message", "Música excluída com sucesso", "id", id));
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

    private java.util.Optional<Song> findDuplicateSong(UUID excludeId, String cleanTitle, String cleanComposer) {
        List<Song> matchingTitles = songRepository.findByTitleIgnoreCase(cleanTitle);
        return matchingTitles.stream()
                .filter(s -> excludeId == null || !s.getId().equals(excludeId))
                .filter(s -> {
                    String existingComposer = s.getComposer() != null && !s.getComposer().trim().isBlank() ? s.getComposer().trim() : null;
                    if (cleanComposer == null) {
                        return existingComposer == null;
                    }
                    return cleanComposer.equalsIgnoreCase(existingComposer);
                })
                .findFirst();
    }
}
