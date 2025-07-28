/* main.js – header + tabs + sliders + lightbox, 0 jQuery */
import smoothScroll from './smooth_scroll.js';

const HEADER_OFFSET = 80;

const app = {
  /* ---------- 1. Boot ---------- */
  init() {
    smoothScroll.init();
    this.header();
    this.tabs();
    this.backToTop();
    this.typed();
    this.lightbox();
  },

  /* ---------- 2. Header (animated drawer + icon) ---------- */
  header() {
    const header = document.querySelector('.header');
    const btn = document.querySelector('.header__mobile-toggle');
    const nav = document.querySelector('.header__nav');
    if (!header || !btn || !nav) return;

    let last = 0;

    /* sticky header */
    window.addEventListener('scroll', () => {
      const now = window.scrollY;
      header.classList.toggle('header-scrolled', now > 0);
      header.classList.toggle('scroll-down', now > last && now > 0);
      header.classList.toggle('scroll-up', now < last && now > 0);
      last = now;
    });

    /* drawer toggle */
    const toggle = () => {
      btn.classList.toggle('open'); // morphs hamburger → X
      nav.classList.toggle('open'); // slides drawer
      document.body.classList.toggle('no-scroll');
    };
    btn.addEventListener('click', toggle);
    nav.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') toggle();
    });
  },

  /* ---------- 3. Tabs + Swipers ---------- */
  tabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.tab-panel');
    const swipers = document.querySelectorAll('.swiper');

    tabs.forEach((btn, i) => {
      btn.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        if (panels[i]) panels[i].classList.add('active');
      });
    });

    if (typeof Swiper === 'undefined') return;
    swipers.forEach(el => new Swiper(el, {
      loop: true,
      autoplay: {
        delay: 5000
      },
      pagination: {
        el: el.querySelector('.swiper-pagination'),
        clickable: true
      },
      navigation: {
        nextEl: el.querySelector('.swiper-button-next'),
        prevEl: el.querySelector('.swiper-button-prev')
      },
      slidesPerView: 1,
      breakpoints: {
        640: {
          slidesPerView: 2
        },
        1024: {
          slidesPerView: 3
        }
      }
    }));
  },

  /* ---------- 4. Back to top ---------- */
  backToTop() {
    const btn = document.querySelector('.back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', () => btn.classList.toggle('show', window.scrollY > 300));
    btn.addEventListener('click', () => window.scrollTo({
      top: 0,
      behavior: 'smooth'
    }));
  },

  /* ---------- 5. Typed.js ---------- */
  typed() {
    const el = document.querySelector('.typing-text');
    if (!el) return;
    import('typed.js').then(({
      Typed
    }) => new Typed(el, {
      strings: ['Developer', 'Designer', 'Freelancer', 'Photographer'],
      typeSpeed: 100,
      backSpeed: 60,
      loop: true
    }));
  },

  /* ---------- 6. Lightbox ---------- */
  lightbox() {
    const box = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    if (!box || !img) return;

    document.addEventListener('click', (e) => {
      if (!e.target.classList.contains('gallery-img')) return;
      img.src = e.target.dataset.full || e.target.src;
      box.classList.remove('hidden');
    });

    box.addEventListener('click', () => box.classList.add('hidden'));
  }
};

document.readyState === 'loading' ?
  document.addEventListener('DOMContentLoaded', app.init) :
  app.init();