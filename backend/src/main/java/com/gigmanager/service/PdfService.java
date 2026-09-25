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
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
}
