import { describe, expect, it } from 'vitest';
import {
  resolveAllowIndexing,
  resolvePhoneNumber,
  resolveSiteUrl,
  siteConfig,
} from '../src/lib/site-config';
import type { PhoneNumberConfig } from '../src/types/site';

const completePhone: PhoneNumberConfig = {
  role: 'standard',
  label: 'Standard',
  subLabel: 'Demandes, devis et suivi',
  display: '03 22 00 00 00',
  international: '+33322000000',
};

const emptyPhone: PhoneNumberConfig = {
  role: 'emergency',
  label: 'Urgence extrême',
  subLabel: 'Portable d’urgence',
  display: null,
  international: null,
};

describe('resolvePhoneNumber', () => {
  it('returns null values when neither env variable is set', () => {
    const phone = resolvePhoneNumber('standard', 'Standard', 'Sous-titre', {}, 'DISPLAY', 'INTL');

    expect(phone.display).toBeNull();
    expect(phone.international).toBeNull();
  });

  it('requires BOTH display and international to consider the number real', () => {
    const phone = resolvePhoneNumber(
      'standard',
      'Standard',
      'Sous-titre',
      { DISPLAY: '03 22 00 00 00' },
      'DISPLAY',
      'INTL',
    );

    expect(phone.display).toBeNull();
    expect(phone.international).toBeNull();
  });

  it('resolves both values when the env variables are fully set', () => {
    const phone = resolvePhoneNumber(
      'emergency',
      'Urgence extrême',
      'Portable d’urgence',
      { DISPLAY: '06 00 00 00 00', INTL: '+33600000000' },
      'DISPLAY',
      'INTL',
    );

    expect(phone.display).toBe('06 00 00 00 00');
    expect(phone.international).toBe('+33600000000');
  });
});

describe('resolveAllowIndexing', () => {
  it('disables indexing by default when it has not been requested', () => {
    expect(resolveAllowIndexing(false, completePhone, completePhone)).toBe(false);
  });

  it('refuses indexing even when explicitly requested if any phone is missing', () => {
    expect(resolveAllowIndexing(true, completePhone, emptyPhone)).toBe(false);
    expect(resolveAllowIndexing(true, emptyPhone, completePhone)).toBe(false);
  });

  it('allows indexing only when explicitly requested AND both phones are real', () => {
    expect(resolveAllowIndexing(true, completePhone, completePhone)).toBe(true);
  });
});

describe('resolveSiteUrl', () => {
  // Correctif PREPUB-001/PREPUB-006 (01/09/2026) : resolveSiteUrl combine
  // désormais site/base (dérivés d'astro.config.mjs via
  // import.meta.env.SITE/BASE_URL) plutôt que de retomber sur un domaine
  // technique temporaire. Ces tests appellent la fonction avec des site/base
  // explicites : sous Vitest (getViteConfig, hors périmètre de ce sprint),
  // import.meta.env.BASE_URL reste '/' même quand astro.config.mjs déclare
  // '/belkhir-depannage/' — voir tests/prepub-corrections.test.ts, qui
  // prouve la vraie valeur en lisant directement le build compilé.
  it('combines the configured site origin and base path when SITE_URL is not set', () => {
    expect(resolveSiteUrl({}, 'https://spiritzen.github.io', '/belkhir-depannage/')).toBe(
      'https://spiritzen.github.io/belkhir-depannage',
    );
  });

  it('falls back to the bare origin when base is the root ("/")', () => {
    expect(resolveSiteUrl({}, 'https://example.fr', '/')).toBe('https://example.fr');
  });

  it('uses SITE_URL when it is provided, normalized without a trailing slash', () => {
    expect(
      resolveSiteUrl(
        { SITE_URL: 'https://www.example.fr/' },
        'https://spiritzen.github.io',
        '/belkhir-depannage/',
      ),
    ).toBe('https://www.example.fr');
  });

  it('ignores a blank SITE_URL and falls back to the combined site+base', () => {
    expect(
      resolveSiteUrl({ SITE_URL: '   ' }, 'https://spiritzen.github.io', '/belkhir-depannage/'),
    ).toBe('https://spiritzen.github.io/belkhir-depannage');
  });
});

describe('siteConfig', () => {
  it('disables indexing by default (no explicit env request, placeholder phones)', () => {
    expect(siteConfig.allowIndexing).toBe(false);
  });

  it('stays marked as a preview build', () => {
    expect(siteConfig.isPreview).toBe(true);
  });

  it('exposes a French default SEO title and description', () => {
    expect(siteConfig.defaultSeoTitle.length).toBeGreaterThan(0);
    expect(siteConfig.defaultSeoDescription.length).toBeGreaterThan(0);
  });

  it('exposes the confirmed business name and territory without inventing data', () => {
    expect(siteConfig.siteName).toBe('Belkhir Dépannage');
    expect(siteConfig.city).toBe('Amiens');
    expect(siteConfig.region).toBe('Hauts-de-France');
  });

  it('exposes two distinct, correctly labelled call lines', () => {
    expect(siteConfig.standardPhone.role).toBe('standard');
    expect(siteConfig.standardPhone.label).toBe('Standard');
    expect(siteConfig.emergencyPhone.role).toBe('emergency');
    expect(siteConfig.emergencyPhone.label).toBe('Urgence extrême');
  });

  it('never reuses a legacy site phone number as a real value', () => {
    const legacyNumbers = ['0259229890', '0376212902'];
    const allValues = [
      siteConfig.standardPhone.display,
      siteConfig.standardPhone.international,
      siteConfig.emergencyPhone.display,
      siteConfig.emergencyPhone.international,
    ].filter((value): value is string => Boolean(value));

    for (const legacyNumber of legacyNumbers) {
      for (const value of allValues) {
        expect(value.replace(/[\s.]/g, '')).not.toContain(legacyNumber);
      }
    }
  });
});
