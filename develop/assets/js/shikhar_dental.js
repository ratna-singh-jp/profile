let menu = document.querySelector('#menu-btn');
let navbar = document.querySelector('.header .nav');
let header = document.querySelector('.header');

if (menu) {
  menu.onclick = () => {
    menu.classList.toggle('fa-times');
    navbar.classList.toggle('active');
  }
}

window.onscroll = () => {
  if (menu) menu.classList.remove('fa-times');
  if (navbar) navbar.classList.remove('active');

  if (window.scrollY > 0) {
    if (header) header.classList.add('active');
  } else {
    if (header) header.classList.remove('active');
  }
}

// Preloader
window.addEventListener('load', function () {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    setTimeout(function () {
      preloader.style.opacity = '0';
      setTimeout(function () {
        preloader.style.display = 'none';
      }, 500);
    }, 500);
  }
});

// Back to top button
(function () {
  const btn = document.querySelector('.back-to-top');
  if (!btn) return;

  let visible = false;
  const show = () => {
    if (!visible) {
      visible = true;
      btn.classList.add('visible');
    }
  };
  const hide = () => {
    if (visible) {
      visible = false;
      btn.classList.remove('visible');
    }
  };

  // debounced scroll
  let raf;
  window.addEventListener('scroll', () => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      window.pageYOffset > 300 ? show() : hide();
    });
  }, { passive: true });

  // smooth scroll to top
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

// GSAP Animations
document.addEventListener('DOMContentLoaded', function () {
  gsap.registerPlugin(ScrollTrigger);

  // Header animation
  gsap.from('.header', {
    y: -100,
    opacity: 0,
    duration: 1,
    ease: 'power3.out'
  });

  // Home section animation
  gsap.from('.home .content h3', {
    x: -100,
    opacity: 0,
    duration: 1,
    delay: 0.5
  });
  gsap.from('.home .content p', {
    x: -100,
    opacity: 0,
    duration: 1,
    delay: 0.8
  });
  gsap.from('.home .content .link-btn', {
    opacity: 0,
    duration: 1,
    delay: 1.1
  });

  // About section animation
  gsap.from('.about .image', {
    scrollTrigger: {
      trigger: '.about',
      start: 'top 80%'
    },
    x: -100,
    opacity: 0,
    duration: 1
  });
  gsap.from('.about .content', {
    scrollTrigger: {
      trigger: '.about',
      start: 'top 80%'
    },
    x: 100,
    opacity: 0,
    duration: 1
  });

  // Services section animation
  gsap.from('.services .box', {
    scrollTrigger: {
      trigger: '.services',
      start: 'top 80%'
    },
    y: 100,
    opacity: 0,
    duration: 0.5,
    stagger: 0.2
  });

  // Process section animation
  gsap.from('.process .box', {
    scrollTrigger: {
      trigger: '.process',
      start: 'top 80%'
    },
    scale: 0.5,
    opacity: 0,
    duration: 0.5,
    stagger: 0.2
  });

  // Reviews section animation
  gsap.from('.reviews .box', {
    scrollTrigger: {
      trigger: '.reviews',
      start: 'top 80%'
    },
    y: 100,
    opacity: 0,
    duration: 0.5,
    stagger: 0.2
  });

  // Contact section animation
  gsap.from('.contact form', {
    scrollTrigger: {
      trigger: '.contact',
      start: 'top 80%'
    },
    y: 100,
    opacity: 0,
    duration: 1
  });

  // Footer animation
  gsap.from('.footer .box', {
    scrollTrigger: {
      trigger: '.footer',
      start: 'top 80%'
    },
    y: 50,
    opacity: 0,
    duration: 0.5,
    stagger: 0.2
  });
});