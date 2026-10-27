import { describe, expect, it, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import IndexPage from '../src/pages/index.astro';
import { whyUsValues, whyUsStats } from '../src/data/landing';

// Tests couvrant le micro-sprint « animations/compteurs » de la section
// « Pourquoi choisir Belkhir Dépannage ? »
// (PROMPT_CLAUDE_CODE_POURQUOI_CHOISIR_ANIMATIONS_COMPTEURS.txt, 01/09/2026).
let pageHtml = '';
let sectionHtml = '';
let componentSource = '';

beforeAll(async () => {
  const container = await AstroContainer.create();
  pageHtml = await container.renderToString(IndexPage, {
    request: new Request('http://localhost/'),
  });
  const match = pageHtml.match(/<section class="why-us"[\s\S]*?<\/section>/);
  sectionHtml = match?.[0] ?? '';

  // AstroContainer.renderToString n'inline pas le <style> scoped du
  // composant dans le HTML rendu (vérifié avant d'écrire ce test) : les
  // assertions portant sur la feuille de style lisent donc directement le
  // fichier source, comme dans tests/navbar-retouche.test.ts.
  const sourcePath = fileURLToPath(
    new URL('../src/components/landing/WhyUs.astro', import.meta.url),
  );
  componentSource = readFileSync(sourcePath, 'utf-8');
}, 30000);

describe('micro-sprint « animations/compteurs » — Pourquoi choisir Belkhir Dépannage ?', () => {
  it('1. the section still exists exactly once with its original title', () => {
    const sections = pageHtml.match(/<section class="why-us"/g) ?? [];
    expect(sections).toHaveLength(1);
    // Le titre est découpé en spans pour les initiales de marque (B / D) :
    // on compare le texte visible, balisage retiré.
    const h2 = sectionHtml.match(/<h2 id="why-us-title"[^>]*>([\s\S]*?)<\/h2>/)?.[1] ?? '';
    expect(h2.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()).toBe(
      'Pourquoi choisir Belkhir Dépannage ?',
    );
  });

  it('2. the section reuses the exact apricot background of "Votre sécurité d’abord"', () => {
    const bgRuleMatch = componentSource.match(/\.why-us\s*{[^}]*}/);
    expect(bgRuleMatch).not.toBeNull();
    expect(bgRuleMatch?.[0]).toContain(
      'radial-gradient(circle at 20% 0%, rgba(255, 105, 0, 0.1), transparent 34%), #fff7f0',
    );
  });

  it('3. the photograph is preserved (same legacy asset, no new/generated image)', () => {
    expect(componentSource).toContain(
      "import whyUsImg from '../../assets/legacy/technicien-intervention-1.jpg'",
    );
    expect(sectionHtml).toContain('why-us__img');
  });

  it('4. exactly three statistic blocks are rendered, directly under the photograph', () => {
    const statMatches = sectionHtml.match(/class="why-us__stat"/g) ?? [];
    expect(statMatches).toHaveLength(3);
    // Le conteneur des statistiques est un enfant du même conteneur que la
    // photo (.why-us__left), jamais une colonne indépendante.
    expect(sectionHtml).toMatch(/why-us__left[\s\S]*why-us__media[\s\S]*why-us__stats/);
  });

  it('5. the three final values, labels and suffixes are exactly the validated ones', () => {
    expect(whyUsStats.map((s) => s.target)).toEqual([20, 500, 98]);
    // Espace insécable (U+00A0) avant le signe « % », convention typographique française.
    expect(whyUsStats.map((s) => s.suffix)).toEqual(['+', '+', ' %']);
    expect(whyUsStats.map((s) => s.label)).toEqual([
      'Années d’expérience métier',
      'Interventions réalisées',
      'Clients satisfaits',
    ]);

    // Les valeurs finales sont bien présentes dans le HTML statique (aucun
    // contenu cité en l'absence de JavaScript).
    expect(sectionHtml).toMatch(/data-why-us-counter="20"[^>]*>\s*20\s*</);
    expect(sectionHtml).toMatch(/data-why-us-counter="500"[^>]*>\s*500\s*</);
    expect(sectionHtml).toMatch(/data-why-us-counter="98"[^>]*>\s*98\s*</);
  });

  it('6. the numeric targets and suffixes are centralized in landing.ts, not hardcoded three times', () => {
    expect(whyUsStats).toHaveLength(3);
    for (const stat of whyUsStats) {
      expect(typeof stat.target).toBe('number');
      expect(Number.isInteger(stat.target)).toBe(true);
      expect(stat.suffix.length).toBeGreaterThan(0);
    }
    // Le composant importe bien le tableau centralisé plutôt que de recréer
    // trois blocs indépendants copiés-collés.
    expect(componentSource).toContain('whyUsStats');
    expect(componentSource).toContain('whyUsStats.map(');
  });

  it('7. the six arguments keep their exact order and position (unchanged content)', () => {
    const titleMatches = Array.from(
      sectionHtml.matchAll(/<p class="why-us__item-title"[^>]*>([^<]+)<\/p>/g),
    ).map((m) => m[1]);
    expect(titleMatches).toEqual(whyUsValues.map((v) => v.title));
    expect(titleMatches).toEqual([
      'Réponse 24h/24 et 7j/7',
      'Plusieurs métiers d’urgence',
      'Couverture Hauts-de-France',
      'Explications claires',
      'Intervention orientée résolution',
      'Suivi du besoin',
    ]);
  });

  it('8. an entry mechanism (armed state + is-visible target state) exists for stats and arguments', () => {
    expect(componentSource).toContain('[data-why-us-armed] .why-us__stat {');
    expect(componentSource).toContain('[data-why-us-armed] .why-us__stat.is-visible {');
    expect(componentSource).toContain('[data-why-us-armed] .why-us__item {');
    expect(componentSource).toContain('[data-why-us-armed] .why-us__item.is-visible {');
  });

  it('9. a reset-on-full-exit and replay-on-return mechanism is present via IntersectionObserver', () => {
    expect(componentSource).toContain('new IntersectionObserver');
    expect(componentSource).toContain('threshold: [0, 0.25]');
    expect(componentSource).toContain('function resetSequence');
    expect(componentSource).toContain('function playSequence');
    expect(componentSource).toContain('entry.isIntersecting');
    // Annulation explicite des rAF/timers actifs avant tout rejeu.
    expect(componentSource).toContain('cancelAnimationFrame');
    expect(componentSource).toContain('clearTimeout');
  });

  it('9b. the stats stagger, transition duration and counter duration/easing match the validated speed micro-retouche', () => {
    // Stagger des blocs (et donc des compteurs, sur le même index) porté à
    // 300ms, durée de comptage doublée à 2400ms, easing basculé sur
    // easeOutQuad — micro-retouche vitesse du 01/09/2026.
    expect(componentSource).toContain('const STAT_STAGGER_MS = 300;');
    expect(componentSource).toContain('const COUNTER_DURATION_MS = 2400;');
    expect(componentSource).toContain(
      "import { computeCounterValue } from '../../scripts/why-us-motion';",
    );
    expect(componentSource).not.toContain('easeOutCubic');

    // Transition d'entrée des blocs portée à ~700ms dans le CSS.
    const statRuleMatch = componentSource.match(
      /\.why-us\[data-why-us-armed\] \.why-us__stat \{[^}]*\}/,
    );
    expect(statRuleMatch).not.toBeNull();
    expect(statRuleMatch?.[0]).toContain('opacity 700ms');
    expect(statRuleMatch?.[0]).toContain('transform 700ms');

    // Les animations des six arguments restent inchangées par cette
    // micro-retouche (délai de base, stagger et durée CSS 750ms).
    expect(componentSource).toContain('const ARG_BASE_DELAY_MS = 200;');
    expect(componentSource).toContain('const ARG_STAGGER_MS = 130;');
    const itemRuleMatch = componentSource.match(
      /\.why-us\[data-why-us-armed\] \.why-us__item \{[^}]*\}/,
    );
    expect(itemRuleMatch?.[0]).toContain('750ms');
  });

  it('10. no aria-live is used on the counters (no incremental announcement)', () => {
    expect(sectionHtml).not.toContain('aria-live');
  });

  it('11. each statistic exposes a stable accessible name containing the final value, with the animated number hidden from assistive technology', () => {
    for (const stat of whyUsStats) {
      expect(sectionHtml).toContain(stat.accessibleLabel);
    }
    const valueBlocks =
      sectionHtml.match(/<p class="why-us__stat-value" aria-hidden="true"[^>]*>/g) ?? [];
    expect(valueBlocks).toHaveLength(3);
  });

  it('12. prefers-reduced-motion is handled both in the script (never arms) and in CSS (safety net)', () => {
    expect(componentSource).toContain("matchMedia('(prefers-reduced-motion: reduce)')");
    expect(componentSource).toContain('!REDUCED_MOTION');
    expect(componentSource).toMatch(/@media \(prefers-reduced-motion: reduce\) {/);
  });

  it('13. no new dependency is introduced (native CSS + IntersectionObserver + requestAnimationFrame only)', () => {
    expect(componentSource).not.toMatch(
      /from ['"](gsap|framer-motion|motion|aos|animate\.css)['"]/,
    );
    expect(componentSource).toContain('requestAnimationFrame');
    expect(componentSource).toContain('IntersectionObserver');
  });

  it('14. sections out of scope are untouched (no regression)', () => {
    expect(pageHtml).toContain('id="accueil"');
    expect(pageHtml).toContain('id="depannages"');
    expect(pageHtml).toContain('id="metiers"');
    expect(pageHtml).toContain('id="interventions"');
    expect(pageHtml).toContain('id="avis"');
    expect(pageHtml).toContain('id="faq"');
    // Toujours aucune régression sur les sections déjà supprimées par le passé.
    expect(pageHtml).not.toContain('class="availability-block');
  });

  it('15. the items list still renders exactly six well-formed <li> entries', () => {
    const items = sectionHtml.match(/class="why-us__item fill-hover"/g) ?? [];
    expect(items).toHaveLength(6);
  });
});
