#!/usr/bin/env bash
# build-readme-carousel.sh — GIF carousel from docs/screenshots/*.png for README.
# Location: scripts/build-readme-carousel.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$ROOT/docs/screenshots"
WORK="$DIR/.work"
mkdir -p "$WORK"

labels=(
  "01-login|Login"
  "02-dashboard|Dashboard"
  "03-bibliothek|Bibliothek"
  "04-character-editor|Charakter-Editor"
  "05-marktplatz|Marktplatz"
  "06-session-join|Session"
)

for entry in "${labels[@]}"; do
  name="${entry%%|*}"
  label="${entry##*|}"
  src="$DIR/${name}.png"
  [[ -f "$src" ]] || { echo "missing $src" >&2; exit 1; }
  ffmpeg -y -i "$src" -vf "scale=960:600:force_original_aspect_ratio=decrease,pad=960:600:(ow-iw)/2:(oh-ih)/2:#0F172A,drawbox=x=0:y=ih-48:w=iw:h=48:color=#0F172A@0.9:t=fill,drawtext=text='${label}':fontcolor=white:fontsize=24:x=24:y=h-34:font=Helvetica" "$WORK/${name}.png" >/dev/null 2>&1
done

ffmpeg -y \
  -loop 1 -t 2.2 -i "$WORK/01-login.png" \
  -loop 1 -t 2.2 -i "$WORK/02-dashboard.png" \
  -loop 1 -t 2.2 -i "$WORK/03-bibliothek.png" \
  -loop 1 -t 2.2 -i "$WORK/04-character-editor.png" \
  -loop 1 -t 2.2 -i "$WORK/05-marktplatz.png" \
  -loop 1 -t 2.2 -i "$WORK/06-session-join.png" \
  -filter_complex "\
    [0][1][2][3][4][5]concat=n=6:v=1:a=0,fps=2,split[a][b];\
    [a]palettegen=max_colors=128:stats_mode=diff[p];\
    [b][p]paletteuse=dither=bayer:bayer_scale=4\
  " \
  -loop 0 "$DIR/carousel.gif" >/dev/null 2>&1

rm -rf "$WORK"
ls -lh "$DIR/carousel.gif"
echo "✓ wrote $DIR/carousel.gif"
