import Link from "next/link";

const testimonials = [
  {
    quote: "I was lonely after my husband passed. Joyn matched me with Margaret — we call each other every single morning now. I don't know what I'd do without her.",
    name: "Barbara M.",
    age: 71,
    city: "Scottsdale",
    initials: "BM",
    color: "#2D5A45",
  },
  {
    quote: "My daughter signed me up because she was worried about me. Now I have Robert, and we watch Jeopardy together on video every Tuesday. I actually look forward to Tuesdays.",
    name: "Harold T.",
    age: 68,
    city: "Phoenix",
    initials: "HT",
    color: "#735C00",
  },
  {
    quote: "I kept telling myself I wasn't lonely. But I hadn't had a real conversation in weeks. Joyn gave me Margaret, and she's become my dearest friend.",
    name: "Carol W.",
    age: 74,
    city: "Mesa",
    initials: "CW",
    color: "#4A6B5A",
  },
];

export default function HomePage() {
  return (
    <div style={{ fontFamily: "var(--font-lexend), sans-serif", backgroundColor: "#FEF9ED", color: "#173124", overflowX: "hidden" }}>

      {/* ── Nav ── */}
      <nav style={{
        backgroundColor: "#FEF9ED",
        padding: "1.25rem 2.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
        borderBottom: "2px solid #E5E0D5",
      }}>
        <Link
          href="/"
          style={{ textDecoration: "none", display: "inline-block" }}
        >
          <img src="/joyn-logo.svg" alt="JOYN" style={{ height: "44px" }} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <Link href="/sign-in" style={{ color: "#173124", fontWeight: 500, fontSize: "1rem", textDecoration: "none" }}>
            Sign In
          </Link>
          <Link href="/sign-up" className="btn-primary" style={{ padding: "0.625rem 1.5rem", fontSize: "1rem" }}>
            Join Free
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ backgroundColor: "#F8F3E8", padding: "6rem 2.5rem 5rem", overflow: "hidden" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "5fr 4fr", gap: "5rem", alignItems: "center" }}>

          {/* Left — editorial headline */}
          <div className="animate-fade-up">
            <p className="label-meta" style={{ marginBottom: "1.25rem" }}>
              Arizona&apos;s Senior Companionship Platform
            </p>
            <h1 style={{
              fontFamily: "var(--font-epilogue), serif",
              fontWeight: 900,
              fontSize: "clamp(3rem, 6vw, 5rem)",
              lineHeight: 0.95,
              letterSpacing: "-0.03em",
              color: "#173124",
              marginBottom: "2rem",
            }}>
              Find Your<br />
              <span style={{ color: "#735C00" }}>Person.</span><br />
              Age with<br />Joy.
            </h1>
            <p style={{
              fontSize: "1.25rem",
              lineHeight: 1.7,
              color: "#4A5C50",
              marginBottom: "2.5rem",
              maxWidth: "480px",
            }}>
              Find a real companion. Someone to talk to, laugh with, and look forward to — right here in Arizona.
            </p>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
              <Link href="/sign-up" className="btn-primary animate-fade-up delay-200">
                Join Free — It&apos;s Simple
              </Link>
              <a href="#how-it-works" className="btn-secondary animate-fade-up delay-300" style={{ border: "2px solid #173124" }}>
                See How It Works
              </a>
            </div>
            {/* Try Demo CTA */}
            <div style={{ marginTop: "1.25rem" }}>
              <Link
                href="/demo"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  backgroundColor: "#FFFFFF",
                  border: "2px solid #C2C8C2",
                  borderRadius: "3rem",
                  padding: "0.75rem 1.75rem",
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#173124",
                  textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  transition: "all 0.15s",
                }}
              >
                <span>🎬</span>
                Try Demo — No Sign Up Needed
              </Link>
              <p style={{ fontSize: "0.8rem", color: "#727973", marginTop: "0.5rem", marginLeft: "0.25rem" }}>
                Explore the full experience as a first-time user
              </p>
            </div>
          </div>

          {/* Right — stat card */}
          <div className="animate-fade-up delay-400">
            <div className="card-base" style={{ padding: "2.5rem", position: "relative", overflow: "hidden" }}>
              {/* Decorative corner accent */}
              <div style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "120px",
                height: "120px",
                background: "linear-gradient(135deg, transparent 60%, #C2C8C2 60%)",
                borderTopRightRadius: "3rem",
                opacity: 0.4,
              }} />

              <p className="label-meta" style={{ marginBottom: "1rem" }}>
                The Loneliness Reality
              </p>
              <p style={{
                fontFamily: "var(--font-epilogue), serif",
                fontWeight: 900,
                fontSize: "4.5rem",
                lineHeight: 1,
                color: "#173124",
                letterSpacing: "-0.04em",
                marginBottom: "0.5rem",
              }}>
                1 in 3
              </p>
              <p style={{ fontSize: "1.25rem", fontWeight: 500, color: "#173124", marginBottom: "1rem", lineHeight: 1.4 }}>
                seniors aged 60+ feel<br />isolated from others
              </p>
              <p style={{ fontSize: "0.85rem", color: "#727973", marginBottom: "2rem" }}>
                University of Michigan National Poll<br />on Healthy Aging, 2023
              </p>
              <div style={{
                backgroundColor: "#173124",
                borderRadius: "2rem",
                padding: "1.25rem 1.5rem",
              }}>
                <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>
                  <span style={{ color: "#E8C84A", fontWeight: 700 }}>Joyn</span> is building the antidote — one <strong>genuine friendship</strong> at a time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section style={{ backgroundColor: "#173124", padding: "3rem 2.5rem" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2rem" }}>
          {[
            { stat: "50%", label: "greater survival odds with strong social connections" },
            { stat: "1 in 3", label: "older adults aged 60+ experience chronic loneliness" },
            { stat: "3 min", label: "is all it takes to get matched with your companion on Joyn" },
          ].map((item, i) => (
            <div key={i} style={{ textAlign: "center", padding: "1rem" }}>
              <p style={{
                fontFamily: "var(--font-epilogue), serif",
                fontWeight: 900,
                fontSize: "2.75rem",
                color: "#E8C84A",
                letterSpacing: "-0.03em",
                lineHeight: 1,
                marginBottom: "0.75rem",
              }}>
                {item.stat}
              </p>
              <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ backgroundColor: "#FEF9ED", padding: "6rem 2.5rem" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "3rem", alignItems: "end", marginBottom: "4rem" }}>
            <div>
              <p className="label-meta">Platform Features</p>
            </div>
            <h2 style={{
              fontFamily: "var(--font-epilogue), serif",
              fontWeight: 800,
              fontSize: "clamp(2rem, 3.5vw, 2.75rem)",
              color: "#173124",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}>
              Everything you need to connect, belong, and thrive.
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
            {[
              {
                icon: "🤝",
                tag: "AI Matching",
                title: "Smart Companion Matching",
                desc: "Matched by personality, shared interests, life stage, and when you're free to connect. Our AI finds someone truly compatible — not just nearby.",
              },
              {
                icon: "📹",
                tag: "Virtual Connection",
                title: "Connect Face to Face, From Home",
                desc: "Video calls, virtual coffee chats, watching a show together — real connection without needing to drive anywhere.",
              },
              {
                icon: "📅",
                tag: "Stay in Touch",
                title: "Stay in Touch, Every Week",
                desc: "Gentle reminders to check in. Celebrate each other. Never let too much time pass between conversations.",
              },
              {
                icon: "📍",
                tag: "Event Discovery",
                title: "Arizona Events, Curated",
                desc: "Community gatherings, book clubs, and social outings — surfaced by AI and filtered to what you actually enjoy.",
              },
            ].map((f, i) => (
              <div key={i} className="card-base" style={{ padding: "2.5rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "2.75rem", lineHeight: 1 }}>{f.icon}</div>
                  <span className="label-meta" style={{ color: "#727973" }}>{f.tag}</span>
                </div>
                <h3 style={{
                  fontFamily: "var(--font-epilogue), serif",
                  fontWeight: 700,
                  fontSize: "1.5rem",
                  color: "#173124",
                  marginBottom: "0.75rem",
                  letterSpacing: "-0.02em",
                }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: "1.125rem", color: "#4A5C50", lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ backgroundColor: "#F8F3E8", padding: "6rem 2.5rem" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <p className="label-meta" style={{ marginBottom: "1rem" }}>Real Stories</p>
            <h2 style={{
              fontFamily: "var(--font-epilogue), serif",
              fontWeight: 800,
              fontSize: "clamp(2rem, 3.5vw, 2.75rem)",
              color: "#173124",
              letterSpacing: "-0.02em",
            }}>
              They found their person. You can too.
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2rem" }}>
            {testimonials.map((t, i) => (
              <div key={i} className="card-base" style={{ padding: "2.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* Quote */}
                <p style={{ fontSize: "1.125rem", color: "#4A5C50", lineHeight: 1.75, fontStyle: "italic", flex: 1 }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                {/* Author */}
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    backgroundColor: t.color,
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-epilogue), serif",
                    fontWeight: 700,
                    fontSize: "1rem",
                    flexShrink: 0,
                  }}>
                    {t.initials}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: "#173124", fontSize: "1rem" }}>{t.name}, {t.age}</p>
                    <p style={{ fontSize: "0.85rem", color: "#727973" }}>{t.city}, AZ</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" style={{ backgroundColor: "#FEF9ED", padding: "6rem 2.5rem" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <p className="label-meta" style={{ marginBottom: "1rem" }}>Simple as 1-2-3</p>
            <h2 style={{
              fontFamily: "var(--font-epilogue), serif",
              fontWeight: 800,
              fontSize: "clamp(2rem, 3.5vw, 2.75rem)",
              color: "#173124",
              letterSpacing: "-0.02em",
            }}>
              How It Works
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {[
              {
                num: "01",
                title: "Tell us about yourself",
                desc: "A warm 3-minute chat with Jo, our AI guide. Just answer a few simple questions — no forms, no typing required. Just conversation.",
              },
              {
                num: "02",
                title: "Meet your companion",
                desc: "Our AI pairs you with a compatible companion — shared interests, life stage, and your preferred schedule.",
              },
              {
                num: "03",
                title: "Start your friendship",
                desc: "Have your first conversation. Then another. Real friendship takes shape one chat at a time.",
              },
            ].map((step, i) => (
              <div key={i} style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr",
                gap: "2rem",
                alignItems: "center",
                backgroundColor: "#E7E2D7",
                border: "2px solid #C2C8C2",
                borderRadius: "2rem",
                padding: "2rem 2.5rem",
              }}>
                <div style={{
                  fontFamily: "var(--font-epilogue), serif",
                  fontWeight: 900,
                  fontSize: "2.5rem",
                  color: "#735C00",
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                }}>
                  {step.num}
                </div>
                <div>
                  <h3 style={{
                    fontFamily: "var(--font-epilogue), serif",
                    fontWeight: 700,
                    fontSize: "1.375rem",
                    color: "#173124",
                    marginBottom: "0.5rem",
                    letterSpacing: "-0.02em",
                  }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: "1.125rem", color: "#4A5C50", lineHeight: 1.7, margin: 0 }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For Family Members ── */}
      <section style={{ backgroundColor: "#173124", padding: "4rem 2.5rem" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
          <div>
            <p className="label-meta" style={{ color: "#E8C84A", marginBottom: "1rem" }}>For Family Members</p>
            <h2 style={{
              fontFamily: "var(--font-epilogue), serif",
              fontWeight: 800,
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              marginBottom: "1.25rem",
            }}>
              Worried about a parent who seems isolated?
            </h2>
            <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.7 }}>
              Share Joyn with them. It takes 3 minutes to get started, and it&apos;s completely free. You can help them set it up together.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Link href="/sign-up" style={{
              display: "block",
              backgroundColor: "#E8C84A",
              color: "#173124",
              fontWeight: 700,
              padding: "1.125rem 2rem",
              borderRadius: "3rem",
              fontSize: "1.125rem",
              textDecoration: "none",
              textAlign: "center",
            }}>
              Share Joyn with a Loved One
            </Link>
            <a href="tel:+16025551234" style={{
              display: "block",
              backgroundColor: "transparent",
              color: "#FFFFFF",
              fontWeight: 600,
              padding: "1rem 2rem",
              borderRadius: "3rem",
              fontSize: "1rem",
              textDecoration: "none",
              textAlign: "center",
              border: "2px solid rgba(255,255,255,0.4)",
            }}>
              📞 Call Us: (602) 555-1234
            </a>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ backgroundColor: "#F8F3E8", padding: "7rem 2.5rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute",
          bottom: "-2rem",
          right: "5%",
          fontFamily: "var(--font-epilogue), serif",
          fontWeight: 900,
          fontSize: "clamp(8rem, 20vw, 18rem)",
          color: "rgba(23,49,36,0.04)",
          letterSpacing: "-0.05em",
          lineHeight: 1,
          userSelect: "none",
          pointerEvents: "none",
        }}>
          JOYN
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <p className="label-meta" style={{ marginBottom: "1.25rem" }}>
            Join Today
          </p>
          <h2 style={{
            fontFamily: "var(--font-epilogue), serif",
            fontWeight: 900,
            fontSize: "clamp(2.5rem, 5vw, 4rem)",
            color: "#173124",
            marginBottom: "1.5rem",
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
          }}>
            Ready to find<br />your person?
          </h2>
          <p style={{ fontSize: "1.25rem", color: "#4A5C50", marginBottom: "2.5rem" }}>
            Free. Simple. Takes less than 5 minutes.
          </p>
          <Link href="/sign-up" className="btn-primary" style={{ fontSize: "1.25rem", padding: "1.125rem 2.5rem" }}>
            Find Your Companion Today
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ backgroundColor: "#173124", padding: "3rem 2.5rem" }}>
        <div style={{
          maxWidth: "1280px",
          margin: "0 auto",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "2rem",
            marginBottom: "2rem",
            paddingBottom: "2rem",
            borderBottom: "1px solid rgba(255,255,255,0.15)",
          }}>
            <div>
              <img src="/joyn-logo.svg" alt="JOYN" style={{ height: "36px", filter: "brightness(0) invert(1)" }} />
              <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.6)", marginTop: "0.25rem" }}>
                Find Your Person. Age with Joy.
              </p>
              <a href="tel:+16025551234" style={{ display: "block", color: "#E8C84A", fontSize: "1rem", fontWeight: 600, marginTop: "0.875rem", textDecoration: "none" }}>
                📞 (602) 555-1234
              </a>
              <a href="mailto:hello@joynapp.com" style={{ display: "block", color: "rgba(255,255,255,0.7)", fontSize: "0.9rem", marginTop: "0.375rem", textDecoration: "none" }}>
                hello@joynapp.com
              </a>
            </div>
            <div style={{ display: "flex", gap: "3rem", flexWrap: "wrap" }}>
              <div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>Platform</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <Link href="/sign-up" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: "0.95rem" }}>Join Free</Link>
                  <Link href="/sign-in" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: "0.95rem" }}>Sign In</Link>
                  <Link href="/#how-it-works" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: "0.95rem" }}>How It Works</Link>
                </div>
              </div>
              <div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>Legal</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <Link href="/privacy" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: "0.95rem" }}>Privacy Policy</Link>
                  <Link href="/terms" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: "0.95rem" }}>Terms of Service</Link>
                  <a href="mailto:hello@joynapp.com" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: "0.95rem" }}>Contact Us</a>
                </div>
              </div>
            </div>
          </div>
          <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
            © 2026 Joyn. Arizona&apos;s Senior Companionship Platform. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
