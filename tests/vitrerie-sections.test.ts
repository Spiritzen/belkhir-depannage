import { describe, expect, it, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import VitreriePage from '../src/pages/vitrerie/index.astro';
import SerruriePage from '../src/pages/serrurerie/index.astro';
import ChauffagePage from '../src/pages/chauffage/index.astro';
import PlomberiePage from '../src/pages/plomberie/index.astro';
import IndexPage from '../src/pages/index.astro';
import { googleReviewSummary, coverageZones } from '../src/data/landing';
import {
  vitrerieSafetyTips,
  vitrerieFaqItems,
  vitrerieSafetyAlertContacts,
} from '../src/data/vitrerie';

// Tests ciblés pour /vitrerie/ (PROMPT_CLAUDE_CODE_PAGE_VITRERIE_PATTERN_
// COMPLET.txt, 04/09/2026) : présence des six sections, alternance des
// fonds, encart effraction/danger, FAQ + JSON-LD, et non-régression de
// /plomberie/, /chauffage/, /serrurerie/ et de la landing (composants
// génériques partagés, aucune duplication).
let vitrerieHtml = '';
let serrurerieHtml = '';
let chauffageHtml = '';
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
  vitrerieHtml = await container.renderToString(VitreriePage, {
    request: new Request('http://localhost/vitrerie/'),
  });
  serrurerieHtml = await container.renderToString(SerruriePage, {
    request: new Request('http://localhost/serrurerie/'),
  });
  chauffageHtml = await container.renderToString(ChauffagePage, {
    request: new Request('http://localhost/chauffage/'),
  });
  plomberieHtml = await container.renderToString(PlomberiePage, {
    request: new Request('http://localhost/plomberie/'),
  });
  indexHtml = await container.renderToString(IndexPage, {
    request: new Request('http://localhost/'),
  });
}, 30000);

describe('page /vitrerie/ — six sections présentes, alternance stricte des fonds', () => {
  const ids = [
    'urgences-vitrerie',
    'appel-vitrerie',
    'prise-en-charge-vitrerie',
    'zone-vitrerie',
    'avis-vitrerie',
    'faq-vitrerie',
  ];

  it('all six sections exist, in this exact order', () => {
    const positions = ids.map((id) => vitrerieHtml.indexOf(`id="${id}"`));
    for (const pos of positions) {
      expect(pos).toBeGreaterThan(-1);
    }
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]);
    }
  });

  it('alternates light (abricot) / dark (anthracite) tone starting light after the Hero', () => {
    const urgences = extractSection(vitrerieHtml, 'urgences-vitrerie');
    const priseEnCharge = extractSection(vitrerieHtml, 'prise-en-charge-vitrerie');
    const avis = extractSection(vitrerieHtml, 'avis-vitrerie');
    const appel = extractSection(vitrerieHtml, 'appel-vitrerie');
    const zone = extractSection(vitrerieHtml, 'zone-vitrerie');
    const faq = extractSection(vitrerieHtml, 'faq-vitrerie');

    expect(urgences).not.toContain('safety-tips--dark');
    expect(priseEnCharge).toContain('process--light');
    expect(avis).not.toContain('reviews--dark');

    expect(appel).toContain('class="reassurance"');
    expect(zone).toContain('class="coverage-summary"');
    expect(faq).toContain('faq--dark');
  });
});

describe('page /vitrerie/ — section 1 : urgences-vitrerie (premiers gestes + encart effraction)', () => {
  it('renders the exact eyebrow and H2', () => {
    const section = extractSection(vitrerieHtml, 'urgences-vitrerie');
    expect(section).toContain('VOTRE SÉCURITÉ D’ABORD');
    expect(section).toContain('Que faire face à une vitre cassée ou fissurée ?');
  });

  it('renders exactly four safety cards with the four required fields each', () => {
    const section = extractSection(vitrerieHtml, 'urgences-vitrerie');
    const cards = section.match(/class="safety-tips__card"/g) ?? [];
    expect(cards).toHaveLength(4);
    for (const tip of vitrerieSafetyTips) {
      expect(section).toContain(tip.situation);
      expect(section).toContain(tip.advice);
      expect(section).toContain(tip.avoid);
      expect(section).toContain(tip.reassurance);
    }
  });

  it('never encourages a risky manipulation of broken or damaged glass', () => {
    const section = extractSection(vitrerieHtml, 'urgences-vitrerie').toLowerCase();
    for (const forbidden of ['retirez les éclats', 'cassez le reste', 'forcez le vitrage']) {
      expect(section).not.toContain(forbidden);
    }
  });

  it('renders a distinct, prioritized burglary/danger safety alert with real tel: links', () => {
    const section = extractSection(vitrerieHtml, 'urgences-vitrerie');
    expect(section).toContain('class="safety-alert"');
    expect(section).toContain(
      'Traces d’effraction ou danger immédiat : appelez d’abord les services compétents',
    );

    expect(vitrerieSafetyAlertContacts).toHaveLength(2);
    for (const contact of vitrerieSafetyAlertContacts) {
      expect(section).toContain(`href="${contact.tel}"`);
    }
    expect(section).toMatch(/href="tel:17"/);
    expect(section).toMatch(/href="tel:112"/);
  });

  it('never presents Belkhir Dépannage as a substitute for law enforcement or emergency services', () => {
    const section = extractSection(vitrerieHtml, 'urgences-vitrerie');
    const alertMatch = section.match(/<div class="safety-alert"[\s\S]*?<\/div>\s*<\/div>/);
    const alertHtml = alertMatch?.[0] ?? section;
    expect(alertHtml).toContain('jamais en substitut des forces de l’ordre');
    expect(alertHtml).not.toContain('hero__call-cta');
    expect(alertHtml).not.toContain('reassurance__cta');
  });

  it('never invents a guaranteed delay, a certification, a fixed price or a damage-free promise', () => {
    const section = extractSection(vitrerieHtml, 'urgences-vitrerie');
    for (const forbidden of [
      'garanti',
      'certifi',
      'agréé',
      'en moins d’une heure',
      'sans dommage',
    ]) {
      expect(section.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });
});

describe('page /vitrerie/ — section 2 : appel-vitrerie (réassurance + CTA)', () => {
  it('renders the exact eyebrow, H2 and CTA', () => {
    const section = extractSection(vitrerieHtml, 'appel-vitrerie');
    expect(section).toContain('VOUS N’AVEZ PAS BESOIN DE MANIPULER LE VERRE');
    expect(section).toContain('Décrivez simplement le vitrage et ce qui s’est produit');
    expect(section).toContain('Appeler Belkhir Dépannage');
  });

  it('the CTA uses the exact confirmed emergency tel: href', () => {
    const section = extractSection(vitrerieHtml, 'appel-vitrerie');
    const match = section.match(/class="reassurance__cta"[^>]*href="([^"]+)"/);
    expect(match).not.toBeNull();
    expect(match?.[1]).toBe('tel:+33649621619');
  });

  it('never promises a damage-free repair, a fixed price or a guaranteed immediate replacement', () => {
    const section = extractSection(vitrerieHtml, 'appel-vitrerie').toLowerCase();
    expect(section).not.toContain('sans dommage');
    expect(section).not.toContain('garanti');
    expect(section).not.toMatch(/\d+\s*€/);
  });
});

describe('page /vitrerie/ — section 3 : prise-en-charge-vitrerie (Process paramétrable)', () => {
  it('renders the exact eyebrow, H2 (with accent) and four steps', () => {
    const section = extractSection(vitrerieHtml, 'prise-en-charge-vitrerie');
    expect(section).toContain('UNE PRISE EN CHARGE CLAIRE');
    expect(section).toMatch(
      /Comment se déroule un <span class="process__accent"[^>]*>dépannage vitrerie<\/span>/,
    );
    for (const title of [
      'Votre appel',
      'Les premières précautions',
      'Le contrôle du vitrage et de l’accès',
      'La solution expliquée',
    ]) {
      expect(section).toContain(title);
    }
  });

  it('uses the light tone, dark high-contrast cards, and omits the landing lead/banner', () => {
    const section = extractSection(vitrerieHtml, 'prise-en-charge-vitrerie');
    expect(section).toContain('process--light');
    expect(section).not.toContain('process__lead');
    expect(section).not.toContain('process__banner');
    const steps = section.match(/class="process__step"/g) ?? [];
    expect(steps).toHaveLength(4);
  });
});

describe('page /vitrerie/ — section 4 : zone-vitrerie (CoverageSummary)', () => {
  it('renders the exact eyebrow, H2 with accent, reusing the real department data', () => {
    const section = extractSection(vitrerieHtml, 'zone-vitrerie');
    expect(section).toContain('UNE ÉQUIPE MOBILE');
    expect(section).toMatch(/class="coverage-summary__accent"[^>]*>Hauts-de-France<\/span>/);
    const badges = Array.from(
      section.matchAll(/class="coverage-summary__zone-code"[^>]*>\(([^)]+)\)/g),
    ).map((m) => m[1]);
    expect(badges).toEqual(coverageZones.map((zone) => zone.code));
  });

  it('never claims permanent coverage of every commune', () => {
    const section = extractSection(vitrerieHtml, 'zone-vitrerie');
    expect(section.toLowerCase()).not.toContain('toujours disponible');
    expect(section.toLowerCase()).not.toContain('couverture totale');
  });
});

describe('page /vitrerie/ — section 5 : avis-vitrerie (Reviews paramétrable)', () => {
  it('renders the vitrerie-specific eyebrow and H2, reusing the centralized rating data', () => {
    const section = extractSection(vitrerieHtml, 'avis-vitrerie');
    expect(section).toContain('LA CONFIANCE SE CONSTRUIT SUR LE TERRAIN');
    expect(section).toContain('L’expérience de nos clients');
    expect(section).not.toContain('Avis Google à connecter');
    expect(section).toContain('4,7/5 — 225 avis Google');
  });

  it('never fabricates a testimonial, name, place or date', () => {
    const section = extractSection(vitrerieHtml, 'avis-vitrerie');
    expect(section).not.toMatch(/il y a \d+ (jour|semaine|mois)/i);
  });
});

describe('page /vitrerie/ — section 6 : faq-vitrerie (Faq paramétrable + JSON-LD)', () => {
  it('renders the exact eyebrow, H2 and six questions with real accordion semantics', () => {
    const section = extractSection(vitrerieHtml, 'faq-vitrerie');
    expect(section).toContain('QUESTIONS FRÉQUENTES');
    expect(section).toContain('Avant d’appeler pour une vitre cassée ou fissurée');
    for (const item of vitrerieFaqItems) {
      expect(section).toContain(item.question);
    }
    expect(section.match(/aria-expanded="false"/g) ?? []).toHaveLength(vitrerieFaqItems.length);
    expect(section.match(/role="region"/g) ?? []).toHaveLength(vitrerieFaqItems.length);
  });

  it('emits a FAQPage JSON-LD schema fed with exactly the same questions/answers as displayed', () => {
    const ldMatch = vitrerieHtml.match(
      /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/,
    );
    expect(ldMatch).not.toBeNull();
    const schema = JSON.parse(ldMatch?.[1] ?? '{}');
    expect(schema['@type']).toBe('FAQPage');
    expect(schema.mainEntity).toHaveLength(vitrerieFaqItems.length);
    for (let i = 0; i < vitrerieFaqItems.length; i++) {
      expect(schema.mainEntity[i].name).toBe(vitrerieFaqItems[i].question);
      expect(schema.mainEntity[i].acceptedAnswer.text).toBe(vitrerieFaqItems[i].answer);
    }
  });
});

describe('maillage depuis la landing vers /vitrerie/', () => {
  it('the Hero ribbon "Vitrerie" button points to the dedicated page', () => {
    const match = indexHtml.match(/<a href="([^"]+)" class="hero__trade"[^>]*>Vitrerie<\/a>/);
    expect(match).not.toBeNull();
    expect(match?.[1]).toMatch(/\/vitrerie\/$/);
  });

  it('the "Vitrerie" domain card links to the dedicated page', () => {
    const match = indexHtml.match(/<a id="service-vitrerie" href="([^"]+)" class="service-card"/);
    expect(match).not.toBeNull();
    expect(match?.[1]).toMatch(/\/vitrerie\/$/);
  });

  it('the "Vitre cassée" emergency card links to the real urgences-vitrerie section', () => {
    const match = indexHtml.match(
      /<a href="([^"]+)" class="emergency-card"[^>]*>[\s\S]{0,900}?Vitre cassée/,
    );
    expect(match).not.toBeNull();
    expect(match?.[1]).toMatch(/\/vitrerie\/#urgences-vitrerie$/);
  });

  it('the footer "Vitrerie" entry links to the dedicated page', () => {
    const footerMatch = indexHtml.match(/<footer class="site-footer"[\s\S]*?<\/footer>/);
    expect(footerMatch).not.toBeNull();
    expect(footerMatch?.[0]).toMatch(/href="[^"]*\/vitrerie\/"[^>]*>Vitrerie</);
  });
});

describe('non-régression — /plomberie/, /chauffage/ et /serrurerie/ (composants génériques partagés inchangés)', () => {
  it('plomberie, chauffage and serrurerie keep their own six sections, unaffected by the vitrerie data/props', () => {
    for (const id of [
      'urgences-plomberie',
      'appel-plomberie',
      'prise-en-charge-plomberie',
      'zone-plomberie',
      'avis-plomberie',
      'faq-plomberie',
    ]) {
      expect(plomberieHtml).toContain(`id="${id}"`);
    }
    for (const id of [
      'urgences-chauffage',
      'appel-chauffage',
      'prise-en-charge-chauffage',
      'zone-chauffage',
      'avis-chauffage',
      'faq-chauffage',
    ]) {
      expect(chauffageHtml).toContain(`id="${id}"`);
    }
    for (const id of [
      'urgences-serrurerie',
      'appel-serrurerie',
      'prise-en-charge-serrurerie',
      'zone-serrurerie',
      'avis-serrurerie',
      'faq-serrurerie',
    ]) {
      expect(serrurerieHtml).toContain(`id="${id}"`);
    }
  });

  it('plomberie/chauffage/serrurerie never render the vitrerie safety alert content', () => {
    expect(plomberieHtml).not.toContain('Traces d’effraction ou danger immédiat');
    expect(chauffageHtml).not.toContain('Traces d’effraction ou danger immédiat');
    expect(serrurerieHtml).not.toContain('manipuler le verre');
  });

  it('chauffage keeps its own gas/CO safety alert, unaffected', () => {
    expect(chauffageHtml).toContain('Urgence Sécurité Gaz');
    expect(chauffageHtml).toMatch(/href="tel:\+33800473333"/);
  });

  it('serrurerie keeps its own burglary safety alert content, unaffected', () => {
    expect(serrurerieHtml).toContain(
      'Traces d’effraction ou danger immédiat : appelez d’abord les services compétents',
    );
  });
});

describe('non-régression — landing (Process/Reviews/Faq toujours par défaut, aucun eyebrow ajouté)', () => {
  it('landing Process section keeps its exact dark tone and default copy', () => {
    const section = extractSection(indexHtml, 'interventions');
    expect(section).not.toContain('process--light');
    expect(section).toContain('VOTRE INTERVENTION, ÉTAPE PAR ÉTAPE');
  });

  it('landing Faq section stays light, no eyebrow, no burglary/gas/glass content', () => {
    const section = extractSection(indexHtml, 'faq');
    expect(section).not.toContain('faq--dark');
    expect(section).not.toContain('faq__eyebrow');
    expect(section).not.toContain('effraction');
    expect(section).not.toContain('monoxyde de carbone');
    expect(section).not.toContain('vitre cassée');
  });

  it('every rating shown across the five pages matches the single centralized source', () => {
    const expectedRating = googleReviewSummary.rating.toFixed(1).replace('.', ',');
    for (const html of [indexHtml, plomberieHtml, chauffageHtml, serrurerieHtml, vitrerieHtml]) {
      const ratings = html.match(/\d,\d\/5/g) ?? [];
      for (const rating of ratings) {
        expect(rating).toBe(`${expectedRating}/5`);
      }
    }
  });
});
