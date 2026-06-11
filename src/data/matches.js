// ─────────────────────────────────────────────────────────────────
// COUPE DU MONDE 2026 — Calendrier des matchs
// 48 équipes · 12 groupes de 4 · 104 matchs
// Les équipes et dates sont éditables par l'admin dans l'app.
// (Format officiel FIFA : 3 pays hôtes — USA, Canada, Mexique)
// ─────────────────────────────────────────────────────────────────

// 12 groupes de 4 équipes. Composition indicative (modifiable côté admin).
export const GROUPS = {
  A: ["Mexique 🇲🇽", "Pologne 🇵🇱", "Égypte 🇪🇬", "Norvège 🇳🇴"],
  B: ["Canada 🇨🇦", "Croatie 🇭🇷", "Équateur 🇪🇨", "Qatar 🇶🇦"],
  C: ["Argentine 🇦🇷", "Japon 🇯🇵", "Tunisie 🇹🇳", "Écosse 🏴"],
  D: ["États-Unis 🇺🇸", "Sénégal 🇸🇳", "Iran 🇮🇷", "Pays de Galles 🏴"],
  E: ["France 🇫🇷", "Uruguay 🇺🇾", "Côte d'Ivoire 🇨🇮", "Nouvelle-Zélande 🇳🇿"],
  F: ["Brésil 🇧🇷", "Maroc 🇲🇦", "Corée du Sud 🇰🇷", "Australie 🇦🇺"],
  G: ["Angleterre 🏴", "Colombie 🇨🇴", "Nigéria 🇳🇬", "Panama 🇵🇦"],
  H: ["Espagne 🇪🇸", "Mexique B 🇲🇽", "Ghana 🇬🇭", "Arabie Saoudite 🇸🇦"],
  I: ["Allemagne 🇩🇪", "Suisse 🇨🇭", "Algérie 🇩🇿", "Costa Rica 🇨🇷"],
  J: ["Portugal 🇵🇹", "Pays-Bas 🇳🇱", "Cameroun 🇨🇲", "Jamaïque 🇯🇲"],
  K: ["Belgique 🇧🇪", "Danemark 🇩🇰", "Mali 🇲🇱", "Honduras 🇭🇳"],
  L: ["Italie 🇮🇹", "Serbie 🇷🇸", "Afrique du Sud 🇿🇦", "Nouvelle-Calédonie 🇳🇨"],
};

// Stades hôtes (16 villes)
const VENUES = [
  "MetLife Stadium, New York", "SoFi Stadium, Los Angeles", "AT&T Stadium, Dallas",
  "Mercedes-Benz, Atlanta", "NRG Stadium, Houston", "Arrowhead, Kansas City",
  "Lumen Field, Seattle", "Levi's Stadium, San Francisco", "Hard Rock, Miami",
  "Lincoln Financial, Philadelphie", "Gillette Stadium, Boston", "Lumen, Toronto",
  "BC Place, Vancouver", "Estadio Azteca, Mexico", "Estadio Akron, Guadalajara",
  "Estadio BBVA, Monterrey",
];

// Ordre des 6 confrontations dans un groupe de 4 (indices d'équipes)
const PAIRINGS = [
  [0, 1], [2, 3], // J1
  [0, 2], [3, 1], // J2
  [3, 0], [1, 2], // J3
];

// Génère les 72 matchs de la phase de groupes
function buildGroupStage() {
  const matches = [];
  const groupKeys = Object.keys(GROUPS);
  // Phase de groupes : 11 juin → 27 juin 2026
  const startDay = new Date("2026-06-11T00:00:00");
  let venueIdx = 0;

  groupKeys.forEach((g, gi) => {
    const teams = GROUPS[g];
    PAIRINGS.forEach((pair, pi) => {
      const journee = Math.floor(pi / 2) + 1; // 1,1,2,2,3,3
      // Étale les journées : J1 jours 0-4, J2 jours 5-9, J3 jours 10-13
      const dayOffset = (journee - 1) * 5 + (gi % 5);
      const date = new Date(startDay);
      date.setDate(date.getDate() + dayOffset);
      const hours = pi % 2 === 0 ? 18 : 21;
      date.setHours(hours, 0, 0, 0);

      matches.push({
        id: `G_${g}_${pi + 1}`,
        stage: "group",
        stageLabel: `Groupe ${g}`,
        round: `Groupe ${g} · J${journee}`,
        group: g,
        home: teams[pair[0]],
        away: teams[pair[1]],
        date: date.toISOString(),
        venue: VENUES[venueIdx++ % VENUES.length],
        editable: true,
      });
    });
  });
  return matches;
}

// Génère les matchs à élimination directe (équipes "À déterminer", éditables)
function buildKnockoutStage() {
  const rounds = [
    { key: "R32", label: "16es de finale", count: 16, start: "2026-06-28", days: 6 },
    { key: "R16", label: "8es de finale", count: 8, start: "2026-07-04", days: 4 },
    { key: "QF", label: "Quarts de finale", count: 4, start: "2026-07-09", days: 3 },
    { key: "SF", label: "Demi-finales", count: 2, start: "2026-07-14", days: 2 },
    { key: "3P", label: "Petite finale", count: 1, start: "2026-07-18", days: 1 },
    { key: "F", label: "FINALE", count: 1, start: "2026-07-19", days: 1 },
  ];
  const matches = [];
  rounds.forEach((r) => {
    const start = new Date(r.start + "T20:00:00");
    for (let i = 0; i < r.count; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + (i % r.days));
      matches.push({
        id: `${r.key}_${i + 1}`,
        stage: "knockout",
        stageLabel: r.label,
        round: r.count > 1 ? `${r.label} #${i + 1}` : r.label,
        group: null,
        home: "À déterminer",
        away: "À déterminer",
        date: date.toISOString(),
        venue: VENUES[i % VENUES.length],
        editable: true,
      });
    }
  });
  return matches;
}

export const MATCHES = [...buildGroupStage(), ...buildKnockoutStage()];

// Regroupe les matchs par étiquette d'étape (pour l'affichage)
export const STAGE_ORDER = [
  "Groupe A", "Groupe B", "Groupe C", "Groupe D", "Groupe E", "Groupe F",
  "Groupe G", "Groupe H", "Groupe I", "Groupe J", "Groupe K", "Groupe L",
  "16es de finale", "8es de finale", "Quarts de finale",
  "Demi-finales", "Petite finale", "FINALE",
];
