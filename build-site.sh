#!/usr/bin/env bash
# Builds all four prototypes and assembles them into _site/ for GitHub Pages.
# Run locally with:  ./build-site.sh
set -euo pipefail

APPS=(
  "design/prototype/care2sleep-prototype:prototype"
  "handover/trainee-coach-portal/app:trainee-coach-portal"
  "handover/researcher - dashboard/researcher-dashboard_V2_27Aug/app:researcher-dashboard-v2"
  "handover/researcher - dashboard/researcher-dashboard/app:researcher-dashboard-v1"
)

rm -rf _site
mkdir -p _site

for entry in "${APPS[@]}"; do
  dir="${entry%:*}"
  slug="${entry##*:}"
  echo "==> Building $slug"
  ( cd "$dir" && npm ci --no-audit --no-fund && npm run build )
  mkdir -p "_site/$slug"
  cp -R "$dir/dist/." "_site/$slug/"
done

cp site/index.html _site/index.html
touch _site/.nojekyll   # stop GitHub Pages ignoring files that begin with an underscore

echo "==> Done. Site assembled in _site/"
