"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isDemoMode, DEMO_USER } from "@/lib/demo/demoData";
import { createClient } from "@/lib/supabase/client";
import { UnifiedChatUI } from "./UnifiedChatUI";

// ─── Page-aware context labels ────────────────────────────────────────────────
const PAGE_CONTEXT: Record<string, { label: string; hint: string }> = {
  "/dashboard":    { label: "Dashboard",       hint: "The user is on their dashboard. Help them understand their matches or next steps." },
  "/find":         { label: "Find Companions", hint: "The user is browsing companion profiles. Help them feel comfortable reaching out." },
  "/match":        { label: "My Matches",      hint: "The user is reviewing their matched companions. Help them decide who to contact." },
  "/messages":     { label: "Messages",        hint: "The user is looking at their conversations. Help them write a warm first message." },
  "/profile":      { label: "Profile",         hint: "The user is editing their profile. Help them fill in key companionship information." },
  "/sessions":     { label: "Catch-Ups",       hint: "The user is scheduling catch-ups. Help them plan a comfortable first meeting." },
  "/events":       { label: "Events",          hint: "The user is browsing local Arizona events. Suggest ones good for a first meetup." },
  "/onboard":      { label: "Onboarding",      hint: "The user is completing first-time setup. Guide them warmly through the questions." },
  "/consultation": { label: "Chat with Jo",    hint: "The user is on the full Jo chat page. They want a longer, meaningful conversation." },
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
  const { hint: pageHint } = getPageContext(pathname);

  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [demoMode] = useState(() => isDemoMode());
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Friend");
  // Increment to force-remount UnifiedChatUI after clearing
  const [chatKey, setChatKey] = useState(0);
  const supabaseRef = useRef(demoMode ? null : createClient());

  // ── Fetch user name once ──────────────────────────────────────────────────
  useEffect(() => {
    if (demoMode) {
      setUserName(DEMO_USER.full_name.split(" ")[0]);
      return;
    }
    const supabase = supabaseRef.current;
    if (!supabase) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single()
        .then(({ data }: { data: { full_name?: string } | null }) => {
          if (data?.full_name) setUserName(data.full_name.split(" ")[0]);
        });
    });
  }, [demoMode]);

  // ── Initialize / restore conversation ID ─────────────────────────────────
  useEffect(() => {
    async function initConversation() {
      try {
        const storedId = localStorage.getItem("jo_widget_conversation_id");
        if (storedId) { setConversationId(storedId); return; }

        if (demoMode) {
          const demoId = "demo-" + Date.now();
          setConversationId(demoId);
          localStorage.setItem("jo_widget_conversation_id", demoId);
          return;
        }

        const supabase = supabaseRef.current;
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const res = await fetch("/api/ai/jo/start-conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageContext: pathname }),
        });
        if (!res.ok) return;
        const data = await res.json();
        setConversationId(data.conversation_id);
        localStorage.setItem("jo_widget_conversation_id", data.conversation_id);
      } catch (err) {
        console.error("[CompanionWidget] conversation init error:", err);
      }
    }
    initConversation();
  }, [demoMode, pathname]);

  // ── Responsive ────────────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 480);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Don't render widget on the full consultation page
  if (pathname === "/consultation") return null;

  const panelStyle: React.CSSProperties = isMobile
    ? {
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        width: "100vw", height: "100vh", borderRadius: 0, zIndex: 200,
      }
    : {
        position: "fixed", bottom: "24px", right: "24px",
        width: "380px", height: "600px", borderRadius: "1.5rem",
        zIndex: 200, boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        overflow: "hidden",
      };

  function handleExpand() {
    router.push(conversationId ? `/consultation?cid=${conversationId}` : "/consultation");
    setIsOpen(false);
  }

  function handleClear() {
    localStorage.removeItem("jo_widget_conversation_id");
    const freshId = demoMode ? "demo-" + Date.now() : "conv-" + Date.now();
    setConversationId(freshId);
    if (!demoMode) localStorage.setItem("jo_widget_conversation_id", freshId);
    setChatKey(prev => prev + 1);
    // Widget stays OPEN
  }

  const effectiveId = conversationId ?? (demoMode ? "demo-init" : "conv-init");

  return (
    <>
      {/* ── FAB — always visible when closed ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open Jo companion chat"
          style={{
            position: "fixed", bottom: "24px", right: "24px", zIndex: 200,
            width: "68px", height: "68px", borderRadius: "50%",
            background: "linear-gradient(135deg, #173124 0%, #2D5240 100%)",
            color: "#FFFFFF", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: "3px",
            boxShadow: "0 4px 20px rgba(23,49,36,0.4)",
            transition: "transform 0.15s, box-shadow 0.15s",
            fontFamily: "var(--font-epilogue), serif",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 28px rgba(23,49,36,0.5)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(23,49,36,0.4)";
          }}
        >
          {/* Sunflower icon */}
          <span style={{ fontSize: "1.35rem", lineHeight: 1 }}>🌻</span>
          <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.04em", color: "#E8C84A" }}>
            Jo
          </span>
          {/* Online pulse dot */}
          <span style={{
            position: "absolute", top: "10px", right: "10px",
            width: "10px", height: "10px", borderRadius: "50%",
            backgroundColor: "#4ADE80",
            boxShadow: "0 0 0 2px #173124",
            animation: "jo-pulse 2s ease-in-out infinite",
          }} />
        </button>
      )}

      {/* ── Expanded chat panel ── */}
      {isOpen && (
        <div style={panelStyle}>
          <UnifiedChatUI
            key={chatKey}
            mode="mini"
            conversationId={effectiveId}
            pageContext={pageHint}
            isDemo={demoMode}
            userName={userName}
            onExpand={handleExpand}
            onClear={handleClear}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}

      <style>{`
        @keyframes jo-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
      `}</style>
    </>
  );
}
