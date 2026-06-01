(function () {
  var el = document.getElementById("about-content");
  if (!el) return;

  fetch("/about/about.md")
    .then(function (res) {
      if (!res.ok) throw new Error("not found");
      return res.text();
    })
    .then(function (md) {
      el.innerHTML = marked.parse(md, { gfm: true, breaks: false });
    })
    .catch(function () {
      el.innerHTML = "<p>Could not load about.</p>";
    });
})();
