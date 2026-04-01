"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { startDemo } from "@/lib/demo/demoData";

export default function DemoEntryPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear any previous demo state, then set fresh
    startDemo();
    router.replace("/dashboard");
  }, [router]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", backgroundColor: "#FEF9ED",
      fontFamily: "var(--font-lexend), sans-serif",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🌻</div>
        <p style={{ fontSize: "1.25rem", fontWeight: 600, color: "#173124" }}>
          Starting your demo…
        </p>
        <p style={{ fontSize: "0.95rem", color: "#727973", marginTop: "0.5rem" }}>
          You&apos;ll be logged in as Margaret, a first-time Joyn member.
        </p>
      </div>
    </div>
  );
}
