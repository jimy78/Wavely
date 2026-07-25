# 🧭 DRH Copilot — Agent RH autonome (Transport routier · IDCC 16)

Agent DRH/RH autonome intégré à l'application Wavely, expert du droit du travail français
et de la **Convention Collective Nationale des Transports Routiers et activités auxiliaires
du transport (IDCC 16 — brochure 3085)**.

## Accès

- Développement : `npm run dev` puis ouvrir **`/drh.html`**
- Production : la page est construite comme entrée Vite séparée (`drh.html`), l'app TikTok
  d'origine (`index.html`) reste inchangée.

## Fonctionnalités

### 💬 Assistant (chat)
Bot conversationnel propulsé par l'API Anthropic (modèle `claude-opus-5`), avec un prompt
système d'expert DRH qui impose :
- **Zéro invention** : incertitude signalée + source exacte à vérifier (Légifrance, URSSAF…)
- Citations des bases juridiques (Code du travail, annexes CCN IDCC 16)
- Application du **principe de faveur** (loi / convention / accord / usage)
- Analyse → challenge → synthèse → bloc **« ✅ Actions concrètes »** (qui / quoi / quand)
- Signalement des risques juridiques avec niveau (faible / moyen / élevé)

### 🧮 Calculateurs
Formules codées en dur (pas d'IA, donc pas d'hallucination possible) :
- **Indemnité de licenciement / rupture conventionnelle** : légale (art. R1234-2 :
  1/4 mois/an ≤ 10 ans, 1/3 au-delà, éligible dès 8 mois) **vs** conventionnelle IDCC 16
  par catégorie (ouvriers/employés, TAM, cadres) — le plus favorable est retenu.
- **Départ / mise à la retraite** : art. D1237-1 (½ mois ≥ 10 ans, 1 mois ≥ 15, 1,5 ≥ 20,
  2 ≥ 30) ; mise à la retraite = indemnité légale de licenciement.
- **Préavis** : minima légaux (art. L1234-1) + renvoi vers le détail conventionnel via le bot.

Chaque résultat porte un avertissement (salaire de référence, doublement inaptitude
professionnelle, barèmes conventionnels à confirmer sur Légifrance) et un bouton
**« Faire vérifier par le DRH »** qui envoie le calcul au bot pour contrôle et détail juridique.

### 📊 Tableau de bord social
Saisie mensuelle → calcul en direct de : turnover, absentéisme, taux de fréquence AT,
coût estimé de l'absentéisme, avec seuils d'alerte, puis analyse complète et plan d'action
90 jours par le bot.

### 📄 Documents & Process
Bibliothèque de générateurs (procédures de rupture, recrutement/onboarding conducteur,
pilotage social, temps de travail/paie IDCC 16). Un clic pré-remplit le chat avec un prompt
expert qui exige mentions obligatoires, délais et bases juridiques.

## Architecture

| Fichier | Rôle |
|---|---|
| `drh.html` | Point d'entrée Vite dédié |
| `src/drh/main.jsx` | Bootstrap React |
| `src/drh/DRHApp.jsx` | Interface complète (4 onglets) + moteur de calcul |
| `src/api/drh.js` | Handler serverless `/api/drh` → API Anthropic (même pattern que `analyze.js`) |
| `vite.config.js` | Build multi-pages (`main` + `drh`) |

## Configuration

Variable d'environnement côté serveur (déjà utilisée par `/api/analyze`) :

```
ANTHROPIC_API_KEY=sk-ant-...
```

## Avertissement

Outil d'aide à la décision : les montants conventionnels IDCC 16 évoluent par avenant.
Vérifier systématiquement les textes en vigueur sur
[legifrance.gouv.fr](https://www.legifrance.gouv.fr) avant toute décision engageante ;
faire valider les dossiers sensibles par un avocat en droit social.
