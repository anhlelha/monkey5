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

  /* ---- radar chart inside the dashboard preview ---- */
  var radarSvg = document.getElementById("radarSvg");
  if (radarSvg) {
    var AXES = [
      { label: "Số học" },
      { label: "Đại số" },
      { label: "Hình" },
      { label: "Đếm & Logic" },
      { label: "Chuyển động" },
      { label: "Tỉ lệ" },
      { label: "Phân số" },
    ];
    var baseline = [0.38, 0.30, 0.42, 0.34, 0.28, 0.40, 0.46];
    var current  = [0.78, 0.66, 0.82, 0.70, 0.62, 0.74, 0.86];
    var cx = 120, cy = 92, R = 70;
    var N = AXES.length;
    var SVG_NS = "http://www.w3.org/2000/svg";

    function ptFor(i, value) {
      var angle = (Math.PI * 2 * i) / N - Math.PI / 2;
      var r = R * value;
      return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
    }
    function pointsAttr(values) {
      return values.map(function (v, i) {
        var p = ptFor(i, v);
        return p[0].toFixed(1) + "," + p[1].toFixed(1);
      }).join(" ");
    }
    function el(tag, attrs) {
      var node = document.createElementNS(SVG_NS, tag);
      Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
      return node;
    }

    // grid rings (4 levels)
    [0.25, 0.5, 0.75, 1].forEach(function (lv) {
      var pts = AXES.map(function (_, i) {
        var p = ptFor(i, lv);
        return p[0].toFixed(1) + "," + p[1].toFixed(1);
      }).join(" ");
      radarSvg.appendChild(el("polygon", {
        points: pts,
        fill: "none",
        stroke: "var(--border-soft)",
        "stroke-width": lv === 1 ? "1.2" : "1",
        opacity: lv === 1 ? "0.9" : "0.6",
      }));
    });
    // axis lines
    AXES.forEach(function (_, i) {
      var p = ptFor(i, 1);
      radarSvg.appendChild(el("line", {
        x1: cx, y1: cy,
        x2: p[0].toFixed(1), y2: p[1].toFixed(1),
        stroke: "var(--border-soft)",
        "stroke-width": "1",
        opacity: "0.5",
      }));
    });
    // axis labels
    AXES.forEach(function (ax, i) {
      var p = ptFor(i, 1.18);
      var anchor = "middle";
      if (p[0] < cx - 4) anchor = "end";
      else if (p[0] > cx + 4) anchor = "start";
      var lbl = el("text", {
        x: p[0].toFixed(1),
        y: p[1].toFixed(1),
        "text-anchor": anchor,
        "dominant-baseline": "middle",
        "font-size": "9.5",
        "font-weight": "600",
        fill: "var(--ink-muted)",
      });
      lbl.textContent = ax.label;
      radarSvg.appendChild(lbl);
    });
    // baseline polygon (static, dashed)
    var basePoly = el("polygon", {
      points: pointsAttr(baseline),
      fill: "none",
      stroke: "var(--ink-faint)",
      "stroke-width": "1.6",
      "stroke-dasharray": "4 4",
      class: "radar-poly base",
    });
    radarSvg.appendChild(basePoly);
    // current polygon (animated)
    var curPoly = el("polygon", {
      points: pointsAttr(baseline.map(function (v) { return v; })),
      fill: "var(--accent)",
      "fill-opacity": "0.18",
      stroke: "var(--accent)",
      "stroke-width": "2.2",
      "stroke-linejoin": "round",
      class: "radar-poly cur",
    });
    radarSvg.appendChild(curPoly);
    // vertex dots on current polygon
    var dots = [];
    current.forEach(function (_, i) {
      var d = el("circle", {
        r: "2.6",
        fill: "var(--accent)",
        stroke: "var(--surface)",
        "stroke-width": "1.5",
      });
      radarSvg.appendChild(d);
      dots.push(d);
    });

    function setRadarValues(values) {
      curPoly.setAttribute("points", pointsAttr(values));
      dots.forEach(function (d, i) {
        var p = ptFor(i, values[i]);
        d.setAttribute("cx", p[0].toFixed(1));
        d.setAttribute("cy", p[1].toFixed(1));
      });
    }

    function animateRadar(from, to, dur) {
      if (reduce) { setRadarValues(to); return; }
      var t0 = null;
      function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var values = from.map(function (v, i) { return v + (to[i] - v) * eased; });
        setRadarValues(values);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    // initial state: baseline; then climb to "current" once.
    setRadarValues(baseline);
    setTimeout(function () { animateRadar(baseline, current, 1600); }, 900);
    // gently breathe so the hero stays alive (small contraction + re-expand)
    if (!reduce) {
      setInterval(function () {
        var dip = current.map(function (v) { return v * 0.86; });
        animateRadar(current, dip, 900);
        setTimeout(function () { animateRadar(dip, current, 1100); }, 950);
      }, 6000);
    }
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
