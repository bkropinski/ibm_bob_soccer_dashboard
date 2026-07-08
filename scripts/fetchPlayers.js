require('dotenv').config();
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.API_FOOTBALL_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';
const PREMIER_LEAGUE_ID = 39;
const SEASON = 2023;
const OUTPUT_DIR = path.join(__dirname, '../src/data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'players.json');

// Top Premier League teams with their API-Football team IDs
const TEAMS = [
  { id: 50,  name: 'Manchester City' },
  { id: 33,  name: 'Manchester United' },
  { id: 40,  name: 'Liverpool' },
  { id: 42,  name: 'Arsenal' },
  { id: 49,  name: 'Chelsea' },
  { id: 47,  name: 'Tottenham' },
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchTeamPlayers(teamId, teamName) {
  const url = `${BASE_URL}/players?team=${teamId}&season=${SEASON}`;
  const response = await fetch(url, {
    headers: { 'x-apisports-key': API_KEY },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching team ${teamName} (id=${teamId})`);
  }

  const json = await response.json();

  if (json.errors && Object.keys(json.errors).length > 0) {
    throw new Error(`API error for team ${teamName}: ${JSON.stringify(json.errors)}`);
  }

  return json.response || [];
}

function extractPlayer(entry) {
  const { player, statistics } = entry;

  if (!statistics || statistics.length === 0) return null;

  // Only use Premier League statistics
  const plStats = statistics.find(s => s.league && s.league.id === PREMIER_LEAGUE_ID);
  if (!plStats) return null;

  const ratingRaw = plStats.games && plStats.games.rating;
  const rating = ratingRaw ? parseFloat(ratingRaw) : null;

  const heightRaw = player.height;
  const height = heightRaw ? parseInt(heightRaw.replace(/\D/g, ''), 10) || null : null;

  return {
    name: player.name,
    photo: player.photo,
    position: plStats.games.position || null,
    age: player.age,
    citizenship: player.nationality,
    height,
    club: plStats.team.name,
    rating,
  };
}

async function main() {
  if (!API_KEY) {
    console.error('Error: API_FOOTBALL_KEY is not set. Check your .env file.');
    process.exit(1);
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created directory: ${OUTPUT_DIR}`);
  }

  const allPlayers = [];

  for (const team of TEAMS) {
    console.log(`Fetching players for ${team.name} (id=${team.id})...`);
    try {
      const entries = await fetchTeamPlayers(team.id, team.name);
      const extracted = entries.map(extractPlayer).filter(Boolean);
      console.log(`  → ${extracted.length} players with Premier League stats`);
      allPlayers.push(...extracted);
    } catch (err) {
      console.error(`  ✗ Failed to fetch ${team.name}: ${err.message}`);
    }

    await sleep(500);
  }

  console.log(`\nTotal players fetched (with duplicates): ${allPlayers.length}`);

  // Deduplicate by player name (keep first occurrence)
  const seen = new Set();
  const unique = allPlayers.filter(p => {
    if (seen.has(p.name)) return false;
    seen.add(p.name);
    return true;
  });

  console.log(`After removing duplicates: ${unique.length} players`);

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(unique, null, 2));
  console.log(`\n✓ Saved ${unique.length} players to ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
