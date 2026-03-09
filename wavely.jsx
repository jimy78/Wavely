import { useState, useEffect, useRef } from "react";

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');
`;

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

const viralFactors = [
  { label: "Hook (0-3s)", score: 85, color: "#00f5d4" },
  { label: "Trend Alignment", score: 72, color: "#f72585" },
  { label: "Audio Match", score: 91, color: "#7209b7" },
  { label: "Caption Power", score: 63, color: "#f9c74f" },
  { label: "Posting Timing", score: 78, color: "#00f5d4" },
];

export default function Wavely() {
  const [activeTab, setActiveTab] = useState("forecast");
  const [viralInput, setViralInput] = useState("");
  const [viralResult, setViralResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setPulse(p => (p + 1) % 100), 50);
    return () => clearInterval(interval);
  }, []);

  const analyzeViral = () => {
    if (!viralInput.trim()) return;
    setAnalyzing(true);
    setViralResult(null);
    setTimeout(() => {
      setAnalyzing(false);
      setViralResult({
        score: Math.floor(65 + Math.random() * 30),
        factors: viralFactors,
        bestTime: "Ce soir 20h–22h",
        suggestedSound: sounds[0].name,
        verdict: "Fort potentiel viral 🔥",
      });
    }, 1800);
  };

  const tabs = [
    { id: "forecast", label: "Trend Radar", icon: "📡" },
    { id: "early", label: "Early Detector", icon: "🔍" },
    { id: "score", label: "Viral Score", icon: "⚡" },
    { id: "pro", label: "Mon Plan", icon: "🎯" },
  ];

  return (
    <>
      <style>{FONTS}{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #05040f; }

        .app {
          font-family: 'DM Sans', sans-serif;
          background: #05040f;
          min-height: 100vh;
          color: #e8e6f0;
          max-width: 420px;
          margin: 0 auto;
          position: relative;
          overflow-x: hidden;
        }

        .bg-grid {
          position: fixed;
          top: 0; left: 50%; transform: translateX(-50%);
          width: 420px; height: 100vh;
          background-image:
            linear-gradient(rgba(0,245,212,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,245,212,0.04) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
          z-index: 0;
        }

        .glow-blob {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }

        .header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(5,4,15,0.85);
          backdrop-filter: blur(20px);
          padding: 16px 20px 12px;
          border-bottom: 1px solid rgba(0,245,212,0.1);
        }

        .logo {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 26px;
          letter-spacing: -1px;
          background: linear-gradient(135deg, #00f5d4, #7209b7, #f72585);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
        }

        .logo-sub {
          font-size: 11px;
          color: rgba(232,230,240,0.4);
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-top: 2px;
        }

        .live-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(247,37,133,0.15);
          border: 1px solid rgba(247,37,133,0.3);
          border-radius: 20px;
          padding: 3px 10px;
          font-size: 11px;
          color: #f72585;
          font-weight: 500;
        }

        .live-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #f72585;
          animation: blink 1.2s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }

        .tab-bar {
          display: flex;
          gap: 4px;
          padding: 12px 16px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .tab-bar::-webkit-scrollbar { display: none; }

        .tab {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: rgba(232,230,240,0.5);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }

        .tab.active {
          background: rgba(0,245,212,0.12);
          border-color: rgba(0,245,212,0.4);
          color: #00f5d4;
        }

        .content {
          padding: 8px 16px 100px;
          position: relative;
          z-index: 1;
        }

        .section-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 18px;
          margin-bottom: 4px;
          color: #fff;
        }

        .section-sub {
          font-size: 12px;
          color: rgba(232,230,240,0.4);
          margin-bottom: 16px;
        }

        .trend-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 14px 16px;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }

        .trend-card::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          background: linear-gradient(180deg, #00f5d4, #7209b7);
          border-radius: 3px 0 0 3px;
        }

        .trend-card:hover {
          border-color: rgba(0,245,212,0.2);
          background: rgba(0,245,212,0.05);
          transform: translateX(3px);
        }

        .trend-icon { font-size: 24px; }

        .trend-info { flex: 1; }

        .trend-tag {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 15px;
          color: #fff;
        }

        .trend-cat {
          font-size: 11px;
          color: rgba(232,230,240,0.4);
          margin-top: 2px;
        }

        .trend-right { text-align: right; }

        .trend-score {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: #00f5d4;
          line-height: 1;
        }

        .trend-delta {
          font-size: 11px;
          color: #f72585;
          font-weight: 600;
          margin-top: 2px;
        }

        .trend-peak {
          font-size: 10px;
          color: rgba(232,230,240,0.3);
          margin-top: 3px;
        }

        .wave-bar {
          height: 4px;
          background: rgba(255,255,255,0.06);
          border-radius: 4px;
          margin-top: 8px;
          overflow: hidden;
        }

        .wave-fill {
          height: 100%;
          background: linear-gradient(90deg, #00f5d4, #7209b7);
          border-radius: 4px;
          transition: width 1s ease;
        }

        .sound-card {
          background: rgba(114,9,183,0.1);
          border: 1px solid rgba(114,9,183,0.25);
          border-radius: 14px;
          padding: 12px 14px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sound-icon {
          width: 40px; height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #7209b7, #f72585);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .sound-info { flex: 1; min-width: 0; }

        .sound-name {
          font-size: 13px;
          font-weight: 500;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sound-stats {
          font-size: 11px;
          color: rgba(232,230,240,0.4);
          margin-top: 3px;
        }

        .sound-hot {
          background: linear-gradient(135deg, #f72585, #f9c74f);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-size: 12px;
          font-weight: 700;
        }

        .early-card {
          background: rgba(249,199,79,0.06);
          border: 1px solid rgba(249,199,79,0.15);
          border-radius: 16px;
          padding: 14px 16px;
          margin-bottom: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .early-card:hover {
          border-color: rgba(249,199,79,0.3);
          background: rgba(249,199,79,0.1);
        }

        .early-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .early-title {
          font-size: 14px;
          font-weight: 500;
          color: #fff;
          flex: 1;
          margin-right: 10px;
          line-height: 1.4;
        }

        .early-trend {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: #f9c74f;
          white-space: nowrap;
        }

        .early-footer {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .early-views {
          font-size: 12px;
          color: rgba(232,230,240,0.4);
        }

        .niche-pill {
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 600;
          background: rgba(0,245,212,0.1);
          border: 1px solid rgba(0,245,212,0.2);
          color: #00f5d4;
        }

        .catch-btn {
          margin-left: auto;
          padding: 5px 12px;
          border-radius: 20px;
          background: rgba(249,199,79,0.12);
          border: 1px solid rgba(249,199,79,0.3);
          color: #f9c74f;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
        }

        .score-input-area {
          background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(0,245,212,0.2);
          border-radius: 16px;
          padding: 14px 16px;
          margin-bottom: 12px;
        }

        .score-label {
          font-size: 12px;
          color: rgba(232,230,240,0.4);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .score-textarea {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          resize: none;
          min-height: 60px;
          line-height: 1.5;
        }

        .score-textarea::placeholder {
          color: rgba(232,230,240,0.2);
        }

        .analyze-btn {
          width: 100%;
          padding: 14px;
          border-radius: 14px;
          background: linear-gradient(135deg, #00f5d4, #7209b7);
          border: none;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          letter-spacing: 0.5px;
          transition: opacity 0.2s, transform 0.1s;
        }

        .analyze-btn:active { transform: scale(0.98); }
        .analyze-btn:disabled { opacity: 0.5; cursor: default; }

        .result-card {
          background: rgba(0,245,212,0.06);
          border: 1px solid rgba(0,245,212,0.2);
          border-radius: 20px;
          padding: 20px;
          margin-top: 16px;
          animation: fadeUp 0.4s ease;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .result-score-big {
          font-family: 'Syne', sans-serif;
          font-size: 56px;
          font-weight: 800;
          background: linear-gradient(135deg, #00f5d4, #f72585);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1;
          text-align: center;
          margin-bottom: 4px;
        }

        .result-verdict {
          text-align: center;
          font-size: 16px;
          font-weight: 500;
          color: #fff;
          margin-bottom: 20px;
        }

        .factor-row {
          margin-bottom: 10px;
        }

        .factor-label-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-bottom: 4px;
          color: rgba(232,230,240,0.6);
        }

        .factor-bar {
          height: 6px;
          background: rgba(255,255,255,0.06);
          border-radius: 6px;
          overflow: hidden;
        }

        .factor-fill {
          height: 100%;
          border-radius: 6px;
          transition: width 1.2s ease;
        }

        .result-tip {
          margin-top: 14px;
          padding: 12px 14px;
          background: rgba(247,37,133,0.08);
          border: 1px solid rgba(247,37,133,0.15);
          border-radius: 12px;
          font-size: 12px;
          color: rgba(232,230,240,0.7);
          line-height: 1.5;
        }

        .plan-card {
          border-radius: 18px;
          padding: 20px;
          margin-bottom: 12px;
        }

        .plan-free {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .plan-pro {
          background: linear-gradient(135deg, rgba(0,245,212,0.12), rgba(114,9,183,0.12));
          border: 1px solid rgba(0,245,212,0.3);
          position: relative;
          overflow: hidden;
        }

        .plan-pro::after {
          content: 'POPULAIRE';
          position: absolute;
          top: 16px; right: -28px;
          background: linear-gradient(135deg, #00f5d4, #7209b7);
          color: #fff;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.5px;
          padding: 4px 36px;
          transform: rotate(45deg);
        }

        .plan-name {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 4px;
        }

        .plan-price {
          font-family: 'Syne', sans-serif;
          font-size: 32px;
          font-weight: 800;
          color: #00f5d4;
          line-height: 1;
          margin-bottom: 4px;
        }

        .plan-price span {
          font-size: 14px;
          color: rgba(232,230,240,0.4);
          font-weight: 400;
        }

        .plan-features {
          margin-top: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .plan-feature {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: rgba(232,230,240,0.7);
        }

        .feat-icon { width: 18px; height: 18px; text-align: center; flex-shrink: 0; }

        .subscribe-btn {
          width: 100%;
          margin-top: 18px;
          padding: 13px;
          border-radius: 12px;
          background: linear-gradient(135deg, #00f5d4, #7209b7);
          border: none;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .subscribe-btn:hover { opacity: 0.9; }

        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 50%; transform: translateX(-50%);
          width: 420px;
          background: rgba(5,4,15,0.95);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex;
          padding: 10px 0 20px;
          z-index: 100;
        }

        .nav-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          padding: 4px;
          transition: all 0.2s;
        }

        .nav-icon { font-size: 20px; }

        .nav-label {
          font-size: 10px;
          color: rgba(232,230,240,0.35);
          font-weight: 500;
        }

        .nav-item.active .nav-label { color: #00f5d4; }
        .nav-item.active .nav-icon { filter: drop-shadow(0 0 6px #00f5d4); }

        .onboarding {
          position: fixed;
          inset: 0;
          background: rgba(5,4,15,0.96);
          z-index: 200;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 24px;
          text-align: center;
          backdrop-filter: blur(10px);
          animation: fadeIn 0.4s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .onb-wave { font-size: 64px; margin-bottom: 24px; animation: bounce 2s infinite; }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }

        .onb-title {
          font-family: 'Syne', sans-serif;
          font-size: 40px;
          font-weight: 800;
          background: linear-gradient(135deg, #00f5d4, #7209b7, #f72585);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1.1;
          margin-bottom: 12px;
        }

        .onb-tagline {
          font-size: 16px;
          color: rgba(232,230,240,0.6);
          line-height: 1.6;
          margin-bottom: 36px;
          max-width: 300px;
        }

        .onb-features {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          max-width: 320px;
          margin-bottom: 32px;
        }

        .onb-feat {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 12px 14px;
          text-align: left;
        }

        .onb-feat-icon { font-size: 22px; }

        .onb-feat-text { font-size: 13px; color: rgba(232,230,240,0.7); line-height: 1.4; }
        .onb-feat-text strong { color: #fff; }

        .start-btn {
          width: 100%;
          max-width: 320px;
          padding: 16px;
          border-radius: 14px;
          background: linear-gradient(135deg, #00f5d4, #7209b7);
          border: none;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          transition: transform 0.1s;
          letter-spacing: 0.5px;
        }

        .start-btn:active { transform: scale(0.97); }

        .loading-dots {
          display: flex;
          gap: 6px;
          justify-content: center;
          margin: 20px 0;
        }

        .dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #00f5d4;
          animation: dotBounce 1.2s infinite;
        }

        .dot:nth-child(2) { animation-delay: 0.2s; background: #7209b7; }
        .dot:nth-child(3) { animation-delay: 0.4s; background: #f72585; }

        @keyframes dotBounce {
          0%, 100% { transform: scale(0.6); opacity: 0.4; }
          50% { transform: scale(1); opacity: 1; }
        }

        .divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 20px 0;
        }

        .world-map-preview {
          background: rgba(0,245,212,0.04);
          border: 1px solid rgba(0,245,212,0.1);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 16px;
          text-align: center;
          font-size: 40px;
          letter-spacing: 4px;
          line-height: 1.5;
        }

        .map-label {
          font-size: 11px;
          color: rgba(232,230,240,0.3);
          text-align: center;
          margin-top: 8px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }

        .badge-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }

        .badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .badge-teal {
          background: rgba(0,245,212,0.12);
          border: 1px solid rgba(0,245,212,0.25);
          color: #00f5d4;
        }

        .badge-pink {
          background: rgba(247,37,133,0.12);
          border: 1px solid rgba(247,37,133,0.25);
          color: #f72585;
        }

        .badge-yellow {
          background: rgba(249,199,79,0.12);
          border: 1px solid rgba(249,199,79,0.25);
          color: #f9c74f;
        }
      `}</style>

      <div className="app">
        <div className="bg-grid" />
        <div className="glow-blob" style={{ width: 300, height: 300, top: -100, left: -80, background: "rgba(0,245,212,0.08)" }} />
        <div className="glow-blob" style={{ width: 250, height: 250, top: 300, right: -100, background: "rgba(114,9,183,0.1)" }} />

        {/* ONBOARDING */}
        {showOnboarding && (
          <div className="onboarding">
            <div className="onb-wave">🌊</div>
            <div className="onb-title">WAVELY</div>
            <div className="onb-tagline">Prédit les tendances TikTok avant qu'elles explosent. Pour les créateurs. Pour les viewers.</div>
            <div className="onb-features">
              <div className="onb-feat">
                <span className="onb-feat-icon">📡</span>
                <div className="onb-feat-text"><strong>Trend Radar</strong> — Vois les hashtags & sons 24–72h avant qu'ils deviennent viraux</div>
              </div>
              <div className="onb-feat">
                <span className="onb-feat-icon">🔍</span>
                <div className="onb-feat-text"><strong>Early Detector</strong> — Découvre les vidéos qui explosent maintenant, avant 100K vues</div>
              </div>
              <div className="onb-feat">
                <span className="onb-feat-icon">⚡</span>
                <div className="onb-feat-text"><strong>Viral Score</strong> — Analyse ton idée de vidéo et prédit son potentiel viral</div>
              </div>
            </div>
            <button className="start-btn" onClick={() => setShowOnboarding(false)}>
              Attraper la vague →
            </button>
          </div>
        )}

        {/* HEADER */}
        <div className="header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div className="logo">WAVELY</div>
              <div className="logo-sub">Predict · Create · Dominate</div>
            </div>
            <div className="live-badge">
              <div className="live-dot" />
              Live AI
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="tab-bar">
          {tabs.map(t => (
            <button key={t.id} className={`tab ${activeTab === t.id ? "active" : ""}`} onClick={() => setActiveTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="content">

          {/* FORECAST TAB */}
          {activeTab === "forecast" && (
            <>
              <div className="section-title">🔥 Tendances à venir</div>
              <div className="section-sub">Prédictions IA — mise à jour toutes les 30 min</div>

              <div className="badge-row">
                <span className="badge badge-teal">France 🇫🇷</span>
                <span className="badge badge-pink">Monde 🌍</span>
                <span className="badge badge-yellow">Mon Niche</span>
              </div>

              {trends.map((t, i) => (
                <div key={i} className="trend-card">
                  <div className="trend-icon">{t.icon}</div>
                  <div className="trend-info">
                    <div className="trend-tag">{t.tag}</div>
                    <div className="trend-cat">{t.category} • Pic dans {t.peak}</div>
                    <div className="wave-bar">
                      <div className="wave-fill" style={{ width: `${t.score}%` }} />
                    </div>
                  </div>
                  <div className="trend-right">
                    <div className="trend-score">{t.score}</div>
                    <div className="trend-delta">{t.delta}</div>
                    <div className="trend-peak">Wave Score</div>
                  </div>
                </div>
              ))}

              <div className="divider" />

              <div className="section-title">🎵 Sons en montée</div>
              <div className="section-sub">À utiliser maintenant pour surfer la vague</div>

              {sounds.map((s, i) => (
                <div key={i} className="sound-card">
                  <div className="sound-icon">🎵</div>
                  <div className="sound-info">
                    <div className="sound-name">{s.name}</div>
                    <div className="sound-stats">{s.plays} utilisations · <span style={{ color: "#f72585" }}>{s.rise}</span></div>
                  </div>
                  {s.hot && <div className="sound-hot">🔥 HOT</div>}
                </div>
              ))}
            </>
          )}

          {/* EARLY DETECTOR */}
          {activeTab === "early" && (
            <>
              <div className="section-title">🔍 Early Detector</div>
              <div className="section-sub">Vidéos qui explosent maintenant — avant 50K vues</div>

              <div className="world-map-preview">
                🇫🇷 🇬🇧 🇺🇸 🇩🇪 🇧🇷 🇯🇵
                <br />
                🇮🇳 🇲🇽 🇰🇷 🇦🇺 🇸🇦 🇳🇬
              </div>
              <div className="map-label">Signaux détectés dans 48 marchés</div>

              <div className="divider" />

              {earlyVideos.map((v, i) => (
                <div key={i} className="early-card">
                  <div className="early-header">
                    <div className="early-title">{v.title}</div>
                    <div className="early-trend">{v.trend}</div>
                  </div>
                  <div className="early-footer">
                    <div className="early-views">👁 {v.views}</div>
                    <div className="niche-pill">{v.niche}</div>
                    <button className="catch-btn">Surfer →</button>
                  </div>
                </div>
              ))}

              <div style={{ background: "rgba(247,37,133,0.08)", border: "1px solid rgba(247,37,133,0.15)", borderRadius: 14, padding: 14, marginTop: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#f72585", marginBottom: 6 }}>💡 Alerte personnalisée</div>
                <div style={{ fontSize: 12, color: "rgba(232,230,240,0.6)", lineHeight: 1.5 }}>
                  Active les notifications Wavely pour recevoir une alerte en temps réel quand un contenu dans ta niche décolle.
                </div>
              </div>
            </>
          )}

          {/* VIRAL SCORE */}
          {activeTab === "score" && (
            <>
              <div className="section-title">⚡ Viral Score</div>
              <div className="section-sub">Décris ton idée de vidéo — l'IA prédit son potentiel</div>

              <div className="score-input-area">
                <div className="score-label">Ton idée de vidéo</div>
                <textarea
                  className="score-textarea"
                  placeholder="Ex: Je filme ma routine matinale silencieuse avec un son lo-fi, en POV, durée 30s..."
                  value={viralInput}
                  onChange={e => setViralInput(e.target.value)}
                  rows={3}
                />
              </div>

              <button
                className="analyze-btn"
                onClick={analyzeViral}
                disabled={analyzing || !viralInput.trim()}
              >
                {analyzing ? "Analyse en cours..." : "⚡ Analyser le potentiel viral"}
              </button>

              {analyzing && (
                <div className="loading-dots">
                  <div className="dot" />
                  <div className="dot" />
                  <div className="dot" />
                </div>
              )}

              {viralResult && (
                <div className="result-card">
                  <div className="result-score-big">{viralResult.score}</div>
                  <div className="result-verdict">{viralResult.verdict}</div>

                  {viralResult.factors.map((f, i) => (
                    <div key={i} className="factor-row">
                      <div className="factor-label-row">
                        <span>{f.label}</span>
                        <span style={{ color: "#fff", fontWeight: 600 }}>{f.score}/100</span>
                      </div>
                      <div className="factor-bar">
                        <div className="factor-fill" style={{ width: `${f.score}%`, background: f.color }} />
                      </div>
                    </div>
                  ))}

                  <div className="result-tip">
                    🎯 <strong>Meilleur moment pour poster :</strong> {viralResult.bestTime}<br />
                    🎵 <strong>Son recommandé :</strong> {viralResult.suggestedSound}
                  </div>
                </div>
              )}
            </>
          )}

          {/* PLAN */}
          {activeTab === "pro" && (
            <>
              <div className="section-title">🎯 Mon Abonnement</div>
              <div className="section-sub">Choisis ton plan</div>

              <div className="plan-card plan-free">
                <div className="plan-name">Gratuit</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "rgba(232,230,240,0.4)", marginBottom: 4 }}>0 €</div>
                <div className="plan-features">
                  {["✅ 3 tendances / jour", "✅ Early Detector limité", "❌ Viral Score", "❌ Alertes temps réel", "❌ Sons tendance"].map((f, i) => (
                    <div key={i} className="plan-feature" style={{ color: f.startsWith("❌") ? "rgba(232,230,240,0.25)" : "rgba(232,230,240,0.7)" }}>{f}</div>
                  ))}
                </div>
              </div>

              <div className="plan-card plan-pro">
                <div className="plan-name">Wavely Pro</div>
                <div className="plan-price">1,99 € <span>/ mois</span></div>
                <div style={{ fontSize: 12, color: "rgba(0,245,212,0.7)", marginTop: 4 }}>≈ un café par mois · Annulable en 1 clic</div>
                <div className="plan-features">
                  {[
                    "🌊 Trend Radar illimité (24–72h avant)",
                    "🔍 Early Detector temps réel",
                    "⚡ Viral Score illimité",
                    "🔔 Alertes niche personnalisées",
                    "🎵 Top sons à utiliser maintenant",
                    "🗓 Calendrier de publication optimal",
                    "🌍 Données 48 marchés",
                    "🔄 Mises à jour auto incluses",
                  ].map((f, i) => (
                    <div key={i} className="plan-feature">{f}</div>
                  ))}
                </div>
                <button className="subscribe-btn">S'abonner pour 1,99 €/mois →</button>
              </div>

              <div style={{ textAlign: "center", fontSize: 11, color: "rgba(232,230,240,0.25)", lineHeight: 1.6, marginTop: 8 }}>
                Aucun stockage · Aucun frais caché · App légère<br />
                Mises à jour automatiques incluses · Résiliable à tout moment
              </div>
            </>
          )}

        </div>

        {/* BOTTOM NAV */}
        <div className="bottom-nav">
          {tabs.map(t => (
            <div key={t.id} className={`nav-item ${activeTab === t.id ? "active" : ""}`} onClick={() => setActiveTab(t.id)}>
              <span className="nav-icon">{t.icon}</span>
              <span className="nav-label">{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
