/* Shared page behaviour: reveal-on-scroll, nav scroll-spy, footer year,
   and the subtle projectile-arc doodle behind the hero. */
(function () {
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  // Reveal sections as they enter the viewport.
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.fade').forEach(function (el) { io.observe(el); });

  // Scroll-spy: highlight the section currently in view in the header nav.
  var links = Array.prototype.slice.call(document.querySelectorAll('.site-nav a[href^="#"]'));
  if (links.length) {
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && map[e.target.id]) {
          links.forEach(function (a) { a.classList.remove('active'); });
          map[e.target.id].classList.add('active');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    document.querySelectorAll('section[id]').forEach(function (s) { spy.observe(s); });
  }

  // Hero doodle: faint projectile arcs traced across the banner.
  var canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var arcs = [];

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function size() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = canvas.parentElement.getBoundingClientRect();
    canvas.width = r.width * dpr;
    canvas.height = r.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: r.width, h: r.height };
  }

  function makeArc(w, h) {
    var x0 = Math.random() * w * 0.5;
    var range = w * (0.35 + Math.random() * 0.45);
    var peak = h * (0.25 + Math.random() * 0.45);
    return { x0: x0, range: range, peak: peak, t: 0, speed: 0.004 + Math.random() * 0.004 };
  }

  var dims = size();
  for (var i = 0; i < 3; i++) {
    var a = makeArc(dims.w, dims.h);
    a.t = Math.random(); // stagger
    arcs.push(a);
  }

  function draw() {
    var w = dims.w, h = dims.h;
    ctx.clearRect(0, 0, w, h);
    var accent = cssVar('--accent') || '#14676b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([1, 7]);
    ctx.lineCap = 'round';
    arcs.forEach(function (a) {
      var end = reduced ? 1 : Math.min(a.t, 1);
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.28;
      ctx.beginPath();
      var steps = Math.max(2, Math.floor(60 * end));
      for (var s = 0; s <= steps; s++) {
        var f = (s / 60);
        var x = a.x0 + a.range * f;
        var y = h - 8 - 4 * a.peak * f * (1 - f); // parabola, peak at f = .5
        if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      if (!reduced && end < 1) {
        var f2 = end, bx = a.x0 + a.range * f2, by = h - 8 - 4 * a.peak * f2 * (1 - f2);
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(bx, by, 3, 0, Math.PI * 2);
        ctx.fillStyle = accent;
        ctx.fill();
        ctx.setLineDash([1, 7]);
      }
      ctx.globalAlpha = 1;
      if (!reduced) {
        a.t += a.speed;
        if (a.t > 1.6) { // pause, then relaunch from a new spot
          var next = makeArc(w, h);
          a.x0 = next.x0; a.range = next.range; a.peak = next.peak;
          a.speed = next.speed; a.t = 0;
        }
      }
    });
    if (!reduced) requestAnimationFrame(draw);
  }

  window.addEventListener('resize', function () { dims = size(); if (reduced) draw(); });
  window.addEventListener('themechange', function () { if (reduced) draw(); });
  draw();
})();
