/* Truly Digital Solutions — interactions */
(() => {
  const doc = document.documentElement;
  doc.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- Business hours (America/New_York) ---------- */
  const HOURS = [
    // 0 = Sunday
    { d: 'Sunday', open: null },
    { d: 'Monday', open: 10, close: 17 },
    { d: 'Tuesday', open: null },
    { d: 'Wednesday', open: 10, close: 17 },
    { d: 'Thursday', open: null },
    { d: 'Friday', appt: true },
    { d: 'Saturday', open: null },
  ];
  const nowET = () => {
    const p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
    const get = t => p.find(x => x.type === t)?.value;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return { day: days.indexOf(get('weekday')), h: (+get('hour') % 24) + (+get('minute')) / 60 };
  };
  const fmt = h => { const hr = Math.floor(h); const m = Math.round((h - hr) * 60); const ap = hr >= 12 ? 'pm' : 'am'; return `${((hr + 11) % 12) + 1}${m ? ':' + String(m).padStart(2, '0') : ''}${ap}`; };
  const nextOpen = day => {
    for (let i = 1; i <= 7; i++) { const d = HOURS[(day + i) % 7]; if (d.open != null) return `${i === 1 ? 'tomorrow' : d.d} ${fmt(d.open)}`; }
    return '';
  };
  const status = () => {
    const { day, h } = nowET(); const t = HOURS[day];
    if (t.open != null && h >= t.open && h < t.close) return { open: true, text: `Open now · until ${fmt(t.close)} ET` };
    if (t.appt) return { open: true, text: 'Today by appointment · call to book' };
    if (t.open != null && h < t.open) return { open: false, text: `Opens today ${fmt(t.open)} ET` };
    return { open: false, text: `Closed · opens ${nextOpen(day)} ET` };
  };
  const paintStatus = () => {
    const s = status();
    $$('[data-status]').forEach(el => { el.classList.toggle('closed', !s.open); const t = $('span', el); if (t) t.textContent = s.text; });
    const { day } = nowET();
    $$('.hours li').forEach(li => li.classList.toggle('today', +li.dataset.day === day));
  };
  paintStatus(); setInterval(paintStatus, 60000);
  $$('[data-year]').forEach(el => (el.textContent = new Date().getFullYear()));

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.1, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href'); if (id.length < 2) return;
      const el = $(id); if (!el) return; e.preventDefault(); lenis.scrollTo(el, { offset: -90 });
    }));
  }

  /* ---------- Page transition ---------- */
  if (doc.classList.contains('entering')) {
    // rAF is paused in background tabs, so a timer backs it up and the overlay always clears
    let done = false;
    const uncover = () => {
      if (done) return; done = true;
      doc.classList.remove('entering');
      const w = $('.wipe'); if (!w) return;
      w.style.clipPath = 'inset(100% 0 0 0)';
      setTimeout(() => (w.style.clipPath = ''), 700);
    };
    requestAnimationFrame(() => requestAnimationFrame(uncover));
    setTimeout(uncover, 300);
  }
  addEventListener('pageshow', e => { if (e.persisted) doc.classList.remove('leaving', 'entering'); });
  if (!reduce) {
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || a.target === '_blank') return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname) || (url.pathname === location.pathname && url.hash)) return;
      e.preventDefault();
      try { sessionStorage.setItem('tt-wipe', '1'); } catch { }
      doc.classList.add('leaving');
      setTimeout(() => (location.href = url.href), 520);
    });
  }

  /* ---------- Header: hide on scroll down ---------- */
  const header = $('.site-header');
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    if (header && !doc.classList.contains('menu-open')) header.classList.toggle('hide', y > lastY && y > 300);
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  const menuBtn = $('.menu-btn');
  const menu = $('.mobile-menu');
  const setMenu = open => {
    doc.classList.toggle('menu-open', open);
    menuBtn?.setAttribute('aria-expanded', String(open));
    menu?.setAttribute('aria-hidden', String(!open));
    if (menu) menu.inert = !open;
    open ? lenis?.stop() : lenis?.start();
    document.body.style.overflow = open ? 'hidden' : '';
  };
  if (menu) menu.inert = true;
  menuBtn?.addEventListener('click', () => setMenu(!doc.classList.contains('menu-open')));
  $$('.mobile-menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && doc.classList.contains('menu-open')) { setMenu(false); menuBtn?.focus(); } });

  /* ---------- Split headline lines ---------- */
  $$('[data-split]').forEach(el => {
    const html = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = html.map((l, i) => `<span class="line split-line" style="--d:${(i * 0.09 + (+el.dataset.delay || 0)).toFixed(2)}s"><span>${l.trim()}</span></span>`).join('');
    el.setAttribute('data-reveal-lines', '');
  });

  /* ---------- Reveal on view ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      $$('.split-line', en.target).forEach(l => l.classList.add('in'));
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  $$('[data-reveal], [data-reveal-lines]').forEach(el => io.observe(el));
  // stagger children
  $$('[data-stagger]').forEach(g => $$(':scope > *', g).forEach((c, i) => { c.setAttribute('data-reveal', c.getAttribute('data-reveal') || ''); c.style.setProperty('--d', `${i * 0.08}s`); io.observe(c); }));

  /* ---------- Spotlight cards ---------- */
  $$('.spot').forEach(el => el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  }));

  /* ---------- Magnetic buttons ---------- */
  if (!reduce && matchMedia('(pointer: fine)').matches) {
    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.22, y = (e.clientY - r.top - r.height / 2) * 0.3;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener('pointerleave', () => (el.style.transform = ''));
    });
  }

  /* ---------- Reactor: electric arcs around the logo ---------- */
  const reactor = $('.reactor');
  if (reactor) {
    const cv = $('canvas', reactor);
    const ctx = cv.getContext('2d');
    const logo = $('.logo-3d', reactor);
    let W, H, dpr, running = true;
    const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); addEventListener('resize', size);

    const particles = Array.from({ length: 70 }, () => ({ a: Math.random() * Math.PI * 2, r: 0.3 + Math.random() * 0.2, s: (Math.random() * 0.002 + 0.0006) * (Math.random() < .5 ? -1 : 1), z: Math.random() }));
    let bolts = [];
    const bolt = () => {
      const cx = W / 2, cy = H / 2, R = Math.min(W, H);
      const a1 = Math.random() * Math.PI * 2, a2 = a1 + (Math.random() - 0.5) * 1.6;
      const r1 = R * (0.3 + Math.random() * 0.12), r2 = R * (0.3 + Math.random() * 0.14);
      const p1 = [cx + Math.cos(a1) * r1, cy + Math.sin(a1) * r1], p2 = [cx + Math.cos(a2) * r2, cy + Math.sin(a2) * r2];
      const pts = [p1]; const n = 10;
      for (let i = 1; i < n; i++) {
        const t = i / n; const jitter = R * 0.03;
        pts.push([p1[0] + (p2[0] - p1[0]) * t + (Math.random() - 0.5) * jitter, p1[1] + (p2[1] - p1[1]) * t + (Math.random() - 0.5) * jitter]);
      }
      pts.push(p2);
      bolts.push({ pts, life: 1 });
    };
    let mx = 0, my = 0, tx = 0, ty = 0;
    if (matchMedia('(pointer: fine)').matches) {
      addEventListener('pointermove', e => { mx = (e.clientX / innerWidth - 0.5); my = (e.clientY / innerHeight - 0.5); }, { passive: true });
    }
    const vis = new IntersectionObserver(([en]) => { running = en.isIntersecting; if (running) requestAnimationFrame(loop); });
    vis.observe(reactor);
    let last = 0;
    function loop(t) {
      if (!running) return;
      const dt = Math.min(50, t - last); last = t;
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2, R = Math.min(W, H);
      // particles on orbits
      particles.forEach(p => {
        p.a += p.s * dt * (reduce ? 0 : 1);
        const x = cx + Math.cos(p.a) * R * p.r, y = cy + Math.sin(p.a) * R * p.r * 0.92;
        ctx.beginPath(); ctx.arc(x, y, 0.6 + p.z * 1.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(127,242,238,${0.15 + p.z * 0.55})`; ctx.fill();
      });
      // bolts
      if (!reduce && Math.random() < 0.035) bolt();
      bolts.forEach(b => {
        ctx.save();
        ctx.globalAlpha = b.life;
        ctx.shadowColor = '#30CAC9'; ctx.shadowBlur = 14;
        ctx.strokeStyle = '#BFFFFD'; ctx.lineWidth = 1.2;
        ctx.beginPath(); b.pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
        ctx.restore();
        b.life -= 0.045;
      });
      bolts = bolts.filter(b => b.life > 0);
      // tilt
      tx += (mx - tx) * 0.06; ty += (my - ty) * 0.06;
      logo.style.transform = `rotateY(${tx * 18}deg) rotateX(${-ty * 18}deg) translate3d(${tx * 14}px, ${ty * 14}px, 0)`;
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  /* ---------- Process progress line ---------- */
  const steps = $('.steps');
  if (steps) {
    const bar = $('.progress', steps); const items = $$('.step', steps);
    const upd = () => {
      const r = steps.getBoundingClientRect(); const mid = innerHeight * 0.6;
      const pct = Math.max(0, Math.min(1, (mid - r.top - 30) / (r.height - 60)));
      bar.style.height = `${pct * (r.height - 60)}px`;
      items.forEach(it => { const ir = it.getBoundingClientRect(); it.classList.toggle('on', ir.top + 28 < mid); });
    };
    addEventListener('scroll', upd, { passive: true }); upd();
  }

  /* ---------- Gallery: drag + buttons ---------- */
  $$('.gallery').forEach(g => {
    const tr = $('.gallery-track', g);
    let down = false, sx = 0, sl = 0, moved = false;
    tr.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = tr.scrollLeft; });
    addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) { moved = true; tr.classList.add('dragging'); } tr.scrollLeft = sl - dx; });
    addEventListener('pointerup', () => { down = false; tr.classList.remove('dragging'); });
    tr.addEventListener('click', e => { if (moved) e.preventDefault(); }, true);
    const step = () => ($('.shot', tr)?.offsetWidth || 300) + 16;
    $('[data-prev]', g.parentElement)?.addEventListener('click', () => tr.scrollBy({ left: -step() * 2, behavior: 'smooth' }));
    $('[data-next]', g.parentElement)?.addEventListener('click', () => tr.scrollBy({ left: step() * 2, behavior: 'smooth' }));
  });

  /* ---------- Testimonials ---------- */
  const qs = $('.quotes');
  if (qs) {
    const items = $$('.quote', qs); const bars = $$('.q-bars button');
    let i = 0, timer;
    const go = n => {
      i = (n + items.length) % items.length;
      items.forEach((q, k) => q.classList.toggle('on', k === i));
      bars.forEach((b, k) => { b.classList.remove('on', 'done'); void b.offsetWidth; if (k < i) b.classList.add('done'); if (k === i) b.classList.add('on'); b.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      clearTimeout(timer); if (!reduce) timer = setTimeout(() => go(i + 1), 7000);
    };
    bars.forEach((b, k) => b.addEventListener('click', () => go(k)));
    $('[data-qprev]')?.addEventListener('click', () => go(i - 1));
    $('[data-qnext]')?.addEventListener('click', () => go(i + 1));
    go(0);
  }

  /* ---------- FAQ: animate details ---------- */
  $$('.faq-item').forEach(d => {
    const s = $('summary', d), body = $('.faq-body', d);
    s.addEventListener('click', e => {
      if (reduce) return;
      e.preventDefault();
      if (d.open) {
        const h = body.scrollHeight; body.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.22,1,.36,1)' }).onfinish = () => (d.open = false);
      } else {
        d.open = true; const h = body.scrollHeight; body.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.22,1,.36,1)' });
      }
    });
  });

  /* ---------- Before / after sliders ---------- */
  $$('.ba').forEach(ba => {
    const r = $('input', ba);
    const set = () => ba.style.setProperty('--pos', r.value + '%');
    r.addEventListener('input', set); set();
  });

  /* ---------- Care plan billing toggle ---------- */
  $$('[data-billing-toggle]').forEach(g => {
    const grid = $('[data-billing]', g.closest('section'));
    $$('button', g).forEach(b => b.addEventListener('click', () => {
      $$('button', g).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      grid.dataset.billing = b.dataset.period;
    }));
  });

  /* ---------- Copy buttons (SAM IDs) ---------- */
  $$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    const src = b.previousElementSibling; if (src?.classList.contains('todo')) return;
    const v = b.dataset.copy || src?.textContent.trim(); if (!v) return;
    try { await navigator.clipboard.writeText(v); b.classList.add('ok'); b.setAttribute('aria-label', 'Copied'); setTimeout(() => { b.classList.remove('ok'); b.setAttribute('aria-label', 'Copy'); }, 1600); } catch { }
  }));

  /* ---------- Contact form → email draft ---------- */
  const form = $('#contact-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const f = new FormData(form);
      const need = f.getAll('need').join(', ') || 'Not specified';
      const body = [
        `Name: ${f.get('name')}`, `Email: ${f.get('email')}`, `Phone: ${f.get('phone') || '-'}`,
        `Business: ${f.get('business') || '-'}`, `Current website: ${f.get('site') || '-'}`, `Interested in: ${need}`, '', f.get('message') || ''
      ].join('\n');
      const subj = `New inquiry — ${f.get('business') || f.get('name')}`;
      location.href = `mailto:TDSolutions@trutech.us?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
      $('.form-done', form.parentElement)?.classList.add('show');
    });
    $$('[data-audit]').forEach(a => a.addEventListener('click', () => { const c = $('input[value="Site audit"]', form); if (c) c.checked = true; }));
    // Preselect from ?need= or #audit
    if (location.hash === '#audit') { const c = $('input[value="Site audit"]', form); if (c) c.checked = true; }
    const need = new URLSearchParams(location.search).get('need');
    if (need) $$(`input[name="need"][value="${CSS.escape(need)}"]`, form).forEach(i => (i.checked = true));
  }
})();
