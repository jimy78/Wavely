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
Formules codées en dur (pas d'IA, donc pas d'hallucination possible), barèmes
conventionnels **vérifiés sur la synthèse CCN 3085 à jour du 07/10/2025**
(dernière extension : avenant n°16 du 09/04/2025) :
- **Indemnité de licenciement / rupture conventionnelle** : légale (art. R1234-2 :
  1/4 mois/an ≤ 10 ans, 1/3 au-delà, éligible dès 8 mois) **vs** conventionnelle IDCC 16 :
  ouvriers/employés 1/10 puis 2/10 mois/an, TAM 1/10 puis 3/10, cadres 4/10 par année
  cadre + 3/10 par année employé/TAM — le plus favorable est retenu.
- **Départ à la retraite** : légale (art. D1237-1) **vs** barème IDCC 16 ouvriers/employés/TAM
  (0,5 mois ≥ 10 ans → 2,5 mois ≥ 30 ans, base moyenne 12 mois) ; cadres (% rémunération
  annuelle, art. 18 annexe IV) orientés vers le bot ; mise à la retraite = indemnité légale
  de licenciement.
- **Préavis** : tableau conventionnel complet par catégorie (ouvriers, employés/TAM 1-5,
  TAM 6-8, cadres) pour démission et licenciement, avec heures de recherche d'emploi et
  dispenses.

Le prompt système du bot embarque en outre une base de connaissances vérifiée issue de
la synthèse conventionnelle 2025 : période d'essai, maintien de salaire maladie/AT,
garantie d'emploi, travail de nuit (prime 20 %), frais de déplacement (avenant n°79 du
06/02/2025, montants au 01/03/2025), indemnisation jours fériés/dimanches, CFA.

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
