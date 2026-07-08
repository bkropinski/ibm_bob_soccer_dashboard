import React, { useState } from 'react';
import { Button, Select, SelectItem } from '@carbon/react';
import players from './data/players.json';
import PlayerSelect from './components/PlayerSelect/PlayerSelect';
import PlayerCard from './components/PlayerCard/PlayerCard';
import PlayerSummary from './components/WikiSummary/WikiSummary';
import FormationBoard from './components/FormationBoard/FormationBoard';
import { generateRandomTeam } from './utils/teamGenerator';
import { FORMATIONS, DEFAULT_FORMATION } from './utils/formations';
import PlayerCompare from './components/PlayerCompare/PlayerCompare';
import FormationPanel from './components/FormationPanel/FormationPanel';
import './App.scss';

function App() {
  const [selectedPlayer, setSelectedPlayer]       = useState(null);
  const [teamPlayers, setTeamPlayers]             = useState([]);
  const [boardSelectedPlayer, setBoardSelected]   = useState(null);
  const [formation, setFormation]                 = useState(DEFAULT_FORMATION);

  function handleGenerateTeam() {
    setBoardSelected(null);
    setTeamPlayers(generateRandomTeam(players, formation));
  }

  function handleFormationChange(e) {
    const chosen = FORMATIONS.find(f => f.label === e.target.value) ?? DEFAULT_FORMATION;
    setFormation(chosen);
    setBoardSelected(null);
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>Player Dashboard</h1>
      </header>
      <main className="app__main">
        <PlayerSelect players={players} onSelect={setSelectedPlayer} />
        <PlayerCard player={selectedPlayer} />
        <PlayerSummary player={selectedPlayer} />

        <div className="app__formation">
          <div className="app__formation-controls">
            <Button kind="primary" onClick={handleGenerateTeam}>
              Generate Random Team
            </Button>
            <Select
              id="formation-select"
              labelText="Formation"
              value={formation.label}
              onChange={handleFormationChange}
            >
              {FORMATIONS.map(f => (
                <SelectItem key={f.label} value={f.label} text={f.label} />
              ))}
            </Select>
          </div>
          <div className="app__formation-layout">
            <FormationBoard
              players={teamPlayers}
              formation={formation}
              onPlayerClick={setBoardSelected}
              selectedPlayer={boardSelectedPlayer}
            />
            <FormationPanel player={boardSelectedPlayer} />
          </div>
        </div>

        <PlayerCompare players={players} />
      </main>
    </div>
  );
}

export default App;
