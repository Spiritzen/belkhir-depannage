import { describe, expect, it, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import RideauxMetalliquesPage from '../src/pages/rideaux-metalliques/index.astro';
import VitreriePage from '../src/pages/vitrerie/index.astro';
import SerruriePage from '../src/pages/serrurerie/index.astro';
import ChauffagePage from '../src/pages/chauffage/index.astro';
import PlomberiePage from '../src/pages/plomberie/index.astro';
import IndexPage from '../src/pages/index.astro';
import { googleReviewSummary, coverageZones } from '../src/data/landing';
import {
  rideauxMetalliquesSafetyTips,
  rideauxMetalliquesFaqItems,
  rideauxMetalliquesSafetyAlertContacts,
} from '../src/data/rideaux-metalliques';

// Tests ciblés pour /rideaux-metalliques/ (PROMPT_CLAUDE_CODE_PAGE_RIDEAUX_
// METALLIQUES_PATTERN_COMPLET.txt, 04/09/2026) : présence des six sections,
// alternance des fonds, encart sécurité, carte de couverture partagée, FAQ +
// JSON-LD, et non-régression de /plomberie/, /chauffage/, /serrurerie/,
// /vitrerie/ et de la landing (composants génériques partagés, aucune
// duplication).
let rideauxHtml = '';
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
  rideauxHtml = await container.renderToString(RideauxMetalliquesPage, {
    request: new Request('http://localhost/rideaux-metalliques/'),
  });
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

describe('page /rideaux-metalliques/ — six sections présentes, alternance stricte des fonds', () => {
  const ids = [
    'urgences-rideaux-metalliques',
    'appel-rideaux-metalliques',
    'prise-en-charge-rideaux-metalliques',
    'zone-rideaux-metalliques',
    'avis-rideaux-metalliques',
    'faq-rideaux-metalliques',
  ];

  it('all six sections exist, in this exact order', () => {
    const positions = ids.map((id) => rideauxHtml.indexOf(`id="${id}"`));
    for (const pos of positions) {
      expect(pos).toBeGreaterThan(-1);
    }
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]);
    }
  });

  it('alternates light (abricot) / dark (anthracite) tone starting light after the Hero', () => {
    const urgences = extractSection(rideauxHtml, 'urgences-rideaux-metalliques');
    const priseEnCharge = extractSection(rideauxHtml, 'prise-en-charge-rideaux-metalliques');
    const avis = extractSection(rideauxHtml, 'avis-rideaux-metalliques');
    const appel = extractSection(rideauxHtml, 'appel-rideaux-metalliques');
    const zone = extractSection(rideauxHtml, 'zone-rideaux-metalliques');
    const faq = extractSection(rideauxHtml, 'faq-rideaux-metalliques');

    expect(urgences).not.toContain('safety-tips--dark');
    expect(priseEnCharge).toContain('process--light');
    expect(avis).not.toContain('reviews--dark');

    expect(appel).toContain('class="reassurance"');
    expect(zone).toContain('class="coverage-summary"');
    expect(faq).toContain('faq--dark');
  });
});

describe('page /rideaux-metalliques/ — section 1 : urgences-rideaux-metalliques (premiers gestes + encart sécurité)', () => {
  it('renders the exact eyebrow and H2', () => {
    const section = extractSection(rideauxHtml, 'urgences-rideaux-metalliques');
    expect(section).toContain('VOTRE SÉCURITÉ D’ABORD');
    expect(section).toContain('Que faire face à un rideau métallique bloqué ou en panne ?');
  });

  it('renders exactly four safety cards with the four required fields each', () => {
    const section = extractSection(rideauxHtml, 'urgences-rideaux-metalliques');
    const cards = section.match(/class="safety-tips__card"/g) ?? [];
    expect(cards).toHaveLength(4);
    for (const tip of rideauxMetalliquesSafetyTips) {
      expect(section).toContain(tip.situation);
      expect(section).toContain(tip.advice);
      expect(section).toContain(tip.avoid);
      expect(section).toContain(tip.reassurance);
    }
  });

  it('never details any mechanical/electrical procedure or technique to force, bypass or neutralize the shutter', () => {
    const section = extractSection(rideauxHtml, 'urgences-rideaux-metalliques').toLowerCase();
    for (const forbidden of [
      'dévissez',
      'démontez',
      'coupez le courant vous-même',
      'ouvrez le coffre du moteur et',
    ]) {
      expect(section).not.toContain(forbidden);
    }
  });

  it('renders a distinct, prioritized safety alert (fall/crush risk, electrical danger, burglary) with real tel: links', () => {
    const section = extractSection(rideauxHtml, 'urgences-rideaux-metalliques');
    expect(section).toContain('class="safety-alert"');
    expect(section).toContain(
      'Risque de chute, odeur de brûlé ou danger immédiat : appelez d’abord les services compétents',
    );

    expect(rideauxMetalliquesSafetyAlertContacts.length).toBeGreaterThanOrEqual(2);
    for (const contact of rideauxMetalliquesSafetyAlertContacts) {
      expect(section).toContain(`href="${contact.tel}"`);
    }
    expect(section).toMatch(/href="tel:17"/);
    expect(section).toMatch(/href="tel:112"/);
    expect(section).toMatch(/href="tel:18"/);
  });

  it('never presents Belkhir Dépannage as a substitute for law enforcement or emergency services', () => {
    const section = extractSection(rideauxHtml, 'urgences-rideaux-metalliques');
    const alertMatch = section.match(/<div class="safety-alert"[\s\S]*?<\/div>\s*<\/div>/);
    const alertHtml = alertMatch?.[0] ?? section;
    expect(alertHtml).toContain('jamais en substitut des forces de l’ordre');
    expect(alertHtml).not.toContain('hero__call-cta');
    expect(alertHtml).not.toContain('reassurance__cta');
  });

  it('never invents a guaranteed delay, a certification, a fixed price or a damage-free promise', () => {
    const section = extractSection(rideauxHtml, 'urgences-rideaux-metalliques');
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

describe('page /rideaux-metalliques/ — section 2 : appel-rideaux-metalliques (réassurance + CTA)', () => {
  it('renders the exact eyebrow, H2 and CTA', () => {
    const section = extractSection(rideauxHtml, 'appel-rideaux-metalliques');
    expect(section).toContain('VOUS N’AVEZ PAS BESOIN DE MANIPULER LE MÉCANISME');
    expect(section).toContain('Décrivez simplement le rideau et ce qui s’est produit');
    expect(section).toContain('Appeler Belkhir Dépannage');
  });

  it('the CTA uses the exact confirmed emergency tel: href', () => {
    const section = extractSection(rideauxHtml, 'appel-rideaux-metalliques');
    const match = section.match(/class="reassurance__cta"[^>]*href="([^"]+)"/);
    expect(match).not.toBeNull();
    expect(match?.[1]).toBe('tel:+33649621619');
  });

  it('never promises a systematic opening, a fixed price or an immediate definitive repair', () => {
    const section = extractSection(rideauxHtml, 'appel-rideaux-metalliques').toLowerCase();
    expect(section).not.toContain('sans dommage');
    expect(section).not.toContain('garanti');
    expect(section).not.toMatch(/\d+\s*€/);
  });
});

describe('page /rideaux-metalliques/ — section 3 : prise-en-charge-rideaux-metalliques (Process paramétrable)', () => {
  it('renders the exact eyebrow, H2 (with accent) and four steps', () => {
    const section = extractSection(rideauxHtml, 'prise-en-charge-rideaux-metalliques');
    expect(section).toContain('UNE PRISE EN CHARGE CLAIRE');
    expect(section).toMatch(
      /Comment se déroule un <span class="process__accent"[^>]*>dépannage de rideau métallique<\/span>/,
    );
    for (const title of [
      'Votre appel',
      'Les consignes immédiates',
      'Le contrôle du tablier et de la commande',
      'La solution expliquée',
    ]) {
      expect(section).toContain(title);
    }
  });

  it('uses the light tone, dark high-contrast cards, and omits the landing lead/banner', () => {
    const section = extractSection(rideauxHtml, 'prise-en-charge-rideaux-metalliques');
    expect(section).toContain('process--light');
    expect(section).not.toContain('process__lead');
    expect(section).not.toContain('process__banner');
    const steps = section.match(/class="process__step"/g) ?? [];
    expect(steps).toHaveLength(4);
  });
});

describe('page /rideaux-metalliques/ — section 4 : zone-rideaux-metalliques (CoverageSummary + carte partagée)', () => {
  it('renders the exact eyebrow, H2 with accent, reusing the real department data', () => {
    const section = extractSection(rideauxHtml, 'zone-rideaux-metalliques');
    expect(section).toContain('UNE ÉQUIPE MOBILE');
    expect(section).toMatch(/class="coverage-summary__accent"[^>]*>Hauts-de-France<\/span>/);
    const badges = Array.from(
      section.matchAll(/class="coverage-summary__zone-code"[^>]*>\(([^)]+)\)/g),
    ).map((m) => m[1]);
    expect(badges).toEqual(coverageZones.map((zone) => zone.code));
  });

  it('reuses the shared geographic map component, never a duplicated SVG', () => {
    const section = extractSection(rideauxHtml, 'zone-rideaux-metalliques');
    expect(section).toContain('class="coverage-map"');
    expect(section).toContain('coverage-map__outline');
    const deptPaths = section.match(/class="coverage-map__dept"/g) ?? [];
    expect(deptPaths).toHaveLength(5);
    // Variante « subtle » (pages métier), jamais l'animation « wahou »
    // complète (pas de tracé de mobilité ni de fourgon sur cette page).
    expect(section).toContain('coverage-map-graphic--subtle');
    expect(section).not.toContain('coverage-map__route');
    expect(section).not.toContain('coverage__van');
  });

  it('never claims permanent coverage of every commune or an invented delay', () => {
    const section = extractSection(rideauxHtml, 'zone-rideaux-metalliques');
    expect(section.toLowerCase()).not.toContain('toujours disponible');
    expect(section.toLowerCase()).not.toContain('couverture totale');
  });
});

describe('page /rideaux-metalliques/ — section 5 : avis-rideaux-metalliques (Reviews paramétrable)', () => {
  it('renders the rideaux-metalliques-specific eyebrow and H2, reusing the centralized rating data', () => {
    const section = extractSection(rideauxHtml, 'avis-rideaux-metalliques');
    expect(section).toContain('LA CONFIANCE SE CONSTRUIT SUR LE TERRAIN');
    expect(section).toContain('L’expérience de nos clients');
    expect(section).toContain('Avis Google à connecter');
  });

  it('never fabricates a testimonial, name, place or date', () => {
    const section = extractSection(rideauxHtml, 'avis-rideaux-metalliques');
    expect(section).not.toMatch(/il y a \d+ (jour|semaine|mois)/i);
  });
});

describe('page /rideaux-metalliques/ — section 6 : faq-rideaux-metalliques (Faq paramétrable + JSON-LD)', () => {
  it('renders the exact eyebrow, H2 and six questions with real accordion semantics', () => {
    const section = extractSection(rideauxHtml, 'faq-rideaux-metalliques');
    expect(section).toContain('QUESTIONS FRÉQUENTES');
    expect(section).toContain('Avant d’appeler pour un rideau métallique bloqué');
    for (const item of rideauxMetalliquesFaqItems) {
      expect(section).toContain(item.question);
    }
    expect(section.match(/aria-expanded="false"/g) ?? []).toHaveLength(
      rideauxMetalliquesFaqItems.length,
    );
    expect(section.match(/role="region"/g) ?? []).toHaveLength(rideauxMetalliquesFaqItems.length);
  });

  it('emits a FAQPage JSON-LD schema fed with exactly the same questions/answers as displayed', () => {
    const ldMatch = rideauxHtml.match(
      /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/,
    );
    expect(ldMatch).not.toBeNull();
    const schema = JSON.parse(ldMatch?.[1] ?? '{}');
    expect(schema['@type']).toBe('FAQPage');
    expect(schema.mainEntity).toHaveLength(rideauxMetalliquesFaqItems.length);
    for (let i = 0; i < rideauxMetalliquesFaqItems.length; i++) {
      expect(schema.mainEntity[i].name).toBe(rideauxMetalliquesFaqItems[i].question);
      expect(schema.mainEntity[i].acceptedAnswer.text).toBe(rideauxMetalliquesFaqItems[i].answer);
    }
  });
});

describe('maillage depuis la landing vers /rideaux-metalliques/', () => {
  it('the Hero ribbon "Rideaux métalliques" button points to the dedicated page', () => {
    const match = indexHtml.match(
      /<a href="([^"]+)" class="hero__trade"[^>]*>Rideaux métalliques<\/a>/,
    );
    expect(match).not.toBeNull();
    expect(match?.[1]).toMatch(/\/rideaux-metalliques\/$/);
  });

  it('the "Rideaux métalliques" domain card links to the dedicated page', () => {
    const match = indexHtml.match(
      /<a id="service-rideaux-metalliques" href="([^"]+)" class="service-card"/,
    );
    expect(match).not.toBeNull();
    expect(match?.[1]).toMatch(/\/rideaux-metalliques\/$/);
  });

  it('the "Rideau métallique bloqué" emergency card links to the real urgences-rideaux-metalliques section', () => {
    const match = indexHtml.match(
      /<a href="([^"]+)" class="emergency-card"[^>]*>[\s\S]{0,900}?Rideau métallique bloqué/,
    );
    expect(match).not.toBeNull();
    expect(match?.[1]).toMatch(/\/rideaux-metalliques\/#urgences-rideaux-metalliques$/);
  });

  it('the footer "Rideaux métalliques" entry links to the dedicated page', () => {
    const footerMatch = indexHtml.match(/<footer class="site-footer"[\s\S]*?<\/footer>/);
    expect(footerMatch).not.toBeNull();
    expect(footerMatch?.[0]).toMatch(
      /href="[^"]*\/rideaux-metalliques\/"[^>]*>Rideaux métalliques</,
    );
  });

  it('no fifth link was invented (all other landing metier destinations untouched)', () => {
    expect(indexHtml).toMatch(/<a href="[^"]*\/plomberie\/" class="hero__trade"/);
    expect(indexHtml).toMatch(/<a href="[^"]*\/vitrerie\/" class="hero__trade"/);
  });
});

describe('non-régression — /plomberie/, /chauffage/, /serrurerie/ et /vitrerie/ (composants génériques partagés inchangés)', () => {
  it('every existing metier page keeps its own six sections, unaffected by the rideaux-metalliques data/props', () => {
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
    for (const id of [
      'urgences-vitrerie',
      'appel-vitrerie',
      'prise-en-charge-vitrerie',
      'zone-vitrerie',
      'avis-vitrerie',
      'faq-vitrerie',
    ]) {
      expect(vitrerieHtml).toContain(`id="${id}"`);
    }
  });

  it('other metier pages never render the rideaux-metalliques safety alert content', () => {
    expect(plomberieHtml).not.toContain('Risque de chute, odeur de brûlé');
    expect(chauffageHtml).not.toContain('Risque de chute, odeur de brûlé');
    expect(serrurerieHtml).not.toContain('Risque de chute, odeur de brûlé');
    expect(vitrerieHtml).not.toContain('Risque de chute, odeur de brûlé');
  });

  it('chauffage and serrurerie keep their own distinct safety alerts, unaffected', () => {
    expect(chauffageHtml).toContain('Urgence Sécurité Gaz');
    expect(chauffageHtml).toMatch(/href="tel:\+33800473333"/);
    expect(serrurerieHtml).toContain(
      'Traces d’effraction ou danger immédiat : appelez d’abord les services compétents',
    );
  });

  it('every metier page reuses the same shared coverage map, no duplicated instance count mismatch', () => {
    for (const html of [plomberieHtml, chauffageHtml, serrurerieHtml, vitrerieHtml, rideauxHtml]) {
      const deptPaths = html.match(/class="coverage-map__dept"/g) ?? [];
      expect(deptPaths).toHaveLength(5);
    }
  });
});

describe('non-régression — landing (Process/Reviews/Faq/Coverage toujours par défaut)', () => {
  it('landing Process section keeps its exact dark tone and default copy', () => {
    const section = extractSection(indexHtml, 'interventions');
    expect(section).not.toContain('process--light');
    expect(section).toContain('VOTRE INTERVENTION, ÉTAPE PAR ÉTAPE');
  });

  it('landing Faq section stays light, no eyebrow, no metier-specific safety content', () => {
    const section = extractSection(indexHtml, 'faq');
    expect(section).not.toContain('faq--dark');
    expect(section).not.toContain('faq__eyebrow');
    expect(section).not.toContain('effraction');
    expect(section).not.toContain('monoxyde de carbone');
    expect(section).not.toContain('rideau métallique bloqué');
  });

  it('landing Coverage section still uses the animated van + route, untouched by the shared map extraction', () => {
    const section = extractSection(indexHtml, 'zones-couvertes');
    expect(section).toContain('coverage__van');
    expect(section).toContain('coverage-map__route');
  });

  it('every rating shown across the six pages matches the single centralized source', () => {
    const expectedRating = googleReviewSummary.rating.toFixed(1).replace('.', ',');
    for (const html of [
      indexHtml,
      plomberieHtml,
      chauffageHtml,
      serrurerieHtml,
      vitrerieHtml,
      rideauxHtml,
    ]) {
      const ratings = html.match(/\d,\d\/5/g) ?? [];
      for (const rating of ratings) {
        expect(rating).toBe(`${expectedRating}/5`);
      }
    }
  });
});
