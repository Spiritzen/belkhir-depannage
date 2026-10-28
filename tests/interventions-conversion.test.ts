import { describe, expect, it, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import IndexPage from '../src/pages/index.astro';

let section = '';

beforeAll(async () => {
  const container = await AstroContainer.create();
  const html = await container.renderToString(IndexPage, {
    request: new Request('http://localhost/'),
  });
  section = html.match(/<section class="latest"[\s\S]*?<\/section>/)?.[0] ?? '';
}, 60000);

describe('section « Nos interventions sur le terrain »', () => {
  it('titre, introduction et trois cartes', () => {
    expect(section).toContain('Nos interventions sur le terrain');
    expect(section).toContain('notre équipe intervient avec méthode');
    expect(section.match(/class="latest__card"/g) ?? []).toHaveLength(3);
  });

  it('aucun vocabulaire de maquette ni enseigne nominative', () => {
    expect(section).not.toMatch(
      /exemple|Content Collections|à connecter|en attente|Dernières interventions|Voir l’intervention|Lafayette/i,
    );
  });

  it('trois liens internes vers les pages métiers, sans nouvel onglet', () => {
    const links = section.match(/<a [^>]*class="latest__link"[^>]*>/g) ?? [];
    expect(links).toHaveLength(3);
    expect(section.match(/<a\b/g) ?? []).toHaveLength(3);
    const hrefs = links.map((l) => l.match(/href="([^"]+)"/)?.[1]);
    expect(hrefs[0]).toMatch(/\/vitrerie\/$/);
    expect(hrefs[1]).toMatch(/\/chauffage\/$/);
    expect(hrefs[2]).toMatch(/\/plomberie\/$/);
    for (const l of links) expect(l).not.toContain('target=');
    for (const label of [
      'Découvrir la vitrerie',
      'Découvrir le chauffage',
      'Découvrir la plomberie',
    ])
      expect(section).toContain(label);
  });

  it('texte alternatif de la photo vitrerie', () => {
    expect(section).toContain('alt="Chantier de remplacement complet des vitrages d’une vitrine commerciale"');
  });
});
