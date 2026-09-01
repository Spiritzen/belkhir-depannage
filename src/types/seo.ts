/**
 * Fondations typées pour le SEO.
 *
 * Les interfaces JSON-LD ci-dessous préparent l'intégration future des
 * schémas LocalBusiness, Service, BreadcrumbList et FAQPage. Elles ne
 * doivent pas être instanciées avec des données inventées (adresse,
 * horaires, avis, zones d'intervention) : ce travail viendra dans un sprint
 * dédié, une fois les informations métier réelles validées.
 */

export interface RobotsDirective {
  index: boolean;
  follow: boolean;
}

export type OpenGraphType = 'website' | 'article';

export interface JsonLdBase {
  '@context': 'https://schema.org';
  '@type': string;
  [key: string]: unknown;
}

export interface LocalBusinessSchema extends JsonLdBase {
  '@type': 'LocalBusiness';
  name: string;
  telephone: string;
  url: string;
}

export interface ServiceSchema extends JsonLdBase {
  '@type': 'Service';
  name: string;
  serviceType: string;
  areaServed: string[];
}

export interface BreadcrumbListItem {
  '@type': 'ListItem';
  position: number;
  name: string;
  item: string;
}

export interface BreadcrumbListSchema extends JsonLdBase {
  '@type': 'BreadcrumbList';
  itemListElement: BreadcrumbListItem[];
}

export interface FaqQuestion {
  '@type': 'Question';
  name: string;
  acceptedAnswer: {
    '@type': 'Answer';
    text: string;
  };
}

export interface FaqPageSchema extends JsonLdBase {
  '@type': 'FAQPage';
  mainEntity: FaqQuestion[];
}

export type JsonLdSchema =
  LocalBusinessSchema | ServiceSchema | BreadcrumbListSchema | FaqPageSchema;
