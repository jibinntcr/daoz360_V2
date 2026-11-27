/**
 * DAOZ360 — Complete Frontend Application Logic (Vanilla JS, PHP Laravel Compatible)
 * Zero framework dependencies. Automatically attaches Laravel X-CSRF-TOKEN headers
 * to backend POST requests while retaining client-side fallback resilience.
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. CONFIGURATION & KNOWLEDGE BASE DATA
     ========================================================================== */

  const BRAND_CONFIG = {
    name: 'DAOZ360',
    domain: 'https://daoz360.ai/',
    contactEmail: 'mail@daoz360.ai',
    loginUrl: '/login',
    registerUrl: '/register',
    privacyUrl: '/privacy-policy',
    pricingUrl: '/pricing',
    features: {
      media_library: true,
      content_previews: true,
      ai_writing_assistance: false,
      templates_and_hashtags: false,
      brand_workspaces: false,
      bulk_recurring_scheduling: false,
      agency_audience_card: false,
      integrations_section: false,
      trial_strip: false,
      cancellation_faq: false
    }
  };

  /* Central Price Book (Section 13B, 13C, 13F, 13G) */
  const PRICE_BOOK = {
    mode: 'quote', // 'quote' (Review/quote mode default) | 'ready' (Live checkout mode)
    researchDate: '2026-11-17',
    defaultBilling: 'monthly',
    defaultCurrency: 'INR',
    supportedCurrencies: ['INR', 'USD'],
    plans: {
      starter: {
        id: 'starter',
        name: 'Starter',
        accounts: 5,
        users: 1,
        deliveries: 300,
        ctaQuote: 'Enquire About Starter',
        ctaReady: 'Choose Starter',
        prices: {
          INR: {
            monthlyMinor: 99900,
            annualMinor: 999000,
            monthlyFormatted: '₹999',
            annualTotalFormatted: '₹9,990',
            annualMonthlyEquivalent: '₹832.50'
          },
          USD: {
            monthlyMinor: 1900,
            annualMinor: 19000,
            monthlyFormatted: '$19',
            annualTotalFormatted: '$190',
            annualMonthlyEquivalent: '$15.83'
          }
        }
      },
      growth: {
        id: 'growth',
        name: 'Growth',
        badge: 'Recommended for Teams',
        accounts: 15,
        users: 3,
        deliveries: 1500,
        ctaQuote: 'Enquire About Growth',
        ctaReady: 'Choose Growth',
        prices: {
          INR: {
            monthlyMinor: 249900,
            annualMinor: 2499000,
            monthlyFormatted: '₹2,499',
            annualTotalFormatted: '₹24,990',
            annualMonthlyEquivalent: '₹2,082.50'
          },
          USD: {
            monthlyMinor: 4900,
            annualMinor: 49000,
            monthlyFormatted: '$49',
            annualTotalFormatted: '$490',
            annualMonthlyEquivalent: '$40.83'
          }
        }
      },
      agency: {
        id: 'agency',
        name: 'Agency',
        accounts: 40,
        users: 10,
        deliveries: 5000,
        ctaQuote: 'Enquire About Agency',
        ctaReady: 'Choose Agency',
        prices: {
          INR: {
            monthlyMinor: 599900,
            annualMinor: 5999000,
            monthlyFormatted: '₹5,999',
            annualTotalFormatted: '₹59,990',
            annualMonthlyEquivalent: '₹4,999.17'
          },
          USD: {
            monthlyMinor: 9900,
            annualMinor: 99000,
            monthlyFormatted: '$99',
            annualTotalFormatted: '$990',
            annualMonthlyEquivalent: '$82.50'
          }
        }
      },
      custom: {
        id: 'custom',
        name: 'Custom',
        ctaQuote: 'Talk to Our Team',
        ctaReady: 'Talk to Our Team'
      }
    }
  };

  function getSelectedCurrency() {
    try {
      const saved = sessionStorage.getItem('daoz_pricing_currency');
      if (saved && PRICE_BOOK.supportedCurrencies.includes(saved)) {
        return saved;
      }
    } catch (e) {
      // Ignore storage errors
    }
    return PRICE_BOOK.defaultCurrency;
  }

  function getSelectedBilling() {
    try {
      const saved = sessionStorage.getItem('daoz_pricing_billing');
      if (saved === 'monthly' || saved === 'yearly') {
        return saved;
      }
    } catch (e) {
      // Ignore storage errors
    }
    return PRICE_BOOK.defaultBilling;
  }

  function getPricingChatReply(currency) {
    const cur = PRICE_BOOK.supportedCurrencies.includes(currency) ? currency : PRICE_BOOK.defaultCurrency;
    const starterPrice = PRICE_BOOK.plans.starter.prices[cur].monthlyFormatted;
    const growthPrice = PRICE_BOOK.plans.growth.prices[cur].monthlyFormatted;
    const agencyPrice = PRICE_BOOK.plans.agency.prices[cur].monthlyFormatted;

    if (PRICE_BOOK.mode === 'ready') {
      return `Starter is ${starterPrice}/month, Growth is ${growthPrice}/month, and Agency is ${agencyPrice}/month before applicable taxes. Yearly options are available. How many social accounts and people do you need?`;
    }
    return `Our proposed packages start at ${starterPrice}/month. Starter includes five accounts and one user; Growth supports small teams, and Agency supports larger account portfolios. Would you like help choosing a package?`;
  }

  /* Deterministic Tier Evaluator (Section 13H: if either limit exceeds a tier, evaluate the next tier) */
  function evaluateRecommendedPlan(accountsLabel, teamLabel, currency) {
    const cur = PRICE_BOOK.supportedCurrencies.includes(currency) ? currency : PRICE_BOOK.defaultCurrency;
    const accMap = {
      'Up to 5 accounts': 1,
      '6 to 15 accounts': 2,
      '16 to 40 accounts': 3,
      'More than 40 accounts': 4,
      'Not sure': 2
    };
    const teamMap = {
      '1 user (Solo)': 1,
      '2 to 3 users': 2,
      '4 to 10 users': 3,
      'More than 10 users': 4,
      'Not sure': 2
    };

    const accLevel = accMap[accountsLabel] || 2;
    const teamLevel = teamMap[teamLabel] || 2;
    const maxLevel = Math.max(accLevel, teamLevel);

    if (maxLevel === 1) {
      const p = PRICE_BOOK.plans.starter.prices[cur];
      return {
        planName: 'Starter',
        summary: `Starter (${p.monthlyFormatted}/month or ${p.annualTotalFormatted}/year — 5 connected accounts, 1 user, 300 monthly deliveries)`
      };
    }
    if (maxLevel === 2) {
      const p = PRICE_BOOK.plans.growth.prices[cur];
      return {
        planName: 'Growth (Recommended for Teams)',
        summary: `Growth (${p.monthlyFormatted}/month or ${p.annualTotalFormatted}/year — 15 connected accounts, 3 users, 1,500 monthly deliveries, team approvals)`
      };
    }
    if (maxLevel === 3) {
      const p = PRICE_BOOK.plans.agency.prices[cur];
      return {
        planName: 'Agency',
        summary: `Agency (${p.monthlyFormatted}/month or ${p.annualTotalFormatted}/year — 40 connected accounts, 10 users, 5,000 monthly deliveries)`
      };
    }
    return {
      planName: 'Custom Package',
      summary: 'Custom (Quoted package tailored for 40+ social accounts or 10+ team members)'
    };
  }

  const WORKFLOW_STAGES = {
    plan: {
      title: 'Give your content a clear direction.',
      body: 'Organise upcoming posts in a visual calendar and see how your content fits together across the week.',
      metrics: '3 Campaigns active • 14 Posts mapped'
    },
    create: {
      title: 'Make every message feel like your brand.',
      body: 'Draft your content, bring in your media and prepare the right version for each connected channel.',
      metrics: 'Visual preview • Channel-tailored copy'
    },
    publish: {
      title: 'Keep your content moving.',
      body: 'Prepare posts ahead of time and schedule them across your connected accounts from one workspace.',
      metrics: 'Multi-account sync • Automated queues'
    },
    learn: {
      title: 'Let your next idea start with insight.',
      body: 'Review content performance and use what you learn to shape your next publishing plan.',
      metrics: 'Content patterns • Audience resonance'
    }
  };

  const INQUIRY_TYPES = {
    product: { label: 'Product Enquiry', desc: 'Questions on scheduling, publishing, and workflows' },
    support: { label: 'Account Support', desc: 'Assistance with account setup or platform features' },
    privacy: { label: 'Privacy & Data', desc: 'Questions regarding data handling or compliance' },
    billing: { label: 'Billing Queries', desc: 'Inquiries about plans, invoicing, or subscriptions' }
  };

  const CHAT_TOPICS = [
    { id: 'about', label: 'About DAOZ360' },
    { id: 'getting-started', label: 'Getting Started' },
    { id: 'pricing', label: 'Pricing & Plans' },
    { id: 'demo', label: 'Request a Demo' },
    { id: 'support', label: 'Technical Support' }
  ];

  const TOPIC_DETAILS = {
    about: {
      title: 'About DAOZ360',
      reply:
        'DAOZ360 is a social media management tool. Our website describes multi-platform management, post scheduling, analytics and team collaboration with approval workflows. What would you like to explore?',
      quickReplies: [
        { id: 'about-scheduling', label: 'Scheduling' },
        { id: 'about-analytics', label: 'Analytics' },
        { id: 'about-collaboration', label: 'Team Collaboration' },
        { id: 'main-menu', label: 'Main Menu' }
      ],
      subReplies: {
        'about-scheduling':
          "DAOZ360's website lists post scheduling across connected platforms. Tell us which network and content format you use so our team can confirm the available options.",
        'about-analytics':
          "DAOZ360's website lists campaign analytics and performance insights. If you need a particular metric or report, tell us what you want to measure.",
        'about-collaboration':
          "DAOZ360's website lists team content creation and approval workflows. Tell us about your team if you would like help checking the fit."
      }
    },
    'getting-started': {
      title: 'Getting Started',
      reply: 'You can create an account through our registration page. Already have an account? Use Sign In.',
      actions: [
        { id: 'action-register', label: 'Create Account', href: BRAND_CONFIG.registerUrl, isExternal: true },
        { id: 'action-login', label: 'Sign In', href: BRAND_CONFIG.loginUrl, isExternal: true },
        { id: 'action-support-route', label: 'I Need Help', routeTo: 'support' }
      ],
      networksReply:
        'The website names Facebook, Instagram, LinkedIn and X/Twitter. Support can vary by account type and content format. Which platform and format do you need?'
    },
    pricing: {
      title: 'Pricing & Plans',
      get reply() {
        return getPricingChatReply(getSelectedCurrency());
      },
      actions: [
        { id: 'action-view-pricing', label: 'View Pricing', href: '/pricing', isExternal: false },
        { id: 'action-help-choose', label: 'Help Me Choose', routeTo: 'pricing-wizard' }
      ],
      questionAccounts: 'How many social accounts would you like to manage?',
      optionsAccounts: [
        'Up to 5 accounts',
        '6 to 15 accounts',
        '16 to 40 accounts',
        'More than 40 accounts',
        'Not sure'
      ],
      questionTeam: 'How many people will use the platform?',
      optionsTeam: [
        '1 user (Solo)',
        '2 to 3 users',
        '4 to 10 users',
        'More than 10 users',
        'Not sure'
      ]
    },
    demo: {
      title: 'Request a Demo',
      reply: 'I can help you request a DAOZ360 walkthrough.',
      questionTopic: 'What would you like to see in the demo?',
      optionsTopic: [
        'Scheduling & Calendar',
        'Team Approval Workflow',
        'Analytics & Insights',
        'Complete Platform Overview'
      ],
      questionTime: 'Do you have a preferred day or time? Please include your time zone (or tap Skip).'
    },
    support: {
      title: 'Technical Support',
      askHelp: 'What do you need help with?',
      options: [
        { id: 'support-login', label: 'Login / Access', directUrl: BRAND_CONFIG.loginUrl },
        { id: 'support-connect', label: 'Connecting an Account' },
        { id: 'support-schedule', label: 'Scheduling a Post' },
        { id: 'support-other', label: 'Something Else' }
      ],
      securityReminder: "Please don't share passwords, verification codes or payment details."
    }
  };

  const FALLBACK_RESPONSES = {
    firstAttempt:
      "I couldn't match that to the information I have. Is your question about features, pricing, getting started or technical support?",
    secondAttempt: 'I can help you send this to our team. What would you like them to know?',
    directContact: 'You can also contact our team directly at mail@daoz360.ai.'
  };

  /* ==========================================================================
     2. HELPER UTILITIES & LARAVEL CSRF SUPPORT
     ========================================================================== */

  function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
  }

  function buildJsonHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    };
    const csrf = getCsrfToken();
    if (csrf) {
      headers['X-CSRF-TOKEN'] = csrf;
    }
    return headers;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve) => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
      } catch (e) {
        // Ignore
      }
      document.body.removeChild(textarea);
      resolve();
    });
  }

  /* ==========================================================================
     3. HEADER, MOBILE MENU & SMOOTH SCROLL NAVIGATION
     ========================================================================== */

  function initHeaderAndNavigation() {
    const header = document.querySelector('.site-header');
    const mobileToggleBtn = document.getElementById('mobile-menu-toggle');
    const mobileDrawer = document.getElementById('mobile-drawer');
    const mobileBackdrop = document.getElementById('mobile-drawer-backdrop');
    const iconMenu = document.getElementById('mobile-toggle-icon-menu');
    const iconClose = document.getElementById('mobile-toggle-icon-close');

    // Scroll header elevation
    const handleScroll = () => {
      if (!header) return;
      if (window.scrollY > 20) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    function setMobileMenuOpen(open) {
      if (!mobileDrawer || !mobileBackdrop || !mobileToggleBtn) return;
      if (open) {
        mobileDrawer.hidden = false;
        mobileBackdrop.hidden = false;
        mobileToggleBtn.setAttribute('aria-expanded', 'true');
        mobileToggleBtn.setAttribute('aria-label', 'Close Menu');
        if (iconMenu) iconMenu.hidden = true;
        if (iconClose) iconClose.hidden = false;
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';
      } else {
        mobileDrawer.hidden = true;
        mobileBackdrop.hidden = true;
        mobileToggleBtn.setAttribute('aria-expanded', 'false');
        mobileToggleBtn.setAttribute('aria-label', 'Open Menu');
        if (iconMenu) iconMenu.hidden = false;
        if (iconClose) iconClose.hidden = true;
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
      }
    }

    if (mobileToggleBtn) {
      mobileToggleBtn.addEventListener('click', () => {
        const isOpen = mobileToggleBtn.getAttribute('aria-expanded') === 'true';
        setMobileMenuOpen(!isOpen);
      });
    }

    if (mobileBackdrop) {
      mobileBackdrop.addEventListener('click', () => setMobileMenuOpen(false));
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileDrawer && !mobileDrawer.hidden) {
        setMobileMenuOpen(false);
      }
    });

    // Smooth scroll for same-page hash anchors
    document.querySelectorAll('a[href^="#"], a[href^="/#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const rawHref = anchor.getAttribute('href') || '';
        const hashIndex = rawHref.indexOf('#');
        if (hashIndex === -1) return;
        const hash = rawHref.slice(hashIndex);
        if (hash === '#contact') {
          e.preventDefault();
          setMobileMenuOpen(false);
          openContactModal();
          return;
        }
        const targetEl = document.querySelector(hash);
        if (targetEl) {
          e.preventDefault();
          setMobileMenuOpen(false);
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // Scroll to top buttons
    const backTopBtn = document.getElementById('footer-back-top-btn');
    if (backTopBtn) {
      backTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Explore platform button in Hero
    const heroExploreBtn = document.getElementById('hero-explore-btn');
    if (heroExploreBtn) {
      heroExploreBtn.addEventListener('click', () => {
        const target = document.getElementById('how-it-works');
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Hero visual animation replay button
    const replayBtn = document.getElementById('hero-replay-btn');
    const visualWrapper = document.getElementById('hero-visual-wrapper');
    if (replayBtn && visualWrapper) {
      replayBtn.addEventListener('click', () => {
        visualWrapper.style.animation = 'none';
        void visualWrapper.offsetWidth; // trigger reflow
        visualWrapper.style.animation = 'heroAssemble 700ms cubic-bezier(0.16, 1, 0.3, 1) forwards';
      });
    }

    // Explore features button in Workflow section
    const workflowFeaturesBtn = document.getElementById('workflow-explore-features-btn');
    if (workflowFeaturesBtn) {
      workflowFeaturesBtn.addEventListener('click', () => {
        const target = document.getElementById('product-stories');
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }

  /* ==========================================================================
     4. INTERACTIVE WORKFLOW SHOWCASE TABS
     ========================================================================== */

  function initWorkflowTabs() {
    const tabBtns = Array.from(document.querySelectorAll('.workflow-tab-btn[data-tab-id]'));
    if (!tabBtns.length) return;

    const stageTitle = document.getElementById('workflow-stage-title');
    const stageBody = document.getElementById('workflow-stage-body');
    const stageMetrics = document.getElementById('workflow-stage-metrics');
    const panel = document.getElementById('workflow-tabpanel');
    const mockViews = document.querySelectorAll('[data-workflow-mock]');

    function activateTab(tabId, focusBtn = false) {
      const data = WORKFLOW_STAGES[tabId] || WORKFLOW_STAGES.plan;

      tabBtns.forEach((btn) => {
        const isSelected = btn.getAttribute('data-tab-id') === tabId;
        btn.classList.toggle('is-active', isSelected);
        btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        btn.setAttribute('tabindex', isSelected ? '0' : '-1');
        if (isSelected && focusBtn) {
          btn.focus();
        }
      });

      if (stageTitle) stageTitle.textContent = data.title;
      if (stageBody) stageBody.textContent = data.body;
      if (stageMetrics) stageMetrics.textContent = data.metrics;
      if (panel) panel.setAttribute('aria-labelledby', `tab-btn-${tabId}`);

      mockViews.forEach((view) => {
        view.hidden = view.getAttribute('data-workflow-mock') !== tabId;
      });
    }

    tabBtns.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        activateTab(btn.getAttribute('data-tab-id'));
      });

      btn.addEventListener('keydown', (e) => {
        let nextIndex = idx;
        if (e.key === 'ArrowRight') {
          nextIndex = (idx + 1) % tabBtns.length;
        } else if (e.key === 'ArrowLeft') {
          nextIndex = (idx - 1 + tabBtns.length) % tabBtns.length;
        }
        if (nextIndex !== idx) {
          e.preventDefault();
          activateTab(tabBtns[nextIndex].getAttribute('data-tab-id'), true);
        }
      });
    });
  }

  /* ==========================================================================
     5. CONTACT MODAL, PRICING PREFILL & CLIPBOARD ACTIONS
     ========================================================================== */

  function clearContactModalPrefill() {
    const pill = document.getElementById('modal-plan-prefill-pill');
    const planInput = document.getElementById('modal-contact-plan');
    const billingInput = document.getElementById('modal-contact-billing');
    const currencyInput = document.getElementById('modal-contact-currency');
    const catInput = document.getElementById('modal-contact-category');

    if (pill) pill.hidden = true;
    if (planInput) planInput.value = '';
    if (billingInput) billingInput.value = '';
    if (currencyInput) currencyInput.value = '';
    if (catInput) catInput.value = 'Product Enquiry';
  }

  function openContactModal(prefill = null) {
    const backdrop = document.getElementById('contact-modal-backdrop');
    if (!backdrop) return;

    const statusBanner = document.getElementById('contact-modal-status');
    if (statusBanner) statusBanner.hidden = true;

    const pill = document.getElementById('modal-plan-prefill-pill');
    const pillText = document.getElementById('modal-plan-prefill-text');
    const planInput = document.getElementById('modal-contact-plan');
    const billingInput = document.getElementById('modal-contact-billing');
    const currencyInput = document.getElementById('modal-contact-currency');
    const catInput = document.getElementById('modal-contact-category');
    const msgInput = document.getElementById('modal-contact-message');

    if (prefill && prefill.planName) {
      if (planInput) planInput.value = prefill.planName;
      if (billingInput) billingInput.value = prefill.billing || '';
      if (currencyInput) currencyInput.value = prefill.currency || '';
      if (catInput) catInput.value = 'Pricing & Package Enquiry';

      if (pill && pillText) {
        pillText.textContent = prefill.badgeText || `Enquiring about: ${prefill.planName}`;
        pill.hidden = false;
      }

      if (msgInput && prefill.defaultMessage) {
        msgInput.value = prefill.defaultMessage;
      }
    } else {
      clearContactModalPrefill();
    }

    backdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
  }

  function closeContactModal() {
    const backdrop = document.getElementById('contact-modal-backdrop');
    if (!backdrop) return;
    backdrop.hidden = true;
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
  }

  function initFeatureVisibility() {
    document.querySelectorAll('[data-optional-feature]').forEach((el) => {
      const key = el.getAttribute('data-optional-feature');
      if (!key) return;
      const isEnabled = Boolean(BRAND_CONFIG.features && BRAND_CONFIG.features[key]);
      el.hidden = !isEnabled;
    });
  }

  function initPricingPage() {
    const billingBtns = Array.from(document.querySelectorAll('[data-billing-select]'));
    const currencyBtns = Array.from(document.querySelectorAll('[data-currency-select]'));
    const enquireBtns = Array.from(document.querySelectorAll('[data-plan-enquire]'));
    const modeBanner = document.getElementById('pricing-mode-banner');

    if (modeBanner) {
      modeBanner.hidden = PRICE_BOOK.mode === 'ready';
    }

    let currentBilling = getSelectedBilling();
    let currentCurrency = getSelectedCurrency();

    function renderPricingState() {
      // Update billing buttons
      billingBtns.forEach((btn) => {
        const isSelected = btn.getAttribute('data-billing-select') === currentBilling;
        btn.classList.toggle('is-active', isSelected);
        btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      });

      // Update currency buttons
      currencyBtns.forEach((btn) => {
        const isSelected = btn.getAttribute('data-currency-select') === currentCurrency;
        btn.classList.toggle('is-active', isSelected);
        btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      });

      // Update each plan card & comparison table header
      ['starter', 'growth', 'agency'].forEach((planKey) => {
        const plan = PRICE_BOOK.plans[planKey];
        if (!plan) return;
        const priceObj = plan.prices[currentCurrency] || plan.prices.INR;

        const priceEl = document.querySelector(`[data-plan-price="${planKey}"]`);
        const unitEl = document.querySelector(`[data-plan-unit="${planKey}"]`);
        const subtextEl = document.querySelector(`[data-plan-subtext="${planKey}"]`);
        const ctaBtn = document.querySelector(`[data-plan-cta="${planKey}"] span`);
        const tablePriceEl = document.querySelector(`[data-table-price="${planKey}"]`);

        if (currentBilling === 'yearly') {
          if (priceEl) priceEl.textContent = priceObj.annualMonthlyEquivalent;
          if (unitEl) unitEl.textContent = '/month equivalent';
          if (subtextEl) {
            subtextEl.textContent = `${priceObj.annualTotalFormatted} billed yearly (save 2 months).`;
          }
          if (tablePriceEl) {
            tablePriceEl.textContent = `${priceObj.annualMonthlyEquivalent}/mo (${priceObj.annualTotalFormatted}/yr)`;
          }
        } else {
          if (priceEl) priceEl.textContent = priceObj.monthlyFormatted;
          if (unitEl) unitEl.textContent = '/month';
          if (subtextEl) {
            subtextEl.textContent = 'Billed monthly.';
          }
          if (tablePriceEl) {
            tablePriceEl.textContent = `${priceObj.monthlyFormatted}/mo`;
          }
        }

        if (ctaBtn) {
          ctaBtn.textContent = PRICE_BOOK.mode === 'ready' ? plan.ctaReady : plan.ctaQuote;
        }
      });
    }

    if (billingBtns.length || currencyBtns.length) {
      renderPricingState();
    }

    billingBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-billing-select');
        if (val === 'monthly' || val === 'yearly') {
          currentBilling = val;
          try {
            sessionStorage.setItem('daoz_pricing_billing', currentBilling);
          } catch (e) {
            // Ignore
          }
          renderPricingState();
        }
      });
    });

    currencyBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-currency-select');
        if (val && PRICE_BOOK.supportedCurrencies.includes(val)) {
          currentCurrency = val;
          try {
            sessionStorage.setItem('daoz_pricing_currency', currentCurrency);
          } catch (e) {
            // Ignore
          }
          renderPricingState();
        }
      });
    });

    enquireBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const planKey = btn.getAttribute('data-plan-enquire');
        const billingLabel = currentBilling === 'yearly' ? 'Yearly (Save 2 months)' : 'Monthly';

        if (planKey === 'help-choose') {
          openContactModal({
            planName: 'Help Me Choose',
            billing: billingLabel,
            currency: currentCurrency,
            badgeText: `Package Guidance • ${billingLabel} • ${currentCurrency}`,
            defaultMessage:
              `Hi DAOZ360 team,\n\nI would like help choosing the right DAOZ360 plan for our workflow.\n` +
              `Preferred Billing: ${billingLabel} (${currentCurrency})\n` +
              `Connected Social Accounts Needed: \n` +
              `Team Members / Seats Needed: `
          });
          return;
        }

        if (planKey === 'custom') {
          openContactModal({
            planName: 'Custom Package',
            billing: billingLabel,
            currency: currentCurrency,
            badgeText: `Enquiring about: Custom Package • ${billingLabel} • ${currentCurrency}`,
            defaultMessage:
              `Hi DAOZ360 team,\n\nWe are interested in a Custom DAOZ360 package.\n` +
              `Preferred Billing: ${billingLabel} (${currentCurrency})\n` +
              `Account Volume & Team Setup: `
          });
          return;
        }

        const plan = PRICE_BOOK.plans[planKey];
        if (!plan) {
          openContactModal();
          return;
        }

        if (PRICE_BOOK.mode === 'ready') {
          window.location.href = `${BRAND_CONFIG.registerUrl}?plan=${encodeURIComponent(plan.id)}&billing=${encodeURIComponent(currentBilling)}&currency=${encodeURIComponent(currentCurrency)}`;
          return;
        }

        const priceObj = plan.prices[currentCurrency] || plan.prices.INR;
        const priceDisplay =
          currentBilling === 'yearly'
            ? `${priceObj.annualMonthlyEquivalent}/mo equivalent (${priceObj.annualTotalFormatted} billed yearly)`
            : `${priceObj.monthlyFormatted}/month billed monthly`;

        openContactModal({
          planName: plan.name,
          billing: billingLabel,
          currency: currentCurrency,
          badgeText: `Enquiring about: ${plan.name} • ${priceDisplay}`,
          defaultMessage:
            `Hi DAOZ360 team,\n\nI would like to enquire about the ${plan.name} plan (${priceDisplay}).\n` +
            `Included scale: ${plan.accounts} social accounts, ${plan.users} user(s), ${plan.deliveries.toLocaleString()} monthly deliveries.\n\n` +
            `Our workflow & channels: `
        });
      });
    });

    const clearPillBtn = document.getElementById('modal-plan-prefill-clear');
    if (clearPillBtn) {
      clearPillBtn.addEventListener('click', clearContactModalPrefill);
    }
  }

  function initContactModalAndCopyButtons() {
    // Open modal triggers
    document.querySelectorAll('[data-open-contact]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const mobileDrawer = document.getElementById('mobile-drawer');
        const mobileBackdrop = document.getElementById('mobile-drawer-backdrop');
        if (mobileDrawer) mobileDrawer.hidden = true;
        if (mobileBackdrop) mobileBackdrop.hidden = true;
        openContactModal();
      });
    });

    const backdrop = document.getElementById('contact-modal-backdrop');
    const closeBtn = document.getElementById('contact-modal-close');
    const modalDialog = document.getElementById('contact-modal-dialog');

    if (closeBtn) {
      closeBtn.addEventListener('click', closeContactModal);
    }

    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          closeContactModal();
        }
      });
    }

    if (modalDialog) {
      modalDialog.addEventListener('click', (e) => e.stopPropagation());
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && backdrop && !backdrop.hidden) {
        closeContactModal();
      }
    });

    // Contact Modal Form Submission (Laravel AJAX + mailto fallback)
    const modalForm = document.getElementById('contact-modal-form');
    const statusBanner = document.getElementById('contact-modal-status');
    if (modalForm) {
      modalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = (document.getElementById('modal-contact-name')?.value || '').trim();
        const email = (document.getElementById('modal-contact-email')?.value || '').trim();
        const company = (document.getElementById('modal-contact-company')?.value || '').trim();
        const message = (document.getElementById('modal-contact-message')?.value || '').trim();

        const actionUrl = modalForm.getAttribute('action') || '/contact/submit';

        // Try submitting to Laravel backend first
        try {
          const response = await fetch(actionUrl, {
            method: 'POST',
            headers: buildJsonHeaders(),
            body: JSON.stringify({ name, email, company, message, category: 'Product Enquiry' })
          });

          if (response.ok) {
            const result = await response.json();
            if (result && result.success) {
              if (statusBanner) {
                statusBanner.textContent =
                  result.message || 'Thank you! Your inquiry has been received by our team.';
                statusBanner.hidden = false;
              }
              modalForm.reset();
              return;
            }
          }
        } catch (err) {
          // Fallback to mailto client when running without backend mail server
        }

        const subject = encodeURIComponent(`DAOZ360 Inquiry from ${name || 'Website Visitor'}`);
        const bodyText = `Name: ${name}\nWork Email: ${email}\nCompany/Brand: ${company}\n\nMessage:\n${message}`;
        window.location.href = `mailto:${BRAND_CONFIG.contactEmail}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
      });
    }

    // Contact Modal Copy Details Button
    const modalCopyBtn = document.getElementById('modal-copy-btn');
    const modalCopyText = document.getElementById('modal-copy-text');
    if (modalCopyBtn) {
      modalCopyBtn.addEventListener('click', () => {
        const name = document.getElementById('modal-contact-name')?.value || '';
        const email = document.getElementById('modal-contact-email')?.value || '';
        const company = document.getElementById('modal-contact-company')?.value || '';
        const message = document.getElementById('modal-contact-message')?.value || '';
        const text = `To: ${BRAND_CONFIG.contactEmail}\nName: ${name}\nWork Email: ${email}\nCompany: ${company}\nMessage: ${message}`;
        copyToClipboard(text).then(() => {
          if (modalCopyText) modalCopyText.textContent = 'Copied';
          setTimeout(() => {
            if (modalCopyText) modalCopyText.textContent = 'Copy Text';
          }, 2400);
        });
      });
    }

    // Final CTA Copy Email Button
    const ctaCopyBtn = document.getElementById('cta-copy-email-btn');
    const ctaCopyLabel = document.getElementById('cta-copy-email-label');
    if (ctaCopyBtn) {
      ctaCopyBtn.addEventListener('click', () => {
        copyToClipboard(BRAND_CONFIG.contactEmail).then(() => {
          if (ctaCopyLabel) ctaCopyLabel.textContent = 'Copied';
          setTimeout(() => {
            if (ctaCopyLabel) ctaCopyLabel.textContent = 'Copy';
          }, 2400);
        });
      });
    }

    // Generic [data-copy-text] buttons (Legal pages email & address copy)
    document.querySelectorAll('[data-copy-text]').forEach((btn) => {
      const originalLabel = btn.textContent;
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-copy-text') || '';
        const copiedLabel = btn.getAttribute('data-copied-label') || 'Copied!';
        copyToClipboard(text).then(() => {
          btn.textContent = copiedLabel;
          setTimeout(() => {
            btn.textContent = originalLabel;
          }, 2000);
        });
      });
    });
  }

  /* ==========================================================================
     6. LEGAL PAGES SCROLL SPY & TOC NAVIGATION
     ========================================================================== */

  function initLegalScrollSpy() {
    const sections = Array.from(document.querySelectorAll('.legal-section-card[id]'));
    if (!sections.length) return;

    const tocLinks = Array.from(document.querySelectorAll('.legal-toc-link, .legal-mobile-pill[href^="#"]'));

    function setActiveSection(id) {
      tocLinks.forEach((link) => {
        const isMatch = link.getAttribute('href') === `#${id}`;
        link.classList.toggle('is-active', isMatch);
      });
    }

    window.addEventListener(
      'scroll',
      () => {
        const scrollPos = window.scrollY + 140;
        for (const sec of sections) {
          const top = sec.offsetTop;
          const height = sec.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(sec.id);
            break;
          }
        }
      },
      { passive: true }
    );
  }

  /* ==========================================================================
     7. DEDICATED CONTACT PAGE COMPOSER (/contact)
     ========================================================================== */

  function initContactPageComposer() {
    const typeBtns = Array.from(document.querySelectorAll('[data-inquiry-type]'));
    if (!typeBtns.length) return;

    let selectedType = 'product';
    const categoryInput = document.getElementById('contact-page-category-input');
    const nameInput = document.getElementById('contact-page-name');
    const emailInput = document.getElementById('contact-page-email');
    const channelsInput = document.getElementById('contact-page-channels');
    const messageInput = document.getElementById('contact-page-message');
    const mailtoBtn = document.getElementById('contact-page-mailto-btn');
    const copyDraftBtn = document.getElementById('contact-copy-draft-btn');
    const copyDraftLabel = document.getElementById('contact-copy-draft-label');
    const contactPageForm = document.getElementById('contact-page-form');
    const contactPageStatus = document.getElementById('contact-page-status');

    function getCurrentTypeObj() {
      return INQUIRY_TYPES[selectedType] || INQUIRY_TYPES.product;
    }

    function updateMailtoHref() {
      if (!mailtoBtn) return;
      const typeObj = getCurrentTypeObj();
      const senderName = (nameInput?.value || '').trim();
      const senderEmail = (emailInput?.value || '').trim();
      const senderChannels = (channelsInput?.value || '').trim();
      const senderMessage = (messageInput?.value || '').trim();

      const subject = encodeURIComponent(
        `[${typeObj.label}] DAOZ360 Inquiry from ${senderName || 'Prospective User'}`
      );
      const bodyText = encodeURIComponent(
        `Hello DAOZ360 Team,\n\n` +
          `Inquiry Category: ${typeObj.label}\n` +
          `Name: ${senderName || 'Not specified'}\n` +
          `Contact Email: ${senderEmail || 'Not specified'}\n` +
          `Channels Managed: ${senderChannels || 'Not specified'}\n\n` +
          `Message:\n${senderMessage || 'I would like to explore how DAOZ360 can help manage our social media workflow.'}\n\n` +
          `Sent via daoz360.ai contact portal`
      );
      mailtoBtn.setAttribute('href', `mailto:${BRAND_CONFIG.contactEmail}?subject=${subject}&body=${bodyText}`);
    }

    typeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedType = btn.getAttribute('data-inquiry-type') || 'product';
        typeBtns.forEach((b) => b.classList.toggle('is-selected', b === btn));
        if (categoryInput) categoryInput.value = getCurrentTypeObj().label;
        updateMailtoHref();
      });
    });

    [nameInput, emailInput, channelsInput, messageInput].forEach((input) => {
      if (input) {
        input.addEventListener('input', updateMailtoHref);
      }
    });

    updateMailtoHref();

    if (copyDraftBtn) {
      copyDraftBtn.addEventListener('click', () => {
        const typeObj = getCurrentTypeObj();
        const senderName = (nameInput?.value || '').trim();
        const senderEmail = (emailInput?.value || '').trim();
        const senderChannels = (channelsInput?.value || '').trim();
        const senderMessage = (messageInput?.value || '').trim();

        const draft =
          `To: ${BRAND_CONFIG.contactEmail}\n` +
          `Subject: [${typeObj.label}] DAOZ360 Inquiry\n\n` +
          `Name: ${senderName || 'Not specified'}\n` +
          `Email: ${senderEmail || 'Not specified'}\n` +
          `Channels Managed: ${senderChannels || 'Not specified'}\n\n` +
          `Message:\n${senderMessage || 'I would like to explore how DAOZ360 can help manage our social media workflow.'}`;

        copyToClipboard(draft).then(() => {
          if (copyDraftLabel) copyDraftLabel.textContent = 'Draft Copied to Clipboard!';
          setTimeout(() => {
            if (copyDraftLabel) copyDraftLabel.textContent = 'Copy Draft to Clipboard';
          }, 2500);
        });
      });
    }

    if (contactPageForm) {
      contactPageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const typeObj = getCurrentTypeObj();
        const payload = {
          category: typeObj.label,
          name: (nameInput?.value || '').trim(),
          email: (emailInput?.value || '').trim(),
          channels: (channelsInput?.value || '').trim(),
          message: (messageInput?.value || '').trim()
        };

        try {
          const response = await fetch(contactPageForm.getAttribute('action') || '/contact/submit', {
            method: 'POST',
            headers: buildJsonHeaders(),
            body: JSON.stringify(payload)
          });
          if (response.ok) {
            const res = await response.json();
            if (res && res.success && contactPageStatus) {
              contactPageStatus.textContent =
                res.message || 'Your inquiry has been logged and sent to mail@daoz360.ai.';
              contactPageStatus.hidden = false;
              return;
            }
          }
        } catch (err) {
          // Fallback to mailto link
        }

        if (mailtoBtn) {
          window.location.href = mailtoBtn.getAttribute('href');
        }
      });
    }
  }

  /* ==========================================================================
     8. AUTOMATED WEBSITE CHAT ASSISTANT WIDGET
     ========================================================================== */

  function generateOpaqueId(prefix = 'ses') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
  }

  function generateReferenceId(type = 'REQ') {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const dateStamp = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    return `DAOZ-${type}-${dateStamp}-${randomSuffix}`;
  }

  function validateLeadData(name, email, company) {
    const trimmedName = (name || '').trim();
    const trimmedEmail = (email || '').trim();
    const trimmedCompany = (company || '').trim();
    const errors = {};

    if (!trimmedName || trimmedName.length < 1 || trimmedName.length > 80) {
      errors.name = 'Please enter your name.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }
    if (trimmedCompany.length > 120) {
      errors.company = 'Company name must be under 120 characters.';
    }

    const firstName = trimmedName ? trimmedName.split(' ')[0] : 'there';
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      data: {
        name: trimmedName,
        email: trimmedEmail,
        company: trimmedCompany,
        firstName
      }
    };
  }

  function matchFreeTextIntent(text) {
    if (!text || typeof text !== 'string') return { type: 'unknown' };
    const lower = text.toLowerCase().trim();

    if (
      lower.includes('human') ||
      lower.includes('person') ||
      lower.includes('representative') ||
      lower.includes('agent') ||
      lower.includes('speak to someone') ||
      lower.includes('talk to someone') ||
      lower.includes('call me') ||
      lower.includes('email me')
    ) {
      return { type: 'human' };
    }

    if (
      lower.includes('price') ||
      lower.includes('pricing') ||
      lower.includes('cost') ||
      lower.includes('plan') ||
      lower.includes('subscription') ||
      lower.includes('quote') ||
      lower.includes('how much')
    ) {
      return { type: 'topic', topicId: 'pricing' };
    }

    if (
      lower.includes('demo') ||
      lower.includes('walkthrough') ||
      lower.includes('presentation') ||
      lower.includes('show me') ||
      lower.includes('meeting')
    ) {
      return { type: 'topic', topicId: 'demo' };
    }

    if (
      lower.includes('getting started') ||
      lower.includes('register') ||
      lower.includes('signup') ||
      lower.includes('sign up') ||
      lower.includes('create account') ||
      lower.includes('log in') ||
      lower.includes('signin') ||
      lower.includes('sign in')
    ) {
      return { type: 'topic', topicId: 'getting-started' };
    }

    if (
      lower.includes('network') ||
      lower.includes('platform') ||
      lower.includes('instagram') ||
      lower.includes('facebook') ||
      lower.includes('linkedin') ||
      lower.includes('twitter') ||
      lower.includes('x.com') ||
      lower.includes('tiktok') ||
      lower.includes('youtube')
    ) {
      return { type: 'topic', topicId: 'getting-started', subAction: 'networks' };
    }

    if (
      lower.includes('about') ||
      lower.includes('what is') ||
      lower.includes('features') ||
      lower.includes('overview') ||
      lower.includes('capabilities')
    ) {
      return { type: 'topic', topicId: 'about' };
    }

    if (lower.includes('schedule') || lower.includes('calendar') || lower.includes('publish')) {
      return { type: 'topic', topicId: 'about', subTopicId: 'about-scheduling' };
    }

    if (lower.includes('analytics') || lower.includes('report') || lower.includes('metrics')) {
      return { type: 'topic', topicId: 'about', subTopicId: 'about-analytics' };
    }

    if (lower.includes('team') || lower.includes('collaboration') || lower.includes('approval')) {
      return { type: 'topic', topicId: 'about', subTopicId: 'about-collaboration' };
    }

    if (
      lower.includes('support') ||
      lower.includes('help') ||
      lower.includes('issue') ||
      lower.includes('problem') ||
      lower.includes('bug') ||
      lower.includes('error') ||
      lower.includes('cannot connect') ||
      lower.includes('not working')
    ) {
      return { type: 'topic', topicId: 'support' };
    }

    return { type: 'unknown' };
  }

  function initChatWidget() {
    const launcherBtn = document.getElementById('daoz-chat-launcher');
    const chatWindow = document.getElementById('daoz-chat-window');
    if (!launcherBtn || !chatWindow) return;

    const closeChatBtn = document.getElementById('daoz-chat-close-btn');
    const resetChatBtn = document.getElementById('daoz-chat-reset-btn');
    const confirmOverlay = document.getElementById('daoz-chat-confirm-overlay');
    const confirmEndYes = document.getElementById('daoz-confirm-end-yes');
    const confirmEndCancel = document.getElementById('daoz-confirm-end-cancel');

    const prechatContainer = document.getElementById('daoz-prechat-container');
    const prechatForm = document.getElementById('daoz-prechat-form');
    const prechatName = document.getElementById('prechat-name');
    const prechatEmail = document.getElementById('prechat-email');
    const prechatCompany = document.getElementById('prechat-company');
    const errName = document.getElementById('prechat-error-name');
    const errEmail = document.getElementById('prechat-error-email');
    const errForm = document.getElementById('prechat-error-form');
    const startBtnLabel = document.getElementById('daoz-start-btn-label');

    const convWrapper = document.getElementById('daoz-conversation-wrapper');
    const messagesFeed = document.getElementById('daoz-messages-feed');
    const chatInputForm = document.getElementById('daoz-chat-input-form');
    const chatInput = document.getElementById('daoz-chat-input');
    const chatSendBtn = document.getElementById('daoz-chat-send-btn');

    let isOpen = false;
    let hasStarted = false;
    let leadData = null;
    let sessionId = null;
    let pendingDraft = {};
    let fallbackCount = 0;

    function toggleChatWindow(open) {
      isOpen = open;
      chatWindow.hidden = !open;
      launcherBtn.classList.toggle('is-active', open);
      launcherBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open && hasStarted) {
        scrollToBottom();
      }
    }

    function scrollToBottom() {
      if (messagesFeed) {
        messagesFeed.scrollTop = messagesFeed.scrollHeight;
      }
    }

    launcherBtn.addEventListener('click', () => toggleChatWindow(!isOpen));
    if (closeChatBtn) closeChatBtn.addEventListener('click', () => toggleChatWindow(false));

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) {
        toggleChatWindow(false);
      }
    });

    if (resetChatBtn) {
      resetChatBtn.addEventListener('click', () => {
        if (confirmOverlay) confirmOverlay.hidden = false;
      });
    }

    if (confirmEndCancel) {
      confirmEndCancel.addEventListener('click', () => {
        if (confirmOverlay) confirmOverlay.hidden = true;
      });
    }

    if (confirmEndYes) {
      confirmEndYes.addEventListener('click', () => {
        if (confirmOverlay) confirmOverlay.hidden = true;
        hasStarted = false;
        leadData = null;
        sessionId = null;
        pendingDraft = {};
        fallbackCount = 0;
        if (messagesFeed) messagesFeed.innerHTML = '';
        if (prechatForm) prechatForm.reset();
        if (prechatContainer) prechatContainer.hidden = false;
        if (convWrapper) convWrapper.hidden = true;
        if (resetChatBtn) resetChatBtn.hidden = true;
      });
    }

    if (chatInput && chatSendBtn) {
      chatInput.addEventListener('input', () => {
        chatSendBtn.disabled = !chatInput.value.trim();
      });
    }

    function getTimeStr() {
      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function appendMessage(sender, text, extra = {}) {
      if (!messagesFeed) return;

      const row = document.createElement('div');
      row.className = `daoz-msg-row ${sender === 'user' ? 'is-user' : 'is-assistant'}`;

      if (sender === 'assistant') {
        const avatar = document.createElement('div');
        avatar.className = 'daoz-msg-avatar';
        avatar.setAttribute('aria-hidden', 'true');
        avatar.innerHTML = `<img src="/assets/logo-daoz360-transparent.png" alt="" width="16" height="16" />`;
        row.appendChild(avatar);
      }

      const contentBlock = document.createElement('div');
      contentBlock.className = 'daoz-msg-content-block';

      const bubble = document.createElement('div');
      bubble.className = 'daoz-msg-bubble';

      const p = document.createElement('p');
      p.className = 'daoz-msg-text';
      p.textContent = text;
      bubble.appendChild(p);

      // Main menu chips
      if (extra.showMainMenu) {
        const chipsGrid = document.createElement('div');
        chipsGrid.className = 'daoz-topic-chips-grid';

        CHAT_TOPICS.forEach((topic) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'daoz-chip-btn';
          btn.innerHTML = `<span>${escapeHtml(topic.label)}</span>`;
          btn.addEventListener('click', () => handleSelectTopic(topic.id));
          chipsGrid.appendChild(btn);
        });

        const contactLink = document.createElement('a');
        contactLink.href = `mailto:${BRAND_CONFIG.contactEmail}`;
        contactLink.className = 'daoz-chip-btn daoz-chip-contact';
        contactLink.innerHTML = `<span>Contact Our Team</span>`;
        chipsGrid.appendChild(contactLink);

        bubble.appendChild(chipsGrid);
      }

      // Quick replies
      if (extra.quickReplies && Array.isArray(extra.quickReplies)) {
        const qrGrid = document.createElement('div');
        qrGrid.className = 'daoz-topic-chips-grid';

        extra.quickReplies.forEach((reply) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'daoz-chip-btn';
          btn.innerHTML = `<span>${escapeHtml(reply.label)}</span>`;
          btn.addEventListener('click', () => {
            if (typeof extra.onQuickReply === 'function') {
              extra.onQuickReply(reply);
            }
          });
          qrGrid.appendChild(btn);
        });

        bubble.appendChild(qrGrid);
      }

      // Action links
      if (extra.actions && Array.isArray(extra.actions)) {
        const actGrid = document.createElement('div');
        actGrid.className = 'daoz-action-links-grid';

        extra.actions.forEach((act) => {
          if (act.href) {
            const a = document.createElement('a');
            a.href = act.href;
            if (act.isExternal) {
              a.target = '_blank';
              a.rel = 'noopener noreferrer';
            }
            a.className = 'daoz-action-link-btn';
            a.innerHTML = `<span>${escapeHtml(act.label)}</span><span>${act.isExternal ? '↗' : '→'}</span>`;
            actGrid.appendChild(a);
          } else if (act.routeTo) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'daoz-action-link-btn';
            btn.innerHTML = `<span>${escapeHtml(act.label)}</span>`;
            btn.addEventListener('click', () => handleSelectTopic(act.routeTo));
            actGrid.appendChild(btn);
          }
        });

        bubble.appendChild(actGrid);
      }

      // Preview Card (with Edit and topic-specific Send button per Section 12E & 12F)
      if (extra.showPreviewCard && extra.draftData) {
        const d = extra.draftData;
        if (!d.idempotencyKey) {
          d.idempotencyKey = generateOpaqueId('idem');
        }
        const card = document.createElement('div');
        card.className = 'daoz-preview-card';

        let rowsHtml = `
          <div class="daoz-preview-row"><span class="daoz-preview-lbl">Name:</span><span class="daoz-preview-val">${escapeHtml(leadData?.name)}</span></div>
          <div class="daoz-preview-row"><span class="daoz-preview-lbl">Email:</span><span class="daoz-preview-val">${escapeHtml(leadData?.email)}</span></div>
        `;
        if (leadData?.company) {
          rowsHtml += `<div class="daoz-preview-row"><span class="daoz-preview-lbl">Company:</span><span class="daoz-preview-val">${escapeHtml(leadData.company)}</span></div>`;
        }
        if (d.recommendedPlan) {
          rowsHtml += `<div class="daoz-preview-row"><span class="daoz-preview-lbl">Suggested Tier:</span><span class="daoz-preview-val">${escapeHtml(d.recommendedPlan)}</span></div>`;
        }
        if (d.accounts) {
          rowsHtml += `<div class="daoz-preview-row"><span class="daoz-preview-lbl">Accounts:</span><span class="daoz-preview-val">${escapeHtml(d.accounts)}</span></div>`;
        }
        if (d.team) {
          rowsHtml += `<div class="daoz-preview-row"><span class="daoz-preview-lbl">Team Size:</span><span class="daoz-preview-val">${escapeHtml(d.team)}</span></div>`;
        }
        if (d.demoFocus) {
          rowsHtml += `<div class="daoz-preview-row"><span class="daoz-preview-lbl">Focus:</span><span class="daoz-preview-val">${escapeHtml(d.demoFocus)}</span></div>`;
        }
        if (d.preferredTime) {
          rowsHtml += `<div class="daoz-preview-row"><span class="daoz-preview-lbl">Time Preference:</span><span class="daoz-preview-val">${escapeHtml(d.preferredTime)}</span></div>`;
        }
        if (d.issueType) {
          rowsHtml += `<div class="daoz-preview-row"><span class="daoz-preview-lbl">Issue:</span><span class="daoz-preview-val">${escapeHtml(d.issueType)}</span></div>`;
        }
        if (d.description) {
          rowsHtml += `<div class="daoz-preview-row"><span class="daoz-preview-lbl">Details:</span><span class="daoz-preview-val" data-preview-editable>${escapeHtml(d.description)}</span></div>`;
        }
        if (d.inquiryText) {
          rowsHtml += `<div class="daoz-preview-row"><span class="daoz-preview-lbl">Enquiry:</span><span class="daoz-preview-val" data-preview-editable>${escapeHtml(d.inquiryText)}</span></div>`;
        }

        const sendBtnLabel =
          d.topic === 'pricing'
            ? 'Send Pricing Enquiry'
            : d.topic === 'demo'
            ? 'Send Demo Request'
            : d.topic === 'support'
            ? 'Send Support Request'
            : 'Send Request';

        card.innerHTML = `
          <div class="daoz-preview-header"><span class="daoz-preview-badge">Request Preview</span></div>
          <div class="daoz-preview-body">${rowsHtml}</div>
          <div class="daoz-preview-edit-box" hidden>
            <textarea class="daoz-preview-edit-textarea" placeholder="Add or edit details for our team...">${escapeHtml(d.inquiryText || d.description || '')}</textarea>
          </div>
          <div class="daoz-preview-footer daoz-preview-footer-actions">
            <button type="button" class="daoz-edit-request-btn">Edit</button>
            <button type="button" class="btn-primary daoz-submit-request-btn">
              <span>${escapeHtml(sendBtnLabel)}</span>
            </button>
          </div>
        `;

        const editBtn = card.querySelector('.daoz-edit-request-btn');
        const editBox = card.querySelector('.daoz-preview-edit-box');
        const editTextarea = card.querySelector('.daoz-preview-edit-textarea');

        if (editBtn && editBox && editTextarea) {
          editBtn.addEventListener('click', () => {
            const isHidden = editBox.hidden;
            editBox.hidden = !isHidden;
            editBtn.textContent = isHidden ? 'Done Editing' : 'Edit';
            if (!isHidden) {
              const updatedText = editTextarea.value.trim();
              if (updatedText) {
                d.inquiryText = updatedText;
                const editableEl = card.querySelector('[data-preview-editable]');
                if (editableEl) {
                  editableEl.textContent = updatedText;
                } else {
                  const bodyEl = card.querySelector('.daoz-preview-body');
                  if (bodyEl) {
                    const rowDiv = document.createElement('div');
                    rowDiv.className = 'daoz-preview-row';
                    rowDiv.innerHTML = `<span class="daoz-preview-lbl">Notes:</span><span class="daoz-preview-val" data-preview-editable>${escapeHtml(updatedText)}</span>`;
                    bodyEl.appendChild(rowDiv);
                  }
                }
              }
            } else {
              editTextarea.focus();
            }
          });
        }

        const submitBtn = card.querySelector('.daoz-submit-request-btn');
        if (submitBtn) {
          submitBtn.addEventListener('click', () => {
            if (editBox && !editBox.hidden && editTextarea) {
              const updatedText = editTextarea.value.trim();
              if (updatedText) d.inquiryText = updatedText;
              editBox.hidden = true;
              if (editBtn) editBtn.textContent = 'Edit';
            }
            submitBtn.disabled = true;
            if (editBtn) editBtn.disabled = true;
            submitBtn.innerHTML = '<span>Submitting...</span>';
            handleConfirmSubmitRequest(d, submitBtn, sendBtnLabel);
          });
        }

        bubble.appendChild(card);
      }

      // Confirmation Card
      if (extra.showConfirmationCard) {
        const conf = document.createElement('div');
        conf.className = 'daoz-confirm-card';
        conf.innerHTML = `
          <div class="daoz-confirm-badge">✓ <span>Request Logged</span></div>
          <div class="daoz-confirm-ref-row">
            <span class="daoz-confirm-ref-label">Reference ID:</span>
            <code class="daoz-confirm-ref-code">${escapeHtml(extra.reference)}</code>
            <button type="button" class="daoz-copy-ref-btn" title="Copy Reference ID">Copy</button>
          </div>
          <p class="daoz-confirm-text">Our team can review your request and follow up at <strong>${escapeHtml(extra.leadEmail)}</strong>.</p>
          <button type="button" class="daoz-chip-btn" style="margin-top:8px;align-self:flex-start;">
            <span>Ask Another Question</span>
          </button>
        `;

        const copyBtn = conf.querySelector('.daoz-copy-ref-btn');
        if (copyBtn) {
          copyBtn.addEventListener('click', () => {
            copyToClipboard(extra.reference).then(() => {
              copyBtn.textContent = 'Copied!';
              setTimeout(() => {
                copyBtn.textContent = 'Copy';
              }, 2500);
            });
          });
        }

        const anotherBtn = conf.querySelector('.daoz-chip-btn');
        if (anotherBtn) {
          anotherBtn.addEventListener('click', handleShowMainMenu);
        }

        bubble.appendChild(conf);
      }

      // Helpful feedback prompt
      if (extra.askHelpful) {
        const fb = document.createElement('div');
        fb.className = 'daoz-feedback-prompt';
        fb.innerHTML = `
          <span class="daoz-feedback-text">Did that help?</span>
          <div class="daoz-feedback-btns">
            <button type="button" class="daoz-feedback-btn" data-fb="yes">Yes, thank you</button>
            <button type="button" class="daoz-feedback-btn" data-fb="no">I need more help</button>
          </div>
        `;
        fb.querySelector('[data-fb="yes"]')?.addEventListener('click', () => handleFeedback(true));
        fb.querySelector('[data-fb="no"]')?.addEventListener('click', () => handleFeedback(false));
        bubble.appendChild(fb);
      }

      contentBlock.appendChild(bubble);

      const timeSpan = document.createElement('span');
      timeSpan.className = 'daoz-msg-time';
      timeSpan.textContent = getTimeStr();
      contentBlock.appendChild(timeSpan);

      row.appendChild(contentBlock);
      messagesFeed.appendChild(row);
      scrollToBottom();
    }

    function handleShowMainMenu() {
      pendingDraft = {};
      appendMessage('assistant', 'How else can I assist you?', { showMainMenu: true });
    }

    function handleSelectTopic(topicId) {
      fallbackCount = 0;

      if (topicId === 'about') {
        const topic = TOPIC_DETAILS.about;
        appendMessage('user', topic.title);
        setTimeout(() => {
          appendMessage('assistant', topic.reply, {
            quickReplies: topic.quickReplies,
            onQuickReply: (reply) => {
              if (reply.id === 'main-menu') {
                handleShowMainMenu();
                return;
              }
              appendMessage('user', reply.label);
              const subText = topic.subReplies[reply.id];
              setTimeout(() => {
                appendMessage('assistant', subText, { askHelpful: true });
              }, 250);
            }
          });
        }, 250);
      } else if (topicId === 'getting-started') {
        const topic = TOPIC_DETAILS['getting-started'];
        appendMessage('user', topic.title);
        setTimeout(() => {
          appendMessage('assistant', topic.reply, {
            actions: topic.actions,
            askHelpful: true
          });
        }, 250);
      } else if (topicId === 'pricing') {
        const topic = TOPIC_DETAILS.pricing;
        appendMessage('user', topic.title);
        setTimeout(() => {
          appendMessage('assistant', topic.reply, {
            actions: topic.actions
          });
          setTimeout(() => {
            runPricingRecommendationWizard(topic);
          }, 250);
        }, 250);
      } else if (topicId === 'pricing-wizard') {
        const topic = TOPIC_DETAILS.pricing;
        appendMessage('user', 'Help Me Choose');
        setTimeout(() => {
          runPricingRecommendationWizard(topic);
        }, 250);
      } else if (topicId === 'demo') {
        const topic = TOPIC_DETAILS.demo;
        appendMessage('user', topic.title);
        setTimeout(() => {
          appendMessage('assistant', topic.reply);
          setTimeout(() => {
            appendMessage('assistant', topic.questionTopic, {
              quickReplies: topic.optionsTopic.map((opt) => ({ id: opt, label: opt })),
              onQuickReply: (opt) => {
                appendMessage('user', opt.label);
                pendingDraft = { topic: 'demo', demoFocus: opt.label };
                setTimeout(() => {
                  appendMessage('assistant', topic.questionTime, {
                    quickReplies: [
                      { id: 'morning', label: 'Morning (My time zone)' },
                      { id: 'afternoon', label: 'Afternoon (My time zone)' },
                      { id: 'skip-time', label: 'Skip' }
                    ],
                    onQuickReply: (timeOpt) => {
                      appendMessage('user', timeOpt.label);
                      const draft = {
                        topic: 'demo',
                        demoFocus: opt.label,
                        preferredTime: timeOpt.label === 'Skip' ? 'Flexible' : timeOpt.label
                      };
                      pendingDraft = draft;
                      setTimeout(() => {
                        appendMessage(
                          'assistant',
                          "I've prepared your demo walkthrough request. Please review the details below:",
                          { showPreviewCard: true, draftData: draft }
                        );
                      }, 250);
                    }
                  });
                }, 250);
              }
            });
          }, 250);
        }, 250);
      } else if (topicId === 'support') {
        const topic = TOPIC_DETAILS.support;
        appendMessage('user', topic.title);
        setTimeout(() => {
          appendMessage('assistant', topic.askHelp, {
            quickReplies: topic.options.map((opt) => ({ id: opt.id, label: opt.label })),
            onQuickReply: (opt) => {
              appendMessage('user', opt.label);
              if (opt.id === 'support-login') {
                setTimeout(() => {
                  appendMessage(
                    'assistant',
                    'You can access your account directly via the login portal. If you need a password reset, you can initiate it from the sign-in screen.',
                    {
                      actions: [
                        { id: 'go-login', label: 'Go to Sign In', href: BRAND_CONFIG.loginUrl, isExternal: true },
                        { id: 'other-help', label: 'Ask Something Else', routeTo: 'support' }
                      ],
                      askHelpful: true
                    }
                  );
                }, 250);
                return;
              }
              pendingDraft = { topic: 'support', issueType: opt.label };
              setTimeout(() => {
                appendMessage(
                  'assistant',
                  `Please provide a brief description of what you're experiencing. (${topic.securityReminder})`
                );
              }, 250);
            }
          });
        }, 250);
      }
    }

    function handleFeedback(isHelpful) {
      if (isHelpful) {
        appendMessage('user', 'Yes, thank you');
        setTimeout(() => {
          appendMessage(
            'assistant',
            "Glad I could help! You can ask another question whenever you're ready.",
            { showMainMenu: true }
          );
        }, 250);
      } else {
        appendMessage('user', 'I need more help');
        const draft = { topic: 'follow_up', inquiryText: 'Visitor requested additional assistance' };
        pendingDraft = draft;
        setTimeout(() => {
          appendMessage(
            'assistant',
            'I can help you send a follow-up request to our team so they can review your question:',
            { showPreviewCard: true, draftData: draft }
          );
        }, 250);
      }
    }

    function runPricingRecommendationWizard(topic) {
      appendMessage('assistant', topic.questionAccounts, {
        quickReplies: topic.optionsAccounts.map((opt) => ({ id: opt, label: opt })),
        onQuickReply: (opt) => {
          appendMessage('user', opt.label);
          pendingDraft = { topic: 'pricing', accounts: opt.label };
          setTimeout(() => {
            appendMessage('assistant', topic.questionTeam, {
              quickReplies: topic.optionsTeam.map((t) => ({ id: t, label: t })),
              onQuickReply: (teamOpt) => {
                appendMessage('user', teamOpt.label);
                const recommendation = evaluateRecommendedPlan(
                  opt.label,
                  teamOpt.label,
                  getSelectedCurrency()
                );
                const draft = {
                  topic: 'pricing',
                  accounts: opt.label,
                  team: teamOpt.label,
                  recommendedPlan: recommendation.planName,
                  idempotencyKey: generateOpaqueId('idem')
                };
                pendingDraft = draft;
                setTimeout(() => {
                  appendMessage(
                    'assistant',
                    `Based on your requirements, we suggest: ${recommendation.summary}. Review and send your pricing enquiry below:`,
                    { showPreviewCard: true, draftData: draft }
                  );
                }, 250);
              }
            });
          }, 250);
        }
      });
    }

    async function handleConfirmSubmitRequest(draft, btnEl, originalLabel = 'Send Request') {
      const refPrefix = draft.topic === 'pricing' ? 'PRC' : draft.topic === 'demo' ? 'DMO' : 'SPT';
      let reference = draft.savedReference || generateReferenceId(refPrefix);
      draft.savedReference = reference;

      const payload = {
        reference,
        idempotencyKey: draft.idempotencyKey || reference,
        sessionId: sessionId || 'ses_client',
        name: leadData.name,
        email: leadData.email,
        company: leadData.company || 'Not provided',
        topic: draft.topic || 'general',
        details: draft,
        createdAt: new Date().toISOString(),
        status: 'New'
      };

      try {
        const response = await fetch('/api/chat/requests', {
          method: 'POST',
          headers: buildJsonHeaders(),
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          const resData = await response.json();
          if (resData && resData.reference) {
            reference = resData.reference;
          }
        }
      } catch (err) {
        // Fallback to sessionStorage
        try {
          const existing = JSON.parse(sessionStorage.getItem('daoz_chat_requests') || '[]');
          if (!existing.some((r) => r.reference === reference)) {
            existing.push(payload);
            sessionStorage.setItem('daoz_chat_requests', JSON.stringify(existing));
          }
        } catch (e) {
          // Ignore
        }
      }

      if (btnEl) {
        btnEl.innerHTML = '<span>Submitted ✓</span>';
      }

      const confirmText =
        draft.topic === 'demo'
          ? `Your demo request has been received. Reference: ${reference}. Our team will contact you at ${leadData.email} to arrange the next step.`
          : `Your request has been received. Reference: ${reference}. Our team can follow up at ${leadData.email}.`;

      appendMessage('assistant', confirmText, {
        showConfirmationCard: true,
        reference,
        leadEmail: leadData.email
      });
      pendingDraft = {};
    }

    // Pre-chat form submit
    if (prechatForm) {
      prechatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (errName) errName.hidden = true;
        if (errEmail) errEmail.hidden = true;
        if (errForm) errForm.hidden = true;
        prechatName?.classList.remove('is-invalid');
        prechatEmail?.classList.remove('is-invalid');

        const validation = validateLeadData(
          prechatName?.value,
          prechatEmail?.value,
          prechatCompany?.value
        );

        if (!validation.isValid) {
          if (validation.errors.name && errName) {
            errName.textContent = validation.errors.name;
            errName.hidden = false;
            prechatName?.classList.add('is-invalid');
          }
          if (validation.errors.email && errEmail) {
            errEmail.textContent = validation.errors.email;
            errEmail.hidden = false;
            prechatEmail?.classList.add('is-invalid');
          }
          return;
        }

        if (startBtnLabel) startBtnLabel.textContent = 'Starting...';

        let createdSessionId = generateOpaqueId('ses');
        try {
          const response = await fetch('/api/chat/leads', {
            method: 'POST',
            headers: buildJsonHeaders(),
            body: JSON.stringify({
              name: validation.data.name,
              email: validation.data.email,
              company: validation.data.company,
              timestamp: new Date().toISOString()
            })
          });
          if (response.ok) {
            const data = await response.json();
            if (data && data.sessionId) createdSessionId = data.sessionId;
          }
        } catch (err) {
          // Offline / static fallback
        }

        if (startBtnLabel) startBtnLabel.textContent = 'Start Chat';

        leadData = validation.data;
        sessionId = createdSessionId;
        hasStarted = true;

        if (prechatContainer) prechatContainer.hidden = true;
        if (convWrapper) convWrapper.hidden = false;
        if (resetChatBtn) resetChatBtn.hidden = false;

        appendMessage(
          'assistant',
          "Hi! Welcome to DAOZ360. I'm the automated website assistant. I can help with product questions or help you contact our team."
        );
        appendMessage('assistant', `Thanks, ${leadData.firstName}. What would you like help with?`, {
          showMainMenu: true
        });
      });
    }

    // Free-text input submit
    if (chatInputForm) {
      chatInputForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = (chatInput?.value || '').trim();
        if (!text) return;

        chatInput.value = '';
        if (chatSendBtn) chatSendBtn.disabled = true;
        appendMessage('user', text);

        // Waiting for support description
        if (pendingDraft.topic === 'support' && !pendingDraft.description) {
          pendingDraft.description = text;
          const draftCopy = { ...pendingDraft };
          setTimeout(() => {
            appendMessage('assistant', "Thank you. I've prepared your support request for our technical team:", {
              showPreviewCard: true,
              draftData: draftCopy
            });
          }, 300);
          return;
        }

        const matched = matchFreeTextIntent(text);
        setTimeout(() => {
          if (matched.type === 'human') {
            const humanDraft = { topic: 'enquiry', inquiryText: text };
            pendingDraft = humanDraft;
            appendMessage(
              'assistant',
              'I can help you send this inquiry directly to our team. What would you like them to know?',
              { showPreviewCard: true, draftData: humanDraft }
            );
            return;
          }

          if (matched.type === 'topic') {
            if (matched.subTopicId) {
              const subText = TOPIC_DETAILS.about.subReplies[matched.subTopicId];
              appendMessage('assistant', subText, { askHelpful: true });
            } else if (matched.subAction === 'networks') {
              appendMessage('assistant', TOPIC_DETAILS['getting-started'].networksReply, {
                askHelpful: true
              });
            } else {
              handleSelectTopic(matched.topicId);
            }
            return;
          }

          fallbackCount += 1;
          if (fallbackCount === 1) {
            appendMessage('assistant', FALLBACK_RESPONSES.firstAttempt, { showMainMenu: true });
          } else {
            const followUpDraft = { topic: 'general_question', inquiryText: text };
            pendingDraft = followUpDraft;
            appendMessage(
              'assistant',
              `${FALLBACK_RESPONSES.secondAttempt} (${FALLBACK_RESPONSES.directContact})`,
              { showPreviewCard: true, draftData: followUpDraft }
            );
          }
        }, 300);
      });
    }
  }

  /* ==========================================================================
     9. INTERACTIVE SCREEN PARTICLE EFFECT (HTML5 CANVAS)
     ========================================================================== */

  function initInteractiveParticles() {
    // Respect reduced motion preference
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    let canvas = document.getElementById('daoz-particles-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'daoz-particles-canvas';
      canvas.className = 'daoz-particles-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.prepend(canvas);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const palette = [
      { r: 255, g: 90, b: 0 },   // DAOZ360 Brand Orange (#FF5A00)
      { r: 255, g: 140, b: 0 },  // Warm Amber
      { r: 255, g: 176, b: 0 },  // Gold Orange (#FFB000)
      { r: 185, g: 61, b: 0 }    // Deep Orange (#B93D00)
    ];

    const mouse = {
      x: null,
      y: null,
      radius: 150,
      isPressed: false
    };

    let particles = [];
    let burstParticles = [];

    function resizeCanvas() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function createParticle(x, y, isBurst = false) {
      const color = palette[Math.floor(Math.random() * palette.length)];
      const angle = Math.random() * Math.PI * 2;
      const speed = isBurst ? 1.5 + Math.random() * 3.5 : 0.25 + Math.random() * 0.65;

      return {
        x: x !== undefined ? x : Math.random() * width,
        y: y !== undefined ? y : Math.random() * height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: isBurst ? 2 + Math.random() * 2.5 : 1.6 + Math.random() * 2.2,
        baseAlpha: isBurst ? 0.85 : 0.3 + Math.random() * 0.35,
        alpha: isBurst ? 0.9 : 0.3 + Math.random() * 0.35,
        color,
        pulseSpeed: 0.015 + Math.random() * 0.02,
        pulseOffset: Math.random() * Math.PI * 2,
        life: isBurst ? 1.0 : null,
        decay: isBurst ? 0.018 + Math.random() * 0.015 : 0
      };
    }

    function populateParticles() {
      const area = width * height;
      const count = Math.min(Math.max(Math.floor(area / 18000), 28), 75);
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push(createParticle());
      }
    }

    resizeCanvas();
    populateParticles();

    window.addEventListener('resize', () => {
      resizeCanvas();
      populateParticles();
    }, { passive: true });

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }, { passive: true });

    window.addEventListener('mouseout', () => {
      mouse.x = null;
      mouse.y = null;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      mouse.x = null;
      mouse.y = null;
    }, { passive: true });

    // Interactive click/tap particle burst
    window.addEventListener('pointerdown', (e) => {
      // Avoid bursting when clicking inside chat or modal inputs
      const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea') return;

      const burstCount = 12;
      for (let i = 0; i < burstCount; i++) {
        burstParticles.push(createParticle(e.clientX, e.clientY, true));
      }
    }, { passive: true });

    let tick = 0;

    function animate() {
      ctx.clearRect(0, 0, width, height);
      tick += 1;

      // Update & draw main ambient interactive particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        // Soft wrap around screen edges
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // Subtle breathing pulse
        const pulse = Math.sin(tick * p.pulseSpeed + p.pulseOffset) * 0.12;
        p.alpha = Math.max(0.15, Math.min(0.8, p.baseAlpha + pulse));

        // Interactive cursor proximity response
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius && dist > 0) {
            const force = (mouse.radius - dist) / mouse.radius;
            // Gentle orbital push/pull interaction
            p.x -= (dx / dist) * force * 1.35;
            p.y -= (dy / dist) * force * 1.35;
            p.alpha = Math.min(0.9, p.alpha + force * 0.35);

            // Draw interactive line from particle to cursor
            const lineAlpha = (1 - dist / mouse.radius) * 0.28;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(255, 90, 0, ${lineAlpha.toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // Draw particle node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.alpha.toFixed(3)})`;
        ctx.fill();

        // Connect nearby particles with subtle constellation lines
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distSq = dx * dx + dy * dy;
          const maxDist = 115;

          if (distSq < maxDist * maxDist) {
            const dist = Math.sqrt(distSq);
            const linkAlpha = (1 - dist / maxDist) * 0.14;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(255, 110, 20, ${linkAlpha.toFixed(3)})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      // Update & draw click burst particles
      for (let i = burstParticles.length - 1; i >= 0; i--) {
        const bp = burstParticles[i];
        bp.x += bp.vx;
        bp.y += bp.vy;
        bp.vx *= 0.96;
        bp.vy *= 0.96;
        bp.life -= bp.decay;

        if (bp.life <= 0) {
          burstParticles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(bp.x, bp.y, bp.size * bp.life, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${bp.color.r}, ${bp.color.g}, ${bp.color.b}, ${(bp.life * 0.85).toFixed(3)})`;
        ctx.fill();
      }

      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }

  /* ==========================================================================
     10. INITIALIZE ALL MODULES ON DOM READY
     ========================================================================== */

  document.addEventListener('DOMContentLoaded', () => {
    initFeatureVisibility();
    initHeaderAndNavigation();
    initWorkflowTabs();
    initPricingPage();
    initContactModalAndCopyButtons();
    initLegalScrollSpy();
    initContactPageComposer();
    initChatWidget();
    initInteractiveParticles();
  });
})();
