/**
 * Apparitions directionnelles au scroll (fadeInUp / fadeInLeft / fadeInRight
 * / fadeInDown / zoomIn), pilotées par IntersectionObserver — reproduction
 * légère des effets d'apparition de l'ancienne landing (section 22 du
 * prompt de mission).
 *
 * Sans JavaScript, ou si IntersectionObserver n'existe pas, le contenu reste
 * simplement visible (voir `src/styles/animations.css` : l'état caché n'est
 * activé que par la classe `.js-reveal-ready`).
 */

function initReveal(): void {
  const root = document.documentElement;

  if (!('IntersectionObserver' in window)) {
    return;
  }

  const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  if (targets.length === 0) {
    return;
  }

  // Décalage croissant pour une entrée séquentielle des groupes de cartes.
  const groups = new Map<string, number>();
  for (const target of targets) {
    const groupKey = target.dataset.revealGroup ?? 'default';
    const index = groups.get(groupKey) ?? 0;
    target.style.setProperty('--reveal-delay', `${Math.min(index * 90, 450)}ms`);
    groups.set(groupKey, index + 1);
  }

  root.classList.add('js-reveal-ready');

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
  );

  for (const target of targets) {
    observer.observe(target);
  }

  // Filet de sécurité : si l'observateur ne se déclenche pas pour une raison
  // quelconque (page très courte, redimensionnement précoce, outil
  // d'audit...), le contenu ne doit jamais rester invisible indéfiniment.
  window.setTimeout(() => {
    for (const target of targets) {
      target.classList.add('is-visible');
    }
    observer.disconnect();
  }, 3000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initReveal);
} else {
  initReveal();
}
