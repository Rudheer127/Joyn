"use client";

import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { DEMO_MATCHES } from "@/lib/demo/demoData";

const mockPartners: Record<string, { name: string; initials: string; bio?: string }> = {
  "1": { name: "Margaret", initials: "MW", bio: "Retired schoolteacher in Phoenix. Loves gardening, reading, and long conversations over tea." },
  "2": { name: "Robert",   initials: "RJ", bio: "Former engineer in Scottsdale. Plays guitar, loves cooking, and is looking for good conversation." },
  "3": { name: "Dorothy",  initials: "DL", bio: "Watercolor painter in Tucson. Great pen pal for weekly video calls and sharing life stories." },
};

type Message = {
  id: string;
  content: string;
  fromMe: boolean;
  time: string;
};

const initialMessages: Record<string, Message[]> = {
  "1": [
    { id: "a1", content: "Hi Margaret! I saw we were matched and wanted to say hello 😊", fromMe: true, time: "10:02 AM" },
    { id: "a2", content: "Oh how lovely! I'm so glad you reached out. I've been hoping to find a friend to have tea with and just talk.", fromMe: false, time: "10:15 AM" },
    { id: "a3", content: "That sounds wonderful! I'd love that.", fromMe: false, time: "10:16 AM" },
  ],
  "2": [
    { id: "b1", content: "Robert, it's great to connect with you!", fromMe: true, time: "Yesterday" },
    { id: "b2", content: "Likewise! Always happy to meet someone new. Do you enjoy music at all?", fromMe: false, time: "Yesterday" },
  ],
  "3": [
    { id: "c1", content: "Dorothy, your watercolors sound beautiful!", fromMe: true, time: "8:30 AM" },
    { id: "c2", content: "Thank you! It gives me so much peace. I'd love to show you some time over a video call.", fromMe: false, time: "9:00 AM" },
  ],
};

const QUICK_REPLIES: Record<string, string[]> = {
  "1": ["That sounds lovely! When are you free?", "I'd love to hear more about you 😊", "What do you enjoy most these days?"],
  "2": ["Yes, I love music! What do you play?", "Tell me more about your cooking!", "What's your favourite story to share?"],
  "3": ["I'd love to see them! Let's schedule a video call.", "What do you paint most?", "Tell me about Tucson — I've always been curious."],
};

type SpeechRecognitionCtor = { new(): SpeechRecognition };

// Voice-to-text mic button
function MicButton({ onTranscript }: { onTranscript: (t: string) => void }) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  function toggleMic() {
    const w = window as Window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
    const SpeechAPI = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SpeechAPI) { alert("Voice input is not supported in this browser. Please use Chrome or Edge."); return; }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechAPI();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript: string = event.results[0][0].transcript;
      onTranscript(transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return (
    <button
      onClick={toggleMic}
      aria-label={listening ? "Stop voice input" : "Use voice to type"}
      title={listening ? "Listening… click to stop" : "Tap to speak your message"}
      style={{
        width: "52px", height: "52px", borderRadius: "50%", flexShrink: 0,
        backgroundColor: listening ? "#E53E3E" : "#E7E2D7",
        border: `2px solid ${listening ? "#E53E3E" : "#C2C8C2"}`,
        cursor: "pointer", display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: "1.375rem",
        transition: "background-color 0.2s",
        animation: listening ? "mic-pulse 1s ease-in-out infinite" : "none",
      }}
    >
      🎤
    </button>
  );
}

export default function ThreadPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params);
  let partner = mockPartners[matchId];
  if (!partner && matchId.startsWith("dm-")) {
    const demoMatch = DEMO_MATCHES.find((m) => m.id === matchId);
    if (demoMatch) {
      partner = { name: demoMatch.name, initials: demoMatch.name.slice(0, 2).toUpperCase(), bio: demoMatch.bio };
    }
  }
  partner = partner ?? { name: "Your Match", initials: "?" };
  const [messages, setMessages] = useState<Message[]>(initialMessages[matchId] ?? []);
  const [inputValue, setInputValue] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const msgCounterRef = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(text?: string) {
    const content = (text ?? inputValue).trim();
    if (!content) return;
    msgCounterRef.current += 1;
    const newMsg: Message = {
      id: `msg-${msgCounterRef.current}`,
      content,
      fromMe: true,
      time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputValue("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const quickReplies = QUICK_REPLIES[matchId] ?? ["How are you today?", "Tell me about yourself!", "What do you enjoy most?"];

  return (
    <div style={{
      fontFamily: "'Lexend', sans-serif", color: "#173124",
      display: "flex", flexDirection: "column", height: "100vh",
    }}>

      {/* ── Header — large, accessible ── */}
      <div style={{
        backgroundColor: "#FEF9ED", borderBottom: "2px solid #C2C8C2",
        padding: "1rem 1.5rem",
        display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0,
      }}>
        {/* Large back button */}
        <Link
          href="/messages"
          aria-label="Back to Messages"
          style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            color: "#173124", textDecoration: "none",
            fontSize: "1rem", fontWeight: 600,
            backgroundColor: "#E7E2D7", border: "2px solid #C2C8C2",
            borderRadius: "3rem", padding: "0.625rem 1.25rem",
            minHeight: "48px", flexShrink: 0,
            transition: "background-color 0.15s",
          }}
        >
          ← Messages
        </Link>

        {/* Avatar */}
        <div style={{
          width: "52px", height: "52px", borderRadius: "50%",
          backgroundColor: "#173124", color: "#FFFFFF",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Epilogue', serif", fontWeight: 700, fontSize: "1.0625rem", flexShrink: 0,
        }}>
          {partner.initials}
        </div>

        <div style={{ flex: 1 }}>
          <p style={{
            fontFamily: "'Epilogue', serif", fontWeight: 700,
            fontSize: "1.375rem", color: "#173124", lineHeight: 1.2,
          }}>
            {partner.name}
          </p>
          <button
            onClick={() => setShowProfile(true)}
            style={{
              fontSize: "0.85rem", color: "#735C00", background: "none",
              border: "none", padding: 0, cursor: "pointer", fontFamily: "'Lexend', sans-serif",
            }}
          >
            View profile →
          </button>
        </div>
      </div>

      {/* ── Profile drawer ── */}
      {showProfile && (
        <div
          role="dialog"
          aria-label={`${partner.name}'s profile`}
          style={{
            position: "fixed", inset: 0, zIndex: 300,
            display: "flex", alignItems: "flex-end",
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setShowProfile(false)}
            style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.4)" }}
          />
          {/* Drawer */}
          <div style={{
            position: "relative", zIndex: 1, width: "100%",
            backgroundColor: "#FEF9ED", borderRadius: "2rem 2rem 0 0",
            padding: "2rem", boxShadow: "0 -8px 40px rgba(23,49,36,0.2)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
              <div style={{
                width: "64px", height: "64px", borderRadius: "50%",
                backgroundColor: "#173124", color: "#FFFFFF",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Epilogue', serif", fontWeight: 700, fontSize: "1.25rem",
              }}>
                {partner.initials}
              </div>
              <div>
                <p style={{ fontFamily: "'Epilogue', serif", fontWeight: 700, fontSize: "1.5rem", color: "#173124" }}>
                  {partner.name}
                </p>
              </div>
            </div>
            {partner.bio && (
              <p style={{ fontSize: "1.0625rem", color: "#173124", lineHeight: 1.7, marginBottom: "1.5rem" }}>
                {partner.bio}
              </p>
            )}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <Link
                href={`/match/${matchId}`}
                style={{
                  flex: 1, display: "block", backgroundColor: "#173124", color: "#FFFFFF",
                  textDecoration: "none", textAlign: "center",
                  padding: "0.875rem", borderRadius: "3rem", fontWeight: 600, fontSize: "1rem",
                }}
              >
                Full Profile
              </Link>
              <button
                onClick={() => setShowProfile(false)}
                style={{
                  flex: 1, border: "2px solid #C2C8C2", backgroundColor: "transparent",
                  color: "#173124", padding: "0.875rem", borderRadius: "3rem",
                  fontWeight: 600, fontSize: "1rem", cursor: "pointer",
                  fontFamily: "'Lexend', sans-serif",
                }}
              >
                Back to Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Messages ── */}
      <div
        aria-live="polite"
        style={{
          flex: 1, overflowY: "auto", padding: "1.5rem 2rem",
          display: "flex", flexDirection: "column", gap: "0.875rem",
          backgroundColor: "#F8F3E8",
        }}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
            <p style={{ fontSize: "1.25rem", color: "#173124", fontWeight: 600, marginBottom: "0.5rem" }}>
              Say hello to {partner.name}! 🌻
            </p>
            <p style={{ fontSize: "1rem", color: "#727973" }}>
              This is the beginning of your conversation. Don&apos;t be shy — a simple &quot;hello&quot; goes a long way.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              flexDirection: msg.fromMe ? "row-reverse" : "row",
              alignItems: "flex-end",
              gap: "0.5rem",
            }}
          >
            {!msg.fromMe && (
              <div style={{
                width: "40px", height: "40px", borderRadius: "50%",
                backgroundColor: "#173124", color: "#FFFFFF",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Epilogue', serif", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0,
              }}>
                {partner.initials}
              </div>
            )}
            <div style={{ maxWidth: "68%" }}>
              <div style={{
                backgroundColor: msg.fromMe ? "#173124" : "#E7E2D7",
                color: msg.fromMe ? "#FFFFFF" : "#173124",
                border: msg.fromMe ? "none" : "2px solid #C2C8C2",
                borderRadius: msg.fromMe ? "1.5rem 0.375rem 1.5rem 1.5rem" : "0.375rem 1.5rem 1.5rem 1.5rem",
                padding: "1rem 1.25rem",
                fontSize: "1.125rem",
                lineHeight: 1.65,
              }}>
                {msg.content}
              </div>
              <p style={{
                fontSize: "0.8rem", color: "#727973", marginTop: "0.25rem",
                textAlign: msg.fromMe ? "right" : "left",
              }}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ── Quick reply chips ── */}
      <div style={{
        backgroundColor: "#FEF9ED", borderTop: "1px solid #E7E2D7",
        padding: "0.75rem 1.5rem 0",
        display: "flex", gap: "0.5rem", flexWrap: "wrap",
      }}>
        {quickReplies.map((reply) => (
          <button
            key={reply}
            onClick={() => handleSend(reply)}
            style={{
              backgroundColor: "#F5F0E8", border: "2px solid #C2C8C2",
              borderRadius: "3rem", padding: "0.5rem 1rem",
              fontSize: "0.9rem", color: "#173124", cursor: "pointer",
              fontFamily: "'Lexend', sans-serif", fontWeight: 500,
              whiteSpace: "nowrap", transition: "background-color 0.15s",
              minHeight: "40px",
            }}
          >
            {reply}
          </button>
        ))}
      </div>

      {/* ── Compose area ── */}
      <div style={{
        backgroundColor: "#FEF9ED",
        borderTop: "2px solid #C2C8C2",
        padding: "0.875rem 1.5rem",
        display: "flex", gap: "0.75rem", alignItems: "flex-end", flexShrink: 0,
      }}>
        <MicButton onTranscript={(t) => setInputValue((prev) => prev + (prev ? " " : "") + t)} />
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… or use the mic 🎤"
          rows={1}
          aria-label={`Message ${partner.name}`}
          style={{
            flex: 1, resize: "none",
            border: "2px solid #C2C8C2", borderRadius: "1rem",
            padding: "0.875rem 1rem", fontFamily: "'Lexend', sans-serif",
            fontSize: "1.0625rem", color: "#173124", backgroundColor: "#FFFFFF",
            minHeight: "52px", maxHeight: "120px", lineHeight: 1.5, outline: "none",
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputValue.trim()}
          aria-label="Send message"
          style={{
            width: "52px", height: "52px", borderRadius: "50%",
            backgroundColor: inputValue.trim() ? "#173124" : "#C2C8C2",
            color: "#FFFFFF", border: "none",
            cursor: inputValue.trim() ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.25rem", flexShrink: 0, transition: "background-color 0.15s",
          }}
        >
          ↑
        </button>
      </div>

      <style>{`
        @keyframes mic-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(229,62,62,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(229,62,62,0); }
        }
      `}</style>
    </div>
  );
}
