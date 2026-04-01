"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MOCK_MATCHES, type MatchCandidate, connectionLabel } from "@/lib/ai/matching";
import { Avatar } from "@/components/shared/Avatar";
import { Loader2 } from "lucide-react";

// ── Preference options ────────────────────────────────────────────────────────
const COMPANION_TYPES = [
  { value: "talk",     label: "Someone to talk to",       emoji: "💬" },
  { value: "walking",  label: "A walking / activity buddy", emoji: "🚶" },
  { value: "coffee",   label: "Coffee meetups",             emoji: "☕" },
  { value: "phone",    label: "Phone call friend",          emoji: "📞" },
  { value: "group",    label: "Group events and outings",   emoji: "🎉" },
];

const AGE_PREFS = [
  { value: "similar",    label: "Similar age to me" },
  { value: "younger",    label: "Younger" },
  { value: "any",        label: "No preference" },
];

const GENDER_PREFS = [
  { value: "female", label: "Women" },
  { value: "male",   label: "Men" },
  { value: "any",    label: "No preference" },
];

const FREQUENCY_PREFS = [
  { value: "frequent",   label: "Daily check-ins" },
  { value: "weekly",     label: "A few times a week" },
  { value: "occasional", label: "Occasionally" },
];

function PillButton({ label, emoji, selected, onClick }: {
  label: string; emoji?: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "0.625rem 1.25rem",
        borderRadius: "3rem",
        fontSize: "1rem",
        fontWeight: selected ? 700 : 500,
        border: `2px solid ${selected ? "#173124" : "#C2C8C2"}`,
        backgroundColor: selected ? "#173124" : "#FFFFFF",
        color: selected ? "#FFFFFF" : "#173124",
        cursor: "pointer",
        transition: "all 0.15s",
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        minHeight: "44px",
      }}
    >
      {emoji && <span>{emoji}</span>}
      {label}
    </button>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: "#FFFFFF",
      border: "2px solid #E7E2D7",
      borderRadius: "1.5rem",
      padding: "1.5rem 2rem",
      marginBottom: "1.25rem",
    }}>
      <p style={{
        fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.1em", color: "#735C00", marginBottom: "1rem",
      }}>{title}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
        {children}
      </div>
    </div>
  );
}

export default function FindCompanionPage() {
  const [step, setStep] = useState<"prefs" | "results">("prefs");

  // Preferences
  const [companionType, setCompanionType] = useState<string[]>([]);
  const [agePref, setAgePref] = useState("any");
  const [genderPref, setGenderPref] = useState("any");
  const [frequencyPref, setFrequencyPref] = useState("any");

  // Results
  const [matches, setMatches] = useState<MatchCandidate[]>(MOCK_MATCHES);
  const [loading, setLoading] = useState(false);

  function toggleType(val: string) {
    setCompanionType(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  }

  function handleSearch() {
    setStep("results");
    setLoading(true);

    // Build query params for filter
    const params = new URLSearchParams();
    if (companionType.length > 0) params.set("types", companionType.join(","));
    if (genderPref !== "any") params.set("gender", genderPref);
    if (agePref !== "any") params.set("agePref", agePref);
    if (frequencyPref !== "any") params.set("frequency", frequencyPref);

    fetch(`/api/ai/match/candidates?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        let results: MatchCandidate[] = data.matches?.length > 0 ? data.matches : MOCK_MATCHES;

        // Client-side filter by gender preference
        if (genderPref !== "any") {
          results = results.filter(m =>
            m.gender?.toLowerCase() === genderPref.toLowerCase()
          );
        }

        setMatches(results.length > 0 ? results : MOCK_MATCHES);
      })
      .catch(() => setMatches(MOCK_MATCHES))
      .finally(() => setLoading(false));
  }

  const canSearch = true; // All prefs are optional — always allow search

  return (
    <div style={{
      fontFamily: "var(--font-lexend), sans-serif",
      color: "#173124",
      minHeight: "100vh",
      backgroundColor: "#F8F3E8",
    }}>
      {/* Header */}
      <div style={{ backgroundColor: "#FEF9ED", padding: "2rem 2.5rem 1.5rem", borderBottom: "2px solid #E7E2D7" }}>
        <p style={{
          fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase",
          letterSpacing: "0.1em", color: "#727973", marginBottom: "0.5rem",
        }}>
          {step === "prefs" ? "Step 1 of 2" : "Your results"}
        </p>
        <h1 style={{
          fontFamily: "var(--font-epilogue), serif", fontWeight: 800,
          fontSize: "2.25rem", color: "#173124", letterSpacing: "-0.03em",
        }}>
          {step === "prefs" ? "Find Your Companion 🤝" : "Here are your matches"}
        </h1>
        <p style={{ fontSize: "0.975rem", color: "#727973", marginTop: "0.375rem" }}>
          {step === "prefs"
            ? "Tell us a little about what you're looking for — we'll find the best fit."
            : `${matches.length} companion${matches.length !== 1 ? "s" : ""} match your preferences`}
        </p>
      </div>

      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "2rem 2rem" }}>

        {/* ── Preferences step ── */}
        {step === "prefs" && (
          <>
            <SectionCard title="What kind of companion are you looking for?">
              {COMPANION_TYPES.map(opt => (
                <PillButton
                  key={opt.value}
                  label={opt.label}
                  emoji={opt.emoji}
                  selected={companionType.includes(opt.value)}
                  onClick={() => toggleType(opt.value)}
                />
              ))}
            </SectionCard>

            <SectionCard title="Age preference">
              {AGE_PREFS.map(opt => (
                <PillButton
                  key={opt.value}
                  label={opt.label}
                  selected={agePref === opt.value}
                  onClick={() => setAgePref(opt.value)}
                />
              ))}
            </SectionCard>

            <SectionCard title="Gender preference">
              {GENDER_PREFS.map(opt => (
                <PillButton
                  key={opt.value}
                  label={opt.label}
                  selected={genderPref === opt.value}
                  onClick={() => setGenderPref(opt.value)}
                />
              ))}
            </SectionCard>

            <SectionCard title="How often do you want to connect?">
              {FREQUENCY_PREFS.map(opt => (
                <PillButton
                  key={opt.value}
                  label={opt.label}
                  selected={frequencyPref === opt.value}
                  onClick={() => setFrequencyPref(opt.value)}
                />
              ))}
            </SectionCard>

            <button
              onClick={handleSearch}
              style={{
                width: "100%", backgroundColor: "#173124", color: "#FFFFFF",
                fontWeight: 700, fontSize: "1.125rem", padding: "1.125rem",
                borderRadius: "3rem", border: "none", cursor: "pointer",
                marginTop: "0.5rem", transition: "opacity 0.2s",
              }}
            >
              Find My Companion →
            </button>
          </>
        )}

        {/* ── Results step ── */}
        {step === "results" && (
          <>
            {/* Refine search button */}
            <button
              onClick={() => setStep("prefs")}
              style={{
                backgroundColor: "transparent", border: "2px solid #C2C8C2",
                color: "#173124", borderRadius: "3rem",
                padding: "0.5rem 1.25rem", fontSize: "0.95rem", fontWeight: 600,
                cursor: "pointer", marginBottom: "1.5rem",
              }}
            >
              ← Refine my search
            </button>

            {/* Active filter summary */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
              {companionType.map(t => {
                const opt = COMPANION_TYPES.find(o => o.value === t);
                return opt ? (
                  <span key={t} style={{
                    backgroundColor: "#173124", color: "#FFFFFF",
                    fontSize: "0.8rem", fontWeight: 600,
                    padding: "0.25rem 0.875rem", borderRadius: "3rem",
                  }}>{opt.emoji} {opt.label}</span>
                ) : null;
              })}
              {genderPref !== "any" && (
                <span style={{
                  backgroundColor: "#E7E2D7", color: "#173124",
                  fontSize: "0.8rem", fontWeight: 600,
                  padding: "0.25rem 0.875rem", borderRadius: "3rem",
                }}>
                  {GENDER_PREFS.find(o => o.value === genderPref)?.label}
                </span>
              )}
              {agePref !== "any" && (
                <span style={{
                  backgroundColor: "#E7E2D7", color: "#173124",
                  fontSize: "0.8rem", fontWeight: 600,
                  padding: "0.25rem 0.875rem", borderRadius: "3rem",
                }}>
                  {AGE_PREFS.find(o => o.value === agePref)?.label}
                </span>
              )}
            </div>

            {loading ? (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: "1.5rem", padding: "4rem 0",
                backgroundColor: "#FFFFFF", borderRadius: "2rem", border: "2px solid #E7E2D7",
              }}>
                <Loader2 size={48} color="#173124" style={{ animation: "spin 2s linear infinite" }} />
                <h2 style={{
                  fontFamily: "var(--font-epilogue), serif",
                  fontSize: "1.5rem", color: "#173124", textAlign: "center",
                }}>
                  Finding companions who match…
                </h2>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "1.25rem",
              }}>
                {matches.map(match => (
                  <div key={match.id} style={{
                    backgroundColor: "#E7E2D7", border: "2px solid #C2C8C2",
                    borderRadius: "1.5rem", padding: "1.25rem 1.5rem",
                    transition: "box-shadow 0.15s",
                  }}>
                    {/* Top row */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "1rem" }}>
                      <Avatar
                        avatarUrl={match.avatarUrl}
                        photoPublic={match.photoPublic !== false}
                        gender={match.gender}
                        name={match.name}
                        size={56}
                      />
                      <div style={{ flex: 1 }}>
                        <p style={{
                          fontFamily: "var(--font-epilogue), serif", fontWeight: 700,
                          fontSize: "1.2rem", color: "#173124", lineHeight: 1.1,
                        }}>
                          {match.name}, {match.age}
                        </p>
                        <p style={{ fontSize: "0.875rem", color: "#727973", marginTop: "0.15rem" }}>
                          📍 {match.distanceLabel ?? `${match.city}, AZ`}
                        </p>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{
                          fontFamily: "var(--font-epilogue), serif", fontWeight: 800,
                          fontSize: "1.5rem", color: "#735C00", lineHeight: 1,
                        }}>{match.matchPct}%</p>
                        <p style={{ fontSize: "0.65rem", color: "#727973", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          match
                        </p>
                      </div>
                    </div>

                    {/* Interest tags */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1rem" }}>
                      {match.interests.slice(0, 3).map(interest => (
                        <span key={interest} style={{
                          backgroundColor: "#173124", color: "#FFFFFF",
                          fontSize: "0.75rem", fontWeight: 500,
                          padding: "0.2rem 0.75rem", borderRadius: "3rem",
                        }}>
                          {interest}
                        </span>
                      ))}
                    </div>

                    {/* Why you'd fit */}
                    {match.whyFit && (
                      <p style={{
                        fontSize: "0.9rem", color: "#4A5C50", lineHeight: 1.55,
                        marginBottom: "1rem",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}>
                        🌻 {match.whyFit}
                      </p>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
                      <Link
                        href={`/messages/${match.id}`}
                        style={{
                          backgroundColor: "#173124", color: "#FFFFFF",
                          fontWeight: 600, padding: "0.625rem 1.25rem",
                          borderRadius: "3rem", fontSize: "0.9rem",
                          textDecoration: "none", display: "inline-block",
                          minHeight: "40px", lineHeight: "1.5",
                        }}
                      >
                        Say Hello →
                      </Link>
                      <Link
                        href={`/match/${match.id}`}
                        style={{
                          border: "2px solid #173124", color: "#173124",
                          backgroundColor: "transparent",
                          fontWeight: 600, padding: "0.625rem 1.25rem",
                          borderRadius: "3rem", fontSize: "0.9rem",
                          textDecoration: "none", display: "inline-block",
                          minHeight: "40px", lineHeight: "1.5",
                        }}
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </>
        )}
      </div>
    </div>
  );
}
