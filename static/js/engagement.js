// View counts + emoji reactions, backed by a same-origin Cloudflare Worker
// (config.extra.engagement.api → e.g. "/api"). External file, same-origin
// fetches, so it needs no CSP changes. Degrades silently if the Worker is down.
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

  // --- Views: increment once per session, then just read ---
  document.querySelectorAll('[data-engagement="views"]').forEach(function (el) {
    var api = el.dataset.api, path = el.dataset.path, key = "viewed:" + path;
    var req = sessionStorage.getItem(key)
      ? get(api + "/views?path=" + encodeURIComponent(path))
      : post(api + "/views", { path: path });
    req.then(function (d) {
      if (!d || typeof d.views !== "number") return;
      sessionStorage.setItem(key, "1");
      el.textContent = d.views.toLocaleString() + (d.views === 1 ? " view" : " views");
    });
  });

  // --- Reactions ---
  document.querySelectorAll('[data-engagement="reactions"]').forEach(function (box) {
    var api = box.dataset.api, path = box.dataset.path;
    function render(counts) {
      box.querySelectorAll("button[data-emoji]").forEach(function (b) {
        b.querySelector(".count").textContent = (counts && counts[b.dataset.emoji]) || 0;
      });
    }
    get(api + "/reactions?path=" + encodeURIComponent(path)).then(function (d) {
      render(d && d.counts);
    });
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
})();
