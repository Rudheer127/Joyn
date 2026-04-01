"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (signUpError) {
        setError(signUpError.message);
      } else if (data.session) {
        window.location.href = "/onboard";
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    setError("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${location.origin}/api/auth/callback?next=/consultation`,
        },
      });
      if (error) setError(error.message);
    } catch {
      setError("Something went wrong with Google sign up.");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#FEF9ED",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "'Lexend', sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "#E7E2D7",
          border: "2px solid #C2C8C2",
          borderRadius: "3rem",
          padding: "3rem",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 0 60px 0 rgba(23,49,36,0.05)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link href="/" style={{ display: "inline-block" }}>
            <img src="/joyn-logo.svg" alt="JOYN" style={{ height: "48px" }} />
          </Link>
          <p style={{ fontSize: "0.875rem", color: "#727973", marginTop: "0.5rem" }}>
            Find Your Person. Age with Joy.
          </p>
        </div>

        <h1
          style={{
            fontFamily: "'Epilogue', serif",
            fontWeight: 700,
            fontSize: "1.875rem",
            color: "#173124",
            marginBottom: "2rem",
            textAlign: "center",
          }}
        >
          Create your Joyn account
        </h1>

        {success ? (
          <div
            style={{
              backgroundColor: "#173124",
              color: "#FFFFFF",
              borderRadius: "1rem",
              padding: "1.5rem",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "1.125rem", marginBottom: "0.5rem", fontWeight: 600 }}>
              🌻 Welcome to Joyn!
            </p>
            <p style={{ fontSize: "1rem", opacity: 0.9 }}>
              Check your email to confirm your account, then come back here to continue.
            </p>
            <Link
              href="/sign-in"
              style={{
                display: "inline-block", marginTop: "1.25rem",
                backgroundColor: "#173124", color: "#FFFFFF",
                padding: "0.875rem 1.75rem", borderRadius: "3rem",
                textDecoration: "none", fontWeight: 600, fontSize: "1rem",
              }}
            >
              Sign In to Get Started →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label
                htmlFor="fullName"
                style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "1rem", color: "#173124" }}
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                className="input-base"
                placeholder="Margaret Wilson"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div>
              <label
                htmlFor="email"
                style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "1rem", color: "#173124" }}
              >
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
              <label
                htmlFor="password"
                style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "1rem", color: "#173124" }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input-base"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "1rem", color: "#173124" }}
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="input-base"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div
                style={{
                  backgroundColor: "#FEE2E2",
                  border: "2px solid #FCA5A5",
                  borderRadius: "1rem",
                  padding: "0.75rem 1rem",
                  color: "#991B1B",
                  fontSize: "1rem",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: "100%", marginTop: "0.5rem", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Creating Account..." : "Sign Up with Email"}
            </button>
          </form>
        )}

        {!success && (
          <>
            <div style={{ display: "flex", alignItems: "center", margin: "2rem 0" }}>
              <div style={{ flex: 1, height: "1px", backgroundColor: "#C2C8C2" }}></div>
              <span style={{ padding: "0 1rem", color: "#727973", fontSize: "0.875rem", fontWeight: 500 }}>
                OR
              </span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "#C2C8C2" }}></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignUp}
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
                transition: "background-color 0.2s",
              }}
            >
              <svg style={{ width: "24px", height: "24px" }} viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign up with Google
            </button>
          </>
        )}

        <p
          style={{
            textAlign: "center",
            marginTop: "1.5rem",
            fontSize: "1rem",
            color: "#727973",
          }}
        >
          Already have an account?{" "}
          <Link
            href="/sign-in"
            style={{ color: "#173124", fontWeight: 600, textDecoration: "underline" }}
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
