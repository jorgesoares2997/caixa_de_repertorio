package com.gigmanager.repository;

import com.gigmanager.domain.SongMasteryHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface SongMasteryHistoryRepository extends JpaRepository<SongMasteryHistory, UUID> {

    @Query("SELECT h FROM SongMasteryHistory h JOIN FETCH h.song WHERE h.changedAt >= :since ORDER BY h.changedAt DESC")
    List<SongMasteryHistory> findRecentEvolutions(@Param("since") LocalDateTime since);

    @Query("SELECT h FROM SongMasteryHistory h JOIN FETCH h.song ORDER BY h.changedAt DESC")
    List<SongMasteryHistory> findAllWithSongOrderByChangedAtDesc();
}
