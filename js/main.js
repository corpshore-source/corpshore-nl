/* ============================================================
   CORPSHORE NEDERLAND — main.js  v2.0
   Language toggle | Nav/Footer | Calendly modal | Newsletter
   Cookie consent | Form validation | Board renders
   ============================================================ */

/* ── 0. CONSTANTS ───────────────────────────────────────────── */
const CALENDLY_URL = 'https://calendly.com/corpshoresolutions/book-a-discovery-call-meeting-with-corpshore-solutions';

/* ── 1. CONFIG ─────────────────────────────────────────────── */
const CFG = {
  formEndpoint: '/api/contact',
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
function getLang() {
  return document.documentElement.getAttribute('lang') ||
         localStorage.getItem('corpshore_nl_lang') || CFG.defaultLang;
}

/* ── 3. NAV HTML ────────────────────────────────────────────── */
function buildNav() {
  const lang  = getLang();
  const isEN  = lang === 'en';
  const path  = window.location.pathname;

  const links = [
    { nl:'Start',        en:'Home',         href:'/',             match:/^\/$/ },
    { nl:'Diensten',     en:'Services',     href:'/diensten/',    match:/\/diensten/ },
    { nl:'Sectoren',     en:'Sectors',      href:'/sectoren/',    match:/\/sectoren/ },
    { nl:'Over ons',     en:'About',        href:'/over-ons/',    match:/\/over-ons/ },
    { nl:'Vacatures',    en:'Careers',      href:'/vacatures/',   match:/\/vacatures/ },
    { nl:'Blog',         en:'Blog',         href:'/blog/',        match:/\/blog/ },
    { nl:'Casestudies',  en:'Case Studies', href:'/casestudies/', match:/\/casestudies/ },
    { nl:'Contact',      en:'Contact',      href:'/contact/',     match:/\/contact/ },
  ];

  const li = links.map(l => {
    const active = l.match.test(path) ? ' active' : '';
    const label  = isEN ? l.en : l.nl;
    return `<li><a href="${l.href}" class="nav__link${active}" data-nl="${l.nl}" data-en="${l.en}">${label}</a></li>`;
  }).join('');

  return `
<a class="skip-link" href="#main-content" data-nl="Ga naar inhoud" data-en="Skip to content">${isEN ? 'Skip to content' : 'Ga naar inhoud'}</a>
<nav class="nav" role="navigation" aria-label="${isEN ? 'Main navigation' : 'Hoofdnavigatie'}">
  <div class="container nav__inner">
    <a href="/" class="nav__brand" aria-label="${isEN ? 'Corpshore Netherlands — Homepage' : 'Corpshore Nederland — Startpagina'}">
      <img src="/favicon.png" alt="" class="nav__logo-icon" aria-hidden="true">
      <div class="nav__logo-text">
        <span class="nav__logo-wordmark">Corpshore</span>
        <span class="nav__logo-sub">Nederland</span>
      </div>
    </a>
    <ul class="nav__links" role="list">${li}</ul>
    <div class="nav__actions">
      <button class="lang-toggle" aria-label="${isEN ? 'Switch language' : 'Taal wisselen'}" id="langToggle">
        <span class="lang-nl${!isEN ? ' active' : ''}">NL</span> · <span class="lang-en${isEN ? ' active' : ''}">EN</span>
      </button>
      <a href="/offerte/" class="btn btn--ghost btn--sm" data-nl="Offerte aanvragen" data-en="Get a Quote">${isEN ? 'Get a Quote' : 'Offerte aanvragen'}</a>
      <button class="btn btn--primary btn--sm js-open-cal" id="navBookBtn" data-nl="Plan gesprek" data-en="Book a Call">${isEN ? 'Book a Call' : 'Plan gesprek'}</button>
    </div>
    <button class="nav__hamburger" aria-label="${isEN ? 'Open menu' : 'Menu openen'}" aria-expanded="false" id="hamburger">
      <span></span><span></span><span></span>
    </button>
  </div>
  <div class="nav__mobile" id="mobileMenu" role="dialog" aria-label="${isEN ? 'Mobile menu' : 'Mobiel menu'}">
    <ul role="list">${li}</ul>
    <div class="nav__actions" style="flex-direction:column;gap:10px;margin-top:16px">
      <button class="lang-toggle" aria-label="${isEN ? 'Switch language' : 'Taal wisselen'}" id="langToggleMobile">
        <span class="lang-nl${!isEN ? ' active' : ''}">NL</span> · <span class="lang-en${isEN ? ' active' : ''}">EN</span>
      </button>
      <a href="/offerte/" class="btn btn--secondary" data-nl="Offerte aanvragen" data-en="Get a Quote">${isEN ? 'Get a Quote' : 'Offerte aanvragen'}</a>
      <button class="btn btn--primary js-open-cal" data-nl="Plan een gesprek" data-en="Book a Discovery Call">${isEN ? 'Book a Discovery Call' : 'Plan een gesprek'}</button>
    </div>
  </div>
</nav>`;
}

/* ── 4. FOOTER HTML ─────────────────────────────────────────── */
function buildFooter() {
  const isEN = getLang() === 'en';
  return `
<footer class="footer" role="contentinfo">
  <div class="container">
    <div class="footer__grid footer__grid--5">

      <div class="footer__brand">
        <a href="/" aria-label="${isEN ? 'Corpshore Netherlands — Home' : 'Corpshore Nederland — Home'}" class="footer__brand-link">
          <img src="/favicon.png" alt="" class="nav__logo-icon footer__logo-icon" aria-hidden="true">
          <div class="nav__logo-text">
            <span class="nav__logo-wordmark nav__logo-wordmark--white">Corpshore</span>
            <span class="nav__logo-sub">Nederland</span>
          </div>
        </a>
        <p class="footer__tagline" data-nl="De mondiale outsourcingpartner voor de Nederlandstalige wereld. #2 BPO in Europa (Outsource Accelerator 2026)." data-en="Global outsourcing partner for the Dutch-speaking world. #2 BPO in Europe (Outsource Accelerator 2026).">${isEN ? 'Global outsourcing partner for the Dutch-speaking world. #2 BPO in Europe (Outsource Accelerator 2026).' : 'De mondiale outsourcingpartner voor de Nederlandstalige wereld. #2 BPO in Europa (Outsource Accelerator 2026).'}</p>
        <button class="btn btn--primary btn--sm js-open-cal" style="margin-top:20px" data-nl="Plan gesprek" data-en="Book a Call">${isEN ? 'Book a Call' : 'Plan gesprek'}</button>
      </div>

      <div>
        <p class="footer__heading" data-nl="Diensten" data-en="Services">${isEN ? 'Services' : 'Diensten'}</p>
        <ul class="footer__links">
          <li><a href="/diensten/#bpo" data-nl="BPO &amp; Klantcontact" data-en="BPO &amp; Customer Service">${isEN ? 'BPO &amp; Customer Service' : 'BPO &amp; Klantcontact'}</a></li>
          <li><a href="/diensten/#backoffice" data-nl="Backoffice &amp; Data" data-en="Back Office &amp; Data">${isEN ? 'Back Office &amp; Data' : 'Backoffice &amp; Data'}</a></li>
          <li><a href="/diensten/#it" data-nl="IT-outsourcing" data-en="IT Outsourcing">${isEN ? 'IT Outsourcing' : 'IT-outsourcing'}</a></li>
          <li><a href="/diensten/#ai" data-nl="AI-outsourcing" data-en="AI Outsourcing">${isEN ? 'AI Outsourcing' : 'AI-outsourcing'}</a></li>
          <li><a href="/diensten/#finance" data-nl="Finance &amp; Accounting" data-en="Finance &amp; Accounting">Finance &amp; Accounting</a></li>
          <li><a href="/diensten/#hr" data-nl="HR Outsourcing" data-en="HR Outsourcing">HR Outsourcing</a></li>
        </ul>
      </div>

      <div>
        <p class="footer__heading" data-nl="Organisatie" data-en="Organisation">${isEN ? 'Organisation' : 'Organisatie'}</p>
        <ul class="footer__links">
          <li><a href="/over-ons/" data-nl="Over Corpshore" data-en="About Corpshore">${isEN ? 'About Corpshore' : 'Over Corpshore'}</a></li>
          <li><a href="/sectoren/" data-nl="Sectoren" data-en="Sectors">${isEN ? 'Sectors' : 'Sectoren'}</a></li>
          <li><a href="/casestudies/" data-nl="Casestudies" data-en="Case Studies">${isEN ? 'Case Studies' : 'Casestudies'}</a></li>
          <li><a href="/blog/" data-nl="Blog &amp; Inzichten" data-en="Blog &amp; Insights">${isEN ? 'Blog &amp; Insights' : 'Blog &amp; Inzichten'}</a></li>
          <li><a href="/vacatures/" data-nl="Vacatures" data-en="Careers">${isEN ? 'Careers' : 'Vacatures'}</a></li>
          <li><a href="/frysk/">Frysk</a></li>
        </ul>
      </div>

      <div class="footer__contact">
        <p class="footer__heading" data-nl="Contact" data-en="Contact">Contact</p>
        <a href="mailto:info@corpshore.solutions">info@corpshore.solutions</a>
        <p style="margin-top:12px;font-size:12px;color:rgba(255,255,255,.4)">Corpshore Solutions Corporation<br>Toronto, Ontario, Canada</p>
        <p style="margin-top:12px"><a href="https://corpshore.solutions/netherlands/" target="_blank" rel="noopener" style="font-size:12px;color:rgba(255,255,255,.5)">corpshore.solutions/netherlands/ →</a></p>
      </div>

      <div>
        <p class="footer__heading" data-nl="Nieuwsbrief" data-en="Newsletter">${isEN ? 'Newsletter' : 'Nieuwsbrief'}</p>
        <p class="footer__nl-sub" data-nl="Ontvang maandelijks sector-inzichten, BPO-trends en Corpshore-updates." data-en="Receive monthly sector insights, BPO trends and Corpshore updates.">${isEN ? 'Receive monthly sector insights, BPO trends and Corpshore updates.' : 'Ontvang maandelijks sector-inzichten, BPO-trends en Corpshore-updates.'}</p>
        <form id="footerNlForm" novalidate style="margin-top:14px">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <input type="email" id="footerNlEmail" autocomplete="email"
              placeholder="${isEN ? 'your@email.com' : 'uw@email.nl'}"
              data-nl-ph="uw@email.nl" data-en-ph="your@email.com"
              class="footer-nl-input"
              aria-label="${isEN ? 'Email address for newsletter' : 'E-mailadres voor nieuwsbrief'}">
            <button type="submit" class="btn btn--primary btn--sm" data-nl="Aanmelden" data-en="Subscribe">${isEN ? 'Subscribe' : 'Aanmelden'}</button>
          </div>
          <p id="footerNlMsg" style="font-size:13px;color:rgba(255,255,255,.6);margin-top:8px;display:none"></p>
        </form>
      </div>

    </div>

    <div class="footer__bottom">
      <div class="footer__lang">
        <a href="/">🇳🇱 <span data-nl="Nederlands" data-en="Dutch">${isEN ? 'Dutch' : 'Nederlands'}</span></a>
        <a href="/en/">🇬🇧 <span data-nl="Engels" data-en="English">${isEN ? 'English' : 'Engels'}</span></a>
        <a href="/frysk/">Frysk</a>
      </div>
      <div class="footer__legal">
        <a href="/privacybeleid/" data-nl="Privacybeleid" data-en="Privacy Policy">${isEN ? 'Privacy Policy' : 'Privacybeleid'}</a>
        <a href="/voorwaarden/" data-nl="Algemene voorwaarden" data-en="Terms &amp; Conditions">${isEN ? 'Terms &amp; Conditions' : 'Algemene voorwaarden'}</a>
        <a href="/privacybeleid/#cookies" data-nl="Cookiebeleid" data-en="Cookie Policy">${isEN ? 'Cookie Policy' : 'Cookiebeleid'}</a>
        <span>AVG / GDPR</span>
        <span data-nl="EU AI-wet" data-en="EU AI Act">${isEN ? 'EU AI Act' : 'EU AI-wet'}</span>
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
      <span data-nl="Wij gebruiken functionele cookies (vereist) en optionele analytische cookies om de website te verbeteren. Bekijk ons" data-en="We use functional cookies (required) and optional analytics cookies to improve this website. See our">Wij gebruiken functionele cookies (vereist) en optionele analytische cookies om de website te verbeteren. Bekijk ons</span>
      <a href="/privacybeleid/#cookies" data-nl="cookiebeleid" data-en="cookie policy">cookiebeleid</a>.
    </p>
    <div class="cookie-banner__actions">
      <button class="btn btn--secondary btn--sm" id="cookieDecline" data-nl="Alleen functioneel" data-en="Functional only">Alleen functioneel</button>
      <button class="btn btn--primary btn--sm" id="cookieAccept" data-nl="Alle cookies accepteren" data-en="Accept all cookies">Alle cookies accepteren</button>
    </div>
  </div>
</div>`;
}

/* ── 6. CALENDLY PRE-FORM MODAL ─────────────────────────────── */
function buildCalendlyModal() {
  return `
<div class="cal-overlay" id="calOverlay" role="dialog" aria-modal="true" aria-labelledby="calModalTitle" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1200;align-items:center;justify-content:center;padding:20px">
  <div class="cal-modal" style="background:#fff;border-radius:20px;padding:40px 36px;max-width:480px;width:100%;position:relative;max-height:90vh;overflow-y:auto;box-shadow:0 24px 80px rgba(10,36,99,.22)">
    <button id="calCloseBtn" style="position:absolute;top:16px;right:20px;background:none;border:none;font-size:26px;cursor:pointer;color:#8C8C88;line-height:1" aria-label="Sluiten">×</button>
    <h2 id="calModalTitle" style="font-family:'DM Serif Display',Georgia,serif;color:#0A2463;font-size:24px;margin-bottom:8px" data-nl="Plan een ontdekkingsgesprek" data-en="Book a Discovery Call">Plan een ontdekkingsgesprek</h2>
    <p style="color:#8C8C88;font-size:15px;margin-bottom:28px" data-nl="Gratis &middot; Vrijblijvend &middot; 30 minuten. Vul uw gegevens in zodat wij u gericht kunnen helpen." data-en="Free &middot; No obligation &middot; 30 minutes. Enter your details so we can prepare for your call.">Gratis &middot; Vrijblijvend &middot; 30 minuten. Vul uw gegevens in zodat wij u gericht kunnen helpen.</p>
    <div class="cal-form" style="display:flex;flex-direction:column;gap:16px">
      <div class="form-field">
        <label for="calName" data-nl="Naam" data-en="Name">Naam</label>
        <input type="text" id="calName" autocomplete="name" placeholder="Jan Jansen">
      </div>
      <div class="form-field">
        <label for="calCompany" data-nl="Bedrijf / Organisatie" data-en="Company / Organisation">Bedrijf / Organisatie</label>
        <input type="text" id="calCompany" autocomplete="organization" placeholder="Acme B.V.">
      </div>
      <div class="form-field">
        <label for="calEmail" data-nl="E-mailadres" data-en="Email address">E-mailadres <span class="req">*</span></label>
        <input type="email" id="calEmail" autocomplete="email" placeholder="jan@bedrijf.nl">
      </div>
      <div class="form-field">
        <label for="calNeed" data-nl="Voornaamste behoefte" data-en="Primary need">Voornaamste behoefte</label>
        <select id="calNeed">
          <option value="" data-nl="Selecteer..." data-en="Select...">Selecteer...</option>
          <option value="BPO" data-nl="BPO / Klantcontact" data-en="BPO / Customer Service">BPO / Klantcontact</option>
          <option value="IT" data-nl="IT-outsourcing" data-en="IT Outsourcing">IT-outsourcing</option>
          <option value="AI" data-nl="AI-outsourcing" data-en="AI Outsourcing">AI-outsourcing</option>
          <option value="Finance" data-nl="Finance &amp; HR" data-en="Finance &amp; HR">Finance &amp; HR</option>
          <option value="Anders" data-nl="Anders" data-en="Other">Anders</option>
        </select>
      </div>
      <p id="calFormError" style="display:none;color:#E63946;font-size:14px;margin:0" data-nl="Vul uw e-mailadres in." data-en="Please enter your email address.">Vul uw e-mailadres in.</p>
      <button id="calSubmitBtn" class="btn btn--primary btn--lg" style="width:100%" data-nl="Kies een tijdstip &rarr;" data-en="Choose a time &rarr;">Kies een tijdstip &rarr;</button>
      <p style="font-size:12px;color:#8C8C88;text-align:center;margin:0" data-nl="Uw gegevens worden alleen gebruikt voor dit gesprek en conform de AVG verwerkt." data-en="Your details are used only for this call and processed in accordance with GDPR.">Uw gegevens worden alleen gebruikt voor dit gesprek en conform de AVG verwerkt.</p>
    </div>
  </div>
</div>`;
}

/* ── 7. INJECT SHELL ────────────────────────────────────────── */
function injectShell() {
  document.body.insertAdjacentHTML('afterbegin',
    buildNav() + buildCookieBanner() + buildCalendlyModal());
  document.body.insertAdjacentHTML('beforeend', buildFooter());

  [
    { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/favicon.png' },
    { rel: 'shortcut icon', type: 'image/png', href: '/favicon.png' },
    { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
  ].forEach(attrs => {
    const link = document.createElement('link');
    Object.entries(attrs).forEach(([k, v]) => link.setAttribute(k, v));
    document.head.appendChild(link);
  });

  const hamburger  = $('#hamburger');
  const mobileMenu = $('#mobileMenu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
  }

  const consent = getCookie(CFG.cookieName);
  if (!consent) $('#cookieBanner')?.classList.add('visible');
  $('#cookieAccept')?.addEventListener('click', () => {
    setCookie(CFG.cookieName, 'all', CFG.cookieExpiry);
    $('#cookieBanner')?.classList.remove('visible');
  });
  $('#cookieDecline')?.addEventListener('click', () => {
    setCookie(CFG.cookieName, 'functional', CFG.cookieExpiry);
    $('#cookieBanner')?.classList.remove('visible');
  });
}

/* ── 8. LANGUAGE TOGGLE ─────────────────────────────────────── */
function initLangToggle() {
  const saved = localStorage.getItem('corpshore_nl_lang') || CFG.defaultLang;
  setLang(saved, false);

  $$('#langToggle, #langToggleMobile').forEach(btn => {
    btn.addEventListener('click', () => {
      setLang(getLang() === 'nl' ? 'en' : 'nl', true);
    });
  });
}

function setLang(lang, save) {
  document.documentElement.setAttribute('lang', lang);
  if (save) localStorage.setItem('corpshore_nl_lang', lang);

  /* Text content / innerHTML */
  $$('[data-nl]').forEach(el => {
    const val = lang === 'en' ? (el.dataset.en || el.dataset.nl) : el.dataset.nl;
    if (el.children.length === 0) el.textContent = val;
    else el.innerHTML = val;
  });

  /* Placeholder attributes */
  $$('[data-nl-ph]').forEach(el => {
    el.placeholder = lang === 'en' ? (el.dataset.enPh || el.dataset.nlPh) : el.dataset.nlPh;
  });

  /* Aria-label attributes */
  $$('[data-nl-aria]').forEach(el => {
    el.setAttribute('aria-label',
      lang === 'en' ? (el.dataset.enAria || el.dataset.nlAria) : el.dataset.nlAria);
  });

  /* Toggle active class on lang buttons */
  $$('.lang-nl, .lang-en').forEach(span => {
    span.classList.remove('active');
    if (span.classList.contains('lang-' + lang)) span.classList.add('active');
  });
}

/* ── 9. SCROLL ANIMATIONS ───────────────────────────────────── */
function initScrollAnimations() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.fade-up').forEach(el => observer.observe(el));
}

/* ── 10. FILE HELPER ────────────────────────────────────────── */
function readFileAsBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/* ── 11. FORM VALIDATION (generic — handles file inputs) ────── */
function initForms() {
  $$('form[data-validate]').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let valid = true;

      $$('[data-required]', form).forEach(field => {
        const wrap = field.closest('.form-field, .form-check');
        if (!wrap) return;
        const empty = field.type === 'checkbox' ? !field.checked : !field.value.trim();
        if (empty) { wrap.classList.add('invalid'); valid = false; }
        else         wrap.classList.remove('invalid');
      });

      $$('input[type="email"]', form).forEach(field => {
        const wrap = field.closest('.form-field');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
          wrap?.classList.add('invalid'); valid = false;
        }
      });

      if (!valid) return;

      const successEl = $('.form-success', form.closest('div, section') || form.parentElement);
      const errorEl   = $('.form-error',   form.closest('div, section') || form.parentElement);
      const submitBtn = $('[type="submit"]', form);
      const lang      = getLang();
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = lang === 'en' ? 'Sending…' : 'Verzenden…'; }

      try {
        /* Build data from form fields */
        const rawData = new FormData(form);
        const data = {};
        rawData.forEach((val, key) => { if (typeof val === 'string') data[key] = val; });

        /* Handle file inputs — encode as base64 */
        const attachments = [];
        for (const fi of $$('input[type="file"]', form)) {
          for (const file of Array.from(fi.files || [])) {
            if (file.size > 8 * 1024 * 1024) continue;
            const b64 = await readFileAsBase64(file);
            if (b64) attachments.push({ name: file.name, type: file.type, data: b64 });
          }
        }
        if (attachments.length) data.attachments = attachments;

        const res = await fetch(form.action || CFG.formEndpoint, {
          method: 'POST',
          body:   JSON.stringify(data),
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        });

        if (res.ok) {
          form.style.display = 'none';
          successEl?.classList.add('visible');
          window.scrollTo({ top: (form.closest('div') || form.parentElement).offsetTop - 100, behavior: 'smooth' });
        } else {
          throw new Error('Server error');
        }
      } catch {
        errorEl?.classList.add('visible');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = lang === 'en' ? 'Try again' : 'Opnieuw proberen';
        }
      }
    });

    $$('[data-required]', form).forEach(field => {
      field.addEventListener('input', () =>
        field.closest('.form-field, .form-check')?.classList.remove('invalid'));
    });
  });
}

/* ── 12. CALENDLY MODAL ─────────────────────────────────────── */
window.openCalModal = function openCalModal() {
  const overlay = $('#calOverlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  $('#calEmail')?.focus();
};

function initCalendly() {
  /* Wire all .js-open-cal buttons */
  document.addEventListener('click', (e) => {
    if (e.target.closest('.js-open-cal')) window.openCalModal();
  });

  /* Close overlay */
  $('#calCloseBtn')?.addEventListener('click', closeCalModal);
  $('#calOverlay')?.addEventListener('click', (e) => {
    if (e.target === $('#calOverlay')) closeCalModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCalModal();
  });

  /* Submit pre-form → save lead → open Calendly popup */
  $('#calSubmitBtn')?.addEventListener('click', async () => {
    const email = $('#calEmail')?.value?.trim();
    const name  = $('#calName')?.value?.trim() || '';
    const company = $('#calCompany')?.value?.trim() || '';
    const need  = $('#calNeed')?.value || '';
    const errEl = $('#calFormError');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (errEl) errEl.style.display = 'block';
      $('#calEmail')?.focus();
      return;
    }
    if (errEl) errEl.style.display = 'none';

    const btn = $('#calSubmitBtn');
    if (btn) { btn.disabled = true; btn.textContent = '…'; }

    /* Save to CRM as discovery call request */
    fetch('/api/tool-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'Discovery Call Request',
        selections: { Naam: name, Bedrijf: company, Email: email, Behoefte: need },
        result: 'Calendly popup geopend',
        referrer: window.location.pathname,
      }),
    }).catch(() => {});

    closeCalModal();

    /* Load Calendly script if needed, then open popup */
    loadCalendlyScript(() => {
      if (window.Calendly) {
        window.Calendly.initPopupWidget({
          url: CALENDLY_URL,
          prefill: { name, email, customAnswers: { a1: company, a2: need } },
        });
      } else {
        window.location.href = '/contact/';
      }
    });

    if (btn) { btn.disabled = false; btn.textContent = getLang() === 'en' ? 'Choose a time →' : 'Kies een tijdstip →'; }
  });
}

function closeCalModal() {
  const overlay = $('#calOverlay');
  if (overlay) overlay.style.display = 'none';
  document.body.style.overflow = '';
}

function loadCalendlyScript(cb) {
  if (window.Calendly) { cb(); return; }
  const s = document.createElement('script');
  s.src = 'https://assets.calendly.com/assets/external/widget.js';
  s.onload = cb;
  s.onerror = cb;
  document.head.appendChild(s);

  const css = document.createElement('link');
  css.rel  = 'stylesheet';
  css.href = 'https://assets.calendly.com/assets/external/widget.css';
  document.head.appendChild(css);
}

/* ── 13. FOOTER NEWSLETTER ──────────────────────────────────── */
function initFooterNewsletter() {
  const form    = $('#footerNlForm');
  const emailEl = $('#footerNlEmail');
  const msgEl   = $('#footerNlMsg');
  const btn     = form?.querySelector('[type="submit"]');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailEl?.value?.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (msgEl) { msgEl.style.display = 'block'; msgEl.textContent = getLang() === 'en' ? 'Please enter a valid email.' : 'Vul een geldig e-mailadres in.'; }
      return;
    }
    if (btn) btn.disabled = true;
    try {
      await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (msgEl) { msgEl.style.display = 'block'; msgEl.textContent = getLang() === 'en' ? 'Subscribed. Thank you!' : 'Aanmelding gelukt. Bedankt!'; }
      if (emailEl) emailEl.value = '';
    } catch {
      if (msgEl) { msgEl.style.display = 'block'; msgEl.textContent = getLang() === 'en' ? 'Please try again.' : 'Probeer opnieuw.'; }
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}

/* ── 14. JOB BOARD ──────────────────────────────────────────── */
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
      ? `<p style="color:var(--grey-mid)" data-nl="Geen vacatures gevonden voor uw selectie." data-en="No vacancies found for your selection.">Geen vacatures gevonden voor uw selectie.</p>`
      : list.map(j => jobCard(j)).join('');
    $$('.fade-up', container).forEach(el => el.classList.add('visible'));
  }

  function filter() {
    const dept  = deptSelect?.value  || '';
    const level = levelSelect?.value || '';
    const lang  = langSelect?.value  || '';
    render(jobs.filter(j =>
      (!dept  || j.department === dept) &&
      (!level || j.level === level) &&
      (!lang  || j.languages.includes(lang))));
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
    <span class="badge badge--remote">🏠 <span data-nl="Remote" data-en="Remote">Remote</span></span>
  </div>
  <p class="card--job__desc">${j.description}</p>
  <div class="card--job__footer">
    <span class="card--job__salary">${j.salary}</span>
    <div style="display:flex;gap:8px;align-items:center">
      <span style="font-size:18px" title="Talen">${flags}</span>
      <a href="/vacatures/?subject=${encodeURIComponent(j.title)}" class="btn btn--primary btn--sm" data-nl="Solliciteer nu &rarr;" data-en="Apply now &rarr;">Solliciteer nu &rarr;</a>
    </div>
  </div>
</div>`;
}

/* ── 15. BLOG BOARD ─────────────────────────────────────────── */
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
  if (feat && articles.length) {
    const a = articles[0];
    feat.innerHTML = `
<div class="card card--featured card--blog">
  <div class="card__img"><img src="${a.image || '/images/placeholder-blog.webp'}" alt="${a.imageAlt || a.title}" loading="lazy" decoding="async"></div>
  <div class="card__body">
    <span class="badge badge--cat-${a.categorySlug}">${a.category}</span>
    <h2 style="font-family:var(--font-serif);font-size:clamp(20px,2.2vw,26px);margin:14px 0 12px">${a.title}</h2>
    <p class="card__excerpt" style="-webkit-line-clamp:4">${a.excerpt}</p>
    <div class="card__meta"><span>${a.date}</span><span>·</span><span>${a.readTime} min.</span></div>
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
    <div class="card__meta"><span>${a.date}</span><span>·</span><span>${a.readTime} min.</span></div>
  </div>
</div>`).join('');
  $$('.fade-up', grid).forEach(el => el.classList.add('visible'));
}

/* ── 16. CASE STUDIES BOARD ─────────────────────────────────── */
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
  <p class="card__challenge"><strong data-nl="Vraagstuk:" data-en="Challenge:">Vraagstuk:</strong> ${c.challenge}</p>
  <p style="font-size:14px;color:#4a4a5a"><strong data-nl="Oplossing:" data-en="Solution:">Oplossing:</strong> ${c.solution}</p>
  <div class="card--case__footer">
    <a href="/contact/" class="btn btn--ghost" style="font-size:14px" data-nl="Vergelijkbaar project bespreken &rarr;" data-en="Discuss a similar project &rarr;">Vergelijkbaar project bespreken &rarr;</a>
  </div>
</div>`).join('');
  $$('.fade-up', grid).forEach(el => el.classList.add('visible'));
}

/* ── 17. SCROLL PROGRESS BAR ────────────────────────────────── */
function initScrollProgress() {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.prepend(bar);
  window.addEventListener('scroll', () => {
    const doc = document.documentElement;
    bar.style.width = Math.min((doc.scrollTop / (doc.scrollHeight - doc.clientHeight)) * 100, 100) + '%';
  }, { passive: true });
}

/* ── 18. COUNT-UP NUMBERS ───────────────────────────────────── */
function initCounters() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.countSuffix || '';
      const prefix = el.dataset.countPrefix || '';
      const start  = performance.now();
      const frame  = (now) => {
        const t    = Math.min((now - start) / 1800, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        el.textContent = prefix + Math.round(ease * target) + suffix;
        if (t < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  $$('[data-count]').forEach(el => obs.observe(el));
}

/* ── 19. SCROLL-TO-TOP ──────────────────────────────────────── */
function initScrollToTop() {
  const btn = document.createElement('button');
  btn.className = 'scroll-top';
  btn.setAttribute('aria-label', getLang() === 'en' ? 'Back to top' : 'Terug naar boven');
  btn.innerHTML = '<i class="ti ti-arrow-up" aria-hidden="true"></i>';
  document.body.appendChild(btn);
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ── 20. SOCIAL PROOF TOAST ─────────────────────────────────── */
function initSocialProof() {
  const msgs = getLang() === 'en'
    ? [
        { icon:'🏢', text:'An organisation from Amsterdam just requested a quote.' },
        { icon:'📞', text:'3 companies booked a discovery call this week.' },
        { icon:'🇧🇪', text:'A Belgian insurer launched a pilot project.' },
        { icon:'🌍', text:'New client project started in 3 languages via Corpshore.' },
      ]
    : [
        { icon:'🏢', text:'Een organisatie uit Amsterdam vroeg zojuist een offerte aan.' },
        { icon:'📞', text:'3 bedrijven planden deze week een ontdekkingsgesprek.' },
        { icon:'🇧🇪', text:'Een Vlaamse verzekeraar startte een pilotproject.' },
        { icon:'🌍', text:'Nieuw klantproject gestart in 3 talen via Corpshore.' },
      ];
  const m = msgs[Math.floor(Math.random() * msgs.length)];
  setTimeout(() => {
    const el = document.createElement('div');
    el.className = 'social-toast';
    el.innerHTML = `
      <span class="social-toast__icon">${m.icon}</span>
      <span class="social-toast__text">${m.text}</span>
      <button class="social-toast__close" aria-label="Sluiten">×</button>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('visible')));
    const close = () => { el.classList.remove('visible'); setTimeout(() => el.remove(), 400); };
    el.querySelector('.social-toast__close').addEventListener('click', close);
    setTimeout(close, 8000);
  }, 6000);
}

/* ── 21. FLOATING CTA (opens Calendly modal) ────────────────── */
function initFloatingCTA() {
  const fab = document.createElement('button');
  fab.className = 'float-cta js-open-cal';
  fab.setAttribute('aria-label', getLang() === 'en' ? 'Book a call' : 'Plan een gesprek');
  fab.innerHTML = `
    <i class="ti ti-calendar-event float-cta__icon" aria-hidden="true"></i>
    <span class="float-cta__label" data-nl="Plan een gesprek" data-en="Book a Call">${getLang() === 'en' ? 'Book a Call' : 'Plan een gesprek'}</span>`;
  document.body.appendChild(fab);
  window.addEventListener('scroll', () => {
    fab.classList.toggle('visible', window.scrollY > 600);
  }, { passive: true });
}

/* ── 22. HERO SERVICE ROTATOR ───────────────────────────────── */
function initHeroTyped() {
  const hero = document.querySelector('.hero__content');
  if (!hero) return;
  const isEN = getLang() === 'en';
  const words = isEN
    ? ['BPO', 'IT Outsourcing', 'AI Outsourcing', 'Multilingual Support', 'Software Development']
    : ['BPO', 'IT-outsourcing', 'AI-outsourcing', 'Meertalige support', 'Softwareontwikkeling'];
  let idx = 0;
  const wrap = document.createElement('div');
  wrap.className = 'hero__rotator';
  wrap.innerHTML = `<span class="rotator__prefix" data-nl="Wij leveren " data-en="We deliver ">${isEN ? 'We deliver ' : 'Wij leveren '}</span><span class="rotator__word" id="rotatorWord">${words[0]}</span><span class="rotator__cursor" aria-hidden="true">|</span>`;
  const eyebrow = hero.querySelector('.hero__eyebrow');
  if (eyebrow) eyebrow.insertAdjacentElement('afterend', wrap);
  const wordEl = document.getElementById('rotatorWord');
  setInterval(() => {
    wordEl.classList.add('rotator--exit');
    setTimeout(() => {
      idx = (idx + 1) % words.length;
      wordEl.textContent = words[idx];
      wordEl.classList.replace('rotator--exit', 'rotator--enter');
      requestAnimationFrame(() => requestAnimationFrame(() => wordEl.classList.remove('rotator--enter')));
    }, 280);
  }, 2800);
}

/* ── 23. SERVICE CARD 3D TILT ───────────────────────────────── */
function initCardTilt() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  $$('.card--service').forEach(card => {
    card.style.transition = 'box-shadow 240ms ease, transform 120ms ease';
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `perspective(600px) rotateX(${-y * 7}deg) rotateY(${x * 7}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}

/* ── 24. HERO MOUSE PARALLAX ────────────────────────────────── */
function initHeroParallax() {
  const hero = document.querySelector('.hero');
  if (!hero || window.matchMedia('(pointer: coarse)').matches) return;
  document.addEventListener('mousemove', e => {
    const x = ((e.clientX / window.innerWidth)  - 0.5) * 14;
    const y = ((e.clientY / window.innerHeight) - 0.5) * 14;
    hero.style.backgroundPosition = `calc(50% + ${x}px) calc(50% + ${y}px)`;
  }, { passive: true });
}

/* ── 25. INIT ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  injectShell();
  initScrollAnimations();
  initLangToggle();
  initForms();
  initJobBoard();
  initBlogBoard();
  initCaseStudies();
  initScrollProgress();
  initCounters();
  initScrollToTop();
  initSocialProof();
  initFloatingCTA();
  initHeroTyped();
  initCardTilt();
  initHeroParallax();
  initCalendly();
  initFooterNewsletter();
});
