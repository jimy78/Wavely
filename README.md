# ⚽️ PronosMondial 2026

Application de **pronostics entre amis** pour tous les matchs de la **Coupe du Monde 2026** (style MonPetitProno / mpgprono).

Chacun pronostique le score exact de chaque match, marque des points selon un barème, et grimpe dans le classement de sa ligue privée.

## ✨ Fonctionnalités

- **Ligues privées** : crée une ligue, partage un code à 5 lettres, tes amis rejoignent.
- **104 matchs** : phase de groupes (12 groupes de 4) + tableau final (16es → finale).
- **Pronostic au score exact** avec verrouillage automatique au coup d'envoi.
- **Barème de points** :
  - Score exact → **+3 pts**
  - Bon résultat (1/N/2) → **+1 pt**
  - Bonne différence de buts → **+1 pt** bonus
- **Classement en direct**, mis à jour dès que l'organisateur saisit les scores réels.
- **Espace organisateur (admin)** : saisie des résultats et édition des équipes (utile pour les phases finales).
- **Synchronisation cloud** via Firebase Firestore, avec **repli automatique en local** si Firestore est indisponible.

## 🚀 Lancer en local

```bash
npm install
npm run dev
```

Puis ouvre l'URL affichée (http://localhost:5173).

## 🏗️ Build de production

```bash
npm run build
npm run preview
```

## ☁️ Synchronisation entre amis (Firestore)

Pour que les pronos soient partagés entre plusieurs appareils, active **Cloud Firestore** dans la console Firebase du projet (`wavely-eb418`) puis ajoute ces règles de test (à durcir avant une vraie mise en prod) :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /leagues/{code} {
      allow read, write: if true;
    }
  }
}
```

Sans Firestore, l'app fonctionne quand même : les données restent stockées **localement** dans le navigateur (un appareil = un classement).

## 🗂️ Structure

```
src/
  App.jsx            — Interface (accueil, matchs, classement, règles, admin)
  data/matches.js    — Calendrier des 104 matchs (équipes/dates éditables)
  lib/scoring.js     — Barème de points & calcul du classement
  lib/firebase.js    — Firestore + repli localStorage
```

> Les compositions de groupes et les dates sont **indicatives** et entièrement modifiables depuis l'espace organisateur de l'app.
