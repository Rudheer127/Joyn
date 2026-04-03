"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode, DEMO_USER } from "@/lib/demo/demoData";
import { UnifiedChatUI } from "@/components/companion/UnifiedChatUI";

function ConsultationInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userName, setUserName] = useState("Friend");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  // key to force remount on clear
  const [chatKey, setChatKey] = useState(0);

  // Get conversationId from URL or localStorage
  useEffect(() => {
    const cid = searchParams.get("cid");
    if (cid) {
      setConversationId(cid);
      localStorage.setItem("jo_conversation_id", cid);
      return;
    }

    // Fall back to localStorage
    const storedId = localStorage.getItem("jo_conversation_id");
    if (storedId) {
      setConversationId(storedId);
      return;
    }

    // Generate new ID if none exists
    const newId = "conv-" + Date.now();
    setConversationId(newId);
    localStorage.setItem("jo_conversation_id", newId);
  }, [searchParams]);

  // Fetch user name
  useEffect(() => {
    if (isDemoMode()) {
      setUserName(DEMO_USER.full_name.split(" ")[0]);
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/sign-in");
        return;
      }
      supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.full_name) setUserName(data.full_name.split(" ")[0]);
        });
    });
  }, [router]);

  function handleClear() {
    localStorage.removeItem("jo_conversation_id");
    const newId = "conv-" + Date.now();
    setConversationId(newId);
    localStorage.setItem("jo_conversation_id", newId);
    setChatKey(prev => prev + 1);
  }

  if (!conversationId) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#F8F3E8", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Loading chat...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#F8F3E8",
      fontFamily: "var(--font-lexend), sans-serif",
      color: "#173124",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* ── Top header bar ── */}
      <div style={{
        backgroundColor: "#173124",
        padding: "0.875rem 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <img src="/joyn-logo.svg" alt="JOYN" style={{ height: "28px", filter: "brightness(0) invert(1)" }} />
          <span style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600, fontSize: "1.1rem" }}>Chat with Jo</span>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            onClick={() => setVoiceEnabled(v => !v)}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.5rem 1rem", borderRadius: "2rem",
              border: "1.5px solid rgba(255,255,255,0.35)",
              backgroundColor: voiceEnabled ? "rgba(255,255,255,0.18)" : "transparent",
              color: "#FFFFFF", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer",
              fontFamily: "var(--font-lexend), sans-serif",
            }}
          >
            {voiceEnabled ? "🔊 Voice On" : "🔇 Voice Off"}
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.5rem 1.25rem", borderRadius: "2rem",
              border: "none",
              backgroundColor: "#E8C84A",
              color: "#173124", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer",
              fontFamily: "var(--font-lexend), sans-serif",
            }}
          >
            Skip to Dashboard →
          </button>
        </div>
      </div>

      {/* ── Disclaimer banner ── */}
      <div style={{
        backgroundColor: "#FEF9F0",
        borderBottom: "1px solid #E8D9C0",
        padding: "0.625rem 2rem",
        textAlign: "center",
      }}>
        <p style={{ fontSize: "0.875rem", color: "#735C00", margin: 0 }}>
          <strong>Note:</strong> You are chatting with Jo, an AI companion. This is not a medical service.
        </p>
      </div>

      {/* ── Chat area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <UnifiedChatUI
          key={chatKey}
          mode="full"
          conversationId={conversationId}
          pageContext="Consultation"
          isDemo={isDemoMode()}
          onClear={handleClear}
          userName={userName}
          useVoiceOutput={voiceEnabled}
        />
      </div>
    </div>
  );
}

export default function ConsultationPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "#F8F3E8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-lexend), sans-serif", color: "#173124" }}>Loading...</div>}>
      <ConsultationInner />
    </Suspense>
  );
}
