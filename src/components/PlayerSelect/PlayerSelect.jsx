import React from 'react';
import { Select, SelectItem } from '@carbon/react';
import './_player-select.scss';

function PlayerSelect({ players, onSelect }) {
  function handleChange(e) {
    const name = e.target.value;
    const player = players.find(p => p.name === name) || null;
    onSelect(player);
  }

  return (
    <div className="player-select">
      <Select
        id="player-select"
        labelText="Player"
        defaultValue=""
        onChange={handleChange}
      >
        <SelectItem value="" text="Select a player..." />
        {players.map(player => (
          <SelectItem
            key={player.name}
            value={player.name}
            text={player.name}
          />
        ))}
      </Select>
    </div>
  );
}

export default PlayerSelect;
