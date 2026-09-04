import { describe, expect, it, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import PlomberiePage from '../src/pages/plomberie/index.astro';
import IndexPage from '../src/pages/index.astro';
import { googleReviewSummary, coverageZones } from '../src/data/landing';
import { plomberieSafetyTips, plomberieFaqItems } from '../src/data/plomberie';

// Tests ciblés pour le micro-sprint 2 « construction des sections plomberie »
// (PROMPT_CLAUDE_CODE_MICRO_SPRINT_2_CONSTRUCTION_SECTIONS_PLOMBERIE.txt,
// 04/09/2026) : présence des six sections, alternance des fonds, contenu
// exact, FAQ + JSON-LD, et non-régression de la landing (composants rendus
// paramétrables : Process, Reviews, Faq).
let plomberieHtml = '';
let indexHtml = '';

function extractSection(html: string, id: string): string {
  const marker = `id="${id}"`;
  const start = html.indexOf(marker);
  if (start === -1) return '';
  const sectionStart = html.lastIndexOf('<section', start);
  const sectionEnd = html.indexOf('</section>', start) + '</section>'.length;
  return html.slice(sectionStart, sectionEnd);
}

beforeAll(async () => {
  const container = await AstroContainer.create();
  plomberieHtml = await container.renderToString(PlomberiePage, {
    request: new Request('http://localhost/plomberie/'),
  });
  indexHtml = await container.renderToString(IndexPage, {
    request: new Request('http://localhost/'),
  });
}, 30000);

describe('page /plomberie/ — six sections présentes, alternance stricte des fonds', () => {
  const ids = [
    'urgences-plomberie',
    'appel-plomberie',
    'prise-en-charge-plomberie',
    'zone-plomberie',
    'avis-plomberie',
    'faq-plomberie',
  ];

  it('all six sections exist, in this exact order', () => {
    const positions = ids.map((id) => plomberieHtml.indexOf(`id="${id}"`));
    for (const pos of positions) {
      expect(pos).toBeGreaterThan(-1);
    }
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]);
    }
  });

  it('alternates light (abricot) / dark (anthracite) tone starting light after the Hero', () => {
    const urgences = extractSection(plomberieHtml, 'urgences-plomberie');
    const appel = extractSection(plomberieHtml, 'appel-plomberie');
    const priseEnCharge = extractSection(plomberieHtml, 'prise-en-charge-plomberie');
    const zone = extractSection(plomberieHtml, 'zone-plomberie');
    const avis = extractSection(plomberieHtml, 'avis-plomberie');
    const faq = extractSection(plomberieHtml, 'faq-plomberie');

    // Sections claires : jamais le modificateur sombre.
    expect(urgences).not.toContain('safety-tips--dark');
    expect(priseEnCharge).toContain('process--light');
    expect(avis).not.toContain('reviews--dark');

    // Sections sombres : classes de fond anthracite déjà établies sur le
    // site (aucune nouvelle teinte) — vérifiées via les composants dédiés.
    expect(appel).toContain('class="reassurance"');
    expect(zone).toContain('class="coverage-summary"');
    expect(faq).toContain('faq--dark');
  });
});

describe('page /plomberie/ — section 1 : urgences-plomberie (premiers gestes)', () => {
  it('renders the exact eyebrow and H2', () => {
    const section = extractSection(plomberieHtml, 'urgences-plomberie');
    expect(section).toContain('VOTRE SÉCURITÉ D’ABORD');
    expect(section).toContain('Que faire face à une urgence plomberie ?');
  });

  it('renders exactly four safety cards with the four required fields each', () => {
    const section = extractSection(plomberieHtml, 'urgences-plomberie');
    const cards = section.match(/class="safety-tips__card"/g) ?? [];
    expect(cards).toHaveLength(4);
    for (const tip of plomberieSafetyTips) {
      expect(section).toContain(tip.situation);
      expect(section).toContain(tip.advice);
      expect(section).toContain(tip.avoid);
      expect(section).toContain(tip.reassurance);
    }
    const labels = section.match(/Premier geste/g) ?? [];
    const avoidLabels = section.match(/À éviter/g) ?? [];
    expect(labels).toHaveLength(4);
    expect(avoidLabels).toHaveLength(4);
  });

  it('never invents a guaranteed delay, a certification or a fixed price', () => {
    const section = extractSection(plomberieHtml, 'urgences-plomberie');
    for (const forbidden of ['garanti', 'certifi', 'agréé', 'en moins d’une heure']) {
      expect(section.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });
});

describe('page /plomberie/ — section 2 : appel-plomberie (réassurance + CTA)', () => {
  it('renders the exact eyebrow, H2 and three reassurance points', () => {
    const section = extractSection(plomberieHtml, 'appel-plomberie');
    expect(section).toContain('VOUS N’AVEZ PAS BESOIN D’AVOIR LE DIAGNOSTIC');
    expect(section).toContain(
      'Décrivez simplement ce que vous voyez, nous vous aidons à qualifier la situation',
    );
    expect(section).toContain('Un interlocuteur unique');
    expect(section).toContain('Des consignes compréhensibles');
    expect(section).toContain('Une intervention expliquée');
  });

  it('the CTA uses the exact confirmed emergency tel: href, never a placeholder', () => {
    const section = extractSection(plomberieHtml, 'appel-plomberie');
    const match = section.match(/class="reassurance__cta"[^>]*href="([^"]+)"/);
    expect(match).not.toBeNull();
    expect(match?.[1]).toBe('tel:+33649621619');
    expect(section).toContain('Appeler Belkhir Dépannage');
  });

  it('never promises a guaranteed delay or an unconfirmed price', () => {
    const section = extractSection(plomberieHtml, 'appel-plomberie');
    expect(section.toLowerCase()).not.toContain('garanti');
    expect(section).not.toMatch(/\d+\s*€/);
  });
});

describe('page /plomberie/ — section 3 : prise-en-charge-plomberie (Process paramétrable)', () => {
  it('renders the exact eyebrow, H2 (with accent) and four steps', () => {
    const section = extractSection(plomberieHtml, 'prise-en-charge-plomberie');
    expect(section).toContain('UNE PRISE EN CHARGE CLAIRE');
    expect(section).toContain(
      'Comment se déroule un <span class="process__accent">dépannage plomberie</span> ?',
    );
    for (const title of [
      'Votre appel',
      'Les premiers gestes',
      'La recherche de la cause',
      'La solution expliquée',
    ]) {
      expect(section).toContain(title);
    }
  });

  it('uses the light tone and omits the landing lead paragraph and banner', () => {
    const section = extractSection(plomberieHtml, 'prise-en-charge-plomberie');
    expect(section).toContain('process--light');
    expect(section).not.toContain('process__lead');
    expect(section).not.toContain('process__banner');
    // Aucune fuite du texte d'intro de la landing (paragraphe générique
    // "Lorsqu'un problème survient...").
    expect(section).not.toContain('Lorsqu’un problème survient');
  });

  it('exactly four <li class="process__step"> render (same timeline markup as the landing)', () => {
    const section = extractSection(plomberieHtml, 'prise-en-charge-plomberie');
    const steps = section.match(/class="process__step"/g) ?? [];
    expect(steps).toHaveLength(4);
  });
});

describe('page /plomberie/ — section 4 : zone-plomberie (CoverageSummary)', () => {
  it('renders the exact eyebrow, H2 with accent and intro', () => {
    const section = extractSection(plomberieHtml, 'zone-plomberie');
    expect(section).toContain('UNE ÉQUIPE MOBILE');
    expect(section).toContain('Dépannage plomberie dans les');
    expect(section).toMatch(/class="coverage-summary__accent"[^>]*>Hauts-de-France<\/span>/);
  });

  it('reuses the real, centralized department data — same five zones, same order', () => {
    const section = extractSection(plomberieHtml, 'zone-plomberie');
    const badges = Array.from(
      section.matchAll(/class="coverage-summary__zone-code"[^>]*>\(([^)]+)\)/g),
    ).map((m) => m[1]);
    expect(badges).toEqual(coverageZones.map((zone) => zone.code));
    for (const zone of coverageZones) {
      expect(section).toContain(zone.name);
    }
  });

  it('the "Vérifier mon secteur" CTA calls the standard phone line (same behavior as the landing coverage CTA)', () => {
    const section = extractSection(plomberieHtml, 'zone-plomberie');
    expect(section).toContain('Vérifier mon secteur');
    // Le numéro standard reste provisoire dans cette maquette : bouton
    // désactivé, jamais un faux tel:.
    const linkMatch = section.match(/class="coverage-summary__cta"[^>]*href="([^"]+)"/);
    if (linkMatch) {
      expect(linkMatch[1]).toMatch(/^tel:\+/);
    } else {
      expect(section).toMatch(/<button[^>]*class="coverage-summary__cta"[^>]*disabled/);
    }
  });

  it('never claims permanent coverage of every commune', () => {
    const section = extractSection(plomberieHtml, 'zone-plomberie');
    expect(section.toLowerCase()).not.toContain('toujours disponible');
    expect(section.toLowerCase()).not.toContain('couverture totale');
  });
});

describe('page /plomberie/ — section 5 : avis-plomberie (Reviews paramétrable)', () => {
  it('renders the plomberie-specific eyebrow and H2, never the landing defaults duplicated', () => {
    const section = extractSection(plomberieHtml, 'avis-plomberie');
    expect(section).toContain('LA CONFIANCE SE CONSTRUIT SUR LE TERRAIN');
    expect(section).toContain('L’expérience de nos clients');
  });

  it('never fabricates a testimonial, a name or a date — only the honest mock disclosure', () => {
    const section = extractSection(plomberieHtml, 'avis-plomberie');
    expect(section).toContain('Avis Google à connecter');
    expect(section).not.toMatch(/il y a \d+ (jour|semaine|mois)/i);
  });
});

describe('page /plomberie/ — section 6 : faq-plomberie (Faq paramétrable + JSON-LD)', () => {
  it('renders the exact eyebrow, H2 and five questions with real accordion semantics', () => {
    const section = extractSection(plomberieHtml, 'faq-plomberie');
    expect(section).toContain('QUESTIONS FRÉQUENTES');
    expect(section).toContain('Avant d’appeler pour un problème de plomberie');
    for (const item of plomberieFaqItems) {
      expect(section).toContain(item.question);
    }
    expect(section.match(/aria-expanded="false"/g) ?? []).toHaveLength(plomberieFaqItems.length);
    expect(section.match(/role="region"/g) ?? []).toHaveLength(plomberieFaqItems.length);
  });

  it('emits a FAQPage JSON-LD schema fed with exactly the same questions/answers as displayed', () => {
    const ldMatch = plomberieHtml.match(
      /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/,
    );
    expect(ldMatch).not.toBeNull();
    const schema = JSON.parse(ldMatch?.[1] ?? '{}');
    expect(schema['@type']).toBe('FAQPage');
    expect(schema.mainEntity).toHaveLength(plomberieFaqItems.length);
    for (let i = 0; i < plomberieFaqItems.length; i++) {
      expect(schema.mainEntity[i].name).toBe(plomberieFaqItems[i].question);
      expect(schema.mainEntity[i].acceptedAnswer.text).toBe(plomberieFaqItems[i].answer);
    }
  });
});

describe('non-régression — landing (Process, Reviews, Faq rendus paramétrables)', () => {
  it('landing Process section keeps its exact id, heading id and default copy', () => {
    const section = extractSection(indexHtml, 'interventions');
    expect(section).toContain('id="process-title"');
    expect(section).toContain('VOTRE INTERVENTION, ÉTAPE PAR ÉTAPE');
    expect(section).toMatch(
      /Une prise en charge claire, même dans l’<span class="process__accent"[^>]*>urgence<\/span>/,
    );
    expect(section).toContain('process__lead');
    expect(section).toContain('process__banner');
    expect(section).not.toContain('process--light');
  });

  it('landing Reviews section never shows an eyebrow (absent by default)', () => {
    const section = extractSection(indexHtml, 'avis');
    expect(section).not.toContain('reviews__eyebrow');
    expect(section).toContain('Avis clients');
  });

  it('landing Faq section keeps its exact ids and stays light (no dark modifier)', () => {
    const section = extractSection(indexHtml, 'faq');
    expect(section).toContain('id="faq-trigger-0"');
    expect(section).toContain('id="faq-panel-0"');
    expect(section).not.toContain('faq--dark');
    expect(section).not.toContain('faq__eyebrow');
  });

  it('landing still shows exactly one H1 and both navbar phone lines, unaffected', () => {
    const matches = indexHtml.match(/<h1[\s>]/g) ?? [];
    expect(matches).toHaveLength(1);
    expect(indexHtml).toContain('APPEL STANDARD');
    expect(indexHtml).toContain('APPEL URGENCE');
  });

  it('every rating shown on both pages matches the single centralized source (never a second invented value)', () => {
    const expectedRating = googleReviewSummary.rating.toFixed(1).replace('.', ',');
    expect(indexHtml).toContain(`${expectedRating}/5`);
    // Le Hero plomberie (micro-sprint 1, hors périmètre de ce sprint)
    // affiche déjà cette même note ; toute occurrence de ce motif sur la
    // page plomberie doit être exactement cette valeur, jamais une seconde
    // note inventée.
    const ratingsOnPlomberie = plomberieHtml.match(/\d,\d\/5/g) ?? [];
    for (const rating of ratingsOnPlomberie) {
      expect(rating).toBe(`${expectedRating}/5`);
    }
  });
});
