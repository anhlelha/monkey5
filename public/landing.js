/* =========================================================
   Landing — interactions & hero animation
   ========================================================= */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- nav shadow on scroll ---- */
  var nav = document.getElementById("nav");
  function onScroll() {
    if (!nav) return;
    if (window.scrollY > 8) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- reveal on scroll ---- */
  var reveals = document.querySelectorAll(".reveal");
  function showAll() { reveals.forEach(function (el) { el.classList.add("show"); }); }
  if (reduce || !("IntersectionObserver" in window)) {
    showAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("show"); io.unobserve(e.target); }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
    // safety net: never leave content hidden if scroll never happens
    setTimeout(showAll, 4000);
  }

  /* ---- count-up stats (run once when in view) ---- */
  function animateCount(el) {
    if (el.dataset.text) return;
    var target = parseInt(el.dataset.count, 10);
    var suffix = el.dataset.suffix || "";
    if (reduce) { el.textContent = format(target) + suffix; return; }
    var dur = 1400, t0 = null;
    function fmtStep(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(Math.round(target * eased)) + suffix;
      if (p < 1) requestAnimationFrame(fmtStep);
    }
    requestAnimationFrame(fmtStep);
  }
  function format(n) { return n >= 1000 ? n.toLocaleString("vi-VN") : String(n); }

  var statsWrap = document.getElementById("stats");
  if (statsWrap) {
    var cells = statsWrap.querySelectorAll(".v");
    var counted = false;
    function runCounts() { if (counted) return; counted = true; cells.forEach(animateCount); }
    if (reduce || !("IntersectionObserver" in window)) {
      runCounts();
    } else {
      var sio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { runCounts(); sio.disconnect(); }
        });
      }, { threshold: 0.4 });
      sio.observe(statsWrap);
      setTimeout(runCounts, 4200); // safety net
    }
  }

  /* ---- hero animated preview ---- */
  var rows = Array.prototype.slice.call(document.querySelectorAll("#readyList .ready-row"));
  var flSpark = document.getElementById("fl-spark");
  var flBadges = document.getElementById("fl-badges");
  var flTutor = document.getElementById("fl-tutor");

  function easeCount(node, from, to, dur) {
    var t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      node.textContent = Math.round(from + (to - from) * eased) + "%";
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // fromZero=true for the first dramatic fill; otherwise gently climb from a baseline
  function fillBars(fromZero) {
    rows.forEach(function (row, i) {
      var target = parseInt(row.getAttribute("data-target"), 10);
      var start = fromZero ? 0 : Math.round(target * 0.5);
      var bar = row.querySelector(".meter i");
      var pct = row.querySelector(".pct");
      if (!bar || !pct) return;
      // snap to start without transition
      bar.style.transition = "none";
      bar.style.width = start + "%";
      void bar.offsetWidth;
      bar.style.transition = "";
      var delay = 200 + i * 170;
      setTimeout(function () {
        row.classList.add("in");           // badge pops once, then stays
        bar.style.width = target + "%";     // CSS transition animates the climb
        easeCount(pct, start, target, 1300);
      }, delay);
    });
  }

  if (reduce) {
    // static end-state
    [flSpark, flBadges, flTutor].forEach(function (el) { if (el) el.style.opacity = 1; });
    rows.forEach(function (row) {
      var target = parseInt(row.getAttribute("data-target"), 10);
      row.classList.add("in");
      var bar = row.querySelector(".meter i");
      var pct = row.querySelector(".pct");
      if (bar) { bar.style.transition = "none"; bar.style.width = target + "%"; }
      if (pct) pct.textContent = target + "%";
    });
    if (flBadges) flBadges.querySelectorAll(".b").forEach(function (b) { b.style.opacity = 1; b.style.transform = "none"; });
  } else if (rows.length) {
    // entrance sequence
    setTimeout(function () { if (flSpark) flSpark.classList.add("in"); }, 250);
    setTimeout(function () {
      if (flBadges) {
        flBadges.classList.add("in");
        flBadges.querySelectorAll(".b").forEach(function (b) {
          b.style.animationDelay = (b.style.getPropertyValue("--d") || "0ms");
        });
      }
    }, 500);
    setTimeout(function () { if (flTutor) flTutor.classList.add("in"); }, 1500);

    fillBars(true);

    // gently re-climb every few seconds so the hero stays alive (no empty flicker)
    setInterval(function () { fillBars(false); }, 6000);
  }

  /* NOTE: data-plan CTA clicks are handled by the React <TryButton> component.
     Original landing.js had a vanilla handler that redirected to a demo HTML file —
     removed during Next.js integration. */
})();

/* =========================================================
   Theme — apply default from window.TWEAKS (set by inline script)
   ========================================================= */
(function () {
  "use strict";
  var defaults = (window.TWEAKS && typeof window.TWEAKS === "object") ? window.TWEAKS : { theme: "clay" };
  var theme = defaults.theme || "clay";
  if (theme && theme !== "clay") document.documentElement.setAttribute("data-theme", theme);
})();
