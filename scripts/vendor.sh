#!/usr/bin/env bash
# Fetch large third-party assets we don't commit to the repo, before `zola build`
# copies static/ into the output. Idempotent: only downloads what's missing.
set -euo pipefail

MERMAID_VERSION="11"
mermaid="static/js/mermaid.min.js"

mkdir -p static/js
if [ ! -f "$mermaid" ]; then
  echo "vendor: fetching mermaid@${MERMAID_VERSION}…"
  curl -sSL "https://cdn.jsdelivr.net/npm/mermaid@${MERMAID_VERSION}/dist/mermaid.min.js" -o "$mermaid"
fi
echo "vendor: mermaid ready ($(wc -c < "$mermaid" | awk '{printf "%.1f MB", $1/1048576}'))"
