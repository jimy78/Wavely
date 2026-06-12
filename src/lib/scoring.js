// ─────────────────────────────────────────────────────────────────
// Barème de points (style MonPetitProno)
//   • Score exact          → 3 pts
//   • Bon résultat (1/N/2) → 1 pt
//   • Bonus différence de buts exacte (sans score exact) → +1 pt
// ─────────────────────────────────────────────────────────────────

export const POINTS = {
  EXACT: 3,
  RESULT: 1,
  DIFF_BONUS: 1,
};

function outcome(h, a) {
  if (h > a) return "1";
  if (h < a) return "2";
  return "N";
}

// Calcule les points d'un pronostic face à un résultat réel.
export function scorePrediction(pred, result) {
  if (!pred || !result) return 0;
  if (
    pred.home == null || pred.away == null ||
    result.home == null || result.away == null
  ) return 0;

  const ph = Number(pred.home), pa = Number(pred.away);
  const rh = Number(result.home), ra = Number(result.away);
  if ([ph, pa, rh, ra].some((n) => Number.isNaN(n))) return 0;

  // Score exact
  if (ph === rh && pa === ra) return POINTS.EXACT;

  let pts = 0;
  // Bon résultat
  if (outcome(ph, pa) === outcome(rh, ra)) pts += POINTS.RESULT;
  // Bonus différence de buts exacte (uniquement si match nul prédit nul, etc.)
  if (ph - pa === rh - ra) pts += POINTS.DIFF_BONUS;
  return pts;
}

// Détaille le type de réussite (pour l'affichage : badge sur la carte).
export function scoreDetail(pred, result) {
  const pts = scorePrediction(pred, result);
  if (!result || result.home == null || result.away == null) return null;
  if (pts >= POINTS.EXACT) return { pts, label: "Score exact", tone: "gold" };
  if (pts > 0) return { pts, label: "Bon résultat", tone: "green" };
  return { pts: 0, label: "Raté", tone: "red" };
}

// Construit le classement à partir des membres, pronostics et résultats.
export function buildLeaderboard(members, predictions, results, matches) {
  const rows = Object.keys(members || {}).map((name) => {
    let total = 0, exact = 0, good = 0, played = 0;
    const preds = (predictions && predictions[name]) || {};
    matches.forEach((m) => {
      const r = results && results[m.id];
      if (!r || r.home == null || r.away == null) return;
      const p = preds[m.id];
      if (!p || p.home == null || p.away == null) return;
      played++;
      const pts = scorePrediction(p, r);
      total += pts;
      if (pts >= POINTS.EXACT) exact++;
      else if (pts > 0) good++;
    });
    return { name, total, exact, good, played };
  });
  rows.sort((a, b) => b.total - a.total || b.exact - a.exact || a.name.localeCompare(b.name));
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}
