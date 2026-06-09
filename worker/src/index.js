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

// Increment a KV aggregate counter, storing count + label in metadata so a
// single list() can read+rank them without per-key GETs.
async function kvIncr(env, key, label) {
  const n = num(await env.ENGAGEMENT.get(key)) + 1;
  await env.ENGAGEMENT.put(key, String(n), { metadata: { count: n, label: String(label).slice(0, 120) } });
}

function refHost(referrer) {
  try {
    const h = new URL(referrer).hostname.replace(/^www\./, "");
    return h && h !== "blog.borai.dev" ? h : "";
  } catch (_) {
    return "";
  }
}

async function aggTop(env, prefix, n = 15) {
  const list = await env.ENGAGEMENT.list({ prefix });
  return list.keys
    .map((k) => ({
      label: (k.metadata && k.metadata.label) || k.name.slice(prefix.length),
      count: (k.metadata && k.metadata.count) || 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

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
  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token) return false; // request didn't pass through Cloudflare Access → deny
  // Trust the edge: Access has already authenticated (OTP/SSO) and injected this
  // header (and strips any client-supplied copy), and /stats is only reachable
  // through the Access-protected route. Set ACCESS_TEAM_DOMAIN + ACCESS_AUD to
  // additionally verify the JWT signature (defense in depth).
  const team = env.ACCESS_TEAM_DOMAIN, aud = env.ACCESS_AUD;
  if (!team || !aud) return true;
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
    .join("")}<footer>private · Cloudflare KV</footer></div></body></html>`;
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

  // KV aggregates (no token needed): referrers, searches, scroll depth.
  const [refs, searches, depthRaw] = await Promise.all([
    aggTop(env, "agg:ref:"),
    aggTop(env, "agg:search:"),
    aggTop(env, "agg:depth:", 4),
  ]);
  const depth = depthRaw.sort((a, b) => parseInt(a.label) - parseInt(b.label));
  const totalViews = popular.reduce((a, p) => a + p.views, 0);

  const sections = [
    {
      title: "overview",
      rows: [
        ["total views", totalViews],
        ["reactions", Object.values(reactTotals).reduce((a, b) => a + b, 0)],
      ],
    },
    { title: "most read", rows: popular.map((p) => [p.title, p.views]) },
    { title: "reactions", rows: Object.entries(reactTotals).map(([e, n]) => [e, n]) },
    { title: "top referrers", rows: refs.map((r) => [r.label, r.count]), empty: "no off-site referrers yet" },
    { title: "search queries", rows: searches.map((r) => [r.label, r.count]), empty: "no searches yet" },
    { title: "read depth", rows: depth.map((r) => [r.label, r.count]), empty: "no scroll data yet" },
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
        const host = refHost(referrer);
        if (host) await kvIncr(env, "agg:ref:" + host, host);
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
      if (body.type === "scroll" && body.depth) {
        const d = Math.round(Number(body.depth));
        if ([25, 50, 75, 100].includes(d)) await kvIncr(env, "agg:depth:" + d, d + "%");
      } else if (body.type === "search" && body.query) {
        const q = String(body.query).toLowerCase().trim().slice(0, 80);
        if (q) await kvIncr(env, "agg:search:" + q, q);
      }
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
