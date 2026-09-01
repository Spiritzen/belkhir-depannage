import { describe, expect, it } from 'vitest';
import { buildBreadcrumbList, serializeJsonLd } from '../src/lib/seo';

describe('buildBreadcrumbList', () => {
  it('builds a BreadcrumbList schema with 1-based positions', () => {
    const schema = buildBreadcrumbList([
      { name: 'Accueil', url: 'https://example.fr/' },
      { name: 'Services', url: 'https://example.fr/services' },
    ]);

    expect(schema['@type']).toBe('BreadcrumbList');
    expect(schema.itemListElement).toHaveLength(2);
    expect(schema.itemListElement[0]).toMatchObject({ position: 1, name: 'Accueil' });
    expect(schema.itemListElement[1]).toMatchObject({ position: 2, name: 'Services' });
  });

  it('returns an empty itemListElement for an empty breadcrumb', () => {
    expect(buildBreadcrumbList([]).itemListElement).toEqual([]);
  });
});

describe('serializeJsonLd', () => {
  it('serializes each schema to a valid JSON string', () => {
    const schema = buildBreadcrumbList([{ name: 'Accueil', url: 'https://example.fr/' }]);
    const [serialized] = serializeJsonLd([schema]);

    expect(() => JSON.parse(serialized)).not.toThrow();
    expect(JSON.parse(serialized)).toMatchObject({ '@type': 'BreadcrumbList' });
  });
});
