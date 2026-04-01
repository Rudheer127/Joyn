"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function OnboardChoicePage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F5F0E8",
        fontFamily: "var(--font-lexend), sans-serif",
        color: "#173124",
      }}
    >
      {/* ── Top bar ── */}
      <div style={{ backgroundColor: "#FEF9ED", borderBottom: "1px solid #E7E2D7", padding: "1.25rem 2rem" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto", display: "flex", justifyContent: "center" }}>
          <span style={{ fontFamily: "var(--font-epilogue), serif", fontWeight: 700, fontSize: "1.25rem", color: "#173124" }}>
            JOYN
          </span>
        </div>
      </div>

      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "4rem 1.5rem" }}>
        <div style={{
          backgroundColor: "#FFFFFF",
          border: "2px solid #D4C9A8",
          borderRadius: "1.5rem",
          padding: "3rem 2rem",
          textAlign: "center",
          boxShadow: "0 8px 30px rgba(0,0,0,0.04)"
        }}>
          <div style={{
            width: "80px", height: "80px", borderRadius: "50%",
            backgroundColor: "#173124", display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 1.5rem", fontSize: "2.5rem"
          }}>
            🌻
          </div>
          
          <h1 style={{
            fontFamily: "var(--font-epilogue), serif", fontWeight: 800,
            fontSize: "2rem", color: "#173124", marginBottom: "0.5rem"
          }}>
            Hi! I'm Jo. Let's set up your profile together.
          </h1>
          
          <p style={{ fontSize: "1.125rem", color: "#727973", marginBottom: "2.5rem", lineHeight: 1.5 }}>
            Would you like to set up with my help (voice/chat) OR fill in the form yourself?
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <button
              onClick={() => router.push("/onboard/voice")}
              style={{
                backgroundColor: "#173124",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "3rem",
                padding: "1.25rem",
                fontSize: "1.125rem",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "var(--font-lexend), sans-serif",
                transition: "background-color 0.15s",
                boxShadow: "0 4px 12px rgba(23,49,36,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem"
              }}
            >
              🎤 Let's chat (Voice / Chat)
            </button>
            <button
              onClick={() => router.push("/onboard/manual")}
              style={{
                backgroundColor: "#FFFFFF",
                color: "#173124",
                border: "2px solid #D4C9A8",
                borderRadius: "3rem",
                padding: "1.25rem",
                fontSize: "1.125rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-lexend), sans-serif",
                transition: "background-color 0.15s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem"
              }}
            >
              📝 Fill in the form myself
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
