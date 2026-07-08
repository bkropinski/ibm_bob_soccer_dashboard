/**
 * @typedef {{ name: string, photo: string, position: string, age: number,
 *             citizenship: string, height: number|null, club: string,
 *             rating: number|null }} Player
 */

/**
 * Maps formation row roles → the position values used in players.json.
 * AMF and DMF are both midfielders in our dataset.
 * @type {Record<string, string>}
 */
const ROLE_TO_POSITION = {
  GK:  'Goalkeeper',
  DEF: 'Defender',
  MID: 'Midfielder',
  DMF: 'Midfielder',
  AMF: 'Midfielder',
  FWD: 'Attacker',
};

/** @param {Player[]} arr */
function shuffle(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Builds an 11-player squad that matches the position requirements of the
 * given formation. Each slot is filled from the matching position pool;
 * if a pool runs dry (e.g. only 1 GK available for a row needing 1), the
 * remaining slot is filled from any unused player to keep the team at 11.
 *
 * Players are ordered to match the formation rows (top → bottom on the board),
 * so FormationBoard's assignSlots() places each player in the correct row.
 *
 * @param {Player[]} players - Full pool of available players.
 * @param {import('./formations').Formation} formation - Active formation.
 * @returns {Player[]} Exactly 11 players in formation row order.
 */
export function generateRandomTeam(players, formation) {
  // Build a shuffled pool keyed by position string
  const pools = {};
  for (const position of Object.values(ROLE_TO_POSITION)) {
    if (!pools[position]) {
      pools[position] = shuffle(players.filter(p => p.position === position));
    }
  }

  const selected = [];
  const usedNames = new Set();

  // Pick per row in formation order (FWD first → GK last)
  for (const row of formation.rows) {
    const position = ROLE_TO_POSITION[row.role] ?? null;
    const pool = position ? pools[position] : [];
    let filled = 0;

    for (const candidate of pool) {
      if (filled >= row.count) break;
      if (!usedNames.has(candidate.name)) {
        selected.push(candidate);
        usedNames.add(candidate.name);
        filled++;
      }
    }

    // Fallback: if the pool didn't have enough, pull any unused player
    if (filled < row.count) {
      for (const candidate of shuffle(players)) {
        if (filled >= row.count) break;
        if (!usedNames.has(candidate.name)) {
          selected.push(candidate);
          usedNames.add(candidate.name);
          filled++;
        }
      }
    }
  }

  return selected;
}
