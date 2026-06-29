(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // =====================
  // Year
  // =====================
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // =====================
  // Mobile nav toggle
  // =====================
  const navToggle = $('#navToggle');
  const navMenu = $('#navMenu');
  if (navToggle && navMenu) {
    const setOpen = (open) => {
      navToggle.setAttribute('aria-expanded', String(open));
      navMenu.classList.toggle('is-open', open);
      navMenu.dataset.open = open ? 'true' : 'false';
    };

    navToggle.addEventListener('click', () => {
      const open = navToggle.getAttribute('aria-expanded') !== 'true';
      setOpen(open);
    });

    // Close on link click
    $$('.nav__link', navMenu).forEach((a) => {
      a.addEventListener('click', () => setOpen(false));
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (navMenu.dataset.open !== 'true') return;
      if (navMenu.contains(e.target) || navToggle.contains(e.target)) return;
      setOpen(false);
    });

    // ESC
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (navMenu.dataset.open === 'true') setOpen(false);
    });
  }

  // =====================
  // Smooth scroll with offset for sticky header
  // =====================
  const header = $('.site-header');
  const headerHeight = () => (header ? header.getBoundingClientRect().height : 0);
  $$('.nav__link[href^="#"], a[href^="#"]').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href || href === '#') return;
    if (!href.startsWith('#')) return;

    a.addEventListener('click', (e) => {
      const id = href.slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();

      const y = target.getBoundingClientRect().top + window.scrollY - headerHeight() - 10;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });

  // =====================
  // Animated counters (hero panel stats)
  // =====================
  const counters = $$('.stat__num[data-count]');
  const animateCount = (el) => {
    const to = Number(el.dataset.count || '0');
    const start = 0;
    const duration = 900;
    const startTime = performance.now();

    const tick = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.round(start + (to - start) * eased);
      el.textContent = String(val);
      if (t < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  if (counters.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((ent) => {
          if (!ent.isIntersecting) return;
          animateCount(ent.target);
          io.unobserve(ent.target);
        });
      },
      { threshold: 0.35 }
    );
    counters.forEach((el) => io.observe(el));
  }

  // =====================
  // Projects dataset + rendering
  // =====================
  const projects = [
    {
      id: 'Semco',
      title: 'Semco saudielemech',
      category: ['web', 'ui'],
      tags: ['UI', 'UX'],
      links: { live: 'https://saudielemech.com/', repo: '#' },
        badge: 'UI/UX',
        desc: 'A modern and responsive website for Semco Saudielemech, showcasing their services and projects with a focus on user experience and design.'
    },
    
  ];

  const grid = $('#projectsGrid');
  const empty = $('#projectsEmpty');
  const search = $('#projectSearch');
  const filterBtns = $$('.segmented__btn');

  let activeFilter = 'all';
  let query = '';

  const escapeHtml = (str) =>
    String(str).replace(/[&<>"]+/g, (m) => ({ '&': '&amp;', '<': '<', '>': '>', '"': '"' }[m]));

  const projectCard = (p) => `
    <article class="project" data-categories="${p.category.join(' ')}" aria-label="${escapeHtml(p.title)}">
      <div class="project__media">
        <div class="project__badge">${escapeHtml(p.badge)}</div>
        <div class="project__actions" aria-hidden="true">
          <button class="smallbtn" type="button" data-action="repo" aria-label="Repository" data-id="${escapeHtml(p.id)}">⤓</button>
          <button class="smallbtn" type="button" data-action="live" aria-label="Live demo" data-id="${escapeHtml(p.id)}">↗</button>
        </div>
      </div>
      <div class="project__body">
        <h3 class="project__title">${escapeHtml(p.title)}</h3>
        <p class="project__desc">${escapeHtml(p.desc)}</p>
        <div class="project__tags">${p.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
      </div>
    </article>
  `;

  const matches = (p) => {
    const catOk = activeFilter === 'all' ? true : p.category.includes(activeFilter);
    const q = query.trim().toLowerCase();
    if (!q) return catOk;

    const hay = `${p.title} ${p.desc} ${p.category.join(' ')} ${p.tags.join(' ')}`.toLowerCase();
    return catOk && hay.includes(q);
  };

  const renderProjects = () => {
    if (!grid || !empty) return;

    const filtered = projects.filter(matches);
    grid.innerHTML = filtered.map(projectCard).join('');

    empty.hidden = filtered.length !== 0;
    grid.style.opacity = '1';
  };

  if (grid && empty && search && filterBtns.length) {
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterBtns.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        activeFilter = btn.dataset.filter || 'all';
        renderProjects();
      });
    });

    search.addEventListener('input', () => {
      query = search.value || '';
      renderProjects();
    });

    // initial render
    renderProjects();

    // card action buttons (demo)
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const p = projects.find((x) => x.id === id);
      if (!p) return;

      // Demo-only: show toast with action
      showToast(action === 'repo' ? 'Repository link placeholder' : 'Live demo placeholder');
    });
  }

  // =====================
  // Toast
  // =====================
  const toast = $('#toast');
  const toastMsg = $('#toastMsg');
  let toastTimer = null;

  const showToast = (msg) => {
    if (!toast || !toastMsg) return;
    toastMsg.textContent = msg;
    toast.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.hidden = true;
    }, 2600);
  };

  // =====================
  // Contact form (demo)
  // =====================
  const contactForm = $('#contactForm');
  const clearBtn = $('#clearBtn');
  const formStatus = $('#formStatus');

  const setStatus = (text) => {
    if (!formStatus) return;
    formStatus.textContent = text;
  };

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const fd = new FormData(contactForm);
      const name = String(fd.get('name') || '').trim();
      const email = String(fd.get('email') || '').trim();
      const message = String(fd.get('message') || '').trim();

      if (!name || !email || !message) {
        setStatus('Please fill out all fields.');
        return;
      }

      setStatus('Message captured (demo only). Opening toast...');
      showToast('Saved (demo)');

      // Small UX flourish: reset after a moment
      setTimeout(() => {
        contactForm.reset();
        setStatus('');
      }, 700);
    });
  }

  if (clearBtn && contactForm) {
    clearBtn.addEventListener('click', () => {
      contactForm.reset();
      setStatus('');
      showToast('Cleared');
    });
  }

  // =====================
  // Canvas background (lightweight particles)
  // =====================
  const canvas = $('#bgCanvas');
  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (canvas && canvas.getContext && !prefersReducedMotion) {
    const ctx = canvas.getContext('2d');
    let w = 0;
    let h = 0;
    let raf = 0;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    const rand = (min, max) => min + Math.random() * (max - min);

    const colors = [
      { r: 124, g: 58, b: 237, a: 0.18 },
      { r: 34, g: 211, b: 238, a: 0.16 },
      { r: 52, g: 211, b: 153, a: 0.13 }
    ];

    const count = Math.floor((w * h) / 42000); // scale density
    const particles = Array.from({ length: Math.max(18, Math.min(62, count)) }).map(() => {
      const c = colors[Math.floor(Math.random() * colors.length)];
      return {
        x: rand(0, w),
        y: rand(0, h),
        vx: rand(-0.22, 0.22),
        vy: rand(-0.18, 0.18),
        rad: rand(1.5, 3.3),
        col: c
      };
    });

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // subtle vignette
      const grad = ctx.createRadialGradient(w * 0.5, h * 0.2, 50, w * 0.5, h * 0.2, Math.max(w, h));
      grad.addColorStop(0, 'rgba(255,255,255,0.02)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.rad, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.col.r},${p.col.g},${p.col.b},${p.col.a})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    draw();

    // stop when tab hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else draw();
    });
  }
})();

