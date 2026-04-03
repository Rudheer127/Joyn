"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { MOCK_MATCHES, type MatchCandidate, connectionLabel } from "@/lib/ai/matching";
import { Avatar } from "@/components/shared/Avatar";
import { Loader2 } from "lucide-react";

type Step = "situation" | "companion-type" | "filters" | "results";

const COMPANION_TYPES = [
  { value: "talk",    label: "A friend to talk to",         emoji: "💬" },
  { value: "walking", label: "A walking or activity buddy", emoji: "🚶" },
  { value: "coffee",  label: "Coffee or lunch meet-ups",    emoji: "☕" },
  { value: "phone",   label: "Weekly phone calls",          emoji: "📞" },
  { value: "group",   label: "Group outings and events",    emoji: "🎉" },
  { value: "errands", label: "Company for errands or trips",emoji: "🛒" },
  { value: "other",   label: "Something else…",             emoji: "✏️" },
];

const GENDER_PREFS = [
  { v: "any",    label: "No preference" },
  { v: "female", label: "Women" },
  { v: "male",   label: "Men" },
];

// Friendlier frequency labels
const FREQ_PREFS = [
  { v: "everyday",  label: "Chat every day 💬",         desc: "Quick texts or messages each day" },
  { v: "weekly",    label: "Catch up a few times a week", desc: "A call or message a couple of times a week" },
  { v: "biweekly",  label: "Get together every so often",  desc: "A meet-up or call every week or two" },
  { v: "any",       label: "Whatever feels natural",      desc: "No pressure — however often works for both" },
];

const DISTANCE_OPTS = [
  { v: "close", label: "Nearby (under 30 min)" },
  { v: "any",   label: "Any distance — phone & video are fine" },
];

// ── Small reusable pill ───────────────────────────────────────────────────────
function Pill({ label, emoji, selected, onClick }: {
  label: string; emoji?: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: "0.6rem 1.25rem", borderRadius: "3rem", fontSize: "1rem",
      fontWeight: selected ? 700 : 500,
      border: `2px solid ${selected ? "#173124" : "#C2C8C2"}`,
      backgroundColor: selected ? "#173124" : "#FFFFFF",
      color: selected ? "#FFFFFF" : "#173124",
      cursor: "pointer", transition: "all 0.15s",
      display: "flex", alignItems: "center", gap: "0.4rem", minHeight: "44px",
    }}>
      {emoji && <span>{emoji}</span>}{label}
    </button>
  );
}

function StepCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "#FFFFFF", border: "2px solid #E7E2D7", borderRadius: "1.5rem", padding: "2rem", marginBottom: "1.25rem" }}>
      <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#735C00", marginBottom: "0.375rem" }}>{title}</p>
      {subtitle && <p style={{ fontSize: "0.95rem", color: "#727973", marginBottom: "1.25rem" }}>{subtitle}</p>}
      {children}
    </div>
  );
}

const STEPS: Step[] = ["situation", "companion-type", "filters", "results"];
const STEP_LABELS = ["Your story", "What you need", "Fine-tune", "Results"];

function ProgressDots({ current }: { current: Step }) {
  const idx = STEPS.indexOf(current);
  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1.75rem" }}>
      {STEP_LABELS.map((label, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <div style={{
            width: i === idx ? "32px" : "10px", height: "10px", borderRadius: "10px",
            backgroundColor: i <= idx ? "#173124" : "#C2C8C2", transition: "all 0.3s",
          }} />
          {i === idx && <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#173124" }}>{label}</span>}
        </div>
      ))}
    </div>
  );
}

// ── Age range slider ──────────────────────────────────────────────────────────
function AgeRangeSlider({ min, max, onChange }: { min: number; max: number; onChange: (min: number, max: number) => void }) {
  return (
    <div>
      <style>{`
        input[type=range].joyn-slider {
          -webkit-appearance: none; appearance: none;
          width: 100%; height: 6px;
          border-radius: 3px; background: #C2C8C2;
          outline: none; cursor: pointer;
        }
        input[type=range].joyn-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 26px; height: 26px; border-radius: 50%;
          background: #173124; cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          border: 3px solid #FFFFFF;
        }
        input[type=range].joyn-slider::-moz-range-thumb {
          width: 26px; height: 26px; border-radius: 50%;
          background: #173124; cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          border: 3px solid #FFFFFF;
        }
      `}</style>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "#173124" }}>{min} yrs</span>
        <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "#173124" }}>{max} yrs</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div>
          <label style={{ fontSize: "0.85rem", color: "#727973", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Minimum age</label>
          <input type="range" className="joyn-slider" min={10} max={109} value={min}
            onChange={e => onChange(Math.min(Number(e.target.value), max - 1), max)}
          />
        </div>
        <div>
          <label style={{ fontSize: "0.85rem", color: "#727973", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Maximum age</label>
          <input type="range" className="joyn-slider" min={11} max={110} value={max}
            onChange={e => onChange(min, Math.max(Number(e.target.value), min + 1))}
          />
        </div>
      </div>
      <p style={{ fontSize: "0.9rem", color: "#4A5C50", marginTop: "0.875rem", fontWeight: 600 }}>
        Showing companions aged <strong style={{ color: "#173124" }}>{min}–{max}</strong>
      </p>
    </div>
  );
}

// ── Expanded whyFit dialog ────────────────────────────────────────────────────
function WhyFitDialog({ match, onClose }: { match: MatchCandidate; onClose: () => void }) {
  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: "1rem"
    }} onClick={onClose}>
      <div style={{
        backgroundColor: "#FFFFFF", borderRadius: "1.5rem",
        padding: "2rem", maxWidth: "480px", width: "100%",
        boxShadow: "0 24px 48px rgba(0,0,0,0.2)"
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
          <Avatar gender={match.gender} name={match.name} size={56} />
          <div>
            <p style={{ fontFamily: "var(--font-epilogue), serif", fontWeight: 700, fontSize: "1.25rem", color: "#173124" }}>
              {match.name}, {match.age}
            </p>
            <p style={{ fontSize: "0.85rem", color: "#727973" }}>📍 {match.distanceLabel}</p>
          </div>
        </div>
        <div style={{ backgroundColor: "#F8F3E8", borderRadius: "1rem", padding: "1.25rem", marginBottom: "1.25rem" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#735C00", marginBottom: "0.5rem" }}>
            🌻 Why you'd be a great match
          </p>
          <p style={{ fontSize: "1rem", color: "#173124", lineHeight: 1.65 }}>{match.whyFit}</p>
        </div>
        <p style={{ fontSize: "0.95rem", color: "#4A5C50", fontStyle: "italic", marginBottom: "1.5rem" }}>{match.bio}</p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link href={`/messages/${match.id}`} style={{
            backgroundColor: "#173124", color: "#FFFFFF", fontWeight: 700, padding: "0.75rem 1.5rem",
            borderRadius: "3rem", fontSize: "1rem", textDecoration: "none", flex: 1, textAlign: "center"
          }}>Say Hello →</Link>
          <button onClick={onClose} style={{
            backgroundColor: "transparent", border: "2px solid #C2C8C2", color: "#173124",
            borderRadius: "3rem", padding: "0.75rem 1.5rem", fontSize: "1rem", fontWeight: 600, cursor: "pointer"
          }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FindCompanionPage() {
  const [step, setStep] = useState<Step>("situation");
  const [situation, setSituation] = useState("");
  const [customType, setCustomType] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [genderPref, setGenderPref] = useState("any");
  const [freqPref, setFreqPref] = useState("any");
  const [distPref, setDistPref] = useState("any");
  const [ageMin, setAgeMin] = useState(60);
  const [ageMax, setAgeMax] = useState(85);
  const [loading, setLoading] = useState(false);
  // Results filters
  const [filterGender, setFilterGender] = useState("any");
  const [filterActivity, setFilterActivity] = useState("any");
  const [sortBy, setSortBy] = useState<"match" | "age">("match");
  const [dialogMatch, setDialogMatch] = useState<MatchCandidate | null>(null);

  function toggleType(v: string) {
    setTypes(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  }

  const results = useMemo(() => {
    let list = [...MOCK_MATCHES];
    // Age range filter
    list = list.filter(m => m.age >= ageMin && m.age <= ageMax);
    // Gender from wizard step
    if (genderPref !== "any") list = list.filter(m => m.gender === genderPref);
    // Distance
    if (distPref === "close") list = list.filter(m => !m.distanceLabel?.includes("hour") && !m.distanceLabel?.includes("~"));
    // Results toolbar filters
    if (filterGender !== "any") list = list.filter(m => m.gender === filterGender);
    if (filterActivity !== "any") {
      const map: Record<string, string> = { gentle: "Gentle", moderate: "Moderate", active: "Active" };
      list = list.filter(m => m.fitness === map[filterActivity]);
    }
    // Sort
    if (sortBy === "age") list = list.sort((a, b) => a.age - b.age);
    else list = list.sort((a, b) => b.matchPct - a.matchPct);
    return list;
  }, [ageMin, ageMax, genderPref, distPref, filterGender, filterActivity, sortBy]);

  function goToResults() {
    setLoading(true);
    setStep("results");
    setTimeout(() => setLoading(false), 1200);
  }

  const stepLabel = step === "situation" ? "Step 1 of 3"
    : step === "companion-type" ? "Step 2 of 3"
    : step === "filters" ? "Step 3 of 3"
    : `${results.length} ${results.length === 1 ? "companion" : "companions"} found`;

  const stepTitle = step === "situation" ? "What brings you to Joyn? 🌻"
    : step === "companion-type" ? "What kind of connection are you looking for? 🤝"
    : step === "filters" ? "Let's fine-tune your search 🎯"
    : "Here are your matches";

  const stepSub = step === "situation" ? "Share as much or as little as you like. This helps us find the right person."
    : step === "companion-type" ? "Based on what you shared, pick everything that resonates — you can choose more than one."
    : step === "filters" ? "All optional. The more you narrow it, the more specific your matches will be."
    : "";

  // Toolbar filter pills (small)
  const ToolPill = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button onClick={onClick} style={{
      padding: "0.3rem 0.875rem", borderRadius: "3rem", fontSize: "0.82rem", fontWeight: 600,
      border: `2px solid ${active ? "#173124" : "#C2C8C2"}`,
      backgroundColor: active ? "#173124" : "transparent",
      color: active ? "#FFFFFF" : "#173124", cursor: "pointer", whiteSpace: "nowrap" as const,
    }}>{label}</button>
  );

  return (
    <div style={{ fontFamily: "var(--font-lexend), sans-serif", color: "#173124", minHeight: "100vh", backgroundColor: "#F8F3E8" }}>

      {/* Header */}
      <div style={{ backgroundColor: "#FEF9ED", padding: "2rem 2.5rem 1.5rem", borderBottom: "2px solid #E7E2D7" }}>
        <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#727973", marginBottom: "0.375rem" }}>
          {stepLabel}
        </p>
        <h1 style={{ fontFamily: "var(--font-epilogue), serif", fontWeight: 800, fontSize: "2.1rem", color: "#173124", letterSpacing: "-0.03em", margin: 0 }}>
          {stepTitle}
        </h1>
        {stepSub && <p style={{ fontSize: "0.95rem", color: "#727973", marginTop: "0.375rem" }}>{stepSub}</p>}
      </div>

      <div style={{
        padding: "2rem 2.5rem",
        maxWidth: step === "results" ? "none" : "960px",
        margin: "0 auto",
      }}>
        {step !== "results" && <ProgressDots current={step} />}

        {/* ── Step 1: Situation ─────────────────────────────────────────── */}
        {step === "situation" && (
          <>
            <StepCard title="Tell us about yourself" subtitle="What's been on your mind? How are you feeling lately? There are no wrong answers.">
              <textarea
                value={situation}
                onChange={e => setSituation(e.target.value)}
                placeholder="e.g. I recently retired and moved to Phoenix. I miss having people to talk to. I'd love someone to grab coffee with or go for walks with in the morning…"
                rows={5}
                style={{
                  width: "100%", boxSizing: "border-box",
                  border: "2px solid #C2C8C2", borderRadius: "1rem",
                  padding: "1rem 1.25rem", fontSize: "1.05rem",
                  fontFamily: "var(--font-lexend), sans-serif",
                  color: "#173124", backgroundColor: "#FAFAFA",
                  resize: "vertical", lineHeight: 1.6, outline: "none",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = "#173124"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#C2C8C2"; }}
              />
              <p style={{ fontSize: "0.85rem", color: "#727973", marginTop: "0.75rem" }}>
                💛 You can also skip this — we'll still find great matches for you.
              </p>
            </StepCard>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button onClick={() => setStep("companion-type")} style={{
                flex: 1, backgroundColor: "#173124", color: "#FFFFFF",
                fontWeight: 700, fontSize: "1.1rem", padding: "1rem",
                borderRadius: "3rem", border: "none", cursor: "pointer",
              }}>Continue →</button>
              <button onClick={() => setStep("companion-type")} style={{
                backgroundColor: "transparent", border: "2px solid #C2C8C2",
                color: "#727973", borderRadius: "3rem", padding: "1rem 1.5rem",
                fontSize: "0.95rem", fontWeight: 600, cursor: "pointer",
              }}>Skip</button>
            </div>
          </>
        )}

        {/* ── Step 2: Companion type ────────────────────────────────────── */}
        {step === "companion-type" && (
          <>
            <StepCard title="Pick everything that feels right" subtitle="You can choose more than one — this is about what you'd enjoy, not a commitment.">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
                {COMPANION_TYPES.map(o => (
                  <Pill key={o.value} label={o.label} emoji={o.emoji}
                    selected={types.includes(o.value)} onClick={() => toggleType(o.value)} />
                ))}
              </div>
              {types.includes("other") && (
                <input
                  value={customType}
                  onChange={e => setCustomType(e.target.value)}
                  placeholder="Describe what you're looking for…"
                  style={{
                    marginTop: "1rem", width: "100%", boxSizing: "border-box",
                    border: "2px solid #173124", borderRadius: "0.875rem",
                    padding: "0.75rem 1rem", fontSize: "1rem",
                    fontFamily: "var(--font-lexend), sans-serif", color: "#173124",
                    backgroundColor: "#FAFAFA", outline: "none",
                  }}
                />
              )}
            </StepCard>

            <StepCard title="Age range" subtitle="Slide to set the age range you'd feel most comfortable with.">
              <AgeRangeSlider min={ageMin} max={ageMax}
                onChange={(min, max) => { setAgeMin(min); setAgeMax(max); }} />
            </StepCard>

            <div style={{ display: "flex", gap: "1rem" }}>
              <button onClick={() => setStep("situation")} style={{
                backgroundColor: "transparent", border: "2px solid #C2C8C2",
                color: "#173124", borderRadius: "3rem", padding: "1rem 1.5rem",
                fontSize: "0.95rem", fontWeight: 600, cursor: "pointer",
              }}>← Back</button>
              <button onClick={() => setStep("filters")} style={{
                flex: 1, backgroundColor: "#173124", color: "#FFFFFF",
                fontWeight: 700, fontSize: "1.1rem", padding: "1rem",
                borderRadius: "3rem", border: "none", cursor: "pointer",
              }}>Continue →</button>
            </div>
          </>
        )}

        {/* ── Step 3: Fine-tune filters ─────────────────────────────────── */}
        {step === "filters" && (
          <>
            {/* Gender + Frequency side-by-side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
              {/* Gender */}
              <div style={{ backgroundColor: "#FFFFFF", border: "2px solid #E7E2D7", borderRadius: "1.5rem", padding: "2rem" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#735C00", marginBottom: "1rem" }}>Gender preference</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {GENDER_PREFS.map(o => (
                    <button key={o.v} onClick={() => setGenderPref(o.v)} style={{
                      padding: "0.75rem 1.25rem", borderRadius: "3rem", fontSize: "1rem",
                      fontWeight: genderPref === o.v ? 700 : 500,
                      border: `2px solid ${genderPref === o.v ? "#173124" : "#C2C8C2"}`,
                      backgroundColor: genderPref === o.v ? "#173124" : "#FFFFFF",
                      color: genderPref === o.v ? "#FFFFFF" : "#173124",
                      cursor: "pointer", transition: "all 0.15s", textAlign: "left",
                    }}>{o.label}</button>
                  ))}
                </div>
              </div>

              {/* Frequency */}
              <div style={{ backgroundColor: "#FFFFFF", border: "2px solid #E7E2D7", borderRadius: "1.5rem", padding: "2rem" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#735C00", marginBottom: "0.375rem" }}>How often to connect?</p>
                <p style={{ fontSize: "0.85rem", color: "#727973", marginBottom: "1rem" }}>Your ideal rhythm — not a schedule</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {FREQ_PREFS.map(o => (
                    <button key={o.v} onClick={() => setFreqPref(o.v)} style={{
                      border: `2px solid ${freqPref === o.v ? "#173124" : "#C2C8C2"}`,
                      backgroundColor: freqPref === o.v ? "#F8F3E8" : "#FFFFFF",
                      borderRadius: "0.875rem", padding: "0.625rem 1rem",
                      textAlign: "left", cursor: "pointer", transition: "all 0.15s",
                    }}>
                      <p style={{ fontWeight: freqPref === o.v ? 700 : 600, fontSize: "0.9rem", color: "#173124", margin: 0 }}>{o.label}</p>
                      <p style={{ fontSize: "0.78rem", color: "#727973", margin: "0.15rem 0 0 0" }}>{o.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Distance full width */}
            <StepCard title="Distance">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
                {DISTANCE_OPTS.map(o => (
                  <Pill key={o.v} label={o.label} selected={distPref === o.v} onClick={() => setDistPref(o.v)} />
                ))}
              </div>
            </StepCard>

            <div style={{ display: "flex", gap: "1rem" }}>
              <button onClick={() => setStep("companion-type")} style={{
                backgroundColor: "transparent", border: "2px solid #C2C8C2",
                color: "#173124", borderRadius: "3rem", padding: "1rem 1.5rem",
                fontSize: "0.95rem", fontWeight: 600, cursor: "pointer",
              }}>← Back</button>
              <button onClick={goToResults} style={{
                flex: 1, backgroundColor: "#173124", color: "#FFFFFF",
                fontWeight: 700, fontSize: "1.1rem", padding: "1rem",
                borderRadius: "3rem", border: "none", cursor: "pointer",
              }}>Find My Companion 🤝</button>
            </div>
          </>
        )}

        {/* ── Step 4: Results ───────────────────────────────────────────── */}
        {step === "results" && (
          <>
            {/* Toolbar */}
            <div style={{
              backgroundColor: "#FFFFFF", border: "2px solid #E7E2D7", borderRadius: "1.25rem",
              padding: "1rem 1.5rem", marginBottom: "1.5rem",
              display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center",
            }}>
              <button onClick={() => setStep("situation")} style={{
                backgroundColor: "transparent", border: "2px solid #C2C8C2", color: "#173124",
                borderRadius: "3rem", padding: "0.4rem 1rem", fontSize: "0.875rem",
                fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
              }}>← New search</button>

              <div style={{ width: "1px", height: "24px", backgroundColor: "#E7E2D7" }} />
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#727973", textTransform: "uppercase", letterSpacing: "0.06em" }}>Gender</span>
              {[{ v: "any", l: "All" }, { v: "female", l: "Women" }, { v: "male", l: "Men" }].map(o => (
                <ToolPill key={o.v} label={o.l} active={filterGender === o.v} onClick={() => setFilterGender(o.v)} />
              ))}

              <div style={{ width: "1px", height: "24px", backgroundColor: "#E7E2D7" }} />
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#727973", textTransform: "uppercase", letterSpacing: "0.06em" }}>Activity</span>
              {[{ v: "any", l: "Any" }, { v: "gentle", l: "Gentle" }, { v: "moderate", l: "Moderate" }, { v: "active", l: "Active" }].map(o => (
                <ToolPill key={o.v} label={o.l} active={filterActivity === o.v} onClick={() => setFilterActivity(filterActivity === o.v && o.v !== "any" ? "any" : o.v)} />
              ))}

              <div style={{ width: "1px", height: "24px", backgroundColor: "#E7E2D7" }} />
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#727973", textTransform: "uppercase", letterSpacing: "0.06em" }}>Sort</span>
              {[{ v: "match", l: "Best match" }, { v: "age", l: "Age" }].map(o => (
                <ToolPill key={o.v} label={o.l} active={sortBy === o.v} onClick={() => setSortBy(o.v as "match" | "age")} />
              ))}
            </div>

            {/* Age range note */}
            <p style={{ fontSize: "0.85rem", color: "#727973", marginBottom: "1.25rem" }}>
              Showing companions aged <strong>{ageMin}–{ageMax}</strong>
              {genderPref !== "any" && ` · ${GENDER_PREFS.find(o => o.v === genderPref)?.label}`}
              {distPref === "close" && " · Nearby only"}
            </p>

            {/* Loading */}
            {loading ? (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: "1.5rem", padding: "4rem",
                backgroundColor: "#FFFFFF", borderRadius: "2rem", border: "2px solid #E7E2D7",
              }}>
                <Loader2 size={48} color="#173124" style={{ animation: "spin 1.2s linear infinite" }} />
                <p style={{ fontFamily: "var(--font-epilogue), serif", fontSize: "1.4rem", color: "#173124", textAlign: "center" }}>
                  Finding companions who match…
                </p>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "1.25rem",
              }}>
                {results.map(match => (
                  <div key={match.id} style={{
                    backgroundColor: "#FFFFFF", border: "2px solid #E7E2D7",
                    borderRadius: "1.5rem", padding: "1.25rem 1.5rem",
                    display: "flex", flexDirection: "column", gap: "0.875rem",
                  }}>
                    {/* Top row */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem" }}>
                      <Avatar gender={match.gender} name={match.name} size={52} />
                      <div style={{ flex: 1 }}>
                        <p style={{
                          fontFamily: "var(--font-epilogue), serif", fontWeight: 700,
                          fontSize: "1.15rem", color: "#173124", lineHeight: 1.1, margin: 0,
                        }}>{match.name}, {match.age}</p>
                        <p style={{ fontSize: "0.82rem", color: "#727973", margin: "0.2rem 0 0" }}>
                          📍 {match.distanceLabel ?? `${match.city}, AZ`}
                        </p>
                        {match.fitness && (
                          <p style={{ fontSize: "0.78rem", color: "#4A5C50", marginTop: "0.1rem" }}>
                            🏃 {match.fitness} activity level
                          </p>
                        )}
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{
                          fontFamily: "var(--font-epilogue), serif", fontWeight: 800,
                          fontSize: "1.5rem", color: "#173124", lineHeight: 1, margin: 0,
                        }}>{match.matchPct}%</p>
                        <p style={{ fontSize: "0.6rem", color: "#727973", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>match</p>
                      </div>
                    </div>

                    {/* Interest tags */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                      {match.interests.slice(0, 3).map(interest => (
                        <span key={interest} style={{
                          backgroundColor: "#E8F4EC", color: "#173124",
                          fontSize: "0.78rem", fontWeight: 600,
                          padding: "0.2rem 0.75rem", borderRadius: "3rem",
                          border: "1px solid #C2D9C8",
                        }}>{interest}</span>
                      ))}
                    </div>

                    {/* Why you'd fit — visible dialogue box */}
                    {match.whyFit && (
                      <div style={{
                        backgroundColor: "#F0FAF4", border: "1.5px solid #A8D5B5",
                        borderRadius: "0.875rem", padding: "0.75rem 1rem",
                      }}>
                        <p style={{ fontSize: "0.82rem", color: "#173124", lineHeight: 1.6, margin: 0 }}>
                          🌻 {match.whyFit.length > 100 ? match.whyFit.slice(0, 100) + "…" : match.whyFit}
                        </p>
                        {match.whyFit.length > 100 && (
                          <button onClick={() => setDialogMatch(match)} style={{
                            fontSize: "0.8rem", fontWeight: 600, color: "#2D7A5F",
                            background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: "0.25rem"
                          }}>Read more</button>
                        )}
                      </div>
                    )}

                    {/* Connection suggestion */}
                    {match.connectionSuggestion && (
                      <p style={{ fontSize: "0.8rem", color: "#735C00", fontWeight: 600, margin: 0 }}>
                        {connectionLabel(match.connectionSuggestion)}
                      </p>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto" }}>
                      <Link href={`/messages/${match.id}`} style={{
                        backgroundColor: "#173124", color: "#FFFFFF",
                        fontWeight: 600, padding: "0.5rem 1.1rem",
                        borderRadius: "3rem", fontSize: "0.9rem",
                        textDecoration: "none", minHeight: "38px",
                        lineHeight: "1.5", display: "inline-block",
                      }}>Say Hello →</Link>
                      <button onClick={() => setDialogMatch(match)} style={{
                        border: "2px solid #173124", color: "#173124",
                        backgroundColor: "transparent", fontWeight: 600,
                        padding: "0.5rem 1.1rem", borderRadius: "3rem",
                        fontSize: "0.9rem", cursor: "pointer",
                      }}>View Profile</button>
                    </div>
                  </div>
                ))}

                {results.length === 0 && (
                  <div style={{
                    gridColumn: "1 / -1", textAlign: "center", padding: "3rem",
                    backgroundColor: "#FFFFFF", borderRadius: "1.5rem", border: "2px solid #E7E2D7",
                  }}>
                    <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🔍</p>
                    <p style={{ fontWeight: 700, fontSize: "1.1rem", color: "#173124" }}>No matches with these filters</p>
                    <p style={{ color: "#727973", marginTop: "0.25rem" }}>Try widening the age range or removing a filter.</p>
                  </div>
                )}
              </div>
            )}
            <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
          </>
        )}
      </div>

      {/* WhyFit dialog */}
      {dialogMatch && <WhyFitDialog match={dialogMatch} onClose={() => setDialogMatch(null)} />}
    </div>
  );
}
