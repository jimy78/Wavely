import { useState, useRef, useEffect } from "react";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500;700&display=swap');`;

// ══════════════════════════════════════════════════════════════════
//  MOTEUR DE CALCUL — formules légales (Code du travail) + IDCC 16
//  Sources : art. L1234-9 / R1234-2 C. trav. (indemnité légale),
//  art. D1237-1 (départ volontaire à la retraite), art. L1234-1 (préavis),
//  CCN Transports routiers IDCC 16 brochure 3085 — barèmes vérifiés sur la
//  synthèse conventionnelle à jour du 07/10/2025 (avenant n°16 du 09/04/2025).
//  Les barèmes évoluent par avenant : contrôler Légifrance avant décision.
// ══════════════════════════════════════════════════════════════════

function indemniteLegaleLicenciement(salaireRef, anciennete) {
  // 1/4 de mois par année jusqu'à 10 ans, 1/3 au-delà (art. R1234-2)
  const a10 = Math.min(anciennete, 10);
  const plus10 = Math.max(anciennete - 10, 0);
  return salaireRef * (a10 / 4 + plus10 / 3);
}

function indemniteConventionnelleIDCC16(salaireRef, anciennete, categorie, anneesNonCadre = 0) {
  // Barèmes vérifiés — synthèse CCN 3085 à jour du 07/10/2025 (dès 2 ans, sauf faute grave) :
  // Ouvriers/Employés (art. 5 bis ann. I, 14 ann. II) : 1/10 mois/an à 2 ans, 2/10 dès 3 ans
  // TAM (art. 18 ann. III) : 1/10 à 2 ans, 3/10 dès 3 ans
  // Cadres (art. 17 ann. IV) : 4/10 mois/année comme cadre + 3/10 mois/année comme
  // employé ou TAM, plus une indemnité complémentaire pour le cadre de moins de 65 ans :
  // 2 mois dès 10 ans d'ancienneté (dont 5 comme cadre), 3 mois dès 20 ans, 4 mois dès 30 ans.
  if (anciennete < 2) return { total: 0, complement: 0 };
  if (categorie === "cadre") {
    const anneesCadre = Math.max(anciennete - anneesNonCadre, 0);
    const base = salaireRef * (0.4 * anneesCadre + 0.3 * Math.min(anneesNonCadre, anciennete));
    let moisComplement = 0;
    if (anciennete >= 30) moisComplement = 4;
    else if (anciennete >= 20) moisComplement = 3;
    else if (anciennete >= 10 && anneesCadre >= 5) moisComplement = 2;
    return { total: base + salaireRef * moisComplement, complement: salaireRef * moisComplement };
  }
  const taux = anciennete < 3 ? 0.1 : categorie === "tam" ? 0.3 : 0.2;
  return { total: salaireRef * taux * anciennete, complement: 0 };
}

function indemniteRetraiteLegale(salaireRef, anciennete) {
  // Départ volontaire à la retraite — art. D1237-1
  if (anciennete >= 30) return salaireRef * 2;
  if (anciennete >= 20) return salaireRef * 1.5;
  if (anciennete >= 15) return salaireRef * 1;
  if (anciennete >= 10) return salaireRef * 0.5;
  return 0;
}

function indemniteRetraiteConvIDCC16(salaireRef12m, anciennete) {
  // Ouvriers, employés, TAM — synthèse CCN 3085 (base : moyenne des 12 derniers mois)
  if (anciennete >= 30) return salaireRef12m * 2.5;
  if (anciennete >= 25) return salaireRef12m * 2;
  if (anciennete >= 20) return salaireRef12m * 1.5;
  if (anciennete >= 15) return salaireRef12m * 1;
  if (anciennete >= 10) return salaireRef12m * 0.5;
  return 0;
}

function preavisIDCC16(categorie, ancienneteMois, type) {
  // Tableau vérifié — synthèse CCN 3085 (art. 3/5 ann. I, 11/13 ann. II, 11/17 ann. III, 8/15 ann. IV)
  if (categorie === "cadre") return "3 mois";
  if (categorie === "tam68") return "2 mois";
  if (categorie === "etam15") {
    if (type === "demission") return "1 mois";
    return ancienneteMois >= 24 ? "2 mois" : "1 mois";
  }
  // Ouvriers
  if (type === "demission")
    return "1 semaine — portée à 2 semaines pour le personnel des entreprises de transport routier de marchandises et activités auxiliaires";
  if (ancienneteMois < 6) return "1 semaine";
  if (ancienneteMois < 24) return "1 mois";
  return "2 mois (minimum légal, art. L1234-1)";
}

const euro = (n) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

// ── Jours fériés français, calculés automatiquement pour toute année ──
// Fêtes mobiles dérivées de Pâques (algorithme de Meeus/Butcher) : le
// calculateur reste juste chaque année sans aucune mise à jour manuelle.
function datePaques(annee) {
  const a = annee % 19, b = Math.floor(annee / 100), c = annee % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mois = Math.floor((h + l - 7 * m + 114) / 31);
  const jour = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(annee, mois - 1, jour, 12));
}

function joursFeries(annee, alsaceMoselle) {
  const paques = datePaques(annee);
  const plus = (d, n) => new Date(d.getTime() + n * 86400000);
  const fixes = [[0, 1], [4, 1], [4, 8], [6, 14], [7, 15], [10, 1], [10, 11], [11, 25]]
    .map(([m, j]) => new Date(Date.UTC(annee, m, j, 12)));
  const mobiles = [plus(paques, 1), plus(paques, 39), plus(paques, 50)];
  const am = alsaceMoselle ? [plus(paques, -2), new Date(Date.UTC(annee, 11, 26, 12))] : [];
  return new Set([...fixes, ...mobiles, ...am].map((d) => d.toISOString().slice(0, 10)));
}

const NOMS_FERIES = (annee, alsaceMoselle) => {
  const paques = datePaques(annee);
  const plus = (d, n) => new Date(d.getTime() + n * 86400000);
  const map = {};
  const put = (d, nom) => { map[d.toISOString().slice(0, 10)] = nom; };
  put(new Date(Date.UTC(annee, 0, 1, 12)), "Jour de l'an"); put(new Date(Date.UTC(annee, 4, 1, 12)), "Fête du travail");
  put(new Date(Date.UTC(annee, 4, 8, 12)), "Victoire 1945"); put(new Date(Date.UTC(annee, 6, 14, 12)), "Fête nationale");
  put(new Date(Date.UTC(annee, 7, 15, 12)), "Assomption"); put(new Date(Date.UTC(annee, 10, 1, 12)), "Toussaint");
  put(new Date(Date.UTC(annee, 10, 11, 12)), "Armistice"); put(new Date(Date.UTC(annee, 11, 25, 12)), "Noël");
  put(plus(paques, 1), "Lundi de Pâques"); put(plus(paques, 39), "Ascension"); put(plus(paques, 50), "Lundi de Pentecôte");
  if (alsaceMoselle) { put(plus(paques, -2), "Vendredi Saint"); put(new Date(Date.UTC(annee, 11, 26, 12)), "Saint Étienne"); }
  return map;
};

function estJourOuvrable(d, feries) {
  // Jour ouvrable = tous les jours sauf dimanche et jours fériés chômés
  return d.getUTCDay() !== 0 && !feries.has(d.toISOString().slice(0, 10));
}

function calculeDelaiEntretien(dateRemiseISO, alsaceMoselle) {
  // Art. L1232-2 : l'entretien ne peut avoir lieu moins de 5 jours ouvrables
  // PLEINS après la présentation de la convocation (le jour de remise/première
  // présentation ne compte pas, ni le jour de l'entretien).
  const start = new Date(dateRemiseISO + "T12:00:00Z");
  if (isNaN(start)) return null;
  const feries = new Set([
    ...joursFeries(start.getUTCFullYear(), alsaceMoselle),
    ...joursFeries(start.getUTCFullYear() + 1, alsaceMoselle),
  ]);
  const noms = { ...NOMS_FERIES(start.getUTCFullYear(), alsaceMoselle), ...NOMS_FERIES(start.getUTCFullYear() + 1, alsaceMoselle) };
  const detail = [];
  let d = new Date(start);
  let ouvrables = 0;
  while (ouvrables < 5) {
    d = new Date(d.getTime() + 86400000);
    const iso = d.toISOString().slice(0, 10);
    if (d.getUTCDay() === 0) detail.push({ iso, statut: "exclu (dimanche)" });
    else if (feries.has(iso)) detail.push({ iso, statut: `exclu (férié : ${noms[iso] || "jour férié"})` });
    else { ouvrables += 1; detail.push({ iso, statut: `jour ouvrable n°${ouvrables}` }); }
  }
  // Entretien au plus tôt le lendemain du 5e jour ouvrable ; si ce jour est un
  // dimanche ou un férié, on le reporte au premier jour suivant ni dimanche ni férié.
  let entretien = new Date(d.getTime() + 86400000);
  while (!estJourOuvrable(entretien, feries)) entretien = new Date(entretien.getTime() + 86400000);
  return { entretien, detail, feries };
}

// La Poste ne distribue ni le dimanche ni les jours fériés : l'estimation
// d'acheminement avance de N jours de distribution (lun-sam non fériés).
function avanceJoursOuvrables(dateISO, nbJours, alsaceMoselle) {
  const start = new Date(dateISO + "T12:00:00Z");
  if (isNaN(start)) return null;
  const feries = new Set([
    ...joursFeries(start.getUTCFullYear(), alsaceMoselle),
    ...joursFeries(start.getUTCFullYear() + 1, alsaceMoselle),
  ]);
  let d = new Date(start), n = 0;
  while (n < nbJours) {
    d = new Date(d.getTime() + 86400000);
    if (estJourOuvrable(d, feries)) n += 1;
  }
  return d;
}

function fenetreNotification(dateEntretienISO, alsaceMoselle) {
  // Art. L1232-6 : notification au plus tôt 2 jours ouvrables après l'entretien.
  // Art. L1332-2 : au plus tard 1 mois après l'entretien.
  const start = new Date(dateEntretienISO + "T12:00:00Z");
  if (isNaN(start)) return null;
  const feries = new Set([
    ...joursFeries(start.getUTCFullYear(), alsaceMoselle),
    ...joursFeries(start.getUTCFullYear() + 1, alsaceMoselle),
  ]);
  let d = new Date(start), ouvrables = 0;
  while (ouvrables < 2) {
    d = new Date(d.getTime() + 86400000);
    if (estJourOuvrable(d, feries)) ouvrables += 1;
  }
  const min = new Date(d.getTime() + 86400000);
  const max = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, start.getUTCDate(), 12));
  return { min, max };
}

const frDate = (d) =>
  d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

// ══════════════════════════════════════════════════════════════════
//  BIBLIOTHÈQUE DE PROMPTS — Documents & Process
// ══════════════════════════════════════════════════════════════════

const DOC_LIBRARY = [
  {
    cat: "Procédures de rupture",
    items: [
      { icon: "📨", label: "Convocation à entretien préalable (licenciement)", prompt: "Rédige un modèle complet de convocation à entretien préalable à un éventuel licenciement pour un conducteur routier (CCN IDCC 16), avec les mentions obligatoires, les délais légaux à respecter et une checklist de la procédure complète étape par étape." },
      { icon: "🤝", label: "Procédure rupture conventionnelle de A à Z", prompt: "Donne-moi la procédure complète de rupture conventionnelle individuelle : étapes, délais (rétractation, homologation DREETS), documents à produire, calcul de l'indemnité spécifique minimale (CCN transport IDCC 16), erreurs à éviter, et un rétroplanning type." },
      { icon: "⚠️", label: "Courrier d'avertissement disciplinaire", prompt: "Rédige un modèle de courrier d'avertissement disciplinaire pour un salarié du transport routier, avec les règles de fond et de forme (délais, prescription des faits, proportionnalité) et les pièges à éviter." },
      { icon: "🏥", label: "Procédure inaptitude conducteur", prompt: "Explique la procédure complète en cas d'inaptitude médicale d'un conducteur (visite médicale, obligation de reclassement, consultation CSE, licenciement pour inaptitude, indemnités — y compris le doublement en cas d'origine professionnelle). Fournis une checklist et un rétroplanning." },
    ],
  },
  {
    cat: "Recrutement & intégration",
    items: [
      { icon: "📋", label: "Fiche de poste conducteur SPL", prompt: "Crée une fiche de poste complète pour un conducteur SPL (super poids lourd) longue distance : missions, compétences, permis et cartes obligatoires (FIMO/FCO, carte conducteur), classification CCN IDCC 16, conditions de travail, indicateurs de performance." },
      { icon: "🚀", label: "Process onboarding conducteur (J-7 à J+90)", prompt: "Construis un processus d'onboarding complet pour un nouveau conducteur routier, de J-7 à J+90 : documents obligatoires à collecter, visite médicale, formations, tutorat, points d'étape, avec une checklist opérationnelle prête à l'emploi." },
      { icon: "📄", label: "Checklist embauche (documents obligatoires)", prompt: "Liste tous les documents et formalités obligatoires pour l'embauche d'un conducteur routier de marchandises : DPAE, registre du personnel, visite d'information et de prévention, permis, FIMO/FCO, carte conducteur, attestation de non-condamnation le cas échéant, mutuelle, prévoyance (IPRIAC), affichages. Format checklist." },
    ],
  },
  {
    cat: "Pilotage social & stratégie",
    items: [
      { icon: "📊", label: "Construire mon tableau de bord social", prompt: "Propose un tableau de bord social mensuel pour une PME de transport routier (60 salariés dont 45 conducteurs) : les 12 indicateurs clés à suivre (turnover, absentéisme, AT/MP, intérim, heures supplémentaires, masse salariale...), leurs formules exactes, les seuils d'alerte du secteur, et un plan d'action type quand un seuil est dépassé." },
      { icon: "🧲", label: "Plan de rétention des conducteurs", prompt: "Le turnover de mes conducteurs est élevé. Analyse les causes typiques dans le transport routier de marchandises et propose un plan de rétention concret en 90 jours : actions rapides (quick wins), actions de fond, budget estimatif, indicateurs de suivi." },
      { icon: "🗓️", label: "Calendrier des obligations RH annuelles", prompt: "Établis le calendrier annuel des obligations RH et sociales d'une entreprise de transport routier (50+ salariés) : entretiens professionnels, index égalité, BDESE, consultations CSE, DUERP, visites médicales, NAO, taxe apprentissage... avec les échéances et sanctions en cas d'oubli." },
      { icon: "💬", label: "Préparer les NAO", prompt: "Aide-moi à préparer les négociations annuelles obligatoires (NAO) dans le transport routier : thèmes obligatoires, données à préparer, tendances salariales du secteur (grilles conventionnelles IDCC 16 à vérifier), stratégie de négociation et communication aux salariés." },
    ],
  },
  {
    cat: "Temps de travail & paie",
    items: [
      { icon: "⏱️", label: "Temps de service des conducteurs", prompt: "Explique simplement les règles de temps de service des conducteurs de marchandises (longue distance vs courte distance) : durées maximales, heures d'équivalence, temps de conduite/repos (règlement CE 561/2006), contreparties, et comment sécuriser le décompte. Cite les textes applicables." },
      { icon: "🧾", label: "Frais de déplacement (protocole IDCC 16)", prompt: "Explique le régime des frais de déplacement du protocole frais de la CCN transport (IDCC 16) : indemnités de repas, casse-croûte, grand déplacement, conditions d'attribution, régime social et fiscal. Précise que les montants sont révisés régulièrement et où trouver le barème en vigueur." },
      { icon: "🌙", label: "Travail de nuit dans le transport", prompt: "Rappelle les règles du travail de nuit applicables au transport routier de marchandises : définition, durées maximales, contreparties (prime de nuit conventionnelle), suivi médical, et points de vigilance paie. Cite les sources." },
    ],
  },
];

const QUICK_PROMPTS = [
  "Quels sont les délais d'une procédure de licenciement pour faute grave ?",
  "Différence entre rupture conventionnelle et licenciement : coûts et risques ?",
  "Comment réduire l'absentéisme de mes conducteurs ?",
  "Que doit contenir le DUERP d'une entreprise de transport ?",
];

// ══════════════════════════════════════════════════════════════════
//  RENDU MARKDOWN MINIMAL (titres, gras, listes, tableaux simples)
// ══════════════════════════════════════════════════════════════════

function renderInline(text, keyPrefix) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={`${keyPrefix}-${i}`} style={{ color: "#fff" }}>{p.slice(2, -2)}</strong>
    ) : (
      p
    )
  );
}

function Markdown({ text }) {
  const lines = String(text).split("\n");
  const out = [];
  let listBuf = [];
  const flushList = (key) => {
    if (listBuf.length) {
      out.push(
        <ul key={`ul-${key}`} style={{ margin: "6px 0 10px 18px", padding: 0 }}>
          {listBuf.map((li, i) => (
            <li key={i} style={{ marginBottom: 4 }}>{renderInline(li, `li-${key}-${i}`)}</li>
          ))}
        </ul>
      );
      listBuf = [];
    }
  };
  lines.forEach((line, idx) => {
    const t = line.trim();
    if (/^[-*•]\s+/.test(t)) { listBuf.push(t.replace(/^[-*•]\s+/, "")); return; }
    if (/^\d+[.)]\s+/.test(t)) { listBuf.push(t); return; }
    flushList(idx);
    if (t.startsWith("### ")) out.push(<h4 key={idx} style={{ margin: "14px 0 6px", color: "#00f5d4", fontSize: 14 }}>{t.slice(4)}</h4>);
    else if (t.startsWith("## ")) out.push(<h3 key={idx} style={{ margin: "16px 0 6px", color: "#00f5d4", fontSize: 15 }}>{t.slice(3)}</h3>);
    else if (t.startsWith("# ")) out.push(<h3 key={idx} style={{ margin: "16px 0 6px", color: "#00f5d4", fontSize: 16 }}>{t.slice(2)}</h3>);
    else if (t === "---") out.push(<hr key={idx} style={{ border: "none", borderTop: "1px solid rgba(255,255,255,.1)", margin: "12px 0" }} />);
    else if (t === "") out.push(<div key={idx} style={{ height: 6 }} />);
    else out.push(<p key={idx} style={{ margin: "2px 0", lineHeight: 1.55 }}>{renderInline(t, `p-${idx}`)}</p>);
  });
  flushList("end");
  return <div>{out}</div>;
}

// ══════════════════════════════════════════════════════════════════
//  STYLES PARTAGÉS
// ══════════════════════════════════════════════════════════════════

const S = {
  page: { minHeight: "100vh", background: "#0a0a14", color: "#e8e8f0", fontFamily: "'DM Sans', sans-serif" },
  card: { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 16, padding: 20 },
  h2: { fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, margin: "0 0 4px" },
  sub: { color: "#8888a0", fontSize: 13, margin: "0 0 16px" },
  label: { display: "block", fontSize: 12, color: "#8888a0", marginBottom: 4, marginTop: 12 },
  input: { width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 14, outline: "none" },
  btn: { background: "linear-gradient(135deg,#00f5d4,#00b8a9)", color: "#0a0a14", border: "none", borderRadius: 10, padding: "11px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 16 },
  result: { marginTop: 16, background: "rgba(0,245,212,.06)", border: "1px solid rgba(0,245,212,.25)", borderRadius: 12, padding: 16 },
  warn: { marginTop: 10, fontSize: 12, color: "#f9c74f", lineHeight: 1.5 },
  kpi: { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 14, padding: 16, textAlign: "center" },
};

function Field({ label, value, onChange, type = "number", ...rest }) {
  return (
    <div>
      <label style={S.label}>{label}</label>
      <input style={S.input} type={type} value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label style={S.label}>{label}</label>
      <select style={{ ...S.input, appearance: "auto" }} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => <option key={v} value={v} style={{ color: "#000" }}>{l}</option>)}
      </select>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  ONGLET 1 — ASSISTANT (chat)
// ══════════════════════════════════════════════════════════════════

function ChatTab({ messages, setMessages, pendingPrompt, clearPending }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (pendingPrompt) { setInput(pendingPrompt); clearPending(); }
  }, [pendingPrompt, clearPending]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const callApi = async (next) => {
    const headers = { "Content-Type": "application/json" };
    const code = localStorage.getItem("drh_access_code");
    if (code) headers["x-access-code"] = code;
    return fetch("/api/drh", { method: "POST", headers, body: JSON.stringify({ messages: next }) });
  };

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      let res = await callApi(next);
      if (res.status === 401) {
        // Le serveur exige un code d'accès (DRH_ACCESS_CODE) : on le demande une fois
        const code = window.prompt("Code d'accès DRH Copilot :");
        if (code) {
          localStorage.setItem("drh_access_code", code.trim());
          res = await callApi(next);
        }
      }
      const data = await res.json();
      if (res.status === 401) throw new Error("Code d'accès invalide");
      if (!res.ok) throw new Error(data.detail || data.error || "Erreur API");
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setMessages([...next, { role: "assistant", content: `⚠️ Erreur : ${e.message}. Vérifiez que la clé API est configurée côté serveur (ANTHROPIC_API_KEY) puis réessayez.` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 190px)", minHeight: 420 }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 4px" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <div style={{ fontSize: 44 }}>🧭</div>
            <h2 style={{ ...S.h2, fontSize: 24 }}>Votre DRH autonome</h2>
            <p style={{ ...S.sub, maxWidth: 520, margin: "8px auto 20px" }}>
              Expert droit du travail & CCN Transport routier de marchandises (IDCC 16 — brochure 3085).
              Il analyse, vérifie ses sources, challenge vos demandes et propose des actions concrètes.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 640, margin: "0 auto" }}>
              {QUICK_PROMPTS.map((q) => (
                <button key={q} onClick={() => send(q)} style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.14)", color: "#c8c8dc", borderRadius: 20, padding: "8px 14px", fontSize: 12.5, cursor: "pointer" }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", margin: "10px 0" }}>
            <div style={{
              maxWidth: "82%", borderRadius: 14, padding: "12px 16px", fontSize: 14,
              background: m.role === "user" ? "linear-gradient(135deg,#00f5d4,#00b8a9)" : "rgba(255,255,255,.05)",
              color: m.role === "user" ? "#0a0a14" : "#e8e8f0",
              border: m.role === "user" ? "none" : "1px solid rgba(255,255,255,.09)",
              fontWeight: m.role === "user" ? 500 : 400,
            }}>
              {m.role === "assistant" ? <Markdown text={m.content} /> : m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ color: "#00f5d4", fontSize: 13, padding: "8px 4px" }}>
            🧭 Le DRH analyse votre demande…
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: "flex", gap: 8, paddingTop: 10 }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Posez votre question RH, demandez un document, un process, un calcul…"
          rows={2}
          style={{ ...S.input, resize: "none", flex: 1 }}
        />
        <button onClick={() => send()} disabled={loading} style={{ ...S.btn, marginTop: 0, opacity: loading ? 0.5 : 1 }}>
          Envoyer
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  ONGLET 2 — CALCULATEURS
// ══════════════════════════════════════════════════════════════════

function CalcLicenciement({ askBot }) {
  const [salaire, setSalaire] = useState("2400");
  const [salaire12, setSalaire12] = useState("");
  const [annees, setAnnees] = useState("8");
  const [mois, setMois] = useState("0");
  const [cat, setCat] = useState("oe");
  const [anneesNonCadre, setAnneesNonCadre] = useState("0");
  const [motif, setMotif] = useState("licenciement");
  const [res, setRes] = useState(null);

  const compute = () => {
    // Bases distinctes : la base conventionnelle est la moyenne des 3 derniers mois
    // (ouvriers/employés) ou le salaire effectif à la cessation (TAM/cadres) — champ 1 ;
    // la base légale retient le plus favorable entre moyenne 12 mois et moyenne 3 mois.
    const sConv = parseFloat(salaire) || 0;
    const s12 = parseFloat(salaire12) || 0;
    const sLegal = Math.max(sConv, s12);
    const anc = (parseFloat(annees) || 0) + (parseFloat(mois) || 0) / 12;
    const legale = anc * 12 >= 8 ? indemniteLegaleLicenciement(sLegal, anc) : 0;
    const conv = indemniteConventionnelleIDCC16(sConv, anc, cat, parseFloat(anneesNonCadre) || 0);
    setRes({ s: sConv, sLegal, anc, legale, conv: conv.total, complement: conv.complement, due: Math.max(legale, conv.total) });
  };

  const catLabel = { oe: "Ouvrier / Employé", tam: "Technicien / Agent de maîtrise", cadre: "Ingénieur / Cadre" }[cat];

  return (
    <div style={S.card}>
      <h3 style={S.h2}>💼 Indemnité de licenciement / rupture conventionnelle</h3>
      <p style={S.sub}>Comparaison automatique indemnité légale vs conventionnelle IDCC 16 — le montant le plus favorable s'applique.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
        <Field label="Moyenne 3 derniers mois — ou salaire effectif TAM/cadre (€ brut)" value={salaire} onChange={setSalaire} />
        <Field label="Moyenne 12 derniers mois (€ brut, optionnel)" value={salaire12} onChange={setSalaire12} placeholder="si différente" />
        <Field label="Ancienneté — années" value={annees} onChange={setAnnees} />
        <Field label="Ancienneté — mois supplémentaires" value={mois} onChange={setMois} />
        <Select label="Catégorie (CCN IDCC 16)" value={cat} onChange={setCat}
          options={[["oe", "Ouvrier / Employé"], ["tam", "Technicien / Agent de maîtrise"], ["cadre", "Ingénieur / Cadre"]]} />
        {cat === "cadre" && (
          <Field label="Dont années comme employé/TAM avant passage cadre" value={anneesNonCadre} onChange={setAnneesNonCadre} />
        )}
        <Select label="Type de rupture" value={motif} onChange={setMotif}
          options={[["licenciement", "Licenciement (hors faute grave/lourde)"], ["rc", "Rupture conventionnelle"]]} />
      </div>
      <button style={S.btn} onClick={compute}>Calculer</button>
      {res && (
        <div style={S.result}>
          <p style={{ margin: 0, fontSize: 13, color: "#8888a0" }}>
            {catLabel} · {res.anc.toFixed(2).replace(".", ",")} ans · base conventionnelle {euro(res.s)}{res.sLegal !== res.s ? ` · base légale ${euro(res.sLegal)}` : ""}
          </p>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", margin: "12px 0" }}>
            <div><div style={{ fontSize: 12, color: "#8888a0" }}>Indemnité légale (art. R1234-2)</div><div style={{ fontSize: 20, fontWeight: 700 }}>{euro(res.legale)}</div></div>
            <div><div style={{ fontSize: 12, color: "#8888a0" }}>Indemnité conventionnelle IDCC 16{res.complement > 0 ? " (dont complément cadre)" : ""}</div><div style={{ fontSize: 20, fontWeight: 700 }}>{euro(res.conv)}{res.complement > 0 ? <span style={{ fontSize: 12, color: "#8888a0" }}> (compl. {euro(res.complement)})</span> : null}</div></div>
            <div><div style={{ fontSize: 12, color: "#00f5d4" }}>Montant minimum dû {motif === "rc" ? "(indemnité spécifique RC)" : ""}</div><div style={{ fontSize: 26, fontWeight: 800, color: "#00f5d4" }}>{euro(res.due)}</div></div>
          </div>
          <div style={S.warn}>
            ⚠️ Estimation indicative — barèmes conventionnels vérifiés (synthèse CCN 3085 à jour du 07/10/2025). Indemnité légale due dès 8 mois d'ancienneté, conventionnelle dès 2 ans ; <strong>indemnité légale doublée en cas d'inaptitude d'origine professionnelle</strong>. Le complément cadre (2/3/4 mois à 10/20/30 ans, le palier 10 ans exigeant 5 ans comme cadre) est réservé aux cadres de <strong>moins de 65 ans</strong> ; cadre licencié entre 60 et 65 ans pouvant liquider sa retraite : minoration possible de 20 %/an — faites vérifier ces cas par le DRH. Faute grave/lourde : pas d'indemnité.
          </div>
          <button onClick={() => askBot(`Vérifie et détaille ce calcul d'indemnité de ${motif === "rc" ? "rupture conventionnelle" : "licenciement"} : ${catLabel}, ${res.anc.toFixed(2)} ans d'ancienneté, salaire de référence ${res.s} € brut/mois, CCN transport routier IDCC 16. Donne le calcul étape par étape, la base juridique, le régime social et fiscal de l'indemnité, et les points de vigilance.`)}
            style={{ ...S.btn, marginTop: 12, background: "rgba(255,255,255,.1)", color: "#00f5d4" }}>
            🧭 Faire vérifier par le DRH
          </button>
        </div>
      )}
    </div>
  );
}

function CalcRetraite({ askBot }) {
  const [salaire, setSalaire] = useState("2400");
  const [annees, setAnnees] = useState("22");
  const [cat, setCat] = useState("oe");
  const [mode, setMode] = useState("depart");
  const [res, setRes] = useState(null);

  const compute = () => {
    const s = parseFloat(salaire) || 0;
    const anc = parseFloat(annees) || 0;
    if (mode === "mise") {
      // Mise à la retraite par l'employeur = indemnité légale de licenciement (art. L1237-7)
      setRes({ s, anc, montant: indemniteLegaleLicenciement(s, anc), detail: "Indemnité légale de licenciement (art. L1237-7)" });
      return;
    }
    if (cat === "cadre") {
      setRes({ s, anc, montant: indemniteRetraiteLegale(s, anc), detail: "Minimum légal (art. D1237-1) — le barème cadres IDCC 16 (% de la rémunération annuelle, art. 18 annexe IV) peut être plus favorable : faites-le vérifier par le DRH" });
      return;
    }
    const legale = indemniteRetraiteLegale(s, anc);
    const conv = indemniteRetraiteConvIDCC16(s, anc);
    setRes({ s, anc, montant: Math.max(legale, conv), detail: `Légale ${euro(legale)} vs conventionnelle IDCC 16 ${euro(conv)} — le plus favorable est retenu (base conventionnelle : moyenne des 12 derniers mois)` });
  };

  return (
    <div style={S.card}>
      <h3 style={S.h2}>🌅 Indemnité de départ / mise à la retraite</h3>
      <p style={S.sub}>Départ volontaire : légale (art. D1237-1) vs barème IDCC 16 (0,5 à 2,5 mois selon ancienneté). Mise à la retraite : indemnité légale de licenciement.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
        <Field label="Salaire mensuel brut de référence (€)" value={salaire} onChange={setSalaire} />
        <Field label="Ancienneté (années)" value={annees} onChange={setAnnees} />
        <Select label="Catégorie" value={cat} onChange={setCat}
          options={[["oe", "Ouvrier / Employé"], ["tam", "Technicien / Agent de maîtrise"], ["cadre", "Ingénieur / Cadre"]]} />
        <Select label="Type" value={mode} onChange={setMode}
          options={[["depart", "Départ volontaire à la retraite"], ["mise", "Mise à la retraite par l'employeur"]]} />
      </div>
      <button style={S.btn} onClick={compute}>Calculer</button>
      {res && (
        <div style={S.result}>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#00f5d4" }}>{euro(res.montant)}</div>
          <div style={{ fontSize: 12.5, color: "#8888a0", marginTop: 6 }}>{res.detail}</div>
          <div style={S.warn}>
            ⚠️ Pensez au congé de fin d'activité (CFA) des conducteurs : départ possible dès 55 ans (âge minimal 59 ans depuis le 01/09/2023, progressif avec la réforme des retraites). Régime social/fiscal différent selon départ volontaire ou mise à la retraite.
          </div>
          <button onClick={() => askBot(`Détaille le calcul de l'indemnité de ${mode === "depart" ? "départ volontaire à la retraite" : "mise à la retraite par l'employeur"} pour un ${cat === "cadre" ? "cadre" : cat === "tam" ? "TAM" : "ouvrier/employé"} du transport routier (IDCC 16) : ${res.anc} ans d'ancienneté, ${res.s} € brut/mois. Applique le barème conventionnel exact (annexes CCN 3085), précise le régime social et fiscal, et le dispositif congé de fin d'activité (CFA) des conducteurs.`)}
            style={{ ...S.btn, marginTop: 12, background: "rgba(255,255,255,.1)", color: "#00f5d4" }}>
            🧭 Faire vérifier par le DRH
          </button>
        </div>
      )}
    </div>
  );
}

function CalcPreavis({ askBot }) {
  const [ancMois, setAncMois] = useState("30");
  const [cat, setCat] = useState("ouvrier");
  const [type, setType] = useState("licenciement");
  const [res, setRes] = useState(null);

  const heuresRecherche = {
    ouvrier: "12 h d'absence rémunérée pour recherche d'emploi (TRM : 6 h au choix du salarié, 6 h employeur)",
    etam15: "2 h payées/jour pendant 1 mois pour recherche d'emploi",
    tam68: "2 h payées/jour pendant 2 mois — dispense possible après le 1er mois (prévenance 10 j)",
    cadre: "2 h payées/jour pendant 2 mois — dispense possible après le 2e mois (prévenance 15 j)",
  };

  return (
    <div style={S.card}>
      <h3 style={S.h2}>⏳ Préavis (démission / licenciement)</h3>
      <p style={S.sub}>Durées conventionnelles vérifiées — synthèse CCN 3085 (art. 3/5 ann. I, 11/13 ann. II, 11/17 ann. III, 8/15 ann. IV).</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
        <Select label="Catégorie" value={cat} onChange={setCat}
          options={[["ouvrier", "Ouvrier"], ["etam15", "Employé / TAM groupes 1-5"], ["tam68", "TAM groupes 6-8"], ["cadre", "Ingénieur / Cadre"]]} />
        <Select label="Type de rupture" value={type} onChange={setType}
          options={[["licenciement", "Licenciement"], ["demission", "Démission"]]} />
        <Field label="Ancienneté (en mois)" value={ancMois} onChange={setAncMois} />
      </div>
      <button style={S.btn} onClick={() => setRes(preavisIDCC16(cat, parseFloat(ancMois) || 0, type))}>Calculer</button>
      {res && (
        <div style={S.result}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#00f5d4" }}>{res}</div>
          <div style={{ fontSize: 12.5, color: "#8888a0", marginTop: 6 }}>{type === "licenciement" ? heuresRecherche[cat] : ""}</div>
          <div style={S.warn}>
            ⚠️ Pas de préavis en cas de faute grave/lourde ou d'inaptitude (régime spécifique). Les minima légaux (art. L1234-1) s'appliquent s'ils sont plus favorables.
          </div>
          <button onClick={() => askBot(`Détaille le régime complet du préavis pour un ${cat === "ouvrier" ? "ouvrier" : cat === "etam15" ? "employé/TAM groupes 1-5" : cat === "tam68" ? "TAM groupes 6-8" : "cadre"} du transport routier (CCN IDCC 16) en cas de ${type} avec ${ancMois} mois d'ancienneté : durée, heures de recherche d'emploi, dispenses possibles, indemnité compensatrice, articles applicables.`)}
            style={{ ...S.btn, marginTop: 12, background: "rgba(255,255,255,.1)", color: "#00f5d4" }}>
            🧭 Demander le détail au DRH
          </button>
        </div>
      )}
    </div>
  );
}

function CalcDelaiEntretien({ askBot }) {
  const today = new Date().toISOString().slice(0, 10);
  const [mode, setMode] = useState("lrar-envoi");
  const [dateRemise, setDateRemise] = useState(today);
  const [achemine, setAchemine] = useState("3");
  const [marge, setMarge] = useState("1");
  const [dateEntretien, setDateEntretien] = useState("");
  const [alsace, setAlsace] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [res, setRes] = useState(null);

  const compute = () => {
    // En mode "date d'envoi", on estime la 1re présentation (acheminement
    // paramétrable), puis on ajoute une marge de sécurité en jours ouvrables.
    let presentationISO = dateRemise;
    let presentation = null;
    if (mode === "lrar-envoi") {
      presentation = avanceJoursOuvrables(dateRemise, parseInt(achemine, 10), alsace);
      if (!presentation) return;
      presentationISO = presentation.toISOString().slice(0, 10);
    }
    const delai = calculeDelaiEntretien(presentationISO, alsace);
    if (!delai) return;
    const nbMarge = parseInt(marge, 10);
    const conseil = nbMarge > 0
      ? avanceJoursOuvrables(delai.entretien.toISOString().slice(0, 10), nbMarge, alsace)
      : delai.entretien;
    const notif = dateEntretien ? fenetreNotification(dateEntretien, alsace) : null;
    setRes({ ...delai, presentation, presentationISO, conseil, notif });
  };

  return (
    <div style={S.card}>
      <h3 style={S.h2}>📅 Délai convocation → entretien préalable</h3>
      <p style={S.sub}>
        5 jours ouvrables pleins minimum (art. L1232-2) — jours fériés français calculés automatiquement
        pour chaque année (fêtes mobiles incluses : Pâques, Ascension, Pentecôte). Aucune mise à jour manuelle nécessaire.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
        <Select label="Situation" value={mode} onChange={setMode}
          options={[
            ["lrar-envoi", "LRAR — je connais seulement la date d'envoi"],
            ["lrar", "LRAR — 1re présentation connue (suivi La Poste)"],
            ["mainpropre", "Remise en main propre contre décharge"],
          ]} />
        <Field type="date" value={dateRemise} onChange={setDateRemise}
          label={mode === "lrar-envoi" ? "Date d'ENVOI de la LRAR" : mode === "lrar" ? "Date de PREMIÈRE PRÉSENTATION de la LRAR" : "Date de remise en main propre"} />
        {mode === "lrar-envoi" && (
          <Select label="Acheminement estimé" value={achemine} onChange={setAchemine}
            options={[["2", "J+2 — optimiste"], ["3", "J+3 — standard La Poste"], ["4", "J+4 — prudent"], ["5", "J+5 — très prudent"]]} />
        )}
        <Select label="Marge de sécurité (jours ouvrables)" value={marge} onChange={setMarge}
          options={[["0", "Aucune"], ["1", "+1 jour — recommandé"], ["2", "+2 jours"], ["3", "+3 jours"]]} />
        <Field type="date" value={dateEntretien} onChange={setDateEntretien}
          label="Date d'entretien envisagée (optionnel → fenêtre de notification)" />
        <div>
          <label style={S.label}>Jours fériés locaux</label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#c8c8dc", padding: "10px 0", cursor: "pointer" }}>
            <input type="checkbox" checked={alsace} onChange={(e) => setAlsace(e.target.checked)} />
            Alsace-Moselle (+ Vendredi Saint, 26 déc.)
          </label>
        </div>
      </div>
      <button style={S.btn} onClick={compute}>Calculer</button>
      {res && (
        <div style={S.result}>
          {res.presentation && (
            <div style={{ fontSize: 13, marginBottom: 10 }}>
              1ʳᵉ présentation estimée : <strong style={{ textTransform: "capitalize" }}>{frDate(res.presentation)}</strong>
              <span style={{ color: "#8888a0" }}> — à confirmer sur le suivi La Poste</span>
            </div>
          )}
          <div style={{ fontSize: 12, color: "#8888a0" }}>
            {mode === "lrar-envoi" ? "Minimum légal (si présentation conforme à l'estimation)" : "Entretien préalable possible au plus tôt le"}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#c8c8dc", textTransform: "capitalize" }}>{frDate(res.entretien)}</div>
          <div style={{ fontSize: 12, color: "#8888a0", marginTop: 10 }}>Date d'entretien conseillée (avec marge)</div>
          <div style={{ fontSize: 21, fontWeight: 800, color: "#00f5d4", textTransform: "capitalize" }}>{frDate(res.conseil)}</div>
          {res.notif && (
            <div style={{ marginTop: 10, fontSize: 13.5 }}>
              Si l'entretien a lieu le <strong style={{ textTransform: "capitalize" }}>{frDate(new Date(dateEntretien + "T12:00:00Z"))}</strong> :
              notification du licenciement au plus tôt le <strong style={{ color: "#00f5d4", textTransform: "capitalize" }}>{frDate(res.notif.min)}</strong> (2
              jours ouvrables, art. L1232-6) et au plus tard le <strong style={{ color: "#f9c74f", textTransform: "capitalize" }}>{frDate(res.notif.max)}</strong> (1 mois, art. L1332-2).
            </div>
          )}
          <button onClick={() => setShowDetail(!showDetail)}
            style={{ background: "none", border: "none", color: "#8888a0", fontSize: 12, cursor: "pointer", padding: 0, marginTop: 10, textDecoration: "underline" }}>
            {showDetail ? "Masquer" : "Voir"} le décompte jour par jour
          </button>
          {showDetail && (
            <ul style={{ margin: "8px 0 0 18px", padding: 0, fontSize: 12.5, color: "#c8c8dc" }}>
              <li>{new Date(res.presentationISO + "T12:00:00Z").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })} — jour de {mode === "lrar" ? "première présentation" : mode === "lrar-envoi" ? "présentation estimée" : "remise"} : ne compte pas</li>
              {res.detail.map((j) => (
                <li key={j.iso}>{new Date(j.iso + "T12:00:00Z").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })} — {j.statut}</li>
              ))}
            </ul>
          )}
          <div style={S.warn}>
            ⚠️ En LRAR, le délai court à la <strong>première présentation</strong> du courrier (pas à son retrait). {mode === "lrar-envoi" && (<><strong>Mode estimation :</strong> dès l'envoi, notez le n° du recommandé et suivez-le sur laposte.fr — le suivi affiche « Présenté le… » ; si la présentation réelle est plus tardive que l'estimation, recalculez en mode « 1ʳᵉ présentation connue » et reportez l'entretien si besoin. </>)}Le jour de remise et le jour de l'entretien ne comptent pas ; dimanches et fériés exclus. Une convocation trop juste rend la procédure irrégulière (indemnité jusqu'à 1 mois de salaire) — d'où la date conseillée avec marge. La convocation doit mentionner l'objet et la possibilité d'assistance du salarié.
          </div>
          <button onClick={() => askBot(`Vérifie mon planning de procédure de licenciement : convocation ${mode === "lrar" ? "envoyée en LRAR, première présentation le" : "remise en main propre le"} ${dateRemise}${dateEntretien ? `, entretien prévu le ${dateEntretien}` : ""}${alsace ? " (établissement en Alsace-Moselle)" : ""}. Confirme le respect des délais (art. L1232-2, L1232-6, L1332-2, prescription L1332-4), liste les mentions obligatoires de la convocation et les prochaines étapes avec dates.`)}
            style={{ ...S.btn, marginTop: 12, background: "rgba(255,255,255,.1)", color: "#00f5d4" }}>
            🧭 Faire vérifier le planning par le DRH
          </button>
        </div>
      )}
    </div>
  );
}

function CalculatorsTab({ askBot }) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <CalcDelaiEntretien askBot={askBot} />
      <CalcLicenciement askBot={askBot} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>
        <CalcRetraite askBot={askBot} />
        <CalcPreavis askBot={askBot} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  ONGLET 3 — TABLEAU DE BORD SOCIAL
// ══════════════════════════════════════════════════════════════════

function DashboardTab({ askBot }) {
  const [f, setF] = useState({
    effectifDebut: "60", effectifFin: "58", entrees: "9", sorties: "11",
    joursAbsence: "210", joursTheoriques: "1260",
    heuresTravaillees: "97000", nbAT: "3", masseSalariale: "185000",
  });
  const set = (k) => (v) => setF({ ...f, [k]: v });
  const n = (k) => parseFloat(f[k]) || 0;

  const effMoyen = (n("effectifDebut") + n("effectifFin")) / 2 || 1;
  const turnover = ((n("entrees") + n("sorties")) / 2 / effMoyen) * 100;
  const absenteisme = n("joursTheoriques") ? (n("joursAbsence") / n("joursTheoriques")) * 100 : 0;
  const tauxFrequence = n("heuresTravaillees") ? (n("nbAT") * 1_000_000) / n("heuresTravaillees") : 0;
  const coutAbsenteisme = n("masseSalariale") * (absenteisme / 100);

  const kpis = [
    { label: "Turnover (mensualisé)", value: `${turnover.toFixed(1)} %`, alert: turnover > 4, hint: "((entrées + sorties) / 2) / effectif moyen" },
    { label: "Absentéisme", value: `${absenteisme.toFixed(1)} %`, alert: absenteisme > 8, hint: "jours d'absence / jours théoriques travaillés" },
    { label: "Taux de fréquence AT", value: tauxFrequence.toFixed(1), alert: tauxFrequence > 40, hint: "nb AT × 1 000 000 / heures travaillées" },
    { label: "Coût estimé absentéisme", value: euro(coutAbsenteisme), alert: false, hint: "masse salariale × taux d'absentéisme (ordre de grandeur)" },
  ];

  const analysePrompt = `Analyse mon tableau de bord social mensuel (PME transport routier de marchandises, IDCC 16) :
- Effectif début ${f.effectifDebut} / fin ${f.effectifFin}, ${f.entrees} entrées, ${f.sorties} sorties (turnover calculé ${turnover.toFixed(1)} %)
- ${f.joursAbsence} jours d'absence sur ${f.joursTheoriques} jours théoriques (absentéisme ${absenteisme.toFixed(1)} %)
- ${f.nbAT} accidents du travail pour ${f.heuresTravaillees} heures travaillées (taux de fréquence ${tauxFrequence.toFixed(1)})
- Masse salariale mensuelle ${f.masseSalariale} €
Compare aux références du secteur transport, identifie les 3 priorités, challenge mes chiffres si besoin, et propose un plan d'action concret sur 90 jours avec indicateurs de suivi.`;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={S.card}>
        <h3 style={S.h2}>📊 Tableau de bord social — saisie du mois</h3>
        <p style={S.sub}>Saisissez vos données : les indicateurs se calculent en direct, puis faites analyser le tout par le DRH.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 }}>
          <Field label="Effectif début de mois" value={f.effectifDebut} onChange={set("effectifDebut")} />
          <Field label="Effectif fin de mois" value={f.effectifFin} onChange={set("effectifFin")} />
          <Field label="Entrées (embauches)" value={f.entrees} onChange={set("entrees")} />
          <Field label="Sorties (départs)" value={f.sorties} onChange={set("sorties")} />
          <Field label="Jours d'absence" value={f.joursAbsence} onChange={set("joursAbsence")} />
          <Field label="Jours théoriques travaillés" value={f.joursTheoriques} onChange={set("joursTheoriques")} />
          <Field label="Heures travaillées" value={f.heuresTravaillees} onChange={set("heuresTravaillees")} />
          <Field label="Accidents du travail (avec arrêt)" value={f.nbAT} onChange={set("nbAT")} />
          <Field label="Masse salariale mensuelle (€)" value={f.masseSalariale} onChange={set("masseSalariale")} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
        {kpis.map((k) => (
          <div key={k.label} style={{ ...S.kpi, borderColor: k.alert ? "rgba(247,37,133,.5)" : "rgba(255,255,255,.09)" }}>
            <div style={{ fontSize: 12, color: "#8888a0" }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: k.alert ? "#f72585" : "#00f5d4", margin: "6px 0" }}>{k.value}</div>
            {k.alert && <div style={{ fontSize: 11, color: "#f72585", fontWeight: 700 }}>⚠ seuil de vigilance dépassé</div>}
            <div style={{ fontSize: 10.5, color: "#666680", marginTop: 4 }}>{k.hint}</div>
          </div>
        ))}
      </div>
      <button style={{ ...S.btn, marginTop: 0 }} onClick={() => askBot(analysePrompt)}>
        🧭 Faire analyser ce tableau de bord par le DRH
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  ONGLET 4 — DOCUMENTS & PROCESS
// ══════════════════════════════════════════════════════════════════

function DocsTab({ askBot }) {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      {DOC_LIBRARY.map((group) => (
        <div key={group.cat}>
          <h3 style={{ ...S.h2, fontSize: 16, color: "#00f5d4" }}>{group.cat}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 10, marginTop: 8 }}>
            {group.items.map((item) => (
              <button key={item.label} onClick={() => askBot(item.prompt)}
                style={{ ...S.card, padding: 14, textAlign: "left", cursor: "pointer", color: "#e8e8f0", fontSize: 13.5, display: "flex", gap: 10, alignItems: "flex-start", fontFamily: "'DM Sans', sans-serif" }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
      <p style={{ ...S.sub, marginTop: 4 }}>
        Chaque modèle est généré par le DRH avec les mentions obligatoires et la base juridique — relisez et adaptez avant envoi.
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  APP
// ══════════════════════════════════════════════════════════════════

const TABS = [
  { id: "chat", label: "💬 Assistant" },
  { id: "calc", label: "🧮 Calculateurs" },
  { id: "dash", label: "📊 Tableau de bord" },
  { id: "docs", label: "📄 Documents & Process" },
];

export default function DRHApp() {
  const [tab, setTab] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [pendingPrompt, setPendingPrompt] = useState(null);

  // Depuis n'importe quel onglet : pré-remplit le chat et bascule dessus
  const askBot = (prompt) => {
    setPendingPrompt(prompt);
    setTab("chat");
  };

  return (
    <div style={S.page}>
      <style>{FONTS}</style>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,.08)", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20 }}>
            🧭 DRH <span style={{ color: "#00f5d4" }}>Copilot</span>
          </div>
          <div style={{ fontSize: 11.5, color: "#8888a0" }}>
            Agent RH autonome · Transport routier de marchandises · CCN IDCC 16 (brochure 3085)
          </div>
        </div>
        <nav style={{ display: "flex", gap: 6, marginLeft: "auto", flexWrap: "wrap" }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                background: tab === t.id ? "rgba(0,245,212,.14)" : "transparent",
                border: `1px solid ${tab === t.id ? "rgba(0,245,212,.5)" : "rgba(255,255,255,.12)"}`,
                color: tab === t.id ? "#00f5d4" : "#c8c8dc",
                borderRadius: 20, padding: "8px 14px", fontSize: 13, cursor: "pointer", fontWeight: tab === t.id ? 700 : 400,
              }}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 20px 40px" }}>
        {tab === "chat" && <ChatTab messages={messages} setMessages={setMessages} pendingPrompt={pendingPrompt} clearPending={() => setPendingPrompt(null)} />}
        {tab === "calc" && <CalculatorsTab askBot={askBot} />}
        {tab === "dash" && <DashboardTab askBot={askBot} />}
        {tab === "docs" && <DocsTab askBot={askBot} />}
      </main>
      <footer style={{ textAlign: "center", padding: "12px 20px 24px", fontSize: 11, color: "#666680" }}>
        ⚖️ Outil d'aide à la décision RH — ne remplace pas un conseil juridique individualisé. Vérifiez les textes en vigueur sur legifrance.gouv.fr (CCN IDCC 16).
      </footer>
    </div>
  );
}
