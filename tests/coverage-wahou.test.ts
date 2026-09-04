import { describe, expect, it, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import IndexPage from '../src/pages/index.astro';
import { coverageZones } from '../src/data/landing';
import { COVERAGE_MAP_DEPARTMENTS } from '../src/data/coverage-map';

// Tests couvrant la refonte « wahou » de la section Coverage
// (PROMPT_CLAUDE_CODE_COVERAGE_HAUTS_DE_FRANCE_WAHOU.txt, 01/09/2026).
let pageHtml = '';
let sectionHtml = '';
let componentSource = '';

beforeAll(async () => {
  const container = await AstroContainer.create();
  pageHtml = await container.renderToString(IndexPage, {
    request: new Request('http://localhost/'),
  });
  const match = pageHtml.match(/<section class="coverage"[\s\S]*?<\/section>/);
  sectionHtml = match?.[0] ?? '';

  // AstroContainer.renderToString n'inline pas le <style> scoped du
  // composant : les assertions sur la feuille de style/le script lisent
  // directement le fichier source (même convention que
  // tests/navbar-retouche.test.ts et tests/why-us-wahou.test.ts).
  const sourcePath = fileURLToPath(
    new URL('../src/components/landing/Coverage.astro', import.meta.url),
  );
  componentSource = readFileSync(sourcePath, 'utf-8');
}, 30000);

describe('refonte « wahou » — Couverture Hauts-de-France', () => {
  it('1. the section still exists exactly once, with the new eyebrow', () => {
    const sections = pageHtml.match(/<section class="coverage"/g) ?? [];
    expect(sections).toHaveLength(1);
    expect(sectionHtml).toContain('ZONE D’INTERVENTION');
  });

  it('2. the H2 is exact, with "Hauts-de-France" isolated in its own accent span', () => {
    const h2Match = sectionHtml.match(/<h2 id="coverage-title"[^>]*>([\s\S]*?)<\/h2>/);
    expect(h2Match).not.toBeNull();
    const visibleText = (h2Match?.[1] ?? '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    expect(visibleText).toBe('Une équipe mobile dans les Hauts-de-France');
    expect(sectionHtml).toMatch(/<span class="coverage__accent"[^>]*>Hauts-de-France<\/span>/);
  });

  it('3. the narration is present with the exact validated text and only B/D of "Belkhir Dépannage" colored', () => {
    const narrationMatch = sectionHtml.match(/<p class="coverage__narration"[^>]*>([\s\S]*?)<\/p>/);
    expect(narrationMatch).not.toBeNull();
    const visibleText = (narrationMatch?.[1] ?? '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    expect(visibleText).toBe(
      'Belkhir Dépannage organise ses déplacements dans les cinq départements des ' +
        'Hauts-de-France. Indiquez-nous votre commune et la nature du problème : l’équipe vérifie ' +
        'avec vous la disponibilité dans votre secteur et la réponse pouvant être apportée à votre ' +
        'situation.',
    );
    expect(sectionHtml).toMatch(/<span class="coverage__brand-initial"[^>]*>B<\/span>elkhir/);
    expect(sectionHtml).toMatch(/<span class="coverage__brand-initial"[^>]*>D<\/span>épannage/);
  });

  it('4. the five departments and their codes are exactly the validated ones, in the validated order', () => {
    expect(coverageZones.map((z) => `${z.name} — ${z.code}`)).toEqual([
      'Somme — 80',
      'Nord — 59',
      'Pas-de-Calais — 62',
      'Oise — 60',
      'Aisne — 02',
    ]);
  });

  it('5. a recognizable regional SVG map is present, with five distinct department shapes and no leftover beige blob', () => {
    expect(sectionHtml).toContain('class="coverage-map"');
    expect(sectionHtml).toContain('coverage-map__outline');
    const deptPaths = sectionHtml.match(/class="coverage-map__dept"/g) ?? [];
    expect(deptPaths).toHaveLength(5);
    // L'ancienne silhouette abstraite utilisait ce remplissage orange pâle ;
    // la nouvelle carte ne doit plus jamais l'employer.
    expect(componentSource).not.toContain('var(--color-orange-100)');
    // Chaque département dispose bien d'un chemin dédié dans les données.
    expect(Object.keys(COVERAGE_MAP_DEPARTMENTS).sort()).toEqual(
      ['02', '59', '60', '62', '80'].sort(),
    );
  });

  it('6. the SVG is fully decorative for assistive technology (the badge list is the accessible source)', () => {
    expect(sectionHtml).toMatch(/<svg class="coverage-map"[^>]*aria-hidden="true"/);
  });

  it('7. the badges are real interactive controls (never fake links), synchronized with the map via a shared department code', () => {
    const badgeButtons = sectionHtml.match(/class="coverage__dept-badge"/g) ?? [];
    expect(badgeButtons).toHaveLength(5);
    for (const zone of coverageZones) {
      expect(sectionHtml).toMatch(
        new RegExp(
          `<button type="button" class="coverage__dept-badge" data-department="${zone.code}"`,
        ),
      );
      expect(sectionHtml).toContain(`data-department="${zone.code}"`);
    }
    // Aucun lien de département (aucune page métier créée dans ce sprint).
    expect(sectionHtml).not.toMatch(/coverage__dept-badge"[^>]*href=/);
  });

  it('8. no passive duplication remains: the list is the single interactive textual source (no redundant static third list)', () => {
    expect(sectionHtml).not.toContain('coverage__zone-list');
  });

  it('9. the CTA reads exactly "Vérifier mon secteur", with no hardcoded phone number and no truncation risk', () => {
    expect(sectionHtml).toContain('Vérifier mon secteur');
    // Ni numéro français en dur, ni troncature par ellipsis dans le composant.
    expect(sectionHtml).not.toMatch(/0[1-9](?:[\s.-]?\d{2}){4}/);
    expect(componentSource).not.toContain('text-overflow: ellipsis');
    // CORRECTION (PAGE ZONES D'INTERVENTION, 04/09/2026) : le CTA n'est
    // plus un CTA téléphonique (voir test 10 ci-dessous) — plus aucun
    // `data-phone-role` dans cette section.
    const phoneRoleAttrs = sectionHtml.match(/data-phone-role=/g) ?? [];
    expect(phoneRoleAttrs).toHaveLength(0);
  });

  // CORRECTION (PAGE ZONES D'INTERVENTION, 04/09/2026,
  // PROMPT_CLAUDE_CODE_PAGE_ZONES_INTERVENTION_RADAR.txt, section 12) : le
  // CTA « Vérifier mon secteur » ne déclenche plus un appel téléphonique
  // (jamais désactivé, jamais dépendant du numéro standard) — il pointe
  // vers la page dédiée réelle /zones-intervention/, toujours active.
  it('10. the CTA is a real, always-enabled link to the dedicated /zones-intervention/ page, never a phone CTA', () => {
    const ctaMatch = sectionHtml.match(/<(a|button)[^>]*class="coverage__cta"[^>]*>/);
    expect(ctaMatch).not.toBeNull();
    expect(ctaMatch?.[1]).toBe('a');
    expect(ctaMatch?.[0]).toContain('href="');
    expect(ctaMatch?.[0]).not.toContain('disabled');
    expect(ctaMatch?.[0]).not.toMatch(/href="tel:/);
    expect(ctaMatch?.[0]).toMatch(/href="[^"]*zones-intervention\/"/);
  });

  it('11. the availability precision uses the exact validated wording', () => {
    expect(sectionHtml).toContain(
      'La disponibilité et le délai d’intervention varient selon la commune, la nature de l’urgence, les',
    );
    expect(sectionHtml).toContain(
      'conditions de déplacement et la disponibilité de l’équipe au moment de l’appel.',
    );
  });

  it('12. none of the forbidden commercial or geographic claims appear anywhere in the section', () => {
    const lower = sectionHtml.toLowerCase();
    for (const forbidden of [
      'dans l’heure',
      'moins d’une heure',
      'garanti',
      'certifi',
      'devis gratuit',
      'flotte',
      'temps réel',
    ]) {
      expect(lower).not.toContain(forbidden.toLowerCase());
    }
    expect(sectionHtml).not.toContain('Fouad');
  });

  it('13. a reset-on-full-exit and replay-on-return mechanism is present via a single local IntersectionObserver', () => {
    const observerMatches = componentSource.match(/new IntersectionObserver/g) ?? [];
    expect(observerMatches).toHaveLength(1);
    expect(componentSource).toContain('function resetSequence');
    expect(componentSource).toContain('function playSequence');
    expect(componentSource).toContain('entry.isIntersecting');
    expect(componentSource).toContain('clearTimeout');
  });

  it('14. prefers-reduced-motion is handled both in the script (never arms) and in CSS (safety net)', () => {
    expect(componentSource).toContain("matchMedia('(prefers-reduced-motion: reduce)')");
    expect(componentSource).toContain('!REDUCED_MOTION');
    expect(componentSource).toMatch(/@media \(prefers-reduced-motion: reduce\) {/);
  });

  it('15. no new runtime dependency is introduced (native SVG/CSS + IntersectionObserver + timers only)', () => {
    expect(componentSource).not.toMatch(
      /from ['"](leaflet|mapbox|d3|d3-geo|topojson|gsap|framer-motion)['"]/,
    );
    expect(componentSource).toContain('IntersectionObserver');
  });

  it('16. sections out of scope are untouched (no regression)', () => {
    expect(pageHtml).toContain('id="accueil"');
    expect(pageHtml).toContain('id="depannages"');
    expect(pageHtml).toContain('id="metiers"');
    expect(pageHtml).toContain('id="interventions"');
    expect(pageHtml).toContain('id="avis"');
    expect(pageHtml).toContain('id="faq"');
    expect(pageHtml).toContain('id="zones-couvertes"');
    expect(pageHtml).not.toContain('class="availability-block');
  });

  it('17. the van illustration reuses the existing local asset (no new image generated) with a decorative empty alt', () => {
    expect(componentSource).toContain(
      "import vanImg from '../../assets/legacy/illustration-equipe.png'",
    );
    const vanImgMatch = sectionHtml.match(/<img[^>]*class="coverage__van"[^>]*>/);
    expect(vanImgMatch).not.toBeNull();
    // Astro rend un `alt=""` vide comme l'attribut booléen nu `alt` dans le HTML final.
    expect(vanImgMatch?.[0]).toMatch(/\balt(="")?[\s>]/);
  });
});
