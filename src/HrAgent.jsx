import { useState, useRef, useEffect } from "react";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');`;

const TOOL_META = {
  analyze_cv: { icon: "📄", label: "Analyse CV" },
  generate_job_offer: { icon: "📢", label: "Offre d'emploi" },
  prepare_interview: { icon: "🎯", label: "Grille d'entretien" },
  draft_hr_document: { icon: "📝", label: "Document RH" },
  evaluate_performance: { icon: "📊", label: "Évaluation" },
  plan_onboarding: { icon: "🚀", label: "Plan onboarding" },
  answer_labor_law: { icon: "⚖️", label: "Droit du travail" },
};

const QUICK_PROMPTS = [
  {
    icon: "📢",
    label: "Rédiger une offre",
    prompt:
      "Rédige une offre d'emploi pour un Développeur Full Stack Senior en CDI à Paris (hybride 2j/semaine), 55-70k€, pour une scale-up SaaS B2B de 50 personnes en hypercroissance.",
  },
  {
    icon: "🎯",
    label: "Préparer un entretien",
    prompt:
      "Prépare une grille d'entretien RH de 45 minutes pour un(e) Head of Marketing dans une startup early-stage.",
  },
  {
    icon: "📄",
    label: "Analyser un CV",
    prompt:
      "Je vais te coller un CV. Analyse-le pour un poste de Product Manager Senior orienté fintech.",
  },
  {
    icon: "⚖️",
    label: "Question droit du travail",
    prompt:
      "Un salarié refuse de revenir au bureau 2 jours par semaine alors que la charte télétravail de l'entreprise l'impose. Que puis-je faire légalement ?",
  },
  {
    icon: "📝",
    label: "Lettre d'avertissement",
    prompt:
      "Rédige une lettre d'avertissement pour un salarié ayant cumulé 3 retards non justifiés en 2 semaines malgré un rappel verbal.",
  },
  {
    icon: "🚀",
    label: "Plan d'onboarding",
    prompt:
      "Construis un plan d'onboarding 30/60/90 jours pour un Customer Success Manager Senior qui rejoint une équipe de 4 personnes dans une scale-up B2B.",
  },
];

function ToolBadge({ name }) {
  const meta = TOOL_META[name] || { icon: "🔧", label: name };
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        background: "rgba(0,245,212,0.08)",
        border: "1px solid rgba(0,245,212,0.25)",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        color: "#00f5d4",
        marginRight: 6,
        marginBottom: 6,
      }}
    >
      <span>{meta.icon}</span>
      <span>{meta.label}</span>
    </div>
  );
}

function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const out = [];
  let inList = false;
  let buffer = [];
  const flush = () => {
    if (buffer.length) {
      out.push(
        <ul key={`ul-${out.length}`} style={{ margin: "4px 0 10px", paddingLeft: 22 }}>
          {buffer.map((b, i) => (
            <li key={i} style={{ marginBottom: 4, lineHeight: 1.55 }}>
              {inlineFmt(b)}
            </li>
          ))}
        </ul>
      );
      buffer = [];
    }
    inList = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^##\s+/.test(line)) {
      flush();
      out.push(
        <h3
          key={`h-${i}`}
          style={{
            fontFamily: "'Syne',sans-serif",
            fontWeight: 800,
            fontSize: 15,
            color: "#00f5d4",
            margin: "14px 0 6px",
            letterSpacing: "0.3px",
          }}
        >
          {line.replace(/^##\s+/, "")}
        </h3>
      );
    } else if (/^#\s+/.test(line)) {
      flush();
      out.push(
        <h2
          key={`h-${i}`}
          style={{
            fontFamily: "'Syne',sans-serif",
            fontWeight: 800,
            fontSize: 18,
            color: "#fff",
            margin: "18px 0 8px",
          }}
        >
          {line.replace(/^#\s+/, "")}
        </h2>
      );
    } else if (/^[\s]*[-*]\s+/.test(line)) {
      inList = true;
      buffer.push(line.replace(/^[\s]*[-*]\s+/, ""));
    } else if (line.trim() === "") {
      flush();
      out.push(<div key={`sp-${i}`} style={{ height: 6 }} />);
    } else {
      flush();
      out.push(
        <p key={`p-${i}`} style={{ margin: "4px 0", lineHeight: 1.6 }}>
          {inlineFmt(line)}
        </p>
      );
    }
  }
  flush();
  return out;
}

function inlineFmt(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (/^\*\*[^*]+\*\*$/.test(p)) {
      return (
        <strong key={i} style={{ color: "#fff", fontWeight: 700 }}>
          {p.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{p}</span>;
  });
}

export default function HrAgent() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Bonjour 👋 Je suis **DRH AI**, votre Directeur des Ressources Humaines autonome.\n\nJe peux rédiger vos offres, analyser vos CVs, préparer vos entretiens, rédiger vos contrats et documents disciplinaires, répondre à vos questions de droit du travail, planifier l'onboarding de vos nouvelles recrues et évaluer la performance de vos équipes.\n\n**Comment puis-je vous aider aujourd'hui ?**",
      trace: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    setError("");
    setInput("");
    const nextMessages = [...messages, { role: "user", content, trace: [] }];
    setMessages(nextMessages);
    setSending(true);

    try {
      const apiMessages = nextMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const res = await fetch("/api/hr-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || body.error || "Erreur serveur");
      }
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "(réponse vide)",
          trace: data.trace || [],
        },
      ]);
    } catch (e) {
      setError(e.message || "Impossible de contacter DRH AI");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const reset = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Nouvelle session démarrée. **Comment puis-je vous aider ?**",
        trace: [],
      },
    ]);
    setError("");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 10% -10%, rgba(0,245,212,0.12), transparent 60%), radial-gradient(900px 500px at 100% 100%, rgba(114,9,183,0.18), transparent 60%), #05040f",
        color: "#e8e6f0",
        fontFamily: "'DM Sans',sans-serif",
      }}
    >
      <style>{FONTS}</style>

      {/* Header */}
      <header
        style={{
          padding: "20px 24px",
          borderBottom: "1px solid rgba(232,230,240,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "rgba(5,4,15,0.75)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background:
                "linear-gradient(135deg,#00f5d4,#7209b7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              boxShadow: "0 8px 24px rgba(0,245,212,0.25)",
            }}
          >
            🤝
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Syne',sans-serif",
                fontWeight: 800,
                fontSize: 20,
                lineHeight: 1,
              }}
            >
              DRH AI
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(232,230,240,0.5)",
                marginTop: 4,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Agent IA autonome · Claude Opus 4.7
            </div>
          </div>
        </div>
        <button
          onClick={reset}
          style={{
            padding: "8px 14px",
            background: "rgba(232,230,240,0.06)",
            border: "1px solid rgba(232,230,240,0.12)",
            borderRadius: 10,
            color: "rgba(232,230,240,0.75)",
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          ↻ Nouvelle session
        </button>
      </header>

      {/* Chat */}
      <main
        ref={scrollRef}
        style={{
          maxWidth: 820,
          margin: "0 auto",
          padding: "24px 20px 180px",
          minHeight: "calc(100vh - 80px)",
        }}
      >
        {messages.map((m, idx) => (
          <div key={idx} style={{ marginBottom: 22 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color:
                  m.role === "user"
                    ? "rgba(247,37,133,0.75)"
                    : "rgba(0,245,212,0.75)",
                textTransform: "uppercase",
                letterSpacing: "1.2px",
                marginBottom: 6,
              }}
            >
              {m.role === "user" ? "Vous" : "DRH AI"}
            </div>

            {m.trace && m.trace.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(232,230,240,0.45)",
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Outils utilisés
                </div>
                {m.trace.map((t, i) => (
                  <ToolBadge key={i} name={t.tool} />
                ))}
              </div>
            )}

            <div
              style={{
                background:
                  m.role === "user"
                    ? "rgba(247,37,133,0.08)"
                    : "rgba(255,255,255,0.04)",
                border:
                  m.role === "user"
                    ? "1px solid rgba(247,37,133,0.2)"
                    : "1px solid rgba(232,230,240,0.08)",
                borderRadius: 16,
                padding: "14px 18px",
                fontSize: 15,
                lineHeight: 1.6,
                color: m.role === "user" ? "#fff" : "rgba(232,230,240,0.92)",
                whiteSpace: m.role === "user" ? "pre-wrap" : "normal",
              }}
            >
              {m.role === "user" ? m.content : renderMarkdown(m.content)}
            </div>
          </div>
        ))}

        {sending && (
          <div style={{ marginBottom: 22 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "rgba(0,245,212,0.75)",
                textTransform: "uppercase",
                letterSpacing: "1.2px",
                marginBottom: 6,
              }}
            >
              DRH AI
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(232,230,240,0.08)",
                borderRadius: 16,
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "rgba(232,230,240,0.6)",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#00f5d4",
                  animation: "pulse 1.2s ease-in-out infinite",
                }}
              />
              <span style={{ fontSize: 14 }}>Réflexion et exécution des outils…</span>
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(247,37,133,0.1)",
              border: "1px solid rgba(247,37,133,0.3)",
              borderRadius: 12,
              color: "#f72585",
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {messages.length <= 1 && !sending && (
          <div style={{ marginTop: 30 }}>
            <div
              style={{
                fontSize: 11,
                color: "rgba(232,230,240,0.45)",
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: "1.2px",
                fontWeight: 700,
              }}
            >
              Démarrer rapidement
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 10,
              }}
            >
              {QUICK_PROMPTS.map((qp, i) => (
                <button
                  key={i}
                  onClick={() => send(qp.prompt)}
                  style={{
                    textAlign: "left",
                    padding: "14px 16px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(232,230,240,0.08)",
                    borderRadius: 14,
                    color: "rgba(232,230,240,0.85)",
                    cursor: "pointer",
                    fontFamily: "'DM Sans',sans-serif",
                    transition: "all 0.18s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "rgba(0,245,212,0.06)";
                    e.currentTarget.style.borderColor =
                      "rgba(0,245,212,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "rgba(255,255,255,0.03)";
                    e.currentTarget.style.borderColor =
                      "rgba(232,230,240,0.08)";
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{qp.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#fff" }}>
                    {qp.label}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "rgba(232,230,240,0.5)",
                      marginTop: 4,
                      lineHeight: 1.45,
                    }}
                  >
                    {qp.prompt.slice(0, 90)}…
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Composer */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "16px 20px",
          background:
            "linear-gradient(180deg, transparent, rgba(5,4,15,0.95) 30%)",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 820,
            display: "flex",
            gap: 10,
            alignItems: "flex-end",
            background: "rgba(14,12,30,0.85)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(232,230,240,0.12)",
            borderRadius: 18,
            padding: "10px 10px 10px 16px",
            boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Posez votre question RH, collez un CV, demandez une offre…"
            rows={1}
            disabled={sending}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#fff",
              fontFamily: "'DM Sans',sans-serif",
              fontSize: 15,
              resize: "none",
              maxHeight: 200,
              minHeight: 36,
              padding: "8px 0",
              lineHeight: 1.5,
            }}
          />
          <button
            onClick={() => send()}
            disabled={sending || !input.trim()}
            style={{
              padding: "10px 18px",
              background:
                !sending && input.trim()
                  ? "linear-gradient(135deg,#00f5d4,#7209b7)"
                  : "rgba(232,230,240,0.1)",
              border: "none",
              borderRadius: 12,
              color: "#fff",
              fontFamily: "'Syne',sans-serif",
              fontWeight: 700,
              fontSize: 14,
              cursor: !sending && input.trim() ? "pointer" : "not-allowed",
              transition: "all 0.18s ease",
              whiteSpace: "nowrap",
            }}
          >
            {sending ? "…" : "Envoyer ↑"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        textarea::placeholder { color: rgba(232,230,240,0.35); }
      `}</style>
    </div>
  );
}
