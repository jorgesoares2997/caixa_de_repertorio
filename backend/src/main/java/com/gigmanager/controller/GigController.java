package com.gigmanager.controller;

import com.gigmanager.controller.dto.GigRequestDTO;
import com.gigmanager.controller.dto.GigResponseDTO;
import com.gigmanager.domain.Gig;
import com.gigmanager.domain.GigItem;
import com.gigmanager.domain.Representative;
import com.gigmanager.domain.Song;
import com.gigmanager.repository.GigItemRepository;
import com.gigmanager.repository.GigRepository;
import com.gigmanager.repository.RepresentativeRepository;
import com.gigmanager.repository.SongRepository;
import com.gigmanager.service.PdfService;
import com.gigmanager.service.WhatsAppService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/gigs")
@CrossOrigin(origins = "*")
public class GigController {

    private final GigRepository gigRepository;
    private final GigItemRepository gigItemRepository;
    private final SongRepository songRepository;
    private final RepresentativeRepository representativeRepository;
    private final PdfService pdfService;
    private final WhatsAppService whatsAppService;

    @Value("${evolution-api.target-number}")
    private String targetNumber;

    public GigController(GigRepository gigRepository,
                         GigItemRepository gigItemRepository,
                         SongRepository songRepository,
                         RepresentativeRepository representativeRepository,
                         PdfService pdfService,
                         WhatsAppService whatsAppService) {
        this.gigRepository = gigRepository;
        this.gigItemRepository = gigItemRepository;
        this.songRepository = songRepository;
        this.representativeRepository = representativeRepository;
        this.pdfService = pdfService;
        this.whatsAppService = whatsAppService;
    }

    @GetMapping
    public List<GigResponseDTO> getAllGigs() {
        return gigRepository.findAll().stream()
                .map(gig -> {
                    List<GigItem> items = gigItemRepository.findByGigIdOrdered(gig.getId());
                    return toResponseDTO(gig, items);
                })
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GigResponseDTO> getGig(@PathVariable UUID id) {
        return gigRepository.findById(id)
                .map(gig -> {
                    List<GigItem> items = gigItemRepository.findByGigIdOrdered(gig.getId());
                    return ResponseEntity.ok(toResponseDTO(gig, items));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<GigResponseDTO> createGig(@RequestBody GigRequestDTO request) {
        // Resolve representative if provided
        Representative representative = null;
        if (request.getRepresentativeId() != null) {
            representative = representativeRepository.findById(request.getRepresentativeId())
                    .orElse(null);
        }

        // Save the Gig
        Gig gig = Gig.builder()
                .title(request.getTitle())
                .eventDate(request.getEventDate())
                .venue(request.getVenue())
                .notes(request.getNotes())
                .representative(representative)
                .build();
        Gig saved = gigRepository.save(gig);

        // Save items
        List<GigItem> savedItems = new ArrayList<>();
        if (request.getItems() != null) {
            for (GigRequestDTO.GigItemDTO itemDTO : request.getItems()) {
                Song song = songRepository.findById(itemDTO.getSongId()).orElse(null);
                if (song == null) continue;

                GigItem item = GigItem.builder()
                        .gig(saved)
                        .song(song)
                        .blockNumber(itemDTO.getBlockNumber())
                        .orderIndex(itemDTO.getOrderIndex())
                        .performanceKey(itemDTO.getPerformanceKey() != null
                                ? itemDTO.getPerformanceKey()
                                : song.getOriginalKey())
                        .build();
                savedItems.add(gigItemRepository.save(item));
            }
        }

        return ResponseEntity.ok(toResponseDTO(saved, savedItems));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGig(@PathVariable UUID id) {
        return gigRepository.findById(id)
                .map(gig -> {
                    List<GigItem> items = gigItemRepository.findByGigIdOrdered(id);
                    gigItemRepository.deleteAll(items);
                    gigRepository.delete(gig);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> getGigPdf(@PathVariable UUID id) {
        return gigRepository.findById(id).map(gig -> {
            List<GigItem> items = gigItemRepository.findByGigIdOrdered(id);
            byte[] pdfBytes = pdfService.generateGigSetlistPdf(gig, items);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=setlist_" + id + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/send-whatsapp")
    public ResponseEntity<Map<String, String>> sendGigToWhatsApp(@PathVariable UUID id) {
        return gigRepository.findById(id).map(gig -> {
            List<GigItem> items = gigItemRepository.findByGigIdOrdered(id);
            String message = formatSetlistMessage(gig, items);
            whatsAppService.sendMessage(targetNumber, message);

            return ResponseEntity.ok(Map.of("status", "sent", "to", targetNumber));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private String formatSetlistMessage(Gig gig, List<GigItem> items) {
        StringBuilder sb = new StringBuilder();
        sb.append("🎵 *ESCALA DO SHOW* 🎵\n\n");

        if (gig.getVenue() != null) sb.append("📍 ").append(gig.getVenue()).append("\n");
        if (gig.getEventDate() != null) {
            sb.append("📅 ").append(gig.getEventDate()
                    .format(DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH'h'mm"))).append("\n");
        }
        if (gig.getRepresentative() != null) {
            sb.append("🎤 ").append(gig.getRepresentative().getName()).append("\n");
        }
        sb.append("\n");

        // Group by block
        Map<Integer, List<GigItem>> byBlock = new LinkedHashMap<>();
        for (GigItem item : items) {
            byBlock.computeIfAbsent(item.getBlockNumber() != null ? item.getBlockNumber() : 1,
                    k -> new ArrayList<>()).add(item);
        }

        for (Map.Entry<Integer, List<GigItem>> entry : byBlock.entrySet()) {
            int blockNum = entry.getKey();
            List<GigItem> blockItems = entry.getValue();

            if (blockNum == 99) {
                sb.append("*BIS*\n");
            } else {
                sb.append("*BLOCO ").append(blockNum).append("*\n");
            }

            for (int i = 0; i < blockItems.size(); i++) {
                GigItem item = blockItems.get(i);
                sb.append(i + 1).append(". ").append(item.getSong().getTitle());
                if (item.getPerformanceKey() != null) {
                    sb.append(" — ").append(item.getPerformanceKey());
                }
                sb.append("\n");
            }
            sb.append("\n");
        }

        return sb.toString().trim();
    }

    private GigResponseDTO toResponseDTO(Gig gig, List<GigItem> items) {
        List<GigResponseDTO.GigItemResponseDTO> itemDTOs = items.stream()
                .map(item -> GigResponseDTO.GigItemResponseDTO.builder()
                        .id(item.getId())
                        .songId(item.getSong().getId())
                        .songTitle(item.getSong().getTitle())
                        .songComposer(item.getSong().getComposer())
                        .performanceKey(item.getPerformanceKey())
                        .blockNumber(item.getBlockNumber())
                        .orderIndex(item.getOrderIndex())
                        .build())
                .collect(Collectors.toList());

        return GigResponseDTO.builder()
                .id(gig.getId())
                .title(gig.getTitle())
                .eventDate(gig.getEventDate())
                .venue(gig.getVenue())
                .notes(gig.getNotes())
                .representativeName(gig.getRepresentative() != null ? gig.getRepresentative().getName() : null)
                .items(itemDTOs)
                .build();
    }
}
