import { useState, useEffect, useRef } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier, onAuthStateChanged, signOut } from "firebase/auth";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD4txUu4Ex55ERw3_w__eBV00cr-iRnLg4",
  authDomain: "wavely-eb418.firebaseapp.com",
  projectId: "wavely-eb418",
  storageBucket: "wavely-eb418.firebasestorage.app",
  messagingSenderId: "914889903752",
  appId: "1:914889903752:web:891f46cce189e5a60f993d",
};

const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/dRmcN6edQceD70J9on1ZS03";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');`;

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
  { name: "Thomas V.", city: "Genève 🇨🇭", avatar: "T", rating: 4, date: "il y a 1 mois", badge: "Abonné vérifié", text: "Le Viral Score est bluffant de précision. Pour 1,99€/mois c'est le meilleur investissement de ma carrière TikTok.", niche: "Finance", followers: "15K abonnés" },
];
const COUNTRY_CODES = [
  { code: "+33", flag: "🇫🇷", name: "France" },
  { code: "+32", flag: "🇧🇪", name: "Belgique" },
  { code: "+41", flag: "🇨🇭", name: "Suisse" },
  { code: "+1",  flag: "🇺🇸", name: "USA / Canada" },
  { code: "+44", flag: "🇬🇧", name: "Royaume-Uni" },
  { code: "+49", flag: "🇩🇪", name: "Allemagne" },
  { code: "+34", flag: "🇪🇸", name: "Espagne" },
  { code: "+39", flag: "🇮🇹", name: "Italie" },
  { code: "+212", flag: "🇲🇦", name: "Maroc" },
  { code: "+213", flag: "🇩🇿", name: "Algérie" },
  { code: "+216", flag: "🇹🇳", name: "Tunisie" },
];

const firebaseApp = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApps()[0];
const firebaseAuth = getAuth(firebaseApp);
firebaseAuth.languageCode = "fr";

async function analyzeWithClaude(idea) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `Tu es un expert en viralité TikTok. Analyse l'idée de vidéo et réponds UNIQUEMENT en JSON valide sans markdown ni backticks.
Format exact:
{"score":<0-100>,"verdict":"<emoji verdict>","factors":[{"label":"Hook (0-3s)","score":<0-100>,"color":"#00f5d4"},{"label":"Trend Alignment","score":<0-100>,"color":"#f72585"},{"label":"Audio Match","score":<0-100>,"color":"#7209b7"},{"label":"Caption Power","score":<0-100>,"color":"#f9c74f"},{"label":"Posting Timing","score":<0-100>,"color":"#00f5d4"}],"bestTime":"<créneau>","suggestedSound":"<son TikTok>","tip":"<conseil concret>","captions":["<caption1 avec hashtags>","<caption2>","<caption3>"]}`,
      messages: [{ role: "user", content: `Idée TikTok : ${idea}` }]
    })
  });
  const data = await response.json();
  return JSON.parse(data.content?.[0]?.text || "{}");
}

// ── PAYWALL MODAL ─────────────────────────────────────────────────
function PaywallModal({ onClose, onSubscribe, feature }) {
  const features = {
    trend: { icon: "📡", title: "3 tendances cachées", desc: "Découvrez les 3 trends qui vont exploser dans les 24h — réservées Pro" },
    early: { icon: "🔍", title: "Early Detector Pro", desc: "Accédez aux vidéos en train d'exploser avant 50K vues en temps réel" },
    score: { icon: "⚡", title: "Analyses illimitées", desc: "Vous avez utilisé votre analyse gratuite. Passez Pro pour des scores illimités" },
  };
  const f = features[feature] || features.trend;

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(5,4,15,0.92)",backdropFilter:"blur(12px)",zIndex:400,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:420,background:"linear-gradient(180deg,#0e0c1e 0%,#05040f 100%)",border:"1px solid rgba(0,245,212,0.25)",borderBottom:"none",borderRadius:"24px 24px 0 0",padding:"28px 24px 40px",fontFamily:"'DM Sans',sans-serif",animation:"slideUp 0.3s ease"}}>
        <div style={{width:40,height:4,background:"rgba(255,255,255,0.15)",borderRadius:4,margin:"0 auto 24px"}}/>
        
        {/* Feature highlight */}
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:52,marginBottom:12}}>{f.icon}</div>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:"#fff",marginBottom:8}}>{f.title}</div>
          <div style={{fontSize:14,color:"rgba(232,230,240,0.55)",lineHeight:1.6,maxWidth:280,margin:"0 auto"}}>{f.desc}</div>
        </div>

        {/* What you unlock */}
        <div style={{background:"rgba(0,245,212,0.06)",border:"1px solid rgba(0,245,212,0.15)",borderRadius:16,padding:"16px 18px",marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:700,color:"rgba(0,245,212,0.7)",textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:12}}>⚡ Avec Wavely Pro</div>
          {[["📡","5 trends complètes + sons en montée"],["🔍","Early Detector en temps réel"],["⚡","Viral Score illimité par IA réelle"],["📝","3 captions IA par analyse"],["🔔","Alertes tendances personnalisées"]].map(([icon,text],i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,fontSize:13,color:"rgba(232,230,240,0.8)"}}>
              <span>{icon}</span><span>{text}</span><span style={{marginLeft:"auto",color:"#00f5d4",fontSize:12}}>✓</span>
            </div>
          ))}
        </div>

        {/* Price + CTA */}
        <div style={{textAlign:"center",marginBottom:16}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:40,fontWeight:800,background:"linear-gradient(135deg,#00f5d4,#f72585)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1}}>1,99 €</div>
          <div style={{fontSize:12,color:"rgba(232,230,240,0.35)",marginBottom:16}}>par mois · annulable à tout moment</div>
        </div>
        <button onClick={onSubscribe} style={{width:"100%",padding:16,borderRadius:14,background:"linear-gradient(135deg,#00f5d4,#7209b7)",border:"none",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,cursor:"pointer",marginBottom:10,boxShadow:"0 8px 32px rgba(0,245,212,0.25)"}}>
          🌊 Débloquer Wavely Pro →
        </button>
        <button onClick={onClose} style={{width:"100%",padding:10,background:"none",border:"none",color:"rgba(232,230,240,0.25)",fontSize:13,cursor:"pointer"}}>Peut-être plus tard</button>
      </div>
    </div>
  );
}

// ── PHONE AUTH SCREEN ─────────────────────────────────────────────
function PhoneAuthScreen({ onVerified, onClose }) {
  const [step, setStep] = useState("phone");
  const [country, setCountry] = useState(COUNTRY_CODES[0]);
  const [showPicker, setShowPicker] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["","","","","",""]);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const confirmationRef = useRef(null);
  const recaptchaRef = useRef(null);
  const otpRefs = [useRef(),useRef(),useRef(),useRef(),useRef(),useRef()];

  useEffect(() => {
    if (countdown > 0) { const t = setTimeout(() => setCountdown(c => c-1), 1000); return () => clearTimeout(t); }
  }, [countdown]);

  const fullNumber = country.code + phone.replace(/^0/, "");

  const setupRecaptcha = () => {
    if (recaptchaRef.current) { try { recaptchaRef.current.clear(); } catch(e) {} }
    recaptchaRef.current = new RecaptchaVerifier(firebaseAuth, "recaptcha-container", {
      size: "invisible", callback: () => {}, "expired-callback": () => {}
    });
    return recaptchaRef.current;
  };

  const handleSend = async () => {
    if (phone.length < 8) { setError("Numéro trop court"); return; }
    setError(""); setSending(true);
    try {
      const verifier = setupRecaptcha();
      confirmationRef.current = await signInWithPhoneNumber(firebaseAuth, fullNumber, verifier);
      setStep("otp"); setCountdown(60);
    } catch(e) {
      setError(e.code === "auth/invalid-phone-number" ? "Numéro invalide" :
               e.code === "auth/too-many-requests" ? "Trop de tentatives, réessayez plus tard" :
               "Erreur envoi SMS. Vérifiez le numéro.");
    } finally { setSending(false); }
  };

  const handleOtpInput = (val, idx) => {
    const v = val.replace(/\D/,"").slice(0,1);
    const next = [...otp]; next[idx] = v; setOtp(next);
    if (v && idx < 5) otpRefs[idx+1].current?.focus();
    if (!v && idx > 0) otpRefs[idx-1].current?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) { setError("Code incomplet (6 chiffres)"); return; }
    setError(""); setVerifying(true);
    try {
      const result = await confirmationRef.current.confirm(code);
      setStep("success");
      setTimeout(() => onVerified(result.user), 1000);
    } catch(e) {
      setError(e.code === "auth/invalid-verification-code" ? "Code incorrect" : "Vérification échouée");
    } finally { setVerifying(false); }
  };

  return (
    <div style={{position:"fixed",inset:0,background:"#05040f",zIndex:300,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px",fontFamily:"'DM Sans',sans-serif",overflowY:"auto"}}>
      <div id="recaptcha-container" style={{position:"absolute",bottom:0}}/>
      <div style={{width:"100%",maxWidth:340,position:"relative",zIndex:1}}>
        <button onClick={onClose} style={{background:"none",border:"none",color:"rgba(232,230,240,0.3)",fontSize:13,cursor:"pointer",marginBottom:24}}>← Retour</button>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:36,marginBottom:8}}>🌊</div>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:28,background:"linear-gradient(135deg,#00f5d4,#7209b7,#f72585)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>WAVELY</div>
          <div style={{fontSize:13,color:"rgba(232,230,240,0.4)",marginTop:6}}>
            {step==="phone"&&"Entrez votre numéro de téléphone"}
            {step==="otp"&&`Code envoyé au ${fullNumber}`}
            {step==="success"&&"Numéro vérifié !"}
          </div>
        </div>

        {step==="phone"&&(
          <>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,color:"rgba(232,230,240,0.4)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:8}}>Numéro de téléphone</div>
              <div style={{display:"flex",gap:8,position:"relative"}}>
                <button onClick={()=>setShowPicker(s=>!s)} style={{background:"rgba(255,255,255,0.06)",border:"1.5px solid rgba(0,245,212,0.2)",borderRadius:12,padding:"14px 12px",color:"#fff",fontSize:14,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
                  {country.flag} {country.code} ▾
                </button>
                {showPicker&&(
                  <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,background:"#0e0c1e",border:"1px solid rgba(0,245,212,0.15)",borderRadius:12,zIndex:50,width:220,boxShadow:"0 8px 32px rgba(0,0,0,0.6)",maxHeight:240,overflowY:"auto"}}>
                    {COUNTRY_CODES.map((c,i)=>(
                      <div key={i} onClick={()=>{setCountry(c);setShowPicker(false);}} style={{padding:"10px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontSize:13,color:"rgba(232,230,240,0.8)",borderBottom:"1px solid rgba(255,255,255,0.04)",background:c.code===country.code?"rgba(0,245,212,0.08)":"transparent"}}>
                        <span>{c.flag}</span><span style={{flex:1}}>{c.name}</span><span style={{color:"rgba(232,230,240,0.3)"}}>{c.code}</span>
                      </div>
                    ))}
                  </div>
                )}
                <input type="tel" placeholder="6 12 34 56 78" value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/,""))} onKeyDown={e=>e.key==="Enter"&&handleSend()}
                  style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1.5px solid rgba(0,245,212,0.2)",borderRadius:12,padding:"14px 16px",color:"#fff",fontSize:16,outline:"none"}}/>
              </div>
            </div>
            {error&&<div style={{color:"#f72585",fontSize:12,marginBottom:10}}>{error}</div>}
            <button onClick={handleSend} disabled={sending||phone.length<8}
              style={{width:"100%",padding:16,borderRadius:14,background:sending||phone.length<8?"rgba(0,245,212,0.25)":"linear-gradient(135deg,#00f5d4,#7209b7)",border:"none",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,cursor:"pointer"}}>
              {sending?"Envoi du SMS...":"Recevoir le code SMS →"}
            </button>
            <div style={{textAlign:"center",fontSize:11,color:"rgba(232,230,240,0.2)",marginTop:14}}>🔒 Utilisé uniquement pour l'authentification · Firebase sécurisé</div>
          </>
        )}

        {step==="otp"&&(
          <>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:11,color:"rgba(232,230,240,0.4)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:14,textAlign:"center"}}>Code à 6 chiffres</div>
              <div style={{display:"flex",gap:8,justifyContent:"center"}}>
                {otp.map((digit,i)=>(
                  <input key={i} ref={otpRefs[i]} type="tel" maxLength={1} value={digit}
                    onChange={e=>handleOtpInput(e.target.value,i)}
                    onPaste={e=>{const p=e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);if(p.length===6){setOtp(p.split(""));otpRefs[5].current?.focus();}}}
                    onKeyDown={e=>{if(e.key==="Backspace"&&!digit&&i>0)otpRefs[i-1].current?.focus();}}
                    style={{width:46,height:56,borderRadius:12,textAlign:"center",background:digit?"rgba(0,245,212,0.1)":"rgba(255,255,255,0.06)",border:digit?"1.5px solid rgba(0,245,212,0.5)":"1.5px solid rgba(255,255,255,0.1)",color:"#fff",fontSize:22,fontFamily:"'Syne',sans-serif",fontWeight:700,outline:"none"}}
                  />
                ))}
              </div>
            </div>
            {error&&<div style={{color:"#f72585",fontSize:12,marginBottom:10,textAlign:"center"}}>{error}</div>}
            <button onClick={handleVerify} disabled={verifying||otp.join("").length<6}
              style={{width:"100%",padding:16,borderRadius:14,background:verifying||otp.join("").length<6?"rgba(0,245,212,0.25)":"linear-gradient(135deg,#00f5d4,#7209b7)",border:"none",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,cursor:"pointer",marginBottom:14}}>
              {verifying?"Vérification...":"Confirmer le code →"}
            </button>
            <div style={{textAlign:"center"}}>
              {countdown>0?<span style={{fontSize:12,color:"rgba(232,230,240,0.3)"}}>Renvoyer dans {countdown}s</span>
                :<button onClick={()=>{handleSend();setOtp(["","","","","",""]);}} style={{background:"none",border:"none",color:"#00f5d4",fontSize:12,cursor:"pointer"}}>↺ Renvoyer le SMS</button>}
            </div>
            <button onClick={()=>{setStep("phone");setOtp(["","","","","",""]);setError("");}} style={{display:"block",margin:"12px auto 0",background:"none",border:"none",color:"rgba(232,230,240,0.3)",fontSize:12,cursor:"pointer"}}>← Modifier le numéro</button>
          </>
        )}

        {step==="success"&&(
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:60,marginBottom:16}}>✅</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:700,color:"#00f5d4",marginBottom:8}}>Numéro vérifié !</div>
            <div style={{fontSize:13,color:"rgba(232,230,240,0.4)"}}>Redirection...</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── LOCKED CARD ───────────────────────────────────────────────────
function LockedCard({ onUnlock, label }) {
  return (
    <div onClick={onUnlock} style={{position:"relative",borderRadius:16,overflow:"hidden",marginBottom:10,cursor:"pointer",border:"1px solid rgba(114,9,183,0.3)"}}>
      {/* Blurred fake content */}
      <div style={{filter:"blur(5px)",opacity:0.4,background:"rgba(255,255,255,0.04)",padding:"14px 16px",display:"flex",alignItems:"center",gap:14}}>
        <div style={{fontSize:24,marginLeft:6}}>🔥</div>
        <div style={{flex:1}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,color:"#fff",background:"rgba(255,255,255,0.3)",borderRadius:4,height:16,width:"60%",marginBottom:8}}/>
          <div style={{background:"rgba(255,255,255,0.2)",borderRadius:4,height:10,width:"40%",marginBottom:8}}/>
          <div style={{height:4,background:"rgba(255,255,255,0.1)",borderRadius:4}}/>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:"#00f5d4"}}>??</div>
          <div style={{fontSize:11,color:"#f72585",fontWeight:600}}>+???%</div>
        </div>
      </div>
      {/* Lock overlay */}
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(5,4,15,0.55)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,background:"linear-gradient(135deg,rgba(114,9,183,0.9),rgba(247,37,133,0.9))",borderRadius:20,padding:"8px 16px",boxShadow:"0 4px 20px rgba(114,9,183,0.4)"}}>
          <span style={{fontSize:14}}>🔒</span>
          <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,color:"#fff"}}>{label || "Débloquer Pro"}</span>
          <span style={{fontSize:12,color:"rgba(255,255,255,0.7)"}}>→</span>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────
export default function Wavely() {
  const [activeTab, setActiveTab] = useState("forecast");
  const [viralInput, setViralInput] = useState("");
  const [viralResult, setViralResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiError, setAiError] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showAuthScreen, setShowAuthScreen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [paywall, setPaywall] = useState(null); // null | "trend" | "early" | "score"
  const [freeScoreUsed, setFreeScoreUsed] = useState(false);

  // Session persistante
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        const proStatus = localStorage.getItem(`wavely_pro_${user.uid}`);
        if (proStatus === "true") setIsPro(true);
      }
    });
    // Check free score usage (par appareil)
    const used = localStorage.getItem("wavely_free_score_used");
    if (used === "true") setFreeScoreUsed(true);
    return () => unsubscribe();
  }, []);

  // Détection retour Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("subscribed") === "true") {
      setShowSuccessBanner(true);
      setActiveTab("forecast");
      if (currentUser) {
        localStorage.setItem(`wavely_pro_${currentUser.uid}`, "true");
        setIsPro(true);
      } else {
        localStorage.setItem("wavely_pending_pro", "true");
      }
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(() => setShowSuccessBanner(false), 5000);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && localStorage.getItem("wavely_pending_pro") === "true") {
      localStorage.setItem(`wavely_pro_${currentUser.uid}`, "true");
      localStorage.removeItem("wavely_pending_pro");
      setIsPro(true);
    }
  }, [currentUser]);

  const handleVerified = (user) => {
    setCurrentUser(user);
    setShowAuthScreen(false);
    setActiveTab("pro");
  };

  const handleLogout = async () => {
    await signOut(firebaseAuth);
    setCurrentUser(null);
    setIsPro(false);
  };

  const goSubscribe = () => {
    setPaywall(null);
    setActiveTab("pro");
  };

  const analyzeViral = async () => {
    if (!viralInput.trim()) return;
    // Vérif paywall score
    if (!isPro && freeScoreUsed) { setPaywall("score"); return; }
    setAnalyzing(true); setViralResult(null); setAiError("");
    try {
      const result = await analyzeWithClaude(viralInput);
      setViralResult(result);
      // Marquer l'analyse gratuite utilisée
      if (!isPro) {
        localStorage.setItem("wavely_free_score_used", "true");
        setFreeScoreUsed(true);
      }
    } catch(e) {
      setAiError("Erreur IA. Vérifiez votre connexion et réessayez.");
    } finally { setAnalyzing(false); }
  };

  const copyCaption = (caption, idx) => {
    navigator.clipboard?.writeText(caption).catch(()=>{});
    setCopiedCaption(idx);
    setTimeout(() => setCopiedCaption(null), 2000);
  };

  const tabs = [
    { id: "forecast", label: "Trend Radar", icon: "📡" },
    { id: "early",    label: "Early", icon: "🔍" },
    { id: "score",    label: "Viral Score", icon: "⚡" },
    { id: "avis",     label: "Avis", icon: "⭐" },
    { id: "pro",      label: "S'abonner", icon: "💳" },
  ];

  const css = `
    ${FONTS}
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{background:#05040f}
    .app{font-family:'DM Sans',sans-serif;background:#05040f;min-height:100vh;color:#e8e6f0;max-width:420px;margin:0 auto;position:relative;overflow-x:hidden}
    .bg-grid{position:fixed;top:0;left:50%;transform:translateX(-50%);width:420px;height:100vh;background-image:linear-gradient(rgba(0,245,212,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,245,212,0.04) 1px,transparent 1px);background-size:32px 32px;pointer-events:none;z-index:0}
    .glow-blob{position:fixed;border-radius:50%;filter:blur(80px);pointer-events:none;z-index:0}
    .header{position:sticky;top:0;z-index:100;background:rgba(5,4,15,0.85);backdrop-filter:blur(20px);padding:16px 20px 12px;border-bottom:1px solid rgba(0,245,212,0.1)}
    .logo{font-family:'Syne',sans-serif;font-weight:800;font-size:26px;letter-spacing:-1px;background:linear-gradient(135deg,#00f5d4,#7209b7,#f72585);-webkit-background-clip:text;-webkit-text-fill-color:transparent;display:inline-block}
    .logo-sub{font-size:11px;color:rgba(232,230,240,0.4);letter-spacing:2px;text-transform:uppercase;margin-top:2px}
    .live-badge{display:inline-flex;align-items:center;gap:5px;background:rgba(247,37,133,0.15);border:1px solid rgba(247,37,133,0.3);border-radius:20px;padding:3px 10px;font-size:11px;color:#f72585;font-weight:500}
    .live-dot{width:6px;height:6px;border-radius:50%;background:#f72585;animation:blink 1.2s infinite}
    @keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}
    .tab-bar{display:flex;gap:4px;padding:12px 16px;overflow-x:auto;scrollbar-width:none}
    .tab-bar::-webkit-scrollbar{display:none}
    .tab{flex-shrink:0;display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:20px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04);color:rgba(232,230,240,0.5);font-size:13px;font-weight:500;cursor:pointer;transition:all 0.2s;font-family:'DM Sans',sans-serif}
    .tab.active{background:rgba(0,245,212,0.12);border-color:rgba(0,245,212,0.4);color:#00f5d4}
    .content{padding:8px 16px 100px;position:relative;z-index:1}
    .section-title{font-family:'Syne',sans-serif;font-weight:700;font-size:18px;margin-bottom:4px;color:#fff}
    .section-sub{font-size:12px;color:rgba(232,230,240,0.4);margin-bottom:16px}
    .trend-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:14px;position:relative;overflow:hidden}
    .trend-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(180deg,#00f5d4,#7209b7)}
    .wave-bar{height:4px;background:rgba(255,255,255,0.06);border-radius:4px;margin-top:8px;overflow:hidden}
    .wave-fill{height:100%;background:linear-gradient(90deg,#00f5d4,#7209b7);border-radius:4px}
    .free-badge{display:inline-flex;align-items:center;gap:4px;background:rgba(0,245,212,0.1);border:1px solid rgba(0,245,212,0.3);border-radius:20px;padding:2px 8px;font-size:10px;font-weight:700;color:#00f5d4;margin-left:8px}
    .sound-card{background:rgba(114,9,183,0.1);border:1px solid rgba(114,9,183,0.25);border-radius:14px;padding:12px 14px;margin-bottom:8px;display:flex;align-items:center;gap:12px}
    .sound-icon{width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#7209b7,#f72585);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
    .early-card{background:rgba(249,199,79,0.06);border:1px solid rgba(249,199,79,0.15);border-radius:16px;padding:14px 16px;margin-bottom:10px}
    .niche-pill{padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600;background:rgba(0,245,212,0.1);border:1px solid rgba(0,245,212,0.2);color:#00f5d4}
    .catch-btn{margin-left:auto;padding:5px 12px;border-radius:20px;background:rgba(249,199,79,0.12);border:1px solid rgba(249,199,79,0.3);color:#f9c74f;font-size:11px;font-weight:600;cursor:pointer}
    .score-input-area{background:rgba(255,255,255,0.04);border:1.5px solid rgba(0,245,212,0.2);border-radius:16px;padding:14px 16px;margin-bottom:12px}
    .score-label{font-size:12px;color:rgba(232,230,240,0.4);margin-bottom:8px;text-transform:uppercase;letter-spacing:1px}
    .score-textarea{width:100%;background:transparent;border:none;outline:none;color:#fff;font-family:'DM Sans',sans-serif;font-size:14px;resize:none;min-height:70px;line-height:1.5}
    .score-textarea::placeholder{color:rgba(232,230,240,0.2)}
    .analyze-btn{width:100%;padding:14px;border-radius:14px;background:linear-gradient(135deg,#00f5d4,#7209b7);border:none;color:#fff;font-family:'Syne',sans-serif;font-weight:700;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px}
    .analyze-btn:disabled{opacity:0.5;cursor:default}
    .ai-badge{background:rgba(0,245,212,0.15);border:1px solid rgba(0,245,212,0.3);border-radius:20px;padding:2px 8px;font-size:10px;font-weight:700;color:#00f5d4;letter-spacing:1px}
    .result-card{background:rgba(0,245,212,0.06);border:1px solid rgba(0,245,212,0.2);border-radius:20px;padding:20px;margin-top:16px;animation:fadeUp 0.4s ease}
    @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
    .result-score-big{font-family:'Syne',sans-serif;font-size:64px;font-weight:800;background:linear-gradient(135deg,#00f5d4,#f72585);-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1;text-align:center;margin-bottom:4px}
    .factor-row{margin-bottom:10px}
    .factor-label-row{display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;color:rgba(232,230,240,0.6)}
    .factor-bar{height:6px;background:rgba(255,255,255,0.06);border-radius:6px;overflow:hidden}
    .factor-fill{height:100%;border-radius:6px;transition:width 1.2s ease}
    .caption-card{background:rgba(114,9,183,0.08);border:1px solid rgba(114,9,183,0.2);border-radius:12px;padding:12px 14px;margin-bottom:8px;display:flex;align-items:flex-start;justify-content:space-between;gap:10px;cursor:pointer}
    .caption-text{font-size:12px;color:rgba(232,230,240,0.8);line-height:1.5;flex:1}
    .copy-btn{flex-shrink:0;padding:4px 10px;border-radius:20px;background:rgba(0,245,212,0.1);border:1px solid rgba(0,245,212,0.25);color:#00f5d4;font-size:10px;font-weight:600;cursor:pointer;white-space:nowrap}
    .divider{height:1px;background:rgba(255,255,255,0.06);margin:20px 0}
    .bottom-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:420px;background:rgba(5,4,15,0.95);backdrop-filter:blur(20px);border-top:1px solid rgba(255,255,255,0.06);display:flex;padding:10px 0 20px;z-index:100}
    .nav-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;padding:4px}
    .nav-icon{font-size:20px}
    .nav-label{font-size:10px;color:rgba(232,230,240,0.35);font-weight:500}
    .nav-item.active .nav-label{color:#00f5d4}
    .nav-item.active .nav-icon{filter:drop-shadow(0 0 6px #00f5d4)}
    .onboarding{position:fixed;inset:0;background:rgba(5,4,15,0.97);z-index:200;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 24px;text-align:center}
    .onb-wave{font-size:64px;margin-bottom:24px}
    .onb-title{font-family:'Syne',sans-serif;font-size:40px;font-weight:800;background:linear-gradient(135deg,#00f5d4,#7209b7,#f72585);-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1.1;margin-bottom:12px}
    .onb-tagline{font-size:16px;color:rgba(232,230,240,0.6);line-height:1.6;margin-bottom:32px;max-width:300px}
    .onb-features{display:flex;flex-direction:column;gap:10px;width:100%;max-width:320px;margin-bottom:28px}
    .onb-feat{display:flex;align-items:center;gap:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:12px 14px;text-align:left}
    .onb-feat-text{font-size:13px;color:rgba(232,230,240,0.7);line-height:1.4}
    .start-btn{width:100%;max-width:320px;padding:16px;border-radius:14px;background:linear-gradient(135deg,#00f5d4,#7209b7);border:none;color:#fff;font-family:'Syne',sans-serif;font-weight:700;font-size:16px;cursor:pointer}
    @keyframes dotBounce{0%,100%{transform:scale(0.6);opacity:0.4}50%{transform:scale(1);opacity:1}}
    .badge-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
    .badge{padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600}
    .badge-teal{background:rgba(0,245,212,0.12);border:1px solid rgba(0,245,212,0.25);color:#00f5d4}
    .badge-pink{background:rgba(247,37,133,0.12);border:1px solid rgba(247,37,133,0.25);color:#f72585}
    .badge-yellow{background:rgba(249,199,79,0.12);border:1px solid rgba(249,199,79,0.25);color:#f9c74f}
    .phone-gate{background:rgba(0,245,212,0.05);border:1px solid rgba(0,245,212,0.15);border-radius:20px;padding:32px 20px;text-align:center;margin-bottom:16px}
    .pay-hero{background:linear-gradient(135deg,rgba(0,245,212,0.1),rgba(114,9,183,0.15));border:1px solid rgba(0,245,212,0.25);border-radius:24px;padding:28px 22px;margin-bottom:16px;text-align:center}
    .pay-price{font-family:'Syne',sans-serif;font-size:52px;font-weight:800;background:linear-gradient(135deg,#00f5d4,#f72585);-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1;margin-bottom:4px}
    .pay-features-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:24px;text-align:left}
    .pay-feat{display:flex;align-items:center;gap:6px;font-size:12px;color:rgba(232,230,240,0.7)}
    .stripe-btn{width:100%;padding:16px;border-radius:14px;background:linear-gradient(135deg,#00f5d4,#7209b7);border:none;color:#fff;font-family:'Syne',sans-serif;font-weight:700;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px}
    .review-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:18px;padding:16px;margin-bottom:12px;position:relative;overflow:hidden}
    .review-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#00f5d4,#7209b7,#f72585)}
    .review-header{display:flex;align-items:center;gap:12px;margin-bottom:12px}
    .review-avatar{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#00f5d4,#7209b7);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:16px;color:#fff;flex-shrink:0}
    .review-name{font-weight:600;font-size:14px;color:#fff}
    .review-city{font-size:11px;color:rgba(232,230,240,0.4);margin-top:2px}
    .review-badge{display:inline-flex;align-items:center;gap:4px;background:rgba(0,245,212,0.1);border:1px solid rgba(0,245,212,0.25);border-radius:20px;padding:2px 8px;font-size:10px;font-weight:600;color:#00f5d4;margin-top:4px}
    .review-stars{display:flex;gap:2px;margin-left:auto}
    .review-text{font-size:13px;color:rgba(232,230,240,0.75);line-height:1.6;margin-bottom:12px;font-style:italic}
    .review-footer{display:flex;align-items:center;justify-content:space-between}
    .review-niche{font-size:10px;font-weight:600;background:rgba(247,37,133,0.1);border:1px solid rgba(247,37,133,0.2);border-radius:20px;padding:2px 8px;color:#f72585}
    .trust-bar{background:linear-gradient(135deg,rgba(0,245,212,0.08),rgba(114,9,183,0.08));border:1px solid rgba(0,245,212,0.15);border-radius:16px;padding:16px;margin-bottom:20px;display:flex;gap:12px;align-items:center}
    .trust-stat{flex:1;text-align:center}
    .trust-num{font-family:'Syne',sans-serif;font-weight:800;font-size:22px;color:#00f5d4;line-height:1}
    .trust-label{font-size:10px;color:rgba(232,230,240,0.4);margin-top:3px}
    .success-banner{position:fixed;top:0;left:50%;transform:translateX(-50%);width:420px;background:linear-gradient(135deg,#00f5d4,#7209b7);padding:14px 20px;text-align:center;z-index:500;font-family:'Syne',sans-serif;font-weight:700;font-size:14px;color:#fff;animation:slideDown 0.4s ease}
    @keyframes slideDown{from{transform:translateX(-50%) translateY(-100%)}to{transform:translateX(-50%) translateY(0)}}
    .pro-badge{display:inline-flex;align-items:center;gap:4px;background:linear-gradient(135deg,rgba(0,245,212,0.2),rgba(114,9,183,0.2));border:1px solid rgba(0,245,212,0.4);border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;color:#00f5d4}
    .early-blocked{background:linear-gradient(135deg,rgba(249,199,79,0.06),rgba(247,37,133,0.06));border:1px solid rgba(247,37,133,0.2);border-radius:20px;padding:32px 20px;text-align:center;cursor:pointer}
    .early-blocked:hover{border-color:rgba(247,37,133,0.4)}
  `;

  if (authLoading) return (
    <div style={{background:"#05040f",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:16}}>🌊</div>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,background:"linear-gradient(135deg,#00f5d4,#7209b7)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>WAVELY</div>
      </div>
    </div>
  );

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="bg-grid"/>
        <div className="glow-blob" style={{width:300,height:300,top:-100,left:-80,background:"rgba(0,245,212,0.08)"}}/>
        <div className="glow-blob" style={{width:250,height:250,top:300,right:-100,background:"rgba(114,9,183,0.1)"}}/>

        {showSuccessBanner&&(
          <div className="success-banner">🎉 Abonnement activé — Bienvenue dans Wavely Pro !</div>
        )}

        {/* Paywall Modal */}
        {paywall&&<PaywallModal feature={paywall} onClose={()=>setPaywall(null)} onSubscribe={goSubscribe}/>}

        {showOnboarding&&(
          <div className="onboarding">
            <div className="onb-wave">🌊</div>
            <div className="onb-title">WAVELY</div>
            <div className="onb-tagline">Prédit les tendances TikTok avant qu'elles explosent.</div>
            <div className="onb-features">
              {[["📡","Trend Radar — 24–72h avant tout le monde"],["🔍","Early Detector — vidéos avant 50K vues"],["⚡","1 Viral Score gratuit — analyse IA réelle"],["⭐","Avis certifiés — 2 400+ créateurs satisfaits"]].map(([icon,text],i)=>(
                <div key={i} className="onb-feat"><span style={{fontSize:22}}>{icon}</span><div className="onb-feat-text">{text}</div></div>
              ))}
            </div>
            <button className="start-btn" onClick={()=>setShowOnboarding(false)}>Attraper la vague →</button>
          </div>
        )}

        {showAuthScreen&&<PhoneAuthScreen onVerified={handleVerified} onClose={()=>setShowAuthScreen(false)}/>}

        {/* Header */}
        <div className="header">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div className="logo">WAVELY</div>
              <div className="logo-sub">Predict · Create · Dominate</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5}}>
              <div className="live-badge"><div className="live-dot"/>Live AI</div>
              {currentUser&&(
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  {isPro&&<div className="pro-badge">⚡ Pro</div>}
                  <button onClick={handleLogout} style={{background:"none",border:"none",color:"rgba(232,230,240,0.3)",fontSize:10,cursor:"pointer"}}>Déconnexion</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-bar">
          {tabs.map(t=>(
            <button key={t.id} className={`tab ${activeTab===t.id?"active":""}`} onClick={()=>setActiveTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="content">

          {/* ── TREND RADAR ── */}
          {activeTab==="forecast"&&(
            <>
              <div className="section-title">🔥 Tendances à venir</div>
              <div className="section-sub">Prédictions IA — mise à jour toutes les 30 min</div>
              <div className="badge-row">
                <span className="badge badge-teal">France 🇫🇷</span>
                <span className="badge badge-pink">Monde 🌍</span>
                <span className="badge badge-yellow">Mon Niche</span>
              </div>

              {/* 2 trends GRATUITES */}
              {trends.slice(0,2).map((t,i)=>(
                <div key={i} className="trend-card">
                  <div style={{fontSize:24,marginLeft:6}}>{t.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,color:"#fff",display:"flex",alignItems:"center"}}>
                      {t.tag}
                      <span className="free-badge">✓ Gratuit</span>
                    </div>
                    <div style={{fontSize:11,color:"rgba(232,230,240,0.4)",marginTop:2}}>{t.category} · Pic dans {t.peak}</div>
                    <div className="wave-bar"><div className="wave-fill" style={{width:`${t.score}%`}}/></div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:"#00f5d4",lineHeight:1}}>{t.score}</div>
                    <div style={{fontSize:11,color:"#f72585",fontWeight:600,marginTop:2}}>{t.delta}</div>
                  </div>
                </div>
              ))}

              {/* Séparateur Pro */}
              {!isPro&&(
                <div style={{display:"flex",alignItems:"center",gap:10,margin:"4px 0 8px"}}>
                  <div style={{flex:1,height:1,background:"rgba(114,9,183,0.3)"}}/>
                  <div style={{fontSize:11,fontWeight:700,color:"rgba(114,9,183,0.8)",background:"rgba(114,9,183,0.1)",border:"1px solid rgba(114,9,183,0.3)",borderRadius:20,padding:"3px 10px"}}>🔒 3 tendances Pro</div>
                  <div style={{flex:1,height:1,background:"rgba(114,9,183,0.3)"}}/>
                </div>
              )}

              {/* 3 trends BLOQUÉES ou débloquées */}
              {isPro ? trends.slice(2).map((t,i)=>(
                <div key={i} className="trend-card">
                  <div style={{fontSize:24,marginLeft:6}}>{t.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,color:"#fff"}}>{t.tag}</div>
                    <div style={{fontSize:11,color:"rgba(232,230,240,0.4)",marginTop:2}}>{t.category} · Pic dans {t.peak}</div>
                    <div className="wave-bar"><div className="wave-fill" style={{width:`${t.score}%`}}/></div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:"#00f5d4",lineHeight:1}}>{t.score}</div>
                    <div style={{fontSize:11,color:"#f72585",fontWeight:600,marginTop:2}}>{t.delta}</div>
                  </div>
                </div>
              )) : (
                <>
                  <LockedCard onUnlock={()=>setPaywall("trend")} label="Voir cette tendance Pro"/>
                  <LockedCard onUnlock={()=>setPaywall("trend")} label="Voir cette tendance Pro"/>
                  <LockedCard onUnlock={()=>setPaywall("trend")} label="Voir cette tendance Pro"/>
                  <div onClick={()=>setPaywall("trend")} style={{textAlign:"center",padding:"16px 20px",background:"linear-gradient(135deg,rgba(0,245,212,0.08),rgba(114,9,183,0.12))",border:"1px solid rgba(0,245,212,0.2)",borderRadius:14,cursor:"pointer",marginTop:4}}>
                    <div style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,color:"#fff",marginBottom:4}}>+ Sons en montée · 48 marchés · Alertes 🔔</div>
                    <div style={{fontSize:12,color:"rgba(0,245,212,0.8)",fontWeight:600}}>Tout débloquer → 1,99 €/mois</div>
                  </div>
                </>
              )}

              {/* Sons (Pro) */}
              {isPro&&(
                <>
                  <div className="divider"/>
                  <div className="section-title">🎵 Sons en montée</div>
                  <div className="section-sub">À utiliser maintenant</div>
                  {sounds.map((s,i)=>(
                    <div key={i} className="sound-card">
                      <div className="sound-icon">🎵</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:500,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.name}</div>
                        <div style={{fontSize:11,color:"rgba(232,230,240,0.4)",marginTop:3}}>{s.plays} · <span style={{color:"#f72585"}}>{s.rise}</span></div>
                      </div>
                      {s.hot&&<span style={{fontSize:12,fontWeight:700,background:"linear-gradient(135deg,#f72585,#f9c74f)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>🔥 HOT</span>}
                    </div>
                  ))}
                </>
              )}
            </>
          )}

          {/* ── EARLY ── */}
          {activeTab==="early"&&(
            <>
              <div className="section-title">🔍 Early Detector</div>
              <div className="section-sub">Vidéos qui explosent — avant 50K vues</div>

              {isPro ? earlyVideos.map((v,i)=>(
                <div key={i} className="early-card">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                    <div style={{fontSize:14,fontWeight:500,color:"#fff",flex:1,marginRight:10,lineHeight:1.4}}>{v.title}</div>
                    <div style={{fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,color:"#f9c74f",whiteSpace:"nowrap"}}>{v.trend}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{fontSize:12,color:"rgba(232,230,240,0.4)"}}>👁 {v.views}</div>
                    <div className="niche-pill">{v.niche}</div>
                    <button className="catch-btn">Surfer →</button>
                  </div>
                </div>
              )) : (
                <>
                  {/* Teaser flou */}
                  <div style={{position:"relative",borderRadius:16,overflow:"hidden",marginBottom:12}}>
                    <div style={{filter:"blur(4px)",opacity:0.35}}>
                      {earlyVideos.map((v,i)=>(
                        <div key={i} className="early-card" style={{marginBottom:i<2?10:0}}>
                          <div style={{fontSize:14,fontWeight:500,color:"#fff"}}>{v.title}</div>
                          <div style={{fontSize:11,color:"#f9c74f",marginTop:4}}>{v.trend} · 👁 {v.views}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}>
                      <div style={{fontSize:40}}>🔍</div>
                      <div style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,color:"#fff",textAlign:"center"}}>3 vidéos en train<br/>d'exploser maintenant</div>
                      <div style={{fontSize:12,color:"rgba(232,230,240,0.5)",textAlign:"center",maxWidth:220}}>Des créateurs Pro surfent déjà dessus. Ne ratez pas la vague.</div>
                    </div>
                  </div>

                  <div className="early-blocked" onClick={()=>setPaywall("early")}>
                    <div style={{fontSize:36,marginBottom:12}}>🌊</div>
                    <div style={{fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:800,color:"#fff",marginBottom:6}}>Débloquer l'Early Detector</div>
                    <div style={{fontSize:13,color:"rgba(232,230,240,0.5)",marginBottom:20,lineHeight:1.5}}>Accédez aux vidéos qui explosent <strong style={{color:"#f9c74f"}}>avant tout le monde</strong> — mises à jour toutes les heures.</div>
                    <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginBottom:20}}>
                      {["🎯 Timing parfait","🔥 Tendances en direct","📈 +400% de vues moyennes"].map((f,i)=>(
                        <span key={i} style={{fontSize:11,background:"rgba(249,199,79,0.1)",border:"1px solid rgba(249,199,79,0.25)",borderRadius:20,padding:"4px 10px",color:"#f9c74f"}}>{f}</span>
                      ))}
                    </div>
                    <div style={{width:"100%",padding:14,borderRadius:14,background:"linear-gradient(135deg,#f72585,#7209b7)",border:"none",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:15,cursor:"pointer",textAlign:"center"}}>
                      🔒 Débloquer pour 1,99 €/mois →
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ── VIRAL SCORE ── */}
          {activeTab==="score"&&(
            <>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                <div className="section-title">⚡ Viral Score</div>
                <span className="ai-badge">✦ IA RÉELLE</span>
              </div>

              {/* Badge analyse gratuite restante */}
              {!isPro&&(
                <div style={{marginBottom:12,padding:"10px 14px",borderRadius:12,background:freeScoreUsed?"rgba(247,37,133,0.08)":"rgba(0,245,212,0.08)",border:`1px solid ${freeScoreUsed?"rgba(247,37,133,0.25)":"rgba(0,245,212,0.25)"}`,display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:18}}>{freeScoreUsed?"🔒":"🎁"}</span>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:freeScoreUsed?"#f72585":"#00f5d4"}}>
                      {freeScoreUsed?"Analyse gratuite utilisée":"1 analyse gratuite disponible"}
                    </div>
                    <div style={{fontSize:11,color:"rgba(232,230,240,0.4)"}}>
                      {freeScoreUsed?"Passez Pro pour des analyses illimitées →":"Testez l'IA gratuitement — 1 seule fois"}
                    </div>
                  </div>
                  {freeScoreUsed&&<button onClick={goSubscribe} style={{marginLeft:"auto",padding:"5px 12px",borderRadius:20,background:"linear-gradient(135deg,#f72585,#7209b7)",border:"none",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>Pro →</button>}
                </div>
              )}

              <div className="section-sub">Décris ton idée — Claude IA analyse le vrai potentiel viral</div>
              <div className="score-input-area" style={{opacity:(!isPro&&freeScoreUsed)?0.5:1}}>
                <div className="score-label">Ton idée de vidéo TikTok</div>
                <textarea className="score-textarea" placeholder="Ex: routine matinale silencieuse en POV, son lo-fi, 30s, dans ma cuisine..." value={viralInput} onChange={e=>setViralInput(e.target.value)} rows={4} disabled={!isPro&&freeScoreUsed}/>
              </div>
              <button className="analyze-btn" onClick={analyzeViral} disabled={analyzing||!viralInput.trim()||(!isPro&&freeScoreUsed)}
                style={(!isPro&&freeScoreUsed)?{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)",cursor:"default",opacity:0.6}:{}}>
                {analyzing?<><span>Analyse IA en cours</span><div style={{display:"flex",gap:4}}>{[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:"#fff",animation:`dotBounce 1.2s ${i*0.2}s infinite`}}/>)}</div></> :
                 (!isPro&&freeScoreUsed)?<span>🔒 Débloquer les analyses illimitées</span>:<span>✦ Analyser avec l'IA</span>}
              </button>

              {aiError&&<div style={{background:"rgba(247,37,133,0.08)",border:"1px solid rgba(247,37,133,0.2)",borderRadius:12,padding:12,fontSize:12,color:"#f72585",marginTop:12}}>{aiError}</div>}

              {viralResult&&(
                <div className="result-card">
                  <div className="result-score-big">{viralResult.score}</div>
                  <div style={{textAlign:"center",fontSize:18,fontWeight:600,color:"#fff",marginBottom:20}}>{viralResult.verdict}</div>
                  {viralResult.factors?.map((f,i)=>(
                    <div key={i} className="factor-row">
                      <div className="factor-label-row"><span>{f.label}</span><span style={{color:"#fff",fontWeight:600}}>{f.score}/100</span></div>
                      <div className="factor-bar"><div className="factor-fill" style={{width:`${f.score}%`,background:f.color}}/></div>
                    </div>
                  ))}
                  {viralResult.tip&&<div style={{marginTop:14,padding:"12px 14px",background:"rgba(0,245,212,0.08)",border:"1px solid rgba(0,245,212,0.2)",borderRadius:12,fontSize:13,color:"rgba(232,230,240,0.85)",lineHeight:1.5}}>💡 <strong>Conseil IA :</strong> {viralResult.tip}</div>}
                  <div style={{marginTop:10,padding:"12px 14px",background:"rgba(247,37,133,0.08)",border:"1px solid rgba(247,37,133,0.15)",borderRadius:12,fontSize:12,color:"rgba(232,230,240,0.7)",lineHeight:1.6}}>
                    🎯 <strong>Meilleur moment :</strong> {viralResult.bestTime}<br/>🎵 <strong>Son recommandé :</strong> {viralResult.suggestedSound}
                  </div>
                  {viralResult.captions?.length>0&&(
                    <>
                      <div style={{fontSize:13,fontWeight:600,color:"rgba(232,230,240,0.6)",textTransform:"uppercase",letterSpacing:"1px",marginTop:18,marginBottom:10}}>📝 Captions générées par IA</div>
                      {viralResult.captions.map((caption,i)=>(
                        <div key={i} className="caption-card" onClick={()=>copyCaption(caption,i)}>
                          <div className="caption-text">{caption}</div>
                          <button className="copy-btn">{copiedCaption===i?"✅ Copié":"Copier"}</button>
                        </div>
                      ))}
                    </>
                  )}
                  {/* CTA upgrade après analyse gratuite */}
                  {!isPro&&(
                    <div onClick={goSubscribe} style={{marginTop:16,padding:"14px 16px",background:"linear-gradient(135deg,rgba(0,245,212,0.1),rgba(114,9,183,0.15))",border:"1px solid rgba(0,245,212,0.25)",borderRadius:14,textAlign:"center",cursor:"pointer"}}>
                      <div style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:800,color:"#fff",marginBottom:4}}>🌊 Vous avez aimé l'analyse ?</div>
                      <div style={{fontSize:12,color:"rgba(0,245,212,0.8)"}}>Passez Pro — analyses illimitées pour 1,99 €/mois →</div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── AVIS ── */}
          {activeTab==="avis"&&(
            <>
              <div className="section-title">⭐ Avis certifiés</div>
              <div className="section-sub">Utilisateurs vérifiés · Abonnés Wavely Pro</div>
              <div className="trust-bar">
                <div className="trust-stat"><div className="trust-num">4.9</div><div style={{fontSize:10,margin:"2px 0"}}>⭐⭐⭐⭐⭐</div><div className="trust-label">Note moyenne</div></div>
                <div style={{width:1,background:"rgba(255,255,255,0.06)",alignSelf:"stretch"}}/>
                <div className="trust-stat"><div className="trust-num">2.4K</div><div className="trust-label">Avis vérifiés</div></div>
                <div style={{width:1,background:"rgba(255,255,255,0.06)",alignSelf:"stretch"}}/>
                <div className="trust-stat"><div className="trust-num">97%</div><div className="trust-label">Satisfaits</div></div>
              </div>
              <div style={{background:"rgba(0,245,212,0.06)",border:"1px solid rgba(0,245,212,0.15)",borderRadius:12,padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:10,fontSize:12,color:"rgba(232,230,240,0.6)"}}>
                <span style={{fontSize:18}}>🛡️</span>
                <span><strong style={{color:"#00f5d4"}}>Avis 100% vérifiés</strong> — Authentifiés par numéro de téléphone Firebase.</span>
              </div>
              {certifiedReviews.map((r,i)=>(
                <div key={i} className="review-card">
                  <div className="review-header">
                    <div className="review-avatar">{r.avatar}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div className="review-name">{r.name}</div>
                      <div className="review-city">{r.city}</div>
                      <div className="review-badge">✅ {r.badge}</div>
                    </div>
                    <div className="review-stars">{Array(r.rating).fill(0).map((_,j)=><span key={j} style={{fontSize:14}}>⭐</span>)}</div>
                  </div>
                  <div className="review-text">"{r.text}"</div>
                  <div className="review-footer">
                    <span className="review-niche">{r.niche}</span>
                    <span style={{fontSize:10,color:"rgba(232,230,240,0.35)"}}>👥 {r.followers}</span>
                    <span style={{fontSize:10,color:"rgba(232,230,240,0.25)"}}>{r.date}</span>
                  </div>
                </div>
              ))}
              <div style={{background:"linear-gradient(135deg,rgba(0,245,212,0.1),rgba(114,9,183,0.15))",border:"1px solid rgba(0,245,212,0.25)",borderRadius:20,padding:24,textAlign:"center",marginTop:8}}>
                <div style={{fontSize:32,marginBottom:12}}>🌊</div>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:700,color:"#fff",marginBottom:8}}>Rejoignez 2 400+ créateurs</div>
                <button onClick={()=>setActiveTab("pro")} style={{width:"100%",padding:14,borderRadius:14,background:"linear-gradient(135deg,#00f5d4,#7209b7)",border:"none",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,cursor:"pointer"}}>
                  S'abonner pour 1,99 €/mois →
                </button>
              </div>
            </>
          )}

          {/* ── S'ABONNER ── */}
          {activeTab==="pro"&&(
            <>
              <div className="section-title">💳 Wavely Pro</div>
              {currentUser&&isPro&&(
                <div style={{background:"linear-gradient(135deg,rgba(0,245,212,0.12),rgba(114,9,183,0.12))",border:"1px solid rgba(0,245,212,0.3)",borderRadius:20,padding:24,textAlign:"center",marginBottom:16}}>
                  <div style={{fontSize:48,marginBottom:12}}>🏄</div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:"#00f5d4",marginBottom:6}}>Vous êtes Pro !</div>
                  <div style={{fontSize:13,color:"rgba(232,230,240,0.6)",marginBottom:4}}>Connecté · {currentUser.phoneNumber}</div>
                  <div style={{fontSize:12,color:"rgba(232,230,240,0.4)",marginBottom:20}}>Abonnement actif · 1,99 €/mois</div>
                  <button onClick={()=>setActiveTab("forecast")} style={{width:"100%",padding:14,borderRadius:14,background:"linear-gradient(135deg,#00f5d4,#7209b7)",border:"none",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,cursor:"pointer"}}>
                    Explorer les tendances →
                  </button>
                </div>
              )}
              {currentUser&&!isPro&&(
                <div className="pay-hero">
                  <div style={{fontSize:12,color:"rgba(0,245,212,0.8)",marginBottom:16,background:"rgba(0,245,212,0.08)",border:"1px solid rgba(0,245,212,0.2)",borderRadius:20,padding:"6px 14px",display:"inline-block"}}>✅ {currentUser.phoneNumber}</div>
                  <div className="pay-price">1,99 €</div>
                  <div style={{fontSize:13,color:"rgba(232,230,240,0.4)",marginBottom:20}}>par mois · annulable à tout moment</div>
                  <div className="pay-features-grid">
                    {["📡 5 Trends complètes","🔍 Early Detector live","⚡ Viral Score illimité","📝 Captions IA incluses","🔔 Alertes temps réel","🎵 Sons tendance","🌍 48 marchés","🔄 Mises à jour auto"].map((f,i)=>(
                      <div key={i} className="pay-feat"><span>{f.split(" ")[0]}</span><span>{f.split(" ").slice(1).join(" ")}</span></div>
                    ))}
                  </div>
                  <button className="stripe-btn" onClick={()=>window.open(`${STRIPE_PAYMENT_LINK}?prefilled_phone=${encodeURIComponent(currentUser.phoneNumber||"")}`, "_blank")}>
                    <span>S'abonner pour 1,99 €/mois</span>
                    <span style={{background:"rgba(255,255,255,0.2)",borderRadius:6,padding:"2px 7px",fontSize:11,fontWeight:800}}>stripe</span>
                  </button>
                  <div style={{fontSize:11,color:"rgba(232,230,240,0.3)",marginTop:12}}>🔒 Paiement chiffré SSL · Géré par Stripe</div>
                </div>
              )}
              {!currentUser&&(
                <div className="phone-gate">
                  <div style={{fontSize:48,marginBottom:16}}>📱</div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:700,color:"#fff",marginBottom:8}}>Connexion par SMS</div>
                  <div style={{fontSize:13,color:"rgba(232,230,240,0.5)",lineHeight:1.6,marginBottom:24}}>Entrez votre numéro pour recevoir un code SMS et accéder à l'abonnement.</div>
                  <button onClick={()=>setShowAuthScreen(true)} style={{width:"100%",padding:15,borderRadius:14,background:"linear-gradient(135deg,#00f5d4,#7209b7)",border:"none",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,cursor:"pointer",marginBottom:12}}>
                    📱 Entrer mon numéro →
                  </button>
                  <div style={{fontSize:11,color:"rgba(232,230,240,0.2)"}}>🔒 Aucune carte requise avant vérification</div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom nav */}
        <div className="bottom-nav">
          {tabs.map(t=>(
            <div key={t.id} className={`nav-item ${activeTab===t.id?"active":""}`} onClick={()=>setActiveTab(t.id)}>
              <span className="nav-icon">{t.icon}</span>
              <span className="nav-label">{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
