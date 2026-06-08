# Archive — pre-Zola backup

This folder preserves the original **Jekyll / Chirpy** site content that was
replaced during the migration to Zola + Terminus.

## What's here

- `jekyll-posts/` — the two original posts (`my-rusty-chain`, `polars-vs-pandas`)
  and their images (`rusty_chain.webp`, `rusty_path/`).
- `jekyll-config/` — the original `_config.yml`, `about.md`, and `_data/` files
  (your social/contact/share settings as they were).

## Full snapshot

The **complete** old site (every file, plugins, theme gem config, git history)
is preserved on the git branch:

```console
git checkout backup/jekyll-chirpy
```

Nothing was lost — the live site simply starts fresh with no posts. To bring an
old post back, convert its YAML front matter (`---`) to Zola TOML (`+++`), map
`categories:`/`tags:` into a `[taxonomies]` table, and drop it in `content/blog/`.

> This directory is ignored by Zola (it lives outside `content/`), so it never
> appears on the published site.
