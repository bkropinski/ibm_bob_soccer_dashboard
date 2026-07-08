import React from 'react';
import './_wiki-summary.scss';

function formDescription(rating) {
  if (rating == null) return null;
  if (rating >= 8.0) return 'in strong form';
  if (rating >= 6.0) return 'showing consistent form';
  return 'building form';
}

function buildSummary(player) {
  const { name, position, age, citizenship, club, rating } = player;
  const parts = [];

  // Opening sentence — always has at least a name.
  let opening = name;
  if (position) opening += ` is a ${position}`;
  if (age)      opening += ` aged ${age}`;
  if (citizenship) opening += `, from ${citizenship}`;
  parts.push(opening + '.');

  // Club sentence.
  if (club) parts.push(`They currently play for ${club}.`);

  // Form sentence.
  const form = formDescription(rating);
  if (form) parts.push(`Based on available statistics, they are ${form}.`);

  parts.push('This profile is based on the available dataset only.');

  return parts.join(' ');
}

function PlayerSummary({ player }) {
  if (!player) return null;

  return (
    <div className="wiki-summary">
      <p className="wiki-summary__label">Player Summary</p>
      <p className="wiki-summary__body">{buildSummary(player)}</p>
      <p className="wiki-summary__source">This summary is based only on the loaded dataset.</p>
    </div>
  );
}

export default PlayerSummary;
