import React, { useState } from 'react';
import players from './data/players.json';
import PlayerSelect from './components/PlayerSelect/PlayerSelect';
import PlayerCard from './components/PlayerCard/PlayerCard';
import PlayerSummary from './components/WikiSummary/WikiSummary';
import './App.scss';

function App() {
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  return (
    <div className="app">
      <header className="app__header">
        <h1>Player Dashboard</h1>
      </header>
      <main className="app__main">
        <PlayerSelect players={players} onSelect={setSelectedPlayer} />
        <PlayerCard player={selectedPlayer} />
        <PlayerSummary player={selectedPlayer} />
      </main>
    </div>
  );
}

export default App;
