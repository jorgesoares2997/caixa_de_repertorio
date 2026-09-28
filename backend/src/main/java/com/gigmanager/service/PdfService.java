package com.gigmanager.service;

import com.gigmanager.domain.Gig;
import com.gigmanager.domain.GigItem;
import com.gigmanager.domain.Song;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import com.gigmanager.domain.Representative;
import com.gigmanager.domain.RepresentativeSong;
import com.itextpdf.kernel.events.PdfDocumentEvent;
import java.util.Comparator;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.List;

@Service
public class PdfService {

    public byte[] generateGigSetlistPdf(Gig gig, List<GigItem> items) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            // Title
            document.add(new Paragraph(gig.getTitle())
                    .setFontSize(20)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER));

            if (gig.getEventDate() != null) {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
                document.add(new Paragraph("Date: " + gig.getEventDate().format(formatter))
                        .setTextAlignment(TextAlignment.CENTER));
            }
            if (gig.getVenue() != null) {
                document.add(new Paragraph("Venue: " + gig.getVenue())
                        .setTextAlignment(TextAlignment.CENTER));
            }
            document.add(new Paragraph("\n"));

            // Group by Composer
            Map<String, List<GigItem>> itemsByComposer = items.stream()
                    .collect(Collectors.groupingBy(item -> 
                            item.getSong().getComposer() != null && !item.getSong().getComposer().isBlank() 
                                    ? item.getSong().getComposer() 
                                    : "Unknown Composer"));

            for (Map.Entry<String, List<GigItem>> entry : itemsByComposer.entrySet()) {
                document.add(new Paragraph(entry.getKey() + " Block")
                        .setFontSize(14)
                        .setBold()
                        .setBackgroundColor(ColorConstants.LIGHT_GRAY)
                        .setPadding(5));

                Table table = new Table(UnitValue.createPercentArray(new float[]{10, 40, 20, 30})).useAllAvailableWidth();
                table.addHeaderCell(new Cell().add(new Paragraph("Order").setBold()));
                table.addHeaderCell(new Cell().add(new Paragraph("Title").setBold()));
                table.addHeaderCell(new Cell().add(new Paragraph("Key").setBold()));
                table.addHeaderCell(new Cell().add(new Paragraph("Notes").setBold()));

                for (GigItem item : entry.getValue()) {
                    table.addCell(new Paragraph(item.getOrderIndex() != null ? item.getOrderIndex().toString() : "-"));
                    table.addCell(new Paragraph(item.getSong().getTitle()));
                    table.addCell(new Paragraph(item.getPerformanceKey() != null ? item.getPerformanceKey() : 
                            (item.getSong().getOriginalKey() != null ? item.getSong().getOriginalKey() : "-")));
                    table.addCell(new Paragraph(item.getSong().getNotes() != null ? item.getSong().getNotes() : "-"));
                }
                document.add(table);
                document.add(new Paragraph("\n"));
            }

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }

    public byte[] generatePortfolioPdf(List<Song> songs, String filterDescription) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            document.add(new Paragraph("Repertoire Portfolio")
                    .setFontSize(20)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER));

            if (filterDescription != null && !filterDescription.isBlank()) {
                document.add(new Paragraph("Filter: " + filterDescription)
                        .setTextAlignment(TextAlignment.CENTER));
            }
            document.add(new Paragraph("Total Songs: " + songs.size())
                    .setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("\n"));

            // Two columns layout table
            Table table = new Table(UnitValue.createPercentArray(new float[]{40, 10, 40, 10})).useAllAvailableWidth();
            table.addHeaderCell(new Cell().add(new Paragraph("Song (Col 1)").setBold()));
            table.addHeaderCell(new Cell().add(new Paragraph("Key").setBold()));
            table.addHeaderCell(new Cell().add(new Paragraph("Song (Col 2)").setBold()));
            table.addHeaderCell(new Cell().add(new Paragraph("Key").setBold()));

            for (int i = 0; i < songs.size(); i += 2) {
                Song song1 = songs.get(i);
                table.addCell(new Paragraph(song1.getTitle() + " (" + song1.getComposer() + ")").setFontSize(10));
                table.addCell(new Paragraph(song1.getOriginalKey() != null ? song1.getOriginalKey() : "-").setFontSize(10));

                if (i + 1 < songs.size()) {
                    Song song2 = songs.get(i + 1);
                    table.addCell(new Paragraph(song2.getTitle() + " (" + song2.getComposer() + ")").setFontSize(10));
                    table.addCell(new Paragraph(song2.getOriginalKey() != null ? song2.getOriginalKey() : "-").setFontSize(10));
                } else {
                    table.addCell(new Cell());
                    table.addCell(new Cell());
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
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            
            // Add Footer Event Handler
            pdf.addEventHandler(PdfDocumentEvent.END_PAGE, new PdfFooterEventHandler(songs.size()));
            
            Document document = new Document(pdf);

            document.add(new Paragraph("Repertório Oficial • " + representative.getName())
                    .setFontSize(20)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("\n"));

            // Sort
            Comparator<RepresentativeSong> comparator = (s1, s2) -> 0; // Default no-op
            if ("TITLE".equalsIgnoreCase(sortBy)) {
                comparator = Comparator.comparing(rs -> rs.getSong().getTitle(), String.CASE_INSENSITIVE_ORDER);
            } else if ("KEY".equalsIgnoreCase(sortBy)) {
                comparator = Comparator.comparing(rs -> rs.getPerformanceKey() != null ? rs.getPerformanceKey() : (rs.getSong().getOriginalKey() != null ? rs.getSong().getOriginalKey() : ""), String.CASE_INSENSITIVE_ORDER);
            } else if ("DOMINIO".equalsIgnoreCase(sortBy)) {
                comparator = Comparator.comparing(rs -> rs.getSong().getMasteryLevel() != null ? rs.getSong().getMasteryLevel() : 0, Comparator.reverseOrder());
            }

            // 1. Visão Geral (Todas as Músicas juntas)
            document.add(new Paragraph("Visão Geral (" + songs.size() + " músicas)")
                    .setFontSize(16)
                    .setBold()
                    .setBackgroundColor(ColorConstants.LIGHT_GRAY)
                    .setPadding(5));

            List<RepresentativeSong> sortedAllSongs = songs.stream().sorted(comparator).collect(Collectors.toList());
            document.add(createTableForSongs(sortedAllSongs));
            document.add(new Paragraph("\n"));

            // Group
            boolean groupByComposer = "COMPOSER".equalsIgnoreCase(groupBy);
            boolean groupByGenre = "GENRE".equalsIgnoreCase(groupBy);

            // 2. Agrupamentos (se aplicável)
            if (groupByComposer || groupByGenre) {
                document.add(new Paragraph("Visão Agrupada por " + (groupByComposer ? "Compositor" : "Gênero"))
                        .setFontSize(16)
                        .setBold()
                        .setPaddingTop(10));
                document.add(new Paragraph("\n"));

                Map<String, List<RepresentativeSong>> grouped;
                if (groupByComposer) {
                    grouped = songs.stream().sorted(comparator).collect(Collectors.groupingBy(rs -> rs.getSong().getComposer() != null && !rs.getSong().getComposer().isBlank() ? rs.getSong().getComposer() : "Desconhecido"));
                } else {
                    grouped = songs.stream().sorted(comparator).collect(Collectors.groupingBy(rs -> rs.getSong().getGenre() != null && !rs.getSong().getGenre().isBlank() ? rs.getSong().getGenre() : "Desconhecido"));
                }

                for (Map.Entry<String, List<RepresentativeSong>> entry : grouped.entrySet()) {
                    String groupName = entry.getKey();
                    List<RepresentativeSong> groupSongs = entry.getValue();

                    document.add(new Paragraph(groupName + " (" + groupSongs.size() + " músicas)")
                            .setFontSize(14)
                            .setBold()
                            .setBackgroundColor(ColorConstants.LIGHT_GRAY)
                            .setPadding(5));

                    document.add(createTableForSongs(groupSongs));
                    document.add(new Paragraph("\n"));
                }
            }

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }

    private Table createTableForSongs(List<RepresentativeSong> groupSongs) {
        Table table = new Table(UnitValue.createPercentArray(new float[]{25, 15, 15, 10, 25, 10})).useAllAvailableWidth();
        table.addHeaderCell(new Cell().add(new Paragraph("Título").setBold().setFontSize(10)));
        table.addHeaderCell(new Cell().add(new Paragraph("Compositor").setBold().setFontSize(10)));
        table.addHeaderCell(new Cell().add(new Paragraph("Gênero").setBold().setFontSize(10)));
        table.addHeaderCell(new Cell().add(new Paragraph("Tom").setBold().setFontSize(10)));
        table.addHeaderCell(new Cell().add(new Paragraph("Observações").setBold().setFontSize(10)));
        table.addHeaderCell(new Cell().add(new Paragraph("Domínio").setBold().setFontSize(10)));

        for (RepresentativeSong rs : groupSongs) {
            Song s = rs.getSong();
            table.addCell(new Paragraph(s.getTitle()).setFontSize(9));
            table.addCell(new Paragraph(s.getComposer() != null ? s.getComposer() : "-").setFontSize(9));
            table.addCell(new Paragraph(s.getGenre() != null ? s.getGenre() : "-").setFontSize(9));
            
            String key = rs.getPerformanceKey() != null ? rs.getPerformanceKey() : (s.getOriginalKey() != null ? s.getOriginalKey() : "-");
            table.addCell(new Paragraph(key).setFontSize(9));
            
            table.addCell(new Paragraph(rs.getSpecificNotes() != null ? rs.getSpecificNotes() : "-").setFontSize(9));
            
            table.addCell(new Paragraph(s.getMasteryLevel() != null ? String.valueOf(s.getMasteryLevel()) : "-").setFontSize(9));
        }
        return table;
    }
}
