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

## Insights

Beyond view counts and reactions (KV), the Worker logs events to **Workers
Analytics Engine** (`borai_events` dataset): page views with **referrer**,
**scroll depth** (25/50/75/100%), and **search queries**.

- **Popular posts** come from KV (view-count metadata) via `GET /api/top` — used
  by the "Most read" widget on the home page. No external query needed.
- **Everything else** is in Analytics Engine. Query it with the Cloudflare API
  (needs an API token with *Account Analytics: Read*):

  ```sh
  curl "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/analytics_engine/sql" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -d "SELECT blob1 AS type, blob3 AS referrer, blob4 AS query, double1 AS depth
        FROM borai_events WHERE timestamp > NOW() - INTERVAL '7' DAY"
  ```

  Schema: `blob1=type` (view/scroll/search), `blob2=path`, `blob3=referrer`,
  `blob4=query`, `double1=scroll depth`, `index1=path`. Example aggregates: top
  referrers (`GROUP BY blob3`), search terms (`WHERE blob1='search' GROUP BY blob4`),
  median read depth (`WHERE blob1='scroll'`).

## Dashboard (`/stats`)

`https://blog.borai.dev/stats` is a private HTML dashboard the Worker renders
itself — it queries Analytics Engine (referrers, searches, read depth) and KV
(views, reactions) **server-side**, so the API token never reaches the browser.

### Auth: Cloudflare Access (Zero Trust)

The Worker trusts **Cloudflare Access** — it verifies the Access JWT
(`Cf-Access-Jwt-Assertion`) and **fails closed** otherwise (so `/stats` is denied
until Access is configured — no exposure window, no shared password).

1. **Zero Trust dashboard → Access → Applications → Add an application →
   Self-hosted.** Domain `blog.borai.dev`, path `stats`. Add a policy:
   *Allow* · Include → *Emails* → your email (or GitHub/Google SSO).
2. Open the app → copy its **Application Audience (AUD) Tag**. Your **team name**
   is the `<x>` in `https://<x>.cloudflareaccess.com` (Zero Trust → Settings).
3. Fill them into `wrangler.jsonc` `vars` and redeploy:
   ```jsonc
   "ACCESS_TEAM_DOMAIN": "<team>",
   "ACCESS_AUD": "<aud-tag>"
   ```
   ```sh
   npx wrangler deploy
   ```

Now `/stats` is gated by Access (SSO/MFA at the edge **and** JWT-verified in the
Worker). The old `STATS_PASSWORD` secret is unused — `wrangler secret delete
STATS_PASSWORD`.

### Analytics token

The AE sections need a Cloudflare API token (**Account Analytics: Read**):
`npx wrangler secret put CF_API_TOKEN`. Until it's set, the KV sections (views,
reactions, most-read) still work and the AE sections show a hint. `CF_ACCOUNT_ID`
is a non-secret var in `wrangler.jsonc`.
