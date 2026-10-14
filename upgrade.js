(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const intro = $('#intro');
  if (intro && !intro.classList.contains('hide')) window.setTimeout(() => intro.classList.add('hide'), 1450);

  const progress = document.createElement('div');
  progress.id = 'scrollProgress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);
  const topButton = document.createElement('button');
  topButton.id = 'backToTop';
  topButton.type = 'button';
  topButton.setAttribute('aria-label', 'Kembali ke atas');
  topButton.title = 'Kembali ke atas';
  topButton.innerHTML = '<span aria-hidden="true">↑</span>';
  document.body.appendChild(topButton);
  topButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' }));

  let scrollQueued = false;
  const updateScrollUi = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const fraction = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
    progress.style.width = (fraction * 100) + '%';
    topButton.classList.toggle('visible', window.scrollY > 520);
    scrollQueued = false;
  };
  window.addEventListener('scroll', () => {
    if (!scrollQueued) { scrollQueued = true; window.requestAnimationFrame(updateScrollUi); }
  }, { passive: true });
  window.addEventListener('resize', updateScrollUi, { passive: true });
  updateScrollUi();

  const motionKinds = ['up', 'left', 'right', 'zoom'];
  $$('.reveal').forEach((element, index) => {
    element.dataset.motion = element.dataset.motion || motionKinds[index % motionKinds.length];
    element.style.setProperty('--reveal-delay', ((index % 4) * 65) + 'ms');
  });

  const setCardAccessibility = card => {
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', 'Lihat foto: ' + (card.dataset.title || 'kenangan IX-C'));
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); card.click(); }
    });
  };
  const cards = $$('.card');
  if (!reducedMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    cards.forEach(card => {
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        card.style.setProperty('--ry', ((x - 0.5) * 4.5) + 'deg');
        card.style.setProperty('--rx', ((0.5 - y) * 4.5) + 'deg');
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--ry', '0deg'); card.style.setProperty('--rx', '0deg');
      });
      setCardAccessibility(card);
    });
  } else cards.forEach(setCardAccessibility);

  const modal = $('#modal');
  const modalCard = $('.modal-card', modal || document);
  const modalImg = $('#modalImg');
  const modalTitle = $('#modalTitle');
  const modalCap = $('#modalCap');
  let activeIndex = -1;
  if (modal && modalCard && modalImg && cards.length) {
    modalCard.addEventListener('click', event => event.stopPropagation());
    const controls = document.createElement('div');
    controls.className = 'modal-controls';
    controls.innerHTML = '<button class="modal-control" type="button" data-action="prev" aria-label="Foto sebelumnya" title="Foto sebelumnya">‹</button><button class="modal-control" type="button" data-action="next" aria-label="Foto berikutnya" title="Foto berikutnya">›</button><button class="modal-control" type="button" data-action="close" aria-label="Tutup foto" title="Tutup">×</button>';
    modalCard.appendChild(controls);

    const showCard = index => {
      activeIndex = (index + cards.length) % cards.length;
      const card = cards[activeIndex];
      const img = $('img', card);
      const source = card.dataset.src || (img && (img.currentSrc || img.src));
      if (!source) return;
      modalImg.src = source; modalImg.alt = card.dataset.title || 'Foto kenangan IX-C';
      if (modalTitle) modalTitle.textContent = card.dataset.title || 'Kenangan IX-C';
      if (modalCap) modalCap.textContent = card.dataset.cap || '';
      modal.classList.add('show'); modal.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
    };
    const closeModal = () => {
      modal.classList.remove('show'); modal.setAttribute('aria-hidden', 'true'); document.body.style.overflow = '';
    };
    cards.forEach((card, index) => card.addEventListener('click', () => { activeIndex = index; }));
    controls.addEventListener('click', event => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      event.stopPropagation();
      const action = button.dataset.action;
      if (action === 'close') closeModal();
      if (action === 'prev') showCard(activeIndex <= 0 ? cards.length - 1 : activeIndex - 1);
      if (action === 'next') showCard(activeIndex < 0 ? 0 : activeIndex + 1);
    });
    modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
    window.addEventListener('keydown', event => {
      if (!modal.classList.contains('show')) return;
      if (event.key === 'Escape') closeModal();
      if (event.key === 'ArrowLeft') showCard(activeIndex <= 0 ? cards.length - 1 : activeIndex - 1);
      if (event.key === 'ArrowRight') showCard(activeIndex < 0 ? 0 : activeIndex + 1);
    });
  }

  const navLinks = $$('.menu a[href^="#"]');
  const sections = navLinks.map(link => $(link.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const activeObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id));
      });
    }, { rootMargin: '-24% 0px -62% 0px', threshold: 0 });
    sections.forEach(section => activeObserver.observe(section));
  }
  $$('img').forEach(image => {
    if (!image.hasAttribute('decoding')) image.decoding = 'async';
    if (!image.closest('.spotlight') && !image.hasAttribute('loading')) image.loading = 'lazy';
  });
})();
