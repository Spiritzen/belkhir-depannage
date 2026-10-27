/**
 * Preuves Google — source de données unique et statique (aucune API, aucun
 * widget, aucune synchronisation automatique). Note et compteur relevés à la
 * main : ils ne se mettent pas à jour tout seuls.
 */
export interface GoogleReviewSummary {
  /** Nom de la plateforme, tel qu'affiché (« Google »). */
  platform: string;
  /** Libellé qualitatif court associé à la note. */
  label: string;
  /** Note moyenne sur 5. */
  rating: number;
  /** Nombre total d'avis. */
  reviewCount: number;
  /** Date de relevé au format ISO. */
  capturedAt: string;
  capturedLabel: string;
}

export interface GoogleReview {
  id: string;
  author: string;
  rating: number;
  dateLabel: string;
  text: string;
  sourceLabel: string;
}

export const googleReviewSummary: GoogleReviewSummary = {
  platform: 'Google',
  label: 'Excellent',
  rating: 4.7,
  reviewCount: 225,
  capturedAt: '2026-10-27',
  capturedLabel: 'Données Google relevées le 27 octobre 2026',
};

export const googleReviews: GoogleReview[] = [
  {
    id: 'corine-santer',
    author: 'Corine Santer',
    rating: 5,
    dateLabel: '23 octobre 2026',
    text: 'Intervention très rapide et efficace. Je recommande cette entreprise pour la qualité de service et le professionnalisme.',
    sourceLabel: 'Avis publié sur Google',
  },
  {
    id: 'marie-claude-rotier',
    author: 'Marie-Claude Rotier',
    rating: 5,
    dateLabel: '19 octobre 2026',
    text: 'Nous sommes entièrement satisfaits de l’intervention du technicien, professionnel et bonne communication.',
    sourceLabel: 'Avis publié sur Google',
  },
  {
    id: 'christophe-dequirot',
    author: 'Christophe Dequirot',
    rating: 5,
    dateLabel: '18 octobre 2026',
    text: 'Dépannage le samedi et travail bien fait. Je recommande.',
    sourceLabel: 'Avis publié sur Google',
  },
];
