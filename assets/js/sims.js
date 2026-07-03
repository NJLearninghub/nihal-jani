/* Interactive physics lab: projectile motion, simple pendulum, wave superposition.
   Vanilla canvas, theme-aware (re-reads CSS variables on `themechange`),
   DPR-crisp, paused while off-screen, and respectful of reduced motion. */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function palette() {
    var s = getComputedStyle(document.documentElement);
    function v(name, fallback) { return (s.getPropertyValue(name) || fallback).trim(); }
    return {
      ink: v('--ink', '#1c211f'),
      soft: v('--soft', '#545e59'),
      faint: v('--faint', '#8a938e'),
      rule: v('--rule', '#e3e2d8'),
      surface: v('--surface', '#fdfdf9'),
      accent: v('--accent', '#14676b'),
      s1: v('--series-1', '#2a78d6'),
      s2: v('--series-2', '#1baf7a'),
      s3: v('--series-3', '#eb6834'),
      s4: v('--series-4', '#e34948')
    };
  }
  var P = palette();
  window.addEventListener('themechange', function () { P = palette(); });

  /* A "nice" tick step giving roughly `n` divisions of `span`. */
  function niceStep(span, n) {
    var raw = span / Math.max(n, 1);
    var mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var norm = raw / mag;
    var step = norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1;
    return step * mag;
  }

  /* Shared canvas harness: sizing, visibility-based pausing, RAF loop. */
  function harness(canvas, cssHeight, drawFrame) {
    var ctx = canvas.getContext('2d');
    var running = false, visible = true, rafId = null, last = 0;

    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = canvas.parentElement.getBoundingClientRect().width;
      canvas.style.height = cssHeight + 'px';
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(cssHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();

    function loop(now) {
      rafId = null;
      var dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      drawFrame(ctx, canvas.width / (Math.min(window.devicePixelRatio || 1, 2)), cssHeight, dt);
      if (running && visible) rafId = requestAnimationFrame(loop);
    }
    function kick() {
      if (rafId === null && visible) { last = 0; rafId = requestAnimationFrame(loop); }
    }

    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        visible = e.isIntersecting;
        if (visible) kick();
      });
    }, { threshold: 0.05 }).observe(canvas);

    window.addEventListener('resize', function () { size(); kick(); });
    window.addEventListener('themechange', kick);

    return {
      ctx: ctx,
      width: function () { return canvas.getBoundingClientRect().width; },
      start: function () { running = true; kick(); },
      stop: function () { running = false; kick(); }, // one repaint, then idle
      repaint: kick
    };
  }

  function fmt(x, digits) {
    return Number(x).toFixed(digits === undefined ? 1 : digits);
  }

  /* ======================================================================
     1. PROJECTILE MOTION
     ====================================================================== */
  (function projectile() {
    var canvas = document.getElementById('sim-projectile');
    if (!canvas) return;
    var H = 380, PAD = { l: 52, r: 20, t: 24, b: 40 };

    var elAngle = document.getElementById('pj-angle');
    var elSpeed = document.getElementById('pj-speed');
    var elG = document.getElementById('pj-gravity');
    var outAngle = document.getElementById('pj-angle-out');
    var outSpeed = document.getElementById('pj-speed-out');
    var btnLaunch = document.getElementById('pj-launch');
    var btnReset = document.getElementById('pj-reset');
    var roRange = document.getElementById('pj-range');
    var roHeight = document.getElementById('pj-height');
    var roTime = document.getElementById('pj-time');
    var tip = document.getElementById('pj-tip');

    var state = { t: 0, flying: false, trace: [] };
    var hover = null; // {x, y} in CSS px

    function params() {
      var th = (+elAngle.value) * Math.PI / 180;
      var v = +elSpeed.value;
      var g = +elG.value;
      return {
        th: th, v: v, g: g,
        vx: v * Math.cos(th), vy: v * Math.sin(th),
        T: 2 * v * Math.sin(th) / g,
        R: v * v * Math.sin(2 * th) / g,
        Hm: (v * Math.sin(th)) * (v * Math.sin(th)) / (2 * g)
      };
    }

    function updateReadouts(p) {
      outAngle.value = elAngle.value + '°';
      outSpeed.value = elSpeed.value + ' m/s';
      roRange.firstChild.nodeValue = fmt(p.R);
      roHeight.firstChild.nodeValue = fmt(p.Hm);
      roTime.firstChild.nodeValue = fmt(p.T, 2);
    }

    function frame(ctx, w, h) {
      var p = params();
      var xMax = Math.max(p.R * 1.06, 10);
      var yMax = Math.max(p.Hm * 1.35, 5);
      var iw = w - PAD.l - PAD.r, ih = h - PAD.t - PAD.b;
      function X(x) { return PAD.l + (x / xMax) * iw; }
      function Y(y) { return h - PAD.b - (y / yMax) * ih; }

      ctx.clearRect(0, 0, w, h);
      ctx.font = '11px Inter, system-ui, sans-serif';

      // grid + ticks
      var sx = niceStep(xMax, 6), sy = niceStep(yMax, 4);
      ctx.strokeStyle = P.rule; ctx.fillStyle = P.faint; ctx.lineWidth = 1;
      var gx, gy;
      for (gx = 0; gx <= xMax + 1e-9; gx += sx) {
        ctx.beginPath(); ctx.moveTo(X(gx), PAD.t); ctx.lineTo(X(gx), h - PAD.b); ctx.stroke();
        ctx.textAlign = 'center';
        ctx.fillText(fmt(gx, 0), X(gx), h - PAD.b + 16);
      }
      for (gy = 0; gy <= yMax + 1e-9; gy += sy) {
        ctx.beginPath(); ctx.moveTo(PAD.l, Y(gy)); ctx.lineTo(w - PAD.r, Y(gy)); ctx.stroke();
        ctx.textAlign = 'right';
        ctx.fillText(fmt(gy, 0), PAD.l - 8, Y(gy) + 4);
      }
      ctx.textAlign = 'center';
      ctx.fillStyle = P.soft;
      ctx.fillText('distance (m)', PAD.l + iw / 2, h - 6);
      ctx.save();
      ctx.translate(14, PAD.t + ih / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillText('height (m)', 0, 0);
      ctx.restore();

      // ground
      ctx.strokeStyle = P.soft; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(PAD.l, Y(0)); ctx.lineTo(w - PAD.r, Y(0)); ctx.stroke();

      // predicted trajectory (dashed)
      ctx.strokeStyle = P.s1; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
      ctx.beginPath();
      var i, N = 80;
      for (i = 0; i <= N; i++) {
        var tt = p.T * i / N;
        var px = X(p.vx * tt), py = Y(p.vy * tt - 0.5 * p.g * tt * tt);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      // direct label on the curve (near apex)
      ctx.fillStyle = P.s1; ctx.textAlign = 'left';
      ctx.fillText('predicted path', X(p.R / 2) + 10, Y(p.Hm) - 8);

      // flown trace (solid)
      if (state.trace.length > 1) {
        ctx.strokeStyle = P.s3; ctx.lineWidth = 2.5;
        ctx.beginPath();
        state.trace.forEach(function (pt, k) {
          if (k === 0) ctx.moveTo(X(pt[0]), Y(pt[1])); else ctx.lineTo(X(pt[0]), Y(pt[1]));
        });
        ctx.stroke();
      }

      // ball + velocity vector
      var t = Math.min(state.t, p.T);
      var bx = p.vx * t, by = Math.max(p.vy * t - 0.5 * p.g * t * t, 0);
      if (state.flying || state.t > 0) {
        var vxN = p.vx, vyN = p.vy - p.g * t, vs = 2.2; // px per m/s
        ctx.strokeStyle = P.s4; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(X(bx), Y(by));
        ctx.lineTo(X(bx) + vxN * vs, Y(by) - vyN * vs); ctx.stroke();
        ctx.fillStyle = P.s4;
        ctx.fillText('v', X(bx) + vxN * vs + 8, Y(by) - vyN * vs);
      }
      ctx.beginPath();
      ctx.arc(X(bx), Y(by), 7, 0, Math.PI * 2);
      ctx.fillStyle = P.s3; ctx.fill();
      ctx.strokeStyle = P.surface; ctx.lineWidth = 2; ctx.stroke();

      // hover crosshair along the predicted path
      if (hover) {
        var wx = (hover.x - PAD.l) / iw * xMax;
        if (wx >= 0 && wx <= p.R) {
          var ht = wx / p.vx;
          var hy = p.vy * ht - 0.5 * p.g * ht * ht;
          ctx.strokeStyle = P.faint; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
          ctx.beginPath(); ctx.moveTo(X(wx), PAD.t); ctx.lineTo(X(wx), h - PAD.b); ctx.stroke();
          ctx.setLineDash([]);
          ctx.beginPath(); ctx.arc(X(wx), Y(hy), 5, 0, Math.PI * 2);
          ctx.fillStyle = P.s1; ctx.fill();
          ctx.strokeStyle = P.surface; ctx.lineWidth = 2; ctx.stroke();
          tip.innerHTML = 'x = ' + fmt(wx) + ' m<br>y = ' + fmt(hy) + ' m<br>t = ' + fmt(ht, 2) + ' s';
          tip.style.left = X(wx) + 'px';
          tip.style.top = Y(hy) + 'px';
          tip.classList.add('show');
        } else {
          tip.classList.remove('show');
        }
      } else {
        tip.classList.remove('show');
      }
    }

    var hz = harness(canvas, H, function (ctx, w, h, dt) {
      if (state.flying) {
        state.t += dt;
        var p = params();
        var t = Math.min(state.t, p.T);
        state.trace.push([p.vx * t, Math.max(p.vy * t - 0.5 * p.g * t * t, 0)]);
        if (state.t >= p.T) { state.flying = false; hz.stop(); }
      }
      frame(ctx, w, h);
    });

    function reset(repaint) {
      state.t = 0; state.flying = false; state.trace = [];
      hz.stop();
      updateReadouts(params());
      if (repaint !== false) hz.repaint();
    }

    btnLaunch.addEventListener('click', function () {
      state.t = 0; state.trace = [];
      if (REDUCED) { // no animation: jump straight to the landed state
        var p = params();
        for (var i = 0; i <= 80; i++) {
          var tt = p.T * i / 80;
          state.trace.push([p.vx * tt, Math.max(p.vy * tt - 0.5 * p.g * tt * tt, 0)]);
        }
        state.t = p.T;
        hz.repaint();
        return;
      }
      state.flying = true;
      hz.start();
    });
    btnReset.addEventListener('click', function () { reset(); });
    [elAngle, elSpeed, elG].forEach(function (el) {
      el.addEventListener('input', function () { reset(); });
    });

    canvas.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      hover = { x: e.clientX - r.left, y: e.clientY - r.top };
      hz.repaint();
    });
    canvas.addEventListener('pointerleave', function () { hover = null; hz.repaint(); });

    reset();
  })();

  /* ======================================================================
     2. SIMPLE PENDULUM
     ====================================================================== */
  (function pendulum() {
    var canvas = document.getElementById('sim-pendulum');
    if (!canvas) return;
    var H = 340;

    var elLen = document.getElementById('pd-length');
    var elAng = document.getElementById('pd-angle');
    var elG = document.getElementById('pd-gravity');
    var outLen = document.getElementById('pd-length-out');
    var outAng = document.getElementById('pd-angle-out');
    var roT = document.getElementById('pd-period');
    var roE = document.getElementById('pd-energy');

    var st = { th: 0, om: 0, trail: [] };

    function setup() {
      st.th = (+elAng.value) * Math.PI / 180;
      st.om = 0;
      st.trail = [];
      outLen.value = fmt(+elLen.value, 1) + ' m';
      outAng.value = elAng.value + '°';
      var T0 = 2 * Math.PI * Math.sqrt((+elLen.value) / (+elG.value));
      roT.firstChild.nodeValue = fmt(T0, 2);
    }

    function frame(ctx, w, h, dt) {
      var L = +elLen.value, g = +elG.value;

      if (!REDUCED && dt > 0) {
        // semi-implicit Euler, substepped — stable and handles large angles
        var n = 8, sub = dt / n;
        for (var k = 0; k < n; k++) {
          st.om += -(g / L) * Math.sin(st.th) * sub;
          st.th += st.om * sub;
        }
      }

      var px = w / 2, py = 44;
      var scale = (h - 110) / 3.0; // px per metre; fits L up to 3 m
      var bx = px + Math.sin(st.th) * L * scale;
      var by = py + Math.cos(st.th) * L * scale;

      st.trail.push([bx, by]);
      if (st.trail.length > 90) st.trail.shift();

      ctx.clearRect(0, 0, w, h);
      ctx.font = '11px Inter, system-ui, sans-serif';

      // rest line + angle arc
      ctx.strokeStyle = P.rule; ctx.lineWidth = 1; ctx.setLineDash([3, 5]);
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + L * scale + 26); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = P.s2; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px, py, 38, Math.PI / 2, Math.PI / 2 - st.th, st.th > 0);
      ctx.stroke();
      ctx.fillStyle = P.s2; ctx.textAlign = 'left';
      ctx.fillText('θ = ' + fmt(st.th * 180 / Math.PI, 1) + '°', px + 46, py + 30);

      // trail (fading)
      for (var i = 1; i < st.trail.length; i++) {
        ctx.strokeStyle = P.s1;
        ctx.globalAlpha = 0.35 * (i / st.trail.length);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(st.trail[i - 1][0], st.trail[i - 1][1]);
        ctx.lineTo(st.trail[i][0], st.trail[i][1]);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // pivot, rod, bob
      ctx.strokeStyle = P.soft; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(bx, by); ctx.stroke();
      ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fillStyle = P.soft; ctx.fill();
      ctx.beginPath(); ctx.arc(bx, by, 13, 0, Math.PI * 2);
      ctx.fillStyle = P.s3; ctx.fill();
      ctx.strokeStyle = P.surface; ctx.lineWidth = 2.5; ctx.stroke();

      // angular-velocity readout (kept in the canvas so it tracks live)
      var v = Math.abs(st.om) * L;
      roE.firstChild.nodeValue = fmt(v, 2);
    }

    var hz = harness(canvas, H, frame);

    [elLen, elAng, elG].forEach(function (el) {
      el.addEventListener('input', function () { setup(); hz.repaint(); });
    });

    setup();
    if (REDUCED) hz.repaint(); else hz.start();
  })();

  /* ======================================================================
     3. WAVE SUPERPOSITION
     ====================================================================== */
  (function waves() {
    var canvas = document.getElementById('sim-waves');
    if (!canvas) return;
    var H = 320, PAD = { l: 16, r: 86, t: 10, b: 10 };

    var elA1 = document.getElementById('wv-a1');
    var elF1 = document.getElementById('wv-f1');
    var elA2 = document.getElementById('wv-a2');
    var elF2 = document.getElementById('wv-f2');
    var outs = {
      a1: document.getElementById('wv-a1-out'), f1: document.getElementById('wv-f1-out'),
      a2: document.getElementById('wv-a2-out'), f2: document.getElementById('wv-f2-out')
    };
    var tip = document.getElementById('wv-tip');
    var t = 0, hover = null;

    function upd() {
      outs.a1.value = fmt(+elA1.value, 1);
      outs.f1.value = elF1.value;
      outs.a2.value = fmt(+elA2.value, 1);
      outs.f2.value = elF2.value;
    }

    function y1(fx) { return (+elA1.value) * Math.sin(2 * Math.PI * ((+elF1.value) * fx - 0.35 * t)); }
    function y2(fx) { return (+elA2.value) * Math.sin(2 * Math.PI * ((+elF2.value) * fx - 0.55 * t)); }

    function frame(ctx, w, h, dt) {
      if (!REDUCED) t += dt;
      var iw = w - PAD.l - PAD.r;
      var lanes = [
        { f: y1, color: P.s1, label: 'wave 1', cy: h * 0.22, amp: h * 0.13 },
        { f: y2, color: P.s2, label: 'wave 2', cy: h * 0.5, amp: h * 0.13 },
        { f: function (fx) { return (y1(fx) + y2(fx)) / 2; }, color: P.s3, label: 'sum', cy: h * 0.8, amp: h * 0.15, wide: true }
      ];

      ctx.clearRect(0, 0, w, h);
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';

      lanes.forEach(function (ln) {
        // zero line
        ctx.strokeStyle = P.rule; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(PAD.l, ln.cy); ctx.lineTo(PAD.l + iw, ln.cy); ctx.stroke();
        // curve
        ctx.strokeStyle = ln.color; ctx.lineWidth = ln.wide ? 2.5 : 2;
        ctx.beginPath();
        for (var px = 0; px <= iw; px += 2) {
          var fx = px / iw;
          var yy = ln.cy - ln.f(fx) * ln.amp;
          if (px === 0) ctx.moveTo(PAD.l + px, yy); else ctx.lineTo(PAD.l + px, yy);
        }
        ctx.stroke();
        // direct label at the right edge
        ctx.fillStyle = ln.color;
        ctx.fillText(ln.label, PAD.l + iw + 10, ln.cy + 4);
      });

      if (hover) {
        var hx = Math.min(Math.max(hover.x, PAD.l), PAD.l + iw);
        var fx = (hx - PAD.l) / iw;
        ctx.strokeStyle = P.faint; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(hx, PAD.t); ctx.lineTo(hx, h - PAD.b); ctx.stroke();
        ctx.setLineDash([]);
        lanes.forEach(function (ln) {
          ctx.beginPath();
          ctx.arc(hx, ln.cy - ln.f(fx) * ln.amp, 4, 0, Math.PI * 2);
          ctx.fillStyle = ln.color; ctx.fill();
          ctx.strokeStyle = P.surface; ctx.lineWidth = 2; ctx.stroke();
        });
        tip.innerHTML =
          'y₁ = ' + fmt(y1(fx), 2) +
          '<br>y₂ = ' + fmt(y2(fx), 2) +
          '<br>sum = ' + fmt(y1(fx) + y2(fx), 2);
        tip.style.left = hx + 'px';
        tip.style.top = (h * 0.5) + 'px';
        tip.classList.add('show');
      } else {
        tip.classList.remove('show');
      }
    }

    var hz = harness(canvas, H, frame);

    [elA1, elF1, elA2, elF2].forEach(function (el) {
      el.addEventListener('input', function () { upd(); hz.repaint(); });
    });
    canvas.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      hover = { x: e.clientX - r.left };
      hz.repaint();
    });
    canvas.addEventListener('pointerleave', function () { hover = null; hz.repaint(); });

    upd();
    if (REDUCED) hz.repaint(); else hz.start();
  })();

  /* ======================================================================
     4. UNIT CIRCLE & TRIG FUNCTIONS
     ====================================================================== */
  (function unitCircle() {
    var canvas = document.getElementById('sim-circle');
    if (!canvas) return;
    var H = 340;

    var elTheta = document.getElementById('uc-theta');
    var outTheta = document.getElementById('uc-theta-out');
    var btnPlay = document.getElementById('uc-play');
    var btnReset = document.getElementById('uc-reset');
    var roSin = document.getElementById('uc-sin');
    var roCos = document.getElementById('uc-cos');
    var roTan = document.getElementById('uc-tan');
    var tip = document.getElementById('uc-tip');

    var playing = false;
    var hover = null; // {x} in CSS px, only meaningful inside the graph area

    function theta() { return (+elTheta.value) * Math.PI / 180; }

    function updateReadouts() {
      var th = theta();
      outTheta.value = elTheta.value + '°';
      roSin.firstChild.nodeValue = fmt(Math.sin(th), 3);
      roCos.firstChild.nodeValue = fmt(Math.cos(th), 3);
      var c = Math.cos(th);
      roTan.firstChild.nodeValue = Math.abs(c) < 0.01 ? '±∞' : fmt(Math.tan(th), 3);
    }

    /* Layout: unit circle on the left, sin/cos vs θ graph on the right. */
    function geom(w, h) {
      var R = Math.min(h * 0.32, w * 0.14);
      var cx = 24 + R, cy = h / 2;
      var gx0 = cx + R + 46;           // graph left edge
      var gx1 = w - 66;                // graph right edge (room for labels)
      return { R: R, cx: cx, cy: cy, gx0: gx0, gx1: gx1,
               X: function (th) { return gx0 + (th / (2 * Math.PI)) * (gx1 - gx0); },
               Y: function (v) { return cy - v * R; } };
    }

    function frame(ctx, w, h, dt) {
      if (playing && !REDUCED && dt > 0) {
        var deg = (+elTheta.value + 40 * dt) % 360;
        elTheta.value = deg;
        updateReadouts();
      }
      var th = theta();
      var g = geom(w, h);
      var px = g.cx + Math.cos(th) * g.R;
      var py = g.cy - Math.sin(th) * g.R;

      ctx.clearRect(0, 0, w, h);
      ctx.font = '11px Inter, system-ui, sans-serif';

      // ---- circle side: axes, circle, angle arc ----
      ctx.strokeStyle = P.rule; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(g.cx - g.R - 14, g.cy); ctx.lineTo(g.cx + g.R + 14, g.cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(g.cx, g.cy - g.R - 14); ctx.lineTo(g.cx, g.cy + g.R + 14); ctx.stroke();
      ctx.strokeStyle = P.soft; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(g.cx, g.cy, g.R, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = P.accent; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(g.cx, g.cy, 16, 0, -th, true); ctx.stroke();

      // cos leg (along the x-axis) and sin leg (vertical), then the radius
      ctx.setLineDash([4, 4]); ctx.lineWidth = 2;
      ctx.strokeStyle = P.s2;
      ctx.beginPath(); ctx.moveTo(g.cx, g.cy); ctx.lineTo(px, g.cy); ctx.stroke();
      ctx.strokeStyle = P.s1;
      ctx.beginPath(); ctx.moveTo(px, g.cy); ctx.lineTo(px, py); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = P.ink; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(g.cx, g.cy); ctx.lineTo(px, py); ctx.stroke();
      ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = P.ink; ctx.fill();

      // bridge: dotted line carrying the height across to the sine curve
      ctx.strokeStyle = P.faint; ctx.lineWidth = 1; ctx.setLineDash([2, 5]);
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(g.X(th), py); ctx.stroke();
      ctx.setLineDash([]);

      // ---- graph side: axes, curves, current points ----
      ctx.strokeStyle = P.rule; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(g.gx0, g.cy); ctx.lineTo(g.gx1, g.cy); ctx.stroke();
      ctx.fillStyle = P.faint; ctx.textAlign = 'center';
      [[0, '0'], [Math.PI / 2, '90°'], [Math.PI, '180°'], [3 * Math.PI / 2, '270°'], [2 * Math.PI, '360°']]
        .forEach(function (t) {
          ctx.beginPath(); ctx.moveTo(g.X(t[0]), g.cy - 3); ctx.lineTo(g.X(t[0]), g.cy + 3);
          ctx.strokeStyle = P.faint; ctx.stroke();
          ctx.fillText(t[1], g.X(t[0]), g.cy + 16);
        });

      [[Math.sin, P.s1, 'sin θ'], [Math.cos, P.s2, 'cos θ']].forEach(function (s) {
        ctx.strokeStyle = s[1]; ctx.lineWidth = 2;
        ctx.beginPath();
        for (var k = 0; k <= 120; k++) {
          var tt = 2 * Math.PI * k / 120;
          var xx = g.X(tt), yy = g.Y(s[0](tt));
          if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
        }
        ctx.stroke();
        // direct label at the right edge
        ctx.fillStyle = s[1]; ctx.textAlign = 'left';
        ctx.fillText(s[2], g.gx1 + 8, g.Y(s[0](2 * Math.PI)) + (s[0] === Math.sin ? -8 : -6));
        // current point, ringed with the surface colour
        ctx.beginPath(); ctx.arc(g.X(th), g.Y(s[0](th)), 5, 0, Math.PI * 2);
        ctx.fillStyle = s[1]; ctx.fill();
        ctx.strokeStyle = P.surface; ctx.lineWidth = 2; ctx.stroke();
      });

      // hover crosshair over the graph area
      if (hover && hover.x >= g.gx0 && hover.x <= g.gx1) {
        var hth = (hover.x - g.gx0) / (g.gx1 - g.gx0) * 2 * Math.PI;
        ctx.strokeStyle = P.faint; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(hover.x, g.cy - g.R - 8); ctx.lineTo(hover.x, g.cy + g.R + 8); ctx.stroke();
        ctx.setLineDash([]);
        [[Math.sin, P.s1], [Math.cos, P.s2]].forEach(function (s) {
          ctx.beginPath(); ctx.arc(hover.x, g.Y(s[0](hth)), 4, 0, Math.PI * 2);
          ctx.fillStyle = s[1]; ctx.fill();
          ctx.strokeStyle = P.surface; ctx.lineWidth = 2; ctx.stroke();
        });
        tip.innerHTML = 'θ = ' + fmt(hth * 180 / Math.PI, 0) + '°' +
          '<br>sin = ' + fmt(Math.sin(hth), 3) +
          '<br>cos = ' + fmt(Math.cos(hth), 3);
        tip.style.left = hover.x + 'px';
        tip.style.top = (g.cy - g.R) + 'px';
        tip.classList.add('show');
      } else {
        tip.classList.remove('show');
      }
    }

    var hz = harness(canvas, H, frame);

    function setPlaying(on) {
      playing = on && !REDUCED;
      btnPlay.textContent = playing ? 'Pause' : 'Play';
      if (playing) hz.start(); else hz.stop();
    }

    btnPlay.addEventListener('click', function () { setPlaying(!playing); });
    btnReset.addEventListener('click', function () {
      setPlaying(false);
      elTheta.value = 45;
      updateReadouts();
      hz.repaint();
    });
    elTheta.addEventListener('input', function () {
      setPlaying(false);
      updateReadouts();
      hz.repaint();
    });
    canvas.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      hover = { x: e.clientX - r.left };
      hz.repaint();
    });
    canvas.addEventListener('pointerleave', function () { hover = null; hz.repaint(); });

    updateReadouts();
    hz.repaint();
  })();
})();
