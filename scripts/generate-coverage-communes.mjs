#!/usr/bin/env node
/**
 * Génère le snapshot statique des communes des cinq départements couverts
 * par Belkhir Dépannage (Somme 80, Nord 59, Pas-de-Calais 62, Oise 60,
 * Aisne 02), à partir de l'API officielle de l'administration française
 * `geo.api.gouv.fr` (Code officiel géographique de l'Insee).
 *
 * PAGE « ZONES D'INTERVENTION » / RADAR DE COMMUNES
 * (PROMPT_CLAUDE_CODE_PAGE_ZONES_INTERVENTION_RADAR.txt, section 2).
 *
 * Exécution manuelle uniquement, jamais au build ni au runtime du site :
 *
 *   node scripts/generate-coverage-communes.mjs
 *
 * Écrit `public/data/communes-hauts-de-france.json`, consommé côté client
 * par `src/components/sections/CoverageChecker.astro` (un seul
 * chargement, mis en cache en mémoire pour la session de la page — jamais
 * un appel réseau à `geo.api.gouv.fr` pendant la saisie du visiteur).
 *
 * Champs retenus par commune (strictement ceux utilisés par la recherche
 * et l'affichage — aucune géométrie, aucune donnée superflue) : nom
 * officiel, code INSEE, code département, nom du département, codes
 * postaux, population (critère de tri secondaire uniquement).
 */

const DEPARTMENTS = [
  { code: '02', name: 'Aisne' },
  { code: '59', name: 'Nord' },
  { code: '60', name: 'Oise' },
  { code: '62', name: 'Pas-de-Calais' },
  { code: '80', name: 'Somme' },
];

const API_BASE = 'https://geo.api.gouv.fr';
const OUTPUT_PATH = new URL('../public/data/communes-hauts-de-france.json', import.meta.url);

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Échec de la requête ${url} : HTTP ${response.status}`);
  }
  return response.json();
}

async function fetchDepartmentCommunes(departmentCode) {
  const url =
    `${API_BASE}/departements/${departmentCode}/communes` +
    `?fields=nom,code,codesPostaux,codeDepartement,population&format=json&geometry=none`;
  return fetchJson(url);
}

async function main() {
  console.log(
    'Génération du snapshot communes — source : geo.api.gouv.fr (Code officiel géographique Insee)',
  );

  /** @type {Array<{name: string, codeInsee: string, departmentCode: string, departmentName: string, postalCodes: string[], population: number | null}>} */
  const communes = [];
  const perDepartmentCount = {};

  for (const dept of DEPARTMENTS) {
    console.log(`  → département ${dept.code} (${dept.name})…`);
    const raw = await fetchDepartmentCommunes(dept.code);

    let count = 0;
    for (const item of raw) {
      // Une poignée de communes (rares) n'ont aucun code postal connu dans
      // ce jeu de données (ex. communes déléguées récemment fusionnées) :
      // exclues plutôt que d'inventer un code postal.
      if (
        !item.nom ||
        !item.code ||
        !Array.isArray(item.codesPostaux) ||
        item.codesPostaux.length === 0
      ) {
        continue;
      }
      communes.push({
        name: item.nom,
        codeInsee: item.code,
        departmentCode: dept.code,
        departmentName: dept.name,
        postalCodes: item.codesPostaux,
        population: typeof item.population === 'number' ? item.population : null,
      });
      count += 1;
    }
    perDepartmentCount[dept.code] = count;
    console.log(`    ${count} communes retenues.`);
  }

  // Aucune commune strictement dupliquée (même code INSEE) : le code INSEE
  // est unique au niveau national par construction de l'API, ce contrôle
  // est donc surtout un garde-fou de génération.
  const seenInsee = new Set();
  for (const commune of communes) {
    if (seenInsee.has(commune.codeInsee)) {
      throw new Error(`Code INSEE dupliqué détecté : ${commune.codeInsee} (${commune.name})`);
    }
    seenInsee.add(commune.codeInsee);
  }

  const snapshot = {
    meta: {
      source: 'geo.api.gouv.fr (Code officiel géographique, Insee)',
      sourceUrl: 'https://geo.api.gouv.fr/decoupage-administratif/communes',
      license: 'Licence Ouverte / Etalab 2.0',
      generatedAt: new Date().toISOString(),
      departments: DEPARTMENTS,
      communeCount: communes.length,
      communeCountByDepartment: perDepartmentCount,
    },
    communes,
  };

  const { writeFile, mkdir } = await import('node:fs/promises');
  await mkdir(new URL('.', OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(snapshot), 'utf-8');

  console.log(`\nSnapshot écrit : ${OUTPUT_PATH.pathname.replace(/^\/([A-Za-z]):/, '$1:')}`);
  console.log(`Total : ${communes.length} communes sur ${DEPARTMENTS.length} départements.`);
}

main().catch((error) => {
  console.error('Échec de la génération du snapshot :', error);
  process.exitCode = 1;
});
