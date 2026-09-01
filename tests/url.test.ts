import { describe, expect, it } from 'vitest';
import { buildCanonicalUrl, normalizeBaseUrl } from '../src/lib/url';

describe('normalizeBaseUrl', () => {
  it('removes a trailing slash', () => {
    expect(normalizeBaseUrl('https://example.fr/')).toBe('https://example.fr');
  });

  it('throws when the URL is not absolute', () => {
    expect(() => normalizeBaseUrl('example.fr')).toThrow();
  });

  it('throws when the URL is empty (incomplete configuration)', () => {
    expect(() => normalizeBaseUrl('')).toThrow();
  });
});

describe('buildCanonicalUrl', () => {
  it('builds the canonical URL for the home page', () => {
    expect(buildCanonicalUrl('https://example.fr', '/')).toBe('https://example.fr/');
  });

  it('builds the canonical URL for a sub page regardless of a trailing slash on the base', () => {
    expect(buildCanonicalUrl('https://example.fr/', '/mentions-legales')).toBe(
      'https://example.fr/mentions-legales',
    );
  });

  it('adds a leading slash to the given path if missing', () => {
    expect(buildCanonicalUrl('https://example.fr', 'contact')).toBe('https://example.fr/contact');
  });

  it('propagates the error when the base URL is incomplete', () => {
    expect(() => buildCanonicalUrl('', '/')).toThrow();
  });
});
