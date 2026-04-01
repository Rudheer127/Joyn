"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mic, Square, Send } from "lucide-react";

function ConsultationInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isClient] = useState(true);
  const [userName, setUserName] = useState("Friend");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasSentInitial = useRef(false);

  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const { messages, status, sendMessage } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ai/consultation" }),
    onFinish: ({ message }) => {
      if (!voiceEnabled) return;   // only speak if user opted in
      const text = message.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join(" ");
      speak(text);
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/sign-in"); return; }
      supabase.from("profiles").select("full_name").eq("id", user.id).single()
        .then(({ data }) => { if (data?.full_name) setUserName(data.full_name.split(" ")[0]); });
    });

    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SR = (window as Window & typeof globalThis & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition
        || (window as Window & typeof globalThis & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
      if (SR) {
        recognitionRef.current = new SR();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
          }
          if (finalTranscript) setInputValue((prev) => prev ? prev + " " + finalTranscript : finalTranscript);
        };
        recognitionRef.current.onerror = () => setIsListening(false);
        recognitionRef.current.onend = () => setIsListening(false);
      }
    }
  }, [router]);

  // Pre-fill the input automatically if ?q= is provided from dashboard
  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !hasSentInitial.current) {
      hasSentInitial.current = true;
      setInputValue(q);
    }
  }, [searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/\*\*.*?\*\*/g, "").replace(/\[.*?\]/g, "");
    if (!cleanText.trim()) return;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }

  function toggleListening() {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }
    else {
      window.speechSynthesis.cancel();
      try { recognitionRef.current?.start(); setIsListening(true); } catch (e) { console.error(e); }
    }
  }

  function handlePreset(text: string) { sendMessage({ text }); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;
    sendMessage({ text: trimmed });
    setInputValue("");
  }

  if (!isClient) return null;

  return (
    <div style={{
      minHeight: "100vh", backgroundColor: "#F8F3E8",
      fontFamily: "var(--font-lexend), sans-serif", color: "#173124",
      display: "flex", flexDirection: "column"
    }}>
      {/* Top Banner */}
      <div style={{ backgroundColor: "#173124", padding: "1rem 2rem", color: "#FFFFFF", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <img src="/joyn-logo.svg" alt="JOYN" style={{ height: "32px", filter: "brightness(0) invert(1)" }} />
          <span style={{ fontFamily: "var(--font-epilogue), serif", fontWeight: 700, fontSize: "1.125rem", color: "rgba(255,255,255,0.85)" }}>
            Chat with Jo
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            onClick={() => {
              const next = !voiceEnabled;
              setVoiceEnabled(next);
              if (!next) window.speechSynthesis?.cancel();
            }}
            title={voiceEnabled ? "Voice is ON — click to turn off" : "Voice is OFF — click to turn on"}
            style={{
              color: "#FFFFFF", background: voiceEnabled ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.12)",
              border: "1.5px solid rgba(255,255,255,0.4)", padding: "0.4rem 0.9rem", borderRadius: "2rem",
              cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem"
            }}
          >
            {voiceEnabled ? "🔊 Voice On" : "🔇 Voice Off"}
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              color: "#FFFFFF", background: "rgba(255,255,255,0.2)",
              border: "none", padding: "0.5rem 1rem", borderRadius: "2rem",
              cursor: "pointer", fontSize: "0.9rem", fontWeight: 600
            }}
          >
            Skip to Dashboard
          </button>
        </div>
      </div>

      {/* Consent Notice */}
      <div style={{ backgroundColor: "#FEF9ED", padding: "0.75rem", textAlign: "center", fontSize: "0.85rem", color: "#735C00", borderBottom: "1px solid #E7E2D7" }}>
        <strong>Note:</strong> You are chatting with Jo, an AI companion. This is not a medical service.
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", marginTop: "2rem", marginBottom: "2rem" }}>
            <div style={{
              width: "60px", height: "60px", borderRadius: "50%",
              backgroundColor: "#173124", color: "#FFF",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "2rem", margin: "0 auto 1rem auto"
            }}>🌻</div>
            <h2 style={{ fontFamily: "var(--font-epilogue), serif", fontSize: "1.75rem", marginBottom: "0.5rem" }}>
              Hi {userName}, I&apos;m Jo.
            </h2>
            <p style={{ color: "#727973", fontSize: "1.1rem", maxWidth: "400px", margin: "0 auto" }}>
              What brings you here today? Choose an option below, type your answer, or use the microphone to talk to me.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center", marginTop: "2rem", maxWidth: "500px", margin: "2rem auto 0 auto" }}>
              {[
                "I recently moved to a new place",
                "I've been going through a difficult time",
                "I'm looking for a walking buddy",
                "I'd love a friend to stay in touch with",
              ].map(preset => (
                <button
                  key={preset}
                  onClick={() => handlePreset(preset)}
                  style={{
                    backgroundColor: "#FFFFFF", color: "#173124",
                    border: "2px solid #E7E2D7", padding: "0.75rem 1.25rem",
                    borderRadius: "2rem", fontSize: "0.95rem", cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "#173124"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "#E7E2D7"}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => {
          const textParts = m.parts.filter((p): p is { type: "text"; text: string } => p.type === "text");
          const toolParts = m.parts.filter((p) => (p.type as string).startsWith("tool-"));
          const rawText = textParts.map((p) => p.text).join("");

          // Break long assistant messages into readable paragraphs
          const paragraphs = m.role === "assistant"
            ? rawText
                .split(/\n{2,}|(?<=[\.\!\?])\s{2,}/)  // split on blank lines or double-space after sentence
                .map(s => s.trim())
                .filter(Boolean)
            : [rawText];

          return (
            <div key={m.id} style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "78%",
              backgroundColor: m.role === "user" ? "#173124" : "#FFFFFF",
              color: m.role === "user" ? "#FFFFFF" : "#173124",
              padding: "1rem 1.25rem",
              borderRadius: "1.5rem",
              borderBottomRightRadius: m.role === "user" ? "0.25rem" : "1.5rem",
              borderBottomLeftRadius: m.role === "assistant" ? "0.25rem" : "1.5rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              fontSize: "1.05rem",
              lineHeight: 1.6,
              border: m.role === "assistant" ? "1px solid #E7E2D7" : "none"
            }}>
              {paragraphs.length > 1
                ? paragraphs.map((para, i) => (
                    <p key={i} style={{ margin: i === 0 ? 0 : "0.75rem 0 0 0" }}>{para}</p>
                  ))
                : (rawText || (!toolParts.length && <span style={{ fontStyle:"italic", color:"#727973" }}>Processing...</span>))
              }
              {toolParts.map((part, i) => {
                const toolName = (part.type as string).slice("tool-".length);
                return (
                  <div key={i} style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: m.role === "user" ? "#A3A7A3" : "#727973", fontStyle: "italic" }}>
                    {toolName === "updateSupabaseProfile" ? "✓ Saving your preferences securely..." : ""}
                    {toolName === "suggestLocalEvents" ? "✓ Finding local events for you..." : ""}
                  </div>
                );
              })}
            </div>
          );
        })}

        {isLoading && (
          <div style={{
            alignSelf: "flex-start", backgroundColor: "#FFFFFF",
            padding: "1rem 1.25rem", borderRadius: "1.5rem", borderBottomLeftRadius: "0.25rem",
            border: "1px solid #E7E2D7", color: "#727973"
          }}>
            Jo is thinking...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ backgroundColor: "#FFFFFF", padding: "1.5rem", borderTop: "2px solid #E7E2D7" }}>
        <form onSubmit={handleSubmit} style={{ maxWidth: "800px", margin: "0 auto", display: "flex", gap: "1rem" }}>
          <button
            type="button"
            onClick={toggleListening}
            style={{
              width: "56px", height: "56px", borderRadius: "50%",
              backgroundColor: isListening ? "#EB5757" : "#F2C94C",
              border: "none", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: isListening ? "#FFFFFF" : "#173124", flexShrink: 0
            }}
          >
            {isListening ? <Square size={24} /> : <Mic size={24} />}
          </button>

          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isListening ? "Listening..." : "Type your message here..."}
            style={{
              flex: 1, padding: "0 1.5rem", fontSize: "1.1rem",
              borderRadius: "2rem", border: "2px solid #E7E2D7",
              backgroundColor: "#F8F3E8", color: "#173124"
            }}
          />

          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            style={{
              width: "56px", height: "56px", borderRadius: "50%",
              backgroundColor: inputValue.trim() && !isLoading ? "#173124" : "#CCCCCC",
              border: "none", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: inputValue.trim() && !isLoading ? "pointer" : "not-allowed", color: "#FFFFFF", flexShrink: 0
            }}
          >
            <Send size={24} />
          </button>
        </form>
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


