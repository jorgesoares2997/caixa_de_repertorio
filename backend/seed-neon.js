const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const crypto = require('crypto');

async function run() {
  const jsonPath = path.resolve(__dirname, '../repertorio_completo.json');
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const data = JSON.parse(rawData);

  const connectionString = 'postgresql://neondb_owner:npg_HLok9fBwsbM1@ep-damp-rain-b5ffd165-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require';

  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected to Neon PostgreSQL.');

  try {
    console.log(`Processing ${data.length} songs from JSON...`);

    const repNames = new Set();
    for (const song of data) {
      if (song.representatives && Array.isArray(song.representatives)) {
        for (const rep of song.representatives) {
          if (rep && rep.trim()) {
            repNames.add(rep.trim());
          }
        }
      }
    }

    const repMap = {};
    for (const name of repNames) {
      const res = await client.query('SELECT id FROM representatives WHERE name = $1', [name]);
      if (res.rows.length > 0) {
        repMap[name] = res.rows[0].id;
      } else {
        const id = crypto.randomUUID();
        const type = name.toLowerCase() === 'geral' ? 'OTHER' : 'SINGER';
        await client.query(
          'INSERT INTO representatives (id, name, type, active) VALUES ($1, $2, $3, $4)',
          [id, name, type, true]
        );
        repMap[name] = id;
      }
    }
    console.log(`Found/created ${Object.keys(repMap).length} representatives.`);

    let songCount = 0;
    let repLinkCount = 0;

    await client.query('BEGIN');

    for (const song of data) {
      const songId = crypto.randomUUID();
      const mastery = typeof song.mastery_level === 'number' && song.mastery_level >= 1 && song.mastery_level <= 5
        ? song.mastery_level 
        : 3;

      await client.query(
        `INSERT INTO songs (id, title, composer, genre, original_key, mastery_level)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          songId,
          song.title,
          song.composer || null,
          song.genre || null,
          song.original_key || 'C',
          mastery
        ]
      );
      songCount++;

      if (song.representatives && Array.isArray(song.representatives)) {
        for (const rep of song.representatives) {
          const trimmed = rep.trim();
          const repId = repMap[trimmed];
          if (repId) {
            const linkId = crypto.randomUUID();
            await client.query(
              `INSERT INTO representative_songs (id, representative_id, song_id, performance_key)
               VALUES ($1, $2, $3, $4)`,
              [linkId, repId, songId, song.original_key || 'C']
            );
            repLinkCount++;
          }
        }
      }
    }

    await client.query('COMMIT');
    console.log(`✅ Success! Seeded ${songCount} songs and ${repLinkCount} representative links.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error during seeding:', err);
  } finally {
    await client.end();
  }
}

run();
