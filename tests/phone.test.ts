import { describe, expect, it } from 'vitest';
import { buildTelHref, getPhoneCta, isPhoneMissing } from '../src/lib/phone';
import type { PhoneNumberConfig } from '../src/types/site';

const standardWithNumber: PhoneNumberConfig = {
  role: 'standard',
  label: 'Standard',
  subLabel: 'Demandes, devis et suivi',
  display: '03 22 00 00 00',
  international: '+33 3 22 00 00 00',
};

const emergencyWithoutNumber: PhoneNumberConfig = {
  role: 'emergency',
  label: 'Urgence extrême',
  subLabel: 'Portable d’urgence',
  display: null,
  international: null,
};

describe('buildTelHref', () => {
  it('builds a clean tel: link from a formatted international number', () => {
    expect(buildTelHref('+33 6 12 34 56 78')).toBe('tel:+33612345678');
  });

  it('strips separators such as dots, dashes and parentheses', () => {
    expect(buildTelHref('+33.6-12.34.56.78')).toBe('tel:+33612345678');
    expect(buildTelHref('(+33) 6 12 34 56 78')).toBe('tel:+33612345678');
  });

  it('throws on an empty phone number', () => {
    expect(() => buildTelHref('')).toThrow();
  });

  it('throws on a non-numeric phone number', () => {
    expect(() => buildTelHref('appelez-nous')).toThrow();
  });
});

describe('getPhoneCta', () => {
  it('returns a real tel: link when both display and international values are set', () => {
    const cta = getPhoneCta(standardWithNumber);

    expect(cta.kind).toBe('link');
    if (cta.kind === 'link') {
      expect(cta.href).toBe('tel:+33322000000');
      expect(cta.display).toBe('03 22 00 00 00');
    }
    expect(cta.role).toBe('standard');
    expect(cta.label).toBe('Standard');
  });

  it('returns an explicit placeholder label and no tel: link when the number is missing', () => {
    const cta = getPhoneCta(emergencyWithoutNumber);

    expect(cta.kind).toBe('placeholder');
    expect(cta.display).toBe('PORTABLE URGENCE À RENSEIGNER');
    expect(cta).not.toHaveProperty('href');
  });

  it('never fabricates a tel: link from an incomplete configuration', () => {
    const partial: PhoneNumberConfig = {
      role: 'standard',
      label: 'Standard',
      subLabel: 'Demandes, devis et suivi',
      display: '03 22 00 00 00',
      international: null,
    };

    expect(getPhoneCta(partial).kind).toBe('placeholder');
  });
});

describe('isPhoneMissing', () => {
  it('detects a fully configured phone as not missing', () => {
    expect(isPhoneMissing(standardWithNumber)).toBe(false);
  });

  it('detects an unconfigured phone as missing', () => {
    expect(isPhoneMissing(emergencyWithoutNumber)).toBe(true);
  });
});
