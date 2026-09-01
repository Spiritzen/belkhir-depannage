import type { BreadcrumbListSchema, JsonLdSchema } from '../types/seo';

/**
 * Construit un schéma JSON-LD BreadcrumbList à partir d'éléments de fil
 * d'Ariane réels (nom + URL absolue). Ne pas appeler avec des données
 * inventées : cette fonction sera utilisée par les futures pages une fois
 * une hiérarchie de navigation réelle définie.
 */
export function buildBreadcrumbList(
  items: Array<{ name: string; url: string }>,
): BreadcrumbListSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Sérialise une liste de schémas JSON-LD en chaînes JSON prêtes à être
 * injectées dans des balises <script type="application/ld+json">.
 */
export function serializeJsonLd(schemas: JsonLdSchema[]): string[] {
  return schemas.map((schema) => JSON.stringify(schema));
}
