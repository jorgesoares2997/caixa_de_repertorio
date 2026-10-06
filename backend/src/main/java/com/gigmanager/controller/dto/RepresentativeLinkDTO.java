package com.gigmanager.controller.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RepresentativeLinkDTO {
    private UUID representativeId;
    private String representativeName;
    private String performanceKey;
    private String specificNotes;
}
