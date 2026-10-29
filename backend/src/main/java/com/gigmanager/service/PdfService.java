package com.gigmanager.service;

import com.gigmanager.domain.Gig;
import com.gigmanager.domain.GigItem;
import com.gigmanager.domain.Representative;
import com.gigmanager.domain.RepresentativeSong;
import com.gigmanager.domain.Song;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.events.PdfDocumentEvent;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PdfService {

    // Neo-Brutalist Visual Identity Palette
    private static final DeviceRgb COLOR_INK = new DeviceRgb(22, 22, 22);       // #161616
    private static final DeviceRgb COLOR_WHITE = new DeviceRgb(255, 255, 255);  // #FFFFFF
    private static final DeviceRgb COLOR_LIME = new DeviceRgb(204, 255, 0);     // #CCFF00
    private static final DeviceRgb COLOR_LAVENDER = new DeviceRgb(216, 180, 254); // #D8B4FE
    private static final DeviceRgb COLOR_MUTED = new DeviceRgb(246, 246, 248);   // #F6F6F8
    private static final DeviceRgb COLOR_DIM = new DeviceRgb(100, 100, 110);    // #64646E

    private static final SolidBorder BORDER_THICK = new SolidBorder(COLOR_INK, 1.8f);
    private static final SolidBorder BORDER_SOLID = new SolidBorder(COLOR_INK, 1.2f);
    private static final SolidBorder BORDER_THIN = new SolidBorder(COLOR_INK, 0.6f);

    /**
     * Generates a detailed Study Setlist PDF for rehearsal & study (PDF de Estudo).
     * Displays mastery level column instead of observations, with full meta info.
     */
    public byte[] generateGigStudyPdf(Gig gig, List<GigItem> items) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);

            // Register branded footer event handler
            pdf.addEventHandler(PdfDocumentEvent.END_PAGE, new PdfFooterEventHandler(items.size()));

            Document document = new Document(pdf);
            document.setMargins(32, 32, 36, 32);

            // Sort items continuously by orderIndex
            List<GigItem> sortedItems = items.stream()
                    .sorted(Comparator.comparing(item -> item.getOrderIndex() != null ? item.getOrderIndex() : 0))
                    .collect(Collectors.toList());

            // ── Top Brand Header Banner ──
            Table headerTable = new Table(UnitValue.createPercentArray(new float[]{75, 25})).useAllAvailableWidth();
            headerTable.setBorder(BORDER_THICK);
            headerTable.setBackgroundColor(COLOR_INK);

            Cell leftHeader = new Cell()
                    .setBorder(null)
                    .setPadding(12)
                    .setVerticalAlignment(VerticalAlignment.MIDDLE);
            leftHeader.add(new Paragraph("CAIXA DE REPERTÓRIO • MATERIAL DE ESTUDO & ENSAIO")
                    .setFontSize(8)
                    .setBold()
                    .setFontColor(COLOR_LIME)
                    .setMarginBottom(3));
            leftHeader.add(new Paragraph(gig.getTitle().toUpperCase())
                    .setFontSize(18)
                    .setBold()
                    .setFontColor(COLOR_WHITE)
                    .setMargin(0));
            headerTable.addCell(leftHeader);

            Cell rightHeader = new Cell()
                    .setBorder(null)
                    .setPadding(12)
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setVerticalAlignment(VerticalAlignment.MIDDLE);
            rightHeader.add(new Paragraph("ESCALA DE ESTUDO")
                    .setFontSize(9)
                    .setBold()
                    .setFontColor(COLOR_WHITE));
            rightHeader.add(new Paragraph(sortedItems.size() + " FAIXAS")
                    .setFontSize(11)
                    .setBold()
                    .setFontColor(COLOR_LIME));
            headerTable.addCell(rightHeader);

            document.add(headerTable);

            // ── Meta Details Info Bar ──
            Table metaTable = new Table(UnitValue.createPercentArray(new float[]{35, 35, 30})).useAllAvailableWidth();
            metaTable.setBorder(BORDER_SOLID);
            metaTable.setBackgroundColor(COLOR_MUTED);
            metaTable.setMarginTop(6);
            metaTable.setMarginBottom(12);

            String dateStr = "Data não informada";
            if (gig.getEventDate() != null) {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH'h'mm");
                dateStr = gig.getEventDate().format(formatter);
            }
            Cell dateCell = new Cell().setBorder(null).setPadding(6).setPaddingLeft(10);
            dateCell.add(new Paragraph("DATA & HORA").setFontSize(7).setBold().setFontColor(COLOR_DIM));
            dateCell.add(new Paragraph(dateStr).setFontSize(9).setBold().setFontColor(COLOR_INK));
            metaTable.addCell(dateCell);

            String venueStr = gig.getVenue() != null && !gig.getVenue().isBlank() ? gig.getVenue() : "Local não informado";
            Cell venueCell = new Cell().setBorder(null).setPadding(6);
            venueCell.add(new Paragraph("LOCAL").setFontSize(7).setBold().setFontColor(COLOR_DIM));
            venueCell.add(new Paragraph(venueStr).setFontSize(9).setBold().setFontColor(COLOR_INK));
            metaTable.addCell(venueCell);

            String repStr = gig.getRepresentative() != null ? gig.getRepresentative().getName() : "Repertório Geral";
            Cell repCell = new Cell().setBorder(null).setPadding(6);
            repCell.add(new Paragraph("PROJETO / ARTISTA").setFontSize(7).setBold().setFontColor(COLOR_DIM));
            repCell.add(new Paragraph(repStr).setFontSize(9).setBold().setFontColor(COLOR_INK));
            metaTable.addCell(repCell);

            document.add(metaTable);

            // ── Single Continuous Study Table ──
            // Columns: # (6%), Música (38%), Compositor (22%), Tom (14%), Domínio (20%)
            Table table = new Table(UnitValue.createPercentArray(new float[]{6, 38, 22, 14, 20})).useAllAvailableWidth();
            table.setBorder(BORDER_SOLID);

            table.addHeaderCell(createHeaderCell("#", TextAlignment.CENTER));
            table.addHeaderCell(createHeaderCell("MÚSICA", TextAlignment.LEFT));
            table.addHeaderCell(createHeaderCell("COMPOSITOR", TextAlignment.LEFT));
            table.addHeaderCell(createHeaderCell("TOM", TextAlignment.CENTER));
            table.addHeaderCell(createHeaderCell("DOMÍNIO", TextAlignment.CENTER));

            for (int i = 0; i < sortedItems.size(); i++) {
                GigItem item = sortedItems.get(i);
                Song song = item.getSong();
                DeviceRgb rowBg = (i % 2 == 0) ? COLOR_WHITE : COLOR_MUTED;

                // Index
                Cell indexCell = new Cell()
                        .setKeepTogether(true)
                        .setBackgroundColor(rowBg)
                        .setBorder(BORDER_THIN)
                        .setPadding(6)
                        .setTextAlignment(TextAlignment.CENTER)
                        .setVerticalAlignment(VerticalAlignment.MIDDLE)
                        .add(new Paragraph(String.valueOf(i + 1)).setFontSize(9).setBold().setFontColor(COLOR_INK));
                table.addCell(indexCell);

                // Title + Genre
                Cell titleCell = new Cell()
                        .setKeepTogether(true)
                        .setBackgroundColor(rowBg)
                        .setBorder(BORDER_THIN)
                        .setPadding(6)
                        .setVerticalAlignment(VerticalAlignment.MIDDLE);
                titleCell.add(new Paragraph(song.getTitle()).setFontSize(9.5f).setBold().setFontColor(COLOR_INK).setMargin(0));
                if (song.getGenre() != null && !song.getGenre().isBlank()) {
                    titleCell.add(new Paragraph(song.getGenre()).setFontSize(7.5f).setFontColor(COLOR_DIM).setMarginTop(1));
                }
                table.addCell(titleCell);

                // Composer
                String composer = song.getComposer() != null && !song.getComposer().isBlank() ? song.getComposer() : "-";
                Cell compCell = new Cell()
                        .setKeepTogether(true)
                        .setBackgroundColor(rowBg)
                        .setBorder(BORDER_THIN)
                        .setPadding(6)
                        .setVerticalAlignment(VerticalAlignment.MIDDLE)
                        .add(new Paragraph(composer).setFontSize(8.5f).setFontColor(COLOR_INK));
                table.addCell(compCell);

                // Key
                String key = item.getPerformanceKey() != null && !item.getPerformanceKey().isBlank()
                        ? item.getPerformanceKey()
                        : (song.getOriginalKey() != null ? song.getOriginalKey() : "-");
                Cell keyCell = new Cell()
                        .setKeepTogether(true)
                        .setBackgroundColor(COLOR_LAVENDER)
                        .setBorder(BORDER_THIN)
                        .setPadding(4)
                        .setTextAlignment(TextAlignment.CENTER)
                        .setVerticalAlignment(VerticalAlignment.MIDDLE)
                        .add(new Paragraph(key).setFontSize(10).setBold().setFontColor(COLOR_INK));
                table.addCell(keyCell);

                // Mastery Level column instead of Observations
                int mastery = song.getMasteryLevel() != null ? song.getMasteryLevel() : 1;
                String masteryText;
                DeviceRgb masteryBg;
                switch (mastery) {
                    case 5:
                        masteryText = "NÍVEL 5 • DOMINADA";
                        masteryBg = COLOR_LIME;
                        break;
                    case 4:
                        masteryText = "NÍVEL 4 • SEGURA";
                        masteryBg = COLOR_LAVENDER;
                        break;
                    case 3:
                        masteryText = "NÍVEL 3 • REVISAR";
                        masteryBg = rowBg;
                        break;
                    case 2:
                        masteryText = "NÍVEL 2 • EM ESTUDO";
                        masteryBg = rowBg;
                        break;
                    default:
                        masteryText = "NÍVEL 1 • INICIAL";
                        masteryBg = rowBg;
                        break;
                }
                Cell masteryCell = new Cell()
                        .setKeepTogether(true)
                        .setBackgroundColor(masteryBg)
                        .setBorder(BORDER_THIN)
                        .setPadding(5)
                        .setTextAlignment(TextAlignment.CENTER)
                        .setVerticalAlignment(VerticalAlignment.MIDDLE)
                        .add(new Paragraph(masteryText).setFontSize(8f).setBold().setFontColor(COLOR_INK));
                table.addCell(masteryCell);
            }

            document.add(table);
            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate Gig study PDF", e);
        }
    }

    /**
     * Generates an ultra-clean, high-visibility Stage Setlist PDF (PDF de Show).
     * Contains ONLY: Number (#), Song Title, and Key (Tom).
     * Specifically designed to ALWAYS fit on a SINGLE PAGE:
     * - 1 Column if <= 16 songs (large spacious fonts)
     * - 2 Balanced Columns if > 16 songs (dynamically scaled, single-sheet guaranteed for musicians on stage)
     */
    public byte[] generateGigShowPdf(Gig gig, List<GigItem> items) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);

            Document document = new Document(pdf);
            // Tight margins to guarantee single page
            document.setMargins(18, 22, 18, 22);

            List<GigItem> sortedItems = items.stream()
                    .sorted(Comparator.comparing(item -> item.getOrderIndex() != null ? item.getOrderIndex() : 0))
                    .collect(Collectors.toList());

            int total = sortedItems.size();

            // ── Compact Stage Header Banner ──
            Table headerTable = new Table(UnitValue.createPercentArray(new float[]{78, 22})).useAllAvailableWidth();
            headerTable.setBorder(BORDER_THICK);
            headerTable.setBackgroundColor(COLOR_INK);

            Cell leftHeader = new Cell()
                    .setBorder(null)
                    .setPadding(8)
                    .setPaddingLeft(10)
                    .setVerticalAlignment(VerticalAlignment.MIDDLE);
            leftHeader.add(new Paragraph("CAIXA DE REPERTÓRIO • SETLIST DE PALCO")
                    .setFontSize(7.5f)
                    .setBold()
                    .setFontColor(COLOR_LIME)
                    .setMarginBottom(1));
            leftHeader.add(new Paragraph(gig.getTitle().toUpperCase())
                    .setFontSize(15)
                    .setBold()
                    .setFontColor(COLOR_WHITE)
                    .setMargin(0));

            StringBuilder metaSb = new StringBuilder();
            if (gig.getEventDate() != null) {
                metaSb.append(gig.getEventDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH'h'mm")));
            }
            if (gig.getVenue() != null && !gig.getVenue().isBlank()) {
                if (metaSb.length() > 0) metaSb.append(" • ");
                metaSb.append(gig.getVenue());
            }
            if (gig.getRepresentative() != null) {
                if (metaSb.length() > 0) metaSb.append(" • ");
                metaSb.append(gig.getRepresentative().getName());
            }
            if (metaSb.length() > 0) {
                leftHeader.add(new Paragraph(metaSb.toString())
                        .setFontSize(7.5f)
                        .setFontColor(new DeviceRgb(220, 220, 225))
                        .setMarginTop(1)
                        .setMarginBottom(0));
            }
            headerTable.addCell(leftHeader);

            Cell rightHeader = new Cell()
                    .setBorder(null)
                    .setPadding(8)
                    .setPaddingRight(10)
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setVerticalAlignment(VerticalAlignment.MIDDLE);
            rightHeader.add(new Paragraph("ESCALA DO SHOW")
                    .setFontSize(8)
                    .setBold()
                    .setFontColor(COLOR_WHITE)
                    .setMarginBottom(1));
            rightHeader.add(new Paragraph(total + " FAIXAS")
                    .setFontSize(12)
                    .setBold()
                    .setFontColor(COLOR_LIME)
                    .setMargin(0));
            headerTable.addCell(rightHeader);

            document.add(headerTable);

            if (total <= 16) {
                // ── 1 COLUMN LAYOUT (Large readable fonts) ──
                Table table = new Table(UnitValue.createPercentArray(new float[]{8, 74, 18})).useAllAvailableWidth();
                table.setBorder(BORDER_SOLID);
                table.setMarginTop(8);

                table.addHeaderCell(createHeaderCell("#", TextAlignment.CENTER, 9f, 5f));
                table.addHeaderCell(createHeaderCell("MÚSICA", TextAlignment.LEFT, 9f, 5f));
                table.addHeaderCell(createHeaderCell("TOM", TextAlignment.CENTER, 9f, 5f));

                float rowPadding = total <= 10 ? 7.5f : 5.5f;
                float titleFontSize = total <= 10 ? 13f : 11.5f;
                float keyFontSize = total <= 10 ? 14f : 12.5f;

                for (int i = 0; i < total; i++) {
                    GigItem item = sortedItems.get(i);
                    Song song = item.getSong();
                    DeviceRgb rowBg = (i % 2 == 0) ? COLOR_WHITE : COLOR_MUTED;

                    // Index
                    Cell indexCell = new Cell()
                            .setKeepTogether(true)
                            .setBackgroundColor(rowBg)
                            .setBorder(BORDER_THIN)
                            .setPadding(rowPadding)
                            .setTextAlignment(TextAlignment.CENTER)
                            .setVerticalAlignment(VerticalAlignment.MIDDLE)
                            .add(new Paragraph(String.format("%02d", i + 1)).setFontSize(10f).setBold().setFontColor(COLOR_INK).setMargin(0));
                    table.addCell(indexCell);

                    // Title
                    Cell titleCell = new Cell()
                            .setKeepTogether(true)
                            .setBackgroundColor(rowBg)
                            .setBorder(BORDER_THIN)
                            .setPadding(rowPadding)
                            .setVerticalAlignment(VerticalAlignment.MIDDLE)
                            .add(new Paragraph(song.getTitle().toUpperCase()).setFontSize(titleFontSize).setBold().setFontColor(COLOR_INK).setMargin(0));
                    table.addCell(titleCell);

                    // Key (Big, bold, high contrast)
                    String key = item.getPerformanceKey() != null && !item.getPerformanceKey().isBlank()
                            ? item.getPerformanceKey()
                            : (song.getOriginalKey() != null ? song.getOriginalKey() : "-");
                    Cell keyCell = new Cell()
                            .setKeepTogether(true)
                            .setBackgroundColor(COLOR_LAVENDER)
                            .setBorder(BORDER_THIN)
                            .setPadding(rowPadding - 1)
                            .setTextAlignment(TextAlignment.CENTER)
                            .setVerticalAlignment(VerticalAlignment.MIDDLE)
                            .add(new Paragraph(key).setFontSize(keyFontSize).setBold().setFontColor(COLOR_INK).setMargin(0));
                    table.addCell(keyCell);
                }

                document.add(table);
            } else {
                // ── 2 COLUMNS BALANCED LAYOUT (Guaranteed 1 page) ──
                int half = (total + 1) / 2;

                // 7 columns: [#L, MúsL, TomL, Gap, #R, MúsR, TomR]
                Table table = new Table(UnitValue.createPercentArray(new float[]{5.5f, 32.5f, 9.5f, 5f, 5.5f, 32.5f, 9.5f})).useAllAvailableWidth();
                table.setBorder(BORDER_SOLID);
                table.setMarginTop(8);

                // Headers
                table.addHeaderCell(createHeaderCell("#", TextAlignment.CENTER, 8f, 4f));
                table.addHeaderCell(createHeaderCell("MÚSICA", TextAlignment.LEFT, 8f, 4f));
                table.addHeaderCell(createHeaderCell("TOM", TextAlignment.CENTER, 8f, 4f));

                // Gap Header
                table.addHeaderCell(new Cell().setBackgroundColor(COLOR_MUTED).setBorder(BORDER_SOLID).setPadding(0));

                table.addHeaderCell(createHeaderCell("#", TextAlignment.CENTER, 8f, 4f));
                table.addHeaderCell(createHeaderCell("MÚSICA", TextAlignment.LEFT, 8f, 4f));
                table.addHeaderCell(createHeaderCell("TOM", TextAlignment.CENTER, 8f, 4f));

                float titleFont;
                float keyFont;
                float pad;
                if (half <= 18) {
                    titleFont = 10.5f;
                    keyFont = 11.0f;
                    pad = 4.2f;
                } else if (half <= 24) {
                    titleFont = 9.5f;
                    keyFont = 10.0f;
                    pad = 3.2f;
                } else if (half <= 30) {
                    titleFont = 8.5f;
                    keyFont = 9.0f;
                    pad = 2.2f;
                } else {
                    titleFont = 7.8f;
                    keyFont = 8.2f;
                    pad = 1.2f;
                }

                for (int r = 0; r < half; r++) {
                    DeviceRgb rowBg = (r % 2 == 0) ? COLOR_WHITE : COLOR_MUTED;
                    GigItem leftItem = sortedItems.get(r);
                    Song leftSong = leftItem.getSong();
                    String leftKey = leftItem.getPerformanceKey() != null && !leftItem.getPerformanceKey().isBlank()
                            ? leftItem.getPerformanceKey()
                            : (leftSong.getOriginalKey() != null ? leftSong.getOriginalKey() : "-");

                    // Left Index
                    table.addCell(new Cell().setKeepTogether(true).setBackgroundColor(rowBg).setBorder(BORDER_THIN).setPadding(pad)
                            .setTextAlignment(TextAlignment.CENTER).setVerticalAlignment(VerticalAlignment.MIDDLE)
                            .add(new Paragraph(String.format("%02d", r + 1)).setFontSize(titleFont - 1).setBold().setFontColor(COLOR_INK).setMargin(0)));

                    // Left Title
                    table.addCell(new Cell().setKeepTogether(true).setBackgroundColor(rowBg).setBorder(BORDER_THIN).setPadding(pad)
                            .setVerticalAlignment(VerticalAlignment.MIDDLE)
                            .add(new Paragraph(leftSong.getTitle().toUpperCase()).setFontSize(titleFont).setBold().setFontColor(COLOR_INK).setMargin(0)));

                    // Left Key
                    table.addCell(new Cell().setKeepTogether(true).setBackgroundColor(COLOR_LAVENDER).setBorder(BORDER_THIN).setPadding(pad - 0.5f)
                            .setTextAlignment(TextAlignment.CENTER).setVerticalAlignment(VerticalAlignment.MIDDLE)
                            .add(new Paragraph(leftKey).setFontSize(keyFont).setBold().setFontColor(COLOR_INK).setMargin(0)));

                    // Center Gap / Divider
                    table.addCell(new Cell().setBackgroundColor(COLOR_MUTED).setBorder(BORDER_THIN).setPadding(0));

                    // Right Item
                    int rightIdx = r + half;
                    if (rightIdx < total) {
                        GigItem rightItem = sortedItems.get(rightIdx);
                        Song rightSong = rightItem.getSong();
                        String rightKey = rightItem.getPerformanceKey() != null && !rightItem.getPerformanceKey().isBlank()
                                ? rightItem.getPerformanceKey()
                                : (rightSong.getOriginalKey() != null ? rightSong.getOriginalKey() : "-");

                        // Right Index
                        table.addCell(new Cell().setKeepTogether(true).setBackgroundColor(rowBg).setBorder(BORDER_THIN).setPadding(pad)
                                .setTextAlignment(TextAlignment.CENTER).setVerticalAlignment(VerticalAlignment.MIDDLE)
                                .add(new Paragraph(String.format("%02d", rightIdx + 1)).setFontSize(titleFont - 1).setBold().setFontColor(COLOR_INK).setMargin(0)));

                        // Right Title
                        table.addCell(new Cell().setKeepTogether(true).setBackgroundColor(rowBg).setBorder(BORDER_THIN).setPadding(pad)
                                .setVerticalAlignment(VerticalAlignment.MIDDLE)
                                .add(new Paragraph(rightSong.getTitle().toUpperCase()).setFontSize(titleFont).setBold().setFontColor(COLOR_INK).setMargin(0)));

                        // Right Key
                        table.addCell(new Cell().setKeepTogether(true).setBackgroundColor(COLOR_LAVENDER).setBorder(BORDER_THIN).setPadding(pad - 0.5f)
                                .setTextAlignment(TextAlignment.CENTER).setVerticalAlignment(VerticalAlignment.MIDDLE)
                                .add(new Paragraph(rightKey).setFontSize(keyFont).setBold().setFontColor(COLOR_INK).setMargin(0)));
                    } else {
                        // Empty cells to finish the row
                        table.addCell(new Cell().setBackgroundColor(rowBg).setBorder(BORDER_THIN).setPadding(pad));
                        table.addCell(new Cell().setBackgroundColor(rowBg).setBorder(BORDER_THIN).setPadding(pad));
                        table.addCell(new Cell().setBackgroundColor(rowBg).setBorder(BORDER_THIN).setPadding(pad));
                    }
                }

                document.add(table);
            }

            // ── Minimal Single-Page Bottom Footer ──
            Paragraph footer = new Paragraph("CAIXA DE REPERTÓRIO • SETLIST DE PALCO • IMPRESSÃO PARA MÚSICOS")
                    .setFontSize(7)
                    .setBold()
                    .setFontColor(COLOR_DIM)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(8);
            document.add(footer);

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate Gig Show PDF", e);
        }
    }

    /**
     * Backward-compatible delegation.
     */
    public byte[] generateGigSetlistPdf(Gig gig, List<GigItem> items) {
        return generateGigShowPdf(gig, items);
    }

    /**
     * Generates a 2-column repertoire portfolio PDF with Neo-Brutalist branding.
     */
    public byte[] generatePortfolioPdf(List<Song> songs, String filterDescription) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            
            pdf.addEventHandler(PdfDocumentEvent.END_PAGE, new PdfFooterEventHandler(songs.size()));

            Document document = new Document(pdf);
            document.setMargins(32, 32, 36, 32);

            // Brand Header Banner
            Table headerTable = new Table(UnitValue.createPercentArray(new float[]{75, 25})).useAllAvailableWidth();
            headerTable.setBorder(BORDER_THICK);
            headerTable.setBackgroundColor(COLOR_INK);

            Cell leftHeader = new Cell()
                    .setBorder(null)
                    .setPadding(12)
                    .setVerticalAlignment(VerticalAlignment.MIDDLE);
            leftHeader.add(new Paragraph("CAIXA DE REPERTÓRIO • ACERVO GERAL")
                    .setFontSize(8)
                    .setBold()
                    .setFontColor(COLOR_LIME)
                    .setMarginBottom(3));
            leftHeader.add(new Paragraph("PORTFÓLIO DE REPERTÓRIO")
                    .setFontSize(18)
                    .setBold()
                    .setFontColor(COLOR_WHITE)
                    .setMargin(0));
            headerTable.addCell(leftHeader);

            Cell rightHeader = new Cell()
                    .setBorder(null)
                    .setPadding(12)
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setVerticalAlignment(VerticalAlignment.MIDDLE);
            rightHeader.add(new Paragraph("TOTAL CADASTRADO")
                    .setFontSize(8)
                    .setBold()
                    .setFontColor(COLOR_WHITE));
            rightHeader.add(new Paragraph(songs.size() + " MÚSICAS")
                    .setFontSize(11)
                    .setBold()
                    .setFontColor(COLOR_LIME));
            headerTable.addCell(rightHeader);

            document.add(headerTable);

            if (filterDescription != null && !filterDescription.isBlank()) {
                Paragraph filterP = new Paragraph("Filtro: " + filterDescription)
                        .setFontSize(8.5f)
                        .setFontColor(COLOR_DIM)
                        .setMarginTop(6)
                        .setMarginBottom(6);
                document.add(filterP);
            } else {
                document.add(new Paragraph("").setMarginBottom(10));
            }

            // Two-column Table layout
            Table table = new Table(UnitValue.createPercentArray(new float[]{40, 10, 40, 10})).useAllAvailableWidth();
            table.setBorder(BORDER_SOLID);

            table.addHeaderCell(createHeaderCell("MÚSICA & COMPOSITOR (COL 1)", TextAlignment.LEFT));
            table.addHeaderCell(createHeaderCell("TOM", TextAlignment.CENTER));
            table.addHeaderCell(createHeaderCell("MÚSICA & COMPOSITOR (COL 2)", TextAlignment.LEFT));
            table.addHeaderCell(createHeaderCell("TOM", TextAlignment.CENTER));

            for (int i = 0; i < songs.size(); i += 2) {
                DeviceRgb rowBg = ((i / 2) % 2 == 0) ? COLOR_WHITE : COLOR_MUTED;
                Song song1 = songs.get(i);

                // Col 1 Song
                String text1 = song1.getTitle() + (song1.getComposer() != null ? " • " + song1.getComposer() : "");
                table.addCell(new Cell().setBackgroundColor(rowBg).setBorder(BORDER_THIN).setPadding(5)
                        .add(new Paragraph(text1).setFontSize(8.5f).setBold().setFontColor(COLOR_INK)));
                // Col 1 Key
                String k1 = song1.getOriginalKey() != null ? song1.getOriginalKey() : "-";
                table.addCell(new Cell().setBackgroundColor(COLOR_LAVENDER).setBorder(BORDER_THIN).setPadding(4)
                        .setTextAlignment(TextAlignment.CENTER)
                        .add(new Paragraph(k1).setFontSize(9).setBold().setFontColor(COLOR_INK)));

                if (i + 1 < songs.size()) {
                    Song song2 = songs.get(i + 1);
                    String text2 = song2.getTitle() + (song2.getComposer() != null ? " • " + song2.getComposer() : "");
                    table.addCell(new Cell().setBackgroundColor(rowBg).setBorder(BORDER_THIN).setPadding(5)
                            .add(new Paragraph(text2).setFontSize(8.5f).setBold().setFontColor(COLOR_INK)));
                    String k2 = song2.getOriginalKey() != null ? song2.getOriginalKey() : "-";
                    table.addCell(new Cell().setBackgroundColor(COLOR_LAVENDER).setBorder(BORDER_THIN).setPadding(4)
                            .setTextAlignment(TextAlignment.CENTER)
                            .add(new Paragraph(k2).setFontSize(9).setBold().setFontColor(COLOR_INK)));
                } else {
                    table.addCell(new Cell().setBackgroundColor(rowBg).setBorder(BORDER_THIN));
                    table.addCell(new Cell().setBackgroundColor(rowBg).setBorder(BORDER_THIN));
                }
            }

            document.add(table);
            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate portfolio PDF", e);
        }
    }

    public byte[] generateRepresentativeRepertoirePdf(Representative representative, List<RepresentativeSong> songs, String groupBy, String sortBy) {
        return generateRepresentativeRepertoirePdf(representative, songs, groupBy, sortBy, null);
    }

    /**
     * Generates an official project/representative repertoire PDF with Neo-Brutalist branding.
     */
    public byte[] generateRepresentativeRepertoirePdf(Representative representative, List<RepresentativeSong> songs, String groupBy, String sortBy, String customTitle) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            
            pdf.addEventHandler(PdfDocumentEvent.END_PAGE, new PdfFooterEventHandler(songs.size()));
            
            Document document = new Document(pdf);
            document.setMargins(32, 32, 36, 32);

            boolean isGeral = representative != null && "Geral".equalsIgnoreCase(representative.getName());
            String titleName = (customTitle != null && !customTitle.isBlank()) 
                    ? customTitle.trim() 
                    : (isGeral ? "COMPILADO GERAL • ACERVO COMPLETO" : representative.getName());

            // Brand Header Banner
            Table headerTable = new Table(UnitValue.createPercentArray(new float[]{75, 25})).useAllAvailableWidth();
            headerTable.setBorder(BORDER_THICK);
            headerTable.setBackgroundColor(COLOR_INK);

            Cell leftHeader = new Cell()
                    .setBorder(null)
                    .setPadding(12)
                    .setVerticalAlignment(VerticalAlignment.MIDDLE);
            leftHeader.add(new Paragraph(isGeral ? "CAIXA DE REPERTÓRIO • COMPILADO GERAL" : "CAIXA DE REPERTÓRIO • PROJETO OFICIAL")
                    .setFontSize(8)
                    .setBold()
                    .setFontColor(COLOR_LIME)
                    .setMarginBottom(3));
            leftHeader.add(new Paragraph(titleName.toUpperCase())
                    .setFontSize(18)
                    .setBold()
                    .setFontColor(COLOR_WHITE)
                    .setMargin(0));
            headerTable.addCell(leftHeader);

            Cell rightHeader = new Cell()
                    .setBorder(null)
                    .setPadding(12)
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setVerticalAlignment(VerticalAlignment.MIDDLE);
            rightHeader.add(new Paragraph(isGeral ? "ACERVO COMPLETO" : "REPERTÓRIO ATIVO")
                    .setFontSize(8)
                    .setBold()
                    .setFontColor(COLOR_WHITE));
            rightHeader.add(new Paragraph(songs.size() + " OBRAS")
                    .setFontSize(11)
                    .setBold()
                    .setFontColor(COLOR_LIME));
            headerTable.addCell(rightHeader);

            document.add(headerTable);
            document.add(new Paragraph("").setMarginBottom(10));

            // Sorting
            Comparator<RepresentativeSong> comparator = (s1, s2) -> 0;
            if ("TITLE".equalsIgnoreCase(sortBy)) {
                comparator = Comparator.comparing(rs -> rs.getSong().getTitle(), String.CASE_INSENSITIVE_ORDER);
            } else if ("KEY".equalsIgnoreCase(sortBy)) {
                comparator = Comparator.comparing(rs -> rs.getPerformanceKey() != null ? rs.getPerformanceKey() : (rs.getSong().getOriginalKey() != null ? rs.getSong().getOriginalKey() : ""), String.CASE_INSENSITIVE_ORDER);
            } else if ("DOMINIO".equalsIgnoreCase(sortBy)) {
                comparator = Comparator.comparing(rs -> rs.getSong().getMasteryLevel() != null ? rs.getSong().getMasteryLevel() : 0, Comparator.reverseOrder());
            }

            // 1. Visão Geral (Todas as Músicas)
            Paragraph sectionTitle = new Paragraph((isGeral ? "CATÁLOGO COMPLETO DO ACERVO (" : "VISÃO GERAL (") + songs.size() + " MÚSICAS)")
                    .setFontSize(11)
                    .setBold()
                    .setFontColor(COLOR_INK)
                    .setMarginBottom(4);
            document.add(sectionTitle);

            List<RepresentativeSong> sortedAllSongs = songs.stream().sorted(comparator).collect(Collectors.toList());
            document.add(createTableForSongs(sortedAllSongs));

            // 2. Agrupamentos se solicitado
            boolean groupByComposer = "COMPOSER".equalsIgnoreCase(groupBy);
            boolean groupByGenre = "GENRE".equalsIgnoreCase(groupBy);

            if (groupByComposer || groupByGenre) {
                Paragraph groupSectionTitle = new Paragraph("\nVISÃO AGRUPADA POR " + (groupByComposer ? "COMPOSITOR" : "GÊNERO"))
                        .setFontSize(12)
                        .setBold()
                        .setFontColor(COLOR_INK)
                        .setMarginTop(12)
                        .setMarginBottom(6);
                document.add(groupSectionTitle);

                Map<String, List<RepresentativeSong>> grouped;
                if (groupByComposer) {
                    grouped = songs.stream().sorted(comparator).collect(Collectors.groupingBy(rs -> 
                            rs.getSong().getComposer() != null && !rs.getSong().getComposer().isBlank() 
                                    ? rs.getSong().getComposer() 
                                    : "Compositor Desconhecido"));
                } else {
                    grouped = songs.stream().sorted(comparator).collect(Collectors.groupingBy(rs -> 
                            rs.getSong().getGenre() != null && !rs.getSong().getGenre().isBlank() 
                                    ? rs.getSong().getGenre() 
                                    : "Gênero Geral"));
                }

                for (Map.Entry<String, List<RepresentativeSong>> entry : grouped.entrySet()) {
                    String groupName = entry.getKey();
                    List<RepresentativeSong> groupSongs = entry.getValue();

                    Paragraph groupHeader = new Paragraph("▸ " + groupName + " (" + groupSongs.size() + " obras)")
                            .setFontSize(10)
                            .setBold()
                            .setFontColor(COLOR_INK)
                            .setMarginTop(8)
                            .setMarginBottom(4);
                    document.add(groupHeader);
                    document.add(createTableForSongs(groupSongs));
                }
            }

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate representative PDF", e);
        }
    }

    private Table createTableForSongs(List<RepresentativeSong> groupSongs) {
        Table table = new Table(UnitValue.createPercentArray(new float[]{28, 18, 16, 12, 18, 8})).useAllAvailableWidth();
        table.setBorder(BORDER_SOLID);

        table.addHeaderCell(createHeaderCell("TÍTULO", TextAlignment.LEFT));
        table.addHeaderCell(createHeaderCell("COMPOSITOR", TextAlignment.LEFT));
        table.addHeaderCell(createHeaderCell("GÊNERO", TextAlignment.LEFT));
        table.addHeaderCell(createHeaderCell("TOM", TextAlignment.CENTER));
        table.addHeaderCell(createHeaderCell("OBSERVAÇÕES", TextAlignment.LEFT));
        table.addHeaderCell(createHeaderCell("DOMÍNIO", TextAlignment.CENTER));

        for (int i = 0; i < groupSongs.size(); i++) {
            RepresentativeSong rs = groupSongs.get(i);
            Song s = rs.getSong();
            DeviceRgb rowBg = (i % 2 == 0) ? COLOR_WHITE : COLOR_MUTED;

            table.addCell(new Cell().setBackgroundColor(rowBg).setBorder(BORDER_THIN).setPadding(5)
                    .add(new Paragraph(s.getTitle()).setFontSize(8.5f).setBold().setFontColor(COLOR_INK)));
            table.addCell(new Cell().setBackgroundColor(rowBg).setBorder(BORDER_THIN).setPadding(5)
                    .add(new Paragraph(s.getComposer() != null ? s.getComposer() : "-").setFontSize(8f).setFontColor(COLOR_DIM)));
            table.addCell(new Cell().setBackgroundColor(rowBg).setBorder(BORDER_THIN).setPadding(5)
                    .add(new Paragraph(s.getGenre() != null ? s.getGenre() : "-").setFontSize(8f).setFontColor(COLOR_DIM)));

            String key = rs.getPerformanceKey() != null ? rs.getPerformanceKey() : (s.getOriginalKey() != null ? s.getOriginalKey() : "-");
            table.addCell(new Cell().setBackgroundColor(COLOR_LAVENDER).setBorder(BORDER_THIN).setPadding(4)
                    .setTextAlignment(TextAlignment.CENTER)
                    .add(new Paragraph(key).setFontSize(9).setBold().setFontColor(COLOR_INK)));

            table.addCell(new Cell().setBackgroundColor(rowBg).setBorder(BORDER_THIN).setPadding(5)
                    .add(new Paragraph(rs.getSpecificNotes() != null ? rs.getSpecificNotes() : "-").setFontSize(7.5f).setFontColor(COLOR_DIM)));

            String mastery = s.getMasteryLevel() != null ? (s.getMasteryLevel() + "/5") : "-";
            table.addCell(new Cell().setBackgroundColor(rowBg).setBorder(BORDER_THIN).setPadding(4)
                    .setTextAlignment(TextAlignment.CENTER)
                    .add(new Paragraph(mastery).setFontSize(8f).setBold().setFontColor(COLOR_INK)));
        }
        return table;
    }

    private Cell createHeaderCell(String text, TextAlignment alignment) {
        return createHeaderCell(text, alignment, 8.5f, 6f);
    }

    private Cell createHeaderCell(String text, TextAlignment alignment, float fontSize, float padding) {
        return new Cell()
                .setBackgroundColor(COLOR_INK)
                .setBorder(BORDER_SOLID)
                .setPadding(padding)
                .setTextAlignment(alignment)
                .setVerticalAlignment(VerticalAlignment.MIDDLE)
                .add(new Paragraph(text).setFontSize(fontSize).setBold().setFontColor(COLOR_WHITE).setMargin(0));
    }
}
