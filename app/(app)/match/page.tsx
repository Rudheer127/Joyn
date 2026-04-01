"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MOCK_MATCHES, type MatchCandidate, connectionLabel } from "@/lib/ai/matching";
import { Avatar } from "@/components/shared/Avatar";
import { Loader2 } from "lucide-react";

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchCandidate[]>(MOCK_MATCHES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ai/match/candidates")
      .then((r) => r.json())
      .then((data) => {
        if (data.matches?.length > 0) {
          setMatches(data.matches);
        }
      })
      .catch(() => {/* keep mock data */})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ fontFamily: "var(--font-lexend), sans-serif", color: "#173124", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ backgroundColor: "#FEF9ED", padding: "2.5rem 2.5rem 2rem" }}>
        <p style={{
          fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase",
          letterSpacing: "0.1em", color: "#727973", marginBottom: "0.5rem",
        }}>
          Matched for you
        </p>
        <h1 style={{
          fontFamily: "var(--font-epilogue), serif", fontWeight: 800,
          fontSize: "2.5rem", color: "#173124", letterSpacing: "-0.03em", lineHeight: 1,
        }}>
          My Matches
        </h1>
        <p style={{ fontSize: "0.95rem", color: "#727973", marginTop: "0.5rem" }}>
          {loading
            ? "Finding your best companions…"
            : `${matches.length} people who could be a wonderful companion`}
        </p>
      </div>

      {/* Cards */}
      <div style={{ backgroundColor: "#F8F3E8", padding: "2rem 2.5rem", minHeight: "calc(100vh - 160px)" }}>

        {/* Loading skeleton */}
        {loading && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: "1.5rem", padding: "4rem 0",
            backgroundColor: "#FFFFFF", borderRadius: "2rem", border: "2px solid #E7E2D7",
            maxWidth: "800px"
          }}>
            <Loader2 size={48} color="#173124" style={{ animation: "spin 2s linear infinite" }} />
            <h2 style={{ fontFamily: "var(--font-epilogue), serif", fontSize: "1.5rem", color: "#173124", textAlign: "center", maxWidth: "400px" }}>
              Jo is finding your best companions...
            </h2>
            <p style={{ color: "#727973", textAlign: "center" }}>This usually takes just a moment.</p>
          </div>
        )}

        {/* Real cards */}
        {!loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
            {matches.map((match) => (
              <div key={match.id} style={{
                backgroundColor: "#E7E2D7",
                border: "2px solid #C2C8C2",
                borderRadius: "1.5rem",
                padding: "1.25rem 1.5rem",
                transition: "box-shadow 0.15s",
              }}>
                {/* Top row: avatar + name + match % */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1.25rem" }}>

                  {/* Avatar — shows photo if available, gender silhouette otherwise */}
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
                      fontSize: "1.2rem", color: "#173124", letterSpacing: "-0.02em", lineHeight: 1.1,
                    }}>
                      {match.name}, {match.age}
                    </p>
                    <p style={{ fontSize: "0.9rem", color: "#727973", marginTop: "0.2rem" }}>
                      📍 {match.distanceLabel ?? `${match.city}, AZ`}
                    </p>
                  </div>

                  {/* Match % */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{
                      fontFamily: "var(--font-epilogue), serif", fontWeight: 800,
                      fontSize: "1.75rem", color: "#735C00", letterSpacing: "-0.02em", lineHeight: 1,
                    }}>
                      {match.matchPct}%
                    </p>
                    <p style={{ fontSize: "0.7rem", color: "#727973", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      compatibility
                    </p>
                  </div>
                </div>

                {/* Interest tags — interests first, no fitness level badge */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.25rem" }}>
                  {match.interests.map((interest) => (
                    <span key={interest} style={{
                      backgroundColor: "#173124", color: "#FFFFFF",
                      fontSize: "0.8rem", fontWeight: 500,
                      padding: "0.25rem 0.875rem", borderRadius: "3rem",
                    }}>
                      {interest}
                    </span>
                  ))}
                </div>

                {/* Connection suggestion badge */}
                {match.connectionSuggestion && (
                  <div style={{
                    display: "inline-block",
                    backgroundColor: "#F5F0E8",
                    border: "2px solid #D4C9A8",
                    borderRadius: "3rem",
                    padding: "0.35rem 1rem",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "#735C00",
                    marginBottom: "1.25rem",
                  }}>
                    {connectionLabel(match.connectionSuggestion)}
                  </div>
                )}

                {/* ★ WHY YOU BOTH WOULD BE A GREAT FIT ★ */}
                {match.whyFit && (
                  <div style={{
                    backgroundColor: "#F5F0E8",
                    border: "2px solid #D4C9A8",
                    borderRadius: "1.25rem",
                    padding: "1rem 1.25rem",
                    marginBottom: "1.5rem",
                  }}>
                    <p style={{
                      fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase",
                      letterSpacing: "0.1em", color: "#735C00", marginBottom: "0.4rem",
                    }}>
                      🌻 Why you&apos;d be great together
                    </p>
                    <p style={{ fontSize: "1rem", color: "#173124", lineHeight: 1.6 }}>
                      {match.whyFit}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <Link
                    href={`/messages/${match.id}`}
                    style={{
                      backgroundColor: "#173124", color: "#FFFFFF",
                      fontWeight: 600, padding: "0.75rem 1.75rem",
                      borderRadius: "3rem", fontSize: "1rem",
                      textDecoration: "none", display: "inline-block",
                      minHeight: "48px", lineHeight: "1.5",
                      transition: "opacity 0.15s",
                    }}
                  >
                    Say Hello to {match.name} →
                  </Link>
                  <Link
                    href={`/match/${match.id}`}
                    style={{
                      border: "2px solid #173124", color: "#173124",
                      backgroundColor: "transparent",
                      fontWeight: 600, padding: "0.75rem 1.5rem",
                      borderRadius: "3rem", fontSize: "1rem",
                      textDecoration: "none", display: "inline-block",
                      minHeight: "48px", lineHeight: "1.5",
                    }}
                  >
                    View Full Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes match-shimmer {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
