// ─────────────────────────────────────────────────────────────────
// Firebase / Firestore — stockage partagé des ligues entre amis.
// Si Firestore n'est pas disponible (réseau, règles), l'app bascule
// automatiquement sur le stockage local du navigateur (localStorage).
// ─────────────────────────────────────────────────────────────────
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore, doc, getDoc, setDoc, onSnapshot, serverTimestamp,
} from "firebase/firestore";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD4txUu4Ex55ERw3_w__eBV00cr-iRnLg4",
  authDomain: "wavely-eb418.firebaseapp.com",
  projectId: "wavely-eb418",
  storageBucket: "wavely-eb418.firebasestorage.app",
  messagingSenderId: "914889903752",
  appId: "1:914889903752:web:891f46cce189e5a60f993d",
};

const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApps()[0];

let db = null;
try {
  db = getFirestore(app);
} catch (e) {
  db = null;
}

export const cloudEnabled = !!db;

// ─── Stockage local de secours ───────────────────────────────────
const LS_KEY = (code) => `wc2026_league_${code}`;

function lsRead(code) {
  try {
    const raw = localStorage.getItem(LS_KEY(code));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function lsWrite(code, data) {
  try { localStorage.setItem(LS_KEY(code), JSON.stringify(data)); } catch {}
}

// ─── API ligue ───────────────────────────────────────────────────
export async function fetchLeague(code) {
  if (db) {
    try {
      const snap = await getDoc(doc(db, "leagues", code));
      return snap.exists() ? snap.data() : null;
    } catch {
      return lsRead(code);
    }
  }
  return lsRead(code);
}

export async function saveLeague(code, data) {
  if (db) {
    try {
      await setDoc(doc(db, "leagues", code), data, { merge: true });
      return true;
    } catch {
      lsWrite(code, data);
      return false;
    }
  }
  lsWrite(code, data);
  return false;
}

// Écoute en temps réel ; renvoie une fonction de désabonnement.
export function subscribeLeague(code, cb) {
  if (db) {
    try {
      return onSnapshot(
        doc(db, "leagues", code),
        (snap) => cb(snap.exists() ? snap.data() : null),
        () => {
          // En cas d'erreur (règles, offline), on lit le local périodiquement.
          const t = setInterval(() => cb(lsRead(code)), 1500);
          return () => clearInterval(t);
        }
      );
    } catch {
      cb(lsRead(code));
      return () => {};
    }
  }
  // Mode local : on simule un "temps réel" léger.
  cb(lsRead(code));
  const handler = (e) => { if (e.key === LS_KEY(code)) cb(lsRead(code)); };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

export const stamp = () => (db ? serverTimestamp() : Date.now());
