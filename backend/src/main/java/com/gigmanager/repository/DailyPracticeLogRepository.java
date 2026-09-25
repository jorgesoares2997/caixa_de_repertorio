package com.gigmanager.repository;

import com.gigmanager.domain.DailyPracticeLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface DailyPracticeLogRepository extends JpaRepository<DailyPracticeLog, UUID> {
}
