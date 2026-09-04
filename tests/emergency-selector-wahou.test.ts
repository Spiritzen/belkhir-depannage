import { describe, expect, it, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import IndexPage from '../src/pages/index.astro';
import { urgencyTypes } from '../src/data/landing';

// Tests couvrant la section 19 du prompt de la refonte « wahou » de
// EmergencySelector (PROMPT_CLAUDE_CODE_SECTION_QUELLE_EST_VOTRE_URGENCE_
// WAHOU.txt, 01/09/2026).
let pageHtml = '';
let sectionHtml = '';

beforeAll(async () => {
  const container = await AstroContainer.create();
  pageHtml = await container.renderToString(IndexPage, {
    request: new Request('http://localhost/'),
  });
  const match = pageHtml.match(/<section class="emergency-selector"[\s\S]*?<\/section>/);
  sectionHtml = match?.[0] ?? '';
}, 30000);

describe('refonte « wahou » — EmergencySelector', () => {
  it('1. the H2 exists exactly once', () => {
    const matches = sectionHtml.match(/<h2[\s>]/g) ?? [];
    expect(matches).toHaveLength(1);
  });

  it('2. the reconstructed text is exactly "Quelle est votre urgence ?"', () => {
    const h2Match = sectionHtml.match(/<h2 id="emergency-selector-title"[^>]*>([\s\S]*?)<\/h2>/);
    expect(h2Match).not.toBeNull();
    const visibleText = (h2Match?.[1] ?? '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    expect(visibleText).toBe('Quelle est votre urgence ?');
  });

  it('3. the word "urgence" carries the orange accent class', () => {
    expect(sectionHtml).toMatch(/<span class="emergency-selector__accent"[^>]*>urgence<\/span>/);
  });

  it('4. the old generic description no longer exists', () => {
    expect(pageHtml).not.toContain(
      'Choisissez votre situation : nous vous indiquons un conseil immédiat et la ligne à appeler.',
    );
  });

  it('5. the new exact description is present', () => {
    const expected =
      'Une fuite qui s’étend, un chauffage qui s’arrête, une porte bloquée ou une vitre brisée ' +
      'ne laissent pas toujours le temps de chercher. Choisissez la situation qui vous concerne : ' +
      'derrière chaque carte, vous découvrirez les premiers gestes pour protéger les personnes, ' +
      'limiter les dégâts sans vous exposer, savoir ce qu’il ne faut surtout pas faire et préparer ' +
      'les informations utiles avant de contacter le service adapté.';
    const leadMatch = sectionHtml.match(/<p class="emergency-selector__lead"[^>]*>([\s\S]*?)<\/p>/);
    expect(leadMatch).not.toBeNull();
    const visibleText = (leadMatch?.[1] ?? '').replace(/\s+/g, ' ').trim();
    expect(visibleText).toBe(expected);
  });

  it('6. the "VOTRE SÉCURITÉ D’ABORD" eyebrow is present', () => {
    expect(sectionHtml).toContain('VOTRE SÉCURITÉ D’ABORD');
  });

  it('7. six cards are rendered (five links, one non-interactive since FinalCta removal)', () => {
    const matches = sectionHtml.match(/class="emergency-card(?: emergency-card--static)?"/g) ?? [];
    expect(matches).toHaveLength(6);
  });

  it('8. the six titles are present', () => {
    for (const label of [
      'Fuite d’eau',
      'Chauffage en panne',
      'Porte bloquée',
      'Vitre cassée',
      'Rideau métallique bloqué',
      'Autre urgence',
    ]) {
      expect(sectionHtml).toContain(label);
    }
  });

  it('9. six distinct local images are used', () => {
    const srcMatches = Array.from(
      sectionHtml.matchAll(/class="emergency-card__img"[^>]*src="([^"]+)"/g),
    );
    // L'attribut src peut précéder ou suivre class selon le rendu Astro ;
    // on retombe sur une recherche générale des variantes générées si besoin.
    const srcs =
      srcMatches.length > 0
        ? srcMatches.map((m) => m[1])
        : Array.from(sectionHtml.matchAll(/<img[^>]*class="emergency-card__img"[^>]*>/g)).map(
            (m) => m[0].match(/src="([^"]+)"/)?.[1] ?? '',
          );
    expect(srcs).toHaveLength(6);
    expect(new Set(srcs).size).toBe(6);
  });

  it('10. each image originates from src/assets/legacy/urgences (via the optimized /_astro/ build output)', () => {
    const imgTags = Array.from(sectionHtml.matchAll(/<img[^>]*class="emergency-card__img"[^>]*>/g));
    expect(imgTags).toHaveLength(6);
    const expectedStems = [
      'fuite-eau',
      'chauffage-en-panne',
      'porte-bloquee',
      'vitre-cassee',
      'rideau-metallique-bloque',
      'autre-urgence',
    ];
    for (const stem of expectedStems) {
      expect(sectionHtml).toMatch(new RegExp(`src="[^"]*${stem}[^"]*"`));
    }
  });

  it('11. each image has a non-empty alt attribute', () => {
    const imgTags = Array.from(sectionHtml.matchAll(/<img[^>]*class="emergency-card__img"[^>]*>/g));
    expect(imgTags).toHaveLength(6);
    for (const tag of imgTags) {
      const altMatch = tag[0].match(/alt="([^"]*)"/);
      expect(altMatch).not.toBeNull();
      expect((altMatch?.[1] ?? '').length).toBeGreaterThan(10);
    }
  });

  it('12. "Voir la solution" no longer exists in this section', () => {
    expect(sectionHtml).not.toContain('Voir la solution');
  });

  it('13. "Que faire maintenant ?" appears exactly five times (absent from the non-clickable "Autre urgence" card since FinalCta removal)', () => {
    const matches = sectionHtml.match(/Que faire maintenant\s*\?/g) ?? [];
    expect(matches).toHaveLength(5);
  });

  it('14. the five real cards have a valid, non-empty href; "Autre urgence" has none (no dead #contact link)', () => {
    const hrefs = Array.from(sectionHtml.matchAll(/href="([^"]+)" class="emergency-card"/g)).map(
      (m) => m[1],
    );
    expect(hrefs).toHaveLength(5);
    for (const href of hrefs) {
      expect(href.length).toBeGreaterThan(1);
      expect(href).not.toBe('#contact');
    }
    // La carte « Autre urgence » est un <div> non cliquable, jamais un lien mort.
    expect(sectionHtml).toMatch(/<div class="emergency-card emergency-card--static"/);
    expect(sectionHtml).not.toContain('href="#contact"');
  });

  it('15. no card uses href="#"', () => {
    expect(sectionHtml).not.toContain('href="#" class="emergency-card"');
  });

  it('16. no destination deliberately produces a 404 (in-page anchors resolve; the plomberie/chauffage/serrurerie links are real pages)', () => {
    const hrefs = Array.from(sectionHtml.matchAll(/href="([^"]+)" class="emergency-card"/g)).map(
      (m) => m[1],
    );
    expect(hrefs).toHaveLength(5);

    // Micro-sprint « accès à la page /plomberie/ » (03/09/2026, prompt
    // « ACCÈS À LA PAGE DEPUIS LA LANDING PAGE ») : « Fuite d'eau » pointe
    // désormais vers la page dédiée réelle plutôt qu'une ancre interne.
    // Affiné au micro-sprint 2 (04/09/2026) : la section « premiers gestes »
    // de la page plomberie existe désormais réellement
    // (id="urgences-plomberie"), directement ciblée plutôt que le haut de
    // la page. Page chauffage (04/09/2026, PROMPT_CLAUDE_CODE_PAGE_
    // CHAUFFAGE_PATTERN_COMPLET.txt) : même traitement pour « Chauffage en
    // panne » vers /chauffage/#urgences-chauffage. Page serrurerie (même
    // jour, PROMPT_CLAUDE_CODE_PAGE_SERRURERIE_PATTERN_COMPLET.txt) : même
    // traitement pour « Porte bloquée » vers /serrurerie/#urgences-serrurerie.
    // Page vitrerie (même jour, PROMPT_CLAUDE_CODE_PAGE_VITRERIE_PATTERN_
    // COMPLET.txt) : même traitement pour « Vitre cassée » vers
    // /vitrerie/#urgences-vitrerie. Page rideaux métalliques (même jour,
    // PROMPT_CLAUDE_CODE_PAGE_RIDEAUX_METALLIQUES_PATTERN_COMPLET.txt) :
    // même traitement pour « Rideau métallique bloqué » vers
    // /rideaux-metalliques/#urgences-rideaux-metalliques. Les cinq cartes
    // métier réelles pointent désormais toutes vers une page dédiée
    // (« Autre urgence » reste un <div> statique, hors de ce tableau).
    const realPageHrefs = hrefs.filter(
      (href) =>
        href.endsWith('/plomberie/#urgences-plomberie') ||
        href.endsWith('/chauffage/#urgences-chauffage') ||
        href.endsWith('/serrurerie/#urgences-serrurerie') ||
        href.endsWith('/vitrerie/#urgences-vitrerie') ||
        href.endsWith('/rideaux-metalliques/#urgences-rideaux-metalliques'),
    );
    expect(realPageHrefs).toHaveLength(5);

    const anchorHrefs = hrefs.filter((href) => !realPageHrefs.includes(href));
    expect(anchorHrefs).toHaveLength(0);
  });

  it('17. no invented phone number appears in this section', () => {
    expect(sectionHtml).not.toMatch(/0[1-9](?:[\s.-]?\d{2}){4}/);
    expect(sectionHtml).not.toContain('tel:');
  });

  it('18. no empty route was created under /urgences/ (future routes are centralized as data only, never rendered as a page or a live href)', () => {
    expect(sectionHtml).not.toMatch(/href="\/urgences\//);
    for (const urgency of urgencyTypes) {
      expect(urgency.futureRoute).toMatch(/^\/urgences\//);
    }
  });

  it('19. the section follows the Hero directly in the landing assembly', () => {
    const heroEnd = pageHtml.indexOf('id="accueil"');
    expect(heroEnd).toBeGreaterThan(-1);
    const heroSectionEnd = pageHtml.indexOf('</section>', heroEnd) + '</section>'.length;
    // Mini-sprint 3 (02/09/2026) : Hero.astro porte désormais un <script>
    // de composant (ruban horizontal des métiers) rendu inline juste après
    // </section> — Astro ne le hoiste pas dans <head>. On l'ignore ici sans
    // affaiblir l'intention réelle du test : aucune AUTRE section ne doit
    // être intercalée avant emergency-selector.
    const remainder = pageHtml
      .slice(heroSectionEnd)
      .trimStart()
      .replace(/^<script[^>]*>[\s\S]*?<\/script>\s*/, '');
    expect(remainder.startsWith('<section class="emergency-selector"')).toBe(true);
  });

  it('20. QuickAnswers remains absent', () => {
    expect(pageHtml).not.toContain('class="quick-answers');
  });

  it('21. the other landing components remain present', () => {
    // La bande TrustGoogle (entre EmergencySelector et ServicesAccordion) a
    // été supprimée par une micro-retouche ultérieure (01/09/2026) — sa
    // vérification est retirée d'ici, plus jamais présente sur la page.
    // FinalCta (id="contact") a été supprimée par une micro-retouche
    // ultérieure (01/09/2026) — plus jamais présente sur la page (voir
    // tests/final-cta-removal.test.ts).
    expect(pageHtml).toContain('id="metiers"');
    expect(pageHtml).not.toContain('id="contact"');
    expect(pageHtml).toContain('APPEL STANDARD');
    expect(pageHtml).toContain('APPEL URGENCE');
  });
});
