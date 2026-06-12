import { useState, useEffect, useMemo, useCallback } from "react";
import { MATCHES, STAGE_ORDER } from "./data/matches.js";
import { buildLeaderboard, scoreDetail, POINTS } from "./lib/scoring.js";
import { fetchLeague, saveLeague, subscribeLeague, stamp, cloudEnabled } from "./lib/firebase.js";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');`;

const SESSION_KEY = "wc2026_session";

// ─── Helpers ──────────────────────────────────────────────────────
const genCode = () => {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 5 }, () => c[Math.floor(Math.random() * c.length)]).join("");
};

const fmtDate = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }) +
      " · " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
};

const isLocked = (iso) => new Date(iso).getTime() <= Date.now();

function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; } catch { return null; }
}
function saveSession(s) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch {}
}
function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
}

// ════════════════════════════════════════════════════════════════
//  ÉCRAN D'ACCUEIL — créer ou rejoindre une ligue
// ════════════════════════════════════════════════════════════════
function HomeScreen({ onEnter }) {
  const [mode, setMode] = useState("menu"); // menu | create | join
  const [pseudo, setPseudo] = useState("");
  const [leagueName, setLeagueName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const create = async () => {
    setErr("");
    if (!pseudo.trim()) return setErr("Choisis un pseudo.");
    if (!leagueName.trim()) return setErr("Donne un nom à ta ligue.");
    setBusy(true);
    const newCode = genCode();
    const me = pseudo.trim().slice(0, 20);
    const data = {
      code: newCode,
      name: leagueName.trim().slice(0, 40),
      adminName: me,
      createdAt: stamp(),
      members: { [me]: { joinedAt: Date.now() } },
      predictions: {},
      results: {},
      teamOverrides: {},
    };
    await saveLeague(newCode, data);
    setBusy(false);
    onEnter({ code: newCode, me, admin: true });
  };

  const join = async () => {
    setErr("");
    if (!pseudo.trim()) return setErr("Choisis un pseudo.");
    const c = code.trim().toUpperCase();
    if (c.length < 4) return setErr("Code de ligue invalide.");
    setBusy(true);
    const league = await fetchLeague(c);
    if (!league) { setBusy(false); return setErr("Aucune ligue avec ce code."); }
    const me = pseudo.trim().slice(0, 20);
    const members = { ...(league.members || {}) };
    if (!members[me]) members[me] = { joinedAt: Date.now() };
    await saveLeague(c, { members });
    setBusy(false);
    onEnter({ code: c, me, admin: league.adminName === me });
  };

  return (
    <div className="screen home">
      <div className="home-logo">⚽️</div>
      <h1 className="home-title">Pronos<span>Mondial</span> 2026</h1>
      <p className="home-sub">Pronostique tous les matchs de la Coupe du Monde 2026 et défie tes amis 🏆</p>

      {mode === "menu" && (
        <div className="card stack">
          <button className="btn primary big" onClick={() => setMode("create")}>
            ➕ Créer une ligue
          </button>
          <button className="btn ghost big" onClick={() => setMode("join")}>
            🔑 Rejoindre une ligue
          </button>
          <div className="hint">
            {cloudEnabled ? "☁️ Synchronisé entre tous les amis" : "💾 Mode local sur cet appareil"}
          </div>
        </div>
      )}

      {mode === "create" && (
        <div className="card stack">
          <label className="lbl">Ton pseudo</label>
          <input className="inp" value={pseudo} onChange={(e) => setPseudo(e.target.value)} placeholder="Ex : Kévin" maxLength={20} />
          <label className="lbl">Nom de la ligue</label>
          <input className="inp" value={leagueName} onChange={(e) => setLeagueName(e.target.value)} placeholder="Ex : Les potes du foot" maxLength={40} />
          {err && <div className="err">{err}</div>}
          <button className="btn primary big" disabled={busy} onClick={create}>
            {busy ? "Création…" : "Créer ma ligue →"}
          </button>
          <button className="btn link" onClick={() => { setMode("menu"); setErr(""); }}>← Retour</button>
        </div>
      )}

      {mode === "join" && (
        <div className="card stack">
          <label className="lbl">Ton pseudo</label>
          <input className="inp" value={pseudo} onChange={(e) => setPseudo(e.target.value)} placeholder="Ex : Sarah" maxLength={20} />
          <label className="lbl">Code de la ligue</label>
          <input className="inp code-inp" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ABC23" maxLength={6} />
          {err && <div className="err">{err}</div>}
          <button className="btn primary big" disabled={busy} onClick={join}>
            {busy ? "Connexion…" : "Rejoindre →"}
          </button>
          <button className="btn link" onClick={() => { setMode("menu"); setErr(""); }}>← Retour</button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  CARTE DE MATCH (pronostic)
// ════════════════════════════════════════════════════════════════
function MatchCard({ match, pred, result, locked, onChange }) {
  const detail = result ? scoreDetail(pred, result) : null;
  const [h, setH] = useState(pred?.home ?? "");
  const [a, setA] = useState(pred?.away ?? "");

  useEffect(() => { setH(pred?.home ?? ""); setA(pred?.away ?? ""); }, [pred?.home, pred?.away]);

  const commit = (nh, na) => {
    const home = nh === "" ? null : Math.max(0, Math.min(99, parseInt(nh, 10)));
    const away = na === "" ? null : Math.max(0, Math.min(99, parseInt(na, 10)));
    onChange({ home: Number.isNaN(home) ? null : home, away: Number.isNaN(away) ? null : away });
  };

  return (
    <div className={`match ${locked ? "locked" : ""}`}>
      <div className="match-top">
        <span className="match-round">{match.round}</span>
        <span className="match-date">{fmtDate(match.date)}</span>
      </div>
      <div className="match-body">
        <div className="team home">{match.home}</div>
        <div className="score-box">
          <input className="score" type="number" inputMode="numeric" min="0" max="99"
            value={h} disabled={locked}
            onChange={(e) => { setH(e.target.value); commit(e.target.value, a); }} />
          <span className="vs">-</span>
          <input className="score" type="number" inputMode="numeric" min="0" max="99"
            value={a} disabled={locked}
            onChange={(e) => { setA(e.target.value); commit(h, e.target.value); }} />
        </div>
        <div className="team away">{match.away}</div>
      </div>
      <div className="match-foot">
        {result && (result.home != null) ? (
          <span className="real-score">Résultat : {result.home} - {result.away}</span>
        ) : locked ? (
          <span className="muted">🔒 Pronostic fermé</span>
        ) : (
          <span className="muted">🏟️ {match.venue}</span>
        )}
        {detail && (
          <span className={`badge ${detail.tone}`}>{detail.label} · +{detail.pts}</span>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  ONGLET MATCHS
// ════════════════════════════════════════════════════════════════
function MatchesTab({ league, me, matches, onPredict }) {
  const [filter, setFilter] = useState("all"); // all | todo | done
  const [stage, setStage] = useState("Tous");

  const myPreds = (league.predictions && league.predictions[me]) || {};
  const results = league.results || {};

  const stages = ["Tous", ...STAGE_ORDER];

  const visible = matches.filter((m) => {
    if (stage !== "Tous" && m.stageLabel !== stage) return false;
    const p = myPreds[m.id];
    const hasPred = p && p.home != null && p.away != null;
    if (filter === "todo") return !hasPred && !isLocked(m.date);
    if (filter === "done") return hasPred;
    return true;
  });

  const todoCount = matches.filter((m) => {
    const p = myPreds[m.id];
    return (!p || p.home == null || p.away == null) && !isLocked(m.date);
  }).length;

  return (
    <div className="tab">
      <div className="filters">
        <div className="chips">
          {[["all", "Tous"], ["todo", `À pronostiquer (${todoCount})`], ["done", "Mes pronos"]].map(([k, l]) => (
            <button key={k} className={`chip ${filter === k ? "on" : ""}`} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
        <select className="select" value={stage} onChange={(e) => setStage(e.target.value)}>
          {stages.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {visible.length === 0 && <div className="empty">Aucun match dans cette vue 🎉</div>}

      <div className="match-list">
        {visible.map((m) => (
          <MatchCard
            key={m.id}
            match={m}
            pred={myPreds[m.id]}
            result={results[m.id]}
            locked={isLocked(m.date)}
            onChange={(val) => onPredict(m.id, val)}
          />
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  ONGLET CLASSEMENT
// ════════════════════════════════════════════════════════════════
function LeaderboardTab({ league, me, matches }) {
  const rows = useMemo(
    () => buildLeaderboard(league.members, league.predictions, league.results, matches),
    [league.members, league.predictions, league.results, matches]
  );
  const medal = (r) => (r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : `#${r}`);

  return (
    <div className="tab">
      <div className="lb-head">
        <div>Joueur</div>
        <div className="lb-stats"><span>Exacts</span><span>Bons</span><span>Pts</span></div>
      </div>
      {rows.length === 0 && <div className="empty">Aucun joueur pour l'instant.</div>}
      {rows.map((r) => (
        <div key={r.name} className={`lb-row ${r.name === me ? "me" : ""} ${r.rank <= 3 ? "podium" : ""}`}>
          <div className="lb-rank">{medal(r.rank)}</div>
          <div className="lb-name">{r.name}{r.name === me && <span className="you"> (toi)</span>}</div>
          <div className="lb-stats">
            <span>{r.exact}</span><span>{r.good}</span><span className="pts">{r.total}</span>
          </div>
        </div>
      ))}
      <div className="lb-legend">
        Barème : score exact <b>+{POINTS.EXACT}</b> · bon résultat <b>+{POINTS.RESULT}</b> · bonne différence de buts <b>+{POINTS.DIFF_BONUS}</b>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  ONGLET ADMIN — saisir résultats & éditer équipes
// ════════════════════════════════════════════════════════════════
function AdminTab({ league, matches, onResult, onTeams }) {
  const [stage, setStage] = useState(STAGE_ORDER[0]);
  const results = league.results || {};
  const visible = matches.filter((m) => m.stageLabel === stage);

  return (
    <div className="tab">
      <div className="admin-note">
        🛠️ Espace organisateur — saisis les scores réels (le classement se met à jour pour tout le monde) et corrige les équipes des phases finales.
      </div>
      <select className="select wide" value={stage} onChange={(e) => setStage(e.target.value)}>
        {STAGE_ORDER.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      {visible.map((m) => {
        const r = results[m.id] || {};
        return (
          <div key={m.id} className="admin-row">
            <div className="admin-teams">
              <input className="inp sm" defaultValue={m.home}
                onBlur={(e) => onTeams(m.id, { home: e.target.value })} />
              <span className="vs">vs</span>
              <input className="inp sm" defaultValue={m.away}
                onBlur={(e) => onTeams(m.id, { away: e.target.value })} />
            </div>
            <div className="admin-score">
              <span className="admin-lbl">Score réel</span>
              <input className="score" type="number" min="0" max="99" defaultValue={r.home ?? ""}
                onBlur={(e) => onResult(m.id, { home: e.target.value === "" ? null : parseInt(e.target.value, 10), away: r.away ?? null })} />
              <span className="vs">-</span>
              <input className="score" type="number" min="0" max="99" defaultValue={r.away ?? ""}
                onBlur={(e) => onResult(m.id, { home: r.home ?? null, away: e.target.value === "" ? null : parseInt(e.target.value, 10) })} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  ONGLET RÈGLES / INVITATION
// ════════════════════════════════════════════════════════════════
function RulesTab({ league, code }) {
  return (
    <div className="tab rules">
      <div className="card invite">
        <div className="invite-title">Invite tes amis 🎉</div>
        <p>Partage ce code pour qu'ils rejoignent <b>{league.name}</b> :</p>
        <div className="bigcode">{code}</div>
        <p className="muted small">Ils choisissent « Rejoindre une ligue » et saisissent ce code.</p>
      </div>

      <div className="card">
        <h3>📖 Comment ça marche</h3>
        <ul className="rules-list">
          <li>Pronostique le <b>score exact</b> de chaque match de la Coupe du Monde 2026.</li>
          <li>Un pronostic est <b>verrouillé au coup d'envoi</b> du match — impossible de le modifier après.</li>
          <li>L'organisateur saisit les scores réels ; le classement se met à jour automatiquement.</li>
        </ul>
        <h3>🎯 Barème de points</h3>
        <ul className="rules-list">
          <li><span className="badge gold">Score exact</span> → <b>+{POINTS.EXACT} pts</b></li>
          <li><span className="badge green">Bon résultat (1/N/2)</span> → <b>+{POINTS.RESULT} pt</b></li>
          <li>Bonne différence de buts → <b>+{POINTS.DIFF_BONUS} pt</b> bonus</li>
        </ul>
        <p className="muted small">
          {cloudEnabled
            ? "☁️ Tes pronos sont synchronisés en ligne entre tous les membres."
            : "💾 Mode local : les données restent sur cet appareil. Active Firestore pour la synchro multi-joueurs."}
        </p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  APPLICATION
// ════════════════════════════════════════════════════════════════
export default function App() {
  const [session, setSession] = useState(() => loadSession());
  const [league, setLeague] = useState(null);
  const [tab, setTab] = useState("matchs");
  const [copied, setCopied] = useState(false);

  // Abonnement temps réel à la ligue
  useEffect(() => {
    if (!session?.code) return;
    const unsub = subscribeLeague(session.code, (data) => { if (data) setLeague(data); });
    return () => unsub && unsub();
  }, [session?.code]);

  const enter = (s) => { saveSession(s); setSession(s); };
  const logout = () => { clearSession(); setSession(null); setLeague(null); setTab("matchs"); };

  // Applique les surcharges d'équipes (éditées par l'admin) aux matchs.
  const matches = useMemo(() => {
    const ov = (league && league.teamOverrides) || {};
    return MATCHES.map((m) => {
      const o = ov[m.id];
      return o ? { ...m, home: o.home ?? m.home, away: o.away ?? m.away } : m;
    });
  }, [league]);

  const me = session?.me;
  const isAdmin = league && league.adminName === me;

  // ─── Mutations ──────────────────────────────────────────────────
  const predict = useCallback(async (matchId, val) => {
    if (!session?.code || !me) return;
    setLeague((prev) => {
      if (!prev) return prev;
      const predictions = { ...(prev.predictions || {}) };
      predictions[me] = { ...(predictions[me] || {}), [matchId]: val };
      const next = { ...prev, predictions };
      saveLeague(session.code, { predictions });
      return next;
    });
  }, [session?.code, me]);

  const setResult = useCallback(async (matchId, val) => {
    if (!session?.code) return;
    setLeague((prev) => {
      const results = { ...((prev && prev.results) || {}) };
      results[matchId] = val;
      const next = { ...prev, results };
      saveLeague(session.code, { results });
      return next;
    });
  }, [session?.code]);

  const setTeams = useCallback(async (matchId, patch) => {
    if (!session?.code) return;
    setLeague((prev) => {
      const base = MATCHES.find((m) => m.id === matchId);
      const teamOverrides = { ...((prev && prev.teamOverrides) || {}) };
      const cur = teamOverrides[matchId] || { home: base.home, away: base.away };
      teamOverrides[matchId] = { ...cur, ...patch };
      const next = { ...prev, teamOverrides };
      saveLeague(session.code, { teamOverrides });
      return next;
    });
  }, [session?.code]);

  const copyCode = () => {
    try { navigator.clipboard.writeText(session.code); } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  // ─── Rendu ──────────────────────────────────────────────────────
  if (!session) return (<><style>{FONTS + CSS}</style><HomeScreen onEnter={enter} /></>);
  if (!league) return (<><style>{FONTS + CSS}</style><div className="screen center"><div className="spinner">⚽️</div><p>Chargement de la ligue…</p></div></>);

  const memberCount = Object.keys(league.members || {}).length;
  const tabs = [
    { id: "matchs", icon: "⚽️", label: "Matchs" },
    { id: "classement", icon: "🏆", label: "Classement" },
    { id: "regles", icon: "📖", label: "Règles" },
    ...(isAdmin ? [{ id: "admin", icon: "🛠️", label: "Admin" }] : []),
  ];

  return (
    <>
      <style>{FONTS + CSS}</style>
      <div className="app">
        <header className="topbar">
          <div className="tb-left">
            <div className="tb-name">{league.name}</div>
            <button className="codepill" onClick={copyCode} title="Copier le code">
              🔑 {session.code} {copied ? "✓" : "📋"}
            </button>
          </div>
          <div className="tb-right">
            <span className="members">👥 {memberCount}</span>
            <button className="logout" onClick={logout}>Quitter</button>
          </div>
        </header>

        <main className="content">
          {tab === "matchs" && <MatchesTab league={league} me={me} matches={matches} onPredict={predict} />}
          {tab === "classement" && <LeaderboardTab league={league} me={me} matches={matches} />}
          {tab === "regles" && <RulesTab league={league} code={session.code} />}
          {tab === "admin" && isAdmin && <AdminTab league={league} matches={matches} onResult={setResult} onTeams={setTeams} />}
        </main>

        <nav className="bottomnav">
          {tabs.map((t) => (
            <button key={t.id} className={`navitem ${tab === t.id ? "on" : ""}`} onClick={() => setTab(t.id)}>
              <span className="navicon">{t.icon}</span>
              <span className="navlabel">{t.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
//  STYLES
// ════════════════════════════════════════════════════════════════
const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',sans-serif;background:#0a1f17;color:#eaf4ee}
:root{--g:#16a34a;--g2:#22c55e;--gold:#f5c542;--dark:#0a1f17;--card:#10271d;--line:rgba(255,255,255,.08)}
.screen{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;
  background:radial-gradient(circle at 50% 0%,#11392a,#0a1f17 60%)}
.screen.center{gap:14px}
.spinner{font-size:48px;animation:spin 1.4s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
.home-logo{font-size:64px;margin-bottom:8px;filter:drop-shadow(0 6px 18px rgba(34,197,94,.4))}
.home-title{font-family:'Syne',sans-serif;font-size:34px;font-weight:800;letter-spacing:-1px;text-align:center}
.home-title span{color:var(--gold)}
.home-sub{color:rgba(234,244,238,.6);text-align:center;max-width:340px;margin:10px 0 26px;line-height:1.5}
.card{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:22px;width:100%;max-width:380px}
.stack{display:flex;flex-direction:column;gap:12px}
.lbl{font-size:13px;color:rgba(234,244,238,.6);margin-bottom:-6px}
.inp{width:100%;padding:14px;border-radius:12px;background:#0c2a1f;border:1px solid var(--line);color:#fff;font-size:16px;font-family:inherit}
.inp:focus{outline:none;border-color:var(--g2)}
.inp.sm{padding:8px 10px;font-size:13px;flex:1;min-width:0}
.code-inp{letter-spacing:6px;text-align:center;text-transform:uppercase;font-weight:700;font-size:22px}
.btn{border:none;border-radius:12px;font-family:'Syne',sans-serif;font-weight:700;cursor:pointer;transition:.15s;font-size:15px}
.btn.big{padding:15px}
.btn.primary{background:linear-gradient(135deg,var(--g),var(--g2));color:#04140d}
.btn.primary:disabled{opacity:.6}
.btn.ghost{background:transparent;border:1px solid var(--g2);color:var(--g2)}
.btn.link{background:none;color:rgba(234,244,238,.5);font-weight:500;padding:6px}
.btn:hover{filter:brightness(1.08)}
.hint{text-align:center;font-size:12px;color:rgba(234,244,238,.4);margin-top:6px}
.err{color:#ff8080;font-size:13px;background:rgba(255,80,80,.1);padding:8px 12px;border-radius:8px}

.app{max-width:520px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column;background:var(--dark);padding-bottom:74px}
.topbar{position:sticky;top:0;z-index:10;display:flex;justify-content:space-between;align-items:center;padding:14px 16px;
  background:rgba(10,31,23,.92);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.tb-name{font-family:'Syne',sans-serif;font-weight:800;font-size:17px;line-height:1.1}
.codepill{margin-top:4px;background:rgba(245,197,66,.12);border:1px solid rgba(245,197,66,.3);color:var(--gold);
  border-radius:20px;padding:3px 10px;font-size:12px;font-weight:700;cursor:pointer;letter-spacing:1px}
.tb-right{display:flex;align-items:center;gap:10px}
.members{font-size:13px;color:rgba(234,244,238,.7)}
.logout{background:none;border:1px solid var(--line);color:rgba(234,244,238,.6);border-radius:10px;padding:6px 10px;font-size:12px;cursor:pointer}
.content{flex:1;padding:14px 14px 0}

.filters{display:flex;flex-direction:column;gap:10px;margin-bottom:14px}
.chips{display:flex;gap:8px;flex-wrap:wrap}
.chip{background:#0c2a1f;border:1px solid var(--line);color:rgba(234,244,238,.7);border-radius:20px;padding:7px 13px;font-size:13px;cursor:pointer;font-weight:600}
.chip.on{background:var(--g);color:#04140d;border-color:var(--g)}
.select{width:100%;padding:11px;border-radius:12px;background:#0c2a1f;border:1px solid var(--line);color:#fff;font-size:14px;font-family:inherit}
.select.wide{margin-bottom:14px}

.match-list{display:flex;flex-direction:column;gap:12px}
.match{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px}
.match.locked{opacity:.92}
.match-top{display:flex;justify-content:space-between;font-size:11px;color:rgba(234,244,238,.45);margin-bottom:10px}
.match-round{color:var(--gold);font-weight:700}
.match-body{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px}
.team{font-weight:600;font-size:15px}
.team.home{text-align:right}
.team.away{text-align:left}
.score-box{display:flex;align-items:center;gap:6px}
.score{width:44px;height:44px;text-align:center;border-radius:12px;background:#0c2a1f;border:1px solid var(--line);
  color:#fff;font-size:19px;font-weight:700;font-family:'Syne',sans-serif;-moz-appearance:textfield}
.score:focus{outline:none;border-color:var(--g2)}
.score:disabled{opacity:.6;background:#0a241a}
.score::-webkit-outer-spin-button,.score::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.vs{color:rgba(234,244,238,.4);font-weight:700}
.match-foot{display:flex;justify-content:space-between;align-items:center;margin-top:11px;font-size:12px}
.muted{color:rgba(234,244,238,.45)}
.small{font-size:12px}
.real-score{color:var(--g2);font-weight:700}
.badge{border-radius:8px;padding:3px 9px;font-size:11px;font-weight:700}
.badge.gold{background:rgba(245,197,66,.16);color:var(--gold)}
.badge.green{background:rgba(34,197,94,.16);color:var(--g2)}
.badge.red{background:rgba(255,90,90,.13);color:#ff8a8a}
.empty{text-align:center;color:rgba(234,244,238,.5);padding:40px 0}

.lb-head{display:flex;justify-content:space-between;padding:0 14px 8px;font-size:12px;color:rgba(234,244,238,.5)}
.lb-stats{display:grid;grid-template-columns:48px 40px 44px;text-align:center}
.lb-row{display:flex;align-items:center;gap:10px;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin-bottom:8px}
.lb-row.me{border-color:var(--g2);background:rgba(34,197,94,.07)}
.lb-row.podium .lb-rank{font-size:20px}
.lb-rank{width:30px;font-weight:800;font-family:'Syne',sans-serif;color:rgba(234,244,238,.6)}
.lb-name{flex:1;font-weight:600}
.you{color:var(--g2);font-size:12px;font-weight:500}
.lb-row .lb-stats span{font-size:14px}
.lb-row .pts{font-family:'Syne',sans-serif;font-weight:800;color:var(--gold);font-size:17px}
.lb-legend{text-align:center;font-size:12px;color:rgba(234,244,238,.5);margin-top:14px;line-height:1.6}
.lb-legend b{color:var(--gold)}

.admin-note{background:rgba(245,197,66,.08);border:1px solid rgba(245,197,66,.25);border-radius:12px;padding:12px;font-size:13px;color:rgba(234,244,238,.8);margin-bottom:14px;line-height:1.5}
.admin-row{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px;margin-bottom:10px}
.admin-teams{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.admin-score{display:flex;align-items:center;gap:8px}
.admin-lbl{font-size:12px;color:rgba(234,244,238,.5);margin-right:auto}

.rules .card{max-width:none;margin-bottom:14px}
.invite{text-align:center}
.invite-title{font-family:'Syne',sans-serif;font-weight:800;font-size:18px;margin-bottom:6px}
.invite p{color:rgba(234,244,238,.7);font-size:14px;line-height:1.5}
.bigcode{font-family:'Syne',sans-serif;font-weight:800;font-size:38px;letter-spacing:8px;color:var(--gold);margin:14px 0 8px}
.rules h3{font-family:'Syne',sans-serif;margin:6px 0 10px;font-size:16px}
.rules-list{list-style:none;display:flex;flex-direction:column;gap:9px;margin-bottom:16px}
.rules-list li{font-size:14px;color:rgba(234,244,238,.8);line-height:1.5;padding-left:18px;position:relative}
.rules-list li:before{content:"›";position:absolute;left:2px;color:var(--g2);font-weight:700}

.bottomnav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:520px;display:flex;
  background:rgba(10,31,23,.96);backdrop-filter:blur(12px);border-top:1px solid var(--line);padding:8px 0 10px}
.navitem{flex:1;background:none;border:none;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;color:rgba(234,244,238,.45)}
.navitem.on{color:var(--g2)}
.navicon{font-size:21px}
.navlabel{font-size:11px;font-weight:600}
`;
