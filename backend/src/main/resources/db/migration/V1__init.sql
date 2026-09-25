CREATE TABLE IF NOT EXISTS representatives (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    contact_info VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS songs (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    composer VARCHAR(255),
    genre VARCHAR(255),
    original_key VARCHAR(50),
    mastery_level INT CHECK (mastery_level >= 1 AND mastery_level <= 5),
    tempo_bpm INT,
    notes TEXT,
    last_practiced_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS representative_songs (
    id UUID PRIMARY KEY,
    representative_id UUID NOT NULL REFERENCES representatives(id),
    song_id UUID NOT NULL REFERENCES songs(id),
    performance_key VARCHAR(50),
    specific_notes TEXT
);

CREATE TABLE IF NOT EXISTS gigs (
    id UUID PRIMARY KEY,
    representative_id UUID REFERENCES representatives(id),
    title VARCHAR(255) NOT NULL,
    event_date TIMESTAMP,
    venue VARCHAR(255),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS gig_items (
    id UUID PRIMARY KEY,
    gig_id UUID NOT NULL REFERENCES gigs(id),
    song_id UUID NOT NULL REFERENCES songs(id),
    order_index INT,
    performance_key VARCHAR(50),
    block_number INT
);

CREATE TABLE IF NOT EXISTS daily_practice_logs (
    id UUID PRIMARY KEY,
    song_id UUID NOT NULL REFERENCES songs(id),
    practice_date DATE NOT NULL,
    drill_type VARCHAR(255),
    completed BOOLEAN NOT NULL DEFAULT false
);
