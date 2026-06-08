// Views, reactions, scroll-depth + referrer logging, and the popular-posts
// widget — all backed by the same-origin engagement Worker (config
// [extra.engagement] api). Same-origin fetches, so no CSP changes. Degrades
// silently if the Worker is unreachable.
(function () {
  function get(url) {
    return fetch(url).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }
  function post(url, body) {
    return fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }

  // --- Views (posts): count once per session, log title + referrer, then read ---
  var viewsEl = document.querySelector('[data-engagement="views"]');
  if (viewsEl) {
    var api = viewsEl.dataset.api, path = viewsEl.dataset.path, key = "viewed:" + path;
    var title = (document.title.split("|")[0] || "").trim();
    var req = sessionStorage.getItem(key)
      ? get(api + "/views?path=" + encodeURIComponent(path))
      : post(api + "/views", { path: path, title: title, referrer: document.referrer });
    req.then(function (d) {
      if (!d || typeof d.views !== "number") return;
      sessionStorage.setItem(key, "1");
      viewsEl.textContent = d.views.toLocaleString() + (d.views === 1 ? " view" : " views");
    });

    // Scroll depth -> Analytics Engine (each threshold once per pageview).
    var fired = {};
    document.addEventListener("scroll", function () {
      var el = document.documentElement, max = el.scrollHeight - el.clientHeight;
      var pct = max > 0 ? Math.round((el.scrollTop / max) * 100) : 100;
      [25, 50, 75, 100].forEach(function (t) {
        if (pct >= t && !fired[t]) {
          fired[t] = true;
          post(api + "/event", { type: "scroll", path: path, depth: t });
        }
      });
    }, { passive: true });
  }

  // --- Reactions (posts) ---
  document.querySelectorAll('[data-engagement="reactions"]').forEach(function (box) {
    var api = box.dataset.api, path = box.dataset.path;
    function render(counts) {
      box.querySelectorAll("button[data-emoji]").forEach(function (b) {
        b.querySelector(".count").textContent = (counts && counts[b.dataset.emoji]) || 0;
      });
    }
    get(api + "/reactions?path=" + encodeURIComponent(path)).then(function (d) { render(d && d.counts); });
    box.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-emoji]");
      if (!b || b.disabled) return;
      b.disabled = true;
      b.classList.add("reacted");
      post(api + "/react", { path: path, emoji: b.dataset.emoji }).then(function (d) {
        render(d && d.counts);
        setTimeout(function () { b.disabled = false; }, 500);
      });
    });
  });

  // --- Popular posts (home) ---
  document.querySelectorAll('[data-engagement="popular"]').forEach(function (box) {
    get(box.dataset.api + "/top?n=5").then(function (d) {
      if (!d || !d.top || !d.top.length) { box.remove(); return; }
      var ol = document.createElement("ol");
      d.top.forEach(function (it) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = it.path; a.textContent = it.title;
        var s = document.createElement("span");
        s.className = "popular__views";
        s.textContent = it.views.toLocaleString() + (it.views === 1 ? " view" : " views");
        li.appendChild(a); li.appendChild(s); ol.appendChild(li);
      });
      box.appendChild(ol);
    });
  });
})();
