window.addEventListener('load', () => {
  if (typeof gsap === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  // Header scroll state
  const header = document.getElementById('header');
  ScrollTrigger.create({
    start: 'top -10',
    onEnter: () => header.classList.add('scrolled'),
    onLeaveBack: () => header.classList.remove('scrolled'),
  });

  // Hero reveal
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.to('.hero-circle', { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out', delay: 0.1 }, 0)
    .to('.hero-eyebrow', { opacity: 1, duration: 0.6, delay: 0.2 })
    .to('.hero-name .word span', {
      y: '0%',
      duration: 0.9,
      stagger: 0.12,
      ease: 'power4.out',
    }, '-=0.3')
    .to('.hero-title', { opacity: 1, y: 0, duration: 0.6 }, '-=0.4')
    .to('.hero-tagline', { opacity: 1, duration: 0.5 }, '-=0.3')
    .to('.cta-scroll', { opacity: 1, duration: 0.5 }, '-=0.3');

  // Wrap hero name words for split animation
  document.querySelectorAll('.hero-name .word').forEach(word => {
    const text = word.textContent;
    word.textContent = '';
    const inner = document.createElement('span');
    inner.textContent = text;
    word.appendChild(inner);
  });

  // Scroll reveals
  gsap.utils.toArray('.skill-block').forEach((el, i) => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 88%' },
      opacity: 0,
      y: 20,
      duration: 0.6,
      delay: i * 0.08,
      ease: 'power2.out',
    });
  });

  gsap.utils.toArray('.project-card').forEach(card => {
    const meta = card.querySelector('.project-meta');
    const media = card.querySelector('.project-media');
    gsap.from([meta, media], {
      scrollTrigger: { trigger: card, start: 'top 82%' },
      opacity: 0,
      y: 30,
      duration: 0.7,
      stagger: 0.15,
      ease: 'power2.out',
    });
  });

  ['#apropos', '#contact'].forEach(sel => {
    gsap.from(sel, {
      scrollTrigger: { trigger: sel, start: 'top 85%' },
      opacity: 0,
      y: 24,
      duration: 0.7,
      ease: 'power2.out',
    });
  });

  // Mobile nav
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');

  hamburger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Lazy-load YouTube iframe
  document.querySelectorAll('iframe[data-src]').forEach(iframe => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        iframe.src = iframe.dataset.src;
        observer.disconnect();
      }
    }, { rootMargin: '200px' });
    observer.observe(iframe);
  });
});
