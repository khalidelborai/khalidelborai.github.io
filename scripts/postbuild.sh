#!/usr/bin/env bash
# Prune theme-shipped assets this site never links, so they don't bloat the
# deployed artifact.
#
# Terminus copies its entire static/ tree into the output regardless of config
# flags. With `katex = false` and no search UI, the KaTeX bundle/fonts and the
# elasticlunr search runtime are dead weight (no HTML references them). This
# trims them from the build output only — the theme submodule is untouched.
#
# If you later set `katex = true` in config.toml, remove the katex lines below.
set -euo pipefail
out="${1:-public}"

before=$(find "$out" -type f | wc -l | tr -d ' ')

rm -rf \
  "$out/js/katex.min.js" \
  "$out/css/katex.min.css" \
  "$out/fonts/katex" \
  "$out/elasticlunr.min.js"

# Only present when build_search_index = true; harmless otherwise.
rm -f "$out"/search_index.*.js

after=$(find "$out" -type f | wc -l | tr -d ' ')
echo "postbuild: pruned $((before - after)) unused asset(s) from $out/"

# Build the static search index over the final HTML (Pagefind: Rust-based,
# lazy-loaded at runtime, writes to $out/pagefind/). Prefer a local binary;
# fall back to npx so CI needs no separate install step.
if command -v pagefind >/dev/null 2>&1; then
  pagefind --site "$out"
else
  npx -y pagefind@1 --site "$out"
fi
echo "postbuild: built Pagefind search index in $out/pagefind/"
