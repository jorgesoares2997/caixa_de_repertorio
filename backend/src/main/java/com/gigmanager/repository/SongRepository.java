package com.gigmanager.repository;

import com.gigmanager.domain.Song;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SongRepository extends JpaRepository<Song, UUID> {
    
    @Query(value = "SELECT * FROM songs WHERE mastery_level IN :levels ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
    List<Song> findRandomSongsByMasteryLevels(List<Integer> levels, int limit);

    @Query("SELECT s FROM Song s WHERE LOWER(TRIM(s.title)) = LOWER(TRIM(:title)) AND (:composer IS NULL OR s.composer IS NULL OR LOWER(TRIM(s.composer)) = LOWER(TRIM(:composer)))")
    List<Song> findDuplicates(@Param("title") String title, @Param("composer") String composer);

    @Query("SELECT s FROM Song s WHERE s.id != :id AND LOWER(TRIM(s.title)) = LOWER(TRIM(:title)) AND (:composer IS NULL OR s.composer IS NULL OR LOWER(TRIM(s.composer)) = LOWER(TRIM(:composer)))")
    List<Song> findDuplicatesExcludingId(@Param("id") UUID id, @Param("title") String title, @Param("composer") String composer);
}
