#!/usr/bin/env bash
# Builds the Care2Sleep platform prototype and assembles it into _site/
# for GitHub Pages. Run locally with:  ./build-site.sh
#
# The site publishes ONE prototype, served at /prototype/. The three handover
# packages under handover/ are deliberately NOT published — their source stays
# in the repository for engineering, but nothing links to or builds them.
set -euo pipefail

APP="design/prototype/care2sleep-prototype"
SLUG="prototype"

rm -rf _site
mkdir -p "_site/$SLUG"

echo "==> Building $SLUG"
( cd "$APP" && npm ci --no-audit --no-fund && npm run build )
cp -R "$APP/dist/." "_site/$SLUG/"

cp site/index.html _site/index.html
touch _site/.nojekyll   # stop GitHub Pages ignoring files that begin with an underscore

echo "==> Done. Site assembled in _site/"
