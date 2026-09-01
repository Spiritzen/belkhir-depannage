import { describe, expect, it, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Sprint correctif d'architecture (01/09/2026) : la première version de ce
// sprint plaçait le numéro d'urgence extrême dans un `.env` local, lu via
// `process.env` par `site-config.ts`. `astro build`/`astro preview`
// chargent bien `.env` dans `process.env` dans cet environnement, mais
// `astro dev` ne le fait PAS — le numéro n'apparaissait donc jamais sous
// `npm run dev`, le pipeline réellement utilisé par Sébastien au quotidien.
//
// Correctif : le numéro (donnée PUBLIQUE, pas un secret) est désormais
// versionné directement dans `src/lib/site-config.ts`
// (EMERGENCY_PHONE_DISPLAY / EMERGENCY_PHONE_INTERNATIONAL), sans lecture
// de `process.env`. Ce fichier de test simule délibérément l'absence
// TOTALE des variables d'environnement d'urgence (y compris si l'ambiante
// du poste en définit une par accident) pour prouver que le rendu ne
// dépend plus d'elles, exactement le scénario qui faisait échouer
// `astro dev` auparavant.
delete process.env.EMERGENCY_PHONE_DISPLAY;
delete process.env.EMERGENCY_PHONE_INTERNATIONAL;
// Le standard reste provisoire : on garantit qu'aucune variable ambiante ne
// vienne accidentellement le renseigner pendant ce test.
delete process.env.STANDARD_PHONE_DISPLAY;
delete process.env.STANDARD_PHONE_INTERNATIONAL;

const REAL_DISPLAY = '06 49 62 16 19';
const REAL_TEL_HREF = 'tel:+33649621619';
// `+` est un métacaractère regex : toujours utiliser cette version échappée
// dans `new RegExp(...)`, jamais REAL_TEL_HREF directement.
const REAL_TEL_HREF_RE = REAL_TEL_HREF.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

let pageHtml = '';
let navbarHtml = '';
let footerHtml = '';
let callBarHtml = '';
let drawerHtml = '';

beforeAll(async () => {
  const { experimental_AstroContainer: AstroContainer } = await import('astro/container');
  const { default: IndexPage } = await import('../src/pages/index.astro');

  const container = await AstroContainer.create();
  pageHtml = await container.renderToString(IndexPage, {
    request: new Request('http://localhost/'),
  });

  navbarHtml = pageHtml.match(/<header class="navbar"[\s\S]*?<\/header>/)?.[0] ?? '';
  footerHtml = pageHtml.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? '';
  callBarHtml = pageHtml.match(/<div class="mobile-call-bar"[\s\S]*?<\/div>/)?.[0] ?? '';
  drawerHtml = pageHtml.match(/id="mobile-drawer"[\s\S]*?<\/div>\s*<button/)?.[0] ?? '';
}, 30000);

describe('correctif d’architecture — la configuration officielle ne dépend plus de process.env', () => {
  it('1. src/lib/site-config.ts verse le numéro directement dans le code, jamais depuis .env', () => {
    const filePath = fileURLToPath(new URL('../src/lib/site-config.ts', import.meta.url));
    const source = readFileSync(filePath, 'utf-8');
    expect(source).toContain("const EMERGENCY_PHONE_DISPLAY = '06 49 62 16 19';");
    expect(source).toContain("const EMERGENCY_PHONE_INTERNATIONAL = '+33649621619';");
    // La construction de `emergencyPhone` n'appelle plus `resolvePhoneNumber`
    // (qui lit `env[...]`) : elle utilise directement les constantes ci-dessus.
    const emergencyBlockMatch = source.match(/const emergencyPhone: PhoneNumberConfig = \{[^}]*\}/);
    expect(emergencyBlockMatch).not.toBeNull();
    expect(emergencyBlockMatch?.[0]).not.toContain('env[');
    expect(emergencyBlockMatch?.[0]).not.toContain('resolvePhoneNumber');
    expect(emergencyBlockMatch?.[0]).toContain('EMERGENCY_PHONE_DISPLAY');
    expect(emergencyBlockMatch?.[0]).toContain('EMERGENCY_PHONE_INTERNATIONAL');
  });

  it('2. .env / .env.example ne définissent plus EMERGENCY_PHONE_* (mais gardent les autres variables intactes)', () => {
    const envPath = fileURLToPath(new URL('../.env', import.meta.url));
    const envSource = readFileSync(envPath, 'utf-8');
    // Aucune ligne d'affectation active ou commentée (le nom peut encore
    // apparaître dans la prose explicative du fichier, ce qui est légitime).
    expect(envSource).not.toMatch(/^#?\s*EMERGENCY_PHONE_DISPLAY=/m);
    expect(envSource).not.toMatch(/^#?\s*EMERGENCY_PHONE_INTERNATIONAL=/m);
    // Les variables sans rapport restent présentes, inchangées.
    expect(envSource).toContain('ENABLE_INDEXING=false');
    expect(envSource).toMatch(/^# STANDARD_PHONE_DISPLAY=/m);

    const examplePath = fileURLToPath(new URL('../.env.example', import.meta.url));
    const exampleSource = readFileSync(examplePath, 'utf-8');
    expect(exampleSource).not.toMatch(/^EMERGENCY_PHONE_DISPLAY=/m);
    expect(exampleSource).not.toMatch(/^EMERGENCY_PHONE_INTERNATIONAL=/m);
    expect(exampleSource).not.toMatch(/^# EMERGENCY_PHONE_DISPLAY=/m);
  });

  it('3. le rendu fonctionne à l’identique lorsque les variables d’environnement sont totalement absentes', async () => {
    // process.env.EMERGENCY_PHONE_* ont été explicitement supprimés en tête
    // de fichier, avant tout import — exactement le scénario `astro dev`.
    expect(process.env.EMERGENCY_PHONE_DISPLAY).toBeUndefined();
    expect(process.env.EMERGENCY_PHONE_INTERNATIONAL).toBeUndefined();

    const { siteConfig } = await import('../src/lib/site-config');
    expect(siteConfig.emergencyPhone.display).toBe(REAL_DISPLAY);
    expect(siteConfig.emergencyPhone.international).toBe('+33649621619');
  });

  it('4. getPhoneCta retourne un vrai lien tel: même sans aucune variable d’environnement', async () => {
    const { getPhoneCta } = await import('../src/lib/phone');
    const { siteConfig } = await import('../src/lib/site-config');
    const cta = getPhoneCta(siteConfig.emergencyPhone);
    expect(cta.kind).toBe('link');
    if (cta.kind === 'link') {
      expect(cta.href).toBe(REAL_TEL_HREF);
      expect(cta.display).toBe(REAL_DISPLAY);
    }
  });

  it('5. siteConfig.standardPhone reste explicitement non configuré (aucune régression)', async () => {
    const { siteConfig } = await import('../src/lib/site-config');
    expect(siteConfig.standardPhone.display).toBeNull();
    expect(siteConfig.standardPhone.international).toBeNull();
  });

  it('6. aucun composant ne code le numéro en dur : tous le lisent via siteConfig.emergencyPhone', () => {
    const paths = [
      '../src/components/layout/Navbar.astro',
      '../src/components/layout/Footer.astro',
      '../src/components/layout/MobileCallBar.astro',
      '../src/components/layout/MobileDrawer.astro',
    ];
    for (const relativePath of paths) {
      const filePath = fileURLToPath(new URL(relativePath, import.meta.url));
      const source = readFileSync(filePath, 'utf-8');
      expect(source).not.toContain('06 49 62 16 19');
      expect(source).not.toContain('+33649621619');
      expect(source).not.toContain('tel:+336');
      expect(source).toContain('siteConfig.emergencyPhone');
      expect(source).toContain('getPhoneCta');
    }
  });
});

describe('correctif d’architecture — les quatre emplacements obligatoires (env absent)', () => {
  it('7. navbar desktop : « APPEL URGENCE » + le vrai numéro + tel: exact, sans troncature possible', () => {
    expect(navbarHtml).toContain('APPEL URGENCE');
    expect(navbarHtml).toContain(REAL_DISPLAY);
    expect(navbarHtml).toMatch(
      new RegExp(`class="[^"]*navbar__phone--emergency[^"]*"[^>]*href="${REAL_TEL_HREF_RE}"`),
    );
    expect(navbarHtml).not.toContain('06 XX XX XX XX');
  });

  // Le libellé source est "Urgence extrême" (casse mixte) partout hors
  // navbar ; `.phone-cta__label { text-transform: uppercase }` l'affiche
  // visuellement en "URGENCE EXTRÊME" (confirmé en navigateur/captures) sans
  // changer le texte du DOM — les tests vérifient donc le texte source réel.
  it('8. footer, colonne « Nous appeler » : « Urgence extrême » (affiché en capitales) + le vrai numéro + tel: exact', () => {
    expect(footerHtml).toContain('Urgence extrême');
    expect(footerHtml).toContain(REAL_DISPLAY);
    expect(footerHtml).toMatch(
      new RegExp(`<a[^>]*class="[^"]*footer__phone[^"]*"[^>]*href="${REAL_TEL_HREF_RE}"`),
    );
    // Le standard, lui, reste un bouton désactivé sans tel:.
    expect(footerHtml).toMatch(/<button[^>]*class="[^"]*footer__phone[^"]*"[^>]*disabled/);
  });

  it('9. barre sticky mobile : moitié droite entièrement cliquable, tel: exact, sans troncature', () => {
    expect(callBarHtml).toContain('Urgence extrême');
    expect(callBarHtml).toContain(REAL_DISPLAY);
    expect(callBarHtml).toMatch(new RegExp(`<a[^>]*href="${REAL_TEL_HREF_RE}"`));
    expect(callBarHtml).not.toContain('PORTABLE URG');
  });

  it('10. menu hamburger (drawer) : « Urgence extrême » (affiché en capitales) + le vrai numéro + tel: exact', () => {
    expect(drawerHtml).toContain('Urgence extrême');
    expect(drawerHtml).toContain(REAL_DISPLAY);
    expect(drawerHtml).toMatch(
      new RegExp(`<a[^>]*class="[^"]*mobile-drawer__phone[^"]*"[^>]*href="${REAL_TEL_HREF_RE}"`),
    );
  });

  it('11. exactly four tel:+33649621619 links exist on the whole page (no extra, no missing CTA)', () => {
    const matches = pageHtml.match(new RegExp(REAL_TEL_HREF_RE, 'g')) ?? [];
    expect(matches).toHaveLength(4);
  });

  it('12. all four emergency CTAs are real <a> elements, never a disabled <button>', () => {
    for (const html of [navbarHtml, footerHtml, callBarHtml, drawerHtml]) {
      const emergencyMatch = html.match(
        new RegExp(`<(a|button)[^>]*data-phone-role="emergency"[^>]*>`),
      );
      expect(emergencyMatch).not.toBeNull();
      expect(emergencyMatch?.[1]).toBe('a');
      expect(emergencyMatch?.[0]).not.toContain('disabled');
      expect(emergencyMatch?.[0]).not.toContain('aria-disabled');
    }
  });
});

describe('correctif d’architecture — absence des anciens placeholders', () => {
  it('13. plus aucune trace de "PORTABLE URGENCE À RENSEIGNER" ni de placeholder d’urgence', () => {
    expect(pageHtml).not.toContain('PORTABLE URGENCE À RENSEIGNER');
    expect(pageHtml).not.toContain('PORTABLE URGEN');
    expect(pageHtml).not.toContain('06 XX XX XX XX');
  });

  it('14. le standard, toujours provisoire, garde son placeholder légitime et son garde-fou (jamais de faux tel:)', () => {
    expect(pageHtml).toContain('NUMÉRO STANDARD À RENSEIGNER');
    expect(pageHtml).not.toMatch(/href="tel:\+3322/);
  });

  it('15. legitimate descriptive text using "portable" or "urgence" elsewhere is preserved (not stripped)', () => {
    expect(pageHtml).toContain('Portable d’urgence');
    expect(pageHtml.toLowerCase().match(/urgence/g)?.length ?? 0).toBeGreaterThan(4);
  });
});

describe('correctif d’architecture — accessibilité (inchangée par le correctif)', () => {
  it('16. chaque lien d’urgence expose un nom accessible clair (rôle + numéro), sans aria-disabled ni target=_blank', () => {
    for (const html of [navbarHtml, footerHtml, callBarHtml, drawerHtml]) {
      const linkMatch = html.match(new RegExp(`<a[^>]*href="${REAL_TEL_HREF_RE}"[\\s\\S]*?<\\/a>`));
      expect(linkMatch).not.toBeNull();
      const linkHtml = linkMatch?.[0] ?? '';
      expect(linkHtml).not.toContain('aria-disabled');
      expect(linkHtml).not.toContain('disabled');
      expect(linkHtml).not.toContain('target="_blank"');
      const visibleText = linkHtml
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      expect(visibleText.toLowerCase()).toContain('urgence');
      expect(visibleText).toContain(REAL_DISPLAY);
    }
  });

  it('17. no JavaScript click handler is used to trigger the call (native tel: only, per component source)', () => {
    const phoneCtaPath = fileURLToPath(
      new URL('../src/components/ui/PhoneCta.astro', import.meta.url),
    );
    const source = readFileSync(phoneCtaPath, 'utf-8');
    expect(source).not.toMatch(/onclick/i);
    expect(source).not.toContain('addEventListener');
    expect(source).not.toContain('window.location');
  });
});
