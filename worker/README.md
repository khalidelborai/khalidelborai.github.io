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

Two secrets enable it (no redeploy needed after setting them):

```sh
cd worker
# 1. password for the dashboard's HTTP Basic Auth
npx wrangler secret put STATS_PASSWORD

# 2. Cloudflare API token with **Account Analytics: Read**
#    (dash.cloudflare.com → My Profile → API Tokens → Create)
npx wrangler secret put CF_API_TOKEN
```

Until `STATS_PASSWORD` is set the page returns 401; until `CF_API_TOKEN` is set
the KV sections still work but the AE sections show a hint. `CF_ACCOUNT_ID` lives
in `wrangler.jsonc` (not a secret).

### Gating with Zero Trust (optional, recommended later)

The Basic-Auth password is a simple stopgap. To put **Cloudflare Access**
(Zero Trust) in front instead — SSO/MFA, no shared password — add a self-hosted
Access application for `blog.borai.dev/stats` with an allow policy (e.g. your
email). Access enforces auth at the edge *before* the request reaches the Worker,
so it composes with (or replaces) the Basic-Auth check with **zero code changes**.
If you want the Worker to fully trust Access, switch `authed()` to verify the
`Cf-Access-Jwt-Assertion` header instead of the password.
