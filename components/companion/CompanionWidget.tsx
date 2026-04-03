"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isDemoMode } from "@/lib/demo/demoData";
import { createClient } from "@/lib/supabase/client";

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

/**
 * Generate dynamic suggestions based on conversation state
 * (NOT hardcoded presets)
 */
function generateSuggestedOptions(
  statePhase: string,
  lastTopic: string | null,
  lastIntent: string | null
): Array<{ label: string; text: string; nav?: string | null }> {
  // Generate suggestions based on state and context
  const suggestions: Array<{ label: string; text: string; nav?: string | null }> = [];

  if (statePhase === "greeting") {
    suggestions.push(
      { label: "Show my matches", text: "Can you show me some matches?" },
      { label: "What are events?", text: "What events are happening near me?" },
      { label: "Help me get started", text: "Help me get started with Joyn" }
    );
  } else if (statePhase === "awaiting_choice") {
    if (lastTopic === "matches") {
      suggestions.push(
        { label: "More matches", text: "Show me more matches" },
        { label: "Message one", text: "I'd like to message someone" }
      );
    } else if (lastTopic === "events") {
      suggestions.push(
        { label: "More events", text: "Show me more events" },
        { label: "Tell me more", text: "Tell me about one of these events" }
      );
    } else {
      suggestions.push(
        { label: "Browse matches", text: "Show me some matches" },
        { label: "Find events", text: "What events are near me?" }
      );
    }
  } else if (statePhase === "answering_question") {
    suggestions.push(
      { label: "Next steps", text: "What should I do next?" },
      { label: "Go back", text: "Take me back to the beginning" }
    );
  } else if (statePhase === "clarifying") {
    suggestions.push(
      { label: "Let me clarify", text: "Let me explain that better" },
      { label: "Try again", text: "Can you ask that differently?" }
    );
  } else {
    // Default fallback for other states
    suggestions.push(
      { label: "Show my matches", text: "Show me my matches" },
      { label: "Find events", text: "Find events near me" }
    );
  }

  return suggestions.slice(0, 4); // Limit to 4 suggestions
}

export function CompanionWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const { label: pageLabel, hint: pageHint } = getPageContext(pathname);

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [demoMode] = useState(() => isDemoMode());
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(true);
  const [suggestedOptions, setSuggestedOptions] = useState<Array<{ label: string; text: string; nav?: string | null }>>([]);
  const [conversationState, setConversationState] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const supabaseRef = useRef(demoMode ? null : createClient());

  const WELCOME_MESSAGE: UIMessage = {
    id: "companion-welcome",
    role: "assistant",
    parts: [{
      type: "text",
      text: `Hi there! 😊 I'm Jo, your Joyn guide. I can see you're on the ${pageLabel} page — how can I help you today?`,
    }],
  };

  // Initialize conversation on mount
  useEffect(() => {
    async function initializeConversation() {
      try {
        if (demoMode) {
          setConversationId("demo-" + pathname.replace(/\//g, "-"));
          setSuggestedOptions(generateSuggestedOptions("greeting", null, null));
          setIsLoadingConversation(false);
          return;
        }

        const supabase = supabaseRef.current;
        if (!supabase) {
          setIsLoadingConversation(false);
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoadingConversation(false);
          return;
        }

        const response = await fetch("/api/ai/jo/start-conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageContext: pathname }),
        });

        if (!response.ok) {
          console.error("Failed to start conversation:", response.statusText);
          setIsLoadingConversation(false);
          return;
        }

        const data = await response.json();
        setConversationId(data.conversation_id);
        setSuggestedOptions(generateSuggestedOptions("greeting", null, null));
      } catch (error) {
        console.error("Error initializing conversation:", error);
      } finally {
        setIsLoadingConversation(false);
      }
    }

    initializeConversation();
  }, [demoMode, pathname]);

  const { messages, sendMessage, status } = useChat({
    id: pathname,
    transport: new DefaultChatTransport({
      api: "/api/ai/companion",
      body: { pageContext: pageHint, isDemo: demoMode, conversationId },
    }),
    messages: [WELCOME_MESSAGE],
  });

  const isStreaming = status === "streaming" || status === "submitted";

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 480);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Sync messages to database
  useEffect(() => {
    if (!conversationId || isLoadingConversation || demoMode) return;

    async function syncMessages() {
      for (const msg of messages) {
        if (msg.id === "companion-welcome" || msg.id?.startsWith("__")) continue;

        try {
          await fetch("/api/ai/jo/send-message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              conversationId,
              sender: msg.role === "user" ? "user" : "assistant",
              messageText: ((msg.parts?.[0] as any)?.text || (msg.parts as any)?.[0]?.toString?.() || "").toString(),
              metadata: { parts: msg.parts },
            }),
          });
        } catch (error) {
          console.error("Error syncing message:", error);
        }
      }
    }

    syncMessages();
  }, [messages, conversationId, isLoadingConversation, demoMode]);

  // Fetch conversation state and generate suggestions
  useEffect(() => {
    async function fetchConversationState() {
      if (!conversationId || demoMode) {
        return;
      }

      try {
        const response = await fetch(`/api/ai/jo/get-conversation?conversationId=${conversationId}`);
        if (!response.ok) return;

        const data = await response.json();
        setConversationState(data.state);

        // Generate suggestions based on unified state
        const statePhase = data.state?.state_phase || "greeting";
        const lastTopic = data.state?.last_topic || null;
        const lastIntent = data.state?.last_intent || null;

        const generatedOptions = generateSuggestedOptions(statePhase, lastTopic, lastIntent);
        setSuggestedOptions(generatedOptions);
      } catch (error) {
        console.error("Error fetching conversation state:", error);
      }
    }

    if (isOpen) {
      fetchConversationState();
    }
  }, [conversationId, isOpen, demoMode]);

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const panel = panelRef.current;
    if (!panel) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { setIsOpen(false); return; }
      if (e.key !== "Tab") return;
      const focusable = panel!.querySelectorAll<HTMLElement>('button, textarea, [href], [tabindex]:not([tabindex="-1"])');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
      else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const lastNavRef = useRef<string | null>(null);

  // Navigation detection
  useEffect(() => {
    const lastMessage = messages[messages.length - 1] as any;
    if (!lastMessage || lastMessage.role !== "assistant") return;
    if (lastMessage.id === lastNavRef.current) return;

    // Tool invocation detection (v6 pattern: tool-<toolName>)
    const toolParts = lastMessage.parts?.filter((p: any) => p.type?.startsWith("tool-")) || [];
    if (toolParts.length > 0) {
      const navPart = toolParts.find((p: any) => p.type === "tool-navigateTo");
      if (navPart) {
        const route = (navPart as any).result?.route || (navPart as any).args?.route;
        if (route) {
          lastNavRef.current = lastMessage.id;
          setTimeout(() => { router.push(route); setIsOpen(false); }, 800);
          return;
        }
      }
    }

    // Fallback: keyword scan in message text
    const text = (lastMessage.parts ?? [])
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text ?? "")
      .join(" ");

    const isNavIntent = /taking you|heading (there|over)|opening|navigating|going to|let.?s go/i.test(text);
    if (isNavIntent) {
      const navPatterns: Record<string, RegExp> = {
        '/match': /\b(match|companion)\b/i,
        '/messages': /\b(message|inbox)\b/i,
        '/events': /\b(event|activity)\b/i,
        '/profile': /\b(profile|account)\b/i,
        '/sessions': /\b(catch.?up|session)\b/i,
        '/dashboard': /\b(dashboard|home)\b/i,
      };

      for (const [route, pattern] of Object.entries(navPatterns)) {
        if (pattern.test(text) && pathname !== route) {
          lastNavRef.current = lastMessage.id;
          setTimeout(() => { router.push(route); setIsOpen(false); }, 1200);
          return;
        }
      }
    }
  }, [messages, router, pathname]);

  function handleSend(text?: string) {
    const msg = (text ?? inputValue).trim();
    if (!msg || isStreaming) return;

    sendMessage({ text: msg });
    setInputValue("");
    inputRef.current?.focus();
  }

  function handleQuickAction(action: typeof suggestedOptions[0]) {
    handleSend(action.text);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function toggleMic() {
    type SpeechRecognitionCtor = { new(): SpeechRecognition };
    const w = (typeof window !== "undefined")
      ? window as Window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }
      : null;
    const SpeechAPI = w?.SpeechRecognition ?? w?.webkitSpeechRecognition;
    if (!SpeechAPI) { alert("Voice input requires Chrome or Edge."); return; }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechAPI();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript: string = event.results[0][0].transcript;
      setInputValue((prev) => prev + (prev ? " " : "") + transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  const sendDisabled = !inputValue.trim() || isStreaming;

  const panelStyle: React.CSSProperties = isMobile
    ? { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100vw", height: "100vh", borderRadius: 0, zIndex: 200 }
    : { position: "fixed", bottom: "24px", right: "24px", width: "480px", height: "680px", borderRadius: "2rem", zIndex: 200, boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)" };

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
          ref={panelRef}
          role="dialog"
          aria-labelledby="jo-title"
          style={{
            ...panelStyle,
            display: "flex", flexDirection: "column", backgroundColor: "#FFFFFF", color: "#1a1a1a",
            fontFamily: "var(--font-epilogue), sans-serif",
          }}
        >
          {/* ── Header ── */}
          <div style={{
            padding: "16px 20px", borderBottom: "1px solid #e0e0e0",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <h2 id="jo-title" style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#173124" }}>
              Jo
            </h2>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                style={{
                  background: "none", border: "none", cursor: "pointer", padding: "4px",
                  fontSize: "1.5rem", color: "#666",
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* ── Messages ── */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex",
            flexDirection: "column", gap: "12px",
          }}>
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              return (
                <div key={msg.id || idx} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "85%", padding: "10px 14px", borderRadius: "12px",
                    backgroundColor: isUser ? "#173124" : "#f0f0f0",
                    color: isUser ? "#FFFFFF" : "#1a1a1a",
                    wordWrap: "break-word",
                  }}>
                    {msg.parts && Array.isArray(msg.parts) ? (
                      msg.parts.map((p: any, i: number) => {
                        if (p.type === "text") return <span key={i}>{p.text}</span>;
                        if (p.type?.startsWith("tool-")) return null; // Hide tool calls
                        return null;
                      })
                    ) : null}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* ── Quick actions ── */}
          {suggestedOptions.length > 0 && !isStreaming && (
            <div style={{
              padding: "0 20px 12px", display: "flex", flexDirection: "column", gap: "8px",
            }}>
              {suggestedOptions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickAction(action)}
                  disabled={isStreaming}
                  style={{
                    padding: "10px 14px", backgroundColor: "#f0f0f0", border: "1px solid #ddd",
                    borderRadius: "8px", cursor: isStreaming ? "not-allowed" : "pointer",
                    fontSize: "0.875rem", textAlign: "left", opacity: isStreaming ? 0.6 : 1,
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => !isStreaming && (e.currentTarget.style.backgroundColor = "#e0e0e0")}
                  onMouseLeave={(e) => !isStreaming && (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* ── Input ── */}
          <div style={{
            padding: "12px 20px 20px", borderTop: "1px solid #e0e0e0",
            display: "flex", gap: "8px",
          }}>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type something..."
              style={{
                flex: 1, padding: "10px 12px", border: "1px solid #ddd",
                borderRadius: "8px", fontFamily: "inherit", fontSize: "0.875rem",
                resize: "none", minHeight: "40px", maxHeight: "100px",
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={sendDisabled}
              style={{
                padding: "10px 16px", backgroundColor: sendDisabled ? "#ccc" : "#173124",
                color: "#FFFFFF", border: "none", borderRadius: "8px",
                cursor: sendDisabled ? "not-allowed" : "pointer", fontSize: "1rem",
              }}
            >
              Send
            </button>
            <button
              onClick={toggleMic}
              style={{
                padding: "10px 12px", backgroundColor: isListening ? "#f08080" : "#e0e0e0",
                border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "1rem",
              }}
            >
              🎤
            </button>
          </div>
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
