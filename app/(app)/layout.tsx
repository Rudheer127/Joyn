"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CompanionWidget } from "@/components/companion/CompanionWidget";

const navItems = [
  { href: "/dashboard",    label: "Dashboard",        icon: "🏠" },
  { href: "/find",         label: "Find Companions",   icon: "🔍" },
  { href: "/match",        label: "My Matches",        icon: "👥" },
  { href: "/messages",     label: "Messages",          icon: "💬" },
  { href: "/sessions",     label: "Catch-Ups",         icon: "📅" },
  { href: "/events",       label: "Events",            icon: "📍" },
  { href: "/consultation", label: "Chat with Jo",      icon: "🌻" },
  { href: "/profile",      label: "Profile",           icon: "👤" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "var(--font-lexend), sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: "272px",
        backgroundColor: "#173124",
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        zIndex: 40,
        /* Subtle tonal gradient — ink on paper effect */
        background: "linear-gradient(180deg, #173124 0%, #1E3B2C 100%)",
      }}>

        {/* Logo area — clicking navigates to dashboard */}
        <div style={{ padding: "2rem 1.75rem 1.75rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <Link
            href="/dashboard"
            title="Go to Dashboard"
            style={{ textDecoration: "none", display: "inline-block" }}
          >
            <img src="/joyn-logo.svg" alt="JOYN" style={{ height: "40px", filter: "brightness(0) invert(1)" }} />
          </Link>
          <p style={{ fontSize: "0.75rem", color: "#E8C84A", fontWeight: 500, marginTop: "0.375rem", letterSpacing: "0.02em" }}>
            Connect. Belong. Age with Joy.
          </p>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem", padding: "1.5rem 1rem" }}>
          <p style={{
            fontSize: "0.65rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "rgba(255,255,255,0.35)",
            padding: "0 0.75rem",
            marginBottom: "0.5rem",
          }}>
            Navigation
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.875rem",
                  padding: "0.875rem 1rem",
                  borderRadius: "0.875rem",
                  textDecoration: "none",
                  fontSize: "1.0625rem",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.65)",
                  backgroundColor: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                  transition: "background-color 0.15s, color 0.15s",
                  minHeight: "52px",
                  position: "relative",
                }}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div style={{
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "3px",
                    height: "60%",
                    backgroundColor: "#E8C84A",
                    borderRadius: "0 3px 3px 0",
                  }} />
                )}
                <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div style={{ padding: "1rem 1rem 2rem" }}>
          <button
            onClick={handleSignOut}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.875rem 1rem",
              borderRadius: "0.875rem",
              border: "1px solid rgba(255,255,255,0.15)",
              backgroundColor: "transparent",
              color: "rgba(255,255,255,0.6)",
              fontSize: "1rem",
              fontWeight: 500,
              cursor: "pointer",
              width: "100%",
              minHeight: "52px",
              transition: "all 0.15s",
              fontFamily: "var(--font-lexend), sans-serif",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.backgroundColor = "rgba(255,255,255,0.08)";
              el.style.color = "#FFFFFF";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.backgroundColor = "transparent";
              el.style.color = "rgba(255,255,255,0.6)";
            }}
          >
            <span style={{ fontSize: "1.125rem" }}>🚪</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ marginLeft: "272px", flex: 1, backgroundColor: "#FEF9ED", minHeight: "100vh" }}>
        {children}
      </main>

      <CompanionWidget />
    </div>
  );
}
