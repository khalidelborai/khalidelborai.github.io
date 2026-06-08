// Initialise the Pagefind search UI once the DOM is ready, and (if the
// engagement Worker is configured) log search queries to Analytics Engine so we
// can see what readers look for. External script to satisfy script-src 'self'.
window.addEventListener("DOMContentLoaded", function () {
  if (typeof PagefindUI === "undefined") return;
  var el = document.querySelector("#search");
  new PagefindUI({
    element: "#search",
    showSubResults: true,
    showImages: false,
    resetStyles: false,
  });

  var api = el && el.dataset.engagementApi;
  if (!api) return;
  // Debounce so we log the settled query, not every keystroke.
  var timer, last = "";
  document.addEventListener("input", function (e) {
    var input = e.target.closest(".pagefind-ui__search-input");
    if (!input) return;
    clearTimeout(timer);
    timer = setTimeout(function () {
      var q = input.value.trim();
      if (q.length < 3 || q === last) return;
      last = q;
      fetch(api + "/event", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "search", query: q }),
      }).catch(function () {});
    }, 1200);
  });
});
