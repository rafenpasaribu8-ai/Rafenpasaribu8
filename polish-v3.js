(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const burger = $('#burger');
  const mobile = $('#mobile');

  // Keep the mobile navigation accessible when the existing menu script toggles it.
  if (burger && mobile) {
    burger.setAttribute('aria-controls', mobile.id || 'mobile');
    burger.setAttribute('aria-expanded', mobile.classList.contains('open') ? 'true' : 'false');
    burger.setAttribute('aria-label', mobile.classList.contains('open') ? 'Tutup menu' : 'Buka menu');
    const syncMenu = () => {
      const open = mobile.classList.contains('open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
    };
    new MutationObserver(syncMenu).observe(mobile, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('click', event => {
      if (!mobile.classList.contains('open')) return;
      if (mobile.contains(event.target) || burger.contains(event.target)) return;
      mobile.classList.remove('open');
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && mobile.classList.contains('open')) {
        mobile.classList.remove('open');
        burger.focus({ preventScroll: true });
      }
    });
  }

  // Small touch feedback on primary actions. This is event-driven, so idle pages do no work.
  const actionSelector = '.btn, .modal-control, #backToTop, .burger';
  document.addEventListener('pointerdown', event => {
    if (reducedMotion || event.pointerType === 'touch') return;
    const button = event.target.closest(actionSelector);
    if (!button || button.disabled) return;
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'interaction-ripple';
    const size = Math.max(rect.width, rect.height) * 1.35;
    ripple.style.width = size + 'px';
    ripple.style.height = size + 'px';
    ripple.style.left = (event.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (event.clientY - rect.top - size / 2) + 'px';
    button.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  }, { passive: true });

  // Stagger cards with a gentle rhythm; CSS handles animation and respects reduced-motion.
  $$('.gallery-grid .card').forEach((card, index) => {
    card.style.setProperty('--reveal-delay', Math.min(index * 55, 330) + 'ms');
    if (!card.hasAttribute('aria-label')) {
      const title = card.dataset.title || $('h4', card)?.textContent?.trim() || 'Foto kenangan IX-C';
      card.setAttribute('aria-label', 'Buka foto: ' + title);
    }
  });

  // Don't let a fixed intro overlay trap focus or touch scrolling after it fades out.
  const intro = $('#intro');
  if (intro) {
    const observer = new MutationObserver(() => {
      if (intro.classList.contains('hide')) {
        intro.setAttribute('aria-hidden', 'true');
        intro.style.pointerEvents = 'none';
        observer.disconnect();
      }
    });
    observer.observe(intro, { attributes: true, attributeFilter: ['class'] });
    if (intro.classList.contains('hide')) {
      intro.setAttribute('aria-hidden', 'true');
      intro.style.pointerEvents = 'none';
      observer.disconnect();
    }
  }

  // On devices without hover, leave transforms to the native touch scroll for a stable gallery.
  if (window.matchMedia('(hover: none)').matches) {
    $$('.gallery-grid .card').forEach(card => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  }
})();
