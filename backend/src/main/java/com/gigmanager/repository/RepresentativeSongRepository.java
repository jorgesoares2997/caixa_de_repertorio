package com.gigmanager.repository;

import com.gigmanager.domain.RepresentativeSong;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RepresentativeSongRepository extends JpaRepository<RepresentativeSong, UUID> {
    
    @Query("SELECT rs FROM RepresentativeSong rs JOIN FETCH rs.song WHERE rs.representative.id = :representativeId")
    List<RepresentativeSong> findByRepresentativeIdWithSong(@Param("representativeId") UUID representativeId);

    @Query("SELECT rs FROM RepresentativeSong rs JOIN FETCH rs.representative WHERE rs.song.id = :songId")
    List<RepresentativeSong> findBySongIdWithRepresentative(@Param("songId") UUID songId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM RepresentativeSong rs WHERE rs.song.id = :songId")
    void deleteBySongId(@Param("songId") UUID songId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM RepresentativeSong rs WHERE rs.representative.id = :representativeId")
    void deleteByRepresentativeId(@Param("representativeId") UUID representativeId);
}
