import { describe, expect, it, beforeAll } from 'vitest';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import IndexPage from '../src/pages/index.astro';
import * as landingData from '../src/data/landing';

// Tests couvrant la suppression complète de QuickAnswers (section des
// quatre cartes « 5 métiers d'urgence / Hauts-de-France / Avis Google /
// 2 lignes d'appel dédiées », devenue redondante avec le Hero et la navbar
// sticky).
let pageHtml = '';

beforeAll(async () => {
  const container = await AstroContainer.create();
  pageHtml = await container.renderToString(IndexPage, {
    request: new Request('http://localhost/'),
  });
}, 30000);

describe('suppression de QuickAnswers', () => {
  it('1. the component file no longer exists', () => {
    const path = fileURLToPath(
      new URL('../src/components/landing/QuickAnswers.astro', import.meta.url),
    );
    expect(existsSync(path)).toBe(false);
  });

  it('2. the "quick-answers" section is completely absent from the rendered page', () => {
    expect(pageHtml).not.toContain('class="quick-answers');
    expect(pageHtml).not.toContain('quick-answers__grid');
    expect(pageHtml).not.toContain('quick-answers__card');
  });

  it('3. none of the four former quick-answers card headings remain, using their unique description text as proof (single words like "Hauts-de-France" or "Avis Google" legitimately recur elsewhere on the page and are not a reliable signal on their own)', () => {
    // Titres originaux, pour mémoire : « 5 métiers d'urgence », « Hauts-de-
    // France », « Avis Google », « 2 lignes d'appel dédiées ». Ces mots
    // seuls réapparaissent légitimement ailleurs (Hero, TrustGoogle,
    // Coverage...), donc la preuve fiable de suppression du bloc est
    // l'absence de ses phrases de description, exclusives à ce bloc.
    for (const description of [
      'Plomberie, chauffage, serrurerie, vitrerie, rideaux métalliques.',
      'Une équipe mobile qui se déplace selon votre secteur et votre situation.',
      'Vérifiés sur notre fiche professionnelle.',
      'Un standard, et un portable réservé à l’urgence extrême.',
    ]) {
      expect(pageHtml).not.toContain(description);
    }
  });

  it('4. the data module no longer exports the removed QuickAnswer type/array', () => {
    expect((landingData as Record<string, unknown>).quickAnswers).toBeUndefined();
  });

  it('5. emergency selector comes directly after the Hero in the DOM, with no section in between', () => {
    const heroEnd = pageHtml.indexOf('id="accueil"');
    expect(heroEnd).toBeGreaterThan(-1);
    const heroSectionEnd = pageHtml.indexOf('</section>', heroEnd) + '</section>'.length;
    // The very next tag after the hero's closing </section> must open the
    // emergency selector section directly — no QuickAnswers or any other
    // section wedged in between. Mini-sprint 3 (02/09/2026): Hero.astro now
    // renders an inline component <script> (mobile trades ribbon) right
    // after </section> — Astro does not hoist it into <head> — stripped
    // here without weakening the real intent of this check.
    const remainder = pageHtml
      .slice(heroSectionEnd)
      .trimStart()
      .replace(/^<script[^>]*>[\s\S]*?<\/script>\s*/, '');
    expect(remainder.startsWith('<section class="emergency-selector"')).toBe(true);
    expect(remainder).toContain('id="depannages"');
  });

  it('6. the emergency selector title itself is unchanged (title and structure preserved)', () => {
    // Adapté pour la refonte « wahou » d'EmergencySelector (01/09/2026) :
    // le H2 contient désormais un <span> autour de « urgence » (accent
    // orange, voir tests/emergency-selector-wahou.test.ts pour la
    // couverture complète) — les balises sont donc retirées avant
    // comparaison, comme pour les autres titres reconstruits du projet.
    const h2Match = pageHtml.match(/<h2 id="emergency-selector-title"[^>]*>([\s\S]*?)<\/h2>/);
    expect(h2Match).not.toBeNull();
    const visibleText = (h2Match?.[1] ?? '').replace(/<[^>]+>/g, '').trim();
    // Regex plutôt que comparaison littérale : la source utilise une espace
    // insécable avant le point d'interrogation (typographie française),
    // \s* la tolère sans dépendre du caractère Unicode exact.
    const expected = ['Quelle', 'est', 'votre', 'urgence'].join('\\s+') + '\\s*\\?';
    expect(visibleText).toMatch(new RegExp(`^${expected}$`));
  });

  it('7. the hero and the trust badge/quote button from the previous mission are still intact', () => {
    expect(pageHtml).toContain('hero__quote-cta');
    expect(pageHtml).toContain('hero__google-proof');
    expect(pageHtml).toContain('APPEL STANDARD');
    expect(pageHtml).toContain('APPEL URGENCE');
  });

  it('8. no leftover "quick-answers__icon" class remains anywhere in the page', () => {
    expect(pageHtml).not.toContain('quick-answers__icon');
  });
});
