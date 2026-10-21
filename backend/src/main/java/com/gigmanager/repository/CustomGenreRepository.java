package com.gigmanager.repository;

import com.gigmanager.domain.CustomGenre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomGenreRepository extends JpaRepository<CustomGenre, UUID> {
    Optional<CustomGenre> findByNameIgnoreCase(String name);
}
