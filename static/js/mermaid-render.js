// Bootstraps Mermaid on pages that contain a {% mermaid() %} diagram.
//
// Emitted (deduped) by the mermaid shortcode, but only when the page sets
// `extra.mermaid = true` — that same flag relaxes the CSP for Mermaid's inline
// SVG styles. Kept as an external file so it satisfies `script-src 'self'`
// (the site allows no inline JS in production).
//
// Styled to the active Terminus color scheme: instead of Mermaid's stock
// "dark"/"default" themes, we read the site's own CSS custom properties
// (--background-color, --text-color, --accent-color, …) and feed them into
// Mermaid's `base` theme, so a diagram matches whatever scheme the switcher
// is on (terminus amber, tokyo-night blue, gruvbox orange, …).
(function () {
  if (window.__mermaidBootstrapped) return;
  window.__mermaidBootstrapped = true;

  function cssVar(name, fallback) {
    var v = getComputedStyle(document.body).getPropertyValue(name).trim();
    return v || fallback;
  }

  var lib = document.createElement("script");
  lib.src = "/js/mermaid.min.js";
  lib.onload = function () {
    var scheme = document.body.getAttribute("data-theme") || "terminus";
    var light = scheme === "solar-flare" || scheme === "catppuccin-latte";

    var bg = cssVar("--background-color", light ? "#ffffff" : "#211f1a");
    var text = cssVar("--text-color", light ? "#222222" : "whitesmoke");
    var accent = cssVar("--accent-color", "rgb(255, 168, 106)");
    var dim = cssVar("--footnote-color", light ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)");
    var border = cssVar("--code-border", accent);
    var font = cssVar("--mermaid-font-family", "ui-monospace, SFMono-Regular, Menlo, monospace");

    window.mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "base",
      fontFamily: font,
      flowchart: { curve: "basis", htmlLabels: true, padding: 12 },
      themeVariables: {
        darkMode: !light,
        background: bg,
        // nodes blend into the page and read as outlined terminal boxes
        mainBkg: bg,
        primaryColor: bg,
        primaryBorderColor: accent,
        primaryTextColor: text,
        secondaryColor: bg,
        secondaryBorderColor: border,
        secondaryTextColor: text,
        tertiaryColor: bg,
        tertiaryBorderColor: border,
        tertiaryTextColor: text,
        // edges + their labels
        lineColor: accent,
        edgeLabelBackground: bg,
        textColor: text,
        nodeBorder: accent,
        nodeTextColor: text,
        clusterBkg: bg,
        clusterBorder: border,
        titleColor: dim,
        fontFamily: font,
        fontSize: "14px",
      },
    });
    window.mermaid.run({ querySelector: ".mermaid" });
  };
  document.head.appendChild(lib);
})();
