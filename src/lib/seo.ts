import type {
  AdministrativeAreaSchema,
  BreadcrumbListSchema,
  FaqPageSchema,
  JsonLdSchema,
  ServiceSchema,
} from '../types/seo';

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
 * Construit un schéma JSON-LD FAQPage à partir des questions/réponses
 * RÉELLEMENT affichées sur la page (micro-sprint 2 page plomberie,
 * 04/09/2026) : `items` doit toujours être exactement la même source de
 * données que celle rendue visuellement par le composant Faq — jamais des
 * données structurées différentes du contenu affiché (voir prompt de
 * mission, section « FAQ plomberie »).
 */
export function buildFaqPageSchema(
  items: Array<{ question: string; answer: string }>,
): FaqPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

/**
 * Construit un schéma JSON-LD Service avec des zones `areaServed`
 * explicitement typées `AdministrativeArea` (PROMPT_CLAUDE_CODE_PAGE_
 * ZONES_INTERVENTION_RADAR.txt, section 13, 04/09/2026) — `serviceType`
 * doit toujours correspondre réellement aux métiers proposés, `areaZones`
 * aux départements réellement couverts (jamais de donnée inventée).
 */
export function buildServiceSchema(params: {
  name: string;
  serviceTypes: string[];
  areaZones: string[];
  url: string;
}): ServiceSchema {
  const areaServed: AdministrativeAreaSchema[] = params.areaZones.map((name) => ({
    '@type': 'AdministrativeArea',
    name,
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: params.name,
    serviceType: params.serviceTypes,
    areaServed,
    url: params.url,
  };
}

/**
 * Sérialise une liste de schémas JSON-LD en chaînes JSON prêtes à être
 * injectées dans des balises <script type="application/ld+json">.
 */
export function serializeJsonLd(schemas: JsonLdSchema[]): string[] {
  return schemas.map((schema) => JSON.stringify(schema));
}
