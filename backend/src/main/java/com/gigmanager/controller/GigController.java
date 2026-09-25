package com.gigmanager.controller;

import com.gigmanager.domain.Gig;
import com.gigmanager.domain.GigItem;
import com.gigmanager.repository.GigItemRepository;
import com.gigmanager.repository.GigRepository;
import com.gigmanager.service.PdfService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/gigs")
@CrossOrigin(origins = "*")
public class GigController {

    private final GigRepository gigRepository;
    private final GigItemRepository gigItemRepository;
    private final PdfService pdfService;

    public GigController(GigRepository gigRepository, GigItemRepository gigItemRepository, PdfService pdfService) {
        this.gigRepository = gigRepository;
        this.gigItemRepository = gigItemRepository;
        this.pdfService = pdfService;
    }

    @GetMapping
    public List<Gig> getAllGigs() {
        return gigRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Gig> getGig(@PathVariable UUID id) {
        return gigRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Gig createGig(@RequestBody Gig gig) {
        return gigRepository.save(gig);
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> getGigPdf(@PathVariable UUID id) {
        return gigRepository.findById(id).map(gig -> {
            List<GigItem> items = gigItemRepository.findAll().stream()
                    .filter(item -> item.getGig().getId().equals(id))
                    .toList();

            byte[] pdfBytes = pdfService.generateGigSetlistPdf(gig, items);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=gig_" + gig.getId() + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);
        }).orElse(ResponseEntity.notFound().build());
    }
}
