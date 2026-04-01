"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MoodWidget } from "@/components/dashboard/MoodWidget";

const ACTION_CARDS = [
  {
    href: "/match",
    emoji: "🤝",
    bg: "#E8F4EC",
    iconBg: "#173124",
    title: "Find Companions",
    desc: "Meet someone who truly understands you.",
  },
  {
    href: "/messages",
    emoji: "💬",
    bg: "#EEF0FF",
    iconBg: "#3B4CB8",
    title: "My Messages",
    desc: "Continue a conversation with a companion.",
  },
  {
    href: "/sessions",
    emoji: "📅",
    bg: "#FFF8E8",
    iconBg: "#B8860B",
    title: "Schedule a Catch-Up",
    desc: "Plan your next phone call or coffee chat.",
  },
  {
    href: "/events",
    emoji: "📍",
    bg: "#FFF0F0",
    iconBg: "#C0392B",
    title: "Events Near Me",
    desc: "Find activities happening in Arizona.",
  },
  {
    href: "/match",
    emoji: "👥",
    bg: "#F0F8FF",
    iconBg: "#2471A3",
    title: "My Matches",
    desc: "View your curated companion list.",
  },
  {
    href: "/profile",
    emoji: "👤",
    bg: "#F5F0FF",
    iconBg: "#7D3C98",
    title: "My Profile",
    desc: "Update your story and preferences.",
  },
];

export default function DashboardPage() {
  const [firstName, setFirstName] = useState("");
  const [greeting] = useState(() => {
    if (typeof window === "undefined") return "Good day";
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.full_name) {
            setFirstName(data.full_name.split(" ")[0]);
          }
        });
    });
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F8F3E8",
        fontFamily: "var(--font-lexend), sans-serif",
        color: "#173124",
      }}
    >
      {/* ── Top bar ── */}
      <div
        style={{
          backgroundColor: "#FEF9ED",
          borderBottom: "2px solid #E7E2D7",
          padding: "1.25rem 2.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-epilogue), serif",
            fontWeight: 800,
            fontSize: "1.5rem",
            color: "#173124",
            letterSpacing: "-0.02em",
          }}
        >
          JOYN
        </span>
        <Link
          href="/profile"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "#727973",
            fontSize: "0.9rem",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Update my profile →
        </Link>
      </div>

      {/* ── Main content ── */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2.5rem 2rem" }}>

        {/* Welcome header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontFamily: "var(--font-epilogue), serif",
              fontWeight: 800,
              fontSize: "2.25rem",
              color: "#173124",
              letterSpacing: "-0.03em",
              marginBottom: "0.375rem",
            }}
          >
            {greeting}{firstName ? `, ${firstName}` : ""} 👋
          </h1>
          <p style={{ fontSize: "1.0625rem", color: "#727973" }}>
            How would you like to connect today?
          </p>
        </div>

        {/* Tip banner */}
        <div
          style={{
            backgroundColor: "#FFFBEA",
            border: "2px solid #E8C84A",
            borderRadius: "1rem",
            padding: "0.875rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "2rem",
            fontSize: "0.95rem",
            color: "#735C00",
            fontWeight: 500,
          }}
        >
          <span style={{ fontSize: "1.125rem" }}>💡</span>
          <span>
            <strong>Tip:</strong> A simple &ldquo;hello&rdquo; message is all it takes to start a
            great friendship. Your matches are waiting!
          </span>
        </div>

        {/* Action cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          {ACTION_CARDS.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              style={{
                backgroundColor: card.bg,
                borderRadius: "1.5rem",
                padding: "1.25rem",
                textDecoration: "none",
                color: "#173124",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                border: "2px solid rgba(0,0,0,0.04)",
                transition: "transform 0.15s",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  backgroundColor: card.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.25rem",
                }}
              >
                {card.emoji}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.25rem" }}>
                  {card.title}
                </p>
                <p style={{ fontSize: "0.875rem", color: "#727973", lineHeight: 1.4 }}>
                  {card.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Mood check-in */}
        <div style={{ marginBottom: "2rem" }}>
          <MoodWidget />
        </div>

        {/* Simple AI input */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "2px solid #E7E2D7",
            borderRadius: "1.5rem",
            padding: "2rem",
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            marginBottom: "2.5rem",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>
            How are you feeling today?
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const val = (e.currentTarget.elements.namedItem("feeling") as HTMLInputElement).value;
              if (val) window.location.href = `/consultation?q=${encodeURIComponent(val)}`;
            }}
          >
            <textarea
              name="feeling"
              placeholder="E.g., I'm feeling a bit lonely today and would love to just talk to someone, or maybe find an activity nearby..."
              rows={4}
              style={{
                width: "100%",
                padding: "1rem",
                borderRadius: "1rem",
                border: "2px solid #C2C8C2",
                fontSize: "1.0625rem",
                fontFamily: "inherit",
                resize: "none",
                marginBottom: "1rem",
              }}
            />
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
              {[
                "I just want to talk",
                "Find people near me",
                "Suggest an activity",
                "I feel overwhelmed",
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    window.location.href = `/consultation?q=${encodeURIComponent(preset)}`;
                  }}
                  style={{
                    backgroundColor: "#FEF9ED",
                    border: "1px solid #C2C8C2",
                    borderRadius: "2rem",
                    padding: "0.5rem 1rem",
                    fontSize: "0.95rem",
                    color: "#173124",
                    cursor: "pointer",
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>
            <button
              type="submit"
              style={{
                width: "100%",
                backgroundColor: "#173124",
                color: "#FFFFFF",
                fontWeight: 600,
                fontSize: "1.125rem",
                padding: "1rem",
                borderRadius: "3rem",
                border: "none",
                cursor: "pointer",
              }}
            >
              Continue to Consultation
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
