const fs = require('fs');
const { Client } = require('pg');
const crypto = require('crypto');

async function seed() {
  const rawData = fs.readFileSync('/Users/jorgesoares/Desktop/projects/caixa_de_repertorio/repertorio_completo.json');
  const data = JSON.parse(rawData);

  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'appdb',
    user: 'appuser',
    password: 'apppass',
  });

  await client.connect();

  try {
    console.log(`Loaded ${data.length} songs from JSON. Starting seed...`);
    
    // First, collect all unique representatives
    const repNames = new Set();
    for (const song of data) {
      if (song.representatives) {
        for (const rep of song.representatives) {
          repNames.add(rep);
        }
      }
    }

    const repMap = {};
    for (const name of repNames) {
      const id = crypto.randomUUID();
      await client.query(
        'INSERT INTO representatives (id, name, type, active) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
        [id, name, 'OTHER', true]
      );
      repMap[name] = id;
    }
    console.log(`Inserted ${repNames.size} representatives.`);

    let songCount = 0;
    let repSongCount = 0;

    for (const song of data) {
      const songId = crypto.randomUUID();
      await client.query(
        `INSERT INTO songs (id, title, composer, genre, original_key, mastery_level) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          songId, 
          song.title, 
          song.composer || null, 
          song.genre || null, 
          song.original_key || null, 
          song.mastery_level || null
        ]
      );
      songCount++;

      if (song.representatives) {
        for (const repName of song.representatives) {
          const repId = repMap[repName];
          const rsId = crypto.randomUUID();
          await client.query(
            `INSERT INTO representative_songs (id, representative_id, song_id, performance_key) 
             VALUES ($1, $2, $3, $4)`,
            [rsId, repId, songId, song.original_key || null]
          );
          repSongCount++;
        }
      }
    }

    console.log(`Seed complete! Inserted ${songCount} songs and ${repSongCount} representative links.`);
  } catch (err) {
    console.error('Error during seeding:', err);
  } finally {
    await client.end();
  }
}

seed();
