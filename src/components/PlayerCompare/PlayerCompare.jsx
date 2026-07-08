import React, { useState } from 'react';
import { Select, SelectItem, Tile } from '@carbon/react';
import './_player-compare.scss';

const FALLBACK = '—';

// ─── Shared stat definitions ──────────────────────────────────────────────────

const STATS = [
  {
    label: 'Position',
    get: p => p.position,
    compare: null, // no winner for a categorical field
  },
  {
    label: 'Age',
    get: p => p.age,
    // younger is not necessarily "better" — no winner highlight
    compare: null,
  },
  {
    label: 'Nationality',
    get: p => p.citizenship,
    compare: null,
  },
  {
    label: 'Club',
    get: p => p.club,
    compare: null,
  },
  {
    label: 'Form rating',
    get: p => p.rating,
    format: v => (v != null ? `${v.toFixed(1)} / 10` : null),
    // higher rating wins
    compare: (a, b) => {
      if (a == null && b == null) return 'tie';
      if (a == null) return 'b';
      if (b == null) return 'a';
      if (a > b) return 'a';
      if (b > a) return 'b';
      return 'tie';
    },
  },
];

// ─── Single player picker ─────────────────────────────────────────────────────

function PlayerPicker({ id, label, players, value, onChange }) {
  return (
    <Select id={id} labelText={label} value={value || ''} onChange={onChange}>
      <SelectItem value="" text="Select a player..." />
      {players.map(p => (
        <SelectItem key={p.name} value={p.name} text={p.name} />
      ))}
    </Select>
  );
}

// ─── Comparison card ──────────────────────────────────────────────────────────

function CompareCard({ player, highlights, side }) {
  return (
    <Tile className="compare-card">
      <div className="compare-card__photo-wrap">
        {player.photo
          ? <img className="compare-card__photo" src={player.photo} alt={player.name} />
          : <div className="compare-card__photo compare-card__photo--empty" />
        }
      </div>
      <h3 className="compare-card__name">{player.name}</h3>
      <div className="compare-card__stats">
        {STATS.map(stat => {
          const raw = stat.get(player);
          const display = stat.format ? (stat.format(raw) ?? FALLBACK) : (raw ?? FALLBACK);
          const winner = highlights[stat.label];
          const isWinner = winner === side;
          return (
            <div
              key={stat.label}
              className={`compare-card__stat${isWinner ? ' compare-card__stat--winner' : ''}`}
            >
              <span className="compare-card__stat-label">{stat.label}</span>
              <span className="compare-card__stat-value">
                {isWinner && <span className="compare-card__badge" aria-hidden="true">★</span>}
                {display}
              </span>
            </div>
          );
        })}
      </div>
    </Tile>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

function PlayerCompare({ players }) {
  const [nameA, setNameA] = useState('');
  const [nameB, setNameB] = useState('');

  const playerA = players.find(p => p.name === nameA) || null;
  const playerB = players.find(p => p.name === nameB) || null;

  // Build a map of { [statLabel]: 'a' | 'b' | 'tie' } for the numeric stats
  const highlights = {};
  if (playerA && playerB) {
    for (const stat of STATS) {
      if (!stat.compare) continue;
      highlights[stat.label] = stat.compare(stat.get(playerA), stat.get(playerB));
    }
  }

  return (
    <div className="player-compare">
      <h2 className="player-compare__heading">Compare Players</h2>

      <div className="player-compare__pickers">
        <PlayerPicker
          id="compare-a"
          label="Player A"
          players={players}
          value={nameA}
          onChange={e => { setNameA(e.target.value); }}
        />
        <span className="player-compare__vs">vs</span>
        <PlayerPicker
          id="compare-b"
          label="Player B"
          players={players}
          value={nameB}
          onChange={e => { setNameB(e.target.value); }}
        />
      </div>

      {(playerA || playerB) && (
        <div className="player-compare__cards">
          {playerA
            ? <CompareCard player={playerA} highlights={highlights} side="a" />
            : <div className="player-compare__empty-card">Select Player A</div>
          }
          {playerB
            ? <CompareCard player={playerB} highlights={highlights} side="b" />
            : <div className="player-compare__empty-card">Select Player B</div>
          }
        </div>
      )}
    </div>
  );
}

export default PlayerCompare;
