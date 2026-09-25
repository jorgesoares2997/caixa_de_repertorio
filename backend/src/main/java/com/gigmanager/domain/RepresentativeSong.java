package com.gigmanager.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "representative_songs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RepresentativeSong {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "representative_id", nullable = false)
    private Representative representative;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "song_id", nullable = false)
    private Song song;

    @Column(name = "performance_key")
    private String performanceKey;

    @Column(name = "specific_notes", columnDefinition = "TEXT")
    private String specificNotes;
}
