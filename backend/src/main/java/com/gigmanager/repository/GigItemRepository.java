package com.gigmanager.repository;

import com.gigmanager.domain.GigItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface GigItemRepository extends JpaRepository<GigItem, UUID> {
}
