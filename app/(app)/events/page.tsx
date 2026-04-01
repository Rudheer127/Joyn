"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const allEvents = [
  {
    id: "1",
    name: "Chandler Senior Center Yoga",
    date: "Thursday, April 3",
    time: "9:00 AM",
    location: "Chandler Community Center, Chandler, AZ",
    category: "Fitness",
    description:
      "Gentle yoga class designed for seniors, focusing on balance, flexibility, and relaxation. All levels welcome.",
  },
  {
    id: "2",
    name: "Desert Botanical Garden Morning Walk",
    date: "Monday, April 7",
    time: "7:30 AM",
    location: "Desert Botanical Garden, Phoenix, AZ",
    category: "Fitness",
    description:
      "Guided nature walk through the stunning desert landscape. Easy pace, 1.5 miles total. Admission required.",
  },
  {
    id: "3",
    name: "Sun City Card & Board Games",
    date: "Wednesday, April 9",
    time: "1:00 PM",
    location: "Sun City Recreation Center, Sun City, AZ",
    category: "Social",
    description:
      "Weekly afternoon of cards, board games, and great conversation. Newcomers always welcome!",
  },
  {
    id: "4",
    name: "Scottsdale Senior Art Class",
    date: "Friday, April 11",
    time: "10:00 AM",
    location: "Scottsdale Arts Center, Scottsdale, AZ",
    category: "Educational",
    description:
      "Watercolor painting for beginners and experienced artists alike. Supplies provided. Limited seats.",
  },
  {
    id: "5",
    name: "Tempe Town Lake Walk & Coffee",
    date: "Saturday, April 12",
    time: "8:00 AM",
    location: "Tempe Town Lake, Tempe, AZ",
    category: "Social",
    description:
      "Casual lakeside walk followed by coffee at a nearby café. A wonderful way to meet neighbors and stay active.",
  },
  {
    id: "6",
    name: "Mesa Senior Nutrition & Health Talk",
    date: "Tuesday, April 15",
    time: "11:00 AM",
    location: "Mesa Senior Center, Mesa, AZ",
    category: "Educational",
    description:
      "Free presentation by a registered dietitian on healthy eating for seniors. Q&A session included.",
  },
  {
    id: "7",
    name: "Peoria Chair Exercise Class",
    date: "Thursday, April 17",
    time: "9:30 AM",
    location: "Peoria Community Center, Peoria, AZ",
    category: "Fitness",
    description:
      "Low-impact seated exercise class great for improving strength and coordination without stress on joints.",
  },
  {
    id: "8",
    name: "Gilbert Community Potluck Dinner",
    date: "Saturday, April 19",
    time: "5:30 PM",
    location: "Gilbert Heritage District, Gilbert, AZ",
    category: "Social",
    description:
      "Bring a dish to share and meet your neighbors! Live music and community raffle. Free admission.",
  },
  {
    id: "9",
    name: "Widows & Widowers Support Circle",
    date: "Monday, April 21",
    time: "2:00 PM",
    location: "Mesa Senior Center, Mesa, AZ",
    category: "Support",
    description:
      "A warm, welcoming space to share, listen, and connect with others who understand. Facilitated by a licensed counselor. All are welcome.",
  },
  {
    id: "10",
    name: "Morning Coffee & Conversation",
    date: "Wednesday, April 23",
    time: "9:00 AM",
    location: "Old Town Coffee House, Scottsdale, AZ",
    category: "Social",
    description:
      "Drop in for a cup of coffee and easy conversation with friendly neighbors. No agenda, just good company.",
  },
  {
    id: "11",
    name: "Chess Club for Seniors",
    date: "Friday, April 25",
    time: "1:00 PM",
    location: "Chandler Public Library, Chandler, AZ",
    category: "Hobby",
    description:
      "Weekly chess club open to all skill levels. Beginners welcome — boards and pieces provided. Great for the mind!",
  },
  {
    id: "12",
    name: "Volunteer: Read to Kids at Library",
    date: "Saturday, April 26",
    time: "10:00 AM",
    location: "Phoenix Public Library, Phoenix, AZ",
    category: "Volunteer",
    description:
      "Share the joy of reading with children ages 4–8. No experience needed — just a love of stories and a warm smile.",
  },
  {
    id: "13",
    name: "Intergenerational Cooking Class",
    date: "Tuesday, April 29",
    time: "5:30 PM",
    location: "Tempe Community Center, Tempe, AZ",
    category: "Intergenerational",
    description:
      "Cook alongside ASU students and share family recipes. A fun evening of food, laughter, and cross-generational connection.",
  },
  {
    id: "14",
    name: "Book Club: Arizona Authors",
    date: "Thursday, May 1",
    time: "3:00 PM",
    location: "Glendale Public Library, Glendale, AZ",
    category: "Hobby",
    description:
      "Monthly book club celebrating Arizona writers. This month: a local mystery set in the Sonoran Desert. New members always welcome.",
  },
];

const categories = ["All", "Fitness", "Social", "Educational", "Support", "Hobby", "Volunteer", "Intergenerational"];

const categoryColors: Record<string, { bg: string; text: string }> = {
  Fitness:           { bg: "#173124", text: "#FFFFFF" },
  Social:            { bg: "#735C00", text: "#FFFFFF" },
  Educational:       { bg: "#E5E0D5", text: "#173124" },
  Support:           { bg: "#C2622A", text: "#FFFFFF" },
  Hobby:             { bg: "#6B4E8A", text: "#FFFFFF" },
  Volunteer:         { bg: "#2A7A6B", text: "#FFFFFF" },
  Intergenerational: { bg: "#2A5C8A", text: "#FFFFFF" },
};

export default function EventsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [userCity, setUserCity] = useState<string>("Phoenix");
  const [cityFilter, setCityFilter] = useState("All");

  // Load the signed-in user's city from their profile
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("profiles").select("city").eq("id", user.id).single()
        .then(({ data }) => {
          if (data?.city) {
            setUserCity(data.city);
            // Don't auto-set cityFilter — let user choose
          }
        });
    });
  }, []);

  // Unique AZ cities present in events
  const eventCities = ["All", ...Array.from(new Set(allEvents.map(e => {
    const parts = e.location.split(",");
    return parts.length >= 2 ? parts[parts.length - 2].trim() : "";
  }).filter(Boolean)))];

  // Events "near" the user's saved city
  const nearbyEvents = allEvents.filter(e =>
    e.location.toLowerCase().includes(userCity.toLowerCase())
  );

  const filteredEvents = allEvents.filter(e => {
    const matchCategory = activeCategory === "All" || e.category === activeCategory;
    const matchCity = cityFilter === "All" || e.location.toLowerCase().includes(cityFilter.toLowerCase());
    return matchCategory && matchCity;
  });

  return (
    <div
      style={{
        fontFamily: "'Lexend', sans-serif",
        color: "#173124",
        padding: "2.5rem",
      }}
    >
      {/* Header */}
      <h1
        style={{
          fontFamily: "'Epilogue', serif",
          fontWeight: 800,
          fontSize: "2.25rem",
          color: "#173124",
          letterSpacing: "-0.02em",
          marginBottom: "0.5rem",
        }}
      >
        Events Near You in Arizona
      </h1>
      <p style={{ fontSize: "1.125rem", color: "#727973", marginBottom: "1.5rem" }}>
        Community activities, fitness classes, and social gatherings across the Valley.
      </p>

      {/* Near You banner */}
      {nearbyEvents.length > 0 && (
        <div style={{
          backgroundColor: "#FFFBEA", border: "2px solid #E8C84A",
          borderRadius: "1.25rem", padding: "1.25rem 1.5rem", marginBottom: "2rem"
        }}>
          <p style={{
            fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.1em", color: "#735C00", marginBottom: "0.75rem"
          }}>📍 Near you · {userCity}</p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {nearbyEvents.map(e => (
              <button
                key={e.id}
                onClick={() => setCityFilter(userCity)}
                style={{
                  backgroundColor: "#FFFFFF", border: "2px solid #E8C84A",
                  borderRadius: "2rem", padding: "0.5rem 1.125rem",
                  fontSize: "0.95rem", fontWeight: 600, color: "#173124",
                  cursor: "pointer", textAlign: "left"
                }}
              >
                {e.name} · {e.date}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* City + Category filters */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <select
          value={cityFilter}
          onChange={e => setCityFilter(e.target.value)}
          style={{
            padding: "0.625rem 1.25rem", borderRadius: "3rem", border: "2px solid #C2C8C2",
            fontSize: "1rem", fontWeight: 600, color: "#173124", backgroundColor: "#FFFFFF",
            cursor: "pointer", outline: "none"
          }}
        >
          {eventCities.map(c => (
            <option key={c} value={c}>{c === "All" ? "All cities" : c}</option>
          ))}
        </select>
        <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "0.625rem 1.5rem",
                borderRadius: "3rem",
                fontSize: "1rem",
                fontWeight: 600,
                border: "2px solid",
                cursor: "pointer",
                minHeight: "44px",
                transition: "all 0.15s",
                borderColor: activeCategory === cat ? "#173124" : "#C2C8C2",
                backgroundColor: activeCategory === cat ? "#173124" : "transparent",
                color: activeCategory === cat ? "#FFFFFF" : "#173124",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {filteredEvents.map((event) => {
          const color = categoryColors[event.category] ?? { bg: "#E5E0D5", text: "#173124" };
          return (
            <div
              key={event.id}
              style={{
                backgroundColor: "#E7E2D7",
                border: "2px solid #C2C8C2",
                borderRadius: "2.5rem",
                padding: "2rem",
                boxShadow: "0 0 60px 0 rgba(23,49,36,0.05)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Category badge */}
              <span
                style={{
                  backgroundColor: color.bg,
                  color: color.text,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  padding: "0.25rem 0.875rem",
                  borderRadius: "3rem",
                  alignSelf: "flex-start",
                  marginBottom: "1rem",
                }}
              >
                {event.category}
              </span>

              <h3
                style={{
                  fontFamily: "'Epilogue', serif",
                  fontWeight: 700,
                  fontSize: "1.25rem",
                  color: "#173124",
                  marginBottom: "0.5rem",
                  lineHeight: 1.3,
                }}
              >
                {event.name}
              </h3>

              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#727973",
                  marginBottom: "0.25rem",
                  fontWeight: 500,
                }}
              >
                📅 {event.date} at {event.time}
              </p>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#727973",
                  marginBottom: "1rem",
                }}
              >
                📍 {event.location}
              </p>

              <p
                style={{
                  fontSize: "1rem",
                  color: "#4A5C50",
                  lineHeight: 1.65,
                  marginBottom: "1.5rem",
                  flex: 1,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {event.description}
              </p>

              <button
                style={{
                  backgroundColor: "transparent",
                  border: "2px solid #173124",
                  color: "#173124",
                  fontWeight: 600,
                  padding: "0.625rem 1.25rem",
                  borderRadius: "3rem",
                  fontSize: "1rem",
                  cursor: "pointer",
                  minHeight: "48px",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#173124";
                  (e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "#173124";
                }}
              >
                Learn More
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
