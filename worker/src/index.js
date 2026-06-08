// Engagement Worker: page views + emoji reactions, stored in Cloudflare KV.
// Deployed behind a same-origin route (blog.borai.dev/api/*), so the site's
// frontend fetches "/api/..." with no CORS or CSP cross-origin concerns.
//
// Endpoints (the "/api" prefix is stripped by the route):
//   POST /api/views      {path}          -> { views }   (increment)
//   GET  /api/views?path=...             -> { views }   (read)
//   GET  /api/reactions?path=...         -> { counts }
//   POST /api/react      {path, emoji}   -> { counts }

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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const route = url.pathname.replace(/^\/api/, "");

    if (route === "/views") {
      if (request.method === "POST") {
        const { path } = await request.json().catch(() => ({}));
        if (!path) return json({ error: "path required" }, 400);
        const views = (await readViews(env, path)) + 1;
        await env.ENGAGEMENT.put("views:" + path, String(views));
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

    return json({ error: "not found" }, 404);
  },
};
