import { useMemo, useState } from "react";

/**
 * FORMAT ATTENDU DE L'EXTRACT IAMS (CSV, séparateur ; ou ,)
 * ----------------------------------------------------------
 * Matricule;Nom;Prenom;Societe;Contrat;TauxHoraire
 * EMP001;DUPONT;Marie;WAVELY SAS;CDI;18.50
 * EMP002;MARTIN;Paul;WAVELY SAS;CDD;15.00
 *
 * Les colonnes reconnues (insensible à la casse, accents ignorés) :
 *   matricule | nom | prenom | societe | contrat | tauxhoraire
 * Colonnes inconnues → ignorées.
 * Si TauxHoraire est présent, il est utilisé comme taux par défaut
 * pour les heures supplémentaires.
 */

const EVP_COLUMNS = [
  { id: "heures_sup",   label: "Heures sup",      unit: "h", default: 0 },
  { id: "heures_comp",  label: "Heures comp",     unit: "h", default: 0 },
  { id: "prime",        label: "Prime",           unit: "€", default: 0 },
  { id: "commission",   label: "Commission",      unit: "€", default: 0 },
  { id: "ticket_resto", label: "Tickets resto",   unit: "u", default: 0 },
  { id: "ind_km",       label: "Ind. km",         unit: "km", default: 0 },
  { id: "note_frais",   label: "Notes de frais",  unit: "€", default: 0 },
  { id: "absence_cp",   label: "CP",              unit: "j", default: 0 },
  { id: "absence_mal",  label: "Maladie",         unit: "j", default: 0 },
  { id: "acompte",      label: "Acompte",         unit: "€", default: 0 },
];

const HEURES_SUP_MAJORATION = 1.25;

const IAMS_ALIASES = {
  matricule: ["matricule", "id", "identifiant"],
  nom:       ["nom", "lastname", "nomfamille"],
  prenom:    ["prenom", "firstname"],
  societe:   ["societe", "company", "entreprise"],
  contrat:   ["contrat", "typecontrat", "contract"],
  tauxhoraire: ["tauxhoraire", "taux", "hourlyrate", "salairehoraire"],
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

const normalize = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

const canonicalKey = (raw) => {
  const n = normalize(raw).replace(/[\s_\-]/g, "");
  for (const [key, aliases] of Object.entries(IAMS_ALIASES)) {
    if (aliases.includes(n)) return key;
  }
  return null;
};

function parseCSV(text) {
  const cleaned = text.replace(/^﻿/, "").trim();
  if (!cleaned) return { headers: [], rows: [] };
  const sep = cleaned.split("\n")[0].includes(";") ? ";" : ",";
  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim());
  const parseLine = (l) => l.split(sep).map((c) => c.trim().replace(/^"(.*)"$/, "$1"));
  const rawHeaders = parseLine(lines[0]);
  const headers = rawHeaders.map(canonicalKey);
  const rows = lines.slice(1).map((l) => {
    const cells = parseLine(l);
    const row = {};
    headers.forEach((h, i) => {
      if (h) row[h] = cells[i] ?? "";
    });
    return row;
  });
  return { headers, rows };
}

const uid = () => `emp_${Math.random().toString(36).slice(2, 10)}`;

const emptyEVP = () =>
  EVP_COLUMNS.reduce((acc, c) => ({ ...acc, [c.id]: c.default }), {});

const formatEUR = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number.isFinite(n) ? n : 0);

function computeEmployeeTotals(emp) {
  const tauxHoraire = Number(emp.tauxhoraire) || 0;
  const evp = emp.evp;
  const heuresSup = (Number(evp.heures_sup) || 0) * tauxHoraire * HEURES_SUP_MAJORATION;
  const heuresComp = (Number(evp.heures_comp) || 0) * tauxHoraire;
  const prime = Number(evp.prime) || 0;
  const commission = Number(evp.commission) || 0;
  const tr = (Number(evp.ticket_resto) || 0) * 9.5;
  const km = (Number(evp.ind_km) || 0) * 0.6;
  const nf = Number(evp.note_frais) || 0;
  const acompte = Number(evp.acompte) || 0;
  const brut = heuresSup + heuresComp + prime + commission;
  const net = brut + tr + km + nf - acompte;
  return { brut, net, heuresSup, heuresComp };
}

function csvEscape(v) {
  const s = String(v ?? "");
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportWide(employees, period) {
  const cols = ["Matricule", "Nom", "Prenom", "Societe", "Contrat", "Periode",
    ...EVP_COLUMNS.map((c) => `${c.label} (${c.unit})`), "Brut variable"];
  const lines = [cols.join(";")];
  employees.forEach((e) => {
    const t = computeEmployeeTotals(e);
    lines.push([
      e.matricule, e.nom, e.prenom, e.societe, e.contrat, period,
      ...EVP_COLUMNS.map((c) => e.evp[c.id] ?? 0),
      t.brut.toFixed(2),
    ].map(csvEscape).join(";"));
  });
  return lines.join("\n");
}

function exportLong(employees, period) {
  const lines = ["Matricule;Nom;Prenom;Societe;Periode;Rubrique;Quantite;Unite;TauxHoraire"];
  employees.forEach((e) => {
    EVP_COLUMNS.forEach((c) => {
      const qty = Number(e.evp[c.id]) || 0;
      if (qty === 0) return;
      lines.push([
        e.matricule, e.nom, e.prenom, e.societe, period,
        c.label, qty, c.unit, e.tauxhoraire || "",
      ].map(csvEscape).join(";"));
    });
  });
  return lines.join("\n");
}

function download(name, content) {
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export default function PayrollBulkWidget() {
  const [period, setPeriod] = useState(PERIOD_OPTIONS[0].value);
  const [employees, setEmployees] = useState([]);
  const [importError, setImportError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file) => {
    setImportError("");
    try {
      const text = await file.text();
      const { headers, rows } = parseCSV(text);
      if (!headers.includes("matricule")) {
        setImportError("Colonne 'Matricule' introuvable dans le fichier.");
        return;
      }
      const imported = rows.map((r) => ({
        id: uid(),
        matricule: r.matricule || "",
        nom: r.nom || "",
        prenom: r.prenom || "",
        societe: r.societe || "",
        contrat: r.contrat || "",
        tauxhoraire: r.tauxhoraire || "",
        evp: emptyEVP(),
      }));
      setEmployees(imported);
    } catch (e) {
      setImportError("Fichier illisible : " + e.message);
    }
  };

  const updateEVP = (id, colId, value) => {
    setEmployees((emps) => emps.map((e) => e.id === id ? { ...e, evp: { ...e.evp, [colId]: value } } : e));
  };

  const updateTaux = (id, value) => {
    setEmployees((emps) => emps.map((e) => e.id === id ? { ...e, tauxhoraire: value } : e));
  };

  const addEmpty = () => {
    setEmployees((emps) => [...emps, {
      id: uid(), matricule: "", nom: "", prenom: "", societe: "", contrat: "", tauxhoraire: "", evp: emptyEVP(),
    }]);
  };

  const remove = (id) => setEmployees((emps) => emps.filter((e) => e.id !== id));

  const clearAll = () => {
    if (window.confirm("Vider toute la liste ?")) setEmployees([]);
  };

  const globalTotals = useMemo(() => {
    let brut = 0, net = 0;
    employees.forEach((e) => {
      const t = computeEmployeeTotals(e);
      brut += t.brut; net += t.net;
    });
    return { brut, net, count: employees.length };
  }, [employees]);

  return (
    <div style={S.wrapper}>
      <div style={S.header}>
        <div>
          <div style={S.eyebrow}>RH · Paie · Mode Bulk</div>
          <div style={S.title}>Éléments variables — multi-salariés</div>
          <div style={S.subtitle}>Import IAMS → saisie → export fichier de paie</div>
        </div>
        <div>
          <label style={S.label}>Période</label>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} style={S.input}>
            {PERIOD_OPTIONS.map((p) => (
              <option key={p.value} value={p.value} style={{ background: "#0e0c1e" }}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        style={{ ...S.dropzone, ...(dragOver ? S.dropzoneActive : {}) }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>📥</div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>
          Glissez votre extract IAMS (.csv) ici
        </div>
        <div style={S.dropHint}>
          Colonnes attendues : Matricule, Nom, Prenom, Societe, Contrat, TauxHoraire (facultatif)
        </div>
        <label style={S.btnFile}>
          Parcourir…
          <input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            style={{ display: "none" }} />
        </label>
        {importError && <div style={S.error}>{importError}</div>}
      </div>

      {employees.length > 0 && (
        <>
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Matricule</th>
                  <th style={S.th}>Nom / Prénom</th>
                  <th style={{ ...S.th, textAlign: "right" }}>Taux €/h</th>
                  {EVP_COLUMNS.map((c) => (
                    <th key={c.id} style={{ ...S.th, textAlign: "right" }} title={c.label}>
                      {c.label}
                      <div style={S.thUnit}>({c.unit})</div>
                    </th>
                  ))}
                  <th style={{ ...S.th, textAlign: "right" }}>Brut var.</th>
                  <th style={S.th}></th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => {
                  const t = computeEmployeeTotals(e);
                  return (
                    <tr key={e.id}>
                      <td style={S.td}>{e.matricule}</td>
                      <td style={S.td}>
                        <div style={{ fontWeight: 600 }}>{e.nom}</div>
                        <div style={S.small}>{e.prenom} · {e.contrat}</div>
                      </td>
                      <td style={S.td}>
                        <input type="number" step="0.01" value={e.tauxhoraire}
                          onChange={(ev) => updateTaux(e.id, ev.target.value)}
                          style={S.cellInput} />
                      </td>
                      {EVP_COLUMNS.map((c) => (
                        <td key={c.id} style={S.td}>
                          <input type="number" step="0.01" value={e.evp[c.id]}
                            onChange={(ev) => updateEVP(e.id, c.id, ev.target.value)}
                            style={S.cellInput} />
                        </td>
                      ))}
                      <td style={{ ...S.td, textAlign: "right", color: "#00f5d4", fontWeight: 700 }}>
                        {formatEUR(t.brut)}
                      </td>
                      <td style={S.td}>
                        <button onClick={() => remove(e.id)} style={S.btnRemove}>×</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={S.summary}>
            <div><strong>{globalTotals.count}</strong> salariés · Brut variable total : <strong style={{ color: "#00f5d4" }}>{formatEUR(globalTotals.brut)}</strong></div>
          </div>

          <div style={S.actions}>
            <button onClick={addEmpty} style={S.btnGhost}>+ Ligne manuelle</button>
            <button onClick={clearAll} style={S.btnGhost}>Vider</button>
            <div style={{ flex: 1 }} />
            <button onClick={() => download(`EVP_${period}_wide.csv`, exportWide(employees, period))} style={S.btnPrimary}>
              ⬇ Excel format A (1 ligne / salarié)
            </button>
            <button onClick={() => download(`EVP_${period}_long.csv`, exportLong(employees, period))} style={S.btnPrimary}>
              ⬇ Excel format B (1 ligne / rubrique)
            </button>
          </div>
        </>
      )}
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
    maxWidth: 1200,
    width: "100%",
    boxSizing: "border-box",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 18, flexWrap: "wrap" },
  eyebrow: { fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(0,245,212,0.7)" },
  title: { fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", marginTop: 4 },
  subtitle: { fontSize: 12, color: "rgba(232,230,240,0.5)", marginTop: 4 },
  label: { display: "block", fontSize: 11, color: "rgba(232,230,240,0.5)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 },
  input: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(0,245,212,0.18)",
    borderRadius: 10,
    padding: "8px 10px",
    color: "#fff",
    fontSize: 13,
    fontFamily: "inherit",
    outline: "none",
  },
  dropzone: {
    border: "2px dashed rgba(0,245,212,0.3)",
    borderRadius: 16,
    padding: "28px 20px",
    textAlign: "center",
    marginBottom: 18,
    transition: "background 0.15s",
  },
  dropzoneActive: { background: "rgba(0,245,212,0.08)" },
  dropHint: { fontSize: 11, color: "rgba(232,230,240,0.45)", marginBottom: 12 },
  btnFile: {
    display: "inline-block",
    padding: "8px 16px",
    background: "rgba(0,245,212,0.12)",
    border: "1px solid rgba(0,245,212,0.35)",
    borderRadius: 10,
    color: "#00f5d4",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  },
  error: { color: "#f72585", fontSize: 12, marginTop: 10 },
  tableWrap: { overflowX: "auto", marginBottom: 12, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 12 },
  th: {
    background: "rgba(255,255,255,0.04)",
    padding: "10px 8px",
    textAlign: "left",
    fontWeight: 700,
    color: "rgba(232,230,240,0.7)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    whiteSpace: "nowrap",
  },
  thUnit: { fontSize: 10, fontWeight: 400, color: "rgba(232,230,240,0.4)" },
  td: { padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.04)", verticalAlign: "middle" },
  small: { fontSize: 11, color: "rgba(232,230,240,0.5)" },
  cellInput: {
    width: 70,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 6,
    padding: "5px 6px",
    color: "#fff",
    fontSize: 12,
    textAlign: "right",
    outline: "none",
    fontFamily: "inherit",
  },
  btnRemove: {
    background: "rgba(247,37,133,0.12)",
    border: "1px solid rgba(247,37,133,0.3)",
    color: "#f72585",
    width: 26, height: 26,
    borderRadius: 6, cursor: "pointer", fontSize: 14, lineHeight: 1,
  },
  summary: {
    background: "rgba(0,245,212,0.06)",
    border: "1px solid rgba(0,245,212,0.2)",
    borderRadius: 12,
    padding: "10px 14px",
    fontSize: 13,
    marginBottom: 14,
  },
  actions: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
  btnGhost: {
    padding: "10px 14px",
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "rgba(232,230,240,0.7)",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "inherit",
  },
  btnPrimary: {
    padding: "10px 16px",
    background: "linear-gradient(135deg,#00f5d4,#7209b7)",
    border: "none",
    color: "#fff",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 13,
    borderRadius: 10,
    cursor: "pointer",
  },
};
