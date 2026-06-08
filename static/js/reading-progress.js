// Thin scroll-progress bar at the top of posts. External (CSP 'self').
(function () {
  var bar = document.createElement("div");
  bar.className = "reading-progress";
  bar.setAttribute("role", "presentation");
  document.body.appendChild(bar);
  function update() {
    var el = document.documentElement;
    var max = el.scrollHeight - el.clientHeight;
    bar.style.width = (max > 0 ? (el.scrollTop / max) * 100 : 0) + "%";
  }
  document.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update, { passive: true });
  update();
})();
