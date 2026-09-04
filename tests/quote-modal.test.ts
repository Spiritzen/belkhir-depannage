import { describe, expect, it, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import IndexPage from '../src/pages/index.astro';
import PlomberiePage from '../src/pages/plomberie/index.astro';

// Tests ciblés pour la modale partagée « Demander un devis » (MICRO-SPRINT,
// 04/09/2026, PROMPT_CLAUDE_CODE_MICRO_SPRINT_MODALE_DEVIS.txt) : présence
// unique par page (landing ET page métier, via BaseLayout), structure du
// formulaire, accessibilité, garde-fous « aucun envoi réseau réel », et
// connexion du bouton existant du Hero. Validation proportionnée demandée
// par le prompt de mission — pas de campagne Playwright.
let indexHtml = '';
let plomberieHtml = '';
let componentSource = '';

beforeAll(async () => {
  const container = await AstroContainer.create();
  indexHtml = await container.renderToString(IndexPage, {
    request: new Request('http://localhost/'),
  });
  plomberieHtml = await container.renderToString(PlomberiePage, {
    request: new Request('http://localhost/plomberie/'),
  });

  componentSource = readFileSync(
    fileURLToPath(new URL('../src/components/ui/QuoteModal.astro', import.meta.url)),
    'utf-8',
  );
}, 30000);

describe('modale devis — présence unique par page, via BaseLayout', () => {
  it('renders exactly one <dialog id="quote-modal"> on the landing page', () => {
    const occurrences = indexHtml.match(/<dialog[^>]*id="quote-modal"/g) ?? [];
    expect(occurrences).toHaveLength(1);
  });

  it('renders exactly one <dialog id="quote-modal"> on a metier page too (available everywhere via BaseLayout, never re-included manually)', () => {
    const occurrences = plomberieHtml.match(/<dialog[^>]*id="quote-modal"/g) ?? [];
    expect(occurrences).toHaveLength(1);
  });

  it('the real native <dialog> element is used, not a hand-rolled div (native focus trap/Escape/inert background, no extra JS needed for those)', () => {
    expect(componentSource).toContain('<dialog');
    expect(componentSource).not.toMatch(/role="dialog"[^>]*aria-modal/);
  });
});

describe('modale devis — accessibilité de la boîte', () => {
  it('is labelled and described by real, present ids', () => {
    expect(componentSource).toContain('aria-labelledby="quote-modal-title"');
    expect(componentSource).toContain('aria-describedby="quote-modal-desc"');
    expect(indexHtml).toContain('id="quote-modal-title"');
    expect(indexHtml).toContain('id="quote-modal-desc"');
  });

  it('renders the exact validated title and intro text', () => {
    expect(indexHtml).toContain('Demander un devis gratuit');
    expect(indexHtml).toContain(
      'Décrivez votre situation. Ces informations seront uniquement utilisées pour vous recontacter',
    );
  });
});

describe('modale devis — formulaire complet', () => {
  it('has all seven required-or-optional fields with real <label for> associations', () => {
    const fieldIds = [
      'quote-name',
      'quote-phone',
      'quote-location',
      'quote-service',
      'quote-delay',
      'quote-description',
      'quote-consent',
    ];
    for (const id of fieldIds) {
      expect(indexHtml).toContain(`id="${id}"`);
      expect(indexHtml).toContain(`for="${id}"`);
    }
  });

  it('marks exactly the six mandatory fields as required — "Délai souhaité" stays optional', () => {
    const requiredCount = (componentSource.match(/\brequired\b/g) ?? []).length;
    expect(requiredCount).toBe(6);
    const delayField = componentSource.match(/<select id="quote-delay"[^>]*>/)?.[0] ?? '';
    expect(delayField).not.toContain('required');
  });

  it('the phone field uses a real tel input with a mobile telephone keyboard', () => {
    expect(componentSource).toMatch(
      /id="quote-phone"[^>]*type="tel"|type="tel"[^>]*id="quote-phone"/,
    );
    expect(componentSource).toContain('inputmode="tel"');
  });

  it('the service select lists exactly the six validated options, in order', () => {
    const optionsBlock = componentSource.match(/id="quote-service"[\s\S]*?<\/select>/)?.[0] ?? '';
    const labels = Array.from(optionsBlock.matchAll(/<option[^>]*>([^<]+)<\/option>/g)).map(
      (m) => m[1],
    );
    expect(labels).toEqual([
      'Choisir…',
      'Plomberie',
      'Chauffage',
      'Serrurerie',
      'Vitrerie',
      'Rideaux métalliques',
      'Autre',
    ]);
  });

  it('the delay select lists exactly the four validated options, in order', () => {
    const optionsBlock = componentSource.match(/id="quote-delay"[\s\S]*?<\/select>/)?.[0] ?? '';
    const labels = Array.from(optionsBlock.matchAll(/<option[^>]*>([^<]+)<\/option>/g)).map(
      (m) => m[1],
    );
    expect(labels).toEqual([
      'Dès que possible',
      'Aujourd’hui',
      'Sous 48 heures',
      'Intervention planifiée',
    ]);
  });

  it('the consent checkbox uses the exact validated wording', () => {
    expect(indexHtml).toContain(
      'J’accepte que mes informations soient utilisées uniquement pour traiter ma demande et me',
    );
  });

  it('every required field has an associated, initially-hidden error paragraph wired via aria-describedby', () => {
    const requiredFieldIds = [
      'quote-name',
      'quote-phone',
      'quote-location',
      'quote-service',
      'quote-description',
      'quote-consent',
    ];
    for (const id of requiredFieldIds) {
      expect(componentSource).toContain(`aria-describedby="${id}-error"`);
      expect(componentSource).toMatch(new RegExp(`id="${id}-error"[^>]*role="alert"[^>]*hidden`));
    }
  });

  it('never adds a file attachment field', () => {
    expect(componentSource).not.toContain('type="file"');
  });
});

// Seules les lignes de code réellement exécutées comptent pour les
// garde-fous « aucun envoi réseau/succès simulé » ci-dessous — le bloc de
// commentaire « FUTUR ENDPOINT PHP » documente volontairement, en exemple
// commenté, la forme du futur appel `fetch(...)` et du futur message de
// succès ; il ne doit pas faire échouer ces tests.
const activeCodeLines = componentSource
  .split('\n')
  .filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
  .join('\n');

describe('modale devis — aucun envoi réseau réel', () => {
  it('never calls fetch, XMLHttpRequest or navigator.sendBeacon in active (non-commented) code', () => {
    expect(activeCodeLines).not.toMatch(/\bfetch\s*\(/);
    expect(activeCodeLines).not.toContain('XMLHttpRequest');
    expect(activeCodeLines).not.toContain('sendBeacon');
  });

  it('always calls preventDefault on submit — a real HTML form POST is impossible', () => {
    expect(componentSource).toMatch(
      /submit['"],?\s*\(event\)\s*=>\s*{\s*[\s\S]*?event\.preventDefault\(\)/,
    );
  });

  // MICRO-CORRECTION UI (04/09/2026) : la mention statique « Envoi bientôt
  // disponible », affichée en permanence sous le bouton, a été supprimée —
  // l'information honnête sur l'indisponibilité réelle de l'envoi reste
  // communiquée, mais seulement au moment où l'utilisateur tente réellement
  // d'envoyer (message dans #quote-modal-status), jamais de façon statique.
  it('never shows the removed static "Envoi bientôt disponible" note — the honest not-yet-available message only appears in the live status region, on an actual submit attempt', () => {
    expect(componentSource).not.toContain('Envoi bientôt disponible');
    expect(componentSource).not.toContain('quote-modal-submit-note');
    expect(componentSource).toContain(
      'L’envoi en ligne n’est pas encore disponible. Merci de nous appeler directement en attendant.',
    );
    expect(componentSource).toContain('id="quote-modal-status"');
  });

  it('never simulates a success state or message in active (non-commented) code', () => {
    const lower = activeCodeLines.toLowerCase();
    expect(lower).not.toContain('demande envoyée');
    expect(lower).not.toContain('succès');
    expect(lower).not.toContain('merci pour votre demande');
  });

  it('documents a single, clearly marked future PHP endpoint anchor point', () => {
    expect(componentSource).toContain('FUTUR ENDPOINT PHP');
  });

  it('never writes to localStorage/sessionStorage (no local persistence of the submitted data)', () => {
    expect(componentSource).not.toContain('localStorage');
    expect(componentSource).not.toContain('sessionStorage');
  });
});

describe('modale devis — fermeture (les quatre mécanismes) et restitution', () => {
  it('has a real close button (×) and a real "Annuler" button, both type="button" (never submit)', () => {
    expect(componentSource).toMatch(
      /id="quote-modal-close-btn"[^>]*>|<button[^>]*id="quote-modal-close-btn"/,
    );
    expect(indexHtml).toContain('id="quote-modal-close-btn"');
    expect(indexHtml).toContain('id="quote-modal-cancel-btn"');
    expect(componentSource).toMatch(/<button type="button" class="quote-modal__cancel"/);
  });

  it('relies on the native <dialog> Escape/cancel behavior — no manual keydown Escape handler duplicated', () => {
    expect(componentSource).not.toContain("key === 'Escape'");
  });

  it('detects outside clicks on pointerdown, via the real bounding rect of the dialog — the active handler never compares event.target === dialog directly (a comment explains why that alone is unreliable)', () => {
    expect(componentSource).toContain("addEventListener('pointerdown'");
    expect(componentSource).toContain('getBoundingClientRect');
    expect(activeCodeLines).not.toContain('event.target === dialog');
  });

  // CORRECTION CIBLÉE (04/09/2026) : les <select> ("Type d'intervention",
  // "Délai souhaité") fermaient la modale à tort à la sélection d'une
  // <option>, les coordonnées du clic synthétique reconstitué par le
  // navigateur après fermeture du menu natif pouvant tomber hors du
  // rectangle du <dialog>. Le correctif ignore d'abord tout événement dont
  // la cible est un véritable descendant du <dialog>, quelles que soient
  // ses coordonnées, avant tout calcul de rectangle.
  it('never closes on a real interaction with modal content — the pointerdown handler bails out first for any descendant target, before any coordinate math', () => {
    const handlerBlock = componentSource.match(
      /addEventListener\('pointerdown', \(event\) => \{[\s\S]*?\n {4}\}\);/,
    )?.[0];
    expect(handlerBlock).toBeDefined();
    // Le contains()-guard doit être la toute première instruction du bloc,
    // avant tout accès à getBoundingClientRect/clientX/clientY.
    const guardIndex = handlerBlock!.indexOf('dialog!.contains(target)');
    const rectIndex = handlerBlock!.indexOf('getBoundingClientRect');
    expect(guardIndex).toBeGreaterThan(-1);
    expect(rectIndex).toBeGreaterThan(-1);
    expect(guardIndex).toBeLessThan(rectIndex);
    expect(handlerBlock).toMatch(/target !== dialog && dialog!\.contains\(target\)/);
    expect(handlerBlock).toContain('return;');
  });

  it('a single "close" event listener drives cleanup for all four closing paths (scroll unlock + focus restore)', () => {
    const closeListenerCount = (componentSource.match(/addEventListener\('close'/g) ?? []).length;
    expect(closeListenerCount).toBe(1);
    expect(componentSource).toMatch(/addEventListener\('close', \(\) => {[\s\S]*?quote-modal-open/);
  });

  it('reuses the exact scroll-lock convention already validated by MobileDrawer.astro (html.<class>-open { overflow: hidden }), on its own distinct class name — never actually declaring a CSS rule on html.drawer-open itself (the doc comment may still mention it by name for context)', () => {
    expect(componentSource).toContain('html.quote-modal-open');
    expect(componentSource).toContain('overflow: hidden');
    expect(activeCodeLines).not.toContain('html.drawer-open {');
  });
});

describe('modale devis — direction artistique (esprit "modales IRP")', () => {
  it('uses the anthracite/orange palette tokens, never a new arbitrary color system', () => {
    expect(componentSource).toContain('var(--color-anthracite-950)');
    expect(componentSource).toMatch(/border:\s*1px solid rgba\(255, 105, 0,/);
    expect(componentSource).toContain('var(--radius-lg)');
  });

  it('the backdrop is darkened and blurred with backdrop-filter, with a solid-opacity fallback (never leaves text transparent)', () => {
    expect(componentSource).toContain('::backdrop');
    expect(componentSource).toContain('backdrop-filter: blur');
    expect(componentSource).toMatch(/@supports not \(\(backdrop-filter/);
  });

  it('uses dvh for the max-height (mobile browser chrome safety), per the prompt of mission', () => {
    expect(componentSource).toContain('dvh');
  });

  it('never introduces a new dependency (no React import, no new package)', () => {
    expect(componentSource).not.toMatch(/from ['"]react['"]/);
    expect(componentSource).not.toMatch(/from ['"](?!\.\/|\.\.\/|astro:)/);
  });
});

describe('bouton Hero landing — connecté à la modale partagée', () => {
  it('the "Demander un devis gratuit" button is a real, always-enabled trigger (never a link, never disabled)', () => {
    const match = indexHtml.match(/<(a|button)[^>]*class="hero__quote-cta"[^>]*>/);
    expect(match).not.toBeNull();
    expect(match?.[1]).toBe('button');
    expect(match?.[0] ?? '').toContain('data-quote-trigger');
    expect(match?.[0] ?? '').not.toContain('disabled');
    expect(match?.[0] ?? '').not.toMatch(/href=/);
  });
});

describe('non-régression — pages métier sans bouton devis existant (constat, non ajouté par ce micro-sprint)', () => {
  it('plomberie has no [data-quote-trigger] element of its own — the modal is present globally (BaseLayout) but nothing on this page opens it, and this micro-sprint did not invent one', () => {
    // La modale globale (rendue par BaseLayout sur chaque page) contient
    // elle-même le texte « Demander un devis gratuit » dans son propre
    // titre, et son <script> embarqué référence la chaîne
    // `data-quote-trigger` comme sélecteur (`querySelectorAll`) — chercher
    // ces chaînes sur toute la page donnerait donc toujours un faux positif.
    // Seule la présence réelle de l'attribut sur une balise (jamais dans le
    // script) prouverait qu'un déclencheur a été ajouté ici.
    const htmlWithoutScripts = plomberieHtml.replace(/<script[\s\S]*?<\/script>/g, '');
    expect(htmlWithoutScripts).not.toMatch(/<[a-z][^>]*\sdata-quote-trigger/i);
  });
});
