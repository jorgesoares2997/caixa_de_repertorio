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
     * Generates a continuous, single-block setlist PDF for gigs.
     * Ordered strictly by orderIndex (corrida, 1 to N) with Neo-Brutalist styling.
     */
    public byte[] generateGigSetlistPdf(Gig gig, List<GigItem> items) {
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
            leftHeader.add(new Paragraph("CAIXA DE REPERTÓRIO • ESTÚDIO MUSICAL & GIGS")
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
            rightHeader.add(new Paragraph("ESCALA DO SHOW")
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

            // Date
            String dateStr = "Data não informada";
            if (gig.getEventDate() != null) {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH'h'mm");
                dateStr = gig.getEventDate().format(formatter);
            }
            Cell dateCell = new Cell().setBorder(null).setPadding(6).setPaddingLeft(10);
            dateCell.add(new Paragraph("DATA & HORA").setFontSize(7).setBold().setFontColor(COLOR_DIM));
            dateCell.add(new Paragraph(dateStr).setFontSize(9).setBold().setFontColor(COLOR_INK));
            metaTable.addCell(dateCell);

            // Venue
            String venueStr = gig.getVenue() != null && !gig.getVenue().isBlank() ? gig.getVenue() : "Local não informado";
            Cell venueCell = new Cell().setBorder(null).setPadding(6);
            venueCell.add(new Paragraph("LOCAL").setFontSize(7).setBold().setFontColor(COLOR_DIM));
            venueCell.add(new Paragraph(venueStr).setFontSize(9).setBold().setFontColor(COLOR_INK));
            metaTable.addCell(venueCell);

            // Representative / Project
            String repStr = gig.getRepresentative() != null ? gig.getRepresentative().getName() : "Repertório Geral";
            Cell repCell = new Cell().setBorder(null).setPadding(6);
            repCell.add(new Paragraph("PROJETO / ARTISTA").setFontSize(7).setBold().setFontColor(COLOR_DIM));
            repCell.add(new Paragraph(repStr).setFontSize(9).setBold().setFontColor(COLOR_INK));
            metaTable.addCell(repCell);

            document.add(metaTable);

            // ── Single Continuous Table (Tabela Corrida 1 a N) ──
            Table table = new Table(UnitValue.createPercentArray(new float[]{6, 42, 24, 12, 16})).useAllAvailableWidth();
            table.setBorder(BORDER_SOLID);

            // Headers
            table.addHeaderCell(createHeaderCell("#", TextAlignment.CENTER));
            table.addHeaderCell(createHeaderCell("MÚSICA", TextAlignment.LEFT));
            table.addHeaderCell(createHeaderCell("COMPOSITOR", TextAlignment.LEFT));
            table.addHeaderCell(createHeaderCell("TOM", TextAlignment.CENTER));
            table.addHeaderCell(createHeaderCell("OBSERVAÇÕES", TextAlignment.LEFT));

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

                // Title + Genre subtitle
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

                // Key (Performance Key or Original Key) - Highlighted badge styling
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

                // Notes
                String notes = song.getNotes() != null && !song.getNotes().isBlank() ? song.getNotes() : "-";
                Cell notesCell = new Cell()
                        .setKeepTogether(true)
                        .setBackgroundColor(rowBg)
                        .setBorder(BORDER_THIN)
                        .setPadding(6)
                        .setVerticalAlignment(VerticalAlignment.MIDDLE)
                        .add(new Paragraph(notes).setFontSize(8f).setFontColor(COLOR_DIM));
                table.addCell(notesCell);
            }

            document.add(table);
            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate Gig setlist PDF", e);
        }
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
        return new Cell()
                .setBackgroundColor(COLOR_INK)
                .setBorder(BORDER_SOLID)
                .setPadding(6)
                .setTextAlignment(alignment)
                .setVerticalAlignment(VerticalAlignment.MIDDLE)
                .add(new Paragraph(text).setFontSize(8.5f).setBold().setFontColor(COLOR_WHITE));
    }
}
