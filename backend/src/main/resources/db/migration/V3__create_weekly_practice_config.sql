CREATE TABLE IF NOT EXISTS weekly_practice_config (
    id VARCHAR(50) PRIMARY KEY,
    representative_ids TEXT,
    expires_at DATE NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
