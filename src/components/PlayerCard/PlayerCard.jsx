import React from 'react';
import { Tile } from '@carbon/react';
import './_player-card.scss';

const FALLBACK = '—';

function stat(label, value) {
  return (
    <div className="player-card__stat" key={label}>
      <span className="player-card__stat-label">{label}</span>
      <span className="player-card__stat-value">{value ?? FALLBACK}</span>
    </div>
  );
}

function PlayerCard({ player }) {
  if (!player) return null;

  const rating = player.rating != null
    ? `${player.rating.toFixed(1)} / 10`
    : FALLBACK;

  return (
    <Tile className="player-card">
      {player.photo && (
        <div className="player-card__photo-wrap">
          <img
            className="player-card__photo"
            src={player.photo}
            alt={player.name}
          />
        </div>
      )}
      <h2 className="player-card__name">{player.name}</h2>
      <div className="player-card__stats">
        {stat('Position',    player.position)}
        {stat('Age',         player.age)}
        {stat('Nationality', player.citizenship)}
        {stat('Club',        player.club)}
        {stat('Form rating', rating)}
      </div>
    </Tile>
  );
}

export default PlayerCard;
