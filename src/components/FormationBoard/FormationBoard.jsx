import React, { useState } from 'react';
import { DEFAULT_FORMATION } from '../../utils/formations';

/**
 * @typedef {{ name: string, photo: string, position: string, age: number,
 *             citizenship: string, height: number|null, club: string,
 *             rating: number|null }} Player
 */

// ─── Formation ────────────────────────────────────────────────────────────────

function assignSlots(players, formation) {
  const slots = [];
  // Number 1 = GK (last row, last slot), so count down from total
  let assignNum = players.length;
  for (const row of formation) {
    for (let i = 0; i < row.count; i++) {
      slots.push({ number: assignNum--, role: row.role });
    }
  }
  return slots.map((slot, i) => ({ ...slot, player: players[i] ?? null }));
}

// ─── Field dimensions ────────────────────────────────────────────────────────

// Canvas area (the green grass including the outer border band)
const W = 480;
const H = 760;

// White border band inside the wrapper
const BORDER = 16; // px inset from wrapper edge

// Playable area starts/ends at BORDER
const PW = W - BORDER * 2; // playable width
const PH = H - BORDER * 2; // playable height
const PX = BORDER;         // playable left edge x
const PY = BORDER;         // playable top edge y

// Derived centre
const CX = W / 2;
const CY = H / 2;

// Penalty box: 50% wide, 16% tall (from each end line inward)
const PEN_W = PW * 0.50;
const PEN_H = PH * 0.165;
const PEN_X = CX - PEN_W / 2;

// Goal area (six-yard box): 50% of penalty box width, 40% of penalty box height
const GOAL_W = PEN_W * 0.50;
const GOAL_H = PEN_H * 0.40;
const GOAL_X = CX - GOAL_W / 2;

// Penalty spot: 11m ~ 25% of penalty box height from end line
const PEN_SPOT_OFFSET = PEN_H * 0.60; // from end line inward

// Centre circle radius — FIFA = 9.15m; scale proportionally
const CC_R = PW * 0.185;

// Penalty arc radius = same as centre circle (FIFA standard)
const ARC_R = CC_R;

// Corner arc radius (FIFA = 1m, small on screen)
const CORNER_R = 10;

// Goal dimensions (outside the pitch)
const GOAL_NET_W = GOAL_W;
const GOAL_NET_H = 14;

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  wrapper: {
    width: W,
    height: H,
    borderRadius: 8,
    background: 'linear-gradient(175deg, #3a8c3a 0%, #2e7d2e 40%, #276527 100%)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 0 40px rgba(0,0,0,0.18)',
    position: 'relative',
    overflow: 'visible',
    fontFamily: '-apple-system, "Segoe UI", system-ui, sans-serif',
  },
  empty: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textAlign: 'center',
    padding: '0 2rem',
    letterSpacing: '0.02em',
  },
  playersLayer: {
    position: 'absolute',
    // Inset slightly more than BORDER so tokens sit on the grass, not the border
    top: BORDER + 4,
    bottom: BORDER + 4,
    left: 0,
    right: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingBottom: 8,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  token: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: 60,
    cursor: 'pointer',
    position: 'relative', // tooltip anchors to this
  },
  photoWrap: {
    position: 'relative',
    width: 42,
    height: 42,
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.9)',
    overflow: 'hidden',
    boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
    background: '#276527',
    flexShrink: 0,
    transition: 'transform 0.12s ease, box-shadow 0.12s ease',
  },
  photoWrapSelected: {
    border: '3px solid #f0c040',
    boxShadow: '0 0 0 3px rgba(240,192,64,0.5), 0 2px 6px rgba(0,0,0,0.5)',
    transform: 'scale(1.12)',
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: '50%',
    background: '#f0c040',
    color: '#111',
    fontSize: 8,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1.5px solid #fff',
    lineHeight: 1,
    zIndex: 2,
  },
  name: {
    marginTop: 4,
    fontSize: 9,
    color: '#fff',
    textAlign: 'center',
    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
    maxWidth: 58,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    letterSpacing: '0.01em',
  },
};

// ─── SVG Field Markings ───────────────────────────────────────────────────────

function FieldMarkings() {
  const mk = { stroke: 'rgba(255,255,255,0.92)', strokeWidth: 1.5, fill: 'none' };
  const spot = { fill: 'rgba(255,255,255,0.92)' };

  // Top penalty box
  const topPenY = PY;
  const topPenBox = { x: PEN_X, y: topPenY, w: PEN_W, h: PEN_H };

  // Top goal area (flush against top end line)
  const topGoalBox = { x: GOAL_X, y: PY, w: GOAL_W, h: GOAL_H };

  // Top penalty spot
  const topSpotY = topPenY + PEN_SPOT_OFFSET;

  // Top penalty arc: D opens downward (away from goal = toward centre)
  // Arc drawn from the penalty spot, sweeping the half that pokes OUT of the box
  // The arc tangent point is where ARC_R intersects the penalty box inner edge
  // We clip via SVG clipPath to show only the portion outside the penalty box
  const topArcCY = topSpotY;
  const topArcBoxEdgeY = topPenY + PEN_H; // inner edge of top penalty box

  // Bottom penalty box
  const botPenY = PY + PH - PEN_H;
  const botPenBox = { x: PEN_X, y: botPenY, w: PEN_W, h: PEN_H };

  // Bottom goal area (flush against bottom end line)
  const botGoalBox = { x: GOAL_X, y: PY + PH - GOAL_H, w: GOAL_W, h: GOAL_H };

  // Bottom penalty spot
  const botSpotY = botPenY + (PEN_H - PEN_SPOT_OFFSET);

  // Bottom penalty arc: D opens upward (away from goal = toward centre)
  const botArcCY = botSpotY;
  const botArcBoxEdgeY = botPenY; // inner edge of bottom penalty box

  // Goal net stripes (diagonal) defined as a pattern
  const NET_ID_TOP = 'net-top';
  const NET_ID_BOT = 'net-bot';

  // SVG needs extra height to draw goals outside the field
  const svgH = H + GOAL_NET_H * 2;
  const svgOffsetY = GOAL_NET_H; // goals drawn at y < 0 in field coords

  return (
    <svg
      width={W}
      height={svgH}
      viewBox={`0 ${-svgOffsetY} ${W} ${svgH}`}
      style={{ position: 'absolute', top: -svgOffsetY, left: 0, pointerEvents: 'none', overflow: 'visible' }}
    >
      <defs>
        {/* Diagonal stripe pattern for goal nets */}
        <pattern id={NET_ID_TOP} x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="white" />
          <line x1="0" y1="6" x2="6" y2="0" stroke="rgba(180,220,180,0.7)" strokeWidth="1" />
        </pattern>
        <pattern id={NET_ID_BOT} x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="white" />
          <line x1="0" y1="6" x2="6" y2="0" stroke="rgba(180,220,180,0.7)" strokeWidth="1" />
        </pattern>

        {/* Clip regions to show only the arc portion OUTSIDE the penalty box */}
        <clipPath id="top-arc-clip">
          {/* Everything below the bottom edge of the top penalty box */}
          <rect x={0} y={topArcBoxEdgeY} width={W} height={H} />
        </clipPath>
        <clipPath id="bot-arc-clip">
          {/* Everything above the top edge of the bottom penalty box */}
          <rect x={0} y={0} width={W} height={botArcBoxEdgeY} />
        </clipPath>
      </defs>

      {/* ── Outer pitch border ── */}
      <rect x={PX} y={PY} width={PW} height={PH} {...mk} />

      {/* ── Halfway line ── */}
      <line x1={PX} y1={CY} x2={PX + PW} y2={CY} {...mk} />

      {/* ── Centre circle ── */}
      <circle cx={CX} cy={CY} r={CC_R} {...mk} />

      {/* ── Centre spot ── */}
      <circle cx={CX} cy={CY} r={3} {...spot} />

      {/* ── TOP: Penalty box ── */}
      <rect x={topPenBox.x} y={topPenBox.y} width={topPenBox.w} height={topPenBox.h} {...mk} />

      {/* ── TOP: Goal area ── */}
      <rect x={topGoalBox.x} y={topGoalBox.y} width={topGoalBox.w} height={topGoalBox.h} {...mk} />

      {/* ── TOP: Penalty spot ── */}
      <circle cx={CX} cy={topSpotY} r={3} {...spot} />

      {/* ── TOP: Penalty arc (D) — only the part outside the box ── */}
      <circle
        cx={CX} cy={topArcCY} r={ARC_R}
        stroke="rgba(255,255,255,0.92)" strokeWidth={1.5} fill="none"
        clipPath="url(#top-arc-clip)"
      />

      {/* ── TOP: Goal net ── */}
      <rect
        x={CX - GOAL_NET_W / 2} y={PY - GOAL_NET_H}
        width={GOAL_NET_W} height={GOAL_NET_H}
        fill={`url(#${NET_ID_TOP})`}
        stroke="rgba(255,255,255,0.92)" strokeWidth={1.5}
      />

      {/* ── BOTTOM: Penalty box ── */}
      <rect x={botPenBox.x} y={botPenBox.y} width={botPenBox.w} height={botPenBox.h} {...mk} />

      {/* ── BOTTOM: Goal area ── */}
      <rect x={botGoalBox.x} y={botGoalBox.y} width={botGoalBox.w} height={botGoalBox.h} {...mk} />

      {/* ── BOTTOM: Penalty spot ── */}
      <circle cx={CX} cy={botSpotY} r={3} {...spot} />

      {/* ── BOTTOM: Penalty arc (D) — only the part outside the box ── */}
      <circle
        cx={CX} cy={botArcCY} r={ARC_R}
        stroke="rgba(255,255,255,0.92)" strokeWidth={1.5} fill="none"
        clipPath="url(#bot-arc-clip)"
      />

      {/* ── BOTTOM: Goal net ── */}
      <rect
        x={CX - GOAL_NET_W / 2} y={PY + PH}
        width={GOAL_NET_W} height={GOAL_NET_H}
        fill={`url(#${NET_ID_BOT})`}
        stroke="rgba(255,255,255,0.92)" strokeWidth={1.5}
      />

      {/* ── Corner arcs (quarter circles, radius = CORNER_R) ── */}
      {/* Top-left */}
      <path d={`M ${PX} ${PY + CORNER_R} A ${CORNER_R} ${CORNER_R} 0 0 1 ${PX + CORNER_R} ${PY}`} {...mk} />
      {/* Top-right */}
      <path d={`M ${PX + PW - CORNER_R} ${PY} A ${CORNER_R} ${CORNER_R} 0 0 1 ${PX + PW} ${PY + CORNER_R}`} {...mk} />
      {/* Bottom-left */}
      <path d={`M ${PX + CORNER_R} ${PY + PH} A ${CORNER_R} ${CORNER_R} 0 0 1 ${PX} ${PY + PH - CORNER_R}`} {...mk} />
      {/* Bottom-right */}
      <path d={`M ${PX + PW} ${PY + PH - CORNER_R} A ${CORNER_R} ${CORNER_R} 0 0 1 ${PX + PW - CORNER_R} ${PY + PH}`} {...mk} />
    </svg>
  );
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

const T = {
  box: {
    position: 'absolute',
    bottom: 'calc(100% + 8px)',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    background: 'rgba(15, 20, 15, 0.93)',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: 6,
    padding: '8px 11px',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
  },
  name: {
    fontSize: 11,
    fontWeight: 700,
    color: '#fff',
    marginBottom: 5,
    letterSpacing: '0.01em',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 14,
    fontSize: 10,
    lineHeight: '1.7',
  },
  label: {
    color: 'rgba(255,255,255,0.55)',
  },
  value: {
    color: '#fff',
    fontWeight: 600,
  },
  arrow: {
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 0,
    height: 0,
    borderLeft: '6px solid transparent',
    borderRight: '6px solid transparent',
    borderTop: '6px solid rgba(15,20,15,0.93)',
  },
};

function StatRow({ label, value }) {
  const display = value != null && value !== '' ? value : '—';
  return (
    <div style={T.row}>
      <span style={T.label}>{label}</span>
      <span style={T.value}>{display}</span>
    </div>
  );
}

function PlayerTooltip({ player }) {
  if (!player) return null;
  const rating = player.rating != null ? `${player.rating.toFixed(1)} / 10` : null;
  return (
    <div style={T.box}>
      <div style={T.name}>{player.name}</div>
      <StatRow label="Position" value={player.position} />
      <StatRow label="Club"     value={player.club} />
      <StatRow label="Age"      value={player.age} />
      <StatRow label="Rating"   value={rating} />
      <div style={T.arrow} />
    </div>
  );
}

// ─── Single player token ──────────────────────────────────────────────────────

function PlayerToken({ player, number, isSelected, onClick }) {
  const [hovered, setHovered] = useState(false);

  const wrapStyle = isSelected
    ? { ...S.photoWrap, ...S.photoWrapSelected }
    : S.photoWrap;

  return (
    <div
      style={S.token}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick?.()}
      aria-label={player?.name ?? 'Unknown player'}
      aria-pressed={isSelected}
    >
      {hovered && player && <PlayerTooltip player={player} />}
      <div style={wrapStyle}>
        {player?.photo
          ? <img src={player.photo} alt={player.name} style={S.photo} />
          : <div style={{ ...S.photo, background: '#2d6a2d' }} />
        }
        <div style={S.badge}>{number}</div>
      </div>
      <span style={S.name}>{player?.name ?? '—'}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * @param {{ players: Player[], formation?: import('../../utils/formations').Formation,
 *           onPlayerClick?: (player: Player) => void, selectedPlayer?: Player|null }} props
 */
function FormationBoard({ players, formation = DEFAULT_FORMATION, onPlayerClick, selectedPlayer }) {
  const isEmpty = !players || players.length === 0;

  const rows = [];
  if (!isEmpty) {
    const slots = assignSlots(players, formation.rows);
    let cursor = 0;
    for (const row of formation.rows) {
      rows.push(slots.slice(cursor, cursor + row.count));
      cursor += row.count;
    }
  }

  return (
    <div style={S.wrapper}>
      <FieldMarkings />

      {isEmpty ? (
        <div style={S.empty}>Click Generate Random Team to see the formation</div>
      ) : (
        <div style={S.playersLayer}>
          {rows.map((row, ri) => (
            <div key={ri} style={S.row}>
              {row.map(slot => (
                <PlayerToken
                  key={slot.number}
                  player={slot.player}
                  number={slot.number}
                  isSelected={selectedPlayer?.name === slot.player?.name}
                  onClick={() => slot.player && onPlayerClick?.(slot.player)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FormationBoard;
