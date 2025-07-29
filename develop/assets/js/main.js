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
    this.backToTop();
    this.updateCurrentYear();
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
        
        // Update swiper after tab change
        setTimeout(() => {
          swipers.forEach(swiper => {
            if (swiper.swiper) {
              swiper.swiper.update();
              swiper.swiper.slideTo(0);
            }
          });
        }, 50);
      });
    });

    if (typeof Swiper === 'undefined') return;
    swipers.forEach(el => {
      new Swiper(el, {
        loop: true,
        autoplay: {
          delay: 5000,
          disableOnInteraction: false
        },
        pagination: {
          el: el.querySelector('.swiper-pagination'),
          clickable: true,
          dynamicBullets: true
        },
        navigation: {
          nextEl: el.querySelector('.swiper-button-next'),
          prevEl: el.querySelector('.swiper-button-prev')
        },
        slidesPerView: 1,
        spaceBetween: 20,
        centeredSlides: false,
        slideToClickedSlide: false,
        grabCursor: true,
        watchSlidesProgress: true,
        breakpoints: {
          640: {
            slidesPerView: 2,
            spaceBetween: 20
          },
          1024: {
            slidesPerView: 3,
            spaceBetween: 30
          }
        },
        on: {
          init: function() {
            // Add click handler to slides
            this.slides.forEach(slide => {
              slide.style.cursor = 'pointer';
            });
          }
        }
      });
    });
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

  /* ---------- 6. Back to Top ---------- */
  backToTop() {
    const backToTopBtn = document.querySelector('.back-to-top');
    if (!backToTopBtn) return;

    // Show/hide button on scroll
    const toggleBackToTop = () => {
      if (window.scrollY > 300) {
        backToTopBtn.classList.add('show');
      } else {
        backToTopBtn.classList.remove('show');
      }
    };

    // Smooth scroll to top
    const scrollToTop = (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    };

    // Event listeners
    window.addEventListener('scroll', toggleBackToTop);
    backToTopBtn.addEventListener('click', scrollToTop);
    
    // Initial check in case page is loaded with scroll position
    toggleBackToTop();
  },

  /* ---------- 7. Lightbox ---------- */
  lightbox() {
    const box = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    const caption = document.getElementById('lightbox-caption');
    const closeBtn = document.querySelector('.lightbox-close');
    const prevBtn = document.querySelector('.lightbox-prev');
    const nextBtn = document.querySelector('.lightbox-next');
    
    if (!box || !img) return;

    // Handle clicks on portfolio images and swiper slides
    const handleImageClick = (imageElement) => {
      if (!imageElement) return;
      
      // Get the full-size image URL (use data-full attribute if available)
      const fullImg = imageElement.dataset.full || imageElement.src || imageElement.getAttribute('src');
      const imgAlt = imageElement.alt || 'Portfolio Image';
      
      // Set the lightbox content
      img.src = fullImg;
      img.alt = imgAlt;
      
      // Set caption if available
      if (caption) {
        const portfolioItem = imageElement.closest('.portfolio-item, .swiper-slide');
        if (portfolioItem) {
          const title = portfolioItem.querySelector('h3, .portfolio-content h3, .project-title');
          caption.textContent = title ? title.textContent : imgAlt;
        } else {
          caption.textContent = imgAlt;
        }
      }
      
      // Show the lightbox with smooth transition
      document.body.style.overflow = 'hidden';
      box.classList.remove('hidden');
      // Force reflow to ensure the transition works
      void box.offsetWidth;
      box.classList.add('visible');
      
      // Focus management for accessibility
      box.setAttribute('aria-hidden', 'false');
      if (closeBtn) closeBtn.focus();
      
      // Store current image element for navigation
      currentImage = imageElement;
      
      // Update navigation buttons state
      updateNavButtons();
    };
    
    // Handle click events on portfolio images and swiper slides
    document.addEventListener('click', (e) => {
      // Check for portfolio image click
      const portfolioImg = e.target.closest('.portfolio-img img');
      if (portfolioImg) {
        e.preventDefault();
        e.stopPropagation();
        handleImageClick(portfolioImg);
        return;
      }
      
      // Check for swiper slide click (but not on navigation elements)
      const swiperSlide = e.target.closest('.swiper-slide:not(.swiper-slide-duplicate)');
      if (swiperSlide && !e.target.closest('.swiper-button-next, .swiper-button-prev, .swiper-pagination')) {
        const img = swiperSlide.querySelector('img');
        if (img) {
          e.preventDefault();
          e.stopPropagation();
          handleImageClick(img);
        }
      }
    });
    
    // Handle keyboard navigation
    let currentImage = null;
    
    const updateNavButtons = () => {
      if (!currentImage) return;
      
      // Find current slide index
      const slides = Array.from(document.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate)'));
      const currentIndex = slides.findIndex(slide => slide.contains(currentImage));
      
      // Update button states
      if (prevBtn) {
        prevBtn.disabled = currentIndex <= 0;
        prevBtn.style.opacity = currentIndex <= 0 ? '0.5' : '1';
      }
      
      if (nextBtn) {
        nextBtn.disabled = currentIndex >= slides.length - 1;
        nextBtn.style.opacity = currentIndex >= slides.length - 1 ? '0.5' : '1';
      }
    };
    
    // Navigation functions
    const showNextImage = () => {
      if (!currentImage) return;
      
      const slides = Array.from(document.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate)'));
      const currentIndex = slides.findIndex(slide => slide.contains(currentImage));
      
      if (currentIndex < slides.length - 1) {
        const nextSlide = slides[currentIndex + 1];
        const nextImage = nextSlide.querySelector('img');
        if (nextImage) handleImageClick(nextImage);
      }
    };
    
    const showPrevImage = () => {
      if (!currentImage) return;
      
      const slides = Array.from(document.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate)'));
      const currentIndex = slides.findIndex(slide => slide.contains(currentImage));
      
      if (currentIndex > 0) {
        const prevSlide = slides[currentIndex - 1];
        const prevImage = prevSlide.querySelector('img');
        if (prevImage) handleImageClick(prevImage);
      }
    };
    
    // Add event listeners for navigation buttons
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showNextImage();
      });
    }
    
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showPrevImage();
      });
    }

    // Close lightbox when clicking the close button or overlay
    const closeLightbox = () => {
      box.classList.remove('visible');
      box.addEventListener('transitionend', function handler() {
        box.removeEventListener('transitionend', handler);
        box.classList.add('hidden');
      }, { once: true });
      
      document.body.style.overflow = '';
      box.setAttribute('aria-hidden', 'true');
    };
    
    closeBtn.addEventListener('click', closeLightbox);
    box.addEventListener('click', (e) => {
      if (e.target === box) closeLightbox();
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!box.classList.contains('hidden')) {
        if (e.key === 'Escape') {
          closeLightbox();
        } else if (e.key === 'ArrowLeft') {
          // Navigate to previous image
          const prevBtn = box.querySelector('.lightbox-prev');
          if (prevBtn) prevBtn.click();
        } else if (e.key === 'ArrowRight') {
          // Navigate to next image
          const nextBtn = box.querySelector('.lightbox-next');
          if (nextBtn) nextBtn.click();
        }
      }
    });
  },

  // Update current year in footer
  updateCurrentYear() {
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }
  }
};

document.readyState === 'loading' ?
  document.addEventListener('DOMContentLoaded', app.init) :
  app.init();