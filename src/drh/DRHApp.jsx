import { useState, useRef, useEffect } from "react";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500;700&display=swap');`;

// ══════════════════════════════════════════════════════════════════
//  MOTEUR DE CALCUL — formules légales (Code du travail) + IDCC 16
//  Sources : art. L1234-9 / R1234-2 C. trav. (indemnité légale),
//  art. D1237-1 (départ volontaire à la retraite), art. L1234-1 (préavis),
//  CCN Transports routiers IDCC 16 brochure 3085 (barèmes conventionnels).
//  Les barèmes conventionnels évoluent : à vérifier sur Légifrance.
// ══════════════════════════════════════════════════════════════════

function indemniteLegaleLicenciement(salaireRef, anciennete) {
  // 1/4 de mois par année jusqu'à 10 ans, 1/3 au-delà (art. R1234-2)
  const a10 = Math.min(anciennete, 10);
  const plus10 = Math.max(anciennete - 10, 0);
  return salaireRef * (a10 / 4 + plus10 / 3);
}

function indemniteConventionnelleIDCC16(salaireRef, anciennete, categorie) {
  // Barèmes CCN IDCC 16 (à confirmer sur Légifrance à la date du calcul) :
  // Ouvriers/Employés : 1/10 de mois/an (2 à 3 ans), puis 2/10 de mois/an dès 3 ans
  // TAM : 1/10 (2 à 3 ans), puis 3/10 dès 3 ans
  // Ingénieurs/Cadres : 4/10 de mois par année dans la catégorie, dès 3 ans
  if (categorie === "cadre") {
    if (anciennete < 3) return 0;
    return salaireRef * 0.4 * anciennete;
  }
  if (anciennete < 2) return 0;
  const taux = anciennete < 3 ? 0.1 : categorie === "tam" ? 0.3 : 0.2;
  return salaireRef * taux * anciennete;
}

function indemniteRetraiteVolontaire(salaireRef, anciennete) {
  // Départ volontaire à la retraite — art. D1237-1
  if (anciennete >= 30) return salaireRef * 2;
  if (anciennete >= 20) return salaireRef * 1.5;
  if (anciennete >= 15) return salaireRef * 1;
  if (anciennete >= 10) return salaireRef * 0.5;
  return 0;
}

function preavisLegal(ancienneteMois) {
  // Licenciement — art. L1234-1
  if (ancienneteMois < 6) return "Durée fixée par la CCN / l'usage (pas de minimum légal)";
  if (ancienneteMois < 24) return "1 mois minimum (légal)";
  return "2 mois minimum (légal)";
}

const euro = (n) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

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

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/drh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
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
  const [annees, setAnnees] = useState("8");
  const [mois, setMois] = useState("0");
  const [cat, setCat] = useState("oe");
  const [motif, setMotif] = useState("licenciement");
  const [res, setRes] = useState(null);

  const compute = () => {
    const s = parseFloat(salaire) || 0;
    const anc = (parseFloat(annees) || 0) + (parseFloat(mois) || 0) / 12;
    const legale = anc * 12 >= 8 ? indemniteLegaleLicenciement(s, anc) : 0;
    const conv = indemniteConventionnelleIDCC16(s, anc, cat);
    setRes({ s, anc, legale, conv, due: Math.max(legale, conv) });
  };

  const catLabel = { oe: "Ouvrier / Employé", tam: "Technicien / Agent de maîtrise", cadre: "Ingénieur / Cadre" }[cat];

  return (
    <div style={S.card}>
      <h3 style={S.h2}>💼 Indemnité de licenciement / rupture conventionnelle</h3>
      <p style={S.sub}>Comparaison automatique indemnité légale vs conventionnelle IDCC 16 — le montant le plus favorable s'applique.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
        <Field label="Salaire mensuel brut de référence (€)" value={salaire} onChange={setSalaire} />
        <Field label="Ancienneté — années" value={annees} onChange={setAnnees} />
        <Field label="Ancienneté — mois supplémentaires" value={mois} onChange={setMois} />
        <Select label="Catégorie (CCN IDCC 16)" value={cat} onChange={setCat}
          options={[["oe", "Ouvrier / Employé"], ["tam", "Technicien / Agent de maîtrise"], ["cadre", "Ingénieur / Cadre"]]} />
        <Select label="Type de rupture" value={motif} onChange={setMotif}
          options={[["licenciement", "Licenciement (hors faute grave/lourde)"], ["rc", "Rupture conventionnelle"]]} />
      </div>
      <button style={S.btn} onClick={compute}>Calculer</button>
      {res && (
        <div style={S.result}>
          <p style={{ margin: 0, fontSize: 13, color: "#8888a0" }}>
            {catLabel} · {res.anc.toFixed(2).replace(".", ",")} ans · salaire de référence {euro(res.s)}
          </p>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", margin: "12px 0" }}>
            <div><div style={{ fontSize: 12, color: "#8888a0" }}>Indemnité légale (art. R1234-2)</div><div style={{ fontSize: 20, fontWeight: 700 }}>{euro(res.legale)}</div></div>
            <div><div style={{ fontSize: 12, color: "#8888a0" }}>Indemnité conventionnelle IDCC 16</div><div style={{ fontSize: 20, fontWeight: 700 }}>{euro(res.conv)}</div></div>
            <div><div style={{ fontSize: 12, color: "#00f5d4" }}>Montant minimum dû {motif === "rc" ? "(indemnité spécifique RC)" : ""}</div><div style={{ fontSize: 26, fontWeight: 800, color: "#00f5d4" }}>{euro(res.due)}</div></div>
          </div>
          <div style={S.warn}>
            ⚠️ Estimation indicative. Salaire de référence = le plus favorable entre la moyenne des 12 derniers mois et celle des 3 derniers mois (primes annuelles proratisées). Indemnité légale due dès 8 mois d'ancienneté ; <strong>doublée en cas d'inaptitude d'origine professionnelle</strong>. Barème conventionnel à confirmer sur Légifrance (IDCC 16). Faute grave/lourde : pas d'indemnité (sauf dispositions plus favorables).
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
  const [mode, setMode] = useState("depart");
  const [res, setRes] = useState(null);

  const compute = () => {
    const s = parseFloat(salaire) || 0;
    const anc = parseFloat(annees) || 0;
    const montant = mode === "depart" ? indemniteRetraiteVolontaire(s, anc) : indemniteLegaleLicenciement(s, anc);
    setRes({ s, anc, montant });
  };

  return (
    <div style={S.card}>
      <h3 style={S.h2}>🌅 Indemnité de départ / mise à la retraite</h3>
      <p style={S.sub}>Départ volontaire (art. D1237-1) ou mise à la retraite par l'employeur (= indemnité de licenciement).</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
        <Field label="Salaire mensuel brut de référence (€)" value={salaire} onChange={setSalaire} />
        <Field label="Ancienneté (années)" value={annees} onChange={setAnnees} />
        <Select label="Type" value={mode} onChange={setMode}
          options={[["depart", "Départ volontaire à la retraite"], ["mise", "Mise à la retraite par l'employeur"]]} />
      </div>
      <button style={S.btn} onClick={compute}>Calculer</button>
      {res && (
        <div style={S.result}>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#00f5d4" }}>{euro(res.montant)}</div>
          <div style={S.warn}>
            ⚠️ Minimum légal. La CCN IDCC 16 et le régime du congé de fin d'activité (CFA) peuvent prévoir mieux — à vérifier selon la catégorie et la date. Régime social/fiscal différent selon départ volontaire ou mise à la retraite.
          </div>
          <button onClick={() => askBot(`Détaille le calcul de l'indemnité de ${mode === "depart" ? "départ volontaire à la retraite" : "mise à la retraite par l'employeur"} pour un salarié du transport routier (IDCC 16) : ${res.anc} ans d'ancienneté, ${res.s} € brut/mois. Précise le régime social et fiscal, les dispositions conventionnelles éventuellement plus favorables et le dispositif congé de fin d'activité (CFA) des conducteurs.`)}
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
  const [res, setRes] = useState(null);

  return (
    <div style={S.card}>
      <h3 style={S.h2}>⏳ Préavis de licenciement</h3>
      <p style={S.sub}>Minimum légal (art. L1234-1) — la CCN IDCC 16 prévoit des durées spécifiques par catégorie, souvent plus favorables.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
        <Field label="Ancienneté (en mois)" value={ancMois} onChange={setAncMois} />
      </div>
      <button style={S.btn} onClick={() => setRes(preavisLegal(parseFloat(ancMois) || 0))}>Calculer</button>
      {res && (
        <div style={S.result}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#00f5d4" }}>{res}</div>
          <div style={S.warn}>
            ⚠️ Pas de préavis en cas de faute grave/lourde ou d'inaptitude. Consultez l'annexe de la CCN correspondant à la catégorie du salarié (ouvriers, employés, TAM, cadres) : les durées conventionnelles priment si plus favorables.
          </div>
          <button onClick={() => askBot(`Quelle est la durée exacte du préavis (licenciement ET démission) prévue par la CCN transport routier IDCC 16 pour chaque catégorie de salarié (ouvrier, employé, TAM, cadre) selon l'ancienneté ? Indique les articles/annexes de la convention et les cas de dispense.`)}
            style={{ ...S.btn, marginTop: 12, background: "rgba(255,255,255,.1)", color: "#00f5d4" }}>
            🧭 Demander le détail conventionnel au DRH
          </button>
        </div>
      )}
    </div>
  );
}

function CalculatorsTab({ askBot }) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
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
