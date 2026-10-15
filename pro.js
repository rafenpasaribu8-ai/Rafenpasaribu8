(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const intro = $('#intro');
  const burger = $('#burger');
  const mobile = $('#mobile');
  const nav = $('#nav');
  const gallery = $('#gallery');
  const cards = $$('.gallery-grid .card');

  // A short, skippable intro feels intentional without holding the site hostage.
  if (intro) {
    if (reducedMotion || (location.hash && location.hash !== '#home')) {
      intro.classList.add('hide');
      intro.setAttribute('aria-hidden', 'true');
    } else {
      window.setTimeout(() => {
        intro.classList.add('hide');
        intro.setAttribute('aria-hidden', 'true');
      }, 850);
    }
  }

  // Keyboard users can jump directly to the site's main content.
  if (!$('.skip-link')) {
    const skip = document.createElement('a');
    skip.className = 'skip-link';
    skip.href = '#home';
    skip.textContent = 'Lewati navigasi, ke konten utama';
    document.body.prepend(skip);
  }

  // Mobile menu state stays in sync with the legacy menu toggle.
  if (burger && mobile) {
    burger.setAttribute('aria-controls', mobile.id || 'mobile');
    const syncMenu = () => {
      const open = mobile.classList.contains('open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
      burger.textContent = open ? '×' : '☰';
    };
    syncMenu();
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

  // Professional share affordance with a native Android share-sheet fallback.
  if (gallery && cards.length && !$('.gallery-actions', gallery)) {
    const header = $('.section-title', gallery);
    const actions = document.createElement('div');
    actions.className = 'gallery-actions';
    const count = document.createElement('span');
    count.className = 'gallery-count';
    count.textContent = cards.length + ' potret pilihan · IX-C Forever';
    count.setAttribute('aria-label', cards.length + ' foto dalam galeri');
    const share = document.createElement('button');
    share.className = 'gallery-share';
    share.type = 'button';
    share.innerHTML = '<span aria-hidden="true">↗</span><span>Bagikan kenangan</span>';
    share.addEventListener('click', async () => {
      const shareUrl = location.origin + location.pathname + '#gallery';
      const payload = {
        title: document.title || 'Kenangan Kelas 9C',
        text: 'Buka kembali kenangan dan foto Kelas 9C.',
        url: shareUrl
      };
      try {
        if (navigator.share) {
          await navigator.share(payload);
          announce('Menu berbagi dibuka.');
        } else if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(shareUrl);
          announce('Tautan galeri berhasil disalin.');
        } else {
          const temp = document.createElement('textarea');
          temp.value = shareUrl;
          temp.setAttribute('readonly', '');
          temp.style.position = 'fixed';
          temp.style.opacity = '0';
          document.body.appendChild(temp);
          temp.select();
          const copied = document.execCommand('copy');
          temp.remove();
          announce(copied ? 'Tautan galeri berhasil disalin.' : shareUrl);
        }
      } catch (error) {
        if (error && error.name !== 'AbortError') announce('Salin tautan dari bilah alamat untuk membagikan galeri.');
      }
    });
    actions.append(count, share);
    if (header) header.insertAdjacentElement('afterend', actions);
    else gallery.insertBefore(actions, gallery.querySelector('.gallery-grid'));
  }

  // Small, accessible status toast. No background timers or animation loops.
  let toastTimer = 0;
  function announce(message) {
    let toast = $('.pro-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'pro-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2600);
  }

  // Keep navigation focus and selected state clear without an animation-heavy scroll handler.
  const allNavLinks = $$('.menu a[href^="#"], .mobile a[href^="#"]');
  const anchorTargets = [...new Set(allNavLinks.map(link => link.getAttribute('href')))]
    .map(hash => $(hash))
    .filter(Boolean);
  if ('IntersectionObserver' in window && anchorTargets.length) {
    const activeObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const hash = '#' + entry.target.id;
        allNavLinks.forEach(link => {
          const active = link.getAttribute('href') === hash;
          if (link.closest('.menu')) {
            link.classList.toggle('active', active);
            if (active) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
          }
        });
      });
    }, { rootMargin: '-28% 0px -62% 0px', threshold: 0 });
    anchorTargets.forEach(target => activeObserver.observe(target));
  }

  // Lightbox supports swipe gestures on phones. The existing click/keyboard
  // handlers remain the source of truth for opening, closing and changing photos.
  const modal = $('#modal');
  const modalImage = $('#modalImg');
  if (modal && modalImage && cards.length) {
    let startX = 0;
    let startY = 0;
    modalImage.addEventListener('touchstart', event => {
      const touch = event.changedTouches[0];
      startX = touch.clientX;
      startY = touch.clientY;
    }, { passive: true });
    modalImage.addEventListener('touchend', event => {
      const touch = event.changedTouches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
      const directionKey = dx < 0 ? 'ArrowRight' : 'ArrowLeft';
      window.dispatchEvent(new KeyboardEvent('keydown', { key: directionKey, bubbles: true }));
    }, { passive: true });
  }

  // Give gallery cards useful keyboard labels without changing their photo sources.
  cards.forEach((card, index) => {
    const title = card.dataset.title || $('h4', card)?.textContent?.trim() || 'Foto kenangan IX-C';
    if (!card.hasAttribute('aria-label')) card.setAttribute('aria-label', 'Buka foto ' + (index + 1) + ': ' + title);
    if (!card.hasAttribute('tabindex')) card.tabIndex = 0;
    if (!card.hasAttribute('role')) card.setAttribute('role', 'button');
  });

  // Avoid autoplay intro if users arrive directly at another section.
  if (location.hash && location.hash !== '#home') {
    const target = $(location.hash);
    if (target) window.requestAnimationFrame(() => target.scrollIntoView({ block: 'start', behavior: reducedMotion ? 'auto' : 'smooth' }));
  }
})();
