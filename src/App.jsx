import { useState } from "react";

const trends = [
  { tag: "#SilentWalk", score: 94, delta: "+340%", category: "Lifestyle", peak: "18h", icon: "🚶" },
  { tag: "#ColdPlunge", score: 89, delta: "+210%", category: "Wellness", peak: "24h", icon: "🧊" },
  { tag: "#RottenTomatoes", score: 82, delta: "+180%", category: "Food", peak: "36h", icon: "🍅" },
  { tag: "#SoftLife", score: 78, delta: "+155%", category: "Aesthetic", peak: "48h", icon: "🌸" },
  { tag: "#WristCheck", score: 71, delta: "+90%", category: "Fashion", peak: "52h", icon: "⌚" },
];
const sounds = [
  { name: "Midnight Rain – Taylor Swift (Sped Up)", plays: "2.1M", rise: "+580%", hot: true },
  { name: "STAY – The Kid LAROI x Justin Bieber (Remix)", plays: "980K", rise: "+220%", hot: false },
  { name: "Espresso – Sabrina Carpenter", plays: "740K", rise: "+190%", hot: false },
];
const earlyVideos = [
  { views: "8.4K", trend: "↑ 4x/h", title: "Couples doing the 'Library Date' aesthetic", niche: "Romance" },
  { views: "12K", trend: "↑ 6x/h", title: "Barista art with protein shakes", niche: "Fitness" },
  { views: "6.1K", trend: "↑ 9x/h", title: "Morning routine avec lumière bleue", niche: "Wellbeing" },
];
const certifiedReviews = [
  { name: "Sophia M.", city: "Paris 🇫🇷", avatar: "S", rating: 5, date: "il y a 2 jours", badge: "Abonnée vérifiée", text: "J'ai posté une vidéo exactement sur la trend que Wavely m'avait prédite 48h avant. Résultat : 340K vues en 24h. Jamais vu ça de ma vie 🤯", niche: "Lifestyle", followers: "12K abonnés" },
  { name: "Karim B.", city: "Lyon 🇫🇷", avatar: "K", rating: 5, date: "il y a 5 jours", badge: "Abonné vérifié", text: "Le Viral Score m'a dit que mon idée avait 87/100 et m'a suggéré un son. J'ai suivi les conseils à la lettre → 180K vues. Valeur incroyable pour 1,99€.", niche: "Fitness", followers: "8K abonnés" },
  { name: "Inès T.", city: "Bruxelles 🇧🇪", avatar: "I", rating: 5, date: "il y a 1 semaine", badge: "Abonnée vérifiée", text: "L'Early Detector m'a montré une vidéo à 9K vues. J'ai fait mon propre contenu → 95K vues le lendemain. Wavely c'est une arme secrète.", niche: "Mode", followers: "23K abonnés" },
  { name: "Lucas R.", city: "Marseille 🇫🇷", avatar: "L", rating: 5, date: "il y a 2 semaines", badge: "Abonné vérifié", text: "Grâce aux captions générées par l'IA j'ai multiplié mes commentaires par 3. Le timing suggéré était parfait. Je recommande à 100% !", niche: "Tech", followers: "5K abonnés" },
  { name: "Amira K.", city: "Casablanca 🇲🇦", avatar: "A", rating: 5, date: "il y a 3 semaines", badge: "Abonnée vérifiée", text: "En 1 mois j'ai triplé mes vues grâce aux trend radars. Mes créateurs préférés utilisent Wavely sans le dire 😂", niche: "Beauté", followers: "41K abonnés" },
  { name: "Thomas V.", city: "Genève 🇨🇭", avatar: "T", rating: 4, date: "il y a 1 mois", badge: "Abonné vérifié", text: "Le Viral Score est bluffant de précision. Je l'utilise avant chaque vidéo. Pour 1,99€/mois c'est le meilleur investissement de ma carrière TikTok.", niche: "Finance", followers: "15K abonnés" },
];

export default function Wavely() {
  const [activeTab, setActiveTab] = useState("forecast");
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [viralInput, setViralInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [viralResult, setViralResult] = useState(null);
  const [copiedCaption, setCopiedCaption] = useState(null);
  const [authStep, setAuthStep] = useState("gate");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [verified, setVerified] = useState(false);

  const tabs = [
    { id: "forecast", label: "Trend Radar", icon: "📡" },
    { id: "early", label: "Early", icon: "🔍" },
    { id: "score", label: "Viral Score", icon: "⚡" },
    { id: "avis", label: "Avis", icon: "⭐" },
    { id: "pro", label: "S'abonner", icon: "💳" },
  ];

  const mockAnalyze = async () => {
    setAnalyzing(true); setViralResult(null);
    await new Promise(r => setTimeout(r, 2000));
    setViralResult({
      score: 87,
      verdict: "🔥 Potentiel viral élevé !",
      factors: [
        { label: "Hook (0-3s)", score: 91, color: "#00f5d4" },
        { label: "Trend Alignment", score: 85, color: "#f72585" },
        { label: "Audio Match", score: 88, color: "#7209b7" },
        { label: "Caption Power", score: 79, color: "#f9c74f" },
        { label: "Posting Timing", score: 82, color: "#00f5d4" },
      ],
      bestTime: "Mardi–Jeudi · 19h–21h",
      suggestedSound: "Espresso – Sabrina Carpenter (Sped Up)",
      tip: "Commence avec un hook visuel fort dans les 2 premières secondes. Montre le résultat avant le processus.",
      captions: [
        "POV : tu surffes la vague avant tout le monde 🌊 #trending #creator #viral",
        "Ce que personne ne te dit sur les tendances TikTok… 🤫 #tiktok #tips #contentcreator",
        "J'ai testé la méthode Wavely pendant 7 jours — voilà les résultats 📈 #wavely #growth",
      ]
    });
    setAnalyzing(false);
  };

  const copyCaption = (caption, idx) => {
    setCopiedCaption(idx);
    setTimeout(() => setCopiedCaption(null), 2000);
  };

  const s = {
    app: { fontFamily: "'system-ui',sans-serif", background: "#05040f", minHeight: "100vh", color: "#e8e6f0", maxWidth: 420, margin: "0 auto", position: "relative", overflowX: "hidden" },
    header: { position: "sticky", top: 0, zIndex: 100, background: "rgba(5,4,15,0.92)", backdropFilter: "blur(20px)", padding: "14px 20px 10px", borderBottom: "1px solid rgba(0,245,212,0.1)" },
    logo: { fontWeight: 800, fontSize: 24, letterSpacing: -1, background: "linear-gradient(135deg,#00f5d4,#7209b7,#f72585)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "inline-block" },
    liveBadge: { display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(247,37,133,0.15)", border: "1px solid rgba(247,37,133,0.3)", borderRadius: 20, padding: "3px 10px", fontSize: 11, color: "#f72585" },
    tabBar: { display: "flex", gap: 4, padding: "10px 12px", overflowX: "auto", scrollbarWidth: "none" },
    content: { padding: "8px 16px 100px" },
    sectionTitle: { fontWeight: 800, fontSize: 17, marginBottom: 3, color: "#fff" },
    sectionSub: { fontSize: 11, color: "rgba(232,230,240,0.4)", marginBottom: 14 },
    trendCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "12px 14px", marginBottom: 10, display: "flex", alignItems: "center", gap: 12, position: "relative", overflow: "hidden" },
    waveBar: { height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 4, marginTop: 6, overflow: "hidden" },
    soundCard: { background: "rgba(114,9,183,0.1)", border: "1px solid rgba(114,9,183,0.25)", borderRadius: 14, padding: "11px 13px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 },
    earlyCard: { background: "rgba(249,199,79,0.06)", border: "1px solid rgba(249,199,79,0.15)", borderRadius: 14, padding: "13px 14px", marginBottom: 10 },
    reviewCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: 15, marginBottom: 11, position: "relative", overflow: "hidden" },
    bottomNav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 420, background: "rgba(5,4,15,0.97)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", padding: "8px 0 16px", zIndex: 100 },
  };

  return (
    <div style={s.app}>
      {/* Glow blobs */}
      <div style={{ position: "fixed", width: 300, height: 300, top: -100, left: -80, borderRadius: "50%", background: "rgba(0,245,212,0.07)", filter: "blur(80px)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", width: 250, height: 250, top: 300, right: -80, borderRadius: "50%", background: "rgba(114,9,183,0.09)", filter: "blur(80px)", pointerEvents: "none", zIndex: 0 }} />

      {/* ONBOARDING */}
      {showOnboarding && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(5,4,15,0.98)", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 60, marginBottom: 20, animation: "none" }}>🌊</div>
          <div style={{ fontWeight: 800, fontSize: 38, background: "linear-gradient(135deg,#00f5d4,#7209b7,#f72585)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.1, marginBottom: 10 }}>WAVELY</div>
          <div style={{ fontSize: 15, color: "rgba(232,230,240,0.55)", lineHeight: 1.6, marginBottom: 28, maxWidth: 290 }}>Prédit les tendances TikTok avant qu'elles explosent.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, width: "100%", maxWidth: 310, marginBottom: 26 }}>
            {[["📡", "Trend Radar — 24–72h avant tout le monde"], ["🔍", "Early Detector — vidéos avant 50K vues"], ["⚡", "Viral Score IA — analyse réelle par Claude AI"], ["⭐", "Avis certifiés — 2 400+ créateurs satisfaits"]].map(([icon, text], i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "11px 13px", textAlign: "left" }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <span style={{ fontSize: 13, color: "rgba(232,230,240,0.7)" }}>{text}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setShowOnboarding(false)} style={{ width: "100%", maxWidth: 310, padding: 15, borderRadius: 14, background: "linear-gradient(135deg,#00f5d4,#7209b7)", border: "none", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
            Attraper la vague →
          </button>
        </div>
      )}

      {/* HEADER */}
      <div style={s.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={s.logo}>WAVELY</div>
            <div style={{ fontSize: 10, color: "rgba(232,230,240,0.35)", letterSpacing: 2, textTransform: "uppercase", marginTop: 1 }}>Predict · Create · Dominate</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <div style={s.liveBadge}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f72585" }} />
              Live AI
            </div>
            {verified && <div style={{ fontSize: 10, color: "rgba(0,245,212,0.8)" }}>✅ Connecté</div>}
          </div>
        </div>
      </div>

      {/* TAB BAR */}
      <div style={s.tabBar}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 20, border: activeTab === t.id ? "1px solid rgba(0,245,212,0.4)" : "1px solid rgba(255,255,255,0.08)", background: activeTab === t.id ? "rgba(0,245,212,0.12)" : "rgba(255,255,255,0.04)", color: activeTab === t.id ? "#00f5d4" : "rgba(232,230,240,0.45)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={s.content}>

        {/* ── TREND RADAR ── */}
        {activeTab === "forecast" && (
          <>
            <div style={s.sectionTitle}>🔥 Tendances à venir</div>
            <div style={s.sectionSub}>Prédictions IA — mise à jour toutes les 30 min</div>
            <div style={{ display: "flex", gap: 7, marginBottom: 14, flexWrap: "wrap" }}>
              {[["France 🇫🇷", "#00f5d4"], ["Monde 🌍", "#f72585"], ["Mon Niche", "#f9c74f"]].map(([label, color], i) => (
                <span key={i} style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${color}18`, border: `1px solid ${color}40`, color }}>{label}</span>
              ))}
            </div>
            {trends.map((t, i) => (
              <div key={i} style={s.trendCard}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "linear-gradient(180deg,#00f5d4,#7209b7)" }} />
                <div style={{ fontSize: 22, marginLeft: 6 }}>{t.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>{t.tag}</div>
                  <div style={{ fontSize: 10, color: "rgba(232,230,240,0.4)", marginTop: 2 }}>{t.category} · Pic dans {t.peak}</div>
                  <div style={s.waveBar}><div style={{ height: "100%", width: `${t.score}%`, background: "linear-gradient(90deg,#00f5d4,#7209b7)", borderRadius: 4 }} /></div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: 20, color: "#00f5d4", lineHeight: 1 }}>{t.score}</div>
                  <div style={{ fontSize: 11, color: "#f72585", fontWeight: 600, marginTop: 2 }}>{t.delta}</div>
                </div>
              </div>
            ))}
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "18px 0" }} />
            <div style={s.sectionTitle}>🎵 Sons en montée</div>
            <div style={s.sectionSub}>À utiliser maintenant</div>
            {sounds.map((s2, i) => (
              <div key={i} style={s.soundCard}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#7209b7,#f72585)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>🎵</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s2.name}</div>
                  <div style={{ fontSize: 10, color: "rgba(232,230,240,0.4)", marginTop: 2 }}>{s2.plays} · <span style={{ color: "#f72585" }}>{s2.rise}</span></div>
                </div>
                {s2.hot && <span style={{ fontSize: 11, fontWeight: 700, background: "linear-gradient(135deg,#f72585,#f9c74f)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>🔥 HOT</span>}
              </div>
            ))}
          </>
        )}

        {/* ── EARLY DETECTOR ── */}
        {activeTab === "early" && (
          <>
            <div style={s.sectionTitle}>🔍 Early Detector</div>
            <div style={s.sectionSub}>Vidéos qui explosent — avant 50K vues</div>
            {earlyVideos.map((v, i) => (
              <div key={i} style={s.earlyCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#fff", flex: 1, marginRight: 10, lineHeight: 1.4 }}>{v.title}</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#f9c74f", whiteSpace: "nowrap" }}>{v.trend}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "rgba(232,230,240,0.4)" }}>👁 {v.views}</span>
                  <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600, background: "rgba(0,245,212,0.1)", border: "1px solid rgba(0,245,212,0.2)", color: "#00f5d4" }}>{v.niche}</span>
                  <button style={{ marginLeft: "auto", padding: "4px 11px", borderRadius: 20, background: "rgba(249,199,79,0.12)", border: "1px solid rgba(249,199,79,0.3)", color: "#f9c74f", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Surfer →</button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── VIRAL SCORE ── */}
        {activeTab === "score" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
              <div style={s.sectionTitle}>⚡ Viral Score</div>
              <span style={{ background: "rgba(0,245,212,0.15)", border: "1px solid rgba(0,245,212,0.3)", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700, color: "#00f5d4", letterSpacing: 1 }}>✦ IA RÉELLE</span>
            </div>
            <div style={s.sectionSub}>Décris ton idée — Claude IA analyse le potentiel viral</div>
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(0,245,212,0.2)", borderRadius: 16, padding: "13px 15px", marginBottom: 11 }}>
              <div style={{ fontSize: 10, color: "rgba(232,230,240,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 7 }}>Ton idée de vidéo TikTok</div>
              <textarea value={viralInput} onChange={e => setViralInput(e.target.value)} placeholder="Ex: routine matinale silencieuse en POV, son lo-fi, 30s, dans ma cuisine..." rows={4}
                style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 13, resize: "none", lineHeight: 1.5, fontFamily: "system-ui" }} />
            </div>
            <button onClick={mockAnalyze} disabled={analyzing || !viralInput.trim()}
              style={{ width: "100%", padding: 13, borderRadius: 14, background: analyzing || !viralInput.trim() ? "rgba(0,245,212,0.25)" : "linear-gradient(135deg,#00f5d4,#7209b7)", border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {analyzing ? <>Analyse IA en cours <span>⏳</span></> : "✦ Analyser avec l'IA"}
            </button>
            {viralResult && (
              <div style={{ background: "rgba(0,245,212,0.06)", border: "1px solid rgba(0,245,212,0.2)", borderRadius: 20, padding: 18, marginTop: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 62, background: "linear-gradient(135deg,#00f5d4,#f72585)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1, textAlign: "center", marginBottom: 4 }}>{viralResult.score}</div>
                <div style={{ textAlign: "center", fontSize: 17, fontWeight: 600, color: "#fff", marginBottom: 18 }}>{viralResult.verdict}</div>
                {viralResult.factors.map((f, i) => (
                  <div key={i} style={{ marginBottom: 9 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3, color: "rgba(232,230,240,0.6)" }}><span>{f.label}</span><span style={{ color: "#fff", fontWeight: 600 }}>{f.score}/100</span></div>
                    <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 5, overflow: "hidden" }}><div style={{ height: "100%", width: `${f.score}%`, background: f.color, borderRadius: 5 }} /></div>
                  </div>
                ))}
                <div style={{ marginTop: 13, padding: "11px 13px", background: "rgba(0,245,212,0.08)", border: "1px solid rgba(0,245,212,0.2)", borderRadius: 12, fontSize: 12, color: "rgba(232,230,240,0.85)", lineHeight: 1.5 }}>💡 <strong>Conseil IA :</strong> {viralResult.tip}</div>
                <div style={{ marginTop: 9, padding: "11px 13px", background: "rgba(247,37,133,0.08)", border: "1px solid rgba(247,37,133,0.15)", borderRadius: 12, fontSize: 11, color: "rgba(232,230,240,0.7)", lineHeight: 1.6 }}>
                  🎯 <strong>Meilleur moment :</strong> {viralResult.bestTime}<br />🎵 <strong>Son recommandé :</strong> {viralResult.suggestedSound}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(232,230,240,0.5)", textTransform: "uppercase", letterSpacing: 1, marginTop: 16, marginBottom: 9 }}>📝 Captions IA</div>
                {viralResult.captions.map((caption, i) => (
                  <div key={i} onClick={() => copyCaption(caption, i)} style={{ background: "rgba(114,9,183,0.08)", border: "1px solid rgba(114,9,183,0.2)", borderRadius: 12, padding: "11px 13px", marginBottom: 8, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 9, cursor: "pointer" }}>
                    <div style={{ fontSize: 12, color: "rgba(232,230,240,0.8)", lineHeight: 1.5, flex: 1 }}>{caption}</div>
                    <button style={{ flexShrink: 0, padding: "3px 9px", borderRadius: 20, background: "rgba(0,245,212,0.1)", border: "1px solid rgba(0,245,212,0.25)", color: "#00f5d4", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{copiedCaption === i ? "✅ Copié" : "Copier"}</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── AVIS ── */}
        {activeTab === "avis" && (
          <>
            <div style={s.sectionTitle}>⭐ Avis certifiés</div>
            <div style={s.sectionSub}>Utilisateurs vérifiés · Abonnés Wavely Pro</div>
            <div style={{ background: "linear-gradient(135deg,rgba(0,245,212,0.08),rgba(114,9,183,0.08))", border: "1px solid rgba(0,245,212,0.15)", borderRadius: 14, padding: 14, marginBottom: 16, display: "flex", gap: 10, alignItems: "center" }}>
              {[["4.9", "⭐⭐⭐⭐⭐", "Note moyenne"], ["2.4K", "", "Avis vérifiés"], ["97%", "", "Satisfaits"]].map(([num, stars, label], i) => (
                <div key={i} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                  <div style={{ fontWeight: 800, fontSize: 20, color: "#00f5d4", lineHeight: 1 }}>{num}</div>
                  {stars && <div style={{ fontSize: 10, margin: "2px 0" }}>{stars}</div>}
                  <div style={{ fontSize: 10, color: "rgba(232,230,240,0.4)", marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(0,245,212,0.06)", border: "1px solid rgba(0,245,212,0.15)", borderRadius: 12, padding: "9px 13px", marginBottom: 14, display: "flex", alignItems: "center", gap: 9, fontSize: 12, color: "rgba(232,230,240,0.6)" }}>
              <span style={{ fontSize: 17 }}>🛡️</span>
              <span><strong style={{ color: "#00f5d4" }}>Avis 100% vérifiés</strong> — Authentifiés par numéro de téléphone Firebase.</span>
            </div>
            {certifiedReviews.map((r, i) => (
              <div key={i} style={s.reviewCard}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#00f5d4,#7209b7,#f72585)" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#00f5d4,#7209b7)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, color: "#fff", flexShrink: 0 }}>{r.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#fff" }}>{r.name}</div>
                    <div style={{ fontSize: 10, color: "rgba(232,230,240,0.4)" }}>{r.city}</div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "rgba(0,245,212,0.1)", border: "1px solid rgba(0,245,212,0.25)", borderRadius: 20, padding: "1px 7px", fontSize: 9, fontWeight: 600, color: "#00f5d4", marginTop: 3 }}>✅ {r.badge}</div>
                  </div>
                  <div style={{ display: "flex", gap: 1 }}>{Array(r.rating).fill(0).map((_, j) => <span key={j} style={{ fontSize: 12 }}>⭐</span>)}</div>
                </div>
                <div style={{ fontSize: 12, color: "rgba(232,230,240,0.75)", lineHeight: 1.6, marginBottom: 10, fontStyle: "italic" }}>"{r.text}"</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 10, fontWeight: 600, background: "rgba(247,37,133,0.1)", border: "1px solid rgba(247,37,133,0.2)", borderRadius: 20, padding: "2px 7px", color: "#f72585" }}>{r.niche}</span>
                  <span style={{ fontSize: 10, color: "rgba(232,230,240,0.35)" }}>👥 {r.followers}</span>
                  <span style={{ fontSize: 10, color: "rgba(232,230,240,0.25)" }}>{r.date}</span>
                </div>
              </div>
            ))}
            <div style={{ background: "linear-gradient(135deg,rgba(0,245,212,0.1),rgba(114,9,183,0.15))", border: "1px solid rgba(0,245,212,0.25)", borderRadius: 20, padding: 22, textAlign: "center", marginTop: 8 }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>🌊</div>
              <div style={{ fontWeight: 700, fontSize: 17, color: "#fff", marginBottom: 7 }}>Rejoignez 2 400+ créateurs</div>
              <div style={{ fontSize: 12, color: "rgba(232,230,240,0.5)", marginBottom: 16, lineHeight: 1.5 }}>Commencez à surfer les tendances dès aujourd'hui</div>
              <button onClick={() => setActiveTab("pro")} style={{ width: "100%", padding: 13, borderRadius: 14, background: "linear-gradient(135deg,#00f5d4,#7209b7)", border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                S'abonner pour 1,99 €/mois →
              </button>
            </div>
          </>
        )}

        {/* ── S'ABONNER ── */}
        {activeTab === "pro" && (
          <>
            <div style={s.sectionTitle}>💳 Wavely Pro</div>
            <div style={s.sectionSub}>{verified ? "✅ Numéro vérifié — Paiement Stripe" : "Vérification SMS · Paiement Stripe"}</div>
            {!verified ? (
              <div style={{ background: "rgba(0,245,212,0.05)", border: "1px solid rgba(0,245,212,0.15)", borderRadius: 20, padding: "28px 18px", textAlign: "center", marginBottom: 14 }}>
                {authStep === "gate" && (
                  <>
                    <div style={{ fontSize: 44, marginBottom: 14 }}>📱</div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: "#fff", marginBottom: 8 }}>Connexion par SMS</div>
                    <div style={{ fontSize: 12, color: "rgba(232,230,240,0.5)", lineHeight: 1.6, marginBottom: 22 }}>Entrez votre numéro pour recevoir un code SMS gratuit.</div>
                    <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+33 6 12 34 56 78" style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(0,245,212,0.2)", borderRadius: 12, padding: "13px 15px", color: "#fff", fontSize: 15, outline: "none", fontFamily: "system-ui", marginBottom: 12 }} />
                    <button onClick={() => phone.length > 8 && setAuthStep("otp")} style={{ width: "100%", padding: 14, borderRadius: 14, background: phone.length > 8 ? "linear-gradient(135deg,#00f5d4,#7209b7)" : "rgba(0,245,212,0.2)", border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                      Recevoir le code SMS →
                    </button>
                    <div style={{ fontSize: 10, color: "rgba(232,230,240,0.2)", marginTop: 11 }}>🔒 Firebase · Aucune carte requise</div>
                  </>
                )}
                {authStep === "otp" && (
                  <>
                    <div style={{ fontSize: 44, marginBottom: 14 }}>🔐</div>
                    <div style={{ fontWeight: 700, fontSize: 17, color: "#fff", marginBottom: 6 }}>Code SMS envoyé</div>
                    <div style={{ fontSize: 12, color: "rgba(232,230,240,0.4)", marginBottom: 18 }}>Entrez le code reçu au {phone}</div>
                    <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="_ _ _ _ _ _" maxLength={6} style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(0,245,212,0.3)", borderRadius: 12, padding: "13px 15px", color: "#fff", fontSize: 22, outline: "none", fontFamily: "system-ui", textAlign: "center", letterSpacing: 8, marginBottom: 12 }} />
                    <button onClick={() => otp.length === 6 && setVerified(true)} style={{ width: "100%", padding: 14, borderRadius: 14, background: otp.length === 6 ? "linear-gradient(135deg,#00f5d4,#7209b7)" : "rgba(0,245,212,0.2)", border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 10 }}>
                      Confirmer →
                    </button>
                    <button onClick={() => setAuthStep("gate")} style={{ background: "none", border: "none", color: "rgba(232,230,240,0.3)", fontSize: 12, cursor: "pointer" }}>← Modifier le numéro</button>
                  </>
                )}
              </div>
            ) : (
              <div style={{ background: "linear-gradient(135deg,rgba(0,245,212,0.1),rgba(114,9,183,0.15))", border: "1px solid rgba(0,245,212,0.25)", borderRadius: 24, padding: "26px 20px", marginBottom: 14, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "rgba(0,245,212,0.8)", marginBottom: 14, background: "rgba(0,245,212,0.08)", border: "1px solid rgba(0,245,212,0.2)", borderRadius: 20, padding: "5px 13px", display: "inline-block" }}>✅ {phone}</div>
                <div style={{ fontWeight: 800, fontSize: 50, background: "linear-gradient(135deg,#00f5d4,#f72585)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1, marginBottom: 4 }}>1,99 €</div>
                <div style={{ fontSize: 12, color: "rgba(232,230,240,0.4)", marginBottom: 18 }}>par mois · annulable à tout moment</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 20, textAlign: "left" }}>
                  {["📡 Trend Radar illimité", "🔍 Early Detector live", "⚡ Viral Score IA réel", "📝 Captions IA incluses", "🔔 Alertes temps réel", "🎵 Sons tendance", "🌍 48 marchés", "🔄 Mises à jour auto"].map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(232,230,240,0.7)" }}><span>{f.split(" ")[0]}</span><span>{f.split(" ").slice(1).join(" ")}</span></div>
                  ))}
                </div>
                <button style={{ width: "100%", padding: 15, borderRadius: 14, background: "linear-gradient(135deg,#00f5d4,#7209b7)", border: "none", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
                  <span>S'abonner pour 1,99 €/mois</span>
                  <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 6, padding: "2px 7px", fontSize: 10, fontWeight: 800 }}>stripe</span>
                </button>
                <div style={{ fontSize: 10, color: "rgba(232,230,240,0.25)", marginTop: 10 }}>🔒 Paiement chiffré SSL · Géré par Stripe</div>
              </div>
            )}
            <div style={{ background: "rgba(0,245,212,0.06)", border: "1px solid rgba(0,245,212,0.15)", borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 11, color: "rgba(232,230,240,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>📈 Simulation revenus</div>
              {[[500, "~850 €"], [1000, "~1 700 €"], [5000, "~8 500 €"], [10000, "~17 000 €"]].map(([n, r], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7, fontSize: 12, color: "rgba(232,230,240,0.6)" }}>
                  <span>{n.toLocaleString()} abonnés</span>
                  <span style={{ fontWeight: 700, color: "#00f5d4" }}>{r}<span style={{ fontSize: 10, color: "rgba(232,230,240,0.3)", fontWeight: 400 }}>/mois</span></span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={s.bottomNav}>
        {tabs.map(t => (
          <div key={t.id} onClick={() => setActiveTab(t.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", padding: 3 }}>
            <span style={{ fontSize: 18, filter: activeTab === t.id ? "drop-shadow(0 0 6px #00f5d4)" : "none" }}>{t.icon}</span>
            <span style={{ fontSize: 9, fontWeight: 500, color: activeTab === t.id ? "#00f5d4" : "rgba(232,230,240,0.3)" }}>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
