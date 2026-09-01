/**
 * Utilitaires de gestion des deux lignes d'appel (standard et urgence
 * extrême).
 *
 * Règle absolue (section 7 du prompt de mission) : tant qu'un numéro réel
 * n'est pas fourni par une source validée, aucun lien `tel:` ne doit être
 * généré. L'interface doit alors afficher un libellé explicite
 * (« NUMÉRO STANDARD À RENSEIGNER » / « PORTABLE URGENCE À RENSEIGNER »)
 * plutôt qu'un faux numéro.
 */

import type { PhoneNumberConfig, PhoneRole } from '../types/site';

const PLACEHOLDER_LABELS: Record<PhoneRole, string> = {
  standard: 'NUMÉRO STANDARD À RENSEIGNER',
  emergency: 'PORTABLE URGENCE À RENSEIGNER',
};

/**
 * Aperçu visuel compact réservé à la navbar (micro-sprint retouche 01,
 * section 8) : la navbar n'a pas la place pour le libellé long
 * "NUMÉRO STANDARD À RENSEIGNER" utilisé ailleurs (hero, drawer, footer,
 * barre d'appel mobile). Format court au style d'un numéro français, sans
 * jamais former un numéro complet plausible ("XX" reste littéral).
 *
 * Valeur purement visuelle et centralisée ici : aucun composant ne doit la
 * recopier à la main.
 *
 * `label` (ex. "APPEL URGENCE") reste utilisé dans la navbar même une fois
 * un vrai numéro configuré (sprint d'activation du 01/09/2026, section 3 du
 * prompt de mission) — seul `display` cesse d'être utilisé dès que
 * `getPhoneCta` retourne un CTA "link" : `PhoneCta.astro` affiche alors la
 * vraie valeur (`cta.display`), déjà assez courte pour la navbar.
 */
export const NAVBAR_PHONE_PREVIEW: Record<
  PhoneRole,
  { label: string; display: string; note: string }
> = {
  standard: {
    label: 'APPEL STANDARD',
    display: '03 XX XX XX XX',
    note: 'Numéro standard provisoire, à renseigner.',
  },
  emergency: {
    label: 'APPEL URGENCE',
    display: '06 XX XX XX XX',
    note: 'Numéro d’urgence provisoire, à renseigner.',
  },
};

export interface PhoneCtaBase {
  role: PhoneRole;
  label: string;
  subLabel: string;
}

export interface PhoneCtaLink extends PhoneCtaBase {
  kind: 'link';
  /** Lien `tel:` prêt à l'emploi, ex. "tel:+33322000000". */
  href: string;
  /** Libellé à afficher à l'écran. */
  display: string;
}

export interface PhoneCtaPlaceholder extends PhoneCtaBase {
  kind: 'placeholder';
  /** Texte explicite indiquant que le numéro reste à renseigner. */
  display: string;
}

export type PhoneCta = PhoneCtaLink | PhoneCtaPlaceholder;

/**
 * Construit un lien `tel:` propre à partir d'un numéro au format
 * international. Retire les espaces, points, tirets et parenthèses ;
 * lève une erreur si le résultat n'est pas un numéro plausible.
 */
export function buildTelHref(internationalPhone: string): string {
  const cleaned = internationalPhone.replace(/[\s().-]/g, '');

  if (!/^\+?[1-9]\d{6,14}$/.test(cleaned)) {
    throw new Error(`Numéro de téléphone invalide pour un lien "tel:" : "${internationalPhone}".`);
  }

  return `tel:${cleaned}`;
}

/**
 * Construit le CTA téléphonique pour une ligne d'appel donnée.
 *
 * - Si `display` et `international` sont tous deux renseignés, retourne un
 *   CTA de type "link" avec un vrai lien `tel:`.
 * - Sinon, retourne un CTA de type "placeholder" avec un libellé explicite
 *   et sans aucun lien `tel:` généré.
 */
export function getPhoneCta(phone: PhoneNumberConfig): PhoneCta {
  const base: PhoneCtaBase = { role: phone.role, label: phone.label, subLabel: phone.subLabel };

  if (!phone.display || !phone.international) {
    return { ...base, kind: 'placeholder', display: PLACEHOLDER_LABELS[phone.role] };
  }

  return { ...base, kind: 'link', href: buildTelHref(phone.international), display: phone.display };
}

/** Vrai si le numéro réel n'a pas encore été fourni pour cette ligne. */
export function isPhoneMissing(phone: PhoneNumberConfig): boolean {
  return !phone.display || !phone.international;
}
