package com.gigmanager.controller.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class GigRequestDTO {

    private String title;
    private LocalDateTime eventDate;
    private String venue;
    private String notes;
    private UUID representativeId;

    private List<GigItemDTO> items;

    @Data
    public static class GigItemDTO {
        private UUID songId;
        private Integer blockNumber;
        private Integer orderIndex;
        private String performanceKey;
    }
}
