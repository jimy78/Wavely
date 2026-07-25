import { useMemo, useState } from "react";

const ELEMENT_TYPES = [
  { id: "heures_sup",     label: "Heures supplémentaires", icon: "⏱️", unit: "h",  defaultRate: 25,  category: "gain",     taxable: true,  cotisable: true  },
  { id: "heures_comp",    label: "Heures complémentaires", icon: "⏰", unit: "h",  defaultRate: 15,  category: "gain",     taxable: true,  cotisable: true  },
  { id: "prime_perf",     label: "Prime de performance",   icon: "🏆", unit: "€",  defaultRate: 1,   category: "gain",     taxable: true,  cotisable: true  },
  { id: "prime_excep",    label: "Prime exceptionnelle",   icon: "🎯", unit: "€",  defaultRate: 1,   category: "gain",     taxable: true,  cotisable: true  },
  { id: "commission",     label: "Commission",             icon: "💼", unit: "€",  defaultRate: 1,   category: "gain",     taxable: true,  cotisable: true  },
  { id: "ticket_resto",   label: "Tickets restaurant",     icon: "🍽️", unit: "u",  defaultRate: 9.5, category: "avantage", taxable: false, cotisable: false },
  { id: "ind_km",         label: "Indemnités kilométriques",icon: "🚗", unit: "km", defaultRate: 0.6, category: "frais",    taxable: false, cotisable: false },
  { id: "note_frais",     label: "Note de frais",          icon: "🧾", unit: "€",  defaultRate: 1,   category: "frais",    taxable: false, cotisable: false },
  { id: "absence_cp",     label: "Congés payés",           icon: "🏖️", unit: "j",  defaultRate: 0,   category: "absence",  taxable: false, cotisable: false },
  { id: "absence_maladie",label: "Absence maladie",        icon: "🤒", unit: "j",  defaultRate: 0,   category: "absence",  taxable: false, cotisable: false },
  { id: "acompte",        label: "Acompte versé",          icon: "💸", unit: "€",  defaultRate: 1,   category: "retenue",  taxable: false, cotisable: false },
  { id: "saisie",         label: "Saisie sur salaire",     icon: "⚖️", unit: "€",  defaultRate: 1,   category: "retenue",  taxable: false, cotisable: false },
];

const CATEGORY_META = {
  gain:     { label: "Gains",      color: "#00f5d4", sign: 1  },
  avantage: { label: "Avantages",  color: "#ffd166", sign: 1  },
  frais:    { label: "Frais",      color: "#7209b7", sign: 1  },
  absence:  { label: "Absences",   color: "#94a3b8", sign: 0  },
  retenue:  { label: "Retenues",   color: "#f72585", sign: -1 },
};

const PERIOD_OPTIONS = (() => {
  const now = new Date();
  const months = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
    });
  }
  return months;
})();

const formatEUR = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number.isFinite(n) ? n : 0);

const uid = () => `evp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

function computeAmount(typeId, quantity, rate) {
  const t = ELEMENT_TYPES.find((x) => x.id === typeId);
  if (!t) return 0;
  const q = Number(quantity) || 0;
  const r = Number(rate) || 0;
  if (t.category === "absence") return 0;
  return q * r * (CATEGORY_META[t.category]?.sign ?? 1);
}

function toCSV(rows, period, employee) {
  const header = ["Période", "Salarié", "Type", "Quantité", "Unité", "Taux", "Montant", "Catégorie", "Soumis cotis.", "Imposable", "Commentaire"];
  const lines = rows.map((r) => {
    const t = ELEMENT_TYPES.find((x) => x.id === r.typeId);
    return [
      period,
      employee || "",
      t?.label || r.typeId,
      r.quantity,
      t?.unit || "",
      r.rate,
      computeAmount(r.typeId, r.quantity, r.rate).toFixed(2),
      CATEGORY_META[t?.category]?.label || "",
      t?.cotisable ? "Oui" : "Non",
      t?.taxable ? "Oui" : "Non",
      (r.comment || "").replace(/[\r\n;]/g, " "),
    ].join(";");
  });
  return [header.join(";"), ...lines].join("\n");
}

export default function HRPayrollWidget({
  initialEmployee = "",
  initialPeriod = PERIOD_OPTIONS[0].value,
  initialItems = [],
  onChange,
  onSubmit,
}) {
  const [employee, setEmployee] = useState(initialEmployee);
  const [period, setPeriod] = useState(initialPeriod);
  const [items, setItems] = useState(initialItems);
  const [draft, setDraft] = useState({
    typeId: ELEMENT_TYPES[0].id,
    quantity: "",
    rate: ELEMENT_TYPES[0].defaultRate,
    comment: "",
  });

  const updateItems = (next) => {
    setItems(next);
    onChange?.({ employee, period, items: next });
  };

  const handleAdd = () => {
    if (!draft.quantity) return;
    const newItem = { id: uid(), ...draft };
    updateItems([...items, newItem]);
    const t = ELEMENT_TYPES.find((x) => x.id === draft.typeId);
    setDraft({ typeId: draft.typeId, quantity: "", rate: t?.defaultRate ?? 0, comment: "" });
  };

  const handleRemove = (id) => updateItems(items.filter((i) => i.id !== id));

  const handleTypeChange = (typeId) => {
    const t = ELEMENT_TYPES.find((x) => x.id === typeId);
    setDraft((d) => ({ ...d, typeId, rate: t?.defaultRate ?? 0 }));
  };

  const totals = useMemo(() => {
    const byCat = { gain: 0, avantage: 0, frais: 0, absence: 0, retenue: 0 };
    let cotisable = 0;
    let imposable = 0;
    let absenceDays = 0;
    items.forEach((it) => {
      const t = ELEMENT_TYPES.find((x) => x.id === it.typeId);
      if (!t) return;
      const amount = computeAmount(it.typeId, it.quantity, it.rate);
      byCat[t.category] += amount;
      if (t.cotisable) cotisable += amount;
      if (t.taxable) imposable += amount;
      if (t.category === "absence") absenceDays += Number(it.quantity) || 0;
    });
    const net = byCat.gain + byCat.avantage + byCat.frais + byCat.retenue;
    return { byCat, cotisable, imposable, absenceDays, net };
  }, [items]);

  const handleExport = () => {
    const csv = toCSV(items, period, employee);
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evp_${period}_${(employee || "salarie").replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = () => onSubmit?.({ employee, period, items, totals });

  const currentType = ELEMENT_TYPES.find((x) => x.id === draft.typeId);

  return (
    <div style={S.wrapper}>
      <div style={S.header}>
        <div>
          <div style={S.eyebrow}>RH · Paie</div>
          <div style={S.title}>Éléments variables de paie</div>
        </div>
        <div style={S.headerBadge}>{items.length} ligne{items.length > 1 ? "s" : ""}</div>
      </div>

      <div style={S.grid2}>
        <label style={S.field}>
          <span style={S.label}>Salarié</span>
          <input
            type="text"
            placeholder="Nom Prénom ou matricule"
            value={employee}
            onChange={(e) => setEmployee(e.target.value)}
            style={S.input}
          />
        </label>
        <label style={S.field}>
          <span style={S.label}>Période de paie</span>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} style={S.input}>
            {PERIOD_OPTIONS.map((p) => (
              <option key={p.value} value={p.value} style={{ background: "#0e0c1e" }}>{p.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div style={S.addBox}>
        <div style={S.addRow}>
          <label style={{ ...S.field, flex: "1 1 220px" }}>
            <span style={S.label}>Type d'élément</span>
            <select value={draft.typeId} onChange={(e) => handleTypeChange(e.target.value)} style={S.input}>
              {ELEMENT_TYPES.map((t) => (
                <option key={t.id} value={t.id} style={{ background: "#0e0c1e" }}>
                  {t.icon} {t.label}
                </option>
              ))}
            </select>
          </label>
          <label style={{ ...S.field, flex: "1 1 110px" }}>
            <span style={S.label}>Quantité ({currentType?.unit})</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={draft.quantity}
              onChange={(e) => setDraft({ ...draft, quantity: e.target.value })}
              style={S.input}
            />
          </label>
          <label style={{ ...S.field, flex: "1 1 110px" }}>
            <span style={S.label}>Taux (€)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={draft.rate}
              onChange={(e) => setDraft({ ...draft, rate: e.target.value })}
              style={S.input}
            />
          </label>
        </div>
        <label style={S.field}>
          <span style={S.label}>Commentaire (facultatif)</span>
          <input
            type="text"
            placeholder="Justification, n° de mission…"
            value={draft.comment}
            onChange={(e) => setDraft({ ...draft, comment: e.target.value })}
            style={S.input}
          />
        </label>
        <div style={S.addFooter}>
          <div style={S.preview}>
            Aperçu :{" "}
            <strong style={{ color: CATEGORY_META[currentType?.category]?.color }}>
              {formatEUR(computeAmount(draft.typeId, draft.quantity, draft.rate))}
            </strong>
          </div>
          <button onClick={handleAdd} disabled={!draft.quantity} style={S.btnPrimary(!!draft.quantity)}>
            + Ajouter la ligne
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div style={S.empty}>Aucun élément variable saisi pour cette période.</div>
      ) : (
        <ul style={S.list}>
          {items.map((it) => {
            const t = ELEMENT_TYPES.find((x) => x.id === it.typeId);
            const amount = computeAmount(it.typeId, it.quantity, it.rate);
            const color = CATEGORY_META[t?.category]?.color || "#fff";
            return (
              <li key={it.id} style={S.item}>
                <div style={S.itemIcon}>{t?.icon}</div>
                <div style={S.itemBody}>
                  <div style={S.itemTitle}>{t?.label}</div>
                  <div style={S.itemMeta}>
                    {it.quantity} {t?.unit} × {formatEUR(Number(it.rate) || 0)}
                    {it.comment ? ` · ${it.comment}` : ""}
                  </div>
                </div>
                <div style={{ ...S.itemAmount, color }}>
                  {t?.category === "absence" ? `${it.quantity} ${t.unit}` : formatEUR(amount)}
                </div>
                <button onClick={() => handleRemove(it.id)} style={S.btnRemove} aria-label="Supprimer">×</button>
              </li>
            );
          })}
        </ul>
      )}

      <div style={S.totals}>
        {Object.entries(CATEGORY_META).map(([key, meta]) => {
          const v = totals.byCat[key];
          if (key === "absence") {
            return (
              <div key={key} style={S.totalCell}>
                <div style={{ ...S.totalLabel, color: meta.color }}>{meta.label}</div>
                <div style={S.totalValue}>{totals.absenceDays} j</div>
              </div>
            );
          }
          return (
            <div key={key} style={S.totalCell}>
              <div style={{ ...S.totalLabel, color: meta.color }}>{meta.label}</div>
              <div style={S.totalValue}>{formatEUR(v)}</div>
            </div>
          );
        })}
      </div>

      <div style={S.summary}>
        <div style={S.summaryRow}>
          <span>Base cotisable</span>
          <strong>{formatEUR(totals.cotisable)}</strong>
        </div>
        <div style={S.summaryRow}>
          <span>Base imposable</span>
          <strong>{formatEUR(totals.imposable)}</strong>
        </div>
        <div style={{ ...S.summaryRow, ...S.summaryNet }}>
          <span>Total à intégrer en paie</span>
          <strong>{formatEUR(totals.net)}</strong>
        </div>
      </div>

      <div style={S.actions}>
        <button onClick={handleExport} disabled={!items.length} style={S.btnSecondary(!!items.length)}>
          ⬇ Exporter CSV
        </button>
        <button onClick={handleSubmit} disabled={!items.length || !employee} style={S.btnPrimary(!!items.length && !!employee)}>
          ✓ Valider la période
        </button>
      </div>
    </div>
  );
}

const S = {
  wrapper: {
    fontFamily: "'DM Sans', system-ui, sans-serif",
    background: "linear-gradient(180deg,#0e0c1e 0%,#05040f 100%)",
    border: "1px solid rgba(0,245,212,0.15)",
    borderRadius: 20,
    padding: 20,
    color: "#e8e6f0",
    maxWidth: 720,
    width: "100%",
    boxSizing: "border-box",
  },
  header: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 },
  eyebrow: { fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(0,245,212,0.7)" },
  title: { fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", marginTop: 4 },
  headerBadge: { fontSize: 12, color: "rgba(232,230,240,0.6)", background: "rgba(255,255,255,0.05)", padding: "6px 10px", borderRadius: 999 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 11, color: "rgba(232,230,240,0.5)", textTransform: "uppercase", letterSpacing: "1px" },
  input: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(0,245,212,0.18)",
    borderRadius: 10,
    padding: "10px 12px",
    color: "#fff",
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
  },
  addBox: {
    background: "rgba(0,245,212,0.04)",
    border: "1px dashed rgba(0,245,212,0.25)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  addRow: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 },
  addFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, gap: 10, flexWrap: "wrap" },
  preview: { fontSize: 13, color: "rgba(232,230,240,0.7)" },
  list: { listStyle: "none", padding: 0, margin: "0 0 14px", display: "flex", flexDirection: "column", gap: 8 },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 12,
  },
  itemIcon: { fontSize: 22, width: 32, textAlign: "center" },
  itemBody: { flex: 1, minWidth: 0 },
  itemTitle: { fontWeight: 600, fontSize: 14, color: "#fff" },
  itemMeta: { fontSize: 12, color: "rgba(232,230,240,0.5)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  itemAmount: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, whiteSpace: "nowrap" },
  btnRemove: {
    background: "rgba(247,37,133,0.1)",
    border: "1px solid rgba(247,37,133,0.3)",
    color: "#f72585",
    width: 28,
    height: 28,
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 16,
    lineHeight: 1,
  },
  empty: {
    textAlign: "center",
    padding: "20px 12px",
    fontSize: 13,
    color: "rgba(232,230,240,0.4)",
    border: "1px dashed rgba(255,255,255,0.08)",
    borderRadius: 12,
    marginBottom: 14,
  },
  totals: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8, marginBottom: 14 },
  totalCell: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 10,
    padding: "10px 12px",
  },
  totalLabel: { fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 },
  totalValue: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: "#fff" },
  summary: {
    background: "rgba(0,245,212,0.06)",
    border: "1px solid rgba(0,245,212,0.2)",
    borderRadius: 14,
    padding: "12px 16px",
    marginBottom: 16,
  },
  summaryRow: { display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, color: "rgba(232,230,240,0.7)" },
  summaryNet: {
    borderTop: "1px solid rgba(0,245,212,0.2)",
    marginTop: 6,
    paddingTop: 12,
    fontSize: 15,
    color: "#fff",
  },
  actions: { display: "flex", gap: 10, flexWrap: "wrap" },
  btnPrimary: (enabled) => ({
    flex: 1,
    minWidth: 160,
    padding: "12px 16px",
    borderRadius: 12,
    border: "none",
    cursor: enabled ? "pointer" : "not-allowed",
    background: enabled ? "linear-gradient(135deg,#00f5d4,#7209b7)" : "rgba(0,245,212,0.2)",
    color: "#fff",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 14,
    opacity: enabled ? 1 : 0.6,
  }),
  btnSecondary: (enabled) => ({
    flex: 1,
    minWidth: 160,
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid rgba(0,245,212,0.3)",
    background: "transparent",
    color: enabled ? "#00f5d4" : "rgba(0,245,212,0.4)",
    cursor: enabled ? "pointer" : "not-allowed",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 14,
  }),
};
