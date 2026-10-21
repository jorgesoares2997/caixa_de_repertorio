package com.gigmanager.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "weekly_practice_config")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeeklyPracticeConfig {

    @Id
    @Column(length = 50)
    private String id; // e.g. "DEFAULT"

    @Column(name = "representative_ids", columnDefinition = "TEXT")
    private String representativeIds; // Comma-separated UUIDs

    @Column(name = "expires_at", nullable = false)
    private LocalDate expiresAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
