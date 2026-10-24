/* Insula Neurosciences: motion and interaction.
   Every page still works without this file; it only adds enhancements.
   All motion respects the "reduce motion" accessibility setting. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var easeInOut = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };

  /* ---------- split headings into words (runs before paint to avoid a flash) ---------- */
  function splitHeadings() {
    document.querySelectorAll('[data-split]').forEach(function (el) {
      if (el.classList.contains('split')) return;
      var text = el.textContent.replace(/\s+/g, ' ').trim();
      el.setAttribute('aria-label', text);
      el.innerHTML = text.split(' ').map(function (w, i) {
        var safe = w.replace(/&/g, '&amp;').replace(/</g, '&lt;');
        return '<span class="w" aria-hidden="true"><span style="--i:' + i + '">' + safe + '</span></span>';
      }).join(' ');
      el.classList.add('split');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    splitHeadings();

    /* ---------- footer year ---------- */
    document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

    /* ---------- mobile navigation ---------- */
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('site-nav');
    if (toggle && nav) {
      var setNav = function (open) { toggle.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open); };
      toggle.addEventListener('click', function () { setNav(toggle.getAttribute('aria-expanded') !== 'true'); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && nav.classList.contains('open')) { setNav(false); toggle.focus(); }
      });
    }

    /* ---------- header border + scroll progress ---------- */
    var header = document.querySelector('.site-header');
    var bar = document.querySelector('.scroll-progress span');
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (header) header.classList.toggle('scrolled', y > 8);
        if (bar) {
          var max = document.documentElement.scrollHeight - window.innerHeight;
          bar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0) + ')';
        }
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    /* ---------- reveal, stagger, split headings, thread ---------- */
    document.querySelectorAll('.stagger').forEach(function (g) {
      Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty('--i', i); });
    });
    var watched = document.querySelectorAll('.reveal, .stagger, [data-split], .thread');
    if ('IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      watched.forEach(function (el) { io.observe(el); });
    } else {
      watched.forEach(function (el) { el.classList.add('in'); });
    }

    /* ---------- cursor spotlight on cards ---------- */
    if (canHover && !reduce) {
      document.addEventListener('pointermove', function (e) {
        var c = e.target.closest && e.target.closest('.card, .dest');
        if (!c) return;
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        c.style.setProperty('--my', (e.clientY - r.top) + 'px');
      }, { passive: true });
    }

    /* ---------- soft page transitions ---------- */
    if (!reduce) {
      document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[href]');
        if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (a.target === '_blank' || a.hasAttribute('download')) return;
        var url;
        try { url = new URL(a.href, location.href); } catch (err) { return; }
        if (!/^(https?|file):$/.test(url.protocol) || url.origin !== location.origin) return;
        if (url.pathname === location.pathname && url.search === location.search) return;
        e.preventDefault();
        root.classList.add('leaving');
        setTimeout(function () { location.href = a.href; }, 200);
      });
      window.addEventListener('pageshow', function () { root.classList.remove('leaving'); });
    }

    /* ---------- "On this page" highlight ---------- */
    var tocLinks = document.querySelectorAll('.toc a');
    if (tocLinks.length && 'IntersectionObserver' in window) {
      var byId = {};
      tocLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
      var tio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && byId[en.target.id]) {
            tocLinks.forEach(function (a) { a.classList.remove('active'); });
            byId[en.target.id].classList.add('active');
          }
        });
      }, { rootMargin: '-20% 0px -70% 0px' });
      Object.keys(byId).forEach(function (id) { var s = document.getElementById(id); if (s) tio.observe(s); });
    }

    /* ---------- conditions directory filter ---------- */
    var fbar = document.querySelector('[data-filter]');
    if (fbar) {
      var input = fbar.querySelector('input');
      var chips = fbar.querySelectorAll('[data-chip]');
      var cards = document.querySelectorAll('.cond-card');
      var groups = document.querySelectorAll('.cond-group');
      var empty = document.querySelector('.no-results');
      var area = 'all';
      var apply = function () {
        var q = input.value.trim().toLowerCase(), shown = 0;
        cards.forEach(function (c) {
          var ok = (area === 'all' || c.dataset.area === area) && (!q || c.dataset.search.indexOf(q) !== -1);
          c.hidden = !ok; if (ok) shown++;
        });
        groups.forEach(function (g) { g.hidden = !g.querySelector('.cond-card:not([hidden])'); });
        empty.hidden = shown !== 0;
      };
      input.addEventListener('input', apply);
      chips.forEach(function (ch) {
        ch.addEventListener('click', function () {
          area = ch.dataset.chip;
          chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === ch)); });
          apply();
        });
      });
    }

    neural();
    document.querySelectorAll('[data-morph]').forEach(morphWidget);
    var curLink = document.querySelector('.site-nav a[aria-current="page"]');
    if (curLink) {
      var setW = function () { curLink.style.setProperty('--w', (curLink.offsetWidth - 22) + 'px'); };
      setW(); window.addEventListener('resize', setW);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(setW);
    }
    nervousSystem();
    document.querySelectorAll('[data-disc]').forEach(discWidget);
    insula();
    counters();
  });

  /* =================================================================
     Neural network canvas: nerve cells that fire signals.
     Signals hop from cell to cell; the cursor or a tap sets them off.
     ================================================================= */
  function neural() {
    var canvas = document.querySelector('canvas.neural-page');
    if (!canvas || !canvas.getContext) return;
    var home = document.body.classList.contains('page-home');
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, nodes = [], pulses = [], raf = null, last = 0, spawnT = 0;
    var LINK = 140, LINE_A = home ? .12 : .09;
    var pointer = { x: -9999, y: -9999, on: false };
    var hint = document.querySelector('.hint-text');
    if (hint && !canHover) hint.textContent = 'Tap anywhere to fire a signal';

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var nw = window.innerWidth, nh = Math.max(window.innerHeight, document.documentElement.clientHeight);
      if (nodes.length && W && H) {
        var sx = nw / W, sy = nh / H;
        nodes.forEach(function (n) { n.x *= sx; n.y *= sy; });
      }
      W = nw; H = nh;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!nodes.length) {
        var n = Math.round(clamp(W * H / (home ? 9500 : 12000), W < 700 ? 46 : 40, 130));
        for (var i = 0; i < n; i++) nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .16, vy: (Math.random() - .5) * .16, r: .9 + Math.random() * 1.4, glow: 0 });
      }
      if (reduce || !raf) draw();
    }
    function neighbours(a, ex) {
      var out = [];
      for (var i = 0; i < nodes.length; i++) { var b = nodes[i]; if (b === a || b === ex) continue; var dx = a.x - b.x, dy = a.y - b.y; if (dx * dx + dy * dy < LINK * LINK) out.push(b); }
      return out;
    }
    function fire(a, from, gen) {
      if (!a || pulses.length > 70) return;
      var nb = neighbours(a, from); if (!nb.length) return;
      pulses.push({ a: a, b: nb[(Math.random() * nb.length) | 0], t: 0, speed: .0016 + Math.random() * .0012, gen: gen || 0 });
      a.glow = 1;
    }
    function nearest(x, y) { var best = null, bd = Infinity; nodes.forEach(function (n) { var d = (n.x - x) * (n.x - x) + (n.y - y) * (n.y - y); if (d < bd) { bd = d; best = n; } }); return best; }
    function step(dt) {
      nodes.forEach(function (n) {
        if (pointer.on) { var dx = pointer.x - n.x, dy = pointer.y - n.y, d2 = dx * dx + dy * dy; if (d2 < 40000 && d2 > 1) { var k = .00018 * dt / Math.sqrt(d2); n.vx += dx * k; n.vy += dy * k; } }
        n.vx *= .985; n.vy *= .985;
        if (Math.hypot(n.vx, n.vy) < .05) { n.vx += (Math.random() - .5) * .02; n.vy += (Math.random() - .5) * .02; }
        n.x += n.vx * dt * .06; n.y += n.vy * dt * .06;
        if (n.x < 0 || n.x > W) n.vx *= -1; if (n.y < 0 || n.y > H) n.vy *= -1;
        n.x = clamp(n.x, 0, W); n.y = clamp(n.y, 0, H);
        n.glow = Math.max(0, n.glow - dt * .0016);
      });
      spawnT += dt;
      if (spawnT > (home ? 420 : 650)) { spawnT = 0; fire(nodes[(Math.random() * nodes.length) | 0], null, 0); }
      for (var i = pulses.length - 1; i >= 0; i--) {
        var p = pulses[i]; p.t += p.speed * dt;
        if (p.t >= 1) { pulses.splice(i, 1); p.b.glow = 1; if (p.gen < 5 && Math.random() < .62) fire(p.b, p.a, p.gen + 1); }
      }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H); ctx.lineWidth = 1;
      for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        for (var j2 = i + 1; j2 < nodes.length; j2++) {
          var b = nodes[j2], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) { ctx.strokeStyle = 'rgba(233,236,238,' + ((1 - Math.sqrt(d2) / LINK) * LINE_A).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
      }
      if (pointer.on) nodes.forEach(function (n) {
        var d = Math.hypot(n.x - pointer.x, n.y - pointer.y);
        if (d < 170) { ctx.strokeStyle = 'rgba(126,155,255,' + ((1 - d / 170) * .4).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(pointer.x, pointer.y); ctx.lineTo(n.x, n.y); ctx.stroke(); }
      });
      pulses.forEach(function (p) {
        var x = p.a.x + (p.b.x - p.a.x) * p.t, y = p.a.y + (p.b.y - p.a.y) * p.t;
        var g = ctx.createLinearGradient(p.a.x, p.a.y, x, y);
        g.addColorStop(0, 'rgba(126,155,255,0)'); g.addColorStop(1, 'rgba(126,155,255,.75)');
        ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(p.a.x, p.a.y); ctx.lineTo(x, y); ctx.stroke();
        ctx.fillStyle = 'rgba(126,155,255,.18)'; ctx.beginPath(); ctx.arc(x, y, 6, 0, 6.283); ctx.fill();
        ctx.fillStyle = '#AFC0FF'; ctx.beginPath(); ctx.arc(x, y, 2, 0, 6.283); ctx.fill();
      });
      ctx.lineWidth = 1;
      nodes.forEach(function (n) {
        if (n.glow > 0) { ctx.fillStyle = 'rgba(126,155,255,' + (n.glow * .22).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 7 * n.glow, 0, 6.283); ctx.fill(); }
        ctx.fillStyle = n.glow > .05 ? 'rgba(175,192,255,' + (.45 + n.glow * .55).toFixed(3) + ')' : 'rgba(233,236,238,.4)';
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 6.283); ctx.fill();
      });
    }
    function loop(t) { var dt = last ? Math.min(t - last, 50) : 16; last = t; step(dt); draw(); raf = requestAnimationFrame(loop); }
    function start() { if (!raf && !reduce && !document.hidden) { last = 0; raf = requestAnimationFrame(loop); } }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }
    var moveFire = 0;
    document.addEventListener('pointermove', function (e) {
      pointer.x = e.clientX; pointer.y = e.clientY; pointer.on = e.pointerType === 'mouse';
      var now = performance.now();
      if (pointer.on && now - moveFire > 160) { moveFire = now; fire(nearest(e.clientX, e.clientY), null, 2); }
    }, { passive: true });
    document.addEventListener('pointerleave', function () { pointer.on = false; });
    document.addEventListener('pointerdown', function (e) {
      if (e.target.closest('a, button, input, label, .panel, .card, .dest, .site-header, .site-footer, .toc, .urgent')) return;
      var n = nearest(e.clientX, e.clientY); for (var k = 0; k < 5; k++) fire(n, null, 0);
      if (reduce) draw();
    });
    resize();
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 120); });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    start();
  }

  /* shared: morph SVG paths between two shapes with the same structure */
  var NUM = /-?\d*\.?\d+/g;
  function prepPaths(root) {
    return Array.prototype.map.call(root.querySelectorAll('[data-d0]'), function (el) {
      return { el: el, ch: el.getAttribute('data-ch'), a: el.getAttribute('data-d0').match(NUM).map(Number), b: el.getAttribute('data-d1').match(NUM).map(Number), parts: el.getAttribute('data-d0').split(NUM), last: -1 };
    });
  }
  function morphPaths(list, vals) {
    list.forEach(function (o) {
      var t = vals[o.ch]; if (t === undefined || Math.abs(t - o.last) < .0005) return;
      o.last = t;
      var out = o.parts[0];
      for (var i = 0; i < o.a.length; i++) out += (o.a[i] + (o.b[i] - o.a[i]) * t).toFixed(1) + o.parts[i + 1];
      o.el.setAttribute('d', out);
    });
  }

  /* =================================================================
     Condition illustrations: channels drive CSS variables, path morphs and captions.
     ================================================================= */
  var DERIVE = {
    stenosis: function (v) { return { e: v.a * (1 - .4 * (v.f || 0)) }; },
    myelo: function (v) { return { e: v.a * (1 - v.s) }; },
    bleed: function (v) { return { m: Math.min(1, v.e + v.s + v.c) }; },
    aneurysm: function (v) { return { ka: clamp(v.k / .6, 0, 1), kc: clamp((v.k - .6) / .4, 0, 1) }; }
  };

  /* geometry helpers for the spine animations */
  function crP(pts, closed) {
    var n = pts.length, P = closed ? [pts[n - 1]].concat(pts, [pts[0], pts[1]]) : [pts[0]].concat(pts, [pts[n - 1]]);
    var F = function (x) { return x.toFixed(1); };
    var d = 'M' + F(P[1][0]) + ' ' + F(P[1][1]), end = closed ? n + 1 : n;
    for (var i = 1; i < end; i++) {
      var p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
      d += ' C' + F(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + F(p1[1] + (p2[1] - p0[1]) / 6) + ' ' + F(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + F(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + F(p2[0]) + ' ' + F(p2[1]);
    }
    return d + (closed ? ' Z' : '');
  }
  /* a frame sits at the back-bottom corner of a vertebra; u points forward, v points up */
  function Wp(fr, u, v) { var c = Math.cos(fr.a), s = Math.sin(fr.a); return [fr.o[0] - u * c - v * s, fr.o[1] + u * s - v * c]; }
  function polyD(fr, pts) { return 'M' + pts.map(function (p) { var q = Wp(fr, p[0], p[1]); return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(' L') + ' Z'; }
  function wedge(fr, D, hp, ha, r) {
    r = r || 0;
    var pts = r ? [[r, 0], [D - r, 0], [D, r], [D, ha - r], [D - r, ha], [r, hp], [0, hp - r], [0, r]] : [[0, 0], [D, 0], [D, ha], [0, hp]];
    return { d: polyD(fr, pts), top: { o: Wp(fr, 0, hp), a: fr.a + Math.atan2(hp - ha, D) } };
  }
  function mk(parent, tag, cls) { var e = document.createElementNS('http://www.w3.org/2000/svg', tag); if (cls) e.setAttribute('class', cls); parent.appendChild(e); return e; }

  var RENDER = {
    /* spinal TB: two vertebral bodies collapse at the front; the intact back of the spine is the hinge */
    tb: function (w, v) {
      var a = v.a, D = 78, H = 34, h = 10, N = 7;
      if (!w._tb) {
        var g = w.querySelector('.tb-root'), E = { body: [], bodyInf: [], disc: [], post: [], dots: [] };
        E.skin = mk(g, 'path', 'tb-skin');
        for (var i = 0; i < N; i++) E.post.push(mk(g, 'path', 'tb-post'));
        E.cord = mk(g, 'path', 'tb-cord'); E.cordHot = mk(g, 'path', 'tb-cord-hot');
        for (i = 0; i < N - 1; i++) E.disc.push(mk(g, 'path', 'tb-disc'));
        for (i = 0; i < N; i++) { E.body.push(mk(g, 'path', 'tb-body')); E.bodyInf.push(mk(g, 'path', 'tb-body-inf')); }
        for (i = 0; i < 9; i++) E.dots.push(mk(g, 'circle', 'tb-dot'));
        E.abs = mk(g, 'ellipse', 'tb-abscess'); E.retro = mk(g, 'ellipse', 'tb-retro');
        E.lbl = w.querySelector('.tb-gib-lbl');
        w._tb = E;
      }
      var E = w._tb, fr = { o: [206, 324], a: 0 }, cord = [Wp(fr, -9, -14)], skin = [], frames = [], dfr = [];
      var post = [[0, 10], [-12, 9], [-18, 4], [-30, 2], [-56, -12], [-62, -6], [-40, 12], [-28, 24], [-18, 30], [-12, 25], [0, 24]];
      for (var i = 0; i < N; i++) {
        var hit = (i === 2 || i === 3);
        var hp = hit ? H - 3 * a : H, ha = hit ? H - 20 * a : H;
        var b = wedge(fr, D, hp, ha, 5);
        E.body[i].setAttribute('d', b.d); E.bodyInf[i].setAttribute('d', b.d);
        E.bodyInf[i].style.opacity = hit ? (a * .55).toFixed(3) : 0;
        E.post[i].setAttribute('d', polyD(fr, post));
        cord.push(Wp(fr, -9, hp / 2)); skin.push(Wp(fr, -92, -2));
        frames.push({ fr: fr, hp: hp, ha: ha });
        fr = b.top;
        if (i < N - 1) {
          var dh = i === 2 ? h * (1 - .55 * a) : h, da = i === 2 ? h * (1 - .95 * a) : h;
          var d = wedge(fr, D - 8, dh, da);
          var dfr0 = { o: Wp(fr, 4, 0), a: fr.a };
          E.disc[i].setAttribute('d', wedge(dfr0, D - 8, dh, da).d);
          E.disc[i].style.opacity = i === 2 ? (1 - a * .7).toFixed(3) : 1;
          cord.push(Wp(fr, -9, dh / 2)); dfr.push({ fr: fr, h: dh });
          fr = { o: Wp(fr, 0, dh), a: fr.a + Math.atan2(dh - da, D) };
        }
      }
      cord.push(Wp(fr, -9, 16));
      E.cord.setAttribute('d', crP(cord));
      E.cordHot.setAttribute('d', crP(cord.slice(5, 9)));
      E.cordHot.style.opacity = clamp((a - .55) * 2.2, 0, 1).toFixed(3);
      E.skin.setAttribute('d', crP(skin));
      var spots = [[2, 18, 10], [2, 46, 20], [2, 30, 24], [2, 60, 12], [3, 22, 12], [3, 50, 8], [3, 36, 22], [3, 62, 18], [-1, 40, 5]];
      spots.forEach(function (s, k) {
        var F = s[0] < 0 ? { fr: dfr[2].fr, hp: dfr[2].h } : frames[s[0]];
        var p = Wp(F.fr, s[1], Math.min(s[2], F.hp - 3));
        E.dots[k].setAttribute('cx', p[0].toFixed(1)); E.dots[k].setAttribute('cy', p[1].toFixed(1));
        E.dots[k].setAttribute('r', (1.5 + 3 * a).toFixed(2)); E.dots[k].style.opacity = clamp(a * 2.2, 0, 1).toFixed(3);
      });
      var df = dfr[2].fr, ang = -df.a * 180 / Math.PI;
      var pa = Wp(df, D + 12, 4);
      E.abs.setAttribute('cx', pa[0].toFixed(1)); E.abs.setAttribute('cy', pa[1].toFixed(1));
      E.abs.setAttribute('rx', (6 + 8 * a).toFixed(1)); E.abs.setAttribute('ry', (8 + 26 * a).toFixed(1));
      E.abs.setAttribute('transform', 'rotate(' + ang.toFixed(1) + ' ' + pa[0].toFixed(1) + ' ' + pa[1].toFixed(1) + ')');
      E.abs.style.opacity = clamp((a - .25) * 1.6, 0, 1).toFixed(3);
      var pr = Wp(df, -3, 4);
      E.retro.setAttribute('cx', pr[0].toFixed(1)); E.retro.setAttribute('cy', pr[1].toFixed(1));
      E.retro.setAttribute('rx', (3 + 4 * a).toFixed(1)); E.retro.setAttribute('ry', (8 + 6 * a).toFixed(1));
      E.retro.setAttribute('transform', 'rotate(' + ang.toFixed(1) + ' ' + pr[0].toFixed(1) + ' ' + pr[1].toFixed(1) + ')');
      E.retro.style.opacity = clamp((a - .4) * 1.8, 0, 1).toFixed(3);
      if (E.lbl) { var sp = skin[3]; E.lbl.setAttribute('x', (sp[0] + 14).toFixed(1)); E.lbl.setAttribute('y', (sp[1] + 4).toFixed(1)); E.lbl.style.opacity = clamp((a - .6) * 2.5, 0, 1).toFixed(3); }
    },

    /* standing versus bending: the lumbar spine flexes and extends; the canal opens and closes */
    posture: function (w, v) {
      var k = (v.p - .5) * 2, ext = Math.max(0, k), flx = Math.max(0, -k), D = 100, H = 50, h = 16;
      if (!w._pz) {
        var g = w.querySelector('.pz-root'), E = { body: [], disc: [], post: [], lf: [], bulge: [], strands: [], hot: [] };
        E.sac = mk(g, 'path', 'pz-sacrum');
        for (var i = 0; i < 3; i++) E.post.push(mk(g, 'path', 'tb-post'));
        for (i = 0; i < 4; i++) E.strands.push(mk(g, 'path', 'pz-strand'));
        for (i = 0; i < 4; i++) E.hot.push(mk(g, 'path', 'pz-strand pz-hot'));
        for (i = 0; i < 3; i++) E.disc.push(mk(g, 'path', 'tb-disc'));
        for (i = 0; i < 3; i++) E.bulge.push(mk(g, 'ellipse', 'pz-bulge'));
        for (i = 0; i < 3; i++) E.body.push(mk(g, 'path', 'tb-body'));
        for (i = 0; i < 2; i++) E.lf.push(mk(g, 'path', 'pz-lf'));
        E.meas = mk(g, 'path', 'pz-meas');
        E.torso = w.querySelector('.pz-torso');
        w._pz = E;
      }
      var E = w._pz, fr = { o: [262, 300], a: 0 };
      E.sac.setAttribute('d', 'M262 300 L162 300 L170 340 L262 340 Z');
      var post = [[0, 18], [-20, 15], [-26, 6], [-36, 6], [-40, 16], [-80, 18], [-86, 26], [-80, 34], [-40, 36], [-36, 46], [-26, 46], [-20, 38], [0, 34]];
      var levels = [], bodies = [];
      for (var i = 0; i < 3; i++) {
        var hp = h - 6 * k, ha = h + 6 * k;
        var df = { o: Wp(fr, 6, 0), a: fr.a };
        E.disc[i].setAttribute('d', wedge(df, D - 12, hp, ha).d);
        var bp = Wp(fr, -(1 + 6 * ext), hp / 2), bang = -fr.a * 180 / Math.PI;
        E.bulge[i].setAttribute('cx', bp[0].toFixed(1)); E.bulge[i].setAttribute('cy', bp[1].toFixed(1));
        E.bulge[i].setAttribute('rx', (2 + 6 * ext).toFixed(1)); E.bulge[i].setAttribute('ry', (hp / 2 + 2).toFixed(1));
        E.bulge[i].setAttribute('transform', 'rotate(' + bang.toFixed(1) + ' ' + bp[0].toFixed(1) + ' ' + bp[1].toFixed(1) + ')');
        levels.push({ fr: fr, mid: hp / 2, disc: true, bulge: 1 + 6 * ext });
        fr = { o: Wp(fr, 0, hp), a: fr.a + Math.atan2(hp - ha, D) };
        var b = wedge(fr, D, H, H, 7);
        E.body[i].setAttribute('d', b.d); E.post[i].setAttribute('d', polyD(fr, post));
        bodies.push(fr); levels.push({ fr: fr, mid: H / 2, disc: false });
        fr = b.top;
      }
      for (i = 0; i < 2; i++) {
        var A = Wp(bodies[i], -30, 46), B = Wp(bodies[i + 1], -30, 6);
        var fl = bodies[i], U = [-Math.cos(fl.a), Math.sin(fl.a)];
        var bul = 3 + 13 * ext - 2 * flx;
        var M = [(A[0] + B[0]) / 2 + U[0] * bul * 2, (A[1] + B[1]) / 2 + U[1] * bul * 2];
        E.lf[i].setAttribute('d', 'M' + A[0].toFixed(1) + ' ' + A[1].toFixed(1) + ' Q' + M[0].toFixed(1) + ' ' + M[1].toFixed(1) + ' ' + B[0].toFixed(1) + ' ' + B[1].toFixed(1));
        E.lf[i].style.strokeWidth = (8 + 4 * ext - 3 * flx).toFixed(1) + 'px';
        levels[2 + i * 2].lf = (bul * 1.0);
      }
      var us = [-6, -11, -16, -21];
      us.forEach(function (u0, si) {
        var pts = [Wp({ o: [262, 300], a: 0 }, u0, -20)];
        levels.forEach(function (L) {
          var u = u0;
          if (L.disc) { var squeeze = .55 * ext; u = -13.5 + (u0 + 13.5) * (1 - squeeze); }
          pts.push(Wp(L.fr, u, L.mid));
        });
        pts.push(Wp(fr, u0, 20));
        var dd = crP(pts);
        E.strands[si].setAttribute('d', dd); E.hot[si].setAttribute('d', dd);
        E.hot[si].style.opacity = clamp((ext - .35) * 1.6, 0, 1).toFixed(3);
      });
      var L = levels[2], m0 = Wp(L.fr, -(L.bulge || 1), L.mid), m1 = Wp(L.fr, -(28 - (3 + 13 * ext - 2 * flx)), L.mid);
      E.meas.setAttribute('d', 'M' + m0[0].toFixed(1) + ' ' + m0[1].toFixed(1) + ' L' + m1[0].toFixed(1) + ' ' + m1[1].toFixed(1));
      E.meas.style.stroke = ext > .45 ? '#FF6B57' : '#7E9BFF';
      if (E.torso) { var ta = k < 0 ? k * 38 : k * 12; E.torso.setAttribute('transform', 'rotate(' + ta.toFixed(1) + ' 402 250)'); }
    },

    /* head injury: the dura, the bleed, the brain surface and the midline are all computed together,
       so each bleed type deforms the dura and shifts the brain in its own way */
    bleed: function (w, v) {
      var e = v.e || 0, s = v.s || 0, c = v.c || 0, cx = 230, cy = 196, DEG = Math.PI / 180;
      if (!w._bl) {
        var q = function (sel) { return w.querySelector(sel); };
        w._bl = { dura: q('.bl-dura'), edh: q('.bl-edh'), sdh: q('.bl-sdh'), csdh: q('.bl-csdh'), memO: q('.bl-mem-o'), memI: q('.bl-mem-i'),
                  lh: q('.bl-lh'), rh: q('.bl-rh'), lclip: q('.bl-lh-clip'), rclip: q('.bl-rh-clip'), lsul: q('.bl-lsul'), rsul: q('.bl-rsul'),
                  lv: q('.bl-lv'), rv: q('.bl-rv'), cc: q('.bl-cc'), falx: q('.bl-falx'), stem: q('.bl-stem'), veins: q('.bl-veins'), lbl: q('.bl-shift-lbl') };
        var vs = w._bl.veins; w._bl.vein = [0, 1, 2, 3].map(function () { return mk(vs, 'path', 'bl-vein'); });
      }
      var B = w._bl;
      var prof = function (a, a0, a1, pw) { return (a < a0 || a > a1) ? 0 : Math.pow(Math.sin(Math.PI * (a - a0) / (a1 - a0)), pw); };
      var DE = 40 * e, DS = 18 * s, DC = 28 * c;
      var pe = function (a) { return prof(a, -36, 22, .9); }, ps = function (a) { return prof(a, -82, 46, .85); }, pc = function (a) { return prof(a, -84, 48, .85); };
      var pt = function (a, r, ratio, side) { return [cx + side * r * Math.cos(a * DEG), cy + r * ratio * Math.sin(a * DEG)]; };
      var duraR = function (a) { return 174 - DE * pe(a); };
      var limit = function (a) { return 174 - DE * pe(a) - DS * ps(a) - DC * pc(a) - 2; };
      var atro = 1 - .04 * c;
      var shift = e * 8 + s * 13 + c * 8;
      var wgt = function (x) { return clamp(1 - Math.abs(x - cx) / 170, 0, 1); };
      var sh = function (p, k) { return [p[0] - shift * (k === undefined ? wgt(p[0]) : k), p[1]]; };

      /* dura: attached to the skull everywhere, except where an extradural clot peels it inward */
      var d = [];
      for (var a = -90; a < 270; a += 3) { var right = a > -90 && a < 90; d.push(pt(right ? a : 180 - a, right ? duraR(a) : 174, .85, right ? 1 : -1)); }
      B.dura.setAttribute('d', crP(d, true));

      /* the three bleeds, each sized by its own value */
      var arc = function (a0, a1, rOut, depth, prf) {
        var out = [], inn = [], n = 30;
        for (var i = 0; i <= n; i++) { var aa = a0 + (a1 - a0) * i / n; out.push(pt(aa, rOut, .85, 1)); }
        for (i = n; i >= 0; i--) { aa = a0 + (a1 - a0) * i / n; inn.push(pt(aa, rOut - depth * prf(aa), .85, 1)); }
        return { d: crP(out.concat(inn), true), inner: inn };
      };
      B.edh.setAttribute('d', arc(-36, 22, 174.5, DE, pe).d); B.edh.style.opacity = clamp(e * 3, 0, 1);
      B.sdh.setAttribute('d', arc(-82, 46, 173, DS, ps).d); B.sdh.style.opacity = clamp(s * 3, 0, 1);
      var cs = arc(-84, 48, 173, DC, pc);
      B.csdh.setAttribute('d', cs.d); B.csdh.style.opacity = clamp(c * 3, 0, 1);
      var mo = []; for (var i2 = 0; i2 <= 30; i2++) { var a2 = -84 + 132 * i2 / 30; mo.push(pt(a2, 171.5 - DC * pc(a2) * .12, .85, 1)); }
      B.memO.setAttribute('d', crP(mo)); B.memI.setAttribute('d', crP(cs.inner.map(function (p) { return [p[0] - .5, p[1]]; })));
      B.memO.style.opacity = B.memI.style.opacity = clamp(c * 2, 0, 1);

      /* hemispheres: the bleed side is limited by the dura and clot; inner parts move further than outer parts */
      var hemi = function (side) {
        var pts = [];
        for (var i = 0; i <= 36; i++) {
          var a = -86 + i * (130 / 36), mod = 1 + .018 * Math.abs(Math.sin(a * DEG * 9));
          var r = 164 * atro; if (side > 0) r = Math.min(r, limit(a) - 2);
          pts.push(pt(a, r * mod, .8415, side));
        }
        [[120, 128], [98, 150], [64, 154], [38, 136], [30, 102], [16, 62], [8, 18], [6, -120]].forEach(function (q) { pts.push([cx + side * q[0] * (side < 0 ? atro : 1), cy + q[1]]); });
        return pts.map(function (p) { return sh(p); });
      };
      var lh = crP(hemi(-1), true), rh = crP(hemi(1), true);
      B.lh.setAttribute('d', lh); B.rh.setAttribute('d', rh); B.lclip.setAttribute('d', lh); B.rclip.setAttribute('d', rh);
      B.lsul.setAttribute('transform', 'translate(' + (-shift * .55).toFixed(2) + ' 0)');
      B.rsul.setAttribute('transform', 'translate(' + (-shift * .6).toFixed(2) + ' 0)');

      /* ventricles: the bleed side is squeezed; with an older, shrunken brain they are a little larger */
      var big = 1 + .14 * c, k = e * .45 + s * .7 + c * .4;
      var L0 = [[-6, -28], [-30, -34], [-52, -18], [-40, -4], [-12, 2]], R0 = [[6, -28], [30, -34], [52, -18], [40, -4], [12, 2]], R1 = [[2, -26], [18, -28], [30, -18], [22, -10], [6, -6]];
      var vpt = function (p) { return [cx + p[0] * big - shift * .95, cy + p[1] * big]; };
      B.lv.setAttribute('d', crP(L0.map(vpt), true));
      B.rv.setAttribute('d', crP(R0.map(function (p, i) { return vpt([p[0] + (R1[i][0] - p[0]) * k, p[1] + (R1[i][1] - p[1]) * k]); }), true));
      var cs2 = shift * .85;
      B.cc.setAttribute('d', 'M' + (cx - 60 - cs2) + ' ' + (cy - 32) + ' C' + (cx - 30 - cs2) + ' ' + (cy - 48) + ' ' + (cx + 30 - cs2) + ' ' + (cy - 48) + ' ' + (cx + 60 - cs2) + ' ' + (cy - 32));
      /* the falx is anchored to the skull at the top; its free lower edge bows away from the bleed */
      B.falx.setAttribute('d', 'M' + cx + ' ' + (cy - 146) + ' Q' + (cx - shift * 1.7).toFixed(1) + ' ' + (cy - 70) + ' ' + (cx - shift * 1.05).toFixed(1) + ' ' + (cy - 18));
      var st = shift * .35;
      B.stem.setAttribute('d', 'M' + (cx - 20 - st) + ' ' + (cy + 60) + ' C' + (cx - 24 - st) + ' ' + (cy + 110) + ' ' + (cx - 16 - st) + ' ' + (cy + 140) + ' ' + (cx - 13 - st) + ' ' + (cy + 200) + ' L' + (cx + 13 - st) + ' ' + (cy + 200) + ' C' + (cx + 16 - st) + ' ' + (cy + 140) + ' ' + (cx + 24 - st) + ' ' + (cy + 110) + ' ' + (cx + 20 - st) + ' ' + (cy + 60) + ' Z');

      /* bridging veins run from the brain surface to the dura; in an acute subdural one is torn */
      [-76, -66, -56, -46].forEach(function (a, i) {
        var mod = 1 + .018 * Math.abs(Math.sin(a * DEG * 9));
        var p0 = sh(pt(a, Math.min(164 * atro, limit(a) - 2) * mod, .8415, 1)), p1 = pt(a, duraR(a) - 1, .85, 1);
        var dd;
        if (i === 1 && s > .3) {
          var t1 = .38, t2 = .62;
          dd = 'M' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) + ' L' + (p0[0] + (p1[0] - p0[0]) * t1).toFixed(1) + ' ' + (p0[1] + (p1[1] - p0[1]) * t1).toFixed(1) +
               ' M' + (p0[0] + (p1[0] - p0[0]) * t2).toFixed(1) + ' ' + (p0[1] + (p1[1] - p0[1]) * t2).toFixed(1) + ' L' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1);
        } else dd = 'M' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) + ' L' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1);
        B.vein[i].setAttribute('d', dd);
        B.vein[i].classList.toggle('torn', i === 1 && s > .3);
      });
      if (B.lbl) B.lbl.style.opacity = clamp(shift / 6 - .3, 0, 1).toFixed(3);
    },

    aneurysm: function (w, v) {
      w.classList.toggle('is-rupt', v.r > .5);
      w.classList.toggle('is-treated', v.c > .5 || v.k > .5);
    }
  };

  function morphWidget(w) {
    var kind = w.getAttribute('data-kind'), ch = {}, raf = null, touched = false;
    (w.getAttribute('data-init') || '').split(',').forEach(function (kv) { if (!kv) return; var p = kv.split(':'); ch[p[0]] = { cur: +p[1], target: +p[1] }; });
    var paths = prepPaths(w);
    var parseConds = function (s) { return s.split('&').map(function (c) { var p = c.split(':'); return [p[0], +p[1], +p[2]]; }); };
    var test = function (conds, v) { return conds.every(function (c) { var x = v[c[0]] || 0; return x >= c[1] && x < c[2]; }); };
    var whens = Array.prototype.map.call(w.querySelectorAll('[data-when]'), function (el) { return { el: el, conds: parseConds(el.getAttribute('data-when')) }; });
    var hides = Array.prototype.map.call(w.querySelectorAll('[data-hide-when]'), function (el) { return { el: el, conds: parseConds(el.getAttribute('data-hide-when')) }; });
    var ranges = w.querySelectorAll('input[data-ch]');
    function vals() {
      var v = {}; Object.keys(ch).forEach(function (k) { v[k] = ch[k].cur; });
      if (DERIVE[kind]) { var d = DERIVE[kind](v); Object.keys(d).forEach(function (k) { v[k] = d[k]; }); }
      return v;
    }
    function render() {
      var v = vals();
      Object.keys(v).forEach(function (k) { w.style.setProperty('--' + k, v[k].toFixed(4)); });
      morphPaths(paths, v);
      if (RENDER[kind]) RENDER[kind](w, v);
      var tv = {}; Object.keys(ch).forEach(function (k) { tv[k] = ch[k].target; });
      if (DERIVE[kind]) { var d = DERIVE[kind](tv); Object.keys(d).forEach(function (k) { tv[k] = d[k]; }); }
      whens.forEach(function (o) { o.el.classList.toggle('active', test(o.conds, tv)); });
      hides.forEach(function (o) { var hide = test(o.conds, tv); o.el.classList.toggle('collapsed', hide); var inp = o.el.querySelector('input'); if (inp) inp.disabled = hide; });
      ranges.forEach(function (r) { r.style.setProperty('--fill', (ch[r.dataset.ch].cur * 100).toFixed(1) + '%'); });
    }
    function tick() {
      var moving = false;
      Object.keys(ch).forEach(function (k) {
        var c = ch[k]; c.cur += (c.target - c.cur) * (reduce ? 1 : .1);
        if (Math.abs(c.target - c.cur) < .0008) c.cur = c.target; else moving = true;
      });
      render();
      raf = moving ? requestAnimationFrame(tick) : null;
    }
    function set(k, v) { if (!ch[k]) ch[k] = { cur: 0, target: 0 }; ch[k].target = clamp(v, 0, 1); if (!raf) raf = requestAnimationFrame(tick); }
    ranges.forEach(function (r) {
      var k = r.dataset.ch; if (!ch[k]) ch[k] = { cur: 0, target: 0 };
      r.value = Math.round(ch[k].cur * 100);
      r.addEventListener('input', function () { touched = true; set(k, r.value / 100); });
    });
    function apply(btn) {
      btn.getAttribute('data-set').split(',').forEach(function (kv) { var p = kv.split(':'); set(p[0], +p[1]); });
      Array.prototype.forEach.call(btn.parentNode.children, function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      render();
    }
    w.querySelectorAll('[data-set]').forEach(function (btn) {
      btn.addEventListener('click', function () { touched = true; apply(btn); });
    });
    render();
    var visible = false;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: .3 }).observe(w);
    var cyc = w.querySelector('.seg[data-cycle]');
    if (cyc && !reduce) {
      var timer = setInterval(function () {
        if (touched) { clearInterval(timer); return; }
        if (!visible) return;
        var bs = cyc.querySelectorAll('button'), cur = 0;
        bs.forEach(function (b, i) { if (b.getAttribute('aria-pressed') === 'true') cur = i; });
        apply(bs[(cur + 1) % bs.length]);
      }, 2600);
    }
    var r0 = ranges[0];
    if (r0 && w.hasAttribute('data-demo') && !reduce && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (en, obs) {
        if (!en[0].isIntersecting) return; obs.disconnect();
        [[500, .88], [2600, .45]].forEach(function (s) {
          setTimeout(function () {
            if (touched) return;
            var from = +r0.value, to = s[1] * 100, t0 = null;
            (function anim(t) {
              if (touched) return; if (!t0) t0 = t;
              var kk = clamp((t - t0) / 1500, 0, 1);
              r0.value = Math.round(from + (to - from) * easeInOut(kk)); set(r0.dataset.ch, r0.value / 100);
              if (kk < 1) requestAnimationFrame(anim);
            })(performance.now());
          }, s[0]);
        });
      }, { threshold: .45 }).observe(w);
    }
  }

  /* =================================================================
     Nervous system explorer: choose a part, or send a signal down and back.
     ================================================================= */
  function nervousSystem() {
    var svg = document.querySelector('.ns-svg');
    if (!svg) return;
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.ns-tabs [data-target]'));
    var panels = document.querySelectorAll('.ns-panel');
    var btn = document.querySelector('[data-signal]');
    var status = document.querySelector('.ns-status');
    var down = svg.querySelector('.comet-down'), up = svg.querySelector('.comet-up');
    var footR = svg.querySelector('.ns-ripple:not(.brain-ripple)'), brainR = svg.querySelector('.brain-ripple');
    var busy = false;

    function focus(part, fromKey) {
      svg.setAttribute('data-focus', part);
      tabs.forEach(function (t) {
        var on = t.dataset.target === part;
        t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
        if (on && fromKey) t.focus();
      });
      panels.forEach(function (p) { p.classList.toggle('active', p.dataset.panel === part); });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { focus(t.dataset.target); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          var n = (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
          focus(tabs[n].dataset.target, true);
        }
      });
    });
    function partAt(e) {
      var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      var m = svg.getScreenCTM(); if (!m) return null;
      var q = pt.matrixTransform(m.inverse());
      if (Math.pow((q.x - 180) / 78, 2) + Math.pow((q.y - 74) / 66, 2) <= 1) return 'brain';
      if (Math.abs(q.x - 180) < 16 && q.y > 126 && q.y < 410) return 'cord';
      if (q.y > 126 && q.x > 60 && q.x < 300) return 'nerves';
      return null;
    }
    var lastPart = null;
    svg.addEventListener('click', function (e) { var p = partAt(e); if (p) focus(p); });
    if (canHover) svg.addEventListener('pointermove', function (e) { if (busy) return; var p = partAt(e); if (p && p !== lastPart) { lastPart = p; focus(p); } });
    focus('brain');

    function ripple(el) { el.classList.remove('go'); void el.getBoundingClientRect(); el.classList.add('go'); }
    function comet(path, dur, done) {
      var len = path.getTotalLength(), seg = 70;
      path.style.strokeDasharray = seg + ' ' + (len + seg);
      path.style.opacity = 1;
      var t0 = null;
      function frame(t) {
        if (!t0) t0 = t;
        var k = clamp((t - t0) / dur, 0, 1);
        path.style.strokeDashoffset = seg - (len + seg) * easeInOut(k);
        if (k < 1) requestAnimationFrame(frame);
        else { path.style.opacity = 0; done && done(); }
      }
      requestAnimationFrame(frame);
    }
    function send() {
      if (busy) return;
      busy = true; btn.disabled = true;
      svg.removeAttribute('data-focus');
      status.textContent = 'A command travels down to the muscles…';
      comet(down, 1400, function () {
        ripple(footR);
        status.textContent = 'Feeling travels back up to the brain…';
        setTimeout(function () {
          comet(up, 1400, function () {
            ripple(brainR);
            status.textContent = 'Round trip complete, in a fraction of a second in real life.';
            setTimeout(function () { busy = false; btn.disabled = false; focus(tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0].dataset.target); }, 700);
          });
        }, 250);
      });
    }
    btn.addEventListener('click', send);
    if (!reduce && 'IntersectionObserver' in window) {
      var played = false;
      new IntersectionObserver(function (en, obs) {
        if (en[0].isIntersecting && !played) { played = true; obs.disconnect(); setTimeout(send, 700); }
      }, { threshold: .55 }).observe(svg);
    }
  }

  /* =================================================================
     Slipped disc slider: the bulge grows, touches the nerve, pain runs down the leg.
     ================================================================= */
  function discWidget(w) {
    var range = w.querySelector('.disc-range');
    var shape = w.querySelector('.disc-shape'), nucleus = w.querySelector('.nucleus');
    var nerves = w.querySelectorAll('.nerve'), hot = w.querySelector('.nerve-hot');
    var pain = w.querySelector('.pain'), glow = w.querySelector('.leg-glow'), dot = w.querySelector('.leg-dot');
    var stages = w.querySelectorAll('.disc-stage');
    var labels = ['Healthy disc', 'A bulge', 'Pressing on the nerve'];
    var cur = 0, target = 0, raf = null, stage = -1, touched = false;

    function render(p) {
      var bx = p * 38, h = 15 + p * 9;
      var tip = (266 + bx).toFixed(1), c1 = (250 + bx * .4).toFixed(1);
      shape.setAttribute('d', 'M98 118 H232 C' + c1 + ' 118 ' + tip + ' ' + (145 - h).toFixed(1) + ' ' + tip + ' 145 C' + tip + ' ' + (145 + h).toFixed(1) + ' ' + c1 + ' 172 232 172 H98 C84 172 74 160 74 145 C74 130 84 118 98 118 Z');
      nucleus.setAttribute('cx', (170 + p * 58).toFixed(2));
      nucleus.setAttribute('rx', (48 + p * 12).toFixed(2));
      var c = clamp((p - .62) / .38, 0, 1);
      var bow = (c * 14).toFixed(2);
      var d = 'M300 10 L300 100 Q' + (300 + +bow) + ' 145 300 190 L300 230 Q300 262 330 270 L470 270';
      nerves.forEach(function (n) { n.setAttribute('d', d); });
      hot.style.opacity = c;
      pain.style.opacity = c;
      glow.style.opacity = (c * .45).toFixed(3);
      dot.style.fill = c > .05 ? '#FF6B57' : '#56616B';
      range.style.setProperty('--fill', (p * 100).toFixed(1) + '%');
      var s = p < .33 ? 0 : p < .64 ? 1 : 2;
      if (s !== stage) {
        stage = s;
        stages.forEach(function (el) { el.classList.toggle('active', +el.dataset.stage === s); });
        range.setAttribute('aria-valuetext', labels[s]);
      }
    }
    function tick() {
      cur += (target - cur) * (reduce ? 1 : .14);
      if (Math.abs(target - cur) < .001) cur = target;
      render(cur);
      raf = cur === target ? null : requestAnimationFrame(tick);
    }
    function set(v) { target = clamp(v, 0, 1); if (!raf) raf = requestAnimationFrame(tick); }
    range.addEventListener('input', function () { touched = true; set(range.value / 100); });
    render(0);

    if (!reduce && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (en, obs) {
        if (!en[0].isIntersecting) return;
        obs.disconnect();
        var seq = [[600, .86], [2600, .45]];
        seq.forEach(function (s) {
          setTimeout(function () {
            if (touched) return;
            var from = +range.value, to = s[1] * 100, t0 = null;
            (function anim(t) {
              if (touched) return;
              if (!t0) t0 = t;
              var k = clamp((t - t0) / 1400, 0, 1);
              range.value = Math.round(from + (to - from) * easeInOut(k));
              set(range.value / 100);
              if (k < 1) requestAnimationFrame(anim);
            })(performance.now());
          }, s[0]);
        });
      }, { threshold: .5 }).observe(w);
    }
  }

  /* =================================================================
     Insula: the folds part as you scroll, or when tapped.
     ================================================================= */
  function insula() {
    var sec = document.querySelector('[data-insula]');
    if (!sec) return;
    var fig = sec.querySelector('.insula-figure');
    var cur = 0, forced = null, raf = null, paths = prepPaths(fig);
    function targetP() {
      if (forced !== null) return forced;
      if (reduce) return 1;
      var r = fig.getBoundingClientRect(), vh = window.innerHeight;
      return clamp((vh * .85 - r.top) / (vh * .55), 0, 1);
    }
    function tick() {
      var t = targetP();
      cur += (t - cur) * .12;
      if (Math.abs(t - cur) < .002) cur = t;
      fig.style.setProperty('--p', cur.toFixed(4));
      morphPaths(paths, { p: easeInOut(cur) });
      raf = cur === t ? null : requestAnimationFrame(tick);
    }
    var kick = function () { if (!raf) raf = requestAnimationFrame(tick); };
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', kick);
    fig.addEventListener('click', function () {
      forced = cur > .5 ? 0 : 1;
      fig.setAttribute('aria-pressed', String(forced === 1));
      kick();
    });
    kick();
  }

  /* =================================================================
     Numbers count up when they come into view.
     ================================================================= */
  function counters() {
    var els = document.querySelectorAll('[data-count]');
    if (!els.length || reduce || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target, end = +el.dataset.count, t0 = null;
        (function f(t) {
          if (!t0) t0 = t;
          var k = clamp((t - t0) / 1800, 0, 1);
          el.textContent = Math.round(end * easeOut(k));
          if (k < 1) requestAnimationFrame(f);
        })(performance.now());
      });
    }, { threshold: .6 });
    els.forEach(function (el) { el.textContent = '0'; io.observe(el); });
  }
})();
