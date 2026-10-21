CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    name VARCHAR(255)
);

INSERT INTO app_users (id, username, password, role, name)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'jorgeadmin123', '87594291', 'ADMIN', 'Jorge Soares')
ON CONFLICT (username) DO UPDATE
SET password = EXCLUDED.password, role = EXCLUDED.role, name = EXCLUDED.name;
