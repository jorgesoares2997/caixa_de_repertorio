package com.gigmanager.repository;

import com.gigmanager.domain.RepresentativeSong;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface RepresentativeSongRepository extends JpaRepository<RepresentativeSong, UUID> {
}
