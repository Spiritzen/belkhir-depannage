import { describe, expect, it, beforeAll } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import IndexPage from '../src/pages/index.astro';
import PlomberiePage from '../src/pages/plomberie/index.astro';
import { googleReviewSummary, googleReviews } from '../src/data/google-reviews';
import { siteConfig } from '../src/lib/site-config';

const WRITE_URL = 'https://g.page/r/CeM9Ou9Il3SDEAE/review';
const PUBLIC_URL = 'https://g.page/r/CeM9Ou9Il3SDEAE';
let landing = '';
let plomberie = '';

const section = (html: string, id: string) =>
  html.match(new RegExp(`<section class="reviews" id="${id}"[\\s\\S]*?</section>`))?.[0] ?? '';

beforeAll(async () => {
  const container = await AstroContainer.create();
  landing = await container.renderToString(IndexPage, { request: new Request('http://localhost/') });
  plomberie = await container.renderToString(PlomberiePage, {
    request: new Request('http://localhost/plomberie/'),
  });
}, 60000);

describe('avis Google — données, liens et rendu', () => {
  it('shared data carries 4.7 / 225 / capture date', () => {
    expect(googleReviewSummary.rating).toBe(4.7);
    expect(googleReviewSummary.reviewCount).toBe(225);
    expect(googleReviewSummary.capturedAt).toBe('2026-10-27');
    expect(googleReviews).toHaveLength(3);
  });

  it('landing section renders the three real reviews with abbreviated names', () => {
    const s = section(landing, 'avis');
    for (const name of ['Corine Santer', 'Marie-Claude Rotier', 'Christophe Dequirot']) expect(s).toContain(name);
    expect(s).toContain('Avis clients');
    expect(s).toContain('4,7/5 — 225 avis Google');
    expect(s).toContain('Données Google relevées le 27 octobre 2026');
    expect(s).toContain('<ul class="reviews__grid"');
  });

  it('no placeholder and no 277 anywhere in rendered pages', () => {
    for (const html of [landing, plomberie]) {
      expect(html).not.toContain('Avis Google à connecter');
      expect(html).not.toContain('Date à venir');
      expect(html).not.toContain('Emplacement réservé');
      expect(html).not.toMatch(/\b277 avis/);
    }
  });

  it('write CTA uses the exact official link, new tab, noopener noreferrer', () => {
    expect(siteConfig.googleReviewWriteUrl).toBe(WRITE_URL);
    const s = section(landing, 'avis');
    expect(s).toContain('Laisser un avis Google');
    expect(s).toContain(`href="${WRITE_URL}"`);
    expect(s).toContain('target="_blank"');
    expect(s).toContain('rel="noopener noreferrer"');
    expect(s).toContain('aria-label="Laisser un avis sur Google (nouvel onglet)"');
  });

  it('the two Google links are exact and distinct', () => {
    expect(siteConfig.googleReviewsUrl).toBe(PUBLIC_URL);
    expect(siteConfig.googleReviewWriteUrl).toBe(WRITE_URL);
    expect(siteConfig.googleReviewsUrl).not.toBe(siteConfig.googleReviewWriteUrl);
  });

  it('each review card is a real link to the public listing (never the write form)', () => {
    for (const html of [landing, plomberie]) {
      const s = section(html, html === landing ? 'avis' : 'avis-plomberie');
      const cards = s.match(/<a [^>]*class="reviews__card"[^>]*>/g) ?? [];
      expect(cards).toHaveLength(3);
      googleReviews.forEach((review, i) => {
        expect(cards[i]).toContain(`href="${PUBLIC_URL}"`);
        expect(cards[i]).not.toContain('/review"');
        expect(cards[i]).toContain('target="_blank"');
        expect(cards[i]).toContain('rel="noopener noreferrer"');
        expect(cards[i]).toContain(`avis de ${review.author} (nouvel onglet)`);
      });
      expect(s.match(/Voir sur Google/g) ?? []).toHaveLength(3);
      // Pas de lien imbriqué : 3 cartes + CTA d'écriture + CTA « tous les avis ».
      expect(s.match(/<a /g) ?? []).toHaveLength(5);
      // Les témoignages restent dans le HTML statique.
      for (const review of googleReviews) expect(s).toContain(review.text.slice(0, 30));
    }
  });

  it('write CTA keeps the write URL and is never swapped with the cards', () => {
    const s = section(landing, 'avis');
    const cta = s.match(/<a [^>]*class="reviews__cta"[^>]*>/)?.[0] ?? '';
    expect(cta).toContain(`href="${WRITE_URL}"`);
    expect(s.match(new RegExp(WRITE_URL, 'g')) ?? []).toHaveLength(1);
  });

  it('entrance motion: progressive enhancement, 3 distinct staggers, reduced-motion neutralised', () => {
    const src = readFileSync(
      fileURLToPath(new URL('../src/components/landing/Reviews.astro', import.meta.url)),
      'utf8',
    );
    // Masquage uniquement derrière la classe posée par le script (visible sans JS).
    expect(landing).not.toMatch(/class="reviews reviews--motion-ready/);
    expect(src).toMatch(/\.reviews--motion-ready \.reviews__item \{[^}]*opacity: 0/);
    expect(src).not.toMatch(/\n  \.reviews__item \{[^}]*opacity: 0/);
    for (const d of ['0ms', '120ms', '240ms']) expect(src).toContain(`transition-delay: ${d}`);
    expect(src).toContain("matchMedia('(prefers-reduced-motion: reduce)')");
    const reduced = src.slice(src.lastIndexOf('@media (prefers-reduced-motion: reduce)'));
    expect(reduced).toMatch(/opacity: 1;[\s\S]*transform: none;[\s\S]*filter: none;/);
    expect(reduced).toContain('animation: none');
  });

  it('metier pages reuse the shared source', () => {
    const s = section(plomberie, 'avis-plomberie');
    expect(s).toContain('Corine Santer');
    expect(s).toContain('4,7/5 — 225 avis Google');
    expect(s).toContain(`href="${WRITE_URL}"`);
  });

  it('write URL literal lives only in site-config; no third-party script/iframe in the section', () => {
    const root = fileURLToPath(new URL('../src', import.meta.url));
    const hits: string[] = [];
    const walk = (d: string) => {
      for (const f of readdirSync(d)) {
        const p = `${d}/${f}`;
        if (statSync(p).isDirectory()) walk(p);
        else if (readFileSync(p, 'utf8').includes('CeM9Ou9Il3SDEAE')) hits.push(f);
      }
    };
    walk(root);
    expect(hits).toEqual(['site-config.ts']);
    const s = section(landing, 'avis');
    expect(s).not.toMatch(/<iframe|<script|googleapis|api[_-]?key/i);
  });

  it('keeps prefers-reduced-motion handling in the reviews styles', () => {
    const src = readFileSync(
      fileURLToPath(new URL('../src/components/landing/Reviews.astro', import.meta.url)),
      'utf8',
    );
    expect(src).toContain('prefers-reduced-motion');
  });
});
