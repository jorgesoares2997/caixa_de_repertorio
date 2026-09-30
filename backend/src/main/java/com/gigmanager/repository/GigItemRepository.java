package com.gigmanager.repository;

import com.gigmanager.domain.GigItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GigItemRepository extends JpaRepository<GigItem, UUID> {

    @Query("SELECT gi FROM GigItem gi JOIN FETCH gi.song WHERE gi.gig.id = :gigId ORDER BY gi.blockNumber, gi.orderIndex")
    List<GigItem> findByGigIdOrdered(UUID gigId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM GigItem gi WHERE gi.song.id = :songId")
    void deleteBySongId(UUID songId);
}
