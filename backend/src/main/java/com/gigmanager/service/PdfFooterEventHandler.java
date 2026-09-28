package com.gigmanager.service;

import com.itextpdf.kernel.events.Event;
import com.itextpdf.kernel.events.IEventHandler;
import com.itextpdf.kernel.events.PdfDocumentEvent;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfPage;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.itextpdf.layout.Canvas;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.TextAlignment;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class PdfFooterEventHandler implements IEventHandler {
    private final int totalSongs;

    public PdfFooterEventHandler(int totalSongs) {
        this.totalSongs = totalSongs;
    }

    @Override
    public void handleEvent(Event event) {
        PdfDocumentEvent docEvent = (PdfDocumentEvent) event;
        PdfDocument pdf = docEvent.getDocument();
        PdfPage page = docEvent.getPage();
        int pageNumber = pdf.getPageNumber(page);

        PdfCanvas pdfCanvas = new PdfCanvas(page.newContentStreamBefore(), page.getResources(), pdf);
        Canvas canvas = new Canvas(pdfCanvas, page.getPageSize());

        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        String footerText = String.format("Emissão: %s | Total de obras vinculadas: %d | Página %d", date, totalSongs, pageNumber);

        canvas.showTextAligned(new Paragraph(footerText).setFontSize(9),
                page.getPageSize().getWidth() / 2,
                20, TextAlignment.CENTER);
        
        canvas.close();
    }
}
