package com.gigmanager.controller.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RepresentativeSongResponseDTO {
    private UUID songId;
    private String title;
    private String composer;
    private String genre;
    private Integer masteryLevel;
    private String performanceKey;
    private List<IntersectionDTO> intersections;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IntersectionDTO {
        private String representativeName;
        private String performanceKey;
    }
}
