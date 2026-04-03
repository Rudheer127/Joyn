"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Square, Send, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UnifiedChatUIProps {
  mode: "mini" | "full";
  conversationId: string;
  pageContext?: string;
  isDemo?: boolean;
  onExpand?: () => void;
  onClear?: () => void;
  onClose?: () => void;
  userName?: string;
  useVoiceOutput?: boolean;
  initialMessages?: UIMessage[];
}

// Preset quick-reply options for the welcome state
const PRESET_OPTIONS = [
  "Take me to my matches",
  "Open my messages",
  "I recently moved to a new place",
  "I'm looking for a friend to stay in touch with",
];

/**
 * Strip <navigateTo> (and other XML-style command tags) from AI response text
 * before rendering so raw command markup is never visible to the user.
 */
function parseAndStripCommands(text: string): string {
  // Remove all XML-style command tags and their content
  return text
    .replace(/<navigateTo>[\s\S]*?<\/navigateTo>/g, "")
    .replace(/<openModal>[\s\S]*?<\/openModal>/g, "")
    .replace(/<showAlert>[\s\S]*?<\/showAlert>/g, "")
    .replace(/<[a-zA-Z][a-zA-Z0-9]*>[\s\S]*?<\/[a-zA-Z][a-zA-Z0-9]*>/g, "")
    .trim();
}

export function UnifiedChatUI({
  mode,
  conversationId,
  pageContext = "General",
  isDemo = false,
  onExpand,
  onClear,
  onClose,
  userName = "Friend",
  useVoiceOutput = false,
  initialMessages = [],
}: UnifiedChatUIProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [suggestedOptions, setSuggestedOptions] = useState<Array<{ label: string; text: string }>>([]);
  const [conversationState, setConversationState] = useState<any>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const lastNavRef = useRef<string | null>(null);

  const isMobile = mode === "mini";

  // Dynamic suggested options based on state
  function generateSuggestedOptions(
    statePhase: string,
    lastTopic: string | null,
    lastIntent: string | null
  ): Array<{ label: string; text: string }> {
    const suggestions: Array<{ label: string; text: string }> = [];

    if (statePhase === "greeting") {
      suggestions.push(
        { label: "Show my matches", text: "Can you show me some matches?" },
        { label: "What are events?", text: "What events are happening near me?" }
      );
    } else if (statePhase === "awaiting_choice") {
      if (lastTopic === "matches") {
        suggestions.push(
          { label: "More matches", text: "Show me more matches" },
          { label: "Message one", text: "I'd like to message someone" }
        );
      } else {
        suggestions.push(
          { label: "Browse matches", text: "Show me some matches" },
          { label: "Find events", text: "What events are near me?" }
        );
      }
    } else if (statePhase === "clarifying") {
      suggestions.push(
        { label: "Let me clarify", text: "Let me explain that better" },
        { label: "Try again", text: "Can you ask that differently?" }
      );
    }

    return suggestions.slice(0, 4);
  }

  const firstName = userName.split(" ")[0];

  const WELCOME_MESSAGE: UIMessage = {
    id: "unified-welcome",
    role: "assistant",
    parts: [{
      type: "text",
      text: mode === "full"
        ? `Hi ${firstName}, I'm Jo. What brings you here today?`
        : `Hi ${firstName}! 🌻 I'm Jo, your Joyn guide. How can I help you today?`,
    }],
  };

  const { messages, sendMessage, status } = useChat({
    id: conversationId,
    transport: new DefaultChatTransport({
      api: "/api/ai/companion",
      body: {
        pageContext,
        isDemo,
        conversationId,
        voiceOutput: useVoiceOutput && mode === "full"
      },
    }),
    messages: initialMessages.length > 0 ? initialMessages : [WELCOME_MESSAGE],
  });

  const isStreaming = status === "streaming" || status === "submitted";

  // Sync messages to database
  useEffect(() => {
    if (!conversationId || isDemo) return;

    async function syncMessages() {
      for (const msg of messages) {
        if (msg.id === "unified-welcome" || msg.id?.startsWith("__")) continue;

        try {
          await fetch("/api/ai/jo/send-message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              conversationId,
              sender: msg.role === "user" ? "user" : "assistant",
              messageText: ((msg.parts?.[0] as any)?.text || "").toString(),
              metadata: { parts: msg.parts },
            }),
          });
        } catch (error) {
          console.error("Error syncing message:", error);
        }
      }
    }

    syncMessages();
  }, [messages, conversationId, isDemo]);

  // Fetch conversation state for suggestions
  useEffect(() => {
    async function fetchConversationState() {
      if (!conversationId || isDemo) return;

      try {
        const response = await fetch(`/api/ai/jo/get-conversation?conversationId=${conversationId}`);
        if (!response.ok) return;

        const data = await response.json();
        setConversationState(data.state);

        const statePhase = data.state?.state_phase || "greeting";
        const lastTopic = data.state?.last_topic || null;
        const lastIntent = data.state?.last_intent || null;

        setSuggestedOptions(generateSuggestedOptions(statePhase, lastTopic, lastIntent));
      } catch (error) {
        console.error("Error fetching conversation state:", error);
      }
    }

    fetchConversationState();
  }, [conversationId, isDemo, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Navigation detection — handles both tool-call parts AND text-embedded <navigateTo> tags
  useEffect(() => {
    const lastMessage = messages[messages.length - 1] as any;
    if (!lastMessage || lastMessage.role !== "assistant") return;
    if (lastMessage.id === lastNavRef.current) return;

    // 1. Tool-call based navigation (preferred)
    const toolParts = lastMessage.parts?.filter((p: any) => p.type?.startsWith("tool-")) || [];
    if (toolParts.length > 0) {
      const navPart = toolParts.find((p: any) => p.type === "tool-navigateTo");
      if (navPart) {
        const route = (navPart as any).result?.route || (navPart as any).args?.route;
        if (route) {
          lastNavRef.current = lastMessage.id;
          setTimeout(() => router.push(route), 100);
          return;
        }
      }
    }

    // 2. Text-embedded <navigateTo> tags (fallback for text responses)
    const rawText = lastMessage.parts
      ?.filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join(" ") || "";
    const navRegex = /<navigateTo>([\s\S]*?)<\/navigateTo>/g;
    let match;
    while ((match = navRegex.exec(rawText)) !== null) {
      try {
        const payload = JSON.parse(match[1]);
        if (payload.route) {
          lastNavRef.current = lastMessage.id;
          setTimeout(() => router.push(payload.route), 100);
          break;
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, [messages, router]);

  // Speech recognition setup
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
      }
      if (finalTranscript) setInputValue((prev) => prev ? prev + " " + finalTranscript : finalTranscript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  function toggleMic() {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  }

  function handleSend(text?: string) {
    const msg = (text ?? inputValue).trim();
    if (!msg || isStreaming) return;

    const lowerMsg = msg.toLowerCase();
    
    // Fast-path client-side navigation detection to skip LLM latency
    if (lowerMsg.includes("open my messages") || lowerMsg.includes("go to messages")) {
      router.push("/messages");
      setInputValue("");
      if (onClose) onClose(); // Auto-close widget if navigating
      return;
    }
    if (lowerMsg.includes("take me to my matches") || lowerMsg.includes("show my matches")) {
      router.push("/match");
      setInputValue("");
      if (onClose) onClose();
      return;
    }
    if (lowerMsg.includes("dashboard")) {
      router.push("/dashboard");
      setInputValue("");
      if (onClose) onClose();
      return;
    }

    sendMessage({ text: msg });
    setInputValue("");
    inputRef.current?.focus();
  }

  function handleClearChat() {
    setShowClearDialog(true);
  }

  async function confirmClearChat() {
    setShowClearDialog(false);
    try {
      await fetch(`/api/ai/jo/clear-conversation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });
    } catch (error) {
      console.error("Error clearing chat:", error);
    }
    if (onClear) onClear();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Styles
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    backgroundColor: mode === "full" ? "#F8F3E8" : "#FAF8F4",
    color: "#173124",
    fontFamily: "var(--font-lexend), sans-serif",
    height: "100%",
    overflow: "hidden",
  };

  const headerStyle: React.CSSProperties = {
    padding: mode === "full" ? "1rem 2rem" : "14px 18px",
    borderBottom: mode === "full" ? "none" : "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    // Both modes use the dark green brand header for consistency
    backgroundColor: "#173124",
    color: "#FFFFFF",
    flexShrink: 0,
  };

  const messagesStyle: React.CSSProperties = {
    flex: 1,
    overflowY: "auto",
    padding: mode === "full" ? "2rem" : "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  };

  const inputAreaStyle: React.CSSProperties = {
    padding: mode === "full" ? "1.5rem" : "12px",
    borderTop: "2px solid #E7E2D7",
    display: "flex",
    gap: "8px",
    backgroundColor: "#FFFFFF",
  };

  return (
    <div style={containerStyle}>
      {/* Header — dark green in both mini and full modes */}
      <div style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          {/* Sunflower avatar */}
          <div style={{
            width: mode === "full" ? "36px" : "32px",
            height: mode === "full" ? "36px" : "32px",
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: mode === "full" ? "1.1rem" : "1rem",
            flexShrink: 0,
          }}>🌻</div>
          <div>
            <h2 style={{ margin: 0, fontSize: mode === "full" ? "1.1rem" : "1rem", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.2 }}>
              Jo
            </h2>
            <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.65)", lineHeight: 1 }}>
              Joyn Guide · Online
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {mode === "mini" && onExpand && (
            <button
              onClick={onExpand}
              title="Expand to full screen"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                fontSize: "1.2rem",
                color: "rgba(255,255,255,0.8)",
                display: "flex",
                alignItems: "center",
              }}
            >
              ⛶
            </button>
          )}
          <button
            onClick={handleClearChat}
            title="Clear chat history"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              fontSize: "1.2rem",
              color: "rgba(255,255,255,0.8)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Trash2 size={18} />
          </button>
          {mode === "mini" && (
            <button
              onClick={() => onClose?.()}
              aria-label="Close Jo chat"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                fontSize: "1.5rem",
                color: "rgba(255,255,255,0.8)",
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={messagesStyle}>
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          const rawText = msg.parts
            ?.filter((p: any) => p.type === "text")
            .map((p: any) => p.text)
            .join(" ") || "";
          // FIX: Strip raw command tags before displaying
          const textContent = isUser ? rawText : parseAndStripCommands(rawText);

          return (
            <div
              key={msg.id || idx}
              style={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: mode === "full" ? "78%" : "85%",
                  padding: mode === "full" ? "1rem 1.25rem" : "10px 14px",
                  borderRadius: mode === "full" ? "1.5rem" : "12px",
                  backgroundColor: isUser ? "#173124" : (mode === "full" ? "#FFFFFF" : "#f0f0f0"),
                  color: isUser ? "#FFFFFF" : "#173124",
                  wordWrap: "break-word",
                  border: !isUser && mode === "full" ? "1px solid #E7E2D7" : "none",
                  fontSize: mode === "full" ? "1.05rem" : "0.95rem",
                  lineHeight: 1.6,
                }}
              >
                {textContent || (!isUser && <span style={{ fontStyle: "italic", color: "#999" }}>Processing...</span>)}
              </div>
            </div>
          );
        })}

        {/* ─── Preset quick-reply buttons (Stacked AFTER the welcome message) ─── */}
        {messages.length <= 1 && !isStreaming && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
            padding: mode === "full" ? "1rem 0 1.5rem" : "0.25rem 0 0.5rem",
          }}>
            {/* Jo avatar and heading (Full mode only) */}
            {mode === "full" && (
              <>
                <div style={{
                  width: "72px", height: "72px", borderRadius: "50%",
                  backgroundColor: "#173124",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "2rem",
                  boxShadow: "0 4px 16px rgba(23,49,36,0.25)",
                  marginBottom: "0.25rem",
                }}>🌻</div>
                <h2 style={{
                  fontFamily: "var(--font-epilogue), serif",
                  fontWeight: 800, fontSize: "1.75rem",
                  color: "#173124", margin: 0, letterSpacing: "-0.02em",
                }}>Hi {firstName}, I&apos;m Jo.</h2>
              </>
            )}
            
            <p style={{ 
              fontSize: mode === "full" ? "1rem" : "0.9rem", 
              color: "#727973", textAlign: "center", maxWidth: "360px", 
              margin: 0, lineHeight: 1.5, padding: "0 10px" 
            }}>
              {mode === "full"
                ? "What brings you here today? Choose an option below, type your answer, or use the microphone to talk to me."
                : "Choose an option below or type a question:"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem", width: "100%", alignItems: "center" }}>
              {PRESET_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => handleSend(option)}
                  style={{
                    display: "inline-block",
                    padding: mode === "full" ? "12px 28px" : "10px 20px",
                    borderRadius: "9999px",
                    border: "1.5px solid #D1CCC4",
                    backgroundColor: "#FFFFFF",
                    color: "#2C2C2C",
                    fontSize: mode === "full" ? "1rem" : "0.9rem",
                    cursor: "pointer",
                    transition: "all 180ms ease",
                    textAlign: "center",
                    width: "auto",
                    maxWidth: "90%",
                    fontFamily: "var(--font-lexend), sans-serif",
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#F0ECE5";
                    e.currentTarget.style.borderColor = "#173124";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#FFFFFF";
                    e.currentTarget.style.borderColor = "#D1CCC4";
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}
        {isStreaming && (
          <div style={{ display: "flex" }}>
            <div
              style={{
                padding: mode === "full" ? "1rem 1.25rem" : "10px 14px",
                borderRadius: mode === "full" ? "1.5rem" : "12px",
                backgroundColor: mode === "full" ? "#FFFFFF" : "#f0f0f0",
                color: "#999",
                border: mode === "full" ? "1px solid #E7E2D7" : "none",
              }}
            >
              Jo is thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested Options */}
      {suggestedOptions.length > 0 && !isStreaming && (
        <div
          style={{
            padding: mode === "full" ? "1rem 2rem" : "12px 20px",
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            borderTop: "1px solid #E7E2D7",
            backgroundColor: mode === "full" ? "#F8F3E8" : "#FFFFFF",
          }}
        >
          {suggestedOptions.map((option) => (
            <button
              key={option.text}
              onClick={() => handleSend(option.text)}
              style={{
                backgroundColor: "#FFFFFF",
                color: "#173124",
                border: "2px solid #E7E2D7",
                padding: mode === "full" ? "0.75rem 1.25rem" : "6px 12px",
                borderRadius: "2rem",
                fontSize: mode === "full" ? "0.95rem" : "0.85rem",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#173124";
                e.currentTarget.style.backgroundColor = "#F8F3E8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E7E2D7";
                e.currentTarget.style.backgroundColor = "#FFFFFF";
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div style={inputAreaStyle}>
        <button
          type="button"
          onClick={toggleMic}
          style={{
            width: "44px",
            height: "44px",
            minWidth: "44px",
            borderRadius: "50%",
            backgroundColor: isListening ? "#EB5757" : "#F2C94C",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: isListening ? "#FFFFFF" : "#173124",
            flexShrink: 0,
          }}
        >
          {isListening ? <Square size={20} /> : <Mic size={20} />}
        </button>

        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening..." : "Type your message..."}
          style={{
            flex: 1,
            padding: "10px 16px",
            fontSize: mode === "full" ? "1.1rem" : "0.95rem",
            borderRadius: "2rem",
            border: "2px solid #E7E2D7",
            backgroundColor: "#F8F3E8",
            color: "#173124",
            fontFamily: "inherit",
            resize: "none",
            maxHeight: "100px",
            minHeight: "44px",
          }}
        />

        <button
          type="button"
          onClick={() => handleSend()}
          disabled={!inputValue.trim() || isStreaming}
          style={{
            width: "44px",
            height: "44px",
            minWidth: "44px",
            borderRadius: "50%",
            backgroundColor: inputValue.trim() && !isStreaming ? "#173124" : "#CCCCCC",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: inputValue.trim() && !isStreaming ? "pointer" : "not-allowed",
            color: "#FFFFFF",
            flexShrink: 0,
          }}
        >
          <Send size={20} />
        </button>
      </div>

      {/* Clear Confirmation Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear chat history?</DialogTitle>
            <DialogDescription>
              This will delete all messages in this conversation. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowClearDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmClearChat}
            >
              Clear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
