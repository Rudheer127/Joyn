"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { MOCK_MATCHES, type MatchCandidate, connectionLabel } from "@/lib/ai/matching";
import { Avatar } from "@/components/shared/Avatar";
import { Loader2 } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Step = "situation" | "companion-type" | "filters" | "results";

const COMPANION_TYPES = [
  { value: "talk",    label: "Someone to talk to",         emoji: "💬" },
  { value: "walking", label: "A walking or activity buddy", emoji: "🚶" },
  { value: "coffee",  label: "Coffee meet-ups",             emoji: "☕" },
  { value: "phone",   label: "A phone call friend",         emoji: "📞" },
  { value: "group",   label: "Group events and outings",    emoji: "🎉" },
];
const AGE_PREFS    = [{ v:"similar",label:"Similar age to me"},{v:"older",label:"A bit older"},{v:"younger",label:"Younger"},{v:"any",label:"No preference"}];
const GENDER_PREFS = [{ v:"female", label:"Women" },{ v:"male", label:"Men" },{ v:"any", label:"No preference" }];
const FREQ_PREFS   = [{ v:"frequent",label:"Daily check-ins"},{v:"weekly",label:"A few times a week"},{v:"occasional",label:"Occasionally"},{v:"any",label:"No preference"}];
const DISTANCE_FILTER = [{ v:"close",label:"Nearby (under 30 min)" },{ v:"any",label:"Any distance" }];

// ── Tiny reusable pill button ─────────────────────────────────────────────────
function Pill({ label, emoji, selected, onClick }: { label:string; emoji?:string; selected:boolean; onClick:()=>void }) {
  return (
    <button
      type="button" onClick={onClick}
      style={{
        padding:"0.6rem 1.25rem", borderRadius:"3rem", fontSize:"1rem",
        fontWeight: selected ? 700 : 500,
        border:`2px solid ${selected ? "#173124" : "#C2C8C2"}`,
        backgroundColor: selected ? "#173124" : "#FFFFFF",
        color: selected ? "#FFFFFF" : "#173124",
        cursor:"pointer", transition:"all 0.15s",
        display:"flex", alignItems:"center", gap:"0.4rem", minHeight:"44px",
      }}
    >
      {emoji && <span>{emoji}</span>}{label}
    </button>
  );
}

// ── Step wrapper card ─────────────────────────────────────────────────────────
function StepCard({ title, subtitle, children }: { title:string; subtitle?:string; children:React.ReactNode }) {
  return (
    <div style={{ backgroundColor:"#FFFFFF", border:"2px solid #E7E2D7", borderRadius:"1.5rem", padding:"2rem", marginBottom:"1.25rem" }}>
      <p style={{ fontSize:"0.75rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#735C00", marginBottom:"0.5rem" }}>{title}</p>
      {subtitle && <p style={{ fontSize:"0.95rem", color:"#727973", marginBottom:"1.25rem" }}>{subtitle}</p>}
      {children}
    </div>
  );
}

// ── Progress dots ─────────────────────────────────────────────────────────────
const STEPS: Step[] = ["situation","companion-type","filters","results"];
function ProgressDots({ current }: { current: Step }) {
  const idx = STEPS.indexOf(current);
  return (
    <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", marginBottom:"1.5rem" }}>
      {["Tell your story","What you need","Refine","Results"].map((label, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
          <div style={{
            width: i === idx ? "28px" : "10px",
            height:"10px", borderRadius:"10px",
            backgroundColor: i <= idx ? "#173124" : "#C2C8C2",
            transition:"all 0.3s",
          }} />
          {i === idx && <span style={{ fontSize:"0.75rem", fontWeight:600, color:"#173124" }}>{label}</span>}
        </div>
      ))}
    </div>
  );
}

export default function FindCompanionPage() {
  const [step, setStep] = useState<Step>("situation");
  const [situation, setSituation] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [agePref, setAgePref] = useState("any");
  const [genderPref, setGenderPref] = useState("any");
  const [freqPref, setFreqPref] = useState("any");
  const [distPref, setDistPref] = useState("any");
  const [loading, setLoading] = useState(false);
  // Results filter state
  const [filterGender, setFilterGender] = useState("any");
  const [filterActivity, setFilterActivity] = useState("any");
  const [sortBy, setSortBy] = useState<"match"|"age">("match");

  function toggleType(v: string) {
    setTypes(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  }

  // ── Filtered results ────────────────────────────────────────────────────────
  const results = useMemo(() => {
    let list = [...MOCK_MATCHES];
    if (genderPref !== "any") list = list.filter(m => m.gender === genderPref);
    if (filterGender !== "any") list = list.filter(m => m.gender === filterGender);
    if (distPref === "close") list = list.filter(m => !m.distanceLabel?.includes("hour") && !m.distanceLabel?.includes("~"));
    if (filterActivity !== "any") {
      const map: Record<string, string> = { gentle:"Gentle", moderate:"Moderate", active:"Active" };
      list = list.filter(m => m.fitness === map[filterActivity]);
    }
    if (sortBy === "age") list = list.sort((a,b) => a.age - b.age);
    else list = list.sort((a,b) => b.matchPct - a.matchPct);
    return list;
  }, [genderPref, filterGender, distPref, filterActivity, sortBy]);

  function goToResults() {
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep("results"); }, 1200);
  }

  const stepLabel = step === "situation" ? "Step 1 of 3"
    : step === "companion-type" ? "Step 2 of 3"
    : step === "filters" ? "Step 3 of 3"
    : "Results";

  const stepTitle = step === "situation" ? "Tell us about yourself 🌻"
    : step === "companion-type" ? "What kind of companion? 🤝"
    : step === "filters" ? "Refine your search 🎯"
    : "Here are your matches";

  const stepSubtitle = step === "situation" ? "Share a little about what brings you to Joyn. There are no wrong answers."
    : step === "companion-type" ? "Select everything that feels right — you can pick more than one."
    : step === "filters" ? "These are optional — make it as specific or open as you like."
    : `${results.length} people who could be a wonderful companion`;

  return (
    <div style={{ fontFamily:"var(--font-lexend), sans-serif", color:"#173124", minHeight:"100vh", backgroundColor:"#F8F3E8" }}>

      {/* Header */}
      <div style={{ backgroundColor:"#FEF9ED", padding:"2rem 2.5rem 1.5rem", borderBottom:"2px solid #E7E2D7" }}>
        <p style={{ fontSize:"0.75rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.1em", color:"#727973", marginBottom:"0.375rem" }}>
          {stepLabel}
        </p>
        <h1 style={{ fontFamily:"var(--font-epilogue), serif", fontWeight:800, fontSize:"2.1rem", color:"#173124", letterSpacing:"-0.03em", margin:0 }}>
          {stepTitle}
        </h1>
        <p style={{ fontSize:"0.95rem", color:"#727973", marginTop:"0.375rem" }}>{stepSubtitle}</p>
      </div>

      <div style={{ maxWidth:"820px", margin:"0 auto", padding:"2rem 2rem" }}>
        {step !== "results" && <ProgressDots current={step} />}

        {/* ── Step 1: Describe situation ─────────────────────────────────── */}
        {step === "situation" && (
          <>
            <StepCard title="What brings you to Joyn?" subtitle="Share as much or as little as you'd like. This helps us find the right person for you.">
              <textarea
                value={situation}
                onChange={e => setSituation(e.target.value)}
                placeholder="e.g. I recently retired and moved to Phoenix. I used to have a full social life but now I find myself feeling lonely most days. I'd love someone to have coffee with or just talk to..."
                rows={5}
                style={{
                  width:"100%", boxSizing:"border-box",
                  border:"2px solid #C2C8C2", borderRadius:"1rem",
                  padding:"1rem 1.25rem", fontSize:"1.05rem",
                  fontFamily:"var(--font-lexend), sans-serif",
                  color:"#173124", backgroundColor:"#FAFAFA",
                  resize:"vertical", lineHeight:1.6, outline:"none",
                  transition:"border-color 0.15s",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = "#173124"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#C2C8C2"; }}
              />
              <p style={{ fontSize:"0.85rem", color:"#727973", marginTop:"0.75rem" }}>
                💛 You can also skip this and we'll still find great matches for you.
              </p>
            </StepCard>

            <div style={{ display:"flex", gap:"1rem" }}>
              <button
                onClick={() => setStep("companion-type")}
                style={{
                  flex:1, backgroundColor:"#173124", color:"#FFFFFF",
                  fontWeight:700, fontSize:"1.1rem", padding:"1rem",
                  borderRadius:"3rem", border:"none", cursor:"pointer",
                }}
              >
                Continue →
              </button>
              <button
                onClick={() => setStep("companion-type")}
                style={{
                  backgroundColor:"transparent", border:"2px solid #C2C8C2",
                  color:"#727973", borderRadius:"3rem", padding:"1rem 1.5rem",
                  fontSize:"0.95rem", fontWeight:600, cursor:"pointer",
                }}
              >
                Skip
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Companion type ─────────────────────────────────────── */}
        {step === "companion-type" && (
          <>
            <StepCard title="I'm looking for..." subtitle="Pick one or more — what sounds most like you?">
              <div style={{ display:"flex", flexWrap:"wrap", gap:"0.625rem" }}>
                {COMPANION_TYPES.map(o => (
                  <Pill key={o.value} label={o.label} emoji={o.emoji}
                    selected={types.includes(o.value)} onClick={() => toggleType(o.value)} />
                ))}
              </div>
            </StepCard>

            <StepCard title="Age preference" subtitle="Who do you feel most comfortable connecting with?">
              <div style={{ display:"flex", flexWrap:"wrap", gap:"0.625rem" }}>
                {AGE_PREFS.map(o => (
                  <Pill key={o.v} label={o.label} selected={agePref===o.v} onClick={() => setAgePref(o.v)} />
                ))}
              </div>
            </StepCard>

            <div style={{ display:"flex", gap:"1rem" }}>
              <button onClick={() => setStep("situation")}
                style={{ backgroundColor:"transparent", border:"2px solid #C2C8C2", color:"#173124", borderRadius:"3rem", padding:"1rem 1.5rem", fontSize:"0.95rem", fontWeight:600, cursor:"pointer" }}>
                ← Back
              </button>
              <button onClick={() => setStep("filters")}
                style={{ flex:1, backgroundColor:"#173124", color:"#FFFFFF", fontWeight:700, fontSize:"1.1rem", padding:"1rem", borderRadius:"3rem", border:"none", cursor:"pointer" }}>
                Continue →
              </button>
            </div>
          </>
        )}

        {/* ── Step 3: Filters ───────────────────────────────────────────── */}
        {step === "filters" && (
          <>
            <StepCard title="Gender preference">
              <div style={{ display:"flex", flexWrap:"wrap", gap:"0.625rem" }}>
                {GENDER_PREFS.map(o => (
                  <Pill key={o.v} label={o.label} selected={genderPref===o.v} onClick={() => setGenderPref(o.v)} />
                ))}
              </div>
            </StepCard>

            <StepCard title="How often do you want to connect?">
              <div style={{ display:"flex", flexWrap:"wrap", gap:"0.625rem" }}>
                {FREQ_PREFS.map(o => (
                  <Pill key={o.v} label={o.label} selected={freqPref===o.v} onClick={() => setFreqPref(o.v)} />
                ))}
              </div>
            </StepCard>

            <StepCard title="Distance">
              <div style={{ display:"flex", flexWrap:"wrap", gap:"0.625rem" }}>
                {DISTANCE_FILTER.map(o => (
                  <Pill key={o.v} label={o.label} selected={distPref===o.v} onClick={() => setDistPref(o.v)} />
                ))}
              </div>
            </StepCard>

            <div style={{ display:"flex", gap:"1rem" }}>
              <button onClick={() => setStep("companion-type")}
                style={{ backgroundColor:"transparent", border:"2px solid #C2C8C2", color:"#173124", borderRadius:"3rem", padding:"1rem 1.5rem", fontSize:"0.95rem", fontWeight:600, cursor:"pointer" }}>
                ← Back
              </button>
              <button onClick={goToResults}
                style={{ flex:1, backgroundColor:"#173124", color:"#FFFFFF", fontWeight:700, fontSize:"1.1rem", padding:"1rem", borderRadius:"3rem", border:"none", cursor:"pointer" }}>
                Find My Companion 🤝
              </button>
            </div>
          </>
        )}

        {/* ── Step 4: Results ───────────────────────────────────────────── */}
        {step === "results" && (
          <>
            {/* Active filters summary strip */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem", marginBottom:"1.25rem", alignItems:"center" }}>
              {types.map(t => { const o = COMPANION_TYPES.find(x => x.value===t); return o ? (
                <span key={t} style={{ backgroundColor:"#173124",color:"#FFFFFF",fontSize:"0.8rem",fontWeight:600,padding:"0.25rem 0.875rem",borderRadius:"3rem" }}>
                  {o.emoji} {o.label}
                </span>) : null; })}
              {genderPref !== "any" && <span style={{ backgroundColor:"#E7E2D7",color:"#173124",fontSize:"0.8rem",fontWeight:600,padding:"0.25rem 0.875rem",borderRadius:"3rem" }}>
                {GENDER_PREFS.find(o=>o.v===genderPref)?.label}
              </span>}
              {distPref === "close" && <span style={{ backgroundColor:"#E7E2D7",color:"#173124",fontSize:"0.8rem",fontWeight:600,padding:"0.25rem 0.875rem",borderRadius:"3rem" }}>📍 Nearby only</span>}
            </div>

            {/* Results toolbar: filters + sort + back */}
            <div style={{ backgroundColor:"#FFFFFF", border:"2px solid #E7E2D7", borderRadius:"1.25rem", padding:"1rem 1.5rem", marginBottom:"1.5rem", display:"flex", flexWrap:"wrap", gap:"1rem", alignItems:"center" }}>
              <button onClick={() => setStep("situation")}
                style={{ backgroundColor:"transparent", border:"2px solid #C2C8C2", color:"#173124", borderRadius:"3rem", padding:"0.4rem 1rem", fontSize:"0.9rem", fontWeight:600, cursor:"pointer" }}>
                ← New search
              </button>
              <div style={{ flex:1, display:"flex", flexWrap:"wrap", gap:"0.625rem", alignItems:"center" }}>
                <span style={{ fontSize:"0.8rem", fontWeight:600, color:"#727973", whiteSpace:"nowrap" }}>Filter:</span>
                {[{ v:"any",l:"All genders" },{ v:"female",l:"Women" },{ v:"male",l:"Men" }].map(o => (
                  <button key={o.v} onClick={() => setFilterGender(o.v)} style={{
                    padding:"0.3rem 0.875rem", borderRadius:"3rem", fontSize:"0.85rem", fontWeight:600,
                    border:`2px solid ${filterGender===o.v?"#173124":"#C2C8C2"}`,
                    backgroundColor: filterGender===o.v?"#173124":"transparent",
                    color: filterGender===o.v?"#FFFFFF":"#173124", cursor:"pointer",
                  }}>{o.l}</button>
                ))}
                <div style={{ width:"1px", height:"24px", backgroundColor:"#C2C8C2" }} />
                {[{v:"any",l:"Any activity"},{v:"gentle",l:"Gentle"},{v:"moderate",l:"Moderate"},{v:"active",l:"Active"}].map(o => (
                  <button key={o.v} onClick={() => setFilterActivity(o.v)} style={{
                    padding:"0.3rem 0.875rem", borderRadius:"3rem", fontSize:"0.85rem", fontWeight:600,
                    border:`2px solid ${filterActivity===o.v?"#173124":"#C2C8C2"}`,
                    backgroundColor: filterActivity===o.v?"#173124":"transparent",
                    color: filterActivity===o.v?"#FFFFFF":"#173124", cursor:"pointer",
                  }}>{o.l}</button>
                ))}
                <div style={{ width:"1px", height:"24px", backgroundColor:"#C2C8C2" }} />
                <span style={{ fontSize:"0.8rem", fontWeight:600, color:"#727973", whiteSpace:"nowrap" }}>Sort:</span>
                {[{v:"match",l:"Best match"},{v:"age",l:"Age"}].map(o => (
                  <button key={o.v} onClick={() => setSortBy(o.v as "match"|"age")} style={{
                    padding:"0.3rem 0.875rem", borderRadius:"3rem", fontSize:"0.85rem", fontWeight:600,
                    border:`2px solid ${sortBy===o.v?"#173124":"#C2C8C2"}`,
                    backgroundColor: sortBy===o.v?"#173124":"transparent",
                    color: sortBy===o.v?"#FFFFFF":"#173124", cursor:"pointer",
                  }}>{o.l}</button>
                ))}
              </div>
            </div>

            {/* Loading */}
            {loading ? (
              <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"1.5rem",padding:"4rem 0",backgroundColor:"#FFFFFF",borderRadius:"2rem",border:"2px solid #E7E2D7" }}>
                <Loader2 size={48} color="#173124" style={{ animation:"spin 2s linear infinite" }} />
                <h2 style={{ fontFamily:"var(--font-epilogue), serif", fontSize:"1.5rem", color:"#173124" }}>Finding companions who match…</h2>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))", gap:"1.25rem" }}>
                {results.map(match => (
                  <div key={match.id} style={{ backgroundColor:"#E7E2D7", border:"2px solid #C2C8C2", borderRadius:"1.5rem", padding:"1.25rem 1.5rem" }}>
                    <div style={{ display:"flex", alignItems:"flex-start", gap:"0.75rem", marginBottom:"1rem" }}>
                      <Avatar avatarUrl={match.avatarUrl} photoPublic={match.photoPublic !== false} gender={match.gender} name={match.name} size={52} />
                      <div style={{ flex:1 }}>
                        <p style={{ fontFamily:"var(--font-epilogue), serif", fontWeight:700, fontSize:"1.15rem", color:"#173124", lineHeight:1.1 }}>
                          {match.name}, {match.age}
                        </p>
                        <p style={{ fontSize:"0.85rem", color:"#727973", marginTop:"0.15rem" }}>
                          📍 {match.distanceLabel ?? `${match.city}, AZ`}
                        </p>
                      </div>
                      <div style={{ textAlign:"right", flexShrink:0 }}>
                        <p style={{ fontFamily:"var(--font-epilogue), serif", fontWeight:800, fontSize:"1.4rem", color:"#735C00", lineHeight:1 }}>{match.matchPct}%</p>
                        <p style={{ fontSize:"0.65rem", color:"#727973", textTransform:"uppercase", letterSpacing:"0.08em" }}>match</p>
                      </div>
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:"0.375rem", marginBottom:"0.75rem" }}>
                      {match.interests.slice(0,3).map(i => (
                        <span key={i} style={{ backgroundColor:"#173124",color:"#FFFFFF",fontSize:"0.75rem",fontWeight:500,padding:"0.2rem 0.75rem",borderRadius:"3rem" }}>{i}</span>
                      ))}
                    </div>
                    {match.whyFit && (
                      <p style={{ fontSize:"0.875rem", color:"#4A5C50", lineHeight:1.55, marginBottom:"0.875rem",
                        display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                        🌻 {match.whyFit}
                      </p>
                    )}
                    {match.connectionSuggestion && (
                      <p style={{ fontSize:"0.8rem", color:"#735C00", fontWeight:600, marginBottom:"0.875rem" }}>
                        {connectionLabel(match.connectionSuggestion)}
                      </p>
                    )}
                    <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
                      <Link href={`/messages/${match.id}`} style={{ backgroundColor:"#173124",color:"#FFFFFF",fontWeight:600,padding:"0.5rem 1.1rem",borderRadius:"3rem",fontSize:"0.9rem",textDecoration:"none",minHeight:"38px",lineHeight:"1.5",display:"inline-block" }}>
                        Say Hello →
                      </Link>
                      <Link href={`/match/${match.id}`} style={{ border:"2px solid #173124",color:"#173124",backgroundColor:"transparent",fontWeight:600,padding:"0.5rem 1.1rem",borderRadius:"3rem",fontSize:"0.9rem",textDecoration:"none",minHeight:"38px",lineHeight:"1.5",display:"inline-block" }}>
                        View Profile
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
          </>
        )}
      </div>
    </div>
  );
}
