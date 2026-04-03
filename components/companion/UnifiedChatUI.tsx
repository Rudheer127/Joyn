"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Square, Send, Trash2 } from "lucide-react";

interface UnifiedChatUIProps {
  mode: "mini" | "full";
  conversationId: string;
  pageContext?: string;
  isDemo?: boolean;
  onExpand?: () => void;
  onClear?: () => void;
  userName?: string;
  useVoiceOutput?: boolean;
  initialMessages?: UIMessage[];
}

export function UnifiedChatUI({
  mode,
  conversationId,
  pageContext = "General",
  isDemo = false,
  onExpand,
  onClear,
  userName = "Friend",
  useVoiceOutput = false,
  initialMessages = [],
}: UnifiedChatUIProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [suggestedOptions, setSuggestedOptions] = useState<Array<{ label: string; text: string }>>([]);
  const [conversationState, setConversationState] = useState<any>(null);
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

  const WELCOME_MESSAGE: UIMessage = {
    id: "unified-welcome",
    role: "assistant",
    parts: [{
      type: "text",
      text: mode === "full"
        ? `Hi ${userName}, I'm Jo. What brings you here today?`
        : `Hi there! 😊 I'm Jo, your Joyn guide. How can I help you today?`,
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

  // Navigation detection
  useEffect(() => {
    const lastMessage = messages[messages.length - 1] as any;
    if (!lastMessage || lastMessage.role !== "assistant") return;
    if (lastMessage.id === lastNavRef.current) return;

    const toolParts = lastMessage.parts?.filter((p: any) => p.type?.startsWith("tool-")) || [];
    if (toolParts.length > 0) {
      const navPart = toolParts.find((p: any) => p.type === "tool-navigateTo");
      if (navPart) {
        const route = (navPart as any).result?.route || (navPart as any).args?.route;
        if (route) {
          lastNavRef.current = lastMessage.id;
          setTimeout(() => router.push(route), 800);
        }
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
    sendMessage({ text: msg });
    setInputValue("");
    inputRef.current?.focus();
  }

  function handleClearChat() {
    if (!confirm("Clear all messages? This cannot be undone.")) return;

    async function clearChat() {
      try {
        await fetch(`/api/ai/jo/clear-conversation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId }),
        });
      } catch (error) {
        console.error("Error clearing chat:", error);
      }
    }

    clearChat();
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
    backgroundColor: mode === "full" ? "#F8F3E8" : "#FFFFFF",
    color: "#173124",
    fontFamily: "var(--font-epilogue), sans-serif",
    height: "100%",
  };

  const headerStyle: React.CSSProperties = {
    padding: mode === "full" ? "1rem 2rem" : "16px 20px",
    borderBottom: "1px solid #E7E2D7",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: mode === "full" ? "#173124" : "#FFFFFF",
    color: mode === "full" ? "#FFFFFF" : "#173124",
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
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {mode === "full" && <img src="/joyn-logo.svg" alt="JOYN" style={{ height: "32px", filter: "brightness(0) invert(1)" }} />}
          <h2 style={{ margin: 0, fontSize: mode === "full" ? "1.125rem" : "1.25rem", fontWeight: 700 }}>
            {mode === "full" ? "Chat with Jo" : "Jo"}
          </h2>
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
                color: "#666",
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
              color: mode === "full" ? "#FFFFFF" : "#666",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Trash2 size={18} />
          </button>
          {mode === "mini" && (
            <button
              onClick={() => {}} // Will be handled by parent
              aria-label="Close"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                fontSize: "1.5rem",
                color: "#666",
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
          const textContent = msg.parts
            ?.filter((p: any) => p.type === "text")
            .map((p: any) => p.text)
            .join(" ") || "";

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
    </div>
  );
}
