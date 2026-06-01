(function (global) {
  function delayFor(char, index) {
    var wobble = ((index * 13) % 7) - 3;
    if (char === "." || char === "!" || char === "?") {
      return 210 + wobble;
    }
    if (char === "," || char === ";" || char === ":") {
      return 115 + wobble;
    }
    if (char === " ") {
      return 34 + wobble;
    }
    return 32 + wobble;
  }

  function buildSchedule(text) {
    var schedule = [];
    var elapsed = 0;
    for (var i = 0; i < text.length; i++) {
      elapsed += delayFor(text.charAt(i), i);
      schedule.push(elapsed);
    }
    return schedule;
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function attachCursor(el) {
    var cursor = el.nextElementSibling;
    if (cursor && cursor.classList.contains("xyzt-typewriter-cursor")) {
      el.appendChild(cursor);
      return cursor;
    }
    cursor = el.querySelector(".xyzt-typewriter-cursor");
    return cursor || null;
  }

  function runXyztTypewriter(el, options) {
    options = options || {};
    var onComplete = options.onComplete || function () {};
    var text = el.getAttribute("data-text") || "";
    var schedule = buildSchedule(text);
    var visible = 0;
    var startTime = null;
    var rafId = null;
    var done = false;
    var cursor = attachCursor(el);

    el.textContent = "";
    el.setAttribute("aria-label", text);
    if (cursor) {
      el.appendChild(cursor);
    }

    function appendChar(index) {
      var char = text.charAt(index);
      var span = document.createElement("span");
      span.className = "xyzt-char";
      if (char === " ") {
        span.classList.add("xyzt-char--space");
        span.textContent = "\u00a0";
      } else {
        span.textContent = char;
      }
      span.setAttribute("aria-hidden", "true");

      if (cursor) {
        el.insertBefore(span, cursor);
      } else {
        el.appendChild(span);
      }

      requestAnimationFrame(function () {
        span.classList.add("is-visible");
      });
    }

    function showThrough(count) {
      while (visible < count && visible < text.length) {
        appendChar(visible);
        visible += 1;
      }
    }

    function finish() {
      if (done) {
        return;
      }
      done = true;
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      showThrough(text.length);
      onComplete();
    }

    if (prefersReducedMotion() || !text.length) {
      finish();
      return { cancel: function () {} };
    }

    function tick(now) {
      if (done) {
        return;
      }
      if (startTime === null) {
        startTime = now;
      }

      var elapsed = now - startTime;
      var target = 0;
      while (target < schedule.length && elapsed >= schedule[target]) {
        target += 1;
      }

      showThrough(target);

      if (target >= text.length) {
        finish();
        return;
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);

    return {
      cancel: function () {
        done = true;
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
      },
    };
  }

  global.runXyztTypewriter = runXyztTypewriter;
})(window);
