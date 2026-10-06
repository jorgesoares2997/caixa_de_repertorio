package com.gigmanager.controller.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SongDTO {
    private UUID id;
    private String title;
    private String composer;
    private String genre;
    private String originalKey;
    private Integer masteryLevel;
    private Integer tempoBpm;
    private String notes;
    private LocalDateTime lastPracticedAt;

    @Builder.Default
    private List<RepresentativeLinkDTO> representativeLinks = new ArrayList<>();
}
