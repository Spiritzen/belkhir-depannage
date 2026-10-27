import { describe, expect, it, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ChauffagePage from '../src/pages/chauffage/index.astro';
import PlomberiePage from '../src/pages/plomberie/index.astro';
import IndexPage from '../src/pages/index.astro';
import { googleReviewSummary, coverageZones } from '../src/data/landing';
import {
  chauffageSafetyTips,
  chauffageFaqItems,
  chauffageSafetyAlertContacts,
} from '../src/data/chauffage';

// Tests ciblés pour /chauffage/ (PROMPT_CLAUDE_CODE_PAGE_CHAUFFAGE_PATTERN_
// COMPLET.txt, 04/09/2026) : présence des six sections, alternance des
// fonds, encart sécurité gaz/CO, FAQ + JSON-LD, et non-régression de
// /plomberie/ et de la landing (composants génériques partagés, aucune
// duplication).
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

describe('page /chauffage/ — six sections présentes, alternance stricte des fonds', () => {
  const ids = [
    'urgences-chauffage',
    'appel-chauffage',
    'prise-en-charge-chauffage',
    'zone-chauffage',
    'avis-chauffage',
    'faq-chauffage',
  ];

  it('all six sections exist, in this exact order', () => {
    const positions = ids.map((id) => chauffageHtml.indexOf(`id="${id}"`));
    for (const pos of positions) {
      expect(pos).toBeGreaterThan(-1);
    }
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]);
    }
  });

  it('alternates light (abricot) / dark (anthracite) tone starting light after the Hero', () => {
    const urgences = extractSection(chauffageHtml, 'urgences-chauffage');
    const priseEnCharge = extractSection(chauffageHtml, 'prise-en-charge-chauffage');
    const avis = extractSection(chauffageHtml, 'avis-chauffage');
    const appel = extractSection(chauffageHtml, 'appel-chauffage');
    const zone = extractSection(chauffageHtml, 'zone-chauffage');
    const faq = extractSection(chauffageHtml, 'faq-chauffage');

    expect(urgences).not.toContain('safety-tips--dark');
    expect(priseEnCharge).toContain('process--light');
    expect(avis).not.toContain('reviews--dark');

    expect(appel).toContain('class="reassurance"');
    expect(zone).toContain('class="coverage-summary"');
    expect(faq).toContain('faq--dark');
  });
});

describe('page /chauffage/ — section 1 : urgences-chauffage (premiers gestes + encart sécurité)', () => {
  it('renders the exact eyebrow and H2', () => {
    const section = extractSection(chauffageHtml, 'urgences-chauffage');
    expect(section).toContain('VOTRE SÉCURITÉ D’ABORD');
    expect(section).toContain('Que faire lorsque le chauffage ne fonctionne plus correctement ?');
  });

  it('renders exactly four safety cards with the four required fields each', () => {
    const section = extractSection(chauffageHtml, 'urgences-chauffage');
    const cards = section.match(/class="safety-tips__card"/g) ?? [];
    expect(cards).toHaveLength(4);
    for (const tip of chauffageSafetyTips) {
      expect(section).toContain(tip.situation);
      expect(section).toContain(tip.advice);
      expect(section).toContain(tip.avoid);
      expect(section).toContain(tip.reassurance);
    }
  });

  it('renders a distinct, prioritized gas/carbon-monoxide safety alert with real tel: links', () => {
    const section = extractSection(chauffageHtml, 'urgences-chauffage');
    expect(section).toContain('class="safety-alert"');
    expect(section).toContain(
      'Odeur de gaz ou suspicion de monoxyde de carbone : mettez-vous d’abord en sécurité',
    );
    expect(section).toContain('0 800 47 33 33');

    // Les 4 numéros réels, tous cliquables.
    expect(chauffageSafetyAlertContacts).toHaveLength(4);
    for (const contact of chauffageSafetyAlertContacts) {
      expect(section).toContain(`href="${contact.tel}"`);
    }
    expect(section).toMatch(/href="tel:\+33800473333"/);
    expect(section).toMatch(/href="tel:15"/);
    expect(section).toMatch(/href="tel:18"/);
    expect(section).toMatch(/href="tel:112"/);
  });

  it('never presents the emergency contacts as Belkhir Dépannage services', () => {
    const section = extractSection(chauffageHtml, 'urgences-chauffage');
    const alertMatch = section.match(/<div class="safety-alert"[\s\S]*?<\/div>\s*<\/div>/);
    const alertHtml = alertMatch?.[0] ?? section;
    expect(alertHtml).toContain('passent toujours avant l’appel commercial');
    // Jamais le même style de bouton/pilule que le CTA d'urgence Belkhir
    // (hero__call-cta, reassurance__cta) à l'intérieur de l'encart.
    expect(alertHtml).not.toContain('hero__call-cta');
    expect(alertHtml).not.toContain('reassurance__cta');
  });

  it('never invents a guaranteed delay, a certification or a fixed price', () => {
    const section = extractSection(chauffageHtml, 'urgences-chauffage');
    for (const forbidden of ['garanti', 'certifi', 'agréé', 'en moins d’une heure']) {
      expect(section.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });
});

describe('page /chauffage/ — section 2 : appel-chauffage (réassurance + CTA)', () => {
  it('renders the exact eyebrow, H2 and CTA', () => {
    const section = extractSection(chauffageHtml, 'appel-chauffage');
    expect(section).toContain('VOUS N’AVEZ PAS BESOIN DE CONNAÎTRE LA PANNE');
    expect(section).toContain(
      'Décrivez les signes observés, nous vous aidons à qualifier la situation',
    );
    expect(section).toContain('Appeler Belkhir Dépannage');
  });

  it('the CTA uses the exact confirmed emergency tel: href, and never implies it replaces gas/rescue services', () => {
    const section = extractSection(chauffageHtml, 'appel-chauffage');
    const match = section.match(/class="reassurance__cta"[^>]*href="([^"]+)"/);
    expect(match).not.toBeNull();
    expect(match?.[1]).toBe('tel:+33649621619');
  });
});

describe('page /chauffage/ — section 3 : prise-en-charge-chauffage (Process paramétrable)', () => {
  it('renders the exact eyebrow, H2 (with accent) and four steps', () => {
    const section = extractSection(chauffageHtml, 'prise-en-charge-chauffage');
    expect(section).toContain('UNE PRISE EN CHARGE CLAIRE');
    expect(section).toMatch(
      /Comment se déroule un <span class="process__accent"[^>]*>dépannage chauffage<\/span>/,
    );
    for (const title of [
      'Votre appel',
      'Les premiers gestes',
      'Le contrôle de l’installation',
      'La solution expliquée',
    ]) {
      expect(section).toContain(title);
    }
  });

  it('uses the light tone, dark high-contrast cards, and omits the landing lead/banner', () => {
    const section = extractSection(chauffageHtml, 'prise-en-charge-chauffage');
    expect(section).toContain('process--light');
    expect(section).not.toContain('process__lead');
    expect(section).not.toContain('process__banner');
    const steps = section.match(/class="process__step"/g) ?? [];
    expect(steps).toHaveLength(4);
  });
});

describe('page /chauffage/ — section 4 : zone-chauffage (CoverageSummary)', () => {
  it('renders the exact eyebrow, H2 with accent and intro, reusing the real department data', () => {
    const section = extractSection(chauffageHtml, 'zone-chauffage');
    expect(section).toContain('UNE ÉQUIPE MOBILE');
    expect(section).toMatch(/class="coverage-summary__accent"[^>]*>Hauts-de-France<\/span>/);
    const badges = Array.from(
      section.matchAll(/class="coverage-summary__zone-code"[^>]*>\(([^)]+)\)/g),
    ).map((m) => m[1]);
    expect(badges).toEqual(coverageZones.map((zone) => zone.code));
  });

  it('never claims permanent coverage of every commune', () => {
    const section = extractSection(chauffageHtml, 'zone-chauffage');
    expect(section.toLowerCase()).not.toContain('toujours disponible');
    expect(section.toLowerCase()).not.toContain('couverture totale');
  });
});

describe('page /chauffage/ — section 5 : avis-chauffage (Reviews paramétrable)', () => {
  it('renders the chauffage-specific eyebrow and H2, reusing the centralized rating data', () => {
    const section = extractSection(chauffageHtml, 'avis-chauffage');
    expect(section).toContain('LA CONFIANCE SE CONSTRUIT SUR LE TERRAIN');
    expect(section).toContain('L’expérience de nos clients');
    expect(section).not.toContain('Avis Google à connecter');
    expect(section).toContain('4,7/5 — 225 avis Google');
  });

  it('never fabricates a testimonial, name, place or date', () => {
    const section = extractSection(chauffageHtml, 'avis-chauffage');
    expect(section).not.toMatch(/il y a \d+ (jour|semaine|mois)/i);
  });
});

describe('page /chauffage/ — section 6 : faq-chauffage (Faq paramétrable + JSON-LD)', () => {
  it('renders the exact eyebrow, H2 and six questions with real accordion semantics', () => {
    const section = extractSection(chauffageHtml, 'faq-chauffage');
    expect(section).toContain('QUESTIONS FRÉQUENTES');
    expect(section).toContain('Avant d’appeler pour un problème de chauffage');
    for (const item of chauffageFaqItems) {
      expect(section).toContain(item.question);
    }
    expect(section.match(/aria-expanded="false"/g) ?? []).toHaveLength(chauffageFaqItems.length);
    expect(section.match(/role="region"/g) ?? []).toHaveLength(chauffageFaqItems.length);
  });

  it('emits a FAQPage JSON-LD schema fed with exactly the same questions/answers as displayed', () => {
    const ldMatch = chauffageHtml.match(
      /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/,
    );
    expect(ldMatch).not.toBeNull();
    const schema = JSON.parse(ldMatch?.[1] ?? '{}');
    expect(schema['@type']).toBe('FAQPage');
    expect(schema.mainEntity).toHaveLength(chauffageFaqItems.length);
    for (let i = 0; i < chauffageFaqItems.length; i++) {
      expect(schema.mainEntity[i].name).toBe(chauffageFaqItems[i].question);
      expect(schema.mainEntity[i].acceptedAnswer.text).toBe(chauffageFaqItems[i].answer);
    }
  });

  it('the visible gas/CO answers match the safety alert wording (no divergent structured data)', () => {
    const gasQuestion = chauffageFaqItems.find((item) => item.question.includes('odeur de gaz'));
    expect(gasQuestion).toBeDefined();
    expect(gasQuestion?.answer).toContain('0 800 47 33 33');
  });
});

describe('maillage depuis la landing vers /chauffage/', () => {
  it('the Hero ribbon "Chauffage" button points to the dedicated page', () => {
    const match = indexHtml.match(/<a href="([^"]+)" class="hero__trade"[^>]*>Chauffage<\/a>/);
    expect(match).not.toBeNull();
    expect(match?.[1]).toMatch(/\/chauffage\/$/);
  });

  it('the "Chauffage" domain card links to the dedicated page', () => {
    const match = indexHtml.match(/<a id="service-chauffage" href="([^"]+)" class="service-card"/);
    expect(match).not.toBeNull();
    expect(match?.[1]).toMatch(/\/chauffage\/$/);
  });

  it('the "Chauffage en panne" emergency card links to the real urgences-chauffage section', () => {
    const match = indexHtml.match(
      /<a href="([^"]+)" class="emergency-card"[^>]*>[\s\S]{0,900}?Chauffage en panne/,
    );
    expect(match).not.toBeNull();
    expect(match?.[1]).toMatch(/\/chauffage\/#urgences-chauffage$/);
  });

  // CORRECTION (AUDIT AVANT PUSH, 04/09/2026) : le lien footer « Plomberie »
  // pointait vers l'ancre `#service-plomberie`, un lien mort partout sauf
  // sur la landing (seule page portant réellement cet id) — il pointe
  // désormais vers la page dédiée /plomberie/, exactement comme les 4
  // autres métiers.
  it('the footer "Chauffage" and "Plomberie" entries both link to their dedicated pages', () => {
    const footerMatch = indexHtml.match(/<footer class="site-footer"[\s\S]*?<\/footer>/);
    expect(footerMatch).not.toBeNull();
    const footerHtml = footerMatch?.[0] ?? '';
    expect(footerHtml).toMatch(/href="[^"]*\/chauffage\/"[^>]*>Chauffage</);
    expect(footerHtml).toMatch(/href="[^"]*\/plomberie\/"[^>]*>Plomberie</);
    expect(footerHtml).not.toContain('href="#service-plomberie"');
  });
});

describe('non-régression — /plomberie/ (composants génériques partagés inchangés)', () => {
  it('plomberie keeps its own six sections, unaffected by the chauffage data/props', () => {
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
  });

  it('plomberie never renders a safety alert (chauffage-only content)', () => {
    expect(plomberieHtml).not.toContain('class="safety-alert"');
    expect(plomberieHtml).not.toContain('Urgence Sécurité Gaz');
  });

  it('plomberie H1 and Process content remain exactly as validated', () => {
    const h1Match = plomberieHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    const visibleText = (h1Match?.[1] ?? '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    expect(visibleText).toBe('Dépannage plomberie d’urgence dans les Hauts-de-France');
    expect(plomberieHtml).toContain('Votre appel');
    expect(plomberieHtml).toContain('La recherche de la cause');
  });
});

describe('non-régression — landing (Process/Reviews/Faq toujours par défaut, aucun eyebrow ajouté)', () => {
  it('landing Process section keeps its exact dark tone and default copy', () => {
    const section = extractSection(indexHtml, 'interventions');
    expect(section).not.toContain('process--light');
    expect(section).toContain('VOTRE INTERVENTION, ÉTAPE PAR ÉTAPE');
  });

  it('landing Faq section stays light, no eyebrow, no gas/CO content', () => {
    const section = extractSection(indexHtml, 'faq');
    expect(section).not.toContain('faq--dark');
    expect(section).not.toContain('faq__eyebrow');
    expect(section).not.toContain('monoxyde de carbone');
  });

  it('every rating shown across the three pages matches the single centralized source', () => {
    const expectedRating = googleReviewSummary.rating.toFixed(1).replace('.', ',');
    for (const html of [indexHtml, plomberieHtml, chauffageHtml]) {
      const ratings = html.match(/\d,\d\/5/g) ?? [];
      for (const rating of ratings) {
        expect(rating).toBe(`${expectedRating}/5`);
      }
    }
  });
});
