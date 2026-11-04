import type { APIRoute } from 'astro';
import { siteConfig } from '../lib/site-config';

/**
 * Génère robots.txt à partir de la configuration centrale.
 * Indexable (Allow + Sitemap) uniquement si siteConfig.allowIndexing est vrai
 * (ENABLE_INDEXING=true et deux lignes complètes) ; sinon tout est bloqué.
 */
export const GET: APIRoute = () => {
  const lines = siteConfig.allowIndexing
    ? ['User-agent: *', 'Allow: /', '', `Sitemap: ${siteConfig.siteUrl}/sitemap-index.xml`]
    : ['User-agent: *', 'Disallow: /'];

  return new Response(`${lines.join('\n')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
