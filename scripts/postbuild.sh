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

# Mermaid's library is ~3 MB; keep it out of the artifact unless a page actually
# loads a diagram (the shortcode emits a mermaid-render.js reference when used).
if ! grep -rql "mermaid-render.js" "$out" --include='*.html' 2>/dev/null; then
  rm -f "$out/js/mermaid.min.js" "$out/js/mermaid-render.js"
  echo "postbuild: no diagrams found — pruned mermaid from $out/"
fi

# Likewise, ship the asciinema player only if a page embeds a cast.
if ! grep -rql "asciinema-render.js" "$out" --include='*.html' 2>/dev/null; then
  rm -f "$out/js/asciinema-player.min.js" "$out/js/asciinema-render.js" "$out/css/asciinema-player.css"
  echo "postbuild: no casts found — pruned asciinema from $out/"
fi

# Build the static search index over the final HTML (Pagefind: Rust-based,
# lazy-loaded at runtime, writes to $out/pagefind/). Prefer a local binary;
# fall back to npx so CI needs no separate install step.
if command -v pagefind >/dev/null 2>&1; then
  pagefind --site "$out"
else
  npx -y pagefind@1 --site "$out"
fi
echo "postbuild: built Pagefind search index in $out/pagefind/"

# Generate /feed.json (JSON Feed) and /llms.txt from the posts.
python3 scripts/gen-extra.py "$out"
