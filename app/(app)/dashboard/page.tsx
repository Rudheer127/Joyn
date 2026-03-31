"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
  const [greeting, setGreeting] = useState("Good day");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");

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

        {/* 6-card grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "1.25rem",
            marginBottom: "2.5rem",
          }}
        >
          {ACTION_CARDS.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              style={{
                backgroundColor: card.bg,
                border: "2px solid rgba(0,0,0,0.06)",
                borderRadius: "1.5rem",
                padding: "1.5rem",
                textDecoration: "none",
                color: "#173124",
                display: "flex",
                flexDirection: "column",
                gap: "0.875rem",
                transition: "transform 0.15s, box-shadow 0.15s",
                minHeight: "150px",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 8px 24px rgba(0,0,0,0.10)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "1rem",
                  backgroundColor: card.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                }}
              >
                {card.emoji}
              </div>

              {/* Text */}
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-epilogue), serif",
                    fontWeight: 700,
                    fontSize: "1.125rem",
                    color: "#173124",
                    marginBottom: "0.25rem",
                  }}
                >
                  {card.title}
                </p>
                <p style={{ fontSize: "0.9rem", color: "#555F5A", lineHeight: 1.5 }}>
                  {card.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Ready to connect CTA ── */}
        <div
          style={{
            backgroundColor: "#173124",
            borderRadius: "1.5rem",
            padding: "1.75rem 2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "var(--font-epilogue), serif",
                fontWeight: 700,
                fontSize: "1.25rem",
                color: "#FFFFFF",
                marginBottom: "0.25rem",
              }}
            >
              🌻 Ready to connect?
            </p>
            <p style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.7)" }}>
              Say hello to a match — it only takes a moment.
            </p>
          </div>
          <Link
            href="/match"
            style={{
              backgroundColor: "#E8C84A",
              color: "#173124",
              fontWeight: 700,
              fontSize: "1rem",
              padding: "0.875rem 1.75rem",
              borderRadius: "3rem",
              textDecoration: "none",
              whiteSpace: "nowrap",
              minHeight: "48px",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            Get Started →
          </Link>
        </div>
      </div>
    </div>
  );
}
