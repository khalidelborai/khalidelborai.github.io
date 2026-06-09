// Engagement Worker: page views, emoji reactions, popular-posts ranking, event
// logging into Workers Analytics Engine, and a password-gated /stats dashboard.
// Served behind same-origin routes (blog.borai.dev/api/* and /stats).
//
//   POST /api/views      {path, title, referrer}  -> { views }   (increment)
//   GET  /api/views?path=...                       -> { views }   (read)
//   GET  /api/reactions?path=...                   -> { counts }
//   POST /api/react      {path, emoji}             -> { counts }
//   POST /api/event      {type, path, referrer?, query?, depth?} -> { ok }
//   GET  /api/top?n=5                              -> { top: [{path,title,views}] }
//   GET  /stats          (Basic-Auth HTML dashboard)

const ALLOWED = ["👍", "🦀", "🔥", "❤️"];
const DATASET = "borai_events";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const num = (v) => parseInt(v || "0", 10);

async function readViews(env, path) {
  return num(await env.ENGAGEMENT.get("views:" + path));
}

async function readReactions(env, path) {
  const counts = {};
  await Promise.all(
    ALLOWED.map(async (e) => {
      counts[e] = num(await env.ENGAGEMENT.get(`react:${path}:${e}`));
    })
  );
  return counts;
}

function logEvent(env, type, path, fields = {}) {
  if (!env.AE) return;
  try {
    env.AE.writeDataPoint({
      blobs: [type || "", path || "", fields.referrer || "", fields.query || ""],
      doubles: [Number(fields.depth) || 0],
      indexes: [(path || type || "").slice(0, 96)],
    });
  } catch (_) {}
}

// ---- /stats dashboard ----

// Gated by Cloudflare Access (Zero Trust): verify the Access JWT it injects.
// Fails closed — if ACCESS_TEAM_DOMAIN/ACCESS_AUD aren't set, or the token is
// missing/invalid, access is denied (no exposure before Access is configured).
let jwksCache = { team: null, keys: null, at: 0 };

function b64urlBytes(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  s += "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
const b64urlStr = (s) => new TextDecoder().decode(b64urlBytes(s));

async function accessKeys(team) {
  const now = Date.now();
  if (jwksCache.team === team && jwksCache.keys && now - jwksCache.at < 3600000) return jwksCache.keys;
  const r = await fetch(`https://${team}.cloudflareaccess.com/cdn-cgi/access/certs`);
  if (!r.ok) return null;
  const j = await r.json();
  jwksCache = { team, keys: j.keys || [], at: now };
  return jwksCache.keys;
}

async function verifyAccess(request, env) {
  const team = env.ACCESS_TEAM_DOMAIN, aud = env.ACCESS_AUD;
  if (!team || !aud) return false;
  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  let header, payload;
  try {
    header = JSON.parse(b64urlStr(parts[0]));
    payload = JSON.parse(b64urlStr(parts[1]));
  } catch (_) { return false; }
  const audOk = Array.isArray(payload.aud) ? payload.aud.includes(aud) : payload.aud === aud;
  if (!audOk) return false;
  if (!payload.exp || Date.now() / 1000 >= payload.exp) return false;
  const keys = await accessKeys(team);
  const jwk = keys && keys.find((k) => k.kid === header.kid);
  if (!jwk) return false;
  try {
    const key = await crypto.subtle.importKey(
      "jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]
    );
    return await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5", key, b64urlBytes(parts[2]),
      new TextEncoder().encode(parts[0] + "." + parts[1])
    );
  } catch (_) { return false; }
}

async function aeQuery(env, sql) {
  if (!env.CF_API_TOKEN || !env.CF_ACCOUNT_ID) return null;
  try {
    const r = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/analytics_engine/sql`,
      { method: "POST", headers: { Authorization: `Bearer ${env.CF_API_TOKEN}` }, body: sql }
    );
    if (!r.ok) return null;
    const j = await r.json();
    return j.data || [];
  } catch (_) {
    return null;
  }
}

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function renderStats(sections) {
  const table = (sec) =>
    `<section><h2>${esc(sec.title)}</h2>` +
    (sec.rows && sec.rows.length
      ? "<table>" +
        sec.rows.map((r) => `<tr><td>${esc(r[0])}</td><td class="n">${esc(r[1])}</td></tr>`).join("") +
        "</table>"
      : `<p class="empty">${sec.empty || "no data yet"}</p>`) +
    "</section>";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>stats · blog.borai.dev</title><style>
:root{--bg:#211f1a;--fg:whitesmoke;--ac:rgb(255,168,106);--dim:rgba(255,255,255,.5)}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);
font:14px/1.55 ui-monospace,'Fira Code',Menlo,monospace;padding:2rem 1rem}
.wrap{max-width:760px;margin:0 auto}h1{color:var(--ac);font-size:1.25rem;margin:0 0 .2rem}
h1 small{color:var(--dim);font-weight:400;font-size:.78rem}
section{margin:1.6rem 0}h2{font-size:.92rem;border-bottom:1px solid rgba(255,255,255,.15);padding-bottom:.3rem}
table{width:100%;border-collapse:collapse}td{padding:.22rem 0;border-bottom:1px dashed rgba(255,255,255,.08);
overflow:hidden;text-overflow:ellipsis}td.n{text-align:right;color:var(--ac);white-space:nowrap;padding-left:1rem}
.empty{color:var(--dim)}footer{margin-top:2rem;color:var(--dim);font-size:.78rem}
</style></head><body><div class="wrap"><h1>stats <small>blog.borai.dev · last 30 days</small></h1>${sections
    .map(table)
    .join("")}<footer>private · Cloudflare Analytics Engine + KV</footer></div></body></html>`;
}

async function handleStats(request, env) {
  if (!(await verifyAccess(request, env))) {
    return new Response("This dashboard is gated by Cloudflare Access.", {
      status: 403,
      headers: { "content-type": "text/plain;charset=utf-8" },
    });
  }

  // KV: reaction totals per emoji + popular posts.
  const [reactList, viewList] = await Promise.all([
    env.ENGAGEMENT.list({ prefix: "react:" }),
    env.ENGAGEMENT.list({ prefix: "views:" }),
  ]);
  const reactTotals = { "👍": 0, "🦀": 0, "🔥": 0, "❤️": 0 };
  await Promise.all(
    reactList.keys.map(async (k) => {
      const emoji = k.name.split(":").pop();
      if (emoji in reactTotals) reactTotals[emoji] += num(await env.ENGAGEMENT.get(k.name));
    })
  );
  const popular = viewList.keys
    .map((k) => ({ title: (k.metadata && k.metadata.title) || k.name.slice(6), views: (k.metadata && k.metadata.count) || 0 }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // AE: referrers, searches, scroll depth, views by path.
  const W = "timestamp >= NOW() - INTERVAL '30' DAY";
  const [refs, searches, depth, totals] = await Promise.all([
    aeQuery(env, `SELECT blob3 AS k, COUNT(*) AS n FROM ${DATASET} WHERE blob1='view' AND blob3 != '' AND ${W} GROUP BY blob3 ORDER BY n DESC LIMIT 15`),
    aeQuery(env, `SELECT blob4 AS k, COUNT(*) AS n FROM ${DATASET} WHERE blob1='search' AND blob4 != '' AND ${W} GROUP BY blob4 ORDER BY n DESC LIMIT 15`),
    aeQuery(env, `SELECT double1 AS k, COUNT(*) AS n FROM ${DATASET} WHERE blob1='scroll' AND ${W} GROUP BY double1 ORDER BY double1`),
    aeQuery(env, `SELECT COUNT(*) AS n FROM ${DATASET} WHERE blob1='view' AND ${W}`),
  ]);

  const ae_on = refs !== null;
  const sections = [
    {
      title: "overview",
      rows: [
        ["page views (30d)", ae_on && totals && totals[0] ? totals[0].n : "—"],
        ["reactions", Object.values(reactTotals).reduce((a, b) => a + b, 0)],
      ],
    },
    { title: "most read (all time)", rows: popular.map((p) => [p.title, p.views]) },
    { title: "reactions", rows: Object.entries(reactTotals).map(([e, n]) => [e, n]) },
    {
      title: "top referrers (30d)",
      rows: ae_on && refs ? refs.map((r) => [r.k, r.n]) : null,
      empty: ae_on ? "no referrers yet" : "set CF_API_TOKEN + CF_ACCOUNT_ID to enable",
    },
    {
      title: "search queries (30d)",
      rows: ae_on && searches ? searches.map((r) => [r.k, r.n]) : null,
      empty: ae_on ? "no searches yet" : "—",
    },
    {
      title: "read depth (30d)",
      rows: ae_on && depth ? depth.map((r) => [Math.round(r.k) + "%", r.n]) : null,
      empty: ae_on ? "no scroll data yet" : "—",
    },
  ];

  return new Response(renderStats(sections), {
    headers: { "content-type": "text/html;charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" },
  });
}

// ---- main ----

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/stats") return handleStats(request, env);

    const route = url.pathname.replace(/^\/api/, "");

    if (route === "/views") {
      if (request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        const { path, title, referrer } = body;
        if (!path) return json({ error: "path required" }, 400);
        const views = (await readViews(env, path)) + 1;
        await env.ENGAGEMENT.put("views:" + path, String(views), {
          metadata: { count: views, title: (title || "").slice(0, 160) },
        });
        logEvent(env, "view", path, { referrer });
        return json({ views });
      }
      const path = url.searchParams.get("path");
      if (request.method === "GET" && path) return json({ views: await readViews(env, path) });
    }

    if (route === "/reactions" && request.method === "GET") {
      const path = url.searchParams.get("path");
      if (!path) return json({ error: "path required" }, 400);
      return json({ counts: await readReactions(env, path) });
    }

    if (route === "/react" && request.method === "POST") {
      const { path, emoji } = await request.json().catch(() => ({}));
      if (!path || !ALLOWED.includes(emoji)) return json({ error: "bad request" }, 400);
      const key = `react:${path}:${emoji}`;
      await env.ENGAGEMENT.put(key, String(num(await env.ENGAGEMENT.get(key)) + 1));
      return json({ counts: await readReactions(env, path) });
    }

    if (route === "/event" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      logEvent(env, body.type, body.path, body);
      return json({ ok: true });
    }

    if (route === "/top" && request.method === "GET") {
      const n = Math.min(20, num(url.searchParams.get("n")) || 5);
      const list = await env.ENGAGEMENT.list({ prefix: "views:" });
      const top = list.keys
        .map((k) => ({
          path: k.name.slice("views:".length),
          views: (k.metadata && k.metadata.count) || 0,
          title: (k.metadata && k.metadata.title) || "",
        }))
        .filter((i) => i.title)
        .sort((a, b) => b.views - a.views)
        .slice(0, n);
      return json({ top });
    }

    return json({ error: "not found" }, 404);
  },
};
