"use client";

import { useState } from "react";
import Link from "next/link";

const MOOD_OPTIONS = [
  { emoji: "😔", label: "Not great", low: true },
  { emoji: "😐", label: "Okay", low: true },
  { emoji: "🙂", label: "Pretty good", low: false },
  { emoji: "😊", label: "Good", low: false },
  { emoji: "🌟", label: "Great", low: false },
];

const ACKNOWLEDGMENTS: Record<string, string> = {
  "Not great": "I'm sorry to hear that. It's okay to have tough days — I'm glad you're here. 💛",
  "Okay":      "Thanks for sharing. Some days are just okay, and that's perfectly fine. 🌻",
  "Pretty good": "That's lovely to hear! A pretty good day is a good day. 😊",
  "Good":      "Wonderful! Glad you're feeling good today. ☀️",
  "Great":     "That's fantastic! Your energy is contagious. 🌟",
};

function getTodayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function MoodWidget() {
  const [selectedMood, setSelectedMood] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("joyn_mood");
      if (raw) {
        const { mood, date } = JSON.parse(raw) as { mood: string; date: string };
        if (date === getTodayISO()) return mood;
      }
    } catch {
      // localStorage unavailable
    }
    return null;
  });
  function handleSelect(label: string) {
    setSelectedMood(label);
    try {
      localStorage.setItem("joyn_mood", JSON.stringify({ mood: label, date: getTodayISO() }));
    } catch {
      // ignore
    }
  }

  const isLow = selectedMood
    ? (MOOD_OPTIONS.find((m) => m.label === selectedMood)?.low ?? false)
    : false;

  return (
    <div
      style={{
        backgroundColor: "#E7E2D7",
        border: "2px solid #C2C8C2",
        borderRadius: "2rem",
        padding: "1.5rem",
      }}
    >
      <p
        style={{
          fontSize: "0.75rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "#735C00",
          marginBottom: "0.875rem",
        }}
      >
        Daily Check-In
      </p>

      {!selectedMood ? (
        <>
          <p style={{ fontSize: "1.0625rem", fontWeight: 600, color: "#173124", marginBottom: "1rem" }}>
            How are you feeling today?
          </p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {MOOD_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                aria-label={opt.label}
                onClick={() => handleSelect(opt.label)}
                style={{
                  minWidth: "44px",
                  minHeight: "44px",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "1rem",
                  border: "2px solid #C2C8C2",
                  backgroundColor: "#FEF9ED",
                  cursor: "pointer",
                  fontSize: "1.375rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.2rem",
                  transition: "border-color 0.15s",
                }}
              >
                <span>{opt.emoji}</span>
                <span style={{ fontSize: "0.65rem", color: "#727973", fontWeight: 500 }}>{opt.label}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div aria-live="polite">
          <p style={{ fontSize: "1.0625rem", color: "#173124", lineHeight: 1.6, marginBottom: isLow ? "0.875rem" : 0 }}>
            {ACKNOWLEDGMENTS[selectedMood] ?? "Thanks for sharing! 🌻"}
          </p>
          {isLow && (
            <>
              <p style={{ fontSize: "1rem", color: "#4A5C50", marginBottom: "0.75rem" }}>
                Would you like to reach out to one of your companions?
              </p>
              <Link
                href="/match"
                style={{
                  display: "inline-block",
                  backgroundColor: "#173124",
                  color: "#FFFFFF",
                  fontWeight: 600,
                  padding: "0.625rem 1.25rem",
                  borderRadius: "3rem",
                  fontSize: "0.95rem",
                  textDecoration: "none",
                  minHeight: "44px",
                  lineHeight: "1.5",
                }}
              >
                Reach out to companions →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
