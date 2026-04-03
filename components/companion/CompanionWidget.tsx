"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isDemoMode } from "@/lib/demo/demoData";

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

// ─── Quick action chips ────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: "I feel lonely",        text: "I feel lonely today",               nav: null },
  { label: "I feel weak",          text: "I've been feeling weak lately",      nav: null },
  { label: "Show my matches",      text: "Show me my matches",                  nav: "/match" },
  { label: "Go to messages",       text: "Take me to my messages",              nav: "/messages" },
  { label: "Find events",          text: "Find events near me",                 nav: "/events" },
  { label: "Update my profile",    text: "I want to update my profile",         nav: "/profile" },
  { label: "I need help",          text: "I need help with something",          nav: null },
];

// ─── Client-side user intent → navigation ───────────────────────────────────
// Two-part match: msg needs a NAV verb AND a page keyword (anywhere in sentence)
const NAV_INTENT = /\b(go|open|take|show|find|navigate|view|see|bring|load|visit|check)\b/i;
const USER_NAV_PATTERNS: { keyword: RegExp; route: string }[] = [
  { keyword: /\bevents?\b/i,                                        route: "/events"   },
  { keyword: /\bmatches\b|\bcompanions?\b|\bcompanion\s+page\b/i,   route: "/match"    },
  { keyword: /\bmessages?\b|\binbox\b|\bconversations?\b/i,         route: "/messages" },
  { keyword: /\bprofile\b/i,                                        route: "/profile"  },
  { keyword: /\bdashboard\b|\bhome\s+page\b/i,                      route: "/dashboard"},
  { keyword: /\bcatch.?ups?\b|\bsessions?\b|\bschedule\b/i,         route: "/sessions" },
];

export function CompanionWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const { label: pageLabel, hint: pageHint } = getPageContext(pathname);

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    setDemoMode(isDemoMode());
  }, []);

  const WELCOME_MESSAGE: UIMessage = {
    id: "companion-welcome",
    role: "assistant",
    parts: [{
      type: "text",
      text: `Hi there! 😊 I'm Jo, your Joyn guide. I can see you're on the ${pageLabel} page — how can I help you today? Use the quick buttons below, or just type anything.`,
    }],
  };

  const { messages, sendMessage, status } = useChat({
    id: "companion-chat",
    transport: new DefaultChatTransport({
      api: "/api/ai/companion",
      body: { pageContext: pageHint, isDemo: demoMode },
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



  // ── Text-based navigation keywords (fallback if tool call doesn't fire) ──
  const NAV_KEYWORDS: { patterns: RegExp[]; route: string }[] = [
    { patterns: [/\bmatches\b/i, /\bcompanions?\b/i, /\/match\b/i],  route: "/match" },
    { patterns: [/\bmessages\b/i, /\/messages\b/i],                   route: "/messages" },
    { patterns: [/\bevents\b/i, /\/events\b/i],                       route: "/events" },
    { patterns: [/\bprofile\b/i, /\/profile\b/i],                     route: "/profile" },
    { patterns: [/\bcatch.?ups?\b/i, /\bsessions\b/i],                route: "/sessions" },
    // NOTE: dashboard intentionally last and no broad /home/ to avoid false positives
    { patterns: [/\bdashboard\b/i, /\/dashboard\b/i],                 route: "/dashboard" },
  ];

  // Navigation is handled entirely client-side in handleSend (no server-side tool)

  function handleSend(text?: string) {
    const msg = (text ?? inputValue).trim();
    if (!msg || isStreaming) return;

    // ── Client-side navigation intercept ──
    // Jo sends the message to AI AND navigates immediately if intent is clear
    if (NAV_INTENT.test(msg)) {
      for (const { keyword, route } of USER_NAV_PATTERNS) {
        if (keyword.test(msg) && pathname !== route) {
          sendMessage({ text: msg });
          setInputValue("");
          setTimeout(() => { router.push(route); setIsOpen(false); }, 700);
          return;
        }
      }
    }

    sendMessage({ text: msg });
    setInputValue("");
    inputRef.current?.focus();
  }

  function handleQuickAction(action: typeof QUICK_ACTIONS[0]) {
    handleSend(action.text);
    if (action.nav) {
      setTimeout(() => {
        router.push(action.nav!);
        setIsOpen(false);
      }, 1200);
    }
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

  const bannerOffset = demoMode ? 40 : 0;
  const panelStyle: React.CSSProperties = isMobile
    ? { position: "fixed", top: bannerOffset, left: 0, right: 0, bottom: 0, width: "100vw", height: `calc(100vh - ${bannerOffset}px)`, borderRadius: 0, zIndex: 200 }
    : { position: "fixed", bottom: "24px", right: "24px", width: "min(400px, calc(100vw - 48px))", height: `min(560px, calc(100vh - ${48 + bannerOffset}px))`, borderRadius: "2rem", zIndex: 200 };

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
          aria-label="Jo companion chat"
          aria-modal="true"
          style={{
            ...panelStyle,
            backgroundColor: "#FEF9ED",
            border: isMobile ? "none" : "2px solid #C2C8C2",
            display: "flex", flexDirection: "column",
            boxShadow: isMobile ? "none" : "0 8px 40px rgba(23,49,36,0.2)",
            overflow: "hidden", fontFamily: "var(--font-lexend), sans-serif",
          }}
        >
          {/* Header */}
          <div style={{
            backgroundColor: "#173124", padding: "1rem 1.25rem",
            display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-epilogue), serif", fontWeight: 700, fontSize: "1rem",
                color: "#FFFFFF", flexShrink: 0, position: "relative",
              }}>
                Jo
                <span style={{
                  position: "absolute", bottom: "2px", right: "2px",
                  width: "10px", height: "10px", borderRadius: "50%",
                  backgroundColor: "#4CAF50", border: "2px solid #173124",
                }} />
              </div>
              <div>
                <p style={{ color: "#FFFFFF", fontWeight: 600, fontSize: "1.125rem", lineHeight: 1.2, margin: 0 }}>Jo</p>
                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.8rem", margin: 0 }}>
                  Here on {pageLabel} · Always ready to help
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close Jo companion chat"
              style={{
                width: "44px", height: "44px", borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.1)", border: "none",
                color: "#FFFFFF", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: "1.375rem",
                transition: "background-color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"; }}
            >
              ×
            </button>
          </div>

          {/* Message list */}
          <div
            aria-live="polite"
            aria-label="Conversation with Jo"
            style={{
              flex: 1, overflowY: "auto", padding: "1.25rem",
              display: "flex", flexDirection: "column", gap: "1rem",
            }}
          >
            {messages.map((message, index) => {
              const isBot = message.role === "assistant";
              const text = message.parts
                .filter((p): p is { type: "text"; text: string } => p.type === "text")
                .map((p) => p.text)
                .join("")
                .replace(/<function=[^>]*>[\s\S]*?<\/function>/g, "")
                .replace(/\{"route":"[^"]*"\}/g, "")
                .replace(/^[\s🌻☀️😊]*(?:one moment|just a moment|let me check|sure!?|just a sec)[.…!]*\s*/i, "")
                .trim();

              return (
                <div key={message.id} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div
                    style={{
                    display: "flex",
                    flexDirection: isBot ? "row" : "row-reverse",
                    alignItems: "flex-end", gap: "0.5rem",
                  }}
                >
                  {isBot && (
                    <div style={{
                      width: "34px", height: "34px", borderRadius: "50%",
                      backgroundColor: "#173124", color: "#FFFFFF",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "var(--font-epilogue), serif", fontWeight: 700,
                      fontSize: "0.75rem", flexShrink: 0,
                    }}>
                      Jo
                    </div>
                  )}
                  <div style={{
                    maxWidth: "80%",
                    backgroundColor: isBot ? "#E7E2D7" : "#173124",
                    color: isBot ? "#173124" : "#FFFFFF",
                    border: isBot ? "2px solid #C2C8C2" : "none",
                    borderRadius: isBot ? "0.375rem 1.5rem 1.5rem 1.5rem" : "1.5rem 0.375rem 1.5rem 1.5rem",
                    padding: "0.875rem 1.125rem",
                    fontSize: "1rem",
                    lineHeight: 1.65,
                    // hide the bubble entirely if it has no content yet (streaming dots cover it)
                    display: (!text && isBot && index === messages.length - 1 && isStreaming) ? "none" : undefined,
                  }}>
                    {text}
                  </div>
                </div>

                {/* Inline Quick Questions after the very first welcome message */}
                {index === 0 && messages.length < 3 && (
                  <div style={{ paddingLeft: "42px", marginTop: "0.5rem" }}>
                    <p style={{
                      fontSize: "0.7rem", fontWeight: 700, color: "#727973",
                      textTransform: "uppercase", letterSpacing: "0.06em",
                      margin: "0 0 0.5rem 0"
                    }}>Quick questions</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                      {QUICK_ACTIONS.map((action) => (
                        <button
                          key={action.label}
                          onClick={() => handleQuickAction(action)}
                          style={{
                            backgroundColor: "#FFFFFF",
                            border: "1.5px solid #C2C8C2",
                            borderRadius: "2rem",
                            padding: "0.35rem 0.85rem",
                            fontSize: "0.85rem",
                            color: "#173124",
                            cursor: "pointer",
                            fontFamily: "var(--font-lexend), sans-serif",
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                            transition: "background-color 0.15s, border-color 0.15s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F8F3E8"; e.currentTarget.style.borderColor = "#173124"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#FFFFFF"; e.currentTarget.style.borderColor = "#C2C8C2"; }}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              );
            })}

            {/* Typing indicator */}
            {isStreaming && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem" }}>
                <div style={{
                  width: "34px", height: "34px", borderRadius: "50%",
                  backgroundColor: "#173124", color: "#FFFFFF",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-epilogue), serif", fontWeight: 700, fontSize: "0.75rem", flexShrink: 0,
                }}>Jo</div>
                <div style={{
                  backgroundColor: "#E7E2D7", border: "2px solid #C2C8C2",
                  borderRadius: "0.375rem 1.5rem 1.5rem 1.5rem",
                  padding: "0.875rem 1.125rem", display: "flex", gap: "0.35rem", alignItems: "center",
                }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{
                      width: "7px", height: "7px", borderRadius: "50%",
                      backgroundColor: "#727973",
                      animation: `jo-dot 1.2s ease ${i * 0.2}s infinite alternate`,
                    }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div style={{
            padding: "0.75rem 1rem",
            borderTop: "2px solid #C2C8C2",
            backgroundColor: "#F8F3E8",
            display: "flex", gap: "0.5rem", alignItems: "flex-end", flexShrink: 0,
          }}>
            {/* Mic button */}
            <button
              onClick={toggleMic}
              aria-label={isListening ? "Stop voice input" : "Speak to Jo"}
              title={isListening ? "Listening… tap to stop" : "Tap to speak"}
              style={{
                width: "48px", height: "48px", borderRadius: "50%", flexShrink: 0,
                backgroundColor: isListening ? "#E53E3E" : "#E7E2D7",
                border: `2px solid ${isListening ? "#E53E3E" : "#C2C8C2"}`,
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "1.125rem",
                animation: isListening ? "mic-pulse 1s ease-in-out infinite" : "none",
              }}
            >
              🎤
            </button>

            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isStreaming ? "Jo is thinking…" : "Type or use mic…"}
              disabled={isStreaming}
              rows={1}
              aria-label="Message Jo"
              style={{
                flex: 1, resize: "none", border: "2px solid #C2C8C2",
                borderRadius: "1rem", padding: "0.75rem 1rem",
                fontFamily: "var(--font-lexend), sans-serif", fontSize: "1rem",
                color: "#173124", backgroundColor: "#FFFFFF",
                minHeight: "48px", maxHeight: "120px", lineHeight: 1.5, outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#173124"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#C2C8C2"; }}
            />
            <button
              onClick={() => handleSend()}
              disabled={sendDisabled}
              aria-label="Send message"
              style={{
                width: "48px", height: "48px", borderRadius: "50%",
                backgroundColor: sendDisabled ? "#C2C8C2" : "#173124",
                color: "#FFFFFF", border: "none",
                cursor: sendDisabled ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.25rem", flexShrink: 0, transition: "background-color 0.15s",
              }}
            >
              ↑
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes jo-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes jo-dot {
          0% { opacity: 0.3; transform: translateY(0); }
          100% { opacity: 1; transform: translateY(-4px); }
        }
        @keyframes mic-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(229,62,62,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(229,62,62,0); }
        }
      `}</style>
    </>
  );
}
