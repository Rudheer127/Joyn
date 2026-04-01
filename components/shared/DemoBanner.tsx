"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isDemoMode, exitDemo } from "@/lib/demo/demoData";

export function DemoBanner() {
  const [show, setShow] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setShow(isDemoMode());
  }, []);

  if (!show) return null;

  function handleExit() {
    exitDemo();
    router.push("/");
  }

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: "272px",        // clear the sidebar
      right: 0,
      zIndex: 999,
      backgroundColor: "#E8C84A",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0.5rem 1.75rem",
      gap: "1rem",
      boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
        <span style={{ fontSize: "1.1rem" }}>🎬</span>
        <p style={{
          fontSize: "0.875rem", fontWeight: 700, color: "#173124",
          margin: 0,
        }}>
          Demo Mode — You&apos;re exploring as{" "}
          <strong>Margaret, 68, Scottsdale</strong>{" "}
          <span style={{ fontWeight: 400 }}>(first-time user)</span>
        </p>
      </div>
      <button
        onClick={handleExit}
        style={{
          backgroundColor: "#173124", color: "#FFFFFF",
          border: "none", borderRadius: "3rem",
          padding: "0.375rem 1.125rem",
          fontSize: "0.85rem", fontWeight: 700,
          cursor: "pointer", flexShrink: 0,
          fontFamily: "var(--font-lexend), sans-serif",
        }}
      >
        Exit Demo
      </button>
    </div>
  );
}
