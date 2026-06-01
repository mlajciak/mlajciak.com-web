(function () {
  var hero = document.querySelector(".xyzt-hero[data-md]");
  if (!hero) {
    return;
  }

  var intro = hero.querySelector(".xyzt-hero__intro");
  var el = hero.querySelector(".xyzt-typewriter");
  var revealEl = hero.querySelector(".xyzt-project-reveal");
  var contentEl = hero.querySelector(".xyzt-project-content");
  var mdUrl = hero.getAttribute("data-md");
  if (!intro || !el || !revealEl || !contentEl || !mdUrl) {
    return;
  }

  var revealed = false;
  var pauseBeforeReveal = 160;
  var titleDuration = 780;
  var contentDuration = 820;
  var contentOverlap = 0.42;
  var ease = "cubic-bezier(0.16, 1, 0.3, 1)";
  var mdPromise = fetch(mdUrl)
    .then(function (res) {
      if (!res.ok) {
        throw new Error("not found");
      }
      return res.text();
    })
    .catch(function () {
      return null;
    });

  function renderMarkdown(md) {
    if (!md) {
      contentEl.innerHTML = "<p>Could not load content.</p>";
      return;
    }
    if (window.marked) {
      contentEl.innerHTML = marked.parse(md, { gfm: true, breaks: false });
      return;
    }
    contentEl.textContent = md;
  }

  function onTransitionEnd(node, property, ms, cb) {
    var done = false;
    function finish() {
      if (done) {
        return;
      }
      done = true;
      node.removeEventListener("transitionend", onEnd);
      clearTimeout(fallback);
      cb();
    }
    function onEnd(event) {
      if (event.target !== node || event.propertyName !== property) {
        return;
      }
      finish();
    }
    var fallback = setTimeout(finish, ms + 80);
    node.addEventListener("transitionend", onEnd);
  }

  function slideTitleUp(done) {
    var first = intro.getBoundingClientRect();
    hero.classList.add("is-revealed");
    var last = intro.getBoundingClientRect();
    var deltaY = first.top - last.top;

    if (Math.abs(deltaY) < 1) {
      done();
      return;
    }

    intro.style.transition = "none";
    intro.style.transform = "translate3d(0, " + deltaY + "px, 0)";

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        intro.style.transition =
          "transform " + titleDuration + "ms " + ease;
        intro.style.transform = "translate3d(0, 0, 0)";
        onTransitionEnd(intro, "transform", titleDuration, function () {
          intro.style.transition = "";
          intro.style.transform = "";
          done();
        });
      });
    });
  }

  function rollInContent(md) {
    renderMarkdown(md);
    revealEl.style.visibility = "hidden";
    revealEl.style.height = "auto";
    var target = revealEl.offsetHeight;
    revealEl.style.height = "0";
    revealEl.style.visibility = "visible";
    revealEl.style.overflow = "hidden";

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        revealEl.classList.add("is-visible");
        revealEl.style.transition = "height " + contentDuration + "ms " + ease;
        revealEl.style.height = target + "px";
        onTransitionEnd(revealEl, "height", contentDuration, function () {
          revealEl.style.height = "";
          revealEl.style.transition = "";
          revealEl.style.overflow = "";
        });
      });
    });
  }

  function reveal() {
    if (revealed) {
      return;
    }
    revealed = true;
    hero.classList.add("is-typing-done");

    mdPromise.then(function (md) {
      setTimeout(function () {
        slideTitleUp(function () {});
        setTimeout(function () {
          rollInContent(md);
        }, Math.round(titleDuration * contentOverlap));
      }, pauseBeforeReveal);
    });
  }

  function startTypewriter() {
    if (!window.runXyztTypewriter) {
      reveal();
      return;
    }

    runXyztTypewriter(el, {
      onComplete: reveal,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startTypewriter);
  } else {
    startTypewriter();
  }
})();
