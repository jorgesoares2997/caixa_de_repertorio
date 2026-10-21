CREATE TABLE IF NOT EXISTS custom_genres (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS song_mastery_history (
    id UUID PRIMARY KEY,
    song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    previous_level INT,
    new_level INT NOT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial common custom genres
INSERT INTO custom_genres (id, name, color) VALUES
    ('11111111-2222-3333-4444-555555555501', 'Neosoul', '#E9D5FF'),
    ('11111111-2222-3333-4444-555555555502', 'Samba-Rock', '#D4FF00'),
    ('11111111-2222-3333-4444-555555555503', 'Choro', '#FF6B00'),
    ('11111111-2222-3333-4444-555555555504', 'Reggae', '#38BDF8')
ON CONFLICT (name) DO NOTHING;

-- Seed historical mastery evolution points across recent weeks and months
INSERT INTO song_mastery_history (id, song_id, previous_level, new_level, changed_at)
SELECT 
    gen_random_uuid(),
    s.id,
    GREATEST(1, s.mastery_level - 1),
    s.mastery_level,
    CURRENT_TIMESTAMP - (ROW_NUMBER() OVER () * INTERVAL '2 days 4 hours')
FROM (SELECT id, mastery_level FROM songs WHERE mastery_level >= 3 ORDER BY title LIMIT 20) s;

INSERT INTO song_mastery_history (id, song_id, previous_level, new_level, changed_at)
SELECT 
    gen_random_uuid(),
    s.id,
    GREATEST(1, s.mastery_level - 2),
    GREATEST(2, s.mastery_level - 1),
    CURRENT_TIMESTAMP - (ROW_NUMBER() OVER () * INTERVAL '12 days 6 hours')
FROM (SELECT id, mastery_level FROM songs WHERE mastery_level >= 4 ORDER BY title DESC LIMIT 15) s;
