"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mic, Square, Check, ArrowRight } from "lucide-react";

type SetupStep = 1 | 2 | 3 | 4 | 5 | 6;
type SpeechRecognitionCtor = { new(): SpeechRecognition };

const STEPS = {
  1: {
    question: "Hello! Welcome to Joyn. I'm going to help you set up your profile. First, what brings you here today? You can say things like 'I moved to a new area', or 'I want to make new friends'.",
    key: "reason"
  },
  2: {
    question: "Great. How do you like to connect with others? For example, do you prefer phone calls, coffee meet-ups, or going for walks?",
    key: "connections"
  },
  3: {
    question: "Got it. What are some of your hobbies or interests? Like reading, gardening, or traveling?",
    key: "interests"
  },
  4: {
    question: "Wonderful! What city do you live in?",
    key: "city"
  },
  5: {
    question: "And finally, what is your full name?",
    key: "name"
  },
  6: {
    question: "Thank you! I'm saving your profile now. Hang tight for just a moment.",
    key: "done"
  }
};

export default function VoiceOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<SetupStep>(1);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Collected data
  const [data, setData] = useState({
    reason: "",
    connections: "",
    interests: "",
    city: "",
    name: ""
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for elderly
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }

  async function saveProfile() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/sign-in"); return; }

      await supabase.from("profiles").upsert({
        id: user.id,
        full_name: data.name || null,
        city: data.city || null,
        connection_preference: data.connections || "any",
        health_goals: data.reason ? [data.reason] : [],
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      });

      await fetch("/api/ai/match/embed", { method: "POST" }).catch(() => {});
      router.push("/dashboard");
    } catch (err) {
      console.error("Voice Onboarding save error:", err);
    }
  }

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const w = window as Window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
      const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
      if (SR) {
        recognitionRef.current = new SR();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setTranscript((prev) => prev + " " + finalTranscript);
          }
        };

        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  // Speak the question when the step changes
  useEffect(() => {
    if (step < 6) {
      speak(STEPS[step].question);
    } else if (step === 6) {
      speak(STEPS[6].question);
      saveProfile();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function startListening() {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setTranscript("");
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    } else {
      alert("Voice recognition is not supported in your browser. Please try typing instead.");
    }
  }

  function stopListening() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }

  function confirmAnswer() {
    stopListening();

    // Save the transcript to the current step's key
    if (step < 6) {
      const key = STEPS[step as 1|2|3|4|5].key;
      setData(prev => ({ ...prev, [key]: transcript.trim() }));

      // Move to next step
      setTranscript("");
      setStep((prev) => (prev + 1) as SetupStep);
    }
  }

  if (step === 6) {
    return (
      <div style={{
        minHeight: "100vh", backgroundColor: "#F5F0E8",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", fontFamily: "var(--font-lexend), sans-serif",
        gap: "1.5rem", padding: "2rem", textAlign: "center",
      }}>
        <div style={{
          width: "80px", height: "80px", borderRadius: "50%",
          backgroundColor: "#173124", color: "#FFFFFF",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "spin-slow 2s linear infinite",
        }}>
          <Check size={40} />
        </div>
        <p style={{ fontFamily: "var(--font-epilogue), serif", fontWeight: 700, fontSize: "2rem", color: "#173124" }}>
          Setting up your profile…
        </p>
        <p style={{ fontSize: "1.2rem", color: "#727973" }}>
          We are saving your answers now.
        </p>
        <style>{`@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", backgroundColor: "#F5F0E8",
      fontFamily: "var(--font-lexend), sans-serif", color: "#173124",
      display: "flex", flexDirection: "column"
    }}>
      {/* ── Header ── */}
      <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid #E7E2D7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-epilogue), serif", fontWeight: 700, fontSize: "1.25rem" }}>
          JOYN Voice Setup
        </span>
        <button
          onClick={() => router.push("/onboard")}
          style={{ fontSize: "0.9rem", color: "#727973", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}
        >
          Exit to manual setup
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", maxWidth: "800px", margin: "0 auto", width: "100%" }}>

        {/* Step Indicator */}
        <div style={{ marginBottom: "2rem", color: "#727973", fontWeight: 600, fontSize: "1.1rem" }}>
          Step {step} of 5
        </div>

        {/* Question Text */}
        <h1 style={{
          fontFamily: "var(--font-epilogue), serif", fontWeight: 700,
          fontSize: "2.5rem", textAlign: "center", lineHeight: 1.2,
          color: isSpeaking ? "#173124" : "#4A554E",
          marginBottom: "3rem", transition: "color 0.3s"
        }}>
          &ldquo;{STEPS[step as 1|2|3|4|5].question}&rdquo;
        </h1>

        {/* Live Transcript Box */}
        <div style={{
          width: "100%", backgroundColor: "#FFFFFF", border: "2px solid #D4C9A8",
          borderRadius: "1rem", padding: "1.5rem", minHeight: "150px",
          fontSize: "1.25rem", color: "#173124", marginBottom: "3rem",
          display: "flex", alignItems: "center", justifyContent: "center",
          textAlign: "center"
        }}>
          {transcript ? (
            <span>{transcript}</span>
          ) : (
            <span style={{ color: "#A3A7A3", fontStyle: "italic" }}>
              {isListening ? "Listening..." : "Tap the microphone to speak, or type here if you prefer."}
            </span>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          {!isListening ? (
            <button
              onClick={startListening}
              style={{
                width: "120px", height: "120px", borderRadius: "50%",
                backgroundColor: "#F2C94C", border: "none",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                cursor: "pointer", boxShadow: "0 8px 24px rgba(242, 201, 76, 0.4)",
                gap: "0.5rem", color: "#173124", transition: "transform 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              <Mic size={40} />
              <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>Speak</span>
            </button>
          ) : (
            <button
              onClick={stopListening}
              style={{
                width: "120px", height: "120px", borderRadius: "50%",
                backgroundColor: "#EB5757", border: "none",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                cursor: "pointer", boxShadow: "0 8px 24px rgba(235, 87, 87, 0.4)",
                gap: "0.5rem", color: "#FFFFFF", transition: "transform 0.2s"
              }}
            >
              <Square size={32} />
              <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>Stop</span>
            </button>
          )}

          {/* Confirm Button */}
          {transcript.trim() && !isListening && (
            <button
              onClick={confirmAnswer}
              style={{
                padding: "1rem 2rem", borderRadius: "3rem",
                backgroundColor: "#173124", color: "#FFFFFF", border: "none",
                display: "flex", alignItems: "center", gap: "0.5rem",
                fontSize: "1.25rem", fontWeight: 700, cursor: "pointer",
                boxShadow: "0 8px 24px rgba(23, 49, 36, 0.2)"
              }}
            >
              Next Step <ArrowRight size={24} />
            </button>
          )}
        </div>

        {/* Replay voice button */}
        {!isListening && (
           <button
             onClick={() => speak(STEPS[step as 1|2|3|4|5].question)}
             style={{ marginTop: "2rem", color: "#735C00", backgroundColor: "transparent", border: "none", fontSize: "1rem", fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}
           >
             Repeat Question
           </button>
        )}
      </div>
    </div>
  );
}
