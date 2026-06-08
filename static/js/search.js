// Initialise the Pagefind search UI once the DOM is ready.
// Loaded as an external script (not inline) to satisfy the site's
// `script-src 'self'` Content-Security-Policy.
window.addEventListener("DOMContentLoaded", function () {
  if (typeof PagefindUI === "undefined") return;
  new PagefindUI({
    element: "#search",
    showSubResults: true,
    showImages: false,
    resetStyles: false,
  });
});
