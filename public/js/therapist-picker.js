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
  // Backend calls route through window.mhBackend (see public/js/mh-backend.js).
  // The endpoint URL lives there (window.MH_BACKEND_URL) -- single swap point.
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
      bio: 'Grounded therapist who listens deeply and meets you where you are. Brookelyn focuses on building resilience and empowerment, helping active people understand their bodies, make a plan together, and get back to the things they love without recurring setbacks. She came to massage therapy looking for a way to combine her interest in physiology with the trust-based, supportive side of working with people, and the practice has held both for her ever since.\n\nAs a runner, strength trainer, and mom of two, she also brings a personal understanding of how movement, recovery, and life pressures intersect. She’s especially passionate about postpartum recovery and women’s health, populations that are often underserved, and she’s deliberate about working without shame or "no pain, no gain" pressure, since lasting change comes from helping the body adapt, not pushing it past safe limits.',
      tags: ['Sports injuries', 'SI joint + low back', 'Cervical spine', 'Jade stone', 'Running', 'Strength + longevity', 'Women’s health', 'Postpartum recovery', 'Nervous system'],
      review: {
        text: '[STUB pending real Google review]',
        source: 'Google review'
      },
      experience: [
        '10,000+ hours hands-on',
        'Graduated MacEwan University, 2014',
        '11 years as RMT',
        'Member of Natural Health Practitioners of Canada',
        'Trained in Jade Stone therapy',
        'Trained in Kinetic massage for SI joint, low back, and cervical spine'
      ],
      duration: '60 min',
      price: 49,
      regularPrice: 124,
      path: '/brookelyn/',
      skills: {
        prenatal: {
          title: 'Postpartum + women’s health specialist',
          specialty: 'Postpartum recovery + pelvic',
          bio: 'Hi, I’m Brookelyn. Postpartum recovery and women’s health is the work I’m most passionate about, partly because I think it’s so often underserved. I love helping women rebuild strength, mobility, and confidence after pregnancy, without any "no pain, no gain" pressure. SI joint, hips, low back, returning to running, that’s my zone.\n\nI’m a runner, a strength trainer, and a mom of two myself, so I know the gap between "officially cleared at six weeks" and actually feeling like yourself again. We’ll figure out where you are right now and build a plan from there, together.',
          tags: ['Postpartum recovery', 'Women’s health', 'SI joint + low back', 'Pelvic care', 'Returning to running + strength', 'Mom of two', 'Side-lying massage', 'Nervous system aware']
        },
        deep_tissue: {
          title: 'SI joint, low back + cervical specialist',
          specialty: 'Targeted deep work + recovery',
          bio: 'Hi, I’m Brookelyn. If you’ve been carrying tension that won’t release no matter how many times you’ve stretched it out, I want to work with you. My specialty is Kinetic massage focused on the SI joint, low back, and cervical spine, areas where deep, targeted work makes the biggest difference. I have a soft spot for runners and strength athletes whose bodies hold tension from training, but really anyone with chronic knots is welcome.\n\nI work deep but not punishing. My approach is about helping your body adapt rather than overpowering it, so the relief actually lasts past the session. We’ll talk through what’s going on and what you’ve already tried, then build a plan together.',
          tags: ['Kinetic massage', 'SI joint + low back', 'Cervical spine', 'Sports + training tension', 'Postpartum recovery', 'Side-lying or table', 'Nervous system aware', 'Plan-based approach']
        },
        sports: {
          title: 'Sports + return-to-training specialist',
          specialty: 'Running + strength rehab',
          bio: 'Hi, I’m Brookelyn. I work most often with active people who want to keep training while addressing what their body needs. My specialty is Kinetic massage focused on the SI joint, low back, and cervical spine, the spots that take the most beating from running, lifting, and high-volume sport. I’ve got a soft spot for runners and strength athletes who want to keep going without breaking down.\n\nI’m a runner and strength trainer myself, so I know the gap between "your scan looks fine" and actually feeling ready to train again. We’ll figure out where you are and build a plan that respects both the injury and the goal.',
          tags: ['Kinetic massage', 'SI joint + low back', 'Cervical spine', 'Runner-focused', 'Strength + longevity', 'Return-to-training', 'Postpartum recovery', 'Nervous system aware']
        }
      }
    },
    {
      id: 'meagan',
      name: 'Meagan Brown',
      shortName: 'Meagan B.',
      title: 'Whole-body + craniosacral specialist',
      specialty: 'Whole-body + craniosacral',
      photo: '/images/therapists/meagan.jpg',
      bio: 'Deeply intuitive, whole-body therapist with calm energy and a broad toolkit. Meagan sees your body as an integrated system, not a list of separate parts, and tailors her approach to help you unwind tension, feel grounded, and make lasting shifts. Clients frequently describe her work as having a "magic touch", with a wicked sense of humour to match.\n\nHer background as a competitive athlete shapes how she thinks about movement and recovery, and her training in craniosacral therapy, reflexology, and Thai massage means she has range beyond standard treatments. She continues to take additional courses to expand her toolkit, and her own yoga and fitness practice keeps her in touch with what it actually feels like to live in a working body.',
      tags: ['Craniosacral therapy', 'Reflexology', 'Thai massage', 'Whole-body approach', 'Therapeutic massage', 'Sports knowledge', 'Stress relief', 'Nervous system'],
      review: {
        text: 'I had the best massage therapist I’ve ever had, Meagan Brown has the magic touch, soothing relaxing, her knowledge of the body is amazing and she’ll hit your pain spots with soothing hands and has a wicked personality!!',
        reviewerName: 'Wes Woznow',
        source: 'Google review'
      },
      experience: [
        '10,000+ hours hands-on',
        'Graduated 2004',
        'Trained in Craniosacral Therapy',
        'Trained in Reflexology',
        'Trained in Thai Massage',
        'Athletic background; ongoing CE coursework'
      ],
      duration: '60 min',
      price: 49,
      regularPrice: 124,
      path: '/meagan/',
      skills: {
        sports: {
          title: 'Whole-body + athletic recovery specialist',
          specialty: 'Whole-body + sport recovery',
          bio: 'Hi, I’m Meagan. I came up as a competitive athlete, so I think a lot about how the body works as one integrated system, not separate parts. My approach combines therapeutic massage with craniosacral and reflexology training, which helps with the recovery side: better sleep, calmer nervous system, faster bounce-back between sessions.\n\nI keep moving myself, yoga, fitness, ongoing CE courses, so I know what it feels like to live in a working body. If you want recovery work that respects both the muscles you’re training and the system supporting them, let’s chat.',
          tags: ['Craniosacral therapy', 'Reflexology', 'Whole-body approach', 'Athletic recovery', 'Sleep + nervous system', 'Therapeutic massage', 'Thai massage', 'Ongoing CE']
        }
      }
    },
    {
      id: 'charlotte',
      name: 'Charlotte Tooth',
      shortName: 'Charlotte T.',
      title: 'Chronic pain + myofascial release specialist',
      specialty: 'Chronic pain + cupping',
      photo: '/images/therapists/charlotte.webp?v=2',
      bio: 'Results-focused therapist with clinical precision and calm compassion. Charlotte combines advanced myofascial and trigger-point expertise with a deep commitment to client education, so you understand what’s happening in your body, not just leave the session feeling temporarily better. Her background spans a PhD in Nutritional Biochemistry and more than a decade teaching massage therapy at the college level, so the science behind every technique matters to her.\n\nShe also brings a deeply personal understanding of pain. After fracturing two vertebrae in 2006, Charlotte lived through a long rehab herself, learning firsthand how chronic pain shapes everyday life. That’s why she works gently and patiently with clients in similar situations, partnering with you on changes that last rather than pushing through pain to chase a quick result.',
      tags: ['Myofascial release', 'Trigger point', 'Dynamic cupping', 'Lymphatic drainage', 'Pre/post-partum', 'Reiki', 'Back pain', 'Injury recovery', 'Chronic pain', 'Client education'],
      review: {
        text: 'Charlotte is an experienced and knowledgeable professional! [...] Best massage therapist ever! Highly recommend!!',
        source: 'Google review'
      },
      experience: [
        '7,200+ hours hands-on',
        'Graduated Vickars School of Massage Therapy, 2012',
        'Member of CMMOTA in good standing',
        'PhD in Nutritional Biochemistry, Nottingham University',
        'Reiki Master',
        'CEUs in Trigger Point, Myofascial Release, Cupping, Lymphatic Drainage, Pre/post-partum, Aromatherapy',
        'Massage instructor at ABM College and ERP College'
      ],
      duration: '90 min',
      price: 49,
      regularPrice: 124,
      path: '/charlotte/',
      skills: {
        prenatal: {
          title: 'Pre/post-partum + recovery specialist',
          specialty: 'C-section + chronic back pain',
          bio: 'Hi, I’m Charlotte. I bring specialized pre/post-partum training together with myofascial, trigger-point, and lymphatic drainage work, especially for c-section recovery, scar sensitivity, and the chronic back, hip, and shoulder pain that often lingers after pregnancy. I also have a PhD in Nutritional Biochemistry and have spent over a decade teaching massage therapy, so the science behind what I’m doing matters to me.\n\nI also know what long recovery looks like personally, after fracturing two vertebrae in 2006. That experience taught me to work gently and patiently and to never push through pain to chase a quick result. If your body is in a season of change, I’d love to help.',
          tags: ['Pre/post-partum CEU', 'C-section recovery', 'Lymphatic drainage', 'Trigger point', 'Myofascial release', 'Chronic back pain', 'Side-lying massage', 'Reiki Master']
        },
        deep_tissue: {
          title: 'Myofascial + trigger point specialist',
          specialty: 'Chronic knots + clinical deep work',
          bio: 'Hi, I’m Charlotte. Deep clinical work for chronic pain is what I do, myofascial release, trigger point therapy, and lymphatic drainage when there’s inflammation involved. My background is twofold: a PhD in Nutritional Biochemistry and over a decade teaching massage therapy at the college level, so I think a lot about what’s actually happening in the tissue I’m working on.\n\nI also know chronic pain personally. I fractured two vertebrae in 2006 and went through a long rehab, so I work patiently and gently, even when the pressure is firm. The technique is never about pushing through pain for show. We’ll find what works for your body without setting you back.',
          tags: ['Myofascial release', 'Trigger point', 'Chronic pain', 'Back + shoulder', 'Lymphatic drainage', 'Client education', 'PhD biochemistry', 'Reiki Master']
        },
        sports: {
          title: 'Injury recovery + myofascial specialist',
          specialty: 'Sports injury + chronic rehab',
          bio: 'Hi, I’m Charlotte. I work with people whose injuries didn’t quite resolve the way they were supposed to. Old strains, areas of chronic tightness that limit your movement, post-surgical bodies that need patient, science-backed rehab. I bring myofascial release, trigger point therapy, and lymphatic drainage when there’s lingering inflammation.\n\nI also know what real rehab looks like personally, after fracturing two vertebrae in 2006, I went through a long recovery. That experience taught me to work patiently, to never push through pain for show, and to find what actually moves the needle for each body. If your body needs more than a flush massage to get back, I’d love to help.',
          tags: ['Myofascial release', 'Trigger point', 'Sports injury recovery', 'Chronic strain', 'Post-surgical', 'Lymphatic drainage', 'Client education', 'PhD biochemistry']
        },
        tmj: {
          title: 'Trigger point + jaw tension specialist',
          specialty: 'Jaw + chronic headaches',
          bio: 'Hi, I’m Charlotte. Jaw tension and tension headaches often live in tissue patterns that involve a lot more than just the jaw, neck, shoulders, even the upper back. My specialty is trigger point and myofascial work, which is the kind of targeted, methodical work these areas tend to respond to. I’ll find the contributing patterns, not just the loudest spot.\n\nI also bring perspective from my PhD in Nutritional Biochemistry and a decade teaching massage, so I think a lot about why your tissue is doing what it’s doing. If your TMJ or headaches haven’t responded to surface-level work, let’s go deeper together.',
          tags: ['Trigger point', 'Myofascial release', 'Jaw + neck patterns', 'Tension headaches', 'Chronic pain', 'PhD biochemistry', 'Client education', 'Reiki Master']
        },
        lymphatic: {
          title: 'Lymphatic drainage + post-surgical specialist',
          specialty: 'Post-op + chronic inflammation',
          bio: 'Hi, I’m Charlotte. Lymphatic drainage is one of my favourite areas to work in, because it’s both technically interesting and deeply helpful. For post-surgical bodies, chronic inflammation, autoimmune conditions, and lymphedema, the right kind of gentle, rhythmic work can make a real difference. I have a CEU specifically in lymphatic drainage and a decade of experience applying it.\n\nMy background also includes a PhD in Nutritional Biochemistry, which means I think about your tissue and what’s happening in it at a fairly granular level. If your body is dealing with persistent swelling or recovering from something significant, I’d love to help.',
          tags: ['Lymphatic drainage (CEU)', 'Post-surgical', 'Chronic inflammation', 'Autoimmune support', 'Lymphedema', 'Myofascial release', 'PhD biochemistry', 'Patient + adaptive']
        }
      }
    },
    {
      id: 'lindsey',
      name: 'Lindsey Stauffer',
      shortName: 'Lindsey S.',
      title: 'Prenatal & postnatal + fascia release specialist',
      specialty: 'Prenatal & Postnatal + Fascia Release',
      photo: '/images/therapists/lindsey.webp?v=2',
      bio: 'Calm, detail-oriented therapist with a deeply supportive presence. Lindsey blends fascial-release techniques with nervous-system awareness to help you release deep tension and return to ease, whether that’s recovering from injury or just reclaiming balance in a busy life. Her belief is that a regulated nervous system is the root of real healing, so she works at a pace your body can actually integrate.\n\nAs a yoga teacher since 2014 (with a focus on prenatal yoga), a doula, a breathwork facilitator, and a current student of acupuncture, she draws from a wide toolkit. She’s also a mom of three, so she gets what overstretched parents and overstimulated professionals are dealing with, and she meets clients there with empathy and practical strategies rather than a one-size-fits-all approach.',
      tags: ['Fascial release', 'Nervous system', 'Yoga teacher', 'Prenatal + postnatal', 'Doula', 'Acupuncture (in training)', 'Breathwork', 'Stress + chronic pain', 'Family-focused'],
      review: {
        text: '[STUB pending real Google review]',
        source: 'Google review'
      },
      experience: [
        '4,000+ hours hands-on',
        'Graduated 2022',
        'Trained in Fascial Release',
        'Yoga Teacher Certification (incl. prenatal yoga, teaching since 2014)',
        'Doula Certification (birth and postpartum)',
        'Breathwork facilitator',
        'Current student of Acupuncture'
      ],
      duration: '60 min',
      price: 49,
      regularPrice: 124,
      path: '/lindsey/',
      skills: {
        prenatal: {
          title: 'Prenatal & postpartum specialist',
          specialty: 'Prenatal yoga + doula',
          bio: 'Hi, I’m Lindsey. My whole practice has grown around supporting bodies through pregnancy and into postpartum. I work in side-lying with lots of cushions, blending fascial release with nervous-system-aware care so the session feels calming rather than jarring. I move at a pace your body can actually integrate, no matter what trimester you’re in.\n\nI’ve been teaching prenatal yoga since 2014, I’m a certified doula (birth and postpartum), a breathwork facilitator, and a mom of three. So I get it from the inside, the exhaustion, the tenderness, all of it. If you want someone who’s calm, patient, and fully present for whatever season you’re in, I’d love to take care of you.',
          tags: ['Prenatal yoga (since 2014)', 'Doula (birth + postpartum)', 'Side-lying massage', 'Nervous system regulation', 'Breathwork', 'Mom of three', 'Postpartum recovery', 'Pregnancy anxiety + sleep']
        }
      }
    },
    {
      id: 'tif',
      name: 'Tif Henderson',
      shortName: 'Tif H.',
      title: 'Personalized + perinatal specialist',
      specialty: 'Personalized + perinatal',
      photo: '/images/therapists/tif.webp',
      bio: 'Personalized therapist who tailors every session to your needs. Tif combines technical skill in Swedish, deep tissue, and lymphatic work with genuine care, creating a customized plan that helps you reach your specific wellness goals, whether that’s tension relief, stress reduction, or pain management.\n\nOutside the clinic, she’s a musician and artist who spends as much time outdoors as the weather allows, hiking, biking, and skiing with her husband and dog. That same care for what makes life feel good shows up on the table: she partners with you on a plan that supports both immediate relief and long-term wellbeing.',
      tags: ['Swedish', 'Deep tissue', 'Lymphatic drainage', 'Pre & post-natal', 'TMJ + facial', 'Stress reduction', 'Pain management', 'Personalized approach'],
      review: {
        text: '[STUB replace with a real Google review once available.]',
        source: 'Google review'
      },
      experience: [
        '2,200-hour Advanced Massage Therapy graduate',
        'Graduated Professional Institute of Massage Therapy, Calgary',
        'Member of CMMOTA in good standing'
      ],
      duration: '60 min',
      price: 49,
      regularPrice: 124,
      path: '/tif/',
      skills: {
        prenatal: {
          title: 'Pre & post-natal + lymphatic specialist',
          specialty: 'Pregnancy edema + lymphatic',
          bio: 'Hi, I’m Tif. I tailor every session to whatever you’re navigating that day, swelling, headaches, jaw tension, or just needing some calm. My training spans Swedish, deep tissue, lymphatic drainage, and pre/post-natal massage, so I can shift from gentle relaxation into focused lymphatic work in the same session if that’s what you need.\n\nOutside the clinic, I’m a musician and an artist who spends as much time outside as the weather allows, hiking, biking, and skiing with my husband and our dog. I’d love to bring that same care for what makes life feel good into your sessions.',
          tags: ['Pre & post-natal trained', 'Lymphatic drainage (edema)', 'Side-lying Swedish', 'TMJ + jaw tension', 'Pregnancy headaches', 'Personalized approach', 'Stress reduction', 'Pain management']
        },
        deep_tissue: {
          title: 'Deep tissue + targeted relief specialist',
          specialty: 'Adaptable pressure + targeted spots',
          bio: 'Hi, I’m Tif. I tailor every session, and that includes the pressure. Some days you need firm targeted work on a specific spot, other days you need lymphatic flow on swollen tissue, and sometimes you need a bit of both in the same hour. I read what your body is asking for and adjust as we go.\n\nOutside the clinic I’m a musician and an artist who spends as much time outside as possible. I love bringing that same attention and care to your sessions, helping you feel like the version of yourself that isn’t carrying around three months of accumulated tension.',
          tags: ['Deep tissue', 'Targeted relief', 'Lymphatic drainage', 'TMJ + jaw tension', 'Adaptive pressure', 'Personalized approach', 'Swedish', 'Pain management']
        },
        tmj: {
          title: 'TMJ + jaw tension specialist',
          specialty: 'TMJ + facial work',
          bio: 'Hi, I’m Tif. Jaw tension, TMJ, headaches that start at the temples, this is one of the areas I love working on most. My training spans Swedish, deep tissue, lymphatic drainage, and specialized facial and TMJ massage, which means I can work both the obvious spots (jaw, temples, neck) and the often-missed connections that contribute to it.\n\nOutside the clinic I’m a musician and an artist who spends as much time outside as possible. I bring that same attentiveness to your session: what’s tight, what’s compensating, what your jaw is trying to tell us.',
          tags: ['TMJ + facial massage', 'Jaw tension', 'Tension headaches', 'Neck + cervical', 'Lymphatic drainage', 'Personalized pressure', 'Swedish', 'Stress reduction']
        },
        lymphatic: {
          title: 'Lymphatic + edema relief specialist',
          specialty: 'Edema + pregnancy swelling',
          bio: 'Hi, I’m Tif. Lymphatic drainage is one of the modalities I trained in specifically because it does something so specific, it actually moves stuck fluid out of swollen tissue, gently, without forcing anything. I work with pregnancy swelling, post-workout edema, lingering inflammation, and anyone whose body is holding more fluid than it should.\n\nOutside the clinic I’m a musician and an artist who spends as much time outside as possible. I love bringing the same attentive, gentle care to lymphatic sessions, they’re meant to be calming, not clinical-feeling.',
          tags: ['Lymphatic drainage', 'Pregnancy edema', 'Post-workout swelling', 'Gentle + adaptive', 'Swedish', 'Personalized', 'Pre & post-natal', 'Stress reduction']
        }
      }
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

  // ---------- Page-aware profile resolution ----------
  // currentSkill is set from the page config (window.MaximumHealth.PAGE_CONFIGS)
  // at init time. Defaults to 'general' so Flow B + any unconfigured page
  // continues to render the existing flat-field profile.
  let currentSkill = 'general';
  let currentPageConfig = null;

  function hasSkill(t, skill) {
    if (!skill || skill === 'general') return true;
    return !!(t.skills && t.skills[skill]);
  }

  // Returns the active profile for therapist `t` under `skill`.
  // For 'general' (or missing skill), returns the flat top-level fields.
  // For a known skill, merges the per-skill override on top of those, so any
  // field the override doesn't specify falls back to the general value.
  function getProfile(t, skill) {
    const base = {
      title: t.title,
      specialty: t.specialty,
      bio: t.bio,
      tags: t.tags,
      experience: t.experience,
      review: t.review
    };
    if (!skill || skill === 'general') return base;
    const ovr = (t.skills && t.skills[skill]) || null;
    if (!ovr) return base;
    return {
      title: ovr.title || base.title,
      specialty: ovr.specialty || base.specialty,
      bio: ovr.bio || base.bio,
      tags: ovr.tags || base.tags,
      experience: ovr.experience || base.experience,
      review: ovr.review || base.review
    };
  }

  // Returns the visible therapist list filtered by the current page's skill.
  // For 'general', returns all therapists (including the disabled placeholder
  // entries Kassandra/Tracy). For any other skill, returns only therapists
  // who have a skills.<skill> block defined.
  function visibleTherapists() {
    if (!currentSkill || currentSkill === 'general') return therapists;
    return therapists.filter((t) => hasSkill(t, currentSkill));
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
    const list = visibleTherapists();
    const hasDisabled = list.some((t) => t.disabled);
    return `
      ${recommendedId ? '<p class="picker-intro">Based on your answers, we recommend <strong>' + escapeHtml(findTherapist(recommendedId).name.split(" ")[0]) + '</strong>, but pick whoever feels right. <span class="picker-intro__hint">Tap any therapist to learn more about them.</span></p>' : ''}
      <div class="picker-grid">
        ${list.map((t) => {
          const isRecommended = t.id === recommendedId;
          const isDisabled = !!t.disabled;
          const profile = getProfile(t, currentSkill);
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
              <p class="picker-card__spec">${escapeHtml(profile.specialty)}</p>
              ${isDisabled ? '<p class="picker-card__disabled-label">' + escapeHtml(t.disabledLabel) + '</p>' : ''}
            </button>
          `;
        }).join('')}
      </div>
      ${hasDisabled ? '<p class="picker-foot">Tap a therapist to see more. Some of our team are currently fully booked.</p>' : '<p class="picker-foot">Tap a therapist to see more about them.</p>'}
    `;
  }

  function findTherapist(id) {
    return therapists.find((x) => x.id === id);
  }

  function buildReviewCard(t) {
    const profile = getProfile(t, currentSkill);
    const r = profile.review || {};
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
    const profile = getProfile(t, currentSkill);
    const tagsHtml = profile.tags.map((tag) => `<span class="detail-panel__tag">${escapeHtml(tag)}</span>`).join('');
    // experience can be a string (legacy) or an array of credential lines.
    // Array form renders as a vertical bullet list, easier to scan than a
    // dense paragraph when the therapist has many credentials.
    const expHtml = Array.isArray(profile.experience)
      ? '<ul class="detail-panel__creds">' + profile.experience.map((line) => `<li>${escapeHtml(line)}</li>`).join('') + '</ul>'
      : `<p class="detail-panel__exp">${escapeHtml(profile.experience)}</p>`;
    // bio is a single string with `\n\n` separators between paragraphs.
    // Render one <p> per paragraph so the detail panel reads as prose.
    const bioHtml = String(profile.bio || '')
      .split(/\n\n+/)
      .filter((p) => p.trim().length > 0)
      .map((p) => `<p class="detail-panel__bio">${escapeHtml(p.trim())}</p>`)
      .join('');
    return `
      <button type="button" class="detail-panel__back" data-action="back">
        <span aria-hidden="true">&larr;</span> All therapists
      </button>
      <div class="detail-panel__body">
        <img class="detail-panel__photo" src="${t.photo}" alt="${escapeHtml(t.name)}">
        <h3 class="detail-panel__name">${escapeHtml(t.name)}, RMT</h3>
        <p class="detail-panel__title">${escapeHtml(profile.title)}</p>
        ${bioHtml}
        <div class="detail-panel__tags">${tagsHtml}</div>
        ${expHtml}
        ${buildReviewCard(t)}
        <p class="detail-panel__price">
          $${t.price}
          <span class="detail-panel__price-old">$${t.regularPrice}</span>
          <span class="cta-card__badge">New patient starter offer</span>
        </p>
        <button type="button" class="btn btn--primary btn--block" data-action="book" data-therapist="${t.id}">
          Book with ${escapeHtml(t.name.split(' ')[0])}, ${escapeHtml(t.duration)}
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
          <div class="lb__stage" data-view="calendar" hidden></div>
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

      const bookBtn = target.closest('[data-action="book"]');
      if (bookBtn) {
        const bid = bookBtn.getAttribute('data-therapist');
        // Gate: only bookingMode:'calcom' pages with an active therapist open
        // the Cal.com calendar; everyone else keeps the demand-test lead form.
        if (usesCalcom(bid)) showCalendar(bid);
        else showLeadForm(bid);
        return;
      }

      // Native quiz option button
      const quizOpt = target.closest('[data-quiz-option]');
      if (quizOpt) {
        handleNativeQuizAnswer(quizOpt.getAttribute('data-quiz-q'), quizOpt.getAttribute('data-quiz-option'));
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

  const VIEW_TO_STEP = { quiz: 1, grid: 2, detail: 2, calendar: 3, 'lead-form': 3 };

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
    else if (name === 'calendar') title.textContent = 'Choose your time';
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
    // Native quiz path: page config carries an array of weighted questions.
    if (currentPageConfig && Array.isArray(currentPageConfig.quizQuestions) && currentPageConfig.quizQuestions.length > 0) {
      nativeQuizState = { qIdx: 0, answers: [] };
      stage.innerHTML = renderNativeQuestion(currentPageConfig.quizQuestions, 0);
      setView('quiz');
      pushView('quiz');
      return;
    }
    // Fallback: Tally iframe (Flow B "general" still uses this).
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

  // ---------- Native quiz ----------
  let nativeQuizState = { qIdx: 0, answers: [] };

  function renderNativeQuestion(questions, qIdx) {
    const q = questions[qIdx];
    const total = questions.length;
    const optionsHtml = q.options.map((opt) =>
      `<button type="button" class="native-quiz__option" data-quiz-option="${escapeHtml(opt.id)}" data-quiz-q="${escapeHtml(q.id)}">${escapeHtml(opt.label)}</button>`
    ).join('');
    return `
      <div class="native-quiz" data-view-root="quiz">
        <p class="native-quiz__progress">Question ${qIdx + 1} of ${total}</p>
        <h3 class="native-quiz__heading">${escapeHtml(q.text)}</h3>
        <div class="native-quiz__options">${optionsHtml}</div>
      </div>
    `;
  }

  function handleNativeQuizAnswer(qId, optId) {
    const questions = currentPageConfig && currentPageConfig.quizQuestions;
    if (!Array.isArray(questions)) return;
    const q = questions[nativeQuizState.qIdx];
    if (!q || q.id !== qId) return;
    const opt = q.options.find((o) => o.id === optId);
    if (!opt) return;
    nativeQuizState.answers.push({ qId: q.id, qText: q.text, optId: opt.id, optLabel: opt.label, weights: opt.weights || {} });
    nativeQuizState.qIdx += 1;
    if (nativeQuizState.qIdx < questions.length) {
      const stage = overlay.querySelector('[data-view="quiz"]');
      stage.innerHTML = renderNativeQuestion(questions, nativeQuizState.qIdx);
    } else {
      finishNativeQuiz();
    }
  }

  function finishNativeQuiz() {
    const totals = {};
    nativeQuizState.answers.forEach((a) => {
      Object.keys(a.weights || {}).forEach((tid) => {
        totals[tid] = (totals[tid] || 0) + a.weights[tid];
      });
    });
    // Highest-scoring therapist; tie broken by Q1 (stage) score, which the
    // first answer's weights map will naturally bias since Q1 is loaded
    // most heavily for stage-specific recommendations.
    let bestId = null, bestScore = -Infinity;
    Object.keys(totals).forEach((tid) => {
      if (totals[tid] > bestScore) { bestScore = totals[tid]; bestId = tid; }
    });
    pickerDebug('native quiz complete', { totals: totals, recommended: bestId, answers: nativeQuizState.answers });
    // Fire-and-forget quiz submission (non-blocking).
    postQuizSubmission(nativeQuizState.answers, bestId);
    showGrid(bestId);
  }

  function postQuizSubmission(answers, recommendedId) {
    if (!window.mhBackend) return;
    const skill = (currentPageConfig && currentPageConfig.skill) || 'general';
    window.mhBackend.post('quiz_submission', {
      skill: skill,
      recommended_therapist_id: recommendedId || '',
      answers: answers.map((a) => ({ question: a.qText, answer: a.optLabel, qId: a.qId, optId: a.optId })),
      ...collectUtms()
    });
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

  // ---------- Cal.com calendar step (bookingMode: 'calcom') ----------
  const CAL_NS = 'mhbooking';
  let calInited = false;
  let currentCalendarTherapistId = null;

  function getBooking(id) {
    const map = window.MaximumHealth && window.MaximumHealth.THERAPIST_BOOKING;
    return (map && map[id]) || null;
  }

  // A page uses the live Cal.com flow for a therapist only when the page is
  // bookingMode:'calcom' AND the therapist is active with a handle. Otherwise
  // the demand-test lead form is used (Tif, benched pages, general page).
  function usesCalcom(id) {
    const mode = currentPageConfig && currentPageConfig.bookingMode;
    if (mode !== 'calcom') return false;
    const b = getBooking(id);
    return !!(b && b.active && b.handle);
  }

  // Values prefilled into the Cal booking's hidden fields, so they flow back to
  // us in the BOOKING_CREATED webhook (skill + recommended therapist +
  // attribution). Only fields that exist on the Cal event type.
  function calPrefillParams() {
    const utms = collectUtms();
    const params = {};
    ['gclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((k) => {
      if (utms[k]) params[k] = utms[k];
    });
    params.skill = currentSkill || 'general';
    if (lastRecommendedId) params.recommended_therapist_id = lastRecommendedId;
    return params;
  }

  // Cal's bookingSuccessfulV2 title is "<event> between <Therapist> and <Attendee>".
  function parseAttendeeFirstName(title) {
    if (typeof title !== 'string') return '';
    const idx = title.lastIndexOf(' and ');
    if (idx === -1) return '';
    const attendee = title.slice(idx + 5).trim();
    return (attendee.split(/\s+/)[0] || '');
  }

  // Channel A: the lean browser event fires here. We do NOT post the record
  // (that arrives server-side via the BOOKING_CREATED webhook, Channel B). We
  // only redirect to /booking-confirmed/ with enough context to personalize
  // the page and fire the guarded conversion there.
  function onCalBookingSuccess(e) {
    const d = (e && e.detail && e.detail.data) || {};
    const params = new URLSearchParams();
    if (d.uid) params.set('bid', d.uid);
    if (currentSkill) params.set('skill', currentSkill);
    if (currentCalendarTherapistId) params.set('therapist', currentCalendarTherapistId);
    if (d.startTime) params.set('start', d.startTime);
    if (d.endTime) params.set('end', d.endTime);
    const name = parseAttendeeFirstName(d.title);
    if (name) params.set('name', name);
    window.location.href = '/booking-confirmed/?' + params.toString();
  }

  function ensureCalInit() {
    if (calInited) return;
    calInited = true;
    // Cal.com embed loader stub (standard snippet), loaded lazily on first
    // calendar open so pages don't pull Cal until the visitor clicks Book.
    (function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if (typeof namespace === "string") { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ["initNamespace", namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
    try {
      window.Cal("init", CAL_NS, { origin: "https://app.cal.com" });
      window.Cal.ns[CAL_NS]("ui", { hideEventTypeDetails: false, layout: "month_view" });
      window.Cal.ns[CAL_NS]("on", { action: "bookingSuccessfulV2", callback: onCalBookingSuccess });
    } catch (_) { /* Cal unavailable; leave the embed empty */ }
  }

  function mountCalEmbed(booking, el) {
    if (!booking || !booking.handle || !el) return;
    ensureCalInit();
    el.innerHTML = '';
    const calLink = booking.handle + '?' + new URLSearchParams(calPrefillParams()).toString();
    try {
      window.Cal.ns[CAL_NS]('inline', { elementOrSelector: el, config: { layout: 'month_view' }, calLink: calLink });
    } catch (_) { /* swallow */ }
  }

  function buildCalendarView(t) {
    return `
      <button type="button" class="detail-panel__back" data-action="back-to-detail" data-therapist="${t.id}">
        <span aria-hidden="true">&larr;</span> Back
      </button>
      <div class="lb-calendar">
        <h3 class="lb-calendar__title">Pick a time with ${escapeHtml(t.name.split(' ')[0])}</h3>
        <div class="lb-calendar__embed" data-cal-inline>
          <p class="lb-calendar__loading">Loading available times&hellip;</p>
        </div>
      </div>
    `;
  }

  function renderCalendar(t) {
    currentCalendarTherapistId = t.id;
    const stage = overlay.querySelector('[data-view="calendar"]');
    stage.innerHTML = buildCalendarView(t);
    setView('calendar');
    stage.scrollTop = 0;
    mountCalEmbed(getBooking(t.id), stage.querySelector('[data-cal-inline]'));
  }

  function showCalendar(id) {
    const t = findTherapist(id);
    if (!t) return;
    renderCalendar(t);
    pushView('calendar', { tid: t.id });
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
      skill: (currentPageConfig && currentPageConfig.skill) || 'general',
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
    return window.mhBackend ? window.mhBackend.post('lead', data) : Promise.resolve();
  }

  function openLightbox() {
    ensureOverlay();
    lastFocus = document.activeElement;
    overlay.setAttribute('data-open', 'true');
    document.body.style.overflow = 'hidden';
    showQuiz();
    // Pre-warm Cal.com on calcom pages: load embed.js + open the connection
    // while the visitor works through the quiz, so the calendar step feels
    // fast when they reach it (Cal's iframe is the heavy part).
    if (currentPageConfig && currentPageConfig.bookingMode === 'calcom') {
      try { ensureCalInit(); } catch (_) {}
    }
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
    // Resolve the active page config (set by /js/picker-config.js).
    // If no config is loaded or no entry matches, we fall back to the
    // default 'general' skill + Tally quiz, which is the original Flow B
    // behaviour. This makes the picker safe to use on pages that haven't
    // adopted the config layer yet.
    try {
      if (window.MaximumHealth && typeof window.MaximumHealth.resolvePageConfig === 'function') {
        const cfg = window.MaximumHealth.resolvePageConfig(window.location.pathname);
        if (cfg) {
          currentPageConfig = cfg;
          currentSkill = cfg.skill || 'general';
          pickerDebug('page config resolved', { pathname: window.location.pathname, skill: currentSkill, hasNativeQuiz: !!(cfg.quizQuestions && cfg.quizQuestions.length) });
        }
      }
    } catch (_) { /* config layer unavailable; keep defaults */ }

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
        } else if (s.mhView === 'calendar' && s.tid) {
          const t = findTherapist(s.tid);
          if (t) renderCalendar(t);
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
  window.MaximumHealth.__endpoint = () => window.MH_BACKEND_URL;
})();
