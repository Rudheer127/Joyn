"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode, DEMO_USER } from "@/lib/demo/demoData";
import { UnifiedChatUI } from "@/components/companion/UnifiedChatUI";

function ConsultationInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userName, setUserName] = useState("Friend");

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
    setConversationId(null);
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
      <UnifiedChatUI
        mode="full"
        conversationId={conversationId}
        pageContext="Consultation"
        isDemo={isDemoMode()}
        onClear={handleClear}
        userName={userName}
        useVoiceOutput={false}
      />
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


