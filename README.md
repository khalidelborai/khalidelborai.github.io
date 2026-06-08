# blog.borai.dev

Personal site of **Khalid Elborai** — built with the [Zola](https://www.getzola.org)
static site generator and the [Terminus](https://github.com/ebkalderon/terminus)
theme. Deploys to GitHub Pages at [blog.borai.dev](https://blog.borai.dev).

## Develop

Requires [Zola](https://www.getzola.org/documentation/getting-started/installation/)
≥ 0.22 (`brew install zola`) and the theme submodule:

```console
git submodule update --init --recursive   # first checkout only
just serve                                 # http://127.0.0.1:1111 with live reload
```

Other recipes (`just` to list all):

| Recipe              | Action                                                     |
| ------------------- | ---------------------------------------------------------- |
| `just serve`        | Dev server with live reload + drafts (no search index)     |
| `just build`        | Production build → `./public` (prune + Pagefind index)     |
| `just preview`      | Build, then serve `./public` on :8000 — search works here  |
| `just check`        | Validate content, templates, and links                     |
| `just post "Title"` | Scaffold `content/blog/<date>-<slug>.md`                   |

Full-text search is powered by [Pagefind](https://pagefind.app) (built in
`scripts/postbuild.sh`). It indexes the generated HTML, so it only works on the
built output — use `just preview`, not `just serve`, to test it locally.

Diagrams use [Mermaid](https://mermaid.js.org). Set `[extra] mermaid = true` in a
post's front matter, then write `{% mermaid() %}…{% end %}`. The library is
vendored at build time (`scripts/vendor.sh`) and only shipped to pages that use a
diagram. See `CLAUDE.md` for the CSP details.

## Deploy

Push to `main` → `.github/workflows/pages-deploy.yml` installs Zola, builds, and
publishes to GitHub Pages. No manual step.

## Theme & config

- Theme is vendored as a git submodule at `themes/terminus`; update with
  `git submodule update --remote themes/terminus`.
- Site identity, menu, socials, and color scheme live in `config.toml`.
- The previous Jekyll/Chirpy site is preserved on the `backup/jekyll-chirpy`
  branch and under `_archive/` — see `_archive/README.md`.

## License

Content © Khalid Elborai. Theme under [MIT](https://github.com/ebkalderon/terminus/blob/master/LICENSE).
