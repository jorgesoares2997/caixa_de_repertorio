package com.gigmanager.repository;

import com.gigmanager.domain.Gig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface GigRepository extends JpaRepository<Gig, UUID> {
}
