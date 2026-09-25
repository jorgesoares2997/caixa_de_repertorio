package com.gigmanager.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "daily_practice_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyPracticeLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "song_id", nullable = false)
    private Song song;

    @Column(name = "practice_date", nullable = false)
    private LocalDate practiceDate;

    @Column(name = "drill_type")
    private String drillType;

    @Builder.Default
    @Column(nullable = false)
    private Boolean completed = false;
}
