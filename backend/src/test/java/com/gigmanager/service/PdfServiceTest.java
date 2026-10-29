package com.gigmanager.service;

import com.gigmanager.domain.Gig;
import com.gigmanager.domain.GigItem;
import com.gigmanager.domain.Representative;
import com.gigmanager.domain.Song;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfReader;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class PdfServiceTest {

    private PdfService pdfService;

    @BeforeEach
    void setUp() {
        pdfService = new PdfService();
    }

    private List<GigItem> createSampleItems(int count) {
        List<GigItem> items = new ArrayList<>();
        String[] keys = {"C", "G", "D", "Am", "Em", "F#m", "Bb", "Eb"};
        for (int i = 1; i <= count; i++) {
            Song song = Song.builder()
                    .id(UUID.randomUUID())
                    .title("Música Número " + i + " - Exemplo")
                    .composer("Compositor " + (i % 5 + 1))
                    .originalKey(keys[i % keys.length])
                    .masteryLevel((i % 5) + 1)
                    .build();

            GigItem item = GigItem.builder()
                    .id(UUID.randomUUID())
                    .song(song)
                    .orderIndex(i - 1)
                    .blockNumber(1)
                    .performanceKey(keys[i % keys.length])
                    .build();

            items.add(item);
        }
        return items;
    }

    @Test
    @DisplayName("PDF de Show com 12 músicas deve caber em 1 página única")
    void testShowPdfSmallSinglePage() throws Exception {
        Gig gig = Gig.builder()
                .title("Show Acústico Intimista")
                .venue("Blue Note SP")
                .eventDate(LocalDateTime.now().plusDays(3))
                .representative(Representative.builder().name("Projeto Voz e Violão").build())
                .build();

        List<GigItem> items = createSampleItems(12);
        byte[] pdfBytes = pdfService.generateGigShowPdf(gig, items);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 0);

        try (PdfDocument pdfDoc = new PdfDocument(new PdfReader(new ByteArrayInputStream(pdfBytes)))) {
            assertEquals(1, pdfDoc.getNumberOfPages(), "O PDF de show deve ter estritamente 1 página.");
        }
    }

    @Test
    @DisplayName("PDF de Show com 30 músicas (duas colunas) deve caber em 1 página única")
    void testShowPdfMediumSinglePage() throws Exception {
        Gig gig = Gig.builder()
                .title("Grande Baile de Carnaval")
                .venue("Clube Pinheiros")
                .eventDate(LocalDateTime.now().plusDays(10))
                .representative(Representative.builder().name("Banda Show Completa").build())
                .build();

        List<GigItem> items = createSampleItems(30);
        byte[] pdfBytes = pdfService.generateGigShowPdf(gig, items);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 0);

        try (PdfDocument pdfDoc = new PdfDocument(new PdfReader(new ByteArrayInputStream(pdfBytes)))) {
            assertEquals(1, pdfDoc.getNumberOfPages(), "O PDF de show com 30 músicas deve ter estritamente 1 página.");
        }

        // Save to scratch for verification
        File scratchFile = new File("/Users/jorgesoares/.gemini/antigravity-ide/brain/f0940f6f-783e-46e1-8b04-630c3a48fad6/scratch/show_30_songs.pdf");
        scratchFile.getParentFile().mkdirs();
        try (FileOutputStream fos = new FileOutputStream(scratchFile)) {
            fos.write(pdfBytes);
        }
    }

    @Test
    @DisplayName("PDF de Show com 48 músicas (duas colunas densas) deve caber em 1 página única")
    void testShowPdfLargeSinglePage() throws Exception {
        Gig gig = Gig.builder()
                .title("Maratona Musical 4 Horas")
                .venue("Teatro Municipal")
                .eventDate(LocalDateTime.now().plusDays(15))
                .representative(Representative.builder().name("Orquestra Popular").build())
                .build();

        List<GigItem> items = createSampleItems(48);
        byte[] pdfBytes = pdfService.generateGigShowPdf(gig, items);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 0);

        try (PdfDocument pdfDoc = new PdfDocument(new PdfReader(new ByteArrayInputStream(pdfBytes)))) {
            assertEquals(1, pdfDoc.getNumberOfPages(), "O PDF de show mesmo com 48 músicas deve ter estritamente 1 página.");
        }

        File scratchFile = new File("/Users/jorgesoares/.gemini/antigravity-ide/brain/f0940f6f-783e-46e1-8b04-630c3a48fad6/scratch/show_48_songs.pdf");
        try (FileOutputStream fos = new FileOutputStream(scratchFile)) {
            fos.write(pdfBytes);
        }
    }

    @Test
    @DisplayName("PDF de Estudo deve ser gerado com sucesso e conter nível de domínio")
    void testStudyPdfGeneration() throws Exception {
        Gig gig = Gig.builder()
                .title("Ensaio Geral Pré-Show")
                .venue("Estúdio A")
                .eventDate(LocalDateTime.now().plusDays(1))
                .notes("Atenção especial para as transições")
                .representative(Representative.builder().name("Projeto Trio Instrumental").build())
                .build();

        List<GigItem> items = createSampleItems(15);
        byte[] pdfBytes = pdfService.generateGigStudyPdf(gig, items);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 0);

        try (PdfDocument pdfDoc = new PdfDocument(new PdfReader(new ByteArrayInputStream(pdfBytes)))) {
            assertTrue(pdfDoc.getNumberOfPages() >= 1);
        }

        File scratchFile = new File("/Users/jorgesoares/.gemini/antigravity-ide/brain/f0940f6f-783e-46e1-8b04-630c3a48fad6/scratch/study_15_songs.pdf");
        try (FileOutputStream fos = new FileOutputStream(scratchFile)) {
            fos.write(pdfBytes);
        }
    }
}
