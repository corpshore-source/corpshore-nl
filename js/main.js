/* ============================================================
   CORPSHORE NEDERLAND — main.js  v1.0
   Language toggle | Nav/Footer injection | Scroll animations
   Cookie consent | Form validation | Board renders
   ============================================================ */

/* ── 1. CONFIG ─────────────────────────────────────────────── */
const CFG = {
  formEndpoint: 'https://formspree.io/f/placeholder', // replace with real ID
  cookieName:   'corpshore_nl_consent',
  cookieExpiry: 365,
  defaultLang:  'nl',
};

/* ── 2. UTILITIES ──────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function setCookie(name, val, days) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${val};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}
function getCookie(name) {
  const m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return m ? m.pop() : null;
}

/* ── 3. NAV HTML ────────────────────────────────────────────── */
function buildNav() {
  const path = window.location.pathname;
  const isEN = path.startsWith('/en');
  const links = [
    { href: isEN ? '/en/' : '/',             label: isEN ? 'Home'         : 'Start',       match: /^\/$|^\/en\// },
    { href: isEN ? '/diensten/'  : '/diensten/',  label: isEN ? 'Services'     : 'Diensten',   match: /\/diensten/ },
    { href: isEN ? '/sectoren/'  : '/sectoren/',  label: isEN ? 'Sectors'      : 'Sectoren',   match: /\/sectoren/ },
    { href: '/over-ons/',                         label: isEN ? 'About'        : 'Over ons',   match: /\/over-ons/ },
    { href: '/vacatures/',                        label: isEN ? 'Careers'      : 'Vacatures',  match: /\/vacatures/ },
    { href: '/blog/',                             label: 'Blog',                               match: /\/blog/ },
    { href: '/casestudies/',                      label: isEN ? 'Case Studies' : 'Casestudies',match: /\/casestudies/ },
  ];

  const li = links.map(l => {
    const active = l.match.test(path) ? ' active' : '';
    return `<li><a href="${l.href}" class="nav__link${active}">${l.label}</a></li>`;
  }).join('');

  return `
<a class="skip-link" href="#main-content">Ga naar inhoud</a>
<nav class="nav" role="navigation" aria-label="Hoofdnavigatie">
  <div class="container nav__inner">
    <a href="/" class="nav__brand" aria-label="Corpshore Nederland — Startpagina">
      <span class="nav__logo-wordmark">Corpshore</span>
      <span class="nav__logo-sub">Nederland</span>
    </a>
    <ul class="nav__links" role="list">${li}</ul>
    <div class="nav__actions">
      <button class="lang-toggle" aria-label="Taal wisselen" id="langToggle">
        <span class="lang-nl${!isEN ? ' active' : ''}">NL</span> · <span class="lang-en${isEN ? ' active' : ''}">EN</span>
      </button>
      <a href="/contact/" class="btn btn--primary btn--sm">Contact</a>
    </div>
    <button class="nav__hamburger" aria-label="Menu openen" aria-expanded="false" id="hamburger">
      <span></span><span></span><span></span>
    </button>
  </div>
  <div class="nav__mobile" id="mobileMenu" role="dialog" aria-label="Mobiel menu">
    <ul role="list">${li}</ul>
    <div class="nav__actions">
      <button class="lang-toggle" aria-label="Taal wisselen" id="langToggleMobile">
        <span class="lang-nl${!isEN ? ' active' : ''}">NL</span> · <span class="lang-en${isEN ? ' active' : ''}">EN</span>
      </button>
      <a href="/contact/" class="btn btn--primary">Contact opnemen</a>
    </div>
  </div>
</nav>`;
}

/* ── 4. FOOTER HTML ─────────────────────────────────────────── */
function buildFooter() {
  return `
<footer class="footer" role="contentinfo">
  <div class="container">
    <div class="footer__grid">
      <div class="footer__brand">
        <a href="/" aria-label="Corpshore Nederland — Home">
          <span class="nav__logo-wordmark">Corpshore</span>
          <span class="nav__logo-sub">Nederland</span>
        </a>
        <p class="footer__tagline">De mondiale outsourcingpartner voor de Nederlandstalige wereld. #2 BPO in Europa (Outsource Accelerator 2026).</p>
      </div>
      <div>
        <p class="footer__heading">Diensten</p>
        <ul class="footer__links">
          <li><a href="/diensten/#bpo">BPO & Klantcontact</a></li>
          <li><a href="/diensten/#backoffice">Backoffice & Data</a></li>
          <li><a href="/diensten/#it">IT-outsourcing</a></li>
          <li><a href="/diensten/#ai">AI-outsourcing</a></li>
          <li><a href="/diensten/#finance">Finance & Accounting</a></li>
          <li><a href="/diensten/#hr">HR Outsourcing</a></li>
        </ul>
      </div>
      <div>
        <p class="footer__heading">Organisatie</p>
        <ul class="footer__links">
          <li><a href="/over-ons/">Over Corpshore</a></li>
          <li><a href="/sectoren/">Sectoren</a></li>
          <li><a href="/casestudies/">Casestudies</a></li>
          <li><a href="/blog/">Blog & Inzichten</a></li>
          <li><a href="/vacatures/">Vacatures</a></li>
          <li><a href="/frysk/">Frysk</a></li>
        </ul>
      </div>
      <div class="footer__contact">
        <p class="footer__heading">Contact</p>
        <a href="mailto:nederland@corpshore.nl">nederland@corpshore.nl</a>
        <a href="mailto:procurement@corpshore.nl">procurement@corpshore.nl</a>
        <p style="margin-top:12px;font-size:12px;color:rgba(255,255,255,.4)">Corpshore Solutions Corporation<br>Toronto, Ontario, Canada</p>
        <p style="margin-top:12px">
          <a href="https://corpshore.solutions/netherlands/" target="_blank" rel="noopener" style="font-size:12px;color:rgba(255,255,255,.5)">corpshore.solutions/netherlands/</a>
        </p>
      </div>
    </div>
    <div class="footer__bottom">
      <div class="footer__lang">
        <a href="/">🇳🇱 Nederlands</a>
        <a href="/en/">🇬🇧 English</a>
        <a href="/frysk/">Frysk</a>
      </div>
      <div class="footer__legal">
        <a href="/privacybeleid/">Privacybeleid</a>
        <span>AVG/GDPR</span>
        <a href="/privacybeleid/#cookies">Cookiebeleid</a>
      </div>
      <p class="footer__copy">© 2026 Corpshore Solutions Corporation</p>
    </div>
  </div>
</footer>`;
}

/* ── 5. COOKIE CONSENT ──────────────────────────────────────── */
function buildCookieBanner() {
  return `
<div class="cookie-banner" id="cookieBanner" role="dialog" aria-live="polite" aria-label="Cookiemelding">
  <div class="cookie-banner__inner">
    <p class="cookie-banner__text">
      Wij gebruiken functionele cookies (vereist) en optionele analytische cookies om ons te helpen de website te verbeteren.
      Bekijk ons <a href="/privacybeleid/#cookies">cookiebeleid</a> voor meer informatie.
    </p>
    <div class="cookie-banner__actions">
      <button class="btn btn--secondary btn--sm" id="cookieDecline">Alleen functioneel</button>
      <button class="btn btn--primary btn--sm" id="cookieAccept">Alle cookies accepteren</button>
    </div>
  </div>
</div>`;
}

/* ── 6. INJECT NAV / FOOTER / COOKIE ───────────────────────── */
function injectShell() {
  document.body.insertAdjacentHTML('afterbegin', buildNav() + buildCookieBanner());
  document.body.insertAdjacentHTML('beforeend', buildFooter());

  // Hamburger
  const hamburger = $('#hamburger');
  const mobileMenu = $('#mobileMenu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
  }

  // Cookie
  const consent = getCookie(CFG.cookieName);
  if (!consent) {
    const banner = $('#cookieBanner');
    if (banner) banner.classList.add('visible');
  }
  $('#cookieAccept')?.addEventListener('click', () => {
    setCookie(CFG.cookieName, 'all', CFG.cookieExpiry);
    $('#cookieBanner')?.classList.remove('visible');
  });
  $('#cookieDecline')?.addEventListener('click', () => {
    setCookie(CFG.cookieName, 'functional', CFG.cookieExpiry);
    $('#cookieBanner')?.classList.remove('visible');
  });
}

/* ── 7. SCROLL ANIMATIONS ───────────────────────────────────── */
function initScrollAnimations() {
  const pref = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (pref) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  $$('.fade-up').forEach(el => observer.observe(el));
}

/* ── 8. LANGUAGE TOGGLE ─────────────────────────────────────── */
function initLangToggle() {
  const storedLang = localStorage.getItem('corpshore_nl_lang') || CFG.defaultLang;
  setLang(storedLang, false);

  $$('#langToggle, #langToggleMobile').forEach(btn => {
    btn.addEventListener('click', () => {
      const cur = document.documentElement.lang || 'nl';
      const next = cur === 'nl' ? 'en' : 'nl';
      setLang(next, true);
    });
  });
}

function setLang(lang, save) {
  document.documentElement.setAttribute('lang', lang);
  if (save) localStorage.setItem('corpshore_nl_lang', lang);

  // Update data-nl / data-en elements
  $$('[data-nl]').forEach(el => {
    el.textContent = lang === 'en' ? (el.dataset.en || el.dataset.nl) : el.dataset.nl;
  });

  // Update toggle active state
  $$('.lang-nl, .lang-en').forEach(span => {
    span.classList.remove('active');
    if (span.classList.contains('lang-' + lang)) span.classList.add('active');
  });
}

/* ── 9. FORM VALIDATION (generic) ──────────────────────────── */
function initForms() {
  $$('form[data-validate]').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let valid = true;

      $$('[data-required]', form).forEach(field => {
        const wrap = field.closest('.form-field');
        if (!wrap) return;
        if (!field.value.trim()) {
          wrap.classList.add('invalid');
          valid = false;
        } else {
          wrap.classList.remove('invalid');
        }
      });

      // Email check
      $$('input[type="email"]', form).forEach(field => {
        const wrap = field.closest('.form-field');
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value);
        if (!ok) {
          wrap?.classList.add('invalid');
          valid = false;
        }
      });

      // Checkbox required
      $$('input[type="checkbox"][data-required]', form).forEach(cb => {
        const wrap = cb.closest('.form-check');
        if (!cb.checked) {
          wrap?.classList.add('invalid');
          valid = false;
        } else {
          wrap?.classList.remove('invalid');
        }
      });

      if (!valid) return;

      const successEl = $('.form-success', form.parentElement);
      const errorEl   = $('.form-error',   form.parentElement);
      const submitBtn = $('[type="submit"]', form);
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Verzenden...'; }

      try {
        const data = new FormData(form);
        const res  = await fetch(form.action || CFG.formEndpoint, {
          method: 'POST',
          body: data,
          headers: { 'Accept': 'application/json' },
        });
        if (res.ok) {
          form.style.display = 'none';
          successEl?.classList.add('visible');
          window.scrollTo({ top: form.parentElement.offsetTop - 100, behavior: 'smooth' });
        } else {
          throw new Error('Server error');
        }
      } catch {
        errorEl?.classList.add('visible');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Opnieuw proberen'; }
      }
    });

    // Inline clear
    $$('[data-required]', form).forEach(field => {
      field.addEventListener('input', () => {
        field.closest('.form-field')?.classList.remove('invalid');
      });
    });
  });
}

/* ── 10. JOB BOARD ──────────────────────────────────────────── */
async function initJobBoard() {
  const container = $('#jobBoard');
  if (!container) return;

  let jobs = [];
  try {
    const res = await fetch('/data/vacatures.json');
    jobs = await res.json();
  } catch { container.innerHTML = '<p>Vacatures tijdelijk niet beschikbaar.</p>'; return; }

  const deptSelect  = $('#filterDept');
  const levelSelect = $('#filterLevel');
  const langSelect  = $('#filterLang');

  function render(list) {
    container.innerHTML = list.length === 0
      ? '<p style="color:var(--grey-mid)">Geen vacatures gevonden voor uw selectie.</p>'
      : list.map(j => jobCard(j)).join('');
    $$('.fade-up', container).forEach(el => el.classList.add('visible'));
  }

  function filter() {
    const dept  = deptSelect?.value  || '';
    const level = levelSelect?.value || '';
    const lang  = langSelect?.value  || '';
    render(jobs.filter(j => {
      return (!dept  || j.department === dept) &&
             (!level || j.level      === level) &&
             (!lang  || j.languages.includes(lang));
    }));
  }

  [deptSelect, levelSelect, langSelect].forEach(s => s?.addEventListener('change', filter));
  render(jobs);
}

function jobCard(j) {
  const langFlags = { nl:'🇳🇱', en:'🇬🇧', de:'🇩🇪', fr:'🇫🇷', fy:'🏴', ar:'🇦🇪', es:'🇪🇸' };
  const flags = j.languages.map(l => langFlags[l] || l).join(' ');
  return `
<div class="card card--job fade-up">
  <div class="card--job__header">
    <div>
      <p class="card--job__dept">${j.department}</p>
      <h3>${j.title}</h3>
    </div>
    <span class="badge badge--remote">🏠 Remote</span>
  </div>
  <p class="card--job__desc">${j.description}</p>
  <div class="card--job__footer">
    <span class="card--job__salary">${j.salary}</span>
    <div style="display:flex;gap:8px;align-items:center">
      <span style="font-size:18px" title="Talen">${flags}</span>
      <a href="/contact/?subject=${encodeURIComponent(j.title)}" class="btn btn--primary btn--sm">Solliciteer nu →</a>
    </div>
  </div>
</div>`;
}

/* ── 11. BLOG BOARD ─────────────────────────────────────────── */
async function initBlogBoard() {
  const grid = $('#blogGrid');
  const feat = $('#featuredArticle');
  if (!grid) return;

  let articles = [];
  try {
    const res = await fetch('/data/blog.json');
    articles  = await res.json();
  } catch { grid.innerHTML = '<p>Artikelen tijdelijk niet beschikbaar.</p>'; return; }

  const categories = ['Alle', ...new Set(articles.map(a => a.category))];
  const filterBar  = $('#blogFilter');
  if (filterBar) {
    filterBar.innerHTML = categories.map(c =>
      `<button class="cat-btn${c === 'Alle' ? ' active' : ''}" data-cat="${c}">${c}</button>`
    ).join('');
    filterBar.addEventListener('click', e => {
      const btn = e.target.closest('.cat-btn');
      if (!btn) return;
      $$('.cat-btn', filterBar).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      renderBlog(cat === 'Alle' ? articles : articles.filter(a => a.category === cat));
    });
  }

  // Featured
  if (feat && articles.length) {
    const a = articles[0];
    feat.innerHTML = `
<div class="card card--featured card--blog">
  <div class="card__img"><img src="${a.image || '/images/placeholder-blog.webp'}" alt="${a.imageAlt || a.title}" loading="lazy" decoding="async"></div>
  <div class="card__body">
    <span class="badge badge--cat-${a.categorySlug}">${a.category}</span>
    <h2 style="font-family:var(--font-serif);font-size:clamp(20px,2.2vw,26px);margin:14px 0 12px">${a.title}</h2>
    <p class="card__excerpt" style="-webkit-line-clamp:4">${a.excerpt}</p>
    <div class="card__meta">
      <span>${a.date}</span>
      <span>·</span>
      <span>${a.readTime} min. lezen</span>
    </div>
    <a href="/blog/${a.slug}/" class="btn btn--primary mt-md" style="margin-top:20px">Lees artikel →</a>
  </div>
</div>`;
  }

  renderBlog(articles.slice(1));
}

function renderBlog(list) {
  const grid = $('#blogGrid');
  if (!grid) return;
  grid.innerHTML = list.map(a => `
<div class="card card--blog fade-up">
  <div class="card__img"><img src="${a.image || '/images/placeholder-blog.webp'}" alt="${a.imageAlt || a.title}" loading="lazy" decoding="async"></div>
  <div class="card__body">
    <span class="badge badge--cat-${a.categorySlug}">${a.category}</span>
    <h3 style="margin-top:10px">${a.title}</h3>
    <p class="card__excerpt">${a.excerpt}</p>
    <div class="card__meta">
      <span>${a.date}</span>
      <span>·</span>
      <span>${a.readTime} min. lezen</span>
    </div>
  </div>
</div>`).join('');
  $$('.fade-up', grid).forEach(el => el.classList.add('visible'));
}

/* ── 12. CASE STUDIES BOARD ─────────────────────────────────── */
async function initCaseStudies() {
  const grid = $('#caseGrid');
  if (!grid) return;

  let cases = [];
  try {
    const res = await fetch('/data/casestudies.json');
    cases = await res.json();
  } catch { grid.innerHTML = '<p>Casestudies tijdelijk niet beschikbaar.</p>'; return; }

  const sectors = ['Alle', ...new Set(cases.map(c => c.sector))];
  const filterSel = $('#filterSector');
  if (filterSel) {
    sectors.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s === 'Alle' ? '' : s;
      opt.textContent = s;
      filterSel.appendChild(opt);
    });
    filterSel.addEventListener('change', () => {
      const v = filterSel.value;
      renderCases(v ? cases.filter(c => c.sector === v) : cases);
    });
  }
  renderCases(cases);
}

function renderCases(list) {
  const grid = $('#caseGrid');
  if (!grid) return;
  grid.innerHTML = list.map(c => `
<div class="card card--case fade-up">
  <div class="card__result">${c.result}</div>
  <span class="badge">${c.sector}</span>
  <h3 style="margin-top:12px">${c.clientProfile}</h3>
  <p class="card__challenge"><strong>Vraagstuk:</strong> ${c.challenge}</p>
  <p style="font-size:14px;color:#4a4a5a"><strong>Oplossing:</strong> ${c.solution}</p>
  <div class="card--case__footer">
    <a href="/contact/" class="btn btn--ghost" style="font-size:14px">Vergelijkbaar project bespreken →</a>
  </div>
</div>`).join('');
  $$('.fade-up', grid).forEach(el => el.classList.add('visible'));
}

/* ── 13. INIT ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  injectShell();
  initScrollAnimations();
  initLangToggle();
  initForms();
  initJobBoard();
  initBlogBoard();
  initCaseStudies();
});
