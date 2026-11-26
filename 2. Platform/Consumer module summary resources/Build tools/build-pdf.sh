#!/bin/bash
# Build a module's resource PDF:  ./build-pdf.sh "Module 1" "Care2Sleep Module 1 Resource - Building Blocks of Good Sleep.pdf"
# Needs the consumer-print-resources server running (preview_start), Google Chrome, python3 + pypdf.
# Per module, Resource/ holds index.html, pdf-fields.json (answer boxes, measured live in pt) and pdf-outline.json (bookmarks).
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"; MOD="$1"; NAME="$2"; PORT="${PORT:-5300}"
RES="$HERE/../$MOD/Resource"; TMP="$(mktemp -d)"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --no-pdf-header-footer \
  --export-tagged-pdf --run-all-compositor-stages-before-draw --virtual-time-budget=15000 --user-data-dir="$TMP/profile" \
  --print-to-pdf="$TMP/render.pdf" "http://localhost:$PORT/${MOD// /%20}/Resource/index.html?b=$(date +%s)" >/dev/null 2>&1
python3 "$HERE/add_fields.py" "$TMP/render.pdf" "$RES/$NAME" "$RES/pdf-fields.json" "$RES/pdf-outline.json"
rm -rf "$TMP"; echo "built: $RES/$NAME"
