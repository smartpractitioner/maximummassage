(function () {
  'use strict';

  // Diagnostic logging — only active when ?debug=picker is in the URL or
  // localStorage.mh_picker_debug === '1'. Used to trace the Tally → picker
  // recommendation flow when something looks off. Remove once stable.
  const DEBUG = (function () {
    try {
      if (new URLSearchParams(window.location.search).get('debug') === 'picker') return true;
      if (localStorage.getItem('mh_picker_debug') === '1') return true;
    } catch (_) {}
    return false;
  })();
  function pickerDebug() {
    if (!DEBUG) return;
    try { console.log.apply(console, ['[picker]'].concat(Array.from(arguments))); } catch (_) {}
  }

  const TALLY_FORM_SRC = 'https://tally.so/embed/0QPyJQ?alignLeft=1&hideTitle=1&transparentBackground=1';
  const TALLY_SCRIPT = 'https://tally.so/widgets/embed.js';
  const LEAD_CAPTURE_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwt0ZJ1RW8unG2Uj5vyXWC4Xn7k5fhPGpUL57ysYYoGX-i0fkacxyr-uIGhxx3Le_cKFQ/exec';
  const CONFIRMATION_PATH = '/massage-therapy-calgary-flow-b/confirmation/';

  const PRACTITIONER_PATHS = ['/brookelyn/', '/meagan/', '/charlotte/', '/lindsey/', '/tif/'];

  const UTM_KEYS = ['gclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'page_variant', 'flow'];

  const therapists = [
    {
      id: 'brookelyn',
      name: 'Brookelyn Brolly',
      shortName: 'Brookelyn B.',
      title: 'Sports + injury recovery specialist',
      specialty: 'Sports + injury recovery',
      photo: '/images/therapists/brookelyn.webp?v=2',
      bio: 'Results-driven therapist who helps active people get back to the things they love. Direct, practical, and grounded in deep anatomical knowledge.',
      tags: ['Sports injuries', 'SI joint + low back', 'Cervical spine', 'Jade stone'],
      review: {
        text: 'Brookelyn really listened and tailored the session to exactly what I needed. I felt better after one visit.',
        source: 'Google review'
      },
      experience: '10,000+ hours hands-on. Graduated MacEwan University, 2014.',
      duration: '60 min',
      price: 49,
      regularPrice: 124,
      path: '/brookelyn/'
    },
    {
      id: 'meagan',
      name: 'Meagan Brown',
      shortName: 'Meagan B.',
      title: 'Whole-body + craniosacral specialist',
      specialty: 'Whole-body + craniosacral',
      photo: '/images/therapists/meagan.jpg',
      bio: 'Deeply intuitive, movement-aware therapist who takes a whole-body view of pain and recovery. Brings a calming presence and works to help your body find balance without pushing past limits.',
      tags: ['Craniosacral therapy', 'Reflexology', 'Thai massage'],
      review: {
        headline: '… she’ll hit your pain spots with soothing hands',
        text: 'I had the best massage therapist I’ve ever had, Meagan Brown has the magic touch, soothing relaxing, her knowledge of the body is amazing and she’ll hit your pain spots with soothing hands and has a wicked personality!!',
        reviewerName: 'Wes Woznow',
        source: 'Google review'
      },
      experience: '10,000+ hours hands-on.',
      duration: '60 min',
      price: 49,
      regularPrice: 124,
      path: '/meagan/'
    },
    {
      id: 'charlotte',
      name: 'Charlotte Tooth',
      shortName: 'Charlotte T.',
      title: 'Chronic pain + myofascial release specialist',
      specialty: 'Chronic pain + cupping',
      photo: '/images/therapists/charlotte.webp?v=2',
      bio: 'Results-focused therapist with a calm, clinical approach and a deep commitment to helping people move better and feel better. Advanced skills in injury recovery and chronic pain care.',
      tags: ['Dynamic cupping', 'Myofascial release', 'Trigger point', 'Lymphatic drainage', 'Pre/post-partum', 'Reiki'],
      review: {
        text: 'Charlotte is an experienced and knowledgeable professional! [...] Best massage therapist ever! Highly recommend!!',
        source: 'Google review'
      },
      experience: '7,200+ hours hands-on.',
      duration: '90 min',
      price: 49,
      regularPrice: 124,
      path: '/charlotte/'
    },
    {
      id: 'lindsey',
      name: 'Lindsey Stauffer',
      shortName: 'Lindsey S.',
      title: 'Fascial release + nervous system specialist',
      specialty: 'Fascial release + nervous system',
      photo: '/images/therapists/lindsey.webp?v=2',
      bio: 'Calm, detail-oriented therapist with a deeply supportive presence. Blends fascial release techniques with a nervous-system-aware approach to reduce pain, improve movement, and restore balance.',
      tags: ['Fascial release', 'Yoga teacher', 'Doula', 'Acupuncture (in training)'],
      review: {
        text: 'Lindsey creates such a safe, calming space. Her fascial work is incredible — I noticed a difference after the first session.',
        source: 'Google review'
      },
      experience: '4,000+ hours hands-on.',
      duration: '60 min',
      price: 49,
      regularPrice: 124,
      path: '/lindsey/'
    },
    {
      id: 'tif',
      name: 'Tif Henderson',
      shortName: 'Tif H.',
      title: 'Personalized + perinatal specialist',
      specialty: 'Personalized + perinatal',
      photo: '/images/therapists/tif.webp',
      bio: 'Tif takes a personalized approach with every client — tailoring each session to your needs, whether that’s tension relief, stress reduction, or pain management, and partnering with you on a treatment plan that helps you reach your goals.',
      tags: ['Swedish', 'Deep tissue', 'Lymphatic drainage', 'Pre & post-natal', 'TMJ + facial'],
      review: {
        text: '[STUB — replace with a real Google review once available.]',
        source: 'Google review'
      },
      experience: '2,200-hour Advanced Massage Therapy graduate (Professional Institute of Massage Therapy, Calgary). Member in good standing with CMMOTA.',
      duration: '60 min',
      price: 49,
      regularPrice: 124,
      path: '/tif/'
    },
    {
      id: 'kassandra',
      name: 'Kassandra Wilson',
      shortName: 'Kassandra W.',
      specialty: 'Deep tissue + sports',
      photo: '/images/therapists/kassandra.webp',
      disabled: true,
      disabledLabel: 'Fully booked'
    },
    {
      id: 'tracy',
      name: 'Tracy Schneider-Steeves',
      shortName: 'Tracy S.',
      specialty: 'Trigger point + craniosacral',
      photo: '/images/therapists/tracy.webp',
      disabled: true,
      disabledLabel: 'Fully booked'
    }
  ];

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function readUtm(key) {
    const fromUrl = new URLSearchParams(window.location.search).get(key);
    if (fromUrl) return fromUrl;
    try { return sessionStorage.getItem(key) || ''; } catch (_) { return ''; }
  }

  function collectUtms() {
    const out = {};
    UTM_KEYS.forEach((k) => { out[k] = readUtm(k); });
    return out;
  }

  function buildTallySrc() {
    const extras = [];
    UTM_KEYS.forEach((k) => {
      const v = readUtm(k);
      if (v) extras.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
    });
    if (!extras.length) return TALLY_FORM_SRC;
    const sep = TALLY_FORM_SRC.indexOf('?') > -1 ? '&' : '?';
    return TALLY_FORM_SRC + sep + extras.join('&');
  }

  function buildQuizView() {
    return `
      <div class="quiz-wrap" data-view-root="quiz">
        <iframe
          data-quiz-iframe
          loading="lazy"
          frameborder="0"
          marginheight="0"
          marginwidth="0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          referrerpolicy="origin"
          title="Find a Therapist Quiz"
        ></iframe>
      </div>
    `;
  }

  function buildGrid(recommendedId) {
    return `
      ${recommendedId ? '<p class="picker-intro">Based on your answers, we recommend <strong>' + escapeHtml(findTherapist(recommendedId).name.split(" ")[0]) + '</strong> &mdash; but pick whoever feels right. <span class="picker-intro__hint">Tap any therapist to learn more about them.</span></p>' : ''}
      <div class="picker-grid">
        ${therapists.map((t) => {
          const isRecommended = t.id === recommendedId;
          const isDisabled = !!t.disabled;
          const classes = ['picker-card'];
          if (isRecommended) classes.push('picker-card--recommended');
          if (isDisabled) classes.push('picker-card--disabled');
          const attrs = isDisabled
            ? 'disabled aria-disabled="true" tabindex="-1"'
            : 'data-therapist="' + t.id + '" aria-label="View ' + escapeHtml(t.name) + '"';
          return `
            <button type="button" class="${classes.join(' ')}" ${attrs}>
              ${isRecommended ? '<span class="picker-card__badge">We recommend</span>' : ''}
              <span class="picker-card__photo-wrap"><img class="picker-card__photo" src="${t.photo}" alt="${escapeHtml(t.name)}" loading="lazy"></span>
              <p class="picker-card__name">${escapeHtml(t.shortName)}</p>
              <p class="picker-card__spec">${escapeHtml(t.specialty)}</p>
              ${isDisabled ? '<p class="picker-card__disabled-label">' + escapeHtml(t.disabledLabel) + '</p>' : ''}
            </button>
          `;
        }).join('')}
      </div>
      <p class="picker-foot">Tap a therapist to see more &mdash; two of our team are currently fully booked.</p>
    `;
  }

  function findTherapist(id) {
    return therapists.find((x) => x.id === id);
  }

  function buildReviewCard(t) {
    const r = t.review || {};
    // Skip the card entirely if we only have a placeholder stub.
    if (!r.text || /^\[STUB/i.test(r.text)) return '';
    const star = '<svg width="13" height="13" viewBox="0 0 24 24" fill="#F5A623" aria-hidden="true"><path d="M12 2.6l2.95 5.98 6.6.96-4.78 4.66 1.13 6.57L12 17.67l-5.9 3.1 1.13-6.57L2.45 9.54l6.6-.96L12 2.6z"/></svg>';
    const stars = '<span class="detail-panel__review-stars" role="img" aria-label="5 out of 5 stars">' + star.repeat(5) + '</span>';
    const googleG = '<svg class="detail-panel__review-g" width="22" height="22" viewBox="0 0 48 48" aria-label="Google review"><path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/><path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/><path fill="#FBBC05" d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"/><path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7C13.42 14.62 18.27 10.75 24 10.75z"/></svg>';
    const headline = r.headline ? `<p class="detail-panel__review-headline">"${escapeHtml(r.headline)}"</p>` : '';
    const nameRow = r.reviewerName
      ? `<span class="detail-panel__review-name">${escapeHtml(r.reviewerName)}</span>`
      : `<span class="detail-panel__review-name detail-panel__review-name--muted">${escapeHtml(r.source || 'Google review')}</span>`;
    return `
      <div class="detail-panel__review">
        ${headline}
        <p class="detail-panel__review-body">${escapeHtml(r.text)}</p>
        <div class="detail-panel__review-foot">
          ${stars}
          ${nameRow}
          ${googleG}
        </div>
      </div>
    `;
  }

  function buildDetail(t) {
    const tagsHtml = t.tags.map((tag) => `<span class="detail-panel__tag">${escapeHtml(tag)}</span>`).join('');
    return `
      <button type="button" class="detail-panel__back" data-action="back">
        <span aria-hidden="true">&larr;</span> All therapists
      </button>
      <div class="detail-panel__body">
        <img class="detail-panel__photo" src="${t.photo}" alt="${escapeHtml(t.name)}">
        <h3 class="detail-panel__name">${escapeHtml(t.name)}, RMT</h3>
        <p class="detail-panel__title">${escapeHtml(t.title)}</p>
        <p class="detail-panel__bio">${escapeHtml(t.bio)}</p>
        <div class="detail-panel__tags">${tagsHtml}</div>
        <p class="detail-panel__exp">${escapeHtml(t.experience)}</p>
        ${buildReviewCard(t)}
        <p class="detail-panel__price">
          $${t.price}
          <span class="detail-panel__price-old">$${t.regularPrice}</span>
          <span class="cta-card__badge">New patient starter offer</span>
        </p>
        <button type="button" class="btn btn--primary btn--block" data-action="open-lead-form" data-therapist="${t.id}">
          Book with ${escapeHtml(t.name.split(' ')[0])} &mdash; ${escapeHtml(t.duration)}
        </button>
      </div>
    `;
  }

  function buildLeadForm(t) {
    return `
      <button type="button" class="detail-panel__back" data-action="back-to-detail" data-therapist="${t.id}">
        <span aria-hidden="true">&larr;</span> Back
      </button>
      <form class="lead-form" data-lead-form data-therapist="${t.id}" novalidate>
        <h3 class="lead-form__title">Almost there</h3>
        <p class="lead-form__sub">A few quick details so we can hold a spot with ${escapeHtml(t.name.split(' ')[0])}.</p>
        <label class="lead-form__field">
          <span>First name</span>
          <input name="first_name" type="text" autocomplete="given-name" required>
        </label>
        <label class="lead-form__field">
          <span>Last name</span>
          <input name="last_name" type="text" autocomplete="family-name" required>
        </label>
        <label class="lead-form__field">
          <span>Email</span>
          <input name="email" type="email" autocomplete="email" required>
        </label>
        <label class="lead-form__field">
          <span>Phone</span>
          <input name="phone" type="tel" autocomplete="tel" required>
        </label>
        <p class="lead-form__err" data-lead-err hidden></p>
        <button type="submit" class="btn btn--primary btn--block" data-lead-submit>
          Proceed to see availability
        </button>
      </form>
    `;
  }

  let overlay = null;
  let lastFocus = null;
  let tallyBooted = false;

  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.className = 'lb-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'picker-title');
    overlay.innerHTML = `
      <div class="lb" role="document">
        <div class="lb__head">
          <h2 class="lb__title sr-only" id="picker-title">Find your therapist</h2>
          <div class="lb-stepper lb-stepper--spread" data-stepper aria-hidden="true">
            <div class="lb-stepper__item" data-step="1">
              <span class="lb-stepper__num">1</span>
              <span class="lb-stepper__label"><span class="lb-stepper__label-full">Share your history</span><span class="lb-stepper__label-short">About you</span></span>
            </div>
            <div class="lb-stepper__item" data-step="2">
              <span class="lb-stepper__num">2</span>
              <span class="lb-stepper__label">Pick therapist</span>
            </div>
            <div class="lb-stepper__item" data-step="3">
              <span class="lb-stepper__num">3</span>
              <span class="lb-stepper__label">Choose time</span>
            </div>
          </div>
          <button type="button" class="lb__close" data-action="close" aria-label="Close">&times;</button>
        </div>
        <div class="lb__body">
          <div class="lb__stage" data-view="quiz"></div>
          <div class="lb__stage" data-view="grid" hidden></div>
          <div class="detail-panel" data-view="detail"></div>
          <div class="lb__stage" data-view="lead-form" hidden></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      const target = e.target;
      if (target === overlay) { closeLightbox(); return; }
      if (target.closest('[data-action="close"]')) { closeLightbox(); return; }
      if (target.closest('[data-action="back"]')) { history.back(); return; }

      const backToDetail = target.closest('[data-action="back-to-detail"]');
      if (backToDetail) {
        history.back();
        return;
      }

      const openLead = target.closest('[data-action="open-lead-form"]');
      if (openLead) {
        showLeadForm(openLead.getAttribute('data-therapist'));
        return;
      }

      const card = target.closest('[data-therapist]');
      if (card && card.classList.contains('picker-card') && !card.hasAttribute('disabled')) {
        showDetail(card.getAttribute('data-therapist'));
      }
    });

    overlay.addEventListener('submit', (e) => {
      const form = e.target.closest('[data-lead-form]');
      if (form) {
        e.preventDefault();
        submitLeadForm(form);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.getAttribute('data-open') === 'true') {
        closeLightbox();
      }
    });

    return overlay;
  }

  const VIEW_TO_STEP = { quiz: 1, grid: 2, detail: 2, 'lead-form': 3 };

  function setStep(view) {
    if (!overlay) return;
    const stepper = overlay.querySelector('[data-stepper]');
    if (!stepper) return;
    const active = VIEW_TO_STEP[view] || 1;
    stepper.querySelectorAll('.lb-stepper__item').forEach((el) => {
      const n = Number(el.getAttribute('data-step'));
      el.classList.toggle('is-active', n === active);
      el.classList.toggle('is-inactive', n !== active);
    });
  }

  function setView(name) {
    overlay.querySelectorAll('[data-view]').forEach((el) => {
      el.hidden = el.getAttribute('data-view') !== name;
    });
    const title = overlay.querySelector('.lb__title');
    if (name === 'quiz') title.textContent = 'Find your therapist';
    else if (name === 'grid') title.textContent = 'Choose your therapist';
    else if (name === 'detail') title.textContent = 'Your therapist';
    else if (name === 'lead-form') title.textContent = 'Almost there';
    setStep(name);
    // Always reset the lightbox scroll container to the top on view change.
    // Otherwise switching from a scrolled-down grid into detail leaves the
    // user staring at the bottom of the detail panel instead of the photo.
    const body = overlay.querySelector('.lb__body');
    if (body) body.scrollTop = 0;
  }

  // ---------- History stack (so phone back walks lightbox views) ----------
  let inHistoryNav = false;
  let pushedDepth = 0;
  function pushView(name, payload) {
    if (inHistoryNav) return;
    try {
      const state = Object.assign({ mhView: name }, payload || {});
      history.pushState(state, '');
      pushedDepth++;
    } catch (_) { /* history may be unavailable */ }
  }

  function showQuiz() {
    const stage = overlay.querySelector('[data-view="quiz"]');
    stage.innerHTML = buildQuizView();
    const iframe = stage.querySelector('[data-quiz-iframe]');
    if (iframe && !iframe.getAttribute('src')) {
      iframe.src = buildTallySrc();
      iframe.addEventListener('load', onQuizIframeLoad);
    }
    bootTallyScript();
    setView('quiz');
    pushView('quiz');
  }

  function bootTallyScript() {
    if (tallyBooted) return;
    tallyBooted = true;
    if (document.querySelector('script[src="' + TALLY_SCRIPT + '"]')) return;
    const s = document.createElement('script');
    s.src = TALLY_SCRIPT;
    s.async = true;
    document.body.appendChild(s);
  }

  function onQuizIframeLoad(e) {
    const iframe = e.target;
    try {
      const href = iframe.contentWindow.location.href;
      const pathname = iframe.contentWindow.location.pathname;
      const matchedPath = PRACTITIONER_PATHS.find((p) => pathname.indexOf(p) === 0);
      pickerDebug('onQuizIframeLoad', { href: href, pathname: pathname, matchedPath: matchedPath });
      if (matchedPath) {
        const id = matchedPath.replace(/\//g, '');
        showGrid(id);
      }
    } catch (err) {
      pickerDebug('onQuizIframeLoad cross-origin', String(err));
    }
  }

  let lastRecommendedId = null;
  function showGrid(recommendedId) {
    if (recommendedId) lastRecommendedId = recommendedId;
    const renderId = recommendedId || lastRecommendedId;
    pickerDebug('showGrid', { arg: recommendedId, lastRecommendedId: lastRecommendedId, renderingWith: renderId });
    const stage = overlay.querySelector('[data-view="grid"]');
    stage.innerHTML = buildGrid(renderId);
    setView('grid');
    stage.scrollTop = 0;
    pushView('grid');
  }

  function showDetail(id) {
    const t = findTherapist(id);
    if (!t || t.disabled) return;
    const panel = overlay.querySelector('[data-view="detail"]');
    panel.innerHTML = buildDetail(t);
    setView('detail');
    panel.scrollTop = 0;
    pushView('detail', { tid: t.id });
  }

  function showLeadForm(id) {
    const t = findTherapist(id);
    if (!t) return;
    const stage = overlay.querySelector('[data-view="lead-form"]');
    stage.innerHTML = buildLeadForm(t);
    setView('lead-form');
    stage.scrollTop = 0;
    const first = stage.querySelector('input[name="first_name"]');
    if (first) setTimeout(() => first.focus(), 50);
    pushView('lead-form', { tid: t.id });
  }

  function submitLeadForm(form) {
    const submitBtn = form.querySelector('[data-lead-submit]');
    const errEl = form.querySelector('[data-lead-err]');
    const therapistId = form.getAttribute('data-therapist');
    const t = findTherapist(therapistId);

    const recT = lastRecommendedId ? findTherapist(lastRecommendedId) : null;
    const data = {
      first_name: (form.first_name.value || '').trim(),
      last_name: (form.last_name.value || '').trim(),
      email: (form.email.value || '').trim(),
      phone: (form.phone.value || '').trim(),
      selected_therapist: t ? t.name : therapistId,
      selected_therapist_id: therapistId,
      recommended_therapist: recT ? recT.name : '',
      recommended_therapist_id: lastRecommendedId || '',
      matched_recommendation: lastRecommendedId ? (lastRecommendedId === therapistId) : null,
      ...collectUtms()
    };

    if (!data.first_name || !data.last_name || !data.email || !data.phone) {
      errEl.textContent = 'Please fill in all fields.';
      errEl.hidden = false;
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errEl.textContent = 'That email doesn’t look right.';
      errEl.hidden = false;
      return;
    }
    errEl.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';

    const stash = {
      ...data,
      ts: new Date().toISOString()
    };
    try { sessionStorage.setItem('mh_lead', JSON.stringify(stash)); } catch (_) {}

    postLead(data)
      .catch(() => { /* fall through; stashed data still lets confirmation page work */ })
      .finally(() => {
        window.location.href = CONFIRMATION_PATH;
      });
  }

  function postLead(data) {
    if (!LEAD_CAPTURE_ENDPOINT || LEAD_CAPTURE_ENDPOINT === 'REPLACE_WITH_APPS_SCRIPT_URL') {
      return Promise.resolve();
    }
    return fetch(LEAD_CAPTURE_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'lead', ...data })
    });
  }

  function openLightbox() {
    ensureOverlay();
    lastFocus = document.activeElement;
    overlay.setAttribute('data-open', 'true');
    document.body.style.overflow = 'hidden';
    showQuiz();
  }

  function closeLightbox() {
    if (!overlay) return;
    overlay.setAttribute('data-open', 'false');
    document.body.style.overflow = '';
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    if (pushedDepth > 0) {
      const n = pushedDepth;
      pushedDepth = 0;
      inHistoryNav = true;
      try { history.go(-n); } catch (_) {}
      setTimeout(function () { inHistoryNav = false; }, 80);
    }
  }

  function init() {
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-open-picker]');
      if (trigger) {
        e.preventDefault();
        openLightbox();
      }
    });

    // Phone back button walks the lightbox view stack (quiz → grid →
    // detail → lead-form) instead of leaving the page.
    window.addEventListener('popstate', function (e) {
      if (!overlay || overlay.getAttribute('data-open') !== 'true') return;
      pushedDepth = Math.max(0, pushedDepth - 1);
      const s = e.state || {};
      inHistoryNav = true;
      try {
        if (s.mhView === 'quiz') {
          setView('quiz');
        } else if (s.mhView === 'grid') {
          const stage = overlay.querySelector('[data-view="grid"]');
          stage.innerHTML = buildGrid(lastRecommendedId);
          setView('grid');
        } else if (s.mhView === 'detail' && s.tid) {
          const t = findTherapist(s.tid);
          if (t) {
            const panel = overlay.querySelector('[data-view="detail"]');
            panel.innerHTML = buildDetail(t);
            setView('detail');
          }
        } else if (s.mhView === 'lead-form' && s.tid) {
          const t = findTherapist(s.tid);
          if (t) {
            const stage = overlay.querySelector('[data-view="lead-form"]');
            stage.innerHTML = buildLeadForm(t);
            setView('lead-form');
          }
        } else {
          // Popped past all our pushed states — close visually only;
          // history is already where the user expects.
          overlay.setAttribute('data-open', 'false');
          document.body.style.overflow = '';
          if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
        }
      } finally {
        setTimeout(function () { inHistoryNav = false; }, 0);
      }
    });

    // Fallback: catch Tally postMessage events in case sandbox blocks redirect
    // entirely. We may not get the recommended therapist, but we still advance
    // the user into the picker rather than stranding them on the form.
    //
    // Path-anchored: only matches a therapist id when it appears as a URL path
    // segment or query-param value. Naive substring match used to false-positive
    // on Tally postMessage payloads that included all therapist names in option
    // text and always returned 'brookelyn' (first in the list).
    function findRecommendedIn(text) {
      if (typeof text !== 'string') return null;
      const m = text.match(/[\/=](brookelyn|meagan|charlotte|lindsey|tif)(?:[\/?#&"']|$)/i);
      return m ? m[1].toLowerCase() : null;
    }

    function recheckIframePath(attempt) {
      if (!overlay) return;
      const iframe = overlay.querySelector('[data-quiz-iframe]');
      if (!iframe) return;
      try {
        const path = iframe.contentWindow.location.pathname || '';
        const id = findRecommendedIn(path);
        pickerDebug('recheckIframePath', { attempt: attempt, path: path, match: id });
        if (id) { showGrid(id); return; }
      } catch (err) {
        pickerDebug('recheckIframePath cross-origin', { attempt: attempt, err: String(err) });
      }
      if (attempt < 8) setTimeout(() => recheckIframePath(attempt + 1), 250);
    }

    window.addEventListener('message', (e) => {
      try {
        if (!e || e.data == null) return;
        const raw = typeof e.data === 'string' ? e.data : '';
        let payload = null;
        if (raw && raw.indexOf('Tally.') === 0) payload = { event: raw };
        else if (typeof e.data === 'object') payload = e.data;
        else if (raw) {
          try { payload = JSON.parse(raw); } catch (_) { /* not json */ }
        }
        if (!payload) return;
        const evt = payload.event || payload.type || '';
        const matchTally = (typeof evt === 'string' && evt.indexOf('Tally.') !== -1) ||
                           (raw && raw.indexOf('Tally.') === 0);
        if (!matchTally) return;
        const isSubmit = (typeof evt === 'string' && (evt.indexOf('FormSubmitted') !== -1 || evt.indexOf('FormSubmit') !== -1)) ||
                         (raw && (raw.indexOf('FormSubmitted') !== -1 || raw.indexOf('FormSubmit') !== -1));
        if (!isSubmit) return;
        if (!overlay || overlay.getAttribute('data-open') !== 'true') return;

        // Search the stringified payload for a practitioner id. The matcher
        // is path-anchored (looks for /id/ or =id) so postMessage payloads
        // that include question text mentioning all therapist names won't
        // false-positive on the first one in the list.
        let recommended = null;
        let stringified = '';
        try {
          stringified = JSON.stringify(payload);
          recommended = findRecommendedIn(stringified);
        } catch (_) {}
        pickerDebug('postMessage Tally submit', { rawType: typeof e.data, payload: payload, stringifiedLen: stringified.length, recommended: recommended });
        // Dump the full stringified payload so we can see where the
        // therapist id lives when our regex doesn't catch it. Slice so
        // huge payloads don't flood the console.
        if (stringified) pickerDebug('postMessage payload (full)', stringified.length > 4000 ? (stringified.slice(0, 4000) + '... [truncated]') : stringified);

        showGrid(recommended);
        // Belt-and-suspenders: keep checking the iframe URL for a moment in
        // case Tally navigates the iframe shortly after the message fires.
        recheckIframePath(0);
      } catch (err) {
        pickerDebug('postMessage handler error', String(err));
      }
    });
  }

  document.addEventListener('click', function (e) {
    const link = e.target.closest('a[href^="tel:"]');
    if (!link) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'call_click',
      call_phone: link.getAttribute('href').replace('tel:', ''),
      call_location: link.dataset.location || 'unknown',
      page_path: location.pathname
    });
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.MaximumHealth = window.MaximumHealth || {};
  window.MaximumHealth.openPicker = openLightbox;
  window.MaximumHealth.closePicker = closeLightbox;
  window.MaximumHealth.therapists = therapists;
  window.MaximumHealth.collectUtms = collectUtms;
  window.MaximumHealth.__endpoint = () => LEAD_CAPTURE_ENDPOINT;
})();
