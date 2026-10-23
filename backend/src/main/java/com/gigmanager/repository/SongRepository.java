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

    @Query(value = "SELECT * FROM songs WHERE id IN (" +
                   "  SELECT rs.song_id FROM representative_songs rs WHERE rs.representative_id IN (:representativeIds)" +
                   ") AND mastery_level IN (:levels) " +
                   "ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
    List<Song> findRandomSongsByRepresentativesAndMasteryLevels(
            @Param("representativeIds") List<UUID> representativeIds,
            @Param("levels") List<Integer> levels,
            @Param("limit") int limit);

    @Query(value = "SELECT * FROM songs WHERE id IN (" +
                   "  SELECT rs.song_id FROM representative_songs rs WHERE rs.representative_id IN (:representativeIds)" +
                   ") ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
    List<Song> findRandomSongsByRepresentatives(
            @Param("representativeIds") List<UUID> representativeIds,
            @Param("limit") int limit);


    @Query("SELECT s FROM Song s WHERE LOWER(s.title) = LOWER(:title)")
    List<Song> findByTitleIgnoreCase(@Param("title") String title);

    @Query("SELECT s FROM Song s WHERE LOWER(s.genre) = LOWER(:genre)")
    List<Song> findByGenreIgnoreCase(@Param("genre") String genre);
}

