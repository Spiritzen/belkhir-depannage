import { describe, expect, it, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import IndexPage from '../src/pages/index.astro';
import { processSteps } from '../src/data/landing';

// Tests couvrant la refonte « wahou » de la section Processus
// (PROMPT_CLAUDE_CODE_PROCESSUS_PRISE_EN_CHARGE_WAHOU.txt, 01/09/2026).
let pageHtml = '';
let sectionHtml = '';

beforeAll(async () => {
  const container = await AstroContainer.create();
  pageHtml = await container.renderToString(IndexPage, {
    request: new Request('http://localhost/'),
  });
  const match = pageHtml.match(/<section class="process"[\s\S]*?<\/section>/);
  sectionHtml = match?.[0] ?? '';
}, 30000);

describe('refonte « wahou » — Processus de prise en charge', () => {
  it('1. the new eyebrow is present', () => {
    expect(sectionHtml).toContain('VOTRE INTERVENTION, ÉTAPE PAR ÉTAPE');
  });

  it('2. the H2 exists exactly once and its reconstructed text is exactly the validated wording, with "urgence" accented', () => {
    const matches = sectionHtml.match(/<h2[\s>]/g) ?? [];
    expect(matches).toHaveLength(1);
    const h2Match = sectionHtml.match(/<h2 id="process-title"[^>]*>([\s\S]*?)<\/h2>/);
    expect(h2Match).not.toBeNull();
    const visibleText = (h2Match?.[1] ?? '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    expect(visibleText).toBe('Une prise en charge claire, même dans l’urgence');
    expect(sectionHtml).toMatch(/<span class="process__accent"[^>]*>urgence<\/span>/);
  });

  it('3. the introduction paragraph is present with the exact validated text and only B/D of "Belkhir Dépannage" colored', () => {
    const leadMatch = sectionHtml.match(/<p class="process__lead"[^>]*>([\s\S]*?)<\/p>/);
    expect(leadMatch).not.toBeNull();
    const visibleText = (leadMatch?.[1] ?? '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    expect(visibleText).toBe(
      'Lorsqu’un problème survient, l’incertitude est souvent aussi difficile à gérer que la panne ' +
        'elle-même. Chez Belkhir Dépannage, chaque demande suit un parcours simple : comprendre la ' +
        'situation, identifier son niveau d’urgence, expliquer la réponse envisageable, puis intervenir ' +
        'et contrôler. Vous savez ainsi où vous en êtes, ce qui va se passer et quelles informations ' +
        'préparer.',
    );
    expect(sectionHtml).toMatch(/<span class="process__brand-initial"[^>]*>B<\/span>elkhir/);
    expect(sectionHtml).toMatch(/<span class="process__brand-initial"[^>]*>D<\/span>épannage/);
  });

  it('4. the four steps are rendered as an ordered list, one <li> per step, in the correct order', () => {
    const olMatch = sectionHtml.match(/<ol class="process__timeline"[^>]*>/);
    expect(olMatch).not.toBeNull();
    const liMatches = sectionHtml.match(/class="process__step"/g) ?? [];
    expect(liMatches).toHaveLength(4);
    const titleMatches = Array.from(
      sectionHtml.matchAll(/<h3 class="process__title"[^>]*>([^<]+)<\/h3>/g),
    ).map((m) => m[1]);
    expect(titleMatches).toEqual([
      'Vous contactez la ligne adaptée',
      'Nous comprenons avant de nous déplacer',
      'La réponse proposée est expliquée',
      'L’intervention est réalisée puis contrôlée',
    ]);
  });

  it('5. the four labels are present in order', () => {
    const labelMatches = Array.from(
      sectionHtml.matchAll(/<p class="process__label"[^>]*>([^<]+)<\/p>/g),
    ).map((m) => m[1]);
    // Le rendu HTML échappe correctement « & » en « &amp; » dans le texte.
    expect(labelMatches).toEqual([
      'PREMIER CONTACT',
      'QUALIFICATION',
      'EXPLICATION',
      'INTERVENTION &amp; CONTRÔLE',
    ]);
  });

  it('6. the eight badges are present, two per step, in order', () => {
    const badgeMatches = Array.from(
      sectionHtml.matchAll(/<span class="process__badge"[^>]*>([^<]+)<\/span>/g),
    ).map((m) => m[1]);
    expect(badgeMatches).toEqual([
      'STANDARD',
      'URGENCE IMMÉDIATE',
      'QUESTIONS CIBLÉES',
      'PHOTOS UTILES',
      'SOLUTION EXPLIQUÉE',
      'AVANT INTERVENTION',
      'CONTRÔLE FINAL',
      'EXPLICATIONS',
    ]);
  });

  it('7. the four step numbers "01".."04" are present, decorative and hidden from assistive technology', () => {
    const numberMatches = Array.from(
      sectionHtml.matchAll(
        /<span class="process__number" aria-hidden="true"[^>]*>\s*([^<]+?)\s*<\/span>/g,
      ),
    ).map((m) => m[1].trim());
    expect(numberMatches).toEqual(['01', '02', '03', '04']);
  });

  it('8. the final reassurance banner is present, once, with the exact validated text', () => {
    const bannerMatches = sectionHtml.match(/class="process__banner"/g) ?? [];
    expect(bannerMatches).toHaveLength(1);
    expect(sectionHtml).toContain('Un contact clair du premier appel au contrôle final.');
    expect(sectionHtml).toContain(
      'À chaque étape, la priorité reste la même : protéger les personnes, limiter les dégâts et',
    );
  });

  it('9. none of the forbidden commercial claims appear anywhere in the section', () => {
    const lower = sectionHtml.toLowerCase();
    for (const forbidden of [
      'dans l’heure',
      'moins d’une heure',
      'résultat garanti',
      'sans surprise',
      'sans engagement',
      'devis gratuit',
      'garanti',
      'certifi',
    ]) {
      expect(lower).not.toContain(forbidden.toLowerCase());
    }
    expect(sectionHtml).not.toContain('Fouad');
  });

  it('10. no additional phone button or PhoneCta component is added in this section', () => {
    expect(sectionHtml).not.toMatch(/class="phone-cta/);
    expect(sectionHtml).not.toContain('tel:');
    expect(sectionHtml).not.toMatch(/0[1-9](?:[\s.-]?\d{2}){4}/);
  });

  it('11. decorative timeline elements (line container and nodes) are hidden from assistive technology', () => {
    const nodeMatches = sectionHtml.match(/class="process__node" aria-hidden="true"/g) ?? [];
    expect(nodeMatches).toHaveLength(4);
    expect(sectionHtml).toContain('class="process__texture" aria-hidden="true"');
  });

  it('12. content stays visible by default (reveal state opt-in via JS only, matching the existing site-wide pattern)', () => {
    expect(sectionHtml).not.toContain('js-reveal-ready');
    expect(sectionHtml).toContain('data-reveal="up"');
    expect(sectionHtml).toContain('data-reveal="draw"');
  });

  it('13. heading levels do not skip incoherently (h2 for the section, h3 for each step)', () => {
    expect(sectionHtml.match(/<h2[\s>]/g) ?? []).toHaveLength(1);
    expect(sectionHtml.match(/<h3[\s>]/g) ?? []).toHaveLength(4);
    expect(sectionHtml).not.toMatch(/<h4[\s>]/);
  });

  it('14. the data module exposes exactly four steps with two badges each and a valid icon name', () => {
    expect(processSteps).toHaveLength(4);
    for (const step of processSteps) {
      expect(step.badges).toHaveLength(2);
      expect(['phone', 'search', 'clipboard-check', 'shield-check']).toContain(step.icon);
    }
  });

  it('15. the section keeps its stable id and the rest of the landing remains present (no regression)', () => {
    expect(sectionHtml).toContain('id="interventions"');
    expect(pageHtml).toContain('id="accueil"');
    expect(pageHtml).toContain('id="depannages"');
    expect(pageHtml).toContain('id="metiers"');
    expect(pageHtml).toContain('id="avis"');
    expect(pageHtml).not.toContain('class="availability-block');
  });
});
