/* ─────────────────────────────────────────────
   Portfolio Script
───────────────────────────────────────────── */

/* ── Cinematic hero sequence ──────────────────
   After every animated element finishes, strip
   will-change so the browser can free compositor
   layers. The last element to complete is cin-cta
   (delay 4.05s + duration 0.9s ≈ 4.95s).
────────────────────────────────────────────── */
(function initCinematicHero() {
  const cinEls = document.querySelectorAll(
    '.cin-tag, .cin-line, .cin-sub, .cin-cta'
  );

  // Guard: if reduced-motion, nothing to clean up — exit immediately
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    cinEls.forEach(el => { el.style.willChange = 'auto'; });
    return;
  }

  // After the full sequence ends, strip will-change from every element
  const SEQUENCE_END_MS = 4950; // cin-cta delay(4050) + duration(900)
  setTimeout(() => {
    cinEls.forEach(el => { el.style.willChange = 'auto'; });
  }, SEQUENCE_END_MS);
})();

/* ── Device capability detection ── */
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
const isLowEnd = (() => {
  if (!isTouchDevice) return false;
  const mem   = navigator.deviceMemory;
  const cores = navigator.hardwareConcurrency;
  const conn  = navigator.connection?.effectiveType;
  if (mem  !== undefined && mem  >= 8) return false;
  if (mem  !== undefined && mem  <= 4) return true;
  if (cores !== undefined && cores <= 6) return true;
  if (conn === '2g' || conn === 'slow-2g' || conn === '3g') return true;
  return false;
})();
if (isLowEnd) document.documentElement.classList.add('low-end');

/* ── Custom Cursor (desktop only) ── */
const cursor         = document.getElementById('cursor');
const cursorFollower = document.getElementById('cursorFollower');

if (!isTouchDevice) {
  let mouseX = 0, mouseY = 0;
  let followerX = 0, followerY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top  = mouseY + 'px';
  });

  function animateFollower() {
    followerX += (mouseX - followerX) * 0.1;
    followerY += (mouseY - followerY) * 0.1;
    cursorFollower.style.left = followerX + 'px';
    cursorFollower.style.top  = followerY + 'px';
    requestAnimationFrame(animateFollower);
  }
  animateFollower();

  const hoverTargets = document.querySelectorAll(
    'a, button, .portfolio-card, .service-card, .tab, .contact-link, .about-name-text'
  );
  hoverTargets.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('hover');
      cursorFollower.classList.add('hover');
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('hover');
      cursorFollower.classList.remove('hover');
    });
  });
}

/* ── Nav scroll behaviour ── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ── Mobile menu ── */
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
let menuOpen = false;

hamburger.addEventListener('click', () => {
  menuOpen = !menuOpen;
  hamburger.classList.toggle('open', menuOpen);
  mobileMenu.classList.toggle('open', menuOpen);
  document.body.style.overflow = menuOpen ? 'hidden' : '';
});

document.querySelectorAll('.mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    menuOpen = false;
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  });
});

/* ── Scroll-reveal ── */
const revealElements = document.querySelectorAll(
  '.reveal-up, .reveal-left, .reveal-scale'
);

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

revealElements.forEach(el => revealObserver.observe(el));

/* ── Counter animation ── */
function animateCounter(el, target, duration = 1800) {
  const start     = performance.now();
  const startVal  = 0;

  function update(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.round(startVal + (target - startVal) * eased);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el     = entry.target;
        const target = parseInt(el.dataset.target, 10);
        animateCounter(el, target);
        counterObserver.unobserve(el);
      }
    });
  },
  { threshold: 0.5 }
);

document.querySelectorAll('.stat-num').forEach(el => counterObserver.observe(el));

/* ── Coverflow Slider ── */
function initCoverflow(stageId, dotsId, onActivate) {
  const stage = document.getElementById(stageId);
  const dotsEl = document.getElementById(dotsId);
  if (!stage) return;

  const cfItems = Array.from(stage.querySelectorAll('.cf-item'));
  const total   = cfItems.length;
  let active    = 0; // start at first item (CUET)

  /* Circular distance: shortest arc so positions are always -1, 0, +1 for 3 items */
  function getPos(i, activeIdx) {
    let pos = i - activeIdx;
    const half = Math.floor(total / 2);
    if (pos >  half) pos -= total;
    if (pos < -half) pos += total;
    return pos;
  }

  /* Shortest-path direction: +1 = forward, -1 = backward */
  function getDir(from, to) {
    let d = to - from;
    if (d >  total / 2) d -= total;
    if (d < -total / 2) d += total;
    return d >= 0 ? 1 : -1;
  }

  function applyItemStyle(item, pos, cardW) {
    const isMob = window.innerWidth <= 600;
    const step  = cardW * (isMob ? 0.68 : 0.74);
    const abs   = Math.abs(pos);
    const tx    = pos * step;
    const tz    = isLowEnd ? 0 : -(abs * (isMob ? 55 : 85));
    const ry    = isLowEnd ? 0 : -(pos * (isMob ? 15 : 20));
    const sc    = abs === 0 ? 1 : Math.max(0.48, 0.82 - (abs - 1) * 0.18);
    const op    = abs === 0 ? 1 : Math.max(0.12, 0.72 - abs * 0.24);
    item.style.transform = `translateX(calc(-50% + ${tx}px)) translateY(-50%) translateZ(${tz}px) rotateY(${ry}deg) scale(${sc})`;
    item.style.opacity   = op;
    item.style.zIndex    = 10 - abs;
  }

  function render(instant) {
    const cardW = cfItems[0]?.offsetWidth || 460;
    cfItems.forEach((item, i) => {
      const pos = getPos(i, active);
      if (instant) item.style.transition = 'none';
      applyItemStyle(item, pos, cardW);
      item.classList.toggle('cf-active', pos === 0);
      if (instant) requestAnimationFrame(() => { item.style.transition = ''; });

      const vid = item.querySelector('.card-preview');
      if (vid) {
        if (pos === 0) {
          vid.setAttribute('preload', 'auto');
          vid.currentTime = 0;
          vid.play().catch(() => {});
        } else {
          vid.pause();
          if (!isTouchDevice) {
            if (vid.readyState >= 1 && vid.duration && !isNaN(vid.duration)) {
              vid.currentTime = vid.duration * 0.15;
            } else {
              if (vid.getAttribute('preload') === 'none') vid.setAttribute('preload', 'metadata');
            }
          }
        }
      }
    });

    /* dots */
    if (dotsEl) {
      dotsEl.querySelectorAll('.cf-dot').forEach((d, i) =>
        d.classList.toggle('active', i === active));
    }

    /* auto-size stage to center card height */
    if (instant) {
      const centerCard = cfItems[active]?.querySelector('.cf-card');
      if (centerCard && centerCard.offsetHeight > 0) {
        stage.style.height = (centerCard.offsetHeight + 16) + 'px';
      }
    }
  }

  function goTo(idx) {
    const prevActive = active;
    active = ((idx % total) + total) % total;
    if (prevActive === active) return;

    const dir   = getDir(prevActive, active);
    const cardW = cfItems[0]?.offsetWidth || 460;

    cfItems.forEach((item, i) => {
      const oldPos = getPos(i, prevActive);
      const newPos = getPos(i, active);
      if (Math.abs(newPos - oldPos) > 1) {
        item.style.transition = 'none';
        applyItemStyle(item, newPos + dir, cardW);
        void item.offsetHeight;
        item.style.transition = '';
      }
    });

    render(false);
  }

  /* arrows */
  const outer = stage.closest('.cf-outer');
  outer.querySelector('.cf-prev')?.addEventListener('click', () => goTo(active - 1));
  outer.querySelector('.cf-next')?.addEventListener('click', () => goTo(active + 1));

  /* dots */
  if (dotsEl) {
    dotsEl.querySelectorAll('.cf-dot').forEach((d, i) =>
      d.addEventListener('click', () => goTo(i)));
  }

  /* item click: non-active → center it; active → trigger callback */
  cfItems.forEach((item, i) => {
    item.addEventListener('click', e => {
      if (!item.classList.contains('cf-active')) {
        e.preventDefault();
        goTo(i);
      } else if (onActivate) {
        onActivate(item, e);
      }
    });
  });

  /* touch swipe */
  let tx0 = 0;
  stage.addEventListener('touchstart', e => { tx0 = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend',   e => {
    const d = tx0 - e.changedTouches[0].clientX;
    if (Math.abs(d) > 46) goTo(active + (d > 0 ? 1 : -1));
  }, { passive: true });

  /* resize */
  window.addEventListener('resize', () => render(true), { passive: true });

  render(true);
}

/* Init video coverflow */
initCoverflow('videoCF', 'videoDots', item => {
  const src = item.dataset.video;
  if (src) openLightbox(src);
});

/* Init web coverflow */
initCoverflow('webCF', 'webDots', item => {
  const href   = item.dataset.href;
  const target = item.dataset.target || '_self';
  if (href) window.open(href, target);
});

/* ── Contact form (Formspree) ───────────────────────────────────────────
   1. Go to formspree.io → sign up → New Form
   2. Copy your endpoint and paste it below (replaces YOUR_FORM_ENDPOINT)
   Example: 'https://formspree.io/f/abcdefgh'
────────────────────────────────────────────────────────────────────────── */
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mkokgwbo';

const form = document.getElementById('contactForm');
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const btn  = form.querySelector('button[type="submit"]');
  const span = btn.querySelector('span');
  const orig = span.textContent;

  /* loading state */
  btn.disabled      = true;
  span.textContent  = 'Sending…';
  btn.style.opacity = '0.7';

  try {
    const res = await fetch(FORMSPREE_ENDPOINT, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        name:    document.getElementById('name').value.trim(),
        email:   document.getElementById('email').value.trim(),
        service: document.getElementById('service').value,
        message: document.getElementById('message').value.trim(),
      }),
    });

    const data = await res.json();

    if (res.ok) {
      /* success */
      span.textContent     = 'Message Sent!';
      btn.style.background = 'var(--accent)';
      btn.style.opacity    = '1';
      form.reset();
      setTimeout(() => {
        span.textContent     = orig;
        btn.disabled         = false;
        btn.style.background = '';
      }, 3500);
    } else {
      throw new Error(data?.error || 'Submission failed');
    }

  } catch (err) {
    console.error('Form error:', err);
    span.textContent     = 'Failed — try again';
    btn.style.background = '#ff4d4d';
    btn.style.opacity    = '1';
    setTimeout(() => {
      span.textContent     = orig;
      btn.disabled         = false;
      btn.style.background = '';
    }, 3500);
  }
});

/* ── Parallax hero orbs on mouse move ── */
const heroSection = document.querySelector('.hero');
const orbs = document.querySelectorAll('.hero-orb');

if (heroSection) {
  heroSection.addEventListener('mousemove', (e) => {
    const rect    = heroSection.getBoundingClientRect();
    const centerX = rect.width  / 2;
    const centerY = rect.height / 2;
    const dx = (e.clientX - rect.left - centerX) / centerX;
    const dy = (e.clientY - rect.top  - centerY) / centerY;

    orbs.forEach((orb, i) => {
      const depth  = (i + 1) * 12;
      orb.style.transform = `translate(${dx * depth}px, ${dy * depth}px)`;
    });
  });
}

/* ── Active nav link on scroll ── */
const sections    = document.querySelectorAll('section[id]');
const navAnchors  = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navAnchors.forEach(a => a.classList.remove('active'));
        const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  },
  { threshold: 0.4 }
);

sections.forEach(s => sectionObserver.observe(s));


/* ── Smooth anchor scroll override ── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* ── Add active link styling dynamically ── */
const style = document.createElement('style');
style.textContent = `.nav-links a.active { color: var(--white) !important; }
.nav-links a.active::after { width: 100% !important; }`;
document.head.appendChild(style);

/* ── Video card thumbnails ──────────────────────────────────────────────
   Seek each card preview to 1s so the thumbnail is more representative
   than frame 0 (which is often black).
────────────────────────────────────────────────────────────────────────── */
document.querySelectorAll('.card-preview').forEach(vid => {
  vid.addEventListener('loadedmetadata', () => {
    vid.currentTime = vid.duration * 0.15;
  });
  vid.addEventListener('seeked', () => {
    vid.classList.add('loaded');
  });
});

/* ── Video Lightbox ─────────────────────────────────────────────────────*/
const lightbox       = document.getElementById('videoLightbox');
const lightboxVideo  = document.getElementById('lightboxVideo');
const lightboxSource = document.getElementById('lightboxSource');
const lightboxClose  = document.getElementById('lightboxClose');
const lightboxOverlay = document.getElementById('lightboxOverlay');

function openLightbox(src) {
  lightboxSource.src = src;
  lightboxVideo.load();
  lightboxVideo.play().catch(() => {});
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('open');
  lightboxVideo.pause();
  lightboxVideo.currentTime = 0;
  lightboxSource.src = '';
  document.body.style.overflow = '';
}

lightboxClose.addEventListener('click', closeLightbox);
lightboxOverlay.addEventListener('click', closeLightbox);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLightbox();
});

/* video-card click now handled by coverflow onActivate callback */

/* ── Particle canvas system ─────────────────────────────────────────────
   Reusable per-canvas particle engine. Each canvas gets an independent
   loop that pauses via IntersectionObserver when off-screen and via
   visibilitychange when the tab is hidden.
   Call createParticles(canvasEl, configOverrides) for each canvas.
────────────────────────────────────────────────────────────────────────── */
function createParticles(canvas, overrides) {
  if (!canvas) return;
  const ctx    = canvas.getContext('2d');
  const ACCENT = '200, 255, 0';

  const CFG = Object.assign({
    countDesk:   65,
    countMob:    32,
    connectDist: 130,
    noLines:     false,
    minSpeed:    0.10,
    maxSpeed:    0.28,
    minRadius:   0.7,
    maxRadius:   1.5,
    minOpacity:  0.30,
    maxOpacity:  0.70,
    lineAlpha:   0.072,
    haloScale:   3.8,
    haloAlpha:   0.10,
  }, overrides || {});

  let W, H, particles, raf;
  let active = true;

  const rand  = (a, b) => a + Math.random() * (b - a);
  const isMob = ()     => window.innerWidth < 768;

  function mkParticle() {
    const angle = Math.random() * Math.PI * 2;
    const spd   = rand(CFG.minSpeed, CFG.maxSpeed);
    return {
      x: Math.random() * W,  y: Math.random() * H,
      vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
      r:  rand(CFG.minRadius, CFG.maxRadius),
      op: rand(CFG.minOpacity, CFG.maxOpacity),
    };
  }

  function init() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    particles = Array.from(
      { length: isMob() ? CFG.countMob : CFG.countDesk },
      mkParticle
    );
  }

  function tick() {
    if (!active) return;
    ctx.clearRect(0, 0, W, H);

    /* connection lines — skipped on mobile/low-end (O(n²) cost) */
    if (!CFG.noLines) {
      ctx.lineWidth = 0.6;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b    = particles[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < CFG.connectDist) {
            const alpha = (1 - dist / CFG.connectDist) * CFG.lineAlpha;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${ACCENT},${alpha.toFixed(3)})`;
            ctx.stroke();
          }
        }
      }
    }

    /* dots: halo + core + move */
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * CFG.haloScale, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${ACCENT},${(p.op * CFG.haloAlpha).toFixed(3)})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${ACCENT},${p.op.toFixed(3)})`;
      ctx.fill();

      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x += W; else if (p.x > W) p.x -= W;
      if (p.y < 0) p.y += H; else if (p.y > H) p.y -= H;
    });

    raf = requestAnimationFrame(tick);
  }

  /* pause on hidden tab */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else if (active) tick();
  });

  /* pause when section scrolls out of view */
  const section = canvas.closest('section, footer') || canvas.parentElement;
  new IntersectionObserver(([entry]) => {
    active = entry.isIntersecting;
    if (active) tick(); else cancelAnimationFrame(raf);
  }, { threshold: 0 }).observe(section);

  /* debounced resize */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(init, 200);
  }, { passive: true });

  init();
  tick();
}

/* ── Initialise all particle canvases (desktop only) ── */
if (!isTouchDevice && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  createParticles(document.getElementById('particleCanvas'));

  document.querySelectorAll('.section-particles').forEach(canvas => {
    createParticles(canvas, {
      countDesk:   48,
      connectDist: 115,
      lineAlpha:   0.058,
      minOpacity:  0.22,
      maxOpacity:  0.55,
    });
  });
}

/* ── Skill logo tooltips ── */
(function initSkillTooltips() {
  const tooltip    = document.getElementById('skillTooltip');
  const tooltipImg = document.getElementById('skillTooltipImg');
  if (!tooltip || !tooltipImg) return;

  const OFFSET = 20; // px gap from cursor

  function position(e) {
    const tw = tooltip.offsetWidth  || 96;
    const th = tooltip.offsetHeight || 96;
    let x = e.clientX + OFFSET;
    let y = e.clientY + OFFSET;
    if (x + tw > window.innerWidth  - 8) x = e.clientX - tw - OFFSET;
    if (y + th > window.innerHeight - 8) y = e.clientY - th - OFFSET;
    tooltip.style.left = x + 'px';
    tooltip.style.top  = y + 'px';
  }

  document.querySelectorAll('.skill-item[data-logo]').forEach(item => {
    item.addEventListener('mouseenter', (e) => {
      tooltipImg.src = item.dataset.logo;
      tooltipImg.alt = item.textContent.trim();
      position(e);
      tooltip.classList.add('visible');
    });
    item.addEventListener('mousemove', position);
    item.addEventListener('mouseleave', () => {
      tooltip.classList.remove('visible');
    });
  });
})();

