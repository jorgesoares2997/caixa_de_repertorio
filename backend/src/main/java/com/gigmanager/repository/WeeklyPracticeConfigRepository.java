package com.gigmanager.repository;

import com.gigmanager.domain.WeeklyPracticeConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WeeklyPracticeConfigRepository extends JpaRepository<WeeklyPracticeConfig, String> {
}
