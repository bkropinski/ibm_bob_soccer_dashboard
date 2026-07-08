import React, { useState } from 'react';
import { Search, Select, SelectItem } from '@carbon/react';
import './_player-select.scss';

const POSITIONS = ['Attacker', 'Midfielder', 'Defender', 'Goalkeeper'];

const SORT_OPTIONS = [
  { value: 'name-asc',    label: 'Name (A → Z)' },
  { value: 'name-desc',   label: 'Name (Z → A)' },
  { value: 'age-asc',     label: 'Age (youngest first)' },
  { value: 'rating-desc', label: 'Rating (best first)' },
];

function sortPlayers(players, order) {
  const sorted = [...players];
  switch (order) {
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case 'age-asc':
      return sorted.sort((a, b) => (a.age ?? Infinity) - (b.age ?? Infinity));
    case 'rating-desc':
      // Players without a rating sink to the bottom
      return sorted.sort((a, b) => (b.rating ?? -Infinity) - (a.rating ?? -Infinity));
    default:
      return sorted;
  }
}

function PlayerSelect({ players, onSelect }) {
  const [searchQuery, setSearchQuery]       = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [sortOrder, setSortOrder]           = useState('');

  // Pipeline: search → position filter → sort
  const afterSearch = searchQuery
    ? players.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : players;

  const afterFilter = positionFilter
    ? afterSearch.filter(p => p.position === positionFilter)
    : afterSearch;

  const visiblePlayers = sortPlayers(afterFilter, sortOrder);

  function handleSearchChange(e) {
    setSearchQuery(e.target.value);
    onSelect(null);
  }

  function handleSearchClear() {
    setSearchQuery('');
    onSelect(null);
  }

  function handleFilterChange(e) {
    setPositionFilter(e.target.value);
    onSelect(null);
  }

  function handleSortChange(e) {
    setSortOrder(e.target.value);
    onSelect(null);
  }

  function handlePlayerChange(e) {
    const name = e.target.value;
    const player = visiblePlayers.find(p => p.name === name) || null;
    onSelect(player);
  }

  return (
    <div className="player-select">
      <Search
        id="player-search"
        labelText="Search players"
        placeholder="Search by name…"
        value={searchQuery}
        onChange={handleSearchChange}
        onClear={handleSearchClear}
        className="player-select__search"
      />
      <div className="player-select__filters">
        <Select
          id="position-filter"
          labelText="Position"
          defaultValue=""
          onChange={handleFilterChange}
        >
          <SelectItem value="" text="All positions" />
          {POSITIONS.map(pos => (
            <SelectItem key={pos} value={pos} text={pos} />
          ))}
        </Select>

        <Select
          id="sort-order"
          labelText="Sort by"
          defaultValue=""
          onChange={handleSortChange}
        >
          <SelectItem value="" text="Default order" />
          {SORT_OPTIONS.map(opt => (
            <SelectItem key={opt.value} value={opt.value} text={opt.label} />
          ))}
        </Select>

        <Select
          id="player-select"
          labelText="Player"
          value=""
          key={`${searchQuery}|${positionFilter}|${sortOrder}`}
          onChange={handlePlayerChange}
        >
          <SelectItem
            value=""
            text={visiblePlayers.length === 0 ? 'No players found' : 'Select a player…'}
          />
          {visiblePlayers.map(player => (
            <SelectItem
              key={player.name}
              value={player.name}
              text={player.name}
            />
          ))}
        </Select>
      </div>
    </div>
  );
}

export default PlayerSelect;
