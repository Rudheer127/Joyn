"use client";

import Link from "next/link";

interface ConnectionNudgeWidgetProps {
  companionName?: string;
  companionId?: string;
  daysSince?: number;
}

const CONNECTED_THRESHOLD = 3;

export function ConnectionNudgeWidget({
  companionName,
  companionId,
  daysSince = 0,
}: ConnectionNudgeWidgetProps) {
  // If there's no companion matched yet, return null or a generic nudge
  if (!companionName || !companionId) {
    return (
      <div
        style={{
          backgroundColor: "#E7E2D7",
          border: "2px solid #C2C8C2",
          borderRadius: "2rem",
          padding: "1.5rem",
        }}
      >
        <p
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#735C00",
            marginBottom: "0.875rem",
          }}
        >
          Your Connections
        </p>
        <p style={{ fontSize: "1.0625rem", color: "#173124", lineHeight: 1.6 }}>
          Ready to meet someone new? Head over to your matches! 🌻
        </p>
      </div>
    );
  }

  const isDisconnected = daysSince === 0 || daysSince > CONNECTED_THRESHOLD;

  return (
    <div
      style={{
        backgroundColor: "#E7E2D7",
        border: "2px solid #C2C8C2",
        borderRadius: "2rem",
        padding: "1.5rem",
      }}
    >
      <p
        style={{
          fontSize: "0.75rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "#735C00",
          marginBottom: "0.875rem",
        }}
      >
        Your Connections
      </p>

      {isDisconnected ? (
        <>
          <p style={{ fontSize: "1.0625rem", color: "#173124", lineHeight: 1.6, marginBottom: "0.875rem" }}>
            {daysSince === 0
              ? `Say hello to your newest match, ${companionName}! It's a great day to reach out.`
              : `You haven't connected with anyone in ${daysSince} days — want to reach out to ${companionName}?`}
          </p>
          <Link
            href={`/match/${companionId}`}
            style={{
              display: "inline-block",
              backgroundColor: "#173124",
              color: "#FFFFFF",
              fontWeight: 600,
              padding: "0.625rem 1.25rem",
              borderRadius: "3rem",
              fontSize: "0.95rem",
              textDecoration: "none",
              minHeight: "44px",
              lineHeight: "1.5",
            }}
          >
            Reach out to {companionName} →
          </Link>
        </>
      ) : (
        <p style={{ fontSize: "1.0625rem", color: "#173124", lineHeight: 1.6 }}>
          You connected with {companionName} {daysSince} days ago. Keep it up! 🌻
        </p>
      )}
    </div>
  );
}
