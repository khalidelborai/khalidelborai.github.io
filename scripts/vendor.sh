#!/usr/bin/env bash
# Fetch large third-party assets we don't commit to the repo, before `zola build`
# copies static/ into the output. Idempotent: only downloads what's missing.
set -euo pipefail

mkdir -p static/js static/css

# fetch <dest> <url>  — download only if missing
fetch() {
  if [ ! -f "$1" ]; then
    echo "vendor: fetching $(basename "$1")…"
    curl -sSL "$2" -o "$1"
  fi
  echo "vendor: $(basename "$1") ready ($(wc -c < "$1" | awk '{printf "%.0f KB", $1/1024}'))"
}

# Mermaid diagrams (https://mermaid.js.org) — ~3 MB
fetch static/js/mermaid.min.js \
  "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"

# asciinema terminal player (https://asciinema.org) — ~173 KB + 18 KB css
fetch static/js/asciinema-player.min.js \
  "https://cdn.jsdelivr.net/npm/asciinema-player@3/dist/bundle/asciinema-player.min.js"
fetch static/css/asciinema-player.css \
  "https://cdn.jsdelivr.net/npm/asciinema-player@3/dist/bundle/asciinema-player.css"
