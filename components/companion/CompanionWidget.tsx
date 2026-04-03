"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isDemoMode } from "@/lib/demo/demoData";
import { createClient } from "@/lib/supabase/client";
import { UnifiedChatUI } from "./UnifiedChatUI";

// ─── Page-aware context labels ────────────────────────────────────────────────
const PAGE_CONTEXT: Record<string, { label: string; hint: string }> = {
  "/dashboard":  { label: "Dashboard",   hint: "The user is on their dashboard. Help them understand their matches or next steps." },
  "/match":      { label: "My Matches",  hint: "The user is browsing companion matches. Help them feel comfortable reaching out." },
  "/messages":   { label: "Messages",    hint: "The user is looking at their conversations. Help them write a warm first message." },
  "/profile":    { label: "Profile",     hint: "The user is editing their profile. Help them fill in key companionship information." },
  "/sessions":   { label: "Catch-Ups",   hint: "The user is scheduling catch-ups. Help them plan a comfortable first meeting." },
  "/events":     { label: "Events",      hint: "The user is browsing local Arizona events. Suggest ones good for a first meetup." },
  "/onboard":    { label: "Onboarding",  hint: "The user is completing first-time setup. Guide them warmly through the questions." },
};

function getPageContext(pathname: string) {
  const exact = PAGE_CONTEXT[pathname];
  if (exact) return exact;
  for (const [key, val] of Object.entries(PAGE_CONTEXT)) {
    if (pathname.startsWith(key + "/")) return val;
  }
  return { label: "Joyn", hint: "Help the user navigate or find a companion." };
}


export function CompanionWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const { label: pageLabel, hint: pageHint } = getPageContext(pathname);

  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [demoMode] = useState(() => isDemoMode());
  const [conversationId, setConversationId] = useState<string | null>(null);
  const supabaseRef = useRef(demoMode ? null : createClient());

  // Initialize conversation and persist conversationId to localStorage
  useEffect(() => {
    async function initializeConversation() {
      try {
        // Check localStorage first
        const storedId = localStorage.getItem("jo_conversation_id");
        if (storedId) {
          setConversationId(storedId);
          return;
        }

        if (demoMode) {
          const demoId = "demo-" + pathname.replace(/\//g, "-");
          setConversationId(demoId);
          return;
        }

        const supabase = supabaseRef.current;
        if (!supabase) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const response = await fetch("/api/ai/jo/start-conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageContext: pathname }),
        });

        if (!response.ok) return;

        const data = await response.json();
        setConversationId(data.conversation_id);
        localStorage.setItem("jo_conversation_id", data.conversation_id);
      } catch (error) {
        console.error("Error initializing conversation:", error);
      }
    }

    initializeConversation();
  }, [demoMode, pathname]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 480);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const panelStyle: React.CSSProperties = isMobile
    ? { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100vw", height: "100vh", borderRadius: 0, zIndex: 200 }
    : { position: "fixed", bottom: "24px", right: "24px", width: "480px", height: "680px", borderRadius: "2rem", zIndex: 200, boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)" };

  function handleExpand() {
    const url = `/consultation?cid=${conversationId}`;
    router.push(url);
    setIsOpen(false);
  }

  function handleClear() {
    localStorage.removeItem("jo_conversation_id");
    setConversationId(null);
  }

  if (!conversationId) {
    return null; // Wait for conversationId to load
  }

  return (
    <>
      {/* ── Collapsed trigger ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open Jo companion chat"
          style={{
            position: "fixed", bottom: "24px", right: "24px", zIndex: 200,
            width: "68px", height: "68px", borderRadius: "50%",
            backgroundColor: "#173124", color: "#FFFFFF", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-epilogue), serif", fontWeight: 700, fontSize: "1rem",
            boxShadow: "0 4px 20px rgba(23,49,36,0.35)",
            flexDirection: "column", gap: "2px", transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = "0 6px 28px rgba(23,49,36,0.45)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(23,49,36,0.35)"; }}
        >
          <span style={{ fontSize: "1rem", fontWeight: 700 }}>Jo</span>
          <span style={{
            width: "8px", height: "8px", borderRadius: "50%",
            backgroundColor: "#4CAF50", display: "block",
            animation: "jo-pulse 2s ease-in-out infinite",
          }} />
        </button>
      )}

      {/* ── Expanded panel ── */}
      {isOpen && (
        <div
          style={{
            ...panelStyle,
            display: "flex", flexDirection: "column",
          }}
        >
          <UnifiedChatUI
            mode="mini"
            conversationId={conversationId}
            pageContext={pageHint}
            isDemo={demoMode}
            onExpand={handleExpand}
            onClear={handleClear}
          />
        </div>
      )}

      <style>{`
        @keyframes jo-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
}
