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

    @Query("SELECT s FROM Song s WHERE LOWER(s.title) = LOWER(:title)")
    List<Song> findByTitleIgnoreCase(@Param("title") String title);
}
