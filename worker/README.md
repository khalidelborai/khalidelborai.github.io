# Engagement Worker (views + reactions)

A tiny Cloudflare Worker that stores per-post **view counts** and **emoji
reactions** in KV, served on a **same-origin** route (`blog.borai.dev/api/*`) so
the site's frontend can call `/api/...` with no CORS/CSP cross-origin issues.

## Deploy

```sh
cd worker
npm i -g wrangler          # or use: npx wrangler ...

# 1. create the KV namespace, then paste the printed id into wrangler.jsonc
wrangler kv namespace create ENGAGEMENT

# 2. deploy (creates the worker + the blog.borai.dev/api/* route)
wrangler deploy
```

`borai.dev` must already be an active zone on your Cloudflare account (it is —
the blog is proxied through it). The route in `wrangler.jsonc` carves `/api/*`
out of GitHub Pages and sends it to this Worker.

## Turn it on in the site

Once deployed, set the API base in the site's `config.toml`:

```toml
[extra.engagement]
api = "/api"
```

Push, and the view counter + reaction bar light up on every post. Until then
they stay hidden (the templates gate on a non-empty `api`).

## Notes

- **Free tier** is plenty: KV gives 100k reads + 1k writes/day. Views write once
  per visitor session (the frontend dedupes via `sessionStorage`).
- **Abuse:** anyone can POST to bump a counter — fine for a personal blog. Add a
  Turnstile check or per-IP rate limit later if it gets gamed.
- Allowed reaction emojis are pinned in `src/index.js` (`ALLOWED`); keep them in
  sync with the buttons in `templates/page.html`.
