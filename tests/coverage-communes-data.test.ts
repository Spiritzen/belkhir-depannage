import { describe, expect, it, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Validation du snapshot statique des communes (PROMPT_CLAUDE_CODE_PAGE_
// ZONES_INTERVENTION_RADAR.txt, sections 2 et 16, 04/09/2026) — généré par
// `scripts/generate-coverage-communes.mjs` depuis geo.api.gouv.fr (Code
// officiel géographique, Insee). Uniquement les départements 02/59/60/62/80,
// aucune commune inventée, aucun doublon strict, métadonnées de source
// présentes.
interface CommuneRecord {
  name: string;
  codeInsee: string;
  departmentCode: string;
  departmentName: string;
  postalCodes: string[];
  population: number | null;
}

interface CommunesSnapshot {
  meta: {
    source: string;
    sourceUrl: string;
    license: string;
    generatedAt: string;
    departments: Array<{ code: string; name: string }>;
    communeCount: number;
    communeCountByDepartment: Record<string, number>;
  };
  communes: CommuneRecord[];
}

const ALLOWED_DEPARTMENTS = new Set(['02', '59', '60', '62', '80']);

let snapshot: CommunesSnapshot;

beforeAll(() => {
  const path = fileURLToPath(
    new URL('../public/data/communes-hauts-de-france.json', import.meta.url),
  );
  snapshot = JSON.parse(readFileSync(path, 'utf-8'));
});

describe('snapshot des communes — métadonnées', () => {
  it('documents its source, its license and a generation date', () => {
    expect(snapshot.meta.source).toContain('geo.api.gouv.fr');
    expect(snapshot.meta.sourceUrl).toMatch(/^https:\/\/geo\.api\.gouv\.fr/);
    expect(snapshot.meta.license).toContain('Etalab');
    expect(snapshot.meta.generatedAt).toBeTruthy();
    expect(new Date(snapshot.meta.generatedAt).toString()).not.toBe('Invalid Date');
  });

  it('lists exactly the five target départements', () => {
    const codes = snapshot.meta.departments.map((d) => d.code).sort();
    expect(codes).toEqual(['02', '59', '60', '62', '80']);
  });

  it('a stated commune count matching the actual array length', () => {
    expect(snapshot.meta.communeCount).toBe(snapshot.communes.length);
  });
});

describe('snapshot des communes — intégrité des données', () => {
  it('contains a substantial, real number of communes (not a hand-typed handful)', () => {
    expect(snapshot.communes.length).toBeGreaterThan(3000);
  });

  it('never includes a commune outside the five target départements', () => {
    for (const commune of snapshot.communes) {
      expect(ALLOWED_DEPARTMENTS.has(commune.departmentCode)).toBe(true);
    }
  });

  it('every commune has a non-empty official name, a real INSEE code and a valid postal code', () => {
    for (const commune of snapshot.communes) {
      expect(commune.name.trim().length).toBeGreaterThan(0);
      expect(commune.codeInsee).toMatch(/^\d{5}$/);
      expect(commune.postalCodes.length).toBeGreaterThan(0);
      for (const postal of commune.postalCodes) {
        expect(postal).toMatch(/^\d{5}$/);
      }
    }
  });

  it('never contains a strictly duplicated INSEE code', () => {
    const seen = new Set<string>();
    for (const commune of snapshot.communes) {
      expect(seen.has(commune.codeInsee)).toBe(false);
      seen.add(commune.codeInsee);
    }
  });

  it('a well-known commune (Amiens) resolves to the real, expected data', () => {
    const amiens = snapshot.communes.find((c) => c.name === 'Amiens');
    expect(amiens).toBeDefined();
    expect(amiens?.departmentCode).toBe('80');
    expect(amiens?.departmentName).toBe('Somme');
    expect(amiens?.postalCodes).toContain('80000');
  });

  it('never embeds a heavy geometry field (only the fields actually used by the search/display)', () => {
    const sample = snapshot.communes[0];
    expect(sample).not.toHaveProperty('geometry');
    expect(sample).not.toHaveProperty('contour');
    expect(Object.keys(sample).sort()).toEqual(
      ['codeInsee', 'departmentCode', 'departmentName', 'name', 'population', 'postalCodes'].sort(),
    );
  });
});
