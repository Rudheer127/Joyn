"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ── Step 1 data ───────────────────────────────────────────────────────────
const LONELINESS_REASONS = [
  { id: "looking_for_friend",  emoji: "👋", label: "I'm looking for a friend to chat with" },
  { id: "walking_buddy",       emoji: "🚶", label: "I'd love a walking buddy" },
  { id: "new_to_area",         emoji: "📦", label: "I'm new to the area" },
  { id: "share_hobbies",       emoji: "🎨", label: "Someone to share hobbies with" },
  { id: "stay_active",         emoji: "🌱", label: "I want to stay active socially" },
  { id: "just_chat",           emoji: "☕", label: "Just looking for good conversation" },
  { id: "expand_circle",       emoji: "🌍", label: "Want to expand my social circle" },
  { id: "support_system",      emoji: "🤝", label: "Looking for a supportive connection" },
];

// ── Step 2 data ───────────────────────────────────────────────────────────
const CONNECTION_TYPES = [
  { id: "phone",   emoji: "📞", label: "Phone calls",      desc: "A friendly voice to talk to" },
  { id: "video",   emoji: "📹", label: "Video chats",      desc: "Face-to-face from home" },
  { id: "coffee",  emoji: "☕", label: "Coffee meet-ups",  desc: "A relaxed chat in person" },
  { id: "walks",   emoji: "🚶", label: "Walks together",   desc: "Gentle strolls and fresh air" },
  { id: "events",  emoji: "📍", label: "Local events",     desc: "Classes, groups, activities" },
  { id: "message", emoji: "💬", label: "Messages & texts", desc: "At your own pace" },
];

// ── Step 3 data ───────────────────────────────────────────────────────────
const INTERESTS = [
  "Gardening", "Reading", "Cooking", "Music", "Travel stories",
  "Card games", "Birdwatching", "Painting", "Crosswords", "Knitting",
  "Grandchildren", "Faith & spirituality", "History", "Movies & TV",
  "Photography", "Walking", "Volunteering", "Crafts",
];

const CITIES = ["Phoenix", "Scottsdale", "Mesa", "Tempe", "Chandler", "Gilbert", "Tucson", "Other"];

type Step = 1 | 2 | 3 | 4;

export default function OnboardPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);

  // Collected data
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [selectedConnections, setSelectedConnections] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState("");

  function toggleItem(id: string, list: string[], setList: (v: string[]) => void) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  async function handleFinish() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/sign-in"); return; }

      await supabase.from("profiles").upsert({
        id: user.id,
        full_name: name || null,
        city: city || null,
        age: age || null,
        gender: gender || null,
        connection_preference: selectedConnections.join(",") || "any",
        health_goals: selectedReasons,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      });

      // Save interests if any match DB entries
      if (selectedInterests.length > 0) {
        const { data: allInterests } = await supabase.from("interests").select("id, name");
        if (allInterests) {
          const lower = selectedInterests.map((i) => i.toLowerCase());
          const rows = allInterests
            .filter((i) => lower.includes(i.name.toLowerCase()))
            .map((i) => ({ user_id: user.id, interest_id: i.id }));
          if (rows.length > 0) {
            await supabase.from("user_interests").upsert(rows, { onConflict: "user_id,interest_id" });
          }
        }
      }

      await fetch("/api/ai/match/embed", { method: "POST" }).catch(() => {});
      router.push("/dashboard");
    } catch (err) {
      console.error("Onboarding save error:", err);
      setSaving(false);
    }
  }

  const TOTAL_STEPS = 4;

  const stepTitles: Record<Step, string> = {
    1: "What brings you to Joyn?",
    2: "How do you like to connect?",
    3: "A little about you",
    4: "You're in safe hands",
  };
  const stepSubs: Record<Step, string> = {
    1: "Select all that apply",
    2: "Choose everything that feels comfortable",
    3: "This helps us find the right companions",
    4: "Please read carefully",
  };

  // ── Saving overlay ────────────────────────────────────────────────────
  if (saving) {
    return (
      <div style={{
        minHeight: "100vh", backgroundColor: "#F5F0E8",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", fontFamily: "var(--font-lexend), sans-serif",
        gap: "1.5rem", padding: "2rem", textAlign: "center",
      }}>
        <div style={{
          width: "72px", height: "72px", borderRadius: "50%",
          backgroundColor: "#173124", color: "#FFFFFF",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-epilogue), serif", fontWeight: 700,
          fontSize: "1.25rem", animation: "spin-slow 2s linear infinite",
        }}>
          🌻
        </div>
        <p style={{ fontFamily: "var(--font-epilogue), serif", fontWeight: 700, fontSize: "1.75rem", color: "#173124" }}>
          Setting up your profile…
        </p>
        <p style={{ fontSize: "1rem", color: "#727973" }}>
          Finding your best companions — just a moment!
        </p>
        <style>{`@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", backgroundColor: "#F5F0E8",
      fontFamily: "var(--font-lexend), sans-serif", color: "#173124",
    }}>

      {/* ── Progress bar + step counter ── */}
      <div style={{ backgroundColor: "#FEF9ED", borderBottom: "1px solid #E7E2D7", padding: "1.25rem 2rem" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.625rem" }}>
            <span style={{ fontFamily: "var(--font-epilogue), serif", fontWeight: 700, fontSize: "1.125rem", color: "#173124" }}>
              JOYN
            </span>
            <span style={{ fontSize: "0.875rem", color: "#727973", fontWeight: 500 }}>
              Step {step} of {TOTAL_STEPS}
            </span>
          </div>
          {/* Multi-segment progress bar */}
          <div style={{ display: "flex", gap: "4px" }}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} style={{ flex: 1, height: "6px", borderRadius: "3px", backgroundColor: i < step ? "#173124" : "#D4C9A8", transition: "background-color 0.3s" }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>

        {/* Title */}
        <div style={{ marginBottom: "1.75rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{
              fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.1em", color: "#727973", marginBottom: "0.5rem",
            }}>
              Step {step} of {TOTAL_STEPS}
            </p>
            <h1 style={{
              fontFamily: "var(--font-epilogue), serif", fontWeight: 800,
              fontSize: "1.875rem", color: "#173124", letterSpacing: "-0.02em",
              lineHeight: 1.15, marginBottom: "0.375rem",
            }}>
              {stepTitles[step]}
            </h1>
            <p style={{ fontSize: "1rem", color: "#727973" }}>{stepSubs[step]}</p>
          </div>
          
          {step === 1 && (
            <button
              onClick={() => router.push("/onboard/voice")}
              style={{
                backgroundColor: "#F2C94C", color: "#173124", border: "none",
                borderRadius: "2rem", padding: "0.5rem 1rem", fontSize: "0.875rem",
                fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem",
                cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
              }}
            >
              🎤 Voice Setup
            </button>
          )}
        </div>

        {/* Hint banner */}
        <div style={{
          backgroundColor: "#FFFBEA", border: "2px solid #E8C84A",
          borderRadius: "0.75rem", padding: "0.75rem 1rem",
          display: "flex", gap: "0.625rem", alignItems: "flex-start",
          marginBottom: "1.75rem", fontSize: "0.9rem", color: "#735C00",
        }}>
          <span>💡</span>
          <span>
            {step === 1 && "Your reason stays private. It helps us find the right companion for you."}
            {step === 2 && "You can always change your preferences later from your profile."}
            {step === 3 && "These preferences help us find your best match nearby."}
            {step === 4 && "You are always in control of your conversations."}
          </span>
        </div>

        {/* ── STEP 1: Why did you join? ── */}
        {step === 1 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem", marginBottom: "2rem" }}>
            {LONELINESS_REASONS.map((r) => {
              const selected = selectedReasons.includes(r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => toggleItem(r.id, selectedReasons, setSelectedReasons)}
                  style={{
                    backgroundColor: selected ? "#173124" : "#FFFFFF",
                    color: selected ? "#FFFFFF" : "#173124",
                    border: `2px solid ${selected ? "#173124" : "#D4C9A8"}`,
                    borderRadius: "1.25rem",
                    padding: "1.25rem 1rem",
                    cursor: "pointer",
                    textAlign: "center",
                    fontFamily: "var(--font-lexend), sans-serif",
                    transition: "all 0.15s",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.5rem",
                    minHeight: "110px",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: "2rem" }}>{r.emoji}</span>
                  <span style={{ fontSize: "0.9rem", fontWeight: 600, lineHeight: 1.3 }}>{r.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── STEP 2: How do you like to connect? ── */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
            {CONNECTION_TYPES.map((c) => {
              const selected = selectedConnections.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleItem(c.id, selectedConnections, setSelectedConnections)}
                  style={{
                    backgroundColor: selected ? "#173124" : "#FFFFFF",
                    color: selected ? "#FFFFFF" : "#173124",
                    border: `2px solid ${selected ? "#173124" : "#D4C9A8"}`,
                    borderRadius: "1rem",
                    padding: "1rem 1.25rem",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "var(--font-lexend), sans-serif",
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    minHeight: "72px",
                  }}
                >
                  <span style={{ fontSize: "1.75rem", flexShrink: 0 }}>{c.emoji}</span>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.1rem" }}>{c.label}</p>
                    <p style={{ fontSize: "0.875rem", opacity: selected ? 0.8 : 0.6 }}>{c.desc}</p>
                  </div>
                  {selected && (
                    <span style={{ marginLeft: "auto", fontSize: "1.25rem", flexShrink: 0 }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ── STEP 3: About you ── */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "2rem" }}>

            {/* Name */}
            <div>
              <label style={{ display: "block", fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.5rem", color: "#173124" }}>
                Your first name (optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Margaret"
                style={{
                  width: "100%", border: "2px solid #D4C9A8", borderRadius: "0.75rem",
                  padding: "0.875rem 1rem", fontSize: "1rem", color: "#173124",
                  backgroundColor: "#FFFFFF", fontFamily: "var(--font-lexend), sans-serif",
                  outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            {/* Age & Gender Row */}
            <div style={{ display: "flex", gap: "1rem" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.5rem", color: "#173124" }}>
                  Age (optional)
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value ? parseInt(e.target.value, 10) : "")}
                  placeholder="e.g. 65"
                  style={{
                    width: "100%", border: "2px solid #D4C9A8", borderRadius: "0.75rem",
                    padding: "0.875rem 1rem", fontSize: "1rem", color: "#173124",
                    backgroundColor: "#FFFFFF", fontFamily: "var(--font-lexend), sans-serif",
                    outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.5rem", color: "#173124" }}>
                  Gender (optional)
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  style={{
                    width: "100%", border: "2px solid #D4C9A8", borderRadius: "0.75rem",
                    padding: "0.875rem 1rem", fontSize: "1rem", color: "#173124",
                    backgroundColor: "#FFFFFF", fontFamily: "var(--font-lexend), sans-serif",
                    outline: "none", boxSizing: "border-box", appearance: "none"
                  }}
                >
                  <option value="">Select...</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other / Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* City */}
            <div>
              <label style={{ display: "block", fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.5rem", color: "#173124" }}>
                Your city in Arizona
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
                {CITIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCity(c)}
                    style={{
                      backgroundColor: city === c ? "#173124" : "#FFFFFF",
                      color: city === c ? "#FFFFFF" : "#173124",
                      border: `2px solid ${city === c ? "#173124" : "#D4C9A8"}`,
                      borderRadius: "3rem", padding: "0.5rem 1.25rem",
                      fontSize: "0.95rem", fontWeight: 500, cursor: "pointer",
                      fontFamily: "var(--font-lexend), sans-serif", transition: "all 0.15s",
                      minHeight: "44px",
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div>
              <label style={{ display: "block", fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.5rem", color: "#173124" }}>
                Things you enjoy (optional)
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
                {INTERESTS.map((interest) => {
                  const selected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      onClick={() => toggleItem(interest, selectedInterests, setSelectedInterests)}
                      style={{
                        backgroundColor: selected ? "#173124" : "#FFFFFF",
                        color: selected ? "#FFFFFF" : "#173124",
                        border: `2px solid ${selected ? "#173124" : "#D4C9A8"}`,
                        borderRadius: "3rem", padding: "0.5rem 1.25rem",
                        fontSize: "0.9rem", fontWeight: 500, cursor: "pointer",
                        fontFamily: "var(--font-lexend), sans-serif", transition: "all 0.15s",
                        minHeight: "40px",
                      }}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Trust & Safety ── */}
        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
            {[
              {
                icon: "🤝",
                title: "This is real companionship",
                desc: "Your companion is a real person, not a therapist or professional. They're here to listen, talk, and be a friend.",
              },
              {
                icon: "🚨",
                title: "Not for emergencies",
                desc: "If you're in crisis, please call 988 (Suicide & Crisis Lifeline) or 911. We'll always show you these resources.",
              },
              {
                icon: "🔒",
                title: "You're in control",
                desc: "End conversations anytime. Set your own boundaries. Your privacy is protected until you choose to share.",
              },
              {
                icon: "👨‍👩‍👧",
                title: "Family can help too",
                desc: "If a family member set this up for you, they can support you — but your conversations are always yours.",
              },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "2px solid #D4C9A8",
                  borderRadius: "1rem",
                  padding: "1.125rem 1.25rem",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "1rem",
                }}
              >
                <div style={{
                  width: "44px", height: "44px", borderRadius: "50%",
                  backgroundColor: "#E8F4EC", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "1.25rem", flexShrink: 0,
                }}>
                  {item.icon}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "1rem", color: "#173124", marginBottom: "0.2rem" }}>{item.title}</p>
                  <p style={{ fontSize: "0.9rem", color: "#555F5A", lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Navigation buttons ── */}
        <div style={{ display: "flex", gap: "0.875rem", justifyContent: "space-between" }}>
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as Step)}
              style={{
                backgroundColor: "transparent",
                border: "2px solid #D4C9A8",
                borderRadius: "3rem",
                padding: "0.875rem 1.75rem",
                fontSize: "1rem",
                fontWeight: 600,
                color: "#173124",
                cursor: "pointer",
                fontFamily: "var(--font-lexend), sans-serif",
                minHeight: "52px",
              }}
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {step < TOTAL_STEPS ? (
            <button
              onClick={() => setStep((s) => (s + 1) as Step)}
              disabled={step === 1 && selectedReasons.length === 0}
              style={{
                backgroundColor: step === 1 && selectedReasons.length === 0 ? "#D4C9A8" : "#173124",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "3rem",
                padding: "0.875rem 2rem",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: step === 1 && selectedReasons.length === 0 ? "not-allowed" : "pointer",
                fontFamily: "var(--font-lexend), sans-serif",
                minHeight: "52px",
                transition: "background-color 0.15s",
              }}
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleFinish}
              style={{
                backgroundColor: "#173124",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "3rem",
                padding: "0.875rem 2rem",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "var(--font-lexend), sans-serif",
                minHeight: "52px",
              }}
            >
              Find My Companions 🌻
            </button>
          )}
        </div>

        {/* Skip link */}
        {step < 4 && (
          <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.9rem", color: "#727973" }}>
            <button
              onClick={() => setStep((s) => (s + 1) as Step)}
              style={{
                background: "none", border: "none", color: "#727973",
                cursor: "pointer", textDecoration: "underline", fontSize: "0.9rem",
                fontFamily: "var(--font-lexend), sans-serif",
              }}
            >
              Skip this step
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
