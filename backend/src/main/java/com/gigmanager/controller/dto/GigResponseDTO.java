package com.gigmanager.controller.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class GigResponseDTO {

    private UUID id;
    private String title;
    private LocalDateTime eventDate;
    private String venue;
    private String notes;
    private String representativeName;
    private List<GigItemResponseDTO> items;

    @Data
    @Builder
    public static class GigItemResponseDTO {
        private UUID id;
        private UUID songId;
        private String songTitle;
        private String songComposer;
        private String performanceKey;
        private Integer blockNumber;
        private Integer orderIndex;
    }
}
