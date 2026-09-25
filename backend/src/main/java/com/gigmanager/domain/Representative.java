package com.gigmanager.domain;

import com.gigmanager.domain.enums.RepresentativeType;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "representatives")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Representative {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RepresentativeType type;

    @Column(name = "contact_info")
    private String contactInfo;

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;
}
