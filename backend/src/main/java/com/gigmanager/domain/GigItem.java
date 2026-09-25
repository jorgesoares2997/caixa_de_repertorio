package com.gigmanager.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "gig_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GigItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gig_id", nullable = false)
    private Gig gig;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "song_id", nullable = false)
    private Song song;

    @Column(name = "order_index")
    private Integer orderIndex;

    @Column(name = "performance_key")
    private String performanceKey;

    @Column(name = "block_number")
    private Integer blockNumber;
}
