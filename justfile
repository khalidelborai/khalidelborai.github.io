
# Show help
alias help := default
title := "$POST_TITLE"

default:
    @just --list --justfile {{justfile()}} --unsorted

# Serve locally with live reload + drafts
serve:
    @zola serve --drafts

# Build the production site into ./public (vendor + prune + Pagefind search index)
build:
    @bash scripts/vendor.sh
    @zola build
    @bash scripts/postbuild.sh public

# Build with a localhost base_url + search index, then serve it. Use this to
# test search locally (`just serve` has no index; prod base_url breaks CSP here).
preview:
    @bash scripts/vendor.sh
    @zola build --base-url http://127.0.0.1:8000
    @bash scripts/postbuild.sh public
    @echo "Built site with search → http://127.0.0.1:8000  (Ctrl+C to stop)"
    @python3 -m http.server 8000 --directory public

# Validate content, templates, and links
check:
    @zola check

# Scaffold a new blog post: just post "My Title"
post title=title:
    #!/usr/bin/env bash
    set -euo pipefail
    slug=$(echo "{{title}}" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g')
    date=$(date +%F)
    file="content/blog/${date}-${slug}.md"
    mkdir -p content/blog
    printf '+++\ntitle = "%s"\ndate = %s\n\n[taxonomies]\ntags = []\ncategories = []\n+++\n\n' "{{title}}" "$date" > "$file"
    echo "Created $file"
