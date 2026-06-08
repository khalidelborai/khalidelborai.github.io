// Bootstraps Mermaid on pages that contain a {% mermaid() %} diagram.
//
// Emitted (deduped) by the mermaid shortcode, but only when the page sets
// `extra.mermaid = true` — that same flag relaxes the CSP for Mermaid's inline
// SVG styles. Kept as an external file so it satisfies `script-src 'self'`
// (the site allows no inline JS in production).
(function () {
  if (window.__mermaidBootstrapped) return;
  window.__mermaidBootstrapped = true;

  var lib = document.createElement("script");
  lib.src = "/js/mermaid.min.js";
  lib.onload = function () {
    var scheme = document.body.getAttribute("data-theme") || "terminus";
    var light = scheme === "solar-flare" || scheme === "catppuccin-latte";
    window.mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: light ? "default" : "dark",
      fontFamily: "inherit",
    });
    window.mermaid.run({ querySelector: ".mermaid" });
  };
  document.head.appendChild(lib);
})();
