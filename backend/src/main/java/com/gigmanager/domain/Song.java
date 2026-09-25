package com.gigmanager.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "songs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Song {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    private String composer;

    private String genre;

    @Column(name = "original_key")
    private String originalKey;

    @Column(name = "mastery_level", columnDefinition = "int check (mastery_level >= 1 and mastery_level <= 5)")
    private Integer masteryLevel;

    @Column(name = "tempo_bpm")
    private Integer tempoBpm;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "last_practiced_at")
    private LocalDateTime lastPracticedAt;
}
