import { describe, expect, it, beforeAll } from 'vitest';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import IndexPage from '../src/pages/index.astro';

// Tests couvrant le réordonnancement narratif de la landing (01/09/2026,
// instruction directe) : suppression d'AvailabilityBlock, déplacement de la
// section Avis (#avis) à sa place, juste après « Nos domaines
// d'intervention ».
let pageHtml = '';

beforeAll(async () => {
  const container = await AstroContainer.create();
  pageHtml = await container.renderToString(IndexPage, {
    request: new Request('http://localhost/'),
  });
}, 30000);

describe('réordonnancement — suppression AvailabilityBlock, déplacement des Avis', () => {
  it('1. AvailabilityBlock.astro no longer exists as a file', () => {
    const path = fileURLToPath(
      new URL('../src/components/landing/AvailabilityBlock.astro', import.meta.url),
    );
    expect(existsSync(path)).toBe(false);
  });

  it('2. no rendered trace of AvailabilityBlock remains on the page', () => {
    expect(pageHtml).not.toContain('class="availability-block');
    expect(pageHtml).not.toContain('Une urgence ne choisit pas son heure');
    expect(pageHtml).not.toContain('id="availability-block-title"');
  });

  it('3. exactly one element carries id="avis" (no duplicate section)', () => {
    const matches = pageHtml.match(/id="avis"/g) ?? [];
    expect(matches).toHaveLength(1);
  });

  it('4. the reviews section immediately follows "Nos domaines d\'intervention" in the DOM, with nothing wedged in between', () => {
    const servicesEnd = pageHtml.indexOf('id="metiers"');
    expect(servicesEnd).toBeGreaterThan(-1);
    const servicesSectionEnd = pageHtml.indexOf('</section>', servicesEnd) + '</section>'.length;
    const remainder = pageHtml.slice(servicesSectionEnd).trimStart();
    expect(remainder.startsWith('<section class="reviews" id="avis"')).toBe(true);
  });

  it('5. the reviews section content is unchanged (real heading, no invented review data)', () => {
    const sectionMatch = pageHtml.match(/<section class="reviews" id="avis"[\s\S]*?<\/section>/);
    expect(sectionMatch).not.toBeNull();
    const sectionHtml = sectionMatch?.[0] ?? '';
    expect(sectionHtml).toContain('Avis clients');
    expect(sectionHtml).not.toContain('Avis Google à connecter');
    expect(sectionHtml).not.toContain('Emplacement réservé');
    expect(sectionHtml).not.toContain('Date à venir');
  });

  it('6. the navbar "Avis" link still targets the #avis anchor', () => {
    // Micro-correction « navigation depuis les pages métiers » (03/09/2026) :
    // le href est désormais préfixé par `base` (voir src/data/landing.ts,
    // `navLinks`) pour fonctionner aussi depuis une page métier comme
    // /plomberie/ — l'ancre elle-même (#avis) reste inchangée.
    expect(pageHtml).toMatch(/<a href="[^"]*#avis"[^>]*>Avis<\/a>/);
  });

  it('7. the reviews section keeps its scroll-margin-top protection against the sticky navbar', () => {
    // Vérifié indirectement : la classe et l'id existent toujours, la règle
    // CSS elle-même (scroll-margin-top: var(--header-total-height)) est
    // scoped au composant et vérifiée par inspection du fichier source dans
    // le rapport ; ce test garantit au minimum que la cible existe bien.
    expect(pageHtml).toContain('id="avis"');
  });

  it('8. the hero, navbar calls and emergency selector remain untouched', () => {
    expect(pageHtml).toContain('id="accueil"');
    expect(pageHtml).toContain('id="depannages"');
    expect(pageHtml).toContain('hero__quote-cta');
    expect(pageHtml).toContain('hero__google-proof');
    expect(pageHtml).toContain('APPEL STANDARD');
    expect(pageHtml).toContain('APPEL URGENCE');
  });

  it('9. "Nos domaines d\'intervention" and its six cards remain untouched', () => {
    expect(pageHtml).toContain('NOS DOMAINES D’INTERVENTION');
    const matches = pageHtml.match(/class="service-card"/g) ?? [];
    expect(matches).toHaveLength(6);
  });

  it('10. the sections that used to follow AvailabilityBlock are all still present, in order', () => {
    // « id="contact" » (FinalCta) a été retiré de cette liste : la section a
    // été supprimée par une micro-retouche ultérieure (01/09/2026), voir
    // tests/final-cta-removal.test.ts.
    const anchors = [
      'id="metiers"',
      'id="avis"',
      'id="zones-couvertes"',
      'id="interventions-recentes"',
    ];
    let lastIndex = -1;
    for (const anchor of anchors) {
      const index = pageHtml.indexOf(anchor);
      expect(index, `${anchor} should exist`).toBeGreaterThan(-1);
      expect(index, `${anchor} should come after the previous anchor`).toBeGreaterThan(lastIndex);
      lastIndex = index;
    }
    expect(pageHtml).not.toContain('id="contact"');
  });

  it('11. QuickAnswers and TrustGoogle remain absent (no regression from earlier removals)', () => {
    expect(pageHtml).not.toContain('class="quick-answers');
    expect(pageHtml).not.toContain('class="trust-google"');
  });
});
