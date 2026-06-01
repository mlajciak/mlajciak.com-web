(function () {
  var el = document.querySelector(".xyzt-typewriter");
  if (!el || !window.runXyztTypewriter) {
    return;
  }

  function start() {
    runXyztTypewriter(el);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
