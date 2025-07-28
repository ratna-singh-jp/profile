const smoothScroll = {
  // One place to tweak
  offset: () => {
    const header = document.querySelector('header');
    return header ? header.offsetHeight : 0;
  },
  duration: 600,
  easing: t => t < 0.5 ? 4 * t ** 3 : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  init() {
    // Respect user motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // 1. Handle clicks
    document.addEventListener('click', this.onClick.bind(this));

    // 2. Handle programmatic hash changes (back/forward)
    window.addEventListener('hashchange', this.onHashChange.bind(this));

    // 3. Handle initial hash on load
    if (window.location.hash) {
      requestAnimationFrame(() => this.scrollTo(window.location.hash));
    }
  },

  onClick(e) {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor || this.isException(anchor)) return;

    const targetId = anchor.getAttribute('href');
    if (targetId === '#') return;

    this.scrollTo(targetId);
    e.preventDefault();
  },

  onHashChange() {
    this.scrollTo(window.location.hash);
  },

  isException(el) {
    return [
      '.js-nav-trigger',
      '.js-sidemenu-trigger',
      '.navbar-toggler',
      '[data-toggle="tab"]',
      '[data-smooth-scroll="false"]'
    ].some(sel => el.matches(sel));
  },

  scrollTo(selector) {
    const target = document.querySelector(selector);
    if (!target) return;

    const startY = window.pageYOffset;
    const endY   = Math.max(0, target.offsetTop - this.offset());
    const delta  = endY - startY;

    if (Math.abs(delta) < 2) return; // already there

    // Modern browsers: native smooth scroll
    if ('scrollBehavior' in document.documentElement.style) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    // Legacy Safari / IE
    let start = null;
    const step = now => {
      start = start || now;
      const progress = Math.min((now - start) / this.duration, 1);
      window.scrollTo(0, startY + delta * this.easing(progress));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
};

/* Auto-init */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => smoothScroll.init());
} else {
  smoothScroll.init();
}

export default smoothScroll;