"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { exitDemo } from "@/lib/demo/demoData";

type AuthMode = "phone" | "email";
type PhoneStep = "input" | "verify";

export default function SignInPage() {
  const [mode, setMode] = useState<AuthMode>("phone");
  const [phoneStep, setPhoneStep] = useState<PhoneStep>("input");

  // Phone OTP state
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Email state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resentSuccess, setResentSuccess] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const router = useRouter();

  const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";

  function handleDemoLogin() {
    setDemoLoading(true);
    router.push("/demo");
  }

  const formatPhoneDisplay = (p: string) => {
    const digits = p.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const maskedPhone = phone
    ? `(${phone.replace(/\D/g, "").slice(0, 3)}) ${phone.replace(/\D/g, "").slice(3, 6)}-XXXX`
    : "";

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const digits = phone.replace(/\D/g, "");
      const formatted = `+1${digits}`;
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: formatted,
      });
      if (otpError) {
        setError(otpError.message);
      } else {
        setPhoneStep("verify");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpVerify(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter all 6 digits."); return; }
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const digits = phone.replace(/\D/g, "");
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: `+1${digits}`,
        token: code,
        type: "sms",
      });
      if (verifyError) {
        setError(verifyError.message);
      } else if (data.session) {
        exitDemo();
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", data.session.user.id)
          .single();
        if (!profile || !profile.onboarding_completed) {
          router.push("/onboard");
        } else {
          router.push("/consultation");
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    const supabase = createClient();
    const digits = phone.replace(/\D/g, "");
    await supabase.auth.signInWithOtp({ phone: `+1${digits}` });
    setResentSuccess(true);
    setTimeout(() => setResentSuccess(false), 4000);
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
      } else if (data.session) {
        exitDemo();
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", data.session.user.id)
          .single();
        if (!profile || !profile.onboarding_completed) {
          router.push("/onboard");
        } else {
          router.push("/consultation");
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    exitDemo(); // clear any stale demo session before OAuth redirect
    try {
      const supabase = createClient();
      // Use the configured site URL for production, or window.location.origin for localhost
      const redirectOrigin = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${redirectOrigin}/api/auth/callback` },
      });
      if (error) setError(error.message);
    } catch {
      setError("Something went wrong with Google sign in.");
    }
  }

  function handleOtpInput(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#F5F0E8",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      fontFamily: "var(--font-lexend), sans-serif",
    }}>
      <div style={{
        backgroundColor: "#E7E2D7",
        border: "2px solid #C2C8C2",
        borderRadius: "3rem",
        padding: "3rem",
        width: "100%",
        maxWidth: "520px",
        boxShadow: "0 0 60px 0 rgba(23,49,36,0.08)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link href="/" style={{ display: "inline-block" }}>
            <img src="/joyn-logo.svg" alt="JOYN" style={{ height: "48px" }} />
          </Link>
          <p style={{ fontSize: "0.9rem", color: "#727973", marginTop: "0.5rem" }}>
            Find Your Person. Age with Joy.
          </p>
        </div>

        <h1 style={{
          fontFamily: "var(--font-epilogue), serif",
          fontWeight: 700,
          fontSize: "1.75rem",
          color: "#173124",
          marginBottom: "0.5rem",
          textAlign: "center",
        }}>
          Welcome back
        </h1>
        <p style={{ textAlign: "center", color: "#727973", fontSize: "1rem", marginBottom: "1.25rem" }}>
          Sign in to reconnect with your companions
        </p>

        {/* Demo login button */}
        <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#727973", textAlign: "center", marginBottom: "0.5rem" }}>
          For Visitors / Demo
        </p>
        <button
          onClick={handleDemoLogin}
          disabled={demoLoading}
          style={{
            width: "100%",
            padding: "1rem",
            backgroundColor: "#E8C84A",
            border: "2px solid #D4B73A",
            borderRadius: "3rem",
            fontSize: "1rem",
            fontWeight: 700,
            color: "#173124",
            cursor: "pointer",
            marginBottom: "1rem",
            opacity: demoLoading ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            minHeight: "52px",
          }}
        >
          {demoLoading ? "Loading..." : "🌻 Try the Demo Account"}
        </button>

        <div style={{ display: "flex", alignItems: "center", margin: "2rem 0 1.5rem 0" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "#C2C8C2" }}></div>
          <span style={{ padding: "0 1rem", color: "#727973", fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Or sign in to your account</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "#C2C8C2" }}></div>
        </div>

        {/* Mode tabs */}
        <div style={{ display: "flex", borderRadius: "3rem", backgroundColor: "#D4CFCA", padding: "4px", marginBottom: "2rem" }}>
          {[
            { key: "phone" as AuthMode, label: "📱 Phone Number" },
            { key: "email" as AuthMode, label: "✉️ Email" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setMode(tab.key); setError(""); setPhoneStep("input"); }}
              style={{
                flex: 1,
                padding: "0.75rem 1rem",
                borderRadius: "3rem",
                fontSize: "1rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
                backgroundColor: mode === tab.key ? "#173124" : "transparent",
                color: mode === tab.key ? "#FFFFFF" : "#727973",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── PHONE MODE ── */}
        {mode === "phone" && phoneStep === "input" && (
          <form onSubmit={handlePhoneSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <label htmlFor="phone" style={{ display: "block", fontWeight: 600, marginBottom: "0.75rem", fontSize: "1.125rem", color: "#173124" }}>
                Your Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                className="input-base"
                placeholder="(602) 555-1234"
                value={formatPhoneDisplay(phone)}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                required
                style={{ fontSize: "1.5rem", padding: "1rem 1.25rem", letterSpacing: "0.05em" }}
              />
              <p style={{ fontSize: "0.875rem", color: "#727973", marginTop: "0.5rem" }}>
                We&apos;ll send a 6-digit code. No password needed!
              </p>
            </div>

            {error && (
              <div style={{ backgroundColor: "#FEE2E2", border: "2px solid #FCA5A5", borderRadius: "1rem", padding: "0.75rem 1rem", color: "#991B1B", fontSize: "1rem" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading || phone.replace(/\D/g, "").length < 10}
              style={{ width: "100%", fontSize: "1.125rem", padding: "1.125rem", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Sending Code..." : "Send Me a Code →"}
            </button>
          </form>
        )}

        {/* ── OTP VERIFY ── */}
        {mode === "phone" && phoneStep === "verify" && (
          <form onSubmit={handleOtpVerify} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "1.125rem", color: "#173124", lineHeight: 1.6, marginBottom: "0.5rem" }}>
                We just sent a 6-digit code to
              </p>
              <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "#173124" }}>{maskedPhone}</p>
              <p style={{ fontSize: "0.875rem", color: "#727973", marginTop: "0.25rem" }}>
                Please enter it below. The code expires in 10 minutes.
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.625rem", justifyContent: "center" }}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpInput(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  style={{
                    width: "60px",
                    height: "72px",
                    textAlign: "center",
                    fontSize: "2rem",
                    fontWeight: 700,
                    fontFamily: "var(--font-epilogue), serif",
                    border: `3px solid ${digit ? "#173124" : "#C2C8C2"}`,
                    borderRadius: "1rem",
                    backgroundColor: digit ? "#FEF9ED" : "#FFFFFF",
                    color: "#173124",
                    outline: "none",
                    transition: "border-color 0.15s",
                  }}
                />
              ))}
            </div>

            {error && (
              <div style={{ backgroundColor: "#FEE2E2", border: "2px solid #FCA5A5", borderRadius: "1rem", padding: "0.75rem 1rem", color: "#991B1B", fontSize: "1rem" }}>
                {error}
              </div>
            )}

            {resentSuccess && (
              <p style={{ textAlign: "center", color: "#173124", fontWeight: 600 }}>✓ A new code has been sent!</p>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading || otp.join("").length < 6}
              style={{ width: "100%", fontSize: "1.125rem", padding: "1.125rem", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Verifying..." : "Confirm Code →"}
            </button>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", textAlign: "center" }}>
              <button
                type="button"
                onClick={handleResend}
                style={{ background: "none", border: "none", color: "#735C00", fontWeight: 600, fontSize: "1rem", cursor: "pointer", padding: "0.5rem", textDecoration: "underline" }}
              >
                Resend Code
              </button>
              <button
                type="button"
                onClick={() => setPhoneStep("input")}
                style={{ background: "none", border: "none", color: "#727973", fontSize: "0.9rem", cursor: "pointer", padding: "0.25rem" }}
              >
                ← Use a different number
              </button>
              <a href="tel:+16025551234" style={{ color: "#727973", fontSize: "0.875rem", textDecoration: "none" }}>
                📞 Didn&apos;t receive it? Call us: (602) 555-1234
              </a>
            </div>
          </form>
        )}

        {/* ── EMAIL MODE ── */}
        {mode === "email" && (
          <form onSubmit={handleEmailSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label htmlFor="email" style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "1rem", color: "#173124" }}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="input-base"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password" style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "1rem", color: "#173124" }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input-base"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div style={{ backgroundColor: "#FEE2E2", border: "2px solid #FCA5A5", borderRadius: "1rem", padding: "0.75rem 1rem", color: "#991B1B", fontSize: "1rem" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: "100%", marginTop: "0.5rem", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Signing In..." : "Sign In with Email"}
            </button>

            <div style={{ display: "flex", alignItems: "center", margin: "0.5rem 0" }}>
              <div style={{ flex: 1, height: "1px", backgroundColor: "#C2C8C2" }}></div>
              <span style={{ padding: "0 1rem", color: "#727973", fontSize: "0.875rem", fontWeight: 500 }}>OR</span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "#C2C8C2" }}></div>
            </div>

            {/* Localhost Google warning */}
            {isLocalhost && (
              <div style={{
                backgroundColor: "#FFFBEA", border: "2px solid #E8C84A",
                borderRadius: "0.875rem", padding: "0.75rem 1rem",
                fontSize: "0.85rem", color: "#735C00", lineHeight: 1.5,
              }}>
                <strong>⚠️ Localhost note:</strong> Google Sign-In requires your Supabase project&apos;s
                redirect URL to include <code>http://localhost:3000/**</code>.
                Go to <a href="https://supabase.com/dashboard/project/wbxrsdjetrmykllymwoh/auth/url-configuration" target="_blank" rel="noreferrer" style={{ color: "#735C00" }}>Supabase Auth Settings</a> to add it.
                Use the demo button above or email login for now.
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleSignIn}
              style={{
                width: "100%",
                padding: "1rem",
                backgroundColor: "#FFFFFF",
                border: "2px solid #C2C8C2",
                borderRadius: "3rem",
                fontSize: "1rem",
                fontWeight: 600,
                color: "#173124",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
              }}
            >
              <svg style={{ width: "24px", height: "24px" }} viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign in with Google
            </button>
          </form>
        )}

        <p style={{ textAlign: "center", marginTop: "2rem", fontSize: "1rem", color: "#727973" }}>
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" style={{ color: "#173124", fontWeight: 600, textDecoration: "underline" }}>
            Join Free
          </Link>
        </p>
      </div>
    </div>
  );
}
