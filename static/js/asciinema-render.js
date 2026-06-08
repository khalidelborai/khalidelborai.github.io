// Bootstraps asciinema-player on pages that embed a {% asciinema() %} cast.
//
// Emitted (deduped) by the asciinema shortcode, only when the page sets
// `extra.asciinema = true` — the same flag relaxes the CSP for the player's
// inline styles + blob worker. External file so it satisfies `script-src 'self'`.
(function () {
  if (window.__asciinemaBootstrapped) return;
  window.__asciinemaBootstrapped = true;

  var css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "/css/asciinema-player.css";
  document.head.appendChild(css);

  var lib = document.createElement("script");
  lib.src = "/js/asciinema-player.min.js";
  lib.onload = function () {
    document.querySelectorAll(".asciinema-cast[data-cast]").forEach(function (el) {
      var d = el.dataset;
      var opts = {
        fit: "width",
        autoPlay: d.autoplay === "true",
        loop: d.loop === "true",
        idleTimeLimit: d.idle ? parseFloat(d.idle) : 2,
      };
      if (d.speed) opts.speed = parseFloat(d.speed);
      if (d.poster) opts.poster = d.poster;
      if (d.theme) opts.theme = d.theme;
      if (d.cols) opts.cols = parseInt(d.cols, 10);
      if (d.rows) opts.rows = parseInt(d.rows, 10);
      window.AsciinemaPlayer.create(d.cast, el, opts);
    });
  };
  document.head.appendChild(lib);
})();
