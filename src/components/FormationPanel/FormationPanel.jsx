import React from 'react';
import { Tile } from '@carbon/react';
import './_formation-panel.scss';

const FALLBACK = '—';

function Row({ label, value }) {
  return (
    <div className="formation-panel__row">
      <span className="formation-panel__label">{label}</span>
      <span className="formation-panel__value">{value ?? FALLBACK}</span>
    </div>
  );
}

/**
 * Side panel shown when a player token on the FormationBoard is clicked.
 * @param {{ player: import('../FormationBoard/FormationBoard').Player|null }} props
 */
function FormationPanel({ player }) {
  if (!player) {
    return (
      <div className="formation-panel formation-panel--empty">
        <p>Click a player on the board to see their details</p>
      </div>
    );
  }

  const rating = player.rating != null
    ? `${player.rating.toFixed(1)} / 10`
    : FALLBACK;

  return (
    <Tile className="formation-panel">
      <div className="formation-panel__photo-wrap">
        {player.photo
          ? <img className="formation-panel__photo" src={player.photo} alt={player.name} />
          : <div className="formation-panel__photo formation-panel__photo--empty" />
        }
      </div>
      <h3 className="formation-panel__name">{player.name}</h3>
      <div className="formation-panel__stats">
        <Row label="Position"    value={player.position} />
        <Row label="Age"         value={player.age} />
        <Row label="Nationality" value={player.citizenship} />
        <Row label="Club"        value={player.club} />
        <Row label="Form rating" value={rating} />
      </div>
    </Tile>
  );
}

export default FormationPanel;
