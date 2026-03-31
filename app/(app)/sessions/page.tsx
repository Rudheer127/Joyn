"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Session = {
  id: string;
  partner: string;
  date: string;
  time: string;
  activity: string;
  status: string;
};

export default function SessionsPage() {
  const router = useRouter();

  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([
    {
      id: "1",
      partner: "Margaret",
      date: "Tomorrow",
      time: "10:00 AM",
      activity: "Morning Coffee Chat",
      status: "scheduled",
    },
    {
      id: "2",
      partner: "Robert",
      date: "Thursday, April 3",
      time: "8:30 AM",
      activity: "Watching Jeopardy Together",
      status: "scheduled",
    },
    {
      id: "3",
      partner: "Dorothy",
      date: "Saturday, April 5",
      time: "9:00 AM",
      activity: "Book Club Call",
      status: "scheduled",
    },
  ]);

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [newPartner, setNewPartner] = useState("");
  const [newActivity, setNewActivity] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const pastSessions = [
    {
      id: "4",
      partner: "Margaret",
      date: "March 26",
      time: "10:00 AM",
      activity: "Phone Call Check-in",
      completed: true,
    },
    {
      id: "5",
      partner: "Robert",
      date: "March 24",
      time: "8:30 AM",
      activity: "Card Game Night",
      completed: true,
    },
    {
      id: "6",
      partner: "Dorothy",
      date: "March 22",
      time: "9:00 AM",
      activity: "Morning Coffee Chat",
      completed: true,
    },
  ];

  function handleScheduleSubmit() {
    const newSession: Session = {
      id: String(Date.now()),
      partner: newPartner || "Margaret",
      date: newDate,
      time: newTime,
      activity: newActivity,
      status: "scheduled",
    };
    setUpcomingSessions((prev) => [...prev, newSession]);
    setScheduleModalOpen(false);
    setNewPartner("");
    setNewActivity("");
    setNewDate("");
    setNewTime("");
  }

  return (
    <div
      style={{
        fontFamily: "'Lexend', sans-serif",
        color: "#173124",
        padding: "2.5rem",
        maxWidth: "900px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "2.5rem",
        }}
      >
        <h1
          style={{
            fontFamily: "'Epilogue', serif",
            fontWeight: 800,
            fontSize: "2.25rem",
            color: "#173124",
            letterSpacing: "-0.02em",
          }}
        >
          Your Catch-Ups
        </h1>
        <button
          onClick={() => setScheduleModalOpen(true)}
          style={{
            backgroundColor: "#173124",
            color: "#FFFFFF",
            fontWeight: 600,
            padding: "0.875rem 1.75rem",
            borderRadius: "3rem",
            fontSize: "1rem",
            border: "none",
            cursor: "pointer",
            minHeight: "48px",
          }}
        >
          + Schedule a Catch-Up
        </button>
      </div>

      {/* Upcoming sessions */}
      <section style={{ marginBottom: "3rem" }}>
        <p
          style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "#735C00",
            marginBottom: "1.25rem",
          }}
        >
          Upcoming Catch-Ups
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {upcomingSessions.map((session) => (
            <div
              key={session.id}
              style={{
                backgroundColor: "#E7E2D7",
                border: "2px solid #C2C8C2",
                borderRadius: "2rem",
                padding: "1.5rem 2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily: "'Epilogue', serif",
                    fontWeight: 700,
                    fontSize: "1.25rem",
                    color: "#173124",
                    marginBottom: "0.25rem",
                  }}
                >
                  {session.activity} with {session.partner}
                </p>
                <p style={{ fontSize: "0.9rem", color: "#727973" }}>
                  {session.date} at {session.time}
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", flexShrink: 0 }}>
                <button
                  onClick={() => router.push(`/sessions/${session.id}`)}
                  style={{
                    backgroundColor: "#173124",
                    color: "#FFFFFF",
                    fontWeight: 600,
                    padding: "0.625rem 1.25rem",
                    borderRadius: "3rem",
                    fontSize: "0.9rem",
                    border: "none",
                    cursor: "pointer",
                    minHeight: "44px",
                  }}
                >
                  Join Catch-Up
                </button>
                <button
                  onClick={() =>
                    setUpcomingSessions((prev) =>
                      prev.filter((s) => s.id !== session.id)
                    )
                  }
                  style={{
                    backgroundColor: "transparent",
                    color: "#727973",
                    fontWeight: 500,
                    padding: "0.625rem 1.25rem",
                    borderRadius: "3rem",
                    fontSize: "0.9rem",
                    border: "2px solid #C2C8C2",
                    cursor: "pointer",
                    minHeight: "44px",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Past sessions */}
      <section>
        <p
          style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "#735C00",
            marginBottom: "1.25rem",
          }}
        >
          Past Meetups
        </p>

        {/* Streak card */}
        <div
          style={{
            backgroundColor: "#173124",
            color: "#FFFFFF",
            borderRadius: "2rem",
            padding: "1.5rem 2rem",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "1.25rem",
          }}
        >
          <span style={{ fontSize: "2.5rem" }}>🌻</span>
          <div>
            <p
              style={{
                fontFamily: "'Epilogue', serif",
                fontWeight: 800,
                fontSize: "1.5rem",
                marginBottom: "0.15rem",
                color: "#E8C84A",
              }}
            >
              3 Weeks of Connection!
            </p>
            <p style={{ fontSize: "0.9rem", opacity: 0.85 }}>
              You&apos;ve stayed in touch every week for 3 weeks. Keep it up!
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {pastSessions.map((session) => (
            <div
              key={session.id}
              style={{
                backgroundColor: "#E7E2D7",
                border: "2px solid #C2C8C2",
                borderRadius: "2rem",
                padding: "1.25rem 2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                opacity: 0.85,
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily: "'Epilogue', serif",
                    fontWeight: 700,
                    fontSize: "1.125rem",
                    color: "#173124",
                    marginBottom: "0.2rem",
                  }}
                >
                  {session.activity} with {session.partner}
                </p>
                <p style={{ fontSize: "0.85rem", color: "#727973" }}>
                  {session.date} at {session.time}
                </p>
              </div>
              <span
                style={{
                  backgroundColor: "#173124",
                  color: "#FFFFFF",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  padding: "0.25rem 0.875rem",
                  borderRadius: "3rem",
                }}
              >
                ✓ Completed
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Schedule modal */}
      {scheduleModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              backgroundColor: "#FEF9ED",
              borderRadius: "2rem",
              padding: "2rem",
              maxWidth: "480px",
              width: "90%",
            }}
          >
            <h2
              style={{
                fontFamily: "'Epilogue', serif",
                fontWeight: 800,
                fontSize: "1.5rem",
                color: "#173124",
                marginBottom: "1.5rem",
              }}
            >
              Schedule a Catch-Up
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#173124",
                    marginBottom: "0.375rem",
                  }}
                >
                  Partner
                </label>
                <select
                  value={newPartner}
                  onChange={(e) => setNewPartner(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.875rem",
                    borderRadius: "0.75rem",
                    border: "2px solid #C2C8C2",
                    backgroundColor: "#FFFFFF",
                    fontFamily: "'Lexend', sans-serif",
                    fontSize: "1rem",
                    color: "#173124",
                  }}
                >
                  <option value="">Select a partner</option>
                  <option value="Margaret">Margaret</option>
                  <option value="Robert">Robert</option>
                  <option value="Dorothy">Dorothy</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#173124",
                    marginBottom: "0.375rem",
                  }}
                >
                  Activity
                </label>
                <input
                  type="text"
                  value={newActivity}
                  onChange={(e) => setNewActivity(e.target.value)}
                  placeholder="e.g. Morning Coffee Chat, Book Club Call, Watching Jeopardy"
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.875rem",
                    borderRadius: "0.75rem",
                    border: "2px solid #C2C8C2",
                    fontFamily: "'Lexend', sans-serif",
                    fontSize: "1rem",
                    color: "#173124",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#173124",
                    marginBottom: "0.375rem",
                  }}
                >
                  Date
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.875rem",
                    borderRadius: "0.75rem",
                    border: "2px solid #C2C8C2",
                    fontFamily: "'Lexend', sans-serif",
                    fontSize: "1rem",
                    color: "#173124",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#173124",
                    marginBottom: "0.375rem",
                  }}
                >
                  Time
                </label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.875rem",
                    borderRadius: "0.75rem",
                    border: "2px solid #C2C8C2",
                    fontFamily: "'Lexend', sans-serif",
                    fontSize: "1rem",
                    color: "#173124",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                marginTop: "1.75rem",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => {
                  setScheduleModalOpen(false);
                  setNewPartner("");
                  setNewActivity("");
                  setNewDate("");
                  setNewTime("");
                }}
                style={{
                  backgroundColor: "transparent",
                  color: "#727973",
                  fontWeight: 500,
                  padding: "0.625rem 1.25rem",
                  borderRadius: "3rem",
                  fontSize: "0.9rem",
                  border: "2px solid #C2C8C2",
                  cursor: "pointer",
                  minHeight: "44px",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleSubmit}
                style={{
                  backgroundColor: "#173124",
                  color: "#FFFFFF",
                  fontWeight: 600,
                  padding: "0.625rem 1.5rem",
                  borderRadius: "3rem",
                  fontSize: "0.9rem",
                  border: "none",
                  cursor: "pointer",
                  minHeight: "44px",
                }}
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
