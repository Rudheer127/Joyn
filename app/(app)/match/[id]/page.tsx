"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { MOCK_PROFILES, type MatchCandidate } from "@/lib/ai/matching";

export default function MatchProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [profile, setProfile] = useState<MatchCandidate | null>(() => MOCK_PROFILES[id] ?? null);
  const [matchReason, setMatchReason] = useState<string>("");
  const [reasonLoading, setReasonLoading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // Load profile from Supabase only if not a mock profile
  useEffect(() => {
    if (MOCK_PROFILES[id]) return;

    // Real Supabase profile — fetch via the candidates list and find by id
    fetch("/api/ai/match/candidates")
      .then((r) => r.json())
      .then((data) => {
        const found = (data.matches as MatchCandidate[])?.find((m) => m.id === id);
        if (found) setProfile(found);
      })
      .catch(() => {});
  }, [id]);

  // Once we have the profile, generate the match reason
  useEffect(() => {
    if (!profile) return;

    async function fetchReason() {
      setReasonLoading(true);
      try {
        const r = await fetch("/api/ai/match/reason", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matchName: profile!.name,
            matchAge: profile!.age,
            matchCity: profile!.city,
            matchFitness: profile!.fitness,
            matchInterests: profile!.interests,
            matchBio: profile!.bio,
          }),
        });
        const data = await r.json();
        if (data.reason) setMatchReason(data.reason);
      } catch {
        // ignore fetch errors
      } finally {
        setReasonLoading(false);
      }
    }

    fetchReason();
  }, [profile]);

  if (!profile) {
    return (
      <div style={{
        fontFamily: "var(--font-lexend), sans-serif",
        padding: "4rem 2rem",
        textAlign: "center",
        color: "#727973",
        fontSize: "1.125rem",
      }}>
        Loading profile…
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: "var(--font-lexend), sans-serif",
      color: "#173124",
      maxWidth: "760px",
      margin: "0 auto",
      padding: "2.5rem 2rem",
    }}>

      {/* Back link */}
      <Link href="/match" style={{
        color: "#727973",
        textDecoration: "none",
        fontSize: "0.9rem",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        marginBottom: "2rem",
      }}>
        ← Back to Matches
      </Link>

      {/* Profile header */}
      <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start", marginBottom: "2.5rem" }}>
        <div style={{
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          backgroundColor: "#173124",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-epilogue), serif",
          fontWeight: 800,
          fontSize: "2rem",
          flexShrink: 0,
        }}>
          {profile.initials}
        </div>
        <div>
          <h1 style={{
            fontFamily: "var(--font-epilogue), serif",
            fontWeight: 800,
            fontSize: "2.25rem",
            color: "#173124",
            marginBottom: "0.25rem",
            letterSpacing: "-0.02em",
          }}>
            {profile.name}, {profile.age}
          </h1>
          <p style={{ fontSize: "1.125rem", color: "#727973", marginBottom: "0.75rem" }}>
            {profile.city}, Arizona
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <span style={{
              backgroundColor: "#735C00",
              color: "#FFFFFF",
              fontSize: "0.85rem",
              fontWeight: 600,
              padding: "0.3rem 1rem",
              borderRadius: "3rem",
              textTransform: "capitalize",
            }}>
              {profile.fitness} Fitness
            </span>
            <span style={{
              fontFamily: "var(--font-epilogue), serif",
              fontWeight: 700,
              fontSize: "1.125rem",
              color: "#735C00",
            }}>
              {profile.matchPct}% match
            </span>
          </div>
        </div>
      </div>

      {/* ── AI Match Reason ─────────────────────────────────────────────── */}
      <div style={{
        backgroundColor: "#E7F5ED",
        border: "2px solid #A8D5B5",
        borderRadius: "1.5rem",
        padding: "1.25rem 1.5rem",
        marginBottom: "2rem",
      }}>
        <p style={{
          fontSize: "0.75rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "#1A5C30",
          marginBottom: "0.5rem",
        }}>
          ✦ Why You&apos;d Connect
        </p>
        {reasonLoading ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              backgroundColor: "#173124",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-epilogue), serif",
              fontWeight: 700,
              fontSize: "0.65rem",
              flexShrink: 0,
            }}>
              Jo
            </div>
            <p style={{ fontSize: "1rem", color: "#4A5C50", fontStyle: "italic" }}>
              Jo is thinking about this match…
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
            <div style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              backgroundColor: "#173124",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-epilogue), serif",
              fontWeight: 700,
              fontSize: "0.65rem",
              flexShrink: 0,
              marginTop: "2px",
            }}>
              Jo
            </div>
            <p style={{ fontSize: "1.0625rem", lineHeight: 1.7, color: "#173124" }}>
              {matchReason || `You and ${profile.name} share interests that could make for a wonderful friendship here in Arizona. 🌻`}
            </p>
          </div>
        )}
      </div>

      {/* Interests */}
      <div style={{ marginBottom: "2rem" }}>
        <p style={{
          fontSize: "0.875rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "#735C00",
          marginBottom: "0.875rem",
        }}>
          Interests
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
          {profile.interests.map((interest) => (
            <span key={interest} style={{
              backgroundColor: "#E5E0D5",
              border: "2px solid #C2C8C2",
              color: "#173124",
              fontSize: "1rem",
              fontWeight: 500,
              padding: "0.375rem 1rem",
              borderRadius: "3rem",
            }}>
              {interest}
            </span>
          ))}
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <div style={{ marginBottom: "2.5rem" }}>
          <p style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "#735C00",
            marginBottom: "0.875rem",
          }}>
            About {profile.name}
          </p>
          <p style={{ fontSize: "1.125rem", lineHeight: 1.75, color: "#4A5C50" }}>
            {profile.bio}
          </p>
        </div>
      )}

      {/* Connect card */}
      <div className="card-base" style={{ marginBottom: "1.5rem" }}>
        <p style={{
          fontSize: "0.875rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "#735C00",
          marginBottom: "1.25rem",
        }}>
          Reach Out to {profile.name}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {profile.phone && (
            <>
              <a href={`sms:+1${profile.phone}`} style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                backgroundColor: "#F8F3E8",
                border: "2px solid #C2C8C2",
                borderRadius: "1.5rem",
                padding: "1rem 1.5rem",
                textDecoration: "none",
                color: "#173124",
                fontSize: "1.125rem",
                fontWeight: 600,
                minHeight: "56px",
              }}>
                <span style={{ fontSize: "1.5rem" }}>📱</span>
                Send a Text
              </a>
              <a href={`tel:+1${profile.phone}`} style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                backgroundColor: "#F8F3E8",
                border: "2px solid #C2C8C2",
                borderRadius: "1.5rem",
                padding: "1rem 1.5rem",
                textDecoration: "none",
                color: "#173124",
                fontSize: "1.125rem",
                fontWeight: 600,
                minHeight: "56px",
              }}>
                <span style={{ fontSize: "1.5rem" }}>📞</span>
                Give a Call
              </a>
            </>
          )}
          <Link href="/sessions" style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            backgroundColor: "#F8F3E8",
            border: "2px solid #C2C8C2",
            borderRadius: "1.5rem",
            padding: "1rem 1.5rem",
            textDecoration: "none",
            color: "#173124",
            fontSize: "1.125rem",
            fontWeight: 600,
            minHeight: "56px",
          }}>
            <span style={{ fontSize: "1.5rem" }}>📹</span>
            Video Session
          </Link>

          <Link href="/sessions" style={{
            backgroundColor: "#173124",
            color: "#FFFFFF",
            fontWeight: 600,
            padding: "1rem 2rem",
            borderRadius: "3rem",
            fontSize: "1.125rem",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "56px",
            width: "100%",
          }}>
            Plan a Meetup with {profile.name}
          </Link>
        </div>
      </div>

      {/* Report */}
      <p style={{ textAlign: "center" }}>
        <button
          onClick={() => setReportOpen(true)}
          style={{
            background: "none",
            border: "none",
            color: "#727973",
            fontSize: "0.875rem",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Report this person
        </button>
      </p>

      {/* Report confirmation dialog */}
      {reportOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50,
        }}>
          <div style={{
            backgroundColor: "#FEF9ED",
            borderRadius: "2rem",
            padding: "2rem",
            maxWidth: "400px",
            width: "90%",
          }}>
            <h2 style={{
              fontFamily: "var(--font-epilogue), serif",
              fontWeight: 800,
              fontSize: "1.5rem",
              color: "#173124",
              marginBottom: "1rem",
            }}>
              Report this person?
            </h2>
            <p style={{ fontSize: "1rem", lineHeight: 1.6, color: "#4A5C50", marginBottom: "1.5rem" }}>
              Are you sure you want to report {profile.name}? Our team will review within 24 hours.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                onClick={() => setReportOpen(false)}
                style={{
                  backgroundColor: "#173124",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "3rem",
                  padding: "0.875rem 1.5rem",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  minHeight: "48px",
                }}
              >
                Confirm Report
              </button>
              <button
                onClick={() => setReportOpen(false)}
                style={{
                  backgroundColor: "transparent",
                  color: "#173124",
                  border: "2px solid #C2C8C2",
                  borderRadius: "3rem",
                  padding: "0.875rem 1.5rem",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  minHeight: "48px",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
