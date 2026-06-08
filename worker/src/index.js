// Engagement Worker: page views, emoji reactions, popular-posts ranking, and
// event logging (referrers, scroll depth, search queries) into Workers
// Analytics Engine. Served behind a same-origin route (blog.borai.dev/api/*).
//
//   POST /api/views      {path, title, referrer}  -> { views }   (increment)
//   GET  /api/views?path=...                       -> { views }   (read)
//   GET  /api/reactions?path=...                   -> { counts }
//   POST /api/react      {path, emoji}             -> { counts }
//   POST /api/event      {type, path, referrer?, query?, depth?} -> { ok }
//   GET  /api/top?n=5                              -> { top: [{path,title,views}] }

const ALLOWED = ["👍", "🦀", "🔥", "❤️"];

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

// Fire-and-forget event into Analytics Engine (queryable via the Cloudflare API).
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const route = url.pathname.replace(/^\/api/, "");

    if (route === "/views") {
      if (request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        const { path, title, referrer } = body;
        if (!path) return json({ error: "path required" }, 400);
        const views = (await readViews(env, path)) + 1;
        // count + title in metadata so /top is one list() call (no per-key GETs).
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
