import { describe, expect, it, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import IndexPage from '../src/pages/index.astro';
import Navbar from '../src/components/layout/Navbar.astro';
import PhoneCta from '../src/components/ui/PhoneCta.astro';
import { getPhoneCta, NAVBAR_PHONE_PREVIEW } from '../src/lib/phone';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

let pageHtml = '';
let navbarHtml = '';

beforeAll(async () => {
  const container = await AstroContainer.create();
  pageHtml = await container.renderToString(IndexPage, {
    request: new Request('http://localhost/'),
  });
  navbarHtml = await container.renderToString(Navbar, { partial: true });
}, 30000);

// Tests couvrant la section 12 du prompt de la retouche 01 (navbar sticky,
// fine et élégante). Complète tests/landing-content.test.ts sans le
// dupliquer, en se concentrant sur ce que cette retouche a changé.
describe('retouche 01 — navbar (contenu et garde-fous)', () => {
  it('1. shows "Zones couvertes" without altering the label', () => {
    expect(navbarHtml).toContain('Zones couvertes');
  });

  it('2. applies a nowrap rule to navbar nav links (no mid-word wrapping)', () => {
    // Vérification directe de la feuille de style du composant plutôt qu'une
    // capture pixel : le fichier source doit bien porter la règle sur les
    // liens de la navigation desktop.
    const navbarSourcePath = fileURLToPath(
      new URL('../src/components/layout/Navbar.astro', import.meta.url),
    );
    const source = readFileSync(navbarSourcePath, 'utf-8');
    const navLinkRuleMatch = source.match(/\.navbar__nav a\s*{[^}]*}/);

    expect(navLinkRuleMatch).not.toBeNull();
    expect(navLinkRuleMatch?.[0]).toContain('white-space: nowrap');
  });

  it('3. shows the compact navbar placeholder labels "APPEL STANDARD" and "APPEL URGENCE"', () => {
    expect(navbarHtml).toContain('APPEL STANDARD');
    expect(navbarHtml).toContain('APPEL URGENCE');
  });

  // Correctif d'architecture (01/09/2026) : le numéro d'urgence est
  // désormais officiel et versionné directement dans site-config.ts,
  // jamais dépendant de process.env — il n'affiche donc plus le placeholder
  // compact "06 XX XX XX XX" mais le vrai numéro. Le standard, lui, reste
  // provisoire et continue d'afficher son placeholder compact.
  it('4. shows "03 XX XX XX XX" for the still-provisional standard number, and the real emergency number', () => {
    expect(navbarHtml).toContain('03 XX XX XX XX');
    expect(navbarHtml).toContain('06 49 62 16 19');
    expect(navbarHtml).not.toContain('06 XX XX XX XX');
  });

  it('5. never generates a tel: link for the standard placeholder; the emergency button is a real tel: link', () => {
    expect(navbarHtml).not.toMatch(/data-phone-role="standard"[^>]*href="tel:/);
    // Standard : rendu en <button disabled>, jamais un lien cliquable.
    expect(navbarHtml).toMatch(/<button[^>]*disabled[^>]*data-phone-role="standard"/);
    // Urgence : vrai lien <a>, jamais un bouton désactivé.
    expect(navbarHtml).toMatch(/<a[^>]*href="tel:\+33649621619"[^>]*data-phone-role="emergency"/);
    expect(navbarHtml).not.toMatch(/<button[^>]*data-phone-role="emergency"/);
  });

  it('6a. falls back to the compact preview when the phone is still a placeholder', async () => {
    const container = await AstroContainer.create();
    const placeholderCta = getPhoneCta({
      role: 'standard',
      label: 'Standard',
      subLabel: 'Demandes, devis et suivi',
      display: null,
      international: null,
    });

    const html = await container.renderToString(PhoneCta, {
      partial: true,
      props: { cta: placeholderCta, previewOverride: NAVBAR_PHONE_PREVIEW.standard },
    });

    expect(html).toContain('APPEL STANDARD');
    expect(html).toContain('03 XX XX XX XX');
    expect(html).not.toContain('href="tel:');
  });

  it('6b. ignores the preview override and keeps the real number + real tel: link once provided', async () => {
    const container = await AstroContainer.create();
    const realCta = getPhoneCta({
      role: 'standard',
      label: 'Standard',
      subLabel: 'Demandes, devis et suivi',
      display: '03 22 00 00 00',
      international: '+33322000000',
    });

    const html = await container.renderToString(PhoneCta, {
      partial: true,
      props: { cta: realCta, previewOverride: NAVBAR_PHONE_PREVIEW.standard },
    });

    expect(html).toContain('href="tel:+33322000000"');
    expect(html).toContain('03 22 00 00 00');
    expect(html).not.toContain('03 XX XX XX XX');
  });

  it('7. keeps noindex while the real phone numbers are absent', () => {
    expect(pageHtml).toContain('content="noindex, nofollow"');
  });

  it('8. keeps the mobile drawer accessible (unchanged by this retouche)', () => {
    expect(pageHtml).toContain('id="mobile-drawer"');
    expect(pageHtml).toContain('role="dialog"');
    expect(pageHtml).toContain('aria-modal="true"');
  });

  it('9. keeps the hero H1 wording intact and free of any navbar-style compact CTA leaking in', () => {
    const h1Match = pageHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    const h1Text = (h1Match?.[1] ?? '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    expect(h1Text).toBe('Dépannage d’urgence 24h/24 et 7j/7 dans les Hauts-de-France');
    // Le Hero (retouche 03) n'a plus de CTA téléphonique du tout : vérifie
    // surtout l'absence du format compact propre à la navbar (aucune fuite
    // croisée entre les deux composants).
    const heroMatch = pageHtml.match(/id="accueil"[\s\S]*?<\/section>/);
    expect(heroMatch?.[0]).not.toContain('APPEL STANDARD');
    expect(heroMatch?.[0]).not.toContain('APPEL URGENCE');
  });

  it('10. sizes the navbar phone buttons at least 44px tall via the shared touch-target token', () => {
    const navbarSourcePath = fileURLToPath(
      new URL('../src/components/layout/Navbar.astro', import.meta.url),
    );
    const source = readFileSync(navbarSourcePath, 'utf-8');
    const navPhoneRuleMatch = source.match(/\.navbar \.navbar__phone\s*{[^}]*}/);

    expect(navPhoneRuleMatch).not.toBeNull();
    // 48px déclaré explicitement, dans la plage 46–50px demandée et toujours
    // au-dessus du minimum accessible de 44px.
    expect(navPhoneRuleMatch?.[0]).toContain('min-height: 48px');
  });
});

// Tests couvrant la section 11 du prompt de la retouche 02 (blur renforcé et
// signature orange). Le fond translucide et le blur eux-mêmes ne sont pas
// mesurables en layout via l'Astro Container API (pas de rendu CSS réel) :
// vérifiés visuellement en navigateur (voir le rapport de cette retouche).
// Ici, on vérifie que les bonnes valeurs sont bien déclarées dans la source.
describe('retouche 02 — navbar (blur renforcé et signature orange)', () => {
  const navbarSourcePath = fileURLToPath(
    new URL('../src/components/layout/Navbar.astro', import.meta.url),
  );
  const navbarSource = readFileSync(navbarSourcePath, 'utf-8');
  const tokensSourcePath = fileURLToPath(new URL('../src/styles/tokens.css', import.meta.url));
  const tokensSource = readFileSync(tokensSourcePath, 'utf-8');

  it('1. renders the full brand text "Belkhir Dépannage" with no stray whitespace', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Navbar, { partial: true });
    const brandMatch = html.match(/<span class="navbar__brand-text"[^>]*>([\s\S]*?)<\/a>/);
    expect(brandMatch).not.toBeNull();

    // Le texte visible reconstitué (balises retirées) doit être exactement
    // « Belkhir Dépannage », sans espace ni coupure parasite.
    const visibleText = (brandMatch?.[1] ?? '').replace(/<[^>]+>/g, '');
    expect(visibleText).toBe('Belkhir Dépannage');
  });

  it('2. dedicates a distinct element to the orange "B"', () => {
    expect(navbarSource).toContain('<span class="navbar__brand-initial">B</span>elkhir');
  });

  it('3. dedicates a distinct element to the orange "D"', () => {
    expect(navbarSource).toContain('<span class="navbar__brand-initial">D</span>épannage');
  });

  it('4. colors the initials using the brand color token, not a hardcoded value', () => {
    const ruleMatch = navbarSource.match(/\.navbar__brand-initial\s*{[^}]*}/);
    expect(ruleMatch).not.toBeNull();
    expect(ruleMatch?.[0]).toContain('color: var(--color-brand)');
  });

  it('5. keeps #FF6900 as the flagship brand color behind the token', () => {
    expect(tokensSource).toContain('--color-orange-600: #ff6900');
    expect(tokensSource).toContain('--color-brand: var(--color-orange-600)');
  });

  it('6. sets the initial background opacity (0.55, lightened per follow-up visual feedback)', () => {
    const ruleMatch = navbarSource.match(/\.navbar\s*{[^}]*}/);
    expect(ruleMatch?.[0]).toContain('rgba(255, 255, 255, 0.55)');
  });

  it('7. sets the scrolled background opacity (0.65, lightened per follow-up visual feedback)', () => {
    const ruleMatch = navbarSource.match(/\.navbar\.is-scrolled\s*{[^}]*}/);
    expect(ruleMatch?.[0]).toContain('rgba(255, 255, 255, 0.65)');
  });

  it('8. sets the reinforced blur (28px)', () => {
    expect(navbarSource).toContain('blur(28px) saturate(120%)');
    expect(navbarSource).toContain('-webkit-backdrop-filter: blur(28px) saturate(120%)');
  });

  it('9. only triggers the infinite logo animation inside a real hover context', () => {
    const hoverBlockMatch = navbarSource.match(
      /@media \(hover: hover\) and \(pointer: fine\)\s*{[^}]*{[^}]*}[^}]*}/,
    );
    expect(hoverBlockMatch).not.toBeNull();
    expect(hoverBlockMatch?.[0]).toContain('.navbar__brand:hover .navbar__logo');
    expect(hoverBlockMatch?.[0]).toContain(
      'animation: navbar-logo-hover-bob 850ms ease-in-out infinite',
    );
  });

  it('10. applies the hover animation to the logo image only, never to the brand text', () => {
    expect(navbarSource).not.toMatch(/\.navbar__brand-text[^{]*{\s*[^}]*animation/);
    expect(navbarSource).not.toMatch(/\.navbar__brand\s*{[^}]*animation:\s*navbar-logo-hover-bob/);
  });

  it('11. disables the logo animation under prefers-reduced-motion (hover and focus-visible)', () => {
    const reducedMotionBlockMatch = navbarSource.match(
      /@media \(prefers-reduced-motion: reduce\)\s*{[^}]*}\s*}/,
    );
    expect(reducedMotionBlockMatch).not.toBeNull();
    expect(reducedMotionBlockMatch?.[0]).toContain('.navbar__brand:hover .navbar__logo');
    expect(reducedMotionBlockMatch?.[0]).toContain('.navbar__brand:focus-visible .navbar__logo');
    expect(reducedMotionBlockMatch?.[0]).toContain('animation: none');
  });

  it('12. keeps "Zones couvertes" on a single line (nowrap rule still present)', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Navbar, { partial: true });
    expect(html).toContain('Zones couvertes');

    const navLinkRuleMatch = navbarSource.match(/\.navbar__nav a\s*{[^}]*}/);
    expect(navLinkRuleMatch?.[0]).toContain('white-space: nowrap');
  });

  it('13. keeps the still-provisional standard number non-callable; the official emergency number is callable', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Navbar, { partial: true });
    expect(html).not.toMatch(/data-phone-role="standard"[^>]*href="tel:/);
    expect(html).toContain('03 XX XX XX XX');
    expect(html).toContain('06 49 62 16 19');
    expect(html).toMatch(/href="tel:\+33649621619"[^>]*data-phone-role="emergency"/);
  });

  it('14. keeps noindex while real phone numbers are absent', () => {
    expect(pageHtml).toContain('content="noindex, nofollow"');
  });

  it('15. leaves the hero H1 wording intact (updated by retouche 03, unaffected by the navbar retouches)', () => {
    const h1Match = pageHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    const h1Text = (h1Match?.[1] ?? '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    expect(h1Text).toBe('Dépannage d’urgence 24h/24 et 7j/7 dans les Hauts-de-France');
  });
});

// Retour visuel de Sébastien (31/08/2026, hors prompt) : en dessous de
// 46rem, retirer le badge téléphone rouge de la navbar (redondant avec la
// barre d'appel mobile fixe) et afficher « Belkhir Dépannage » (B et D en
// orange) à la place, juste à droite du logo.
describe('retouche 03 (retour visuel) — marque visible sur mobile, plus de badge urgence dans la navbar', () => {
  const navbarSourcePath = fileURLToPath(
    new URL('../src/components/layout/Navbar.astro', import.meta.url),
  );
  const navbarSource = readFileSync(navbarSourcePath, 'utf-8');

  it('1. hides both navbar phone CTAs below the 46rem breakpoint', () => {
    const mobileBlockMatch = navbarSource.match(/@media \(max-width: 46rem\)\s*{[^}]*}\s*}/);
    expect(mobileBlockMatch).not.toBeNull();
    expect(mobileBlockMatch?.[0]).toContain('.navbar__phone');
    expect(mobileBlockMatch?.[0]).toContain('display: none');
  });

  it('2. no longer hides the brand text at the 46rem breakpoint', () => {
    const mobileBlockMatch = navbarSource.match(/@media \(max-width: 46rem\)\s*{[^}]*}\s*}/);
    expect(mobileBlockMatch?.[0]).not.toContain('navbar__brand-text');
  });

  it('3. keeps the mobile call bar as the always-visible source of both phone numbers', () => {
    expect(pageHtml).toContain('id="mobile-call-bar"');
  });
});
