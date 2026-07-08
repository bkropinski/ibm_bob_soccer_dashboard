"""
Player Dashboard — Streamlit port of the React application.

Run with:
    streamlit run dashboard/app.py
"""

import json
import random
from pathlib import Path

import streamlit as st

# ── Data ──────────────────────────────────────────────────────────────────────

DATA_PATH = Path(__file__).parent.parent / "src" / "data" / "players.json"

@st.cache_data
def load_players():
    with open(DATA_PATH) as f:
        return json.load(f)

# ── Formations ────────────────────────────────────────────────────────────────

FORMATIONS = {
    "4-4-2":   [("FWD", 2), ("MID", 4), ("DEF", 4), ("GK", 1)],
    "4-3-3":   [("FWD", 3), ("MID", 3), ("DEF", 4), ("GK", 1)],
    "3-5-2":   [("FWD", 2), ("MID", 5), ("DEF", 3), ("GK", 1)],
    "4-2-3-1": [("FWD", 1), ("AMF", 3), ("DMF", 2), ("DEF", 4), ("GK", 1)],
    "5-3-2":   [("FWD", 2), ("MID", 3), ("DEF", 5), ("GK", 1)],
    "3-4-3":   [("FWD", 3), ("MID", 4), ("DEF", 3), ("GK", 1)],
}

ROLE_TO_POSITION = {
    "GK":  "Goalkeeper",
    "DEF": "Defender",
    "MID": "Midfielder",
    "DMF": "Midfielder",
    "AMF": "Midfielder",
    "FWD": "Attacker",
}

# ── Team generator ────────────────────────────────────────────────────────────

def generate_team(players: list, formation_key: str) -> list:
    """Pick 11 players matching the position requirements of the formation."""
    rows = FORMATIONS[formation_key]

    # Build a shuffled pool per position
    pools: dict[str, list] = {}
    for position in set(ROLE_TO_POSITION.values()):
        pools[position] = [p for p in players if p["position"] == position]
        random.shuffle(pools[position])

    selected = []
    used = set()

    for role, count in rows:
        position = ROLE_TO_POSITION.get(role)
        pool = pools.get(position, [])
        filled = 0
        for candidate in pool:
            if filled >= count:
                break
            if candidate["name"] not in used:
                selected.append(candidate)
                used.add(candidate["name"])
                filled += 1
        # Fallback for exhausted pools
        if filled < count:
            fallback = [p for p in players if p["name"] not in used]
            random.shuffle(fallback)
            for candidate in fallback:
                if filled >= count:
                    break
                selected.append(candidate)
                used.add(candidate["name"])
                filled += 1

    return selected

# ── Formation board SVG ───────────────────────────────────────────────────────

def render_formation_svg(team: list, formation_key: str) -> str:
    """
    Returns an SVG string of a football pitch with player tokens.
    Team list is ordered FWD→GK (top→bottom), matching formation rows.
    """
    W, H = 420, 620
    BORDER = 14
    PX, PY = BORDER, BORDER
    PW, PH = W - BORDER * 2, H - BORDER * 2
    CX, CY = W / 2, H / 2

    PEN_W, PEN_H = PW * 0.50, PH * 0.165
    PEN_X = CX - PEN_W / 2

    GOAL_W, GOAL_H = PEN_W * 0.50, PEN_H * 0.40
    GOAL_X = CX - GOAL_W / 2

    CC_R = PW * 0.185
    CORNER_R = 8
    GOAL_NET_H = 12

    mk = 'stroke="rgba(255,255,255,0.88)" stroke-width="1.5" fill="none"'
    spot_fill = 'fill="rgba(255,255,255,0.88)"'

    top_pen_y = PY
    bot_pen_y = PY + PH - PEN_H
    top_spot_y = top_pen_y + PEN_H * 0.60
    bot_spot_y = bot_pen_y + PEN_H * 0.40

    lines = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H + GOAL_NET_H * 2}" '
        f'viewBox="0 {-GOAL_NET_H} {W} {H + GOAL_NET_H * 2}" '
        f'style="display:block;border-radius:8px;">',
        # Grass background
        f'<rect width="{W}" height="{H}" fill="url(#grass)" rx="8"/>',
        '<defs>',
        '  <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">',
        '    <stop offset="0%" stop-color="#3a8c3a"/>',
        '    <stop offset="100%" stop-color="#276527"/>',
        '  </linearGradient>',
        # Net pattern
        f'  <pattern id="net" x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse">',
        f'    <rect width="5" height="5" fill="white"/>',
        f'    <line x1="0" y1="5" x2="5" y2="0" stroke="rgba(160,210,160,0.6)" stroke-width="0.8"/>',
        '  </pattern>',
        # Penalty arc clips
        f'  <clipPath id="tc"><rect x="0" y="{top_pen_y + PEN_H}" width="{W}" height="{H}"/></clipPath>',
        f'  <clipPath id="bc"><rect x="0" y="0" width="{W}" height="{bot_pen_y}"/></clipPath>',
        '</defs>',
        # Pitch border
        f'<rect x="{PX}" y="{PY}" width="{PW}" height="{PH}" {mk}/>',
        # Halfway line + centre circle + spot
        f'<line x1="{PX}" y1="{CY}" x2="{PX+PW}" y2="{CY}" {mk}/>',
        f'<circle cx="{CX}" cy="{CY}" r="{CC_R}" {mk}/>',
        f'<circle cx="{CX}" cy="{CY}" r="3" {spot_fill}/>',
        # Top penalty box + goal area + spot + arc
        f'<rect x="{PEN_X}" y="{top_pen_y}" width="{PEN_W}" height="{PEN_H}" {mk}/>',
        f'<rect x="{GOAL_X}" y="{PY}" width="{GOAL_W}" height="{GOAL_H}" {mk}/>',
        f'<circle cx="{CX}" cy="{top_spot_y}" r="3" {spot_fill}/>',
        f'<circle cx="{CX}" cy="{top_spot_y}" r="{CC_R}" {mk} clip-path="url(#tc)"/>',
        # Top goal net
        f'<rect x="{CX-GOAL_W/2}" y="{PY-GOAL_NET_H}" width="{GOAL_W}" height="{GOAL_NET_H}" '
        f'fill="url(#net)" stroke="rgba(255,255,255,0.88)" stroke-width="1.5"/>',
        # Bottom penalty box + goal area + spot + arc
        f'<rect x="{PEN_X}" y="{bot_pen_y}" width="{PEN_W}" height="{PEN_H}" {mk}/>',
        f'<rect x="{GOAL_X}" y="{PY+PH-GOAL_H}" width="{GOAL_W}" height="{GOAL_H}" {mk}/>',
        f'<circle cx="{CX}" cy="{bot_spot_y}" r="3" {spot_fill}/>',
        f'<circle cx="{CX}" cy="{bot_spot_y}" r="{CC_R}" {mk} clip-path="url(#bc)"/>',
        # Bottom goal net
        f'<rect x="{CX-GOAL_W/2}" y="{PY+PH}" width="{GOAL_W}" height="{GOAL_NET_H}" '
        f'fill="url(#net)" stroke="rgba(255,255,255,0.88)" stroke-width="1.5"/>',
        # Corner arcs
        f'<path d="M {PX} {PY+CORNER_R} A {CORNER_R} {CORNER_R} 0 0 1 {PX+CORNER_R} {PY}" {mk}/>',
        f'<path d="M {PX+PW-CORNER_R} {PY} A {CORNER_R} {CORNER_R} 0 0 1 {PX+PW} {PY+CORNER_R}" {mk}/>',
        f'<path d="M {PX+CORNER_R} {PY+PH} A {CORNER_R} {CORNER_R} 0 0 1 {PX} {PY+PH-CORNER_R}" {mk}/>',
        f'<path d="M {PX+PW} {PY+PH-CORNER_R} A {CORNER_R} {CORNER_R} 0 0 1 {PX+PW-CORNER_R} {PY+PH}" {mk}/>',
    ]

    # ── Player tokens ──
    rows = FORMATIONS[formation_key]
    # Players arrive ordered FWD→GK, numbered 11 down to 1
    player_idx = 0
    shirt_num = len(team)

    # Distribute vertical space evenly across rows
    n_rows = len(rows)
    row_ys = [PY + PH * (i + 0.5) / n_rows for i in range(n_rows)]

    for row_i, (role, count) in enumerate(rows):
        row_y = row_ys[row_i]
        for col_i in range(count):
            if player_idx >= len(team):
                break
            p = team[player_idx]
            token_x = PX + PW * (col_i + 0.5) / count
            token_y = row_y
            num = shirt_num - player_idx

            # Photo circle (clipped)
            clip_id = f"c{player_idx}"
            r = 18
            lines += [
                f'<defs><clipPath id="{clip_id}"><circle cx="{token_x}" cy="{token_y}" r="{r}"/></clipPath></defs>',
                f'<circle cx="{token_x}" cy="{token_y}" r="{r}" fill="#276527" stroke="rgba(255,255,255,0.9)" stroke-width="1.5"/>',
                f'<image href="{p["photo"]}" x="{token_x-r}" y="{token_y-r}" width="{r*2}" height="{r*2}" clip-path="url(#{clip_id})" preserveAspectRatio="xMidYMid slice"/>',
                # Badge
                f'<circle cx="{token_x+r-3}" cy="{token_y-r+3}" r="7" fill="#f0c040" stroke="white" stroke-width="1"/>',
                f'<text x="{token_x+r-3}" y="{token_y-r+3}" text-anchor="middle" dominant-baseline="central" font-size="6" font-weight="700" fill="#111">{num}</text>',
                # Name label
                f'<text x="{token_x}" y="{token_y+r+9}" text-anchor="middle" font-size="7.5" fill="white" '
                f'style="text-shadow:0 1px 2px rgba(0,0,0,0.9)" font-family="system-ui,sans-serif">'
                f'{p["name"][:14]}</text>',
            ]
            player_idx += 1

    lines.append('</svg>')
    return "\n".join(lines)

# ── Player summary ────────────────────────────────────────────────────────────

def build_summary(p: dict) -> str:
    parts = [p["name"]]
    if p.get("position"):
        parts[0] += f" is a {p['position']}"
    if p.get("age"):
        parts[0] += f" aged {p['age']}"
    if p.get("citizenship"):
        parts[0] += f", from {p['citizenship']}"
    parts[0] += "."
    if p.get("club"):
        parts.append(f"They currently play for {p['club']}.")
    r = p.get("rating")
    if r is not None:
        if r >= 8.0:
            form = "in strong form"
        elif r >= 6.0:
            form = "showing consistent form"
        else:
            form = "building form"
        parts.append(f"Based on available statistics, they are {form}.")
    parts.append("This profile is based on the available dataset only.")
    return " ".join(parts)

# ── Streamlit app ─────────────────────────────────────────────────────────────

st.set_page_config(page_title="Player Dashboard", page_icon="⚽", layout="wide")
st.title("⚽ Player Dashboard")

players = load_players()
all_names = [p["name"] for p in players]
positions = ["All positions"] + sorted({p["position"] for p in players})
sort_options = {
    "Default order": None,
    "Name (A → Z)":         lambda p: p["name"],
    "Name (Z → A)":         lambda p: p["name"],
    "Age (youngest first)": lambda p: p.get("age") or 999,
    "Rating (best first)":  lambda p: -(p.get("rating") or 0),
}

# ════════════════════════════════════════════════════════
# Section 1 — Player selector
# ════════════════════════════════════════════════════════
st.header("Player Selector")

col_f, col_s, col_p = st.columns([1, 1, 2])

with col_f:
    pos_filter = st.selectbox("Position", positions)

with col_s:
    sort_choice = st.selectbox("Sort by", list(sort_options.keys()))

# Apply filter
filtered = [p for p in players if pos_filter == "All positions" or p["position"] == pos_filter]

# Apply sort
sort_key = sort_options[sort_choice]
if sort_key:
    reverse = sort_choice == "Name (Z → A)"
    filtered = sorted(filtered, key=sort_key, reverse=reverse)

# Search
search_query = st.text_input("Search by name", placeholder="Search by name…")
if search_query:
    filtered = [p for p in filtered if search_query.lower() in p["name"].lower()]

with col_p:
    player_names = [p["name"] for p in filtered]
    sel_name = st.selectbox(
        "Player",
        ["Select a player…"] + player_names,
        key="player_select",
    )

selected_player = next((p for p in filtered if p["name"] == sel_name), None)

# Player card + summary
if selected_player:
    st.divider()
    card_col, summary_col = st.columns([1, 2])

    with card_col:
        if selected_player.get("photo"):
            st.image(selected_player["photo"], width=120)
        st.subheader(selected_player["name"])
        rating = selected_player.get("rating")
        st.markdown(f"""
| Stat | Value |
|---|---|
| **Position** | {selected_player.get('position') or '—'} |
| **Age** | {selected_player.get('age') or '—'} |
| **Nationality** | {selected_player.get('citizenship') or '—'} |
| **Club** | {selected_player.get('club') or '—'} |
| **Form rating** | {f"{rating:.1f} / 10" if rating is not None else '—'} |
""")

    with summary_col:
        st.markdown("**Player Summary**")
        st.write(build_summary(selected_player))
        st.caption("This summary is based only on the loaded dataset.")

# ════════════════════════════════════════════════════════
# Section 2 — Formation board
# ════════════════════════════════════════════════════════
st.divider()
st.header("Team Formation")

ctrl_left, ctrl_right = st.columns([1, 1])

with ctrl_left:
    formation_key = st.selectbox("Formation", list(FORMATIONS.keys()))

with ctrl_right:
    generate = st.button("Generate Random Team", type="primary")

if generate:
    st.session_state["team"] = generate_team(players, formation_key)
    st.session_state["formation_key"] = formation_key

team = st.session_state.get("team", [])
active_formation = st.session_state.get("formation_key", formation_key)

if team:
    board_col, panel_col = st.columns([2, 1])

    with board_col:
        svg = render_formation_svg(team, active_formation)
        st.components.v1.html(svg, height=680, scrolling=False)

    with panel_col:
        st.markdown("**Click a row below to see player details**")
        rows = FORMATIONS[active_formation]
        player_idx = 0
        shirt = len(team)

        for role, count in rows:
            st.markdown(f"**{role}**")
            for _ in range(count):
                if player_idx >= len(team):
                    break
                p = team[player_idx]
                num = shirt - player_idx
                col_img, col_info = st.columns([1, 3])
                with col_img:
                    if p.get("photo"):
                        st.image(p["photo"], width=40)
                with col_info:
                    r = p.get("rating")
                    rating_str = f"{r:.1f}/10" if r is not None else "—"
                    st.markdown(
                        f"**#{num} {p['name']}**  \n"
                        f"{p.get('club','—')} · {p.get('age','—')}y · {rating_str}"
                    )
                player_idx += 1
else:
    st.info("Select a formation and click **Generate Random Team** to see the lineup.")

# ════════════════════════════════════════════════════════
# Section 3 — Compare players
# ════════════════════════════════════════════════════════
st.divider()
st.header("Compare Players")

cmp_a_col, vs_col, cmp_b_col = st.columns([5, 1, 5])

with cmp_a_col:
    name_a = st.selectbox("Player A", ["Select a player…"] + all_names, key="cmp_a")

with vs_col:
    st.markdown("<div style='padding-top:2rem;text-align:center;font-weight:600'>vs</div>", unsafe_allow_html=True)

with cmp_b_col:
    name_b = st.selectbox("Player B", ["Select a player…"] + all_names, key="cmp_b")

player_a = next((p for p in players if p["name"] == name_a), None)
player_b = next((p for p in players if p["name"] == name_b), None)

if player_a or player_b:
    col_a, col_b = st.columns(2)

    def _rating_winner(a, b):
        ra, rb = a.get("rating"), b.get("rating")
        if ra is None and rb is None:
            return None
        if ra is None:
            return "b"
        if rb is None:
            return "a"
        if ra > rb:
            return "a"
        if rb > ra:
            return "b"
        return "tie"

    winner = _rating_winner(player_a or {}, player_b or {})

    def _render_compare_card(p, side, col):
        with col:
            if p:
                if p.get("photo"):
                    st.image(p["photo"], width=90)
                st.subheader(p["name"])
                r = p.get("rating")
                rating_str = f"{r:.1f} / 10" if r is not None else "—"
                is_winner = winner == side

                rows_md = f"""
| Stat | Value |
|---|---|
| Position | {p.get('position') or '—'} |
| Age | {p.get('age') or '—'} |
| Nationality | {p.get('citizenship') or '—'} |
| Club | {p.get('club') or '—'} |
| Form rating | {"⭐ " if is_winner else ""}{rating_str} |
"""
                st.markdown(rows_md)
            else:
                st.markdown("*Select a player*")

    _render_compare_card(player_a, "a", col_a)
    _render_compare_card(player_b, "b", col_b)
