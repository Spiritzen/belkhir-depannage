import { describe, expect, it, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ZonesInterventionPage from '../src/pages/zones-intervention/index.astro';

// Tests ciblés pour le moteur de recherche « radar » (PROMPT_CLAUDE_CODE_
// PAGE_ZONES_INTERVENTION_RADAR.txt, sections 5, 6, 8, 9, 14, 16,
// 04/09/2026). Rendu HTML (via AstroContainer, sans navigateur — même
// convention que le reste du dépôt) pour la structure/accessibilité, plus
// des assertions sur le code source du <script> pour les garde-fous de
// confidentialité/performance qu'une simple chaîne HTML ne peut pas
// prouver. Le comportement interactif réel (sélection, carte, modale) est
// validé séparément via une passe navigateur bornée (section 17).
let pageHtml = '';
let checkerSource = '';
// Contenu du seul <script> client (jamais le frontmatter/les commentaires
// de documentation, qui nomment volontairement geo.api.gouv.fr/localStorage
// par exemple pour expliquer pourquoi ils ne sont jamais appelés/utilisés).
let scriptSource = '';

beforeAll(async () => {
  const container = await AstroContainer.create();
  pageHtml = await container.renderToString(ZonesInterventionPage, {
    request: new Request('http://localhost/zones-intervention/'),
  });

  checkerSource = readFileSync(
    fileURLToPath(new URL('../src/components/sections/CoverageChecker.astro', import.meta.url)),
    'utf-8',
  );
  scriptSource = checkerSource.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? '';
}, 30000);

describe('CoverageChecker — combobox accessible (section 6 du prompt)', () => {
  it('has a real, visible label associated with the input', () => {
    expect(pageHtml).toContain('for="coverage-checker-input"');
    expect(pageHtml).toContain('id="coverage-checker-input"');
    expect(pageHtml).toContain('Votre commune ou votre code postal');
  });

  it('wires the full combobox ARIA pattern', () => {
    expect(pageHtml).toContain('role="combobox"');
    expect(pageHtml).toContain('aria-expanded="false"');
    expect(pageHtml).toContain('aria-controls="coverage-checker-listbox"');
    expect(pageHtml).toContain('aria-autocomplete="list"');
    expect(pageHtml).toContain('id="coverage-checker-listbox"');
    expect(pageHtml).toContain('role="listbox"');
  });

  it('the result region is a live region announcing state changes', () => {
    expect(pageHtml).toMatch(
      /id="coverage-checker-result"[^>]*role="status"[^>]*aria-live="polite"/,
    );
  });

  it('never auto-selects an ambiguous commune — options are created client-side, one per rendered result', () => {
    expect(checkerSource).toContain("option.setAttribute('role', 'option')");
    expect(checkerSource).not.toMatch(/results\.length === 1[\s\S]{0,40}auto/i);
  });

  it('keyboard interactions are wired: ArrowDown/ArrowUp/Enter/Escape', () => {
    expect(checkerSource).toContain("case 'ArrowDown'");
    expect(checkerSource).toContain("case 'ArrowUp'");
    expect(checkerSource).toContain("case 'Enter'");
    expect(checkerSource).toContain("case 'Escape'");
  });

  it('placeholder matches the validated copy', () => {
    expect(pageHtml).toContain('placeholder="Ex. Amiens ou 80000"');
  });
});

describe('CoverageChecker — confidentialité et performance (sections 2, 14 du prompt)', () => {
  it('never calls geo.api.gouv.fr from the client script, only the local static snapshot', () => {
    expect(scriptSource).not.toContain('geo.api.gouv.fr');
    expect(checkerSource).toContain('data-json-src');
  });

  it('never uses localStorage, sessionStorage or a cookie in the client script', () => {
    expect(scriptSource).not.toContain('localStorage');
    expect(scriptSource).not.toContain('sessionStorage');
    expect(scriptSource).not.toContain('document.cookie');
  });

  it('displays the exact validated privacy micro-mention near the search field', () => {
    expect(pageHtml).toContain(
      'La recherche est effectuée localement dans votre navigateur et n’est pas enregistrée.',
    );
  });

  it('loads the JSON only on first focus/input, not eagerly at page load', () => {
    expect(checkerSource).toMatch(/input\.addEventListener\('focus'/);
    expect(checkerSource).toContain('function ensureLoaded');
    // Le chargement doit être mémoïsé (jamais un second fetch par frappe).
    expect(checkerSource).toContain('if (communes) return Promise.resolve(communes);');
  });

  it('never introduces a new dependency (no Fuse.js, no framework import)', () => {
    expect(checkerSource).not.toMatch(/from ['"]fuse/i);
    expect(checkerSource).not.toMatch(/from ['"]react['"]/);
  });
});

describe('CoverageChecker — états et cas limites (sections 7, 15 du prompt)', () => {
  it('renders the exact initial-state sentence', () => {
    expect(pageHtml).toContain('Recherchez une commune pour obtenir une confirmation de secteur.');
  });

  it('renders the exact unrecognized-state sentence, never asserting "non desservie"', () => {
    expect(pageHtml).toContain(
      'Nous ne pouvons pas confirmer cette commune automatiquement. Vérifiez l’orthographe',
    );
    expect(pageHtml.toLowerCase()).not.toContain('non desservie');
  });

  it('renders the exact error-state sentence for a failed snapshot load', () => {
    expect(pageHtml).toContain(
      'La vérification automatique est momentanément indisponible. Appelez-nous pour confirmer',
    );
  });

  it('provides a <noscript> fallback keeping the call CTA path sober and usable', () => {
    expect(pageHtml).toContain('<noscript>');
    expect(pageHtml).toContain('nécessite JavaScript');
  });

  it('never promises a guaranteed delay or availability in any state text', () => {
    const forbidden = ['garantie', 'immédiatement disponible', 'délai garanti'];
    for (const phrase of forbidden) {
      expect(pageHtml.toLowerCase()).not.toContain(phrase);
    }
  });
});

describe('CoverageChecker — résultat reconnu : deux CTA (section 7 du prompt)', () => {
  it('the recognized-state card carries the exact validated reassurance sentence', () => {
    expect(pageHtml).toContain(
      'Cette commune fait partie du secteur d’intervention déclaré de Belkhir Dépannage.',
    );
  });

  it('has a real "Appeler en urgence" link built from the centralized phone source', () => {
    expect(pageHtml).toMatch(/coverage-checker__cta--call"[^>]*href="tel:\+33649621619"/);
  });

  it('the "Demander un devis" button opens the shared QuoteModal (data-quote-trigger), never a second modal', () => {
    expect(pageHtml).toMatch(
      /id="coverage-checker-quote-cta"[^>]*data-quote-trigger|data-quote-trigger[^>]*id="coverage-checker-quote-cta"/,
    );
    // Un seul <dialog> de devis sur la page (le composant partagé), jamais
    // une deuxième modale créée par CoverageChecker.
    const dialogCount = (pageHtml.match(/<dialog[^>]*id="quote-modal"/g) ?? []).length;
    expect(dialogCount).toBe(1);
  });
});

describe('CoverageChecker — intégration carte (section 8 du prompt)', () => {
  it('targets the shared .coverage-map__dept-group elements, never a second map', () => {
    expect(checkerSource).toContain(
      "document.querySelectorAll<SVGGElement>('.coverage-map__dept-group')",
    );
    expect(checkerSource).not.toContain('new CoverageMapGraphic');
  });

  it('the selection pulse is one-shot (never a looping animation) and filter-based (no layout-affecting transform)', () => {
    expect(checkerSource).toContain('coverage-checker-pulse');
    expect(checkerSource).toContain('{ once: true }');
    const keyframesBlock = checkerSource.match(
      /@keyframes coverage-checker-pulse\s*\{[\s\S]*?\n {2}\}/,
    )?.[0];
    expect(keyframesBlock).toBeDefined();
    expect(keyframesBlock).toContain('filter:');
    expect(keyframesBlock).not.toContain('transform:');
  });

  it('respects prefers-reduced-motion for the pulse (immediate state change, no animation)', () => {
    expect(checkerSource).toContain('REDUCED_MOTION');
    expect(checkerSource).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?animation: none/,
    );
  });

  it('clears the previously active department before activating the new one', () => {
    expect(checkerSource).toMatch(
      /for \(const group of groups\) \{\s*group\.classList\.remove\('is-active', 'coverage-checker-pulse'\);/,
    );
  });
});

describe('page /zones-intervention/ — CoverageChecker rendu une seule fois', () => {
  it('renders exactly one .coverage-checker instance', () => {
    const occurrences = pageHtml.match(/class="coverage-checker"/g) ?? [];
    expect(occurrences).toHaveLength(1);
  });
});

// CORRECTION (même défaut trouvé et corrigé sur QuoteModal.astro le même
// jour, DOUBLE CORRECTION P0) : un `display: flex` posé sans condition sur
// `.coverage-checker__result-initial` avait la même spécificité CSS que la
// règle native `[hidden] { display: none }` — la phrase d'état initial
// restait donc visible EN MÊME TEMPS que la fiche de résultat une fois une
// commune sélectionnée (trouvé par une vérification visuelle réelle,
// jamais reproductible par une simple assertion sur le HTML statique
// puisque `hidden` est bien posé côté serveur — seule la cascade CSS
// l'annulait au rendu).
describe('CoverageChecker — le display ne doit jamais ignorer [hidden] (régression)', () => {
  it('scopes any unconditional `display` declaration on a togglable state to :not([hidden])', () => {
    const initialRule = checkerSource.match(
      /\.coverage-checker__result-initial(:not\(\[hidden\]\))?\s*\{[^}]*\}/,
    )?.[0];
    expect(initialRule).toBeDefined();
    expect(initialRule).toContain('display: flex');
    expect(initialRule).toMatch(/^\.coverage-checker__result-initial:not\(\[hidden\]\)/);
  });
});
