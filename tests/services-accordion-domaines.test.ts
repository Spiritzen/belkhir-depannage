import { describe, expect, it, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import IndexPage from '../src/pages/index.astro';
import { services } from '../src/data/landing';

// Tests couvrant la refonte « Nos domaines d'intervention » de
// ServicesAccordion.astro (01/09/2026, instruction directe).
let pageHtml = '';
let sectionHtml = '';

beforeAll(async () => {
  const container = await AstroContainer.create();
  pageHtml = await container.renderToString(IndexPage, {
    request: new Request('http://localhost/'),
  });
  const match = pageHtml.match(/<section class="services-accordion"[\s\S]*?<\/section>/);
  sectionHtml = match?.[0] ?? '';
}, 30000);

describe('refonte « Nos domaines d’intervention »', () => {
  it('1. the H2 exists exactly once and its reconstructed text is exactly the validated wording', () => {
    const matches = sectionHtml.match(/<h2[\s>]/g) ?? [];
    expect(matches).toHaveLength(1);
    const h2Match = sectionHtml.match(/<h2 id="services-accordion-title"[^>]*>([\s\S]*?)<\/h2>/);
    expect(h2Match).not.toBeNull();
    const visibleText = (h2Match?.[1] ?? '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    expect(visibleText).toBe('Un seul contact pour plusieurs urgences');
  });

  it('2. "urgences" carries the orange accent class', () => {
    expect(sectionHtml).toMatch(/<span class="services-accordion__accent"[^>]*>urgences<\/span>/);
  });

  it('3. the "NOS DOMAINES D’INTERVENTION" eyebrow is present', () => {
    expect(sectionHtml).toContain('NOS DOMAINES D’INTERVENTION');
  });

  it('4. the old short description no longer exists', () => {
    expect(sectionHtml).not.toContain('Survolez, touchez ou naviguez au clavier');
  });

  it('5. the new rich description is present, with only B and D of "Belkhir Dépannage" colored', () => {
    expect(sectionHtml).toMatch(
      /<span class="services-accordion__brand-initial"[^>]*>B<\/span>elkhir/,
    );
    expect(sectionHtml).toMatch(
      /<span class="services-accordion__brand-initial"[^>]*>D<\/span>épannage/,
    );
    // Le texte lu par un lecteur d'écran (balises retirées) doit rester
    // "Belkhir Dépannage" en continu, jamais "B elkhir D épannage" ni un nom
    // tronqué.
    const leadMatch = sectionHtml.match(/<p class="services-accordion__lead"[^>]*>([\s\S]*?)<\/p>/);
    expect(leadMatch).not.toBeNull();
    const visibleText = (leadMatch?.[1] ?? '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    expect(visibleText).toContain('Belkhir Dépannage');
    expect(visibleText).toContain('diagnostiquer la situation, sécuriser les lieux');
    expect(visibleText).toContain('découvrez nos domaines d’intervention');
  });

  it('6. exactly six cards are rendered, one per domain, in the required order', () => {
    const titleMatches = Array.from(
      sectionHtml.matchAll(/<span class="service-card__title"[^>]*>([^<]+)<\/span>/g),
    ).map((m) => m[1]);
    expect(titleMatches).toEqual([
      'Plomberie',
      'Fuites et anomalies',
      'Chauffage',
      'Serrurerie',
      'Vitrerie',
      'Rideaux métalliques',
    ]);
  });

  it('7. all six cards are now real links to dedicated pages (accès pages métiers)', () => {
    // Historique : d'abord des <button> (panneau en place), puis de vrais
    // liens <a href="#contact">. FinalCta a depuis été supprimée et, tant
    // qu'aucune page métier dédiée n'existait, les six cartes n'étaient plus
    // des liens. La page /plomberie/ existe depuis le micro-sprint « accès à
    // la page /plomberie/ » (03/09/2026) : Plomberie et Fuites et anomalies
    // redeviennent de vrais liens vers elle. Les pages /chauffage/ puis
    // /serrurerie/ puis /vitrerie/ puis /rideaux-metalliques/ existent
    // depuis le 04/09/2026 : elles rejoignent ce groupe — plus aucune carte
    // n'est un <article> non interactif.
    const articles = Array.from(
      sectionHtml.matchAll(/<article id="(service-[^"]+)" class="service-card"/g),
    );
    expect(articles).toHaveLength(0);

    const links = Array.from(
      sectionHtml.matchAll(/<a id="(service-[^"]+)" href="([^"]+)" class="service-card"/g),
    );
    expect(links).toHaveLength(6);
    expect(links.map((m) => m[1])).toEqual([
      'service-plomberie',
      'service-fuites-anomalies',
      'service-chauffage',
      'service-serrurerie',
      'service-vitrerie',
      'service-rideaux-metalliques',
    ]);
    // Affiné au micro-sprint 2 (04/09/2026) : « Plomberie »/« Chauffage »/
    // « Serrurerie »/« Vitrerie »/« Rideaux métalliques » pointent vers le
    // haut de leur page dédiée, « Fuites et anomalies » vers sa section
    // « premiers gestes » réelle (id="urgences-plomberie").
    const hrefById = Object.fromEntries(links.map(([, id, href]) => [id, href]));
    expect(hrefById['service-plomberie']).toMatch(/\/plomberie\/$/);
    expect(hrefById['service-chauffage']).toMatch(/\/chauffage\/$/);
    expect(hrefById['service-serrurerie']).toMatch(/\/serrurerie\/$/);
    expect(hrefById['service-vitrerie']).toMatch(/\/vitrerie\/$/);
    expect(hrefById['service-rideaux-metalliques']).toMatch(/\/rideaux-metalliques\/$/);
    expect(hrefById['service-fuites-anomalies']).toMatch(/\/plomberie\/#urgences-plomberie$/);

    expect(sectionHtml).not.toContain('accordion-panel__trigger');
    expect(sectionHtml).not.toMatch(/<button[^>]*data-service-panel/);
  });

  it('8. no card produces a dead #contact link or a fake href ("#")', () => {
    expect(sectionHtml).not.toContain('href="#contact"');
    expect(sectionHtml).not.toContain('href="#"');
  });

  it('9. each card keeps its stable anchor id (Hero and EmergencySelector links still resolve)', () => {
    for (const anchor of [
      'service-plomberie',
      'service-fuites-anomalies',
      'service-chauffage',
      'service-serrurerie',
      'service-vitrerie',
      'service-rideaux-metalliques',
    ]) {
      expect(sectionHtml).toContain(`id="${anchor}"`);
    }
  });

  it('10. six distinct local images are used, each with a non-empty alt', () => {
    const imgTags = Array.from(sectionHtml.matchAll(/<img[^>]*class="service-card__img"[^>]*>/g));
    expect(imgTags).toHaveLength(6);
    const srcs = imgTags.map((tag) => tag[0].match(/src="([^"]+)"/)?.[1] ?? '');
    expect(new Set(srcs).size).toBe(6);
    for (const tag of imgTags) {
      const altMatch = tag[0].match(/alt="([^"]*)"/);
      expect(altMatch).not.toBeNull();
      expect((altMatch?.[1] ?? '').length).toBeGreaterThan(10);
    }
  });

  it('11. never reuses the same image twice, and reuses only genuinely local, already-present media', () => {
    for (const stem of [
      'accordeon-plomberie',
      'technicien-intervention-2',
      'accordeon-chauffage',
      'accordeon-serrurerie',
      'accordeon-vitrerie',
      'rideau-metallique-bloque',
    ]) {
      expect(sectionHtml).toMatch(new RegExp(`src="[^"]*${stem}[^"]*"`));
    }
  });

  it('12. "Découvrir ce service" and "Voir la solution" are both gone (no CTA implying a dead destination)', () => {
    // Retiré avec le passage des cartes en <article> non cliquables
    // (micro-retouche suppression FinalCta, 01/09/2026) : le titre et la
    // description révélée au survol restent la seule promesse faite.
    expect(sectionHtml).not.toContain('Découvrir ce service');
    expect(sectionHtml).not.toContain('Voir la solution');
    expect(sectionHtml).not.toContain('service-card__cta');
  });

  it('13. no invented delay, certification, guarantee or absolute result wording appears', () => {
    for (const forbidden of [
      'garanti',
      'certifi',
      'agréé',
      'en moins d’une heure',
      '24h/24',
      '7j/7',
    ]) {
      expect(sectionHtml.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });

  it('14. future dedicated routes are centralized in data but never exposed as a live href (no dead /services/ link)', () => {
    expect(sectionHtml).not.toMatch(/href="\/services\//);
    for (const service of services) {
      expect(service.futureRoute).toMatch(/^\/services\//);
    }
  });

  it('15. no phone number and no PhoneCta component appear in this section', () => {
    expect(sectionHtml).not.toMatch(/0[1-9](?:[\s.-]?\d{2}){4}/);
    expect(sectionHtml).not.toMatch(/class="phone-cta/);
  });

  it('16. the section keeps its stable id="metiers" (navLinks and other anchors still resolve)', () => {
    expect(sectionHtml).toContain('id="metiers"');
  });

  it('17. QuickAnswers and TrustGoogle remain absent (no regression from earlier removals)', () => {
    expect(pageHtml).not.toContain('class="quick-answers');
    expect(pageHtml).not.toContain('class="trust-google"');
  });

  it('18. the hero, navbar and emergency selector remain present and unmodified in structure', () => {
    expect(pageHtml).toContain('id="accueil"');
    expect(pageHtml).toContain('id="depannages"');
    expect(pageHtml).toContain('hero__quote-cta');
    expect(pageHtml).toContain('hero__google-proof');
    expect(pageHtml).toContain('APPEL STANDARD');
    expect(pageHtml).toContain('APPEL URGENCE');
  });
});
