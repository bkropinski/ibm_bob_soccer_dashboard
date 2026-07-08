/**
 * Each formation is an ordered array of rows, top→bottom on screen (attackers first, GK last).
 * `role` is a display label; `count` is the number of players in that row.
 *
 * @typedef {{ role: string, count: number }} FormationRow
 * @typedef {{ label: string, rows: FormationRow[] }} Formation
 */

/** @type {Formation[]} */
export const FORMATIONS = [
  {
    label: '4-4-2',
    rows: [
      { role: 'FWD', count: 2 },
      { role: 'MID', count: 4 },
      { role: 'DEF', count: 4 },
      { role: 'GK',  count: 1 },
    ],
  },
  {
    label: '4-3-3',
    rows: [
      { role: 'FWD', count: 3 },
      { role: 'MID', count: 3 },
      { role: 'DEF', count: 4 },
      { role: 'GK',  count: 1 },
    ],
  },
  {
    label: '3-5-2',
    rows: [
      { role: 'FWD', count: 2 },
      { role: 'MID', count: 5 },
      { role: 'DEF', count: 3 },
      { role: 'GK',  count: 1 },
    ],
  },
  {
    label: '4-2-3-1',
    rows: [
      { role: 'FWD', count: 1 },
      { role: 'AMF', count: 3 },
      { role: 'DMF', count: 2 },
      { role: 'DEF', count: 4 },
      { role: 'GK',  count: 1 },
    ],
  },
  {
    label: '5-3-2',
    rows: [
      { role: 'FWD', count: 2 },
      { role: 'MID', count: 3 },
      { role: 'DEF', count: 5 },
      { role: 'GK',  count: 1 },
    ],
  },
  {
    label: '3-4-3',
    rows: [
      { role: 'FWD', count: 3 },
      { role: 'MID', count: 4 },
      { role: 'DEF', count: 3 },
      { role: 'GK',  count: 1 },
    ],
  },
];

/** The default formation used when none is specified. */
export const DEFAULT_FORMATION = FORMATIONS[0];
