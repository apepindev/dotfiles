#!/usr/bin/env bash
# Claude Code status line: RGB gradient, dynamic emoji, cost, code velocity

input=$(cat)

# Force '.' as decimal separator regardless of the user's locale
export LC_ALL=en_US.UTF-8

# ── Colors ──
CYAN='\033[36m'
GREEN='\033[32m'
YELLOW='\033[33m'
RED='\033[31m'
MAGENTA='\033[35m'
DIM='\033[2m'
BOLD='\033[1m'
RESET='\033[0m'

# ── Icons ──
# Nerd Font glyphs; off by default while testing whether they cause dropped
# characters on redraw. Enable with CLAUDE_STATUSLINE_ICONS=1 or set the default here.
if [ "${CLAUDE_STATUSLINE_ICONS:-0}" = 1 ]; then
  ICON_REPO=' ' ICON_BRANCH=' ' ICON_CTX='󰟷 ' ICON_MODEL='󰧑 '
else
  ICON_REPO='' ICON_BRANCH='' ICON_CTX='' ICON_MODEL=''
fi

# ── Truecolor helper ──
rgb() { printf '\033[38;2;%d;%d;%dm' "$1" "$2" "$3"; }

# ── Parse JSON fields (one jq call; \x1f separator so empty fields don't collapse like tabs would) ──
IFS=$'\x1f' read -r model used cost lines_add lines_del cwd < <(
  echo "$input" | jq -r '[
    .model.display_name // "Unknown",
    .context_window.used_percentage // "",
    .cost.total_cost_usd // 0,
    .cost.total_lines_added // 0,
    .cost.total_lines_removed // 0,
    .workspace.current_dir // .cwd // ""
  ] | map(tostring) | join("\u001f")'
)

# ── Git info ──
branch=""
repo=""
if [ -n "$cwd" ]; then
  branch=$(git -C "$cwd" --no-optional-locks symbolic-ref --short HEAD 2>/dev/null)
  repo=$(basename "$(git -C "$cwd" --no-optional-locks rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null)
fi

# ── Context bar: RGB gradient, full blocks only ──
BAR_WIDTH=20

if [ -n "$used" ]; then
  used_int=$(printf '%.0f' "$used")

  # Round to nearest block
  filled=$(( (used_int * BAR_WIDTH + 50) / 100 ))

  bar=""
  for (( i=0; i<BAR_WIDTH; i++ )); do
    pos=$(( i * 100 / (BAR_WIDTH - 1) ))

    if [ "$pos" -le 50 ]; then
      r=$(( 0 + 220 * pos / 50 ))
      g=200
      b=$(( 80 - 80 * pos / 50 ))
    else
      adj=$(( pos - 50 ))
      r=220
      g=$(( 200 - 160 * adj / 50 ))
      b=$(( 0 + 20 * adj / 50 ))
    fi

    if [ "$i" -lt "$filled" ]; then
      bar="${bar}$(rgb $r $g $b)█"
    else
      bar="${bar}\033[38;2;60;60;60m░"
    fi
  done
  bar="${bar}${RESET}"

  if [ "$used_int" -ge 90 ]; then pct_color="$RED"
  elif [ "$used_int" -ge 50 ]; then pct_color="$YELLOW"
  else pct_color="$GREEN"; fi

  # Fixed width (%3d) so the line never changes length as the number grows
  ctx_part="${pct_color}${ICON_CTX}${RESET}${bar} ${pct_color}$(printf '%3d%%' "$used_int")${RESET}"
else
  ctx_part="${ICON_CTX}\033[38;2;60;60;60m░░░░░░░░░░░░░░░░░░░░${RESET}  --%"
fi

# ── Cost ──
cost_part="${YELLOW}$(printf '$%.2f' "$cost")${RESET}"

# ── Code velocity ──
velocity="${GREEN}+${lines_add}${RESET} ${RED}-${lines_del}${RESET}"

# ── Single line ──
out=""
[ -n "$repo" ] && out="${BOLD}${YELLOW}${ICON_REPO}${repo}${RESET}"
[ -n "$branch" ] && out="${out:+$out }${BOLD}${CYAN}${ICON_BRANCH}(${branch})${RESET}"
out="${out:+$out ${DIM}|${RESET} }${ctx_part}"
out="${out} ${DIM}|${RESET} ${cost_part}"
out="${out} ${DIM}|${RESET} ${velocity}"
out="${out} ${DIM}|${RESET} ${MAGENTA}${ICON_MODEL}${model}${RESET}"

printf '%b' "$out"
