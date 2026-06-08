// Copy-to-clipboard for the post "copy link" button. External (CSP 'self').
document.addEventListener("click", function (e) {
  var btn = e.target.closest(".share__copy");
  if (!btn) return;
  var url = btn.getAttribute("data-copy");
  navigator.clipboard.writeText(url).then(function () {
    var prev = btn.textContent;
    btn.textContent = "copied!";
    setTimeout(function () { btn.textContent = prev; }, 1500);
  });
});
