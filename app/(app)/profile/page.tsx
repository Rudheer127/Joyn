"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/shared/Avatar";

const arizonaCities = [
  "Phoenix", "Scottsdale", "Mesa", "Tempe", "Chandler", "Gilbert",
  "Peoria", "Glendale", "Sun City", "Sun City West", "Surprise",
  "Ahwatukee", "Fountain Hills", "Cave Creek", "Carefree",
  "Sedona", "Flagstaff", "Tucson", "Green Valley", "Sierra Vista",
];

const allInterests = [
  // Fitness
  "Chair Yoga", "Walking", "Stretching", "Light Resistance", "Dancing", "Swimming", "Cycling",
  // Creative
  "Gardening", "Cooking", "Painting", "Photography", "Music",
  // Social & Games
  "Card Games", "Board Games", "Chess",
  // Intellectual
  "Reading", "History", "Movies",
  // Life & Community
  "Birdwatching", "Volunteering", "Travel", "Grandchildren", "Pets",
];

const fitnessLevels = ["Beginner", "Moderate", "Active"];
const connectionPrefs = [
  { value: "same_age", label: "Same Age" },
  { value: "younger", label: "Younger People" },
  { value: "both", label: "Both" },
];

const lifeStages = [
  { value: "recently_retired", label: "Recently retired" },
  { value: "widowed", label: "Widowed" },
  { value: "recently_relocated", label: "Recently relocated" },
  { value: "empty_nester", label: "Empty nester" },
  { value: "long_time_resident", label: "Long-time resident" },
  { value: "other", label: "Other" },
];

const socialComfortOptions = [
  { value: "one_on_one", label: "I prefer 1-on-1 time" },
  { value: "small_group", label: "I enjoy small groups (2–4)" },
  { value: "large_group", label: "I'm comfortable in larger groups" },
];

const lookingForOptions = [
  "An activity buddy",
  "Someone to talk to",
  "Group events and outings",
  "Volunteer opportunities",
];

const availabilityOptions = ["Mornings", "Afternoons", "Evenings", "Weekends"];

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("Phoenix");
  const [bio, setBio] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [connectionPref, setConnectionPref] = useState("both");
  const [fitnessLevel, setFitnessLevel] = useState("Beginner");
  const [healthGoals, setHealthGoals] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [saved, setSaved] = useState(false);
  const [lifeStage, setLifeStage] = useState("");
  const [socialComfort, setSocialComfort] = useState("");
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);
  const [mounted] = useState(true);
  const [loading, setLoading] = useState(true);
  // Avatar / photo state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [photoPublic, setPhotoPublic] = useState(true);
  const [gender, setGender] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
        
      if (profile) {
        if (profile.full_name) setName(profile.full_name);
        if (profile.age) setAge(profile.age.toString());
        if (profile.city) setCity(profile.city);
        if (profile.bio) setBio(profile.bio);
        if (profile.fitness_level) {
          const fl = profile.fitness_level;
          setFitnessLevel(fl.charAt(0).toUpperCase() + fl.slice(1));
        }
        if (profile.connection_preference) setConnectionPref(profile.connection_preference);
        if (profile.health_goals && profile.health_goals.length > 0) {
          setHealthGoals(profile.health_goals.join("\n"));
        }
        // New avatar fields
        if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
        if (profile.gender) setGender(profile.gender);
        if (typeof profile.photo_public === "boolean") setPhotoPublic(profile.photo_public);
      }

      const { data: userInterests } = await supabase
        .from("user_interests")
        .select("interests(name)")
        .eq("user_id", user.id);
        
      if (userInterests) {
        const interests = (userInterests as unknown as { interests: { name: string } | null }[])
          .map((ui) => ui.interests?.name)
          .filter((n): n is string => Boolean(n));
        setSelectedInterests(interests);
      }
      setLoading(false);
    }
    loadProfile();
  }, [supabase]);

  function toggleLookingFor(opt: string) {
    setLookingFor((prev) =>
      prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]
    );
  }

  function toggleAvailability(opt: string) {
    setAvailability((prev) =>
      prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]
    );
  }

  function toggleInterest(interest: string) {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await supabase.from("profiles").upsert({
        id: user.id,
        full_name: name || null,
        age: age ? parseInt(age) : null,
        city: city || null,
        bio: bio || null,
        fitness_level: fitnessLevel.toLowerCase(),
        health_goals: healthGoals ? [healthGoals] : [],
        connection_preference: connectionPref,
        onboarding_completed: true,
        // New fields
        avatar_url: avatarUrl || null,
        gender: gender || null,
        photo_public: photoPublic,
        updated_at: new Date().toISOString(),
      });

      // 2. Save interests
      if (selectedInterests.length > 0) {
        const { data: allDbInterests } = await supabase.from("interests").select("id, name");
        if (allDbInterests) {
          const lowerUserInterests = selectedInterests.map(i => i.toLowerCase());
          const junctionRows = allDbInterests
            .filter(i => lowerUserInterests.includes(i.name.toLowerCase()))
            .map(i => ({ user_id: user.id, interest_id: i.id }));
            
          // Delete old interests then insert new ones
          await supabase.from("user_interests").delete().eq("user_id", user.id);
          if (junctionRows.length > 0) {
            await supabase.from("user_interests").insert(junctionRows);
          }
        }
      } else {
        await supabase.from("user_interests").delete().eq("user_id", user.id);
      }

      // 3. Trigger embedding generation async
      fetch("/api/ai/match/embed", { method: "POST" }).catch(console.error);

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
  }

  if (!mounted || loading) {
    return (
      <div style={{ padding: "2.5rem", color: "#727973", fontFamily: "'Lexend', sans-serif" }}>
        Loading your profile...
      </div>
    );
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) { alert("Upload failed: " + upErr.message); return; }
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(publicUrl);
      // Save immediately
      await supabase.from("profiles").upsert({ id: user.id, avatar_url: publicUrl, updated_at: new Date().toISOString() });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      suppressHydrationWarning
      style={{
        fontFamily: "'Lexend', sans-serif",
        color: "#173124",
        padding: "2.5rem",
        maxWidth: "1100px",
        margin: "0 auto",
      }}
    >
      <h1
        style={{
          fontFamily: "'Epilogue', serif",
          fontWeight: 800,
          fontSize: "2.25rem",
          color: "#173124",
          letterSpacing: "-0.02em",
          marginBottom: "2.5rem",
        }}
      >
        Your Profile
      </h1>

      <form onSubmit={handleSave}>
        {/* Avatar section */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5rem", marginBottom: "2.5rem", flexWrap: "wrap" }}>

          {/* Avatar preview using shared component */}
          <Avatar
            avatarUrl={avatarUrl}
            photoPublic={photoPublic}
            gender={gender}
            name={name}
            size={100}
          />

          <div style={{ flex: 1, minWidth: "200px" }}>
            <p style={{ fontWeight: 700, fontSize: "1rem", color: "#173124", marginBottom: "0.75rem" }}>
              Profile Photo
            </p>

            {/* Upload button */}
            <label
              htmlFor="photo-upload"
              style={{
                display: "inline-block",
                backgroundColor: uploading ? "#D4C9A8" : "#E7E2D7",
                border: "2px solid #C2C8C2",
                borderRadius: "3rem",
                padding: "0.5rem 1.25rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "#173124",
                cursor: uploading ? "wait" : "pointer",
                marginBottom: "0.75rem",
                marginRight: "0.625rem",
              }}
            >
              {uploading ? "Uploading…" : avatarUrl ? "Change Photo" : "📷 Upload Photo"}
            </label>
            <input
              id="photo-upload"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handlePhotoUpload}
            />

            {/* Public / Private toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setPhotoPublic(!photoPublic)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  backgroundColor: photoPublic ? "#E8F4EC" : "#F5F0E8",
                  border: `2px solid ${photoPublic ? "#173124" : "#C2C8C2"}`,
                  borderRadius: "3rem", padding: "0.375rem 1rem",
                  fontSize: "0.875rem", fontWeight: 600,
                  color: photoPublic ? "#173124" : "#727973",
                  cursor: "pointer",
                }}
              >
                <span>{photoPublic ? "🔓" : "🔒"}</span>
                <span>{photoPublic ? "Photo visible to matches" : "Photo hidden (private)"}</span>
              </button>
            </div>
            <p style={{ fontSize: "0.8rem", color: "#727973", marginTop: "0.375rem" }}>
              {photoPublic ? "Matches can see your photo. This builds trust." : "Only you can see your photo. Matches see a silhouette."}
            </p>
          </div>
        </div>

        {/* Basic info */}
        <div
          style={{
            backgroundColor: "#E7E2D7",
            border: "2px solid #C2C8C2",
            borderRadius: "2.5rem",
            padding: "2rem",
            marginBottom: "1.5rem",
          }}
        >
          <p
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#735C00",
              marginBottom: "1.5rem",
            }}
          >
            Basic Information
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "1rem" }}>
                Full Name
              </label>
              <input
                type="text"
                className="input-base"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "1rem" }}>
                I identify as
              </label>
              <select
                className="input-base"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                style={{ cursor: "pointer" }}
              >
                <option value="">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="non_binary">Non-binary</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "1rem" }}>
                Age
              </label>
              <input
                type="number"
                className="input-base"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Your age"
                min="50"
                max="110"
              />
            </div>
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "1rem" }}>
              City (Arizona)
            </label>
            <select
              className="input-base"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={{ cursor: "pointer" }}
            >
              {arizonaCities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* About Me — full-width standalone card */}
        <div
          style={{
            backgroundColor: "#E7E2D7",
            border: "2px solid #C2C8C2",
            borderRadius: "2.5rem",
            padding: "2rem",
            marginBottom: "1.5rem",
          }}
        >
          <p
            style={{
              fontSize: "0.875rem", fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.05em",
              color: "#735C00", marginBottom: "0.375rem",
            }}
          >
            About Me
          </p>
          <p style={{ fontSize: "0.9rem", color: "#727973", marginBottom: "1rem" }}>
            This is what companions see on your profile — share your story, what you enjoy, and what you&apos;re looking for.
          </p>
          <textarea
            className="input-base"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="e.g. Retired nurse from Scottsdale who loves gardening, long walks and a good cup of tea. I recently moved closer to my grandchildren and I'm looking forward to making new friends in the area..."
            rows={7}
            style={{ resize: "vertical", width: "100%", boxSizing: "border-box", fontSize: "1.05rem", lineHeight: 1.7 }}
          />
        </div>

        {/* ── Two-column panel grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem", alignItems: "start" }}>

        {/* Interests */}
        <div
          style={{
            backgroundColor: "#E7E2D7",
            border: "2px solid #C2C8C2",
            borderRadius: "2.5rem",
            padding: "2rem",
            marginBottom: "1.5rem",
          }}
        >
          <p
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#735C00",
              marginBottom: "0.5rem",
            }}
          >
            Interests
          </p>
          <p style={{ fontSize: "0.9rem", color: "#727973", marginBottom: "1.25rem" }}>
            Tap to select the activities you enjoy
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
            {allInterests.map((interest) => {
              const isSelected = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  style={{
                    padding: "0.5rem 1.125rem",
                    borderRadius: "3rem",
                    fontSize: "1rem",
                    fontWeight: 500,
                    border: "2px solid",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    minHeight: "44px",
                    borderColor: isSelected ? "#173124" : "#C2C8C2",
                    backgroundColor: isSelected ? "#173124" : "transparent",
                    color: isSelected ? "#FFFFFF" : "#173124",
                  }}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        {/* Life stage */}
        <div
          style={{
            backgroundColor: "#E7E2D7",
            border: "2px solid #C2C8C2",
            borderRadius: "2.5rem",
            padding: "2rem",
            marginBottom: "1.5rem",
          }}
        >
          <p style={{ fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#735C00", marginBottom: "0.5rem" }}>
            Life Stage
          </p>
          <p style={{ fontSize: "0.9rem", color: "#727973", marginBottom: "1.25rem" }}>
            Which best describes where you are in life right now?
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
            {lifeStages.map((stage) => {
              const isSelected = lifeStage === stage.value;
              return (
                <button
                  key={stage.value}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setLifeStage(isSelected ? "" : stage.value)}
                  style={{
                    padding: "0.625rem 1.25rem",
                    borderRadius: "3rem",
                    fontSize: "1rem",
                    fontWeight: 500,
                    border: "2px solid",
                    cursor: "pointer",
                    minHeight: "44px",
                    borderColor: isSelected ? "#173124" : "#C2C8C2",
                    backgroundColor: isSelected ? "#173124" : "transparent",
                    color: isSelected ? "#FFFFFF" : "#173124",
                  }}
                >
                  {stage.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Social comfort */}
        <div
          style={{
            backgroundColor: "#E7E2D7",
            border: "2px solid #C2C8C2",
            borderRadius: "2.5rem",
            padding: "2rem",
            marginBottom: "1.5rem",
          }}
        >
          <p style={{ fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#735C00", marginBottom: "0.5rem" }}>
            Social Comfort Level
          </p>
          <p style={{ fontSize: "0.9rem", color: "#727973", marginBottom: "1.25rem" }}>
            What kind of social setting feels most comfortable to you?
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
            {socialComfortOptions.map((opt) => {
              const isSelected = socialComfort === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSocialComfort(isSelected ? "" : opt.value)}
                  style={{
                    padding: "0.75rem 1.5rem",
                    borderRadius: "3rem",
                    fontSize: "1rem",
                    fontWeight: 500,
                    border: "2px solid",
                    cursor: "pointer",
                    minHeight: "48px",
                    textAlign: "left",
                    borderColor: isSelected ? "#173124" : "#C2C8C2",
                    backgroundColor: isSelected ? "#173124" : "transparent",
                    color: isSelected ? "#FFFFFF" : "#173124",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* What I'm looking for */}
        <div
          style={{
            backgroundColor: "#E7E2D7",
            border: "2px solid #C2C8C2",
            borderRadius: "2.5rem",
            padding: "2rem",
            marginBottom: "1.5rem",
          }}
        >
          <p style={{ fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#735C00", marginBottom: "0.5rem" }}>
            What I&apos;m Looking For
          </p>
          <p style={{ fontSize: "0.9rem", color: "#727973", marginBottom: "1.25rem" }}>
            Select all that apply
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
            {lookingForOptions.map((opt) => {
              const isSelected = lookingFor.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleLookingFor(opt)}
                  style={{
                    padding: "0.625rem 1.25rem",
                    borderRadius: "3rem",
                    fontSize: "1rem",
                    fontWeight: 500,
                    border: "2px solid",
                    cursor: "pointer",
                    minHeight: "44px",
                    borderColor: isSelected ? "#173124" : "#C2C8C2",
                    backgroundColor: isSelected ? "#173124" : "transparent",
                    color: isSelected ? "#FFFFFF" : "#173124",
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Availability */}
        <div
          style={{
            backgroundColor: "#E7E2D7",
            border: "2px solid #C2C8C2",
            borderRadius: "2.5rem",
            padding: "2rem",
            marginBottom: "1.5rem",
          }}
        >
          <p style={{ fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#735C00", marginBottom: "0.5rem" }}>
            Availability
          </p>
          <p style={{ fontSize: "0.9rem", color: "#727973", marginBottom: "1.25rem" }}>
            When are you generally free to connect?
          </p>
          <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
            {availabilityOptions.map((opt) => {
              const isSelected = availability.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleAvailability(opt)}
                  style={{
                    padding: "0.625rem 1.25rem",
                    borderRadius: "3rem",
                    fontSize: "1rem",
                    fontWeight: 500,
                    border: "2px solid",
                    cursor: "pointer",
                    minHeight: "44px",
                    borderColor: isSelected ? "#173124" : "#C2C8C2",
                    backgroundColor: isSelected ? "#173124" : "transparent",
                    color: isSelected ? "#FFFFFF" : "#173124",
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Connection preference */}
        <div
          style={{
            backgroundColor: "#E7E2D7",
            border: "2px solid #C2C8C2",
            borderRadius: "2.5rem",
            padding: "2rem",
            marginBottom: "1.5rem",
          }}
        >
          <p
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#735C00",
              marginBottom: "0.5rem",
            }}
          >
            I want to connect with
          </p>
          <p style={{ fontSize: "0.9rem", color: "#727973", marginBottom: "1.25rem" }}>
            Choose who you&apos;d like to be matched with
          </p>
          <div style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap" }}>
            {connectionPrefs.map((pref) => {
              const isSelected = connectionPref === pref.value;
              return (
                <button
                  key={pref.value}
                  type="button"
                  onClick={() => setConnectionPref(pref.value)}
                  style={{
                    padding: "0.75rem 1.5rem",
                    borderRadius: "3rem",
                    fontSize: "1rem",
                    fontWeight: 600,
                    border: "2px solid",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    minHeight: "48px",
                    borderColor: isSelected ? "#173124" : "#C2C8C2",
                    backgroundColor: isSelected ? "#173124" : "transparent",
                    color: isSelected ? "#FFFFFF" : "#173124",
                  }}
                >
                  {pref.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fitness level */}
        <div
          style={{
            backgroundColor: "#E7E2D7",
            border: "2px solid #C2C8C2",
            borderRadius: "2.5rem",
            padding: "2rem",
            marginBottom: "1.5rem",
          }}
        >
          <p
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#735C00",
              marginBottom: "0.5rem",
            }}
          >
            How Active Are You?
          </p>
          <p style={{ fontSize: "0.9rem", color: "#727973", marginBottom: "1.25rem" }}>
            How would you describe your current activity level? (This is optional.)
          </p>
          <div style={{ display: "flex", gap: "0.875rem" }}>
            {fitnessLevels.map((level) => {
              const isSelected = fitnessLevel === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFitnessLevel(level)}
                  style={{
                    flex: 1,
                    padding: "0.875rem 1rem",
                    borderRadius: "3rem",
                    fontSize: "1rem",
                    fontWeight: 600,
                    border: "2px solid",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    minHeight: "52px",
                    borderColor: isSelected ? "#173124" : "#C2C8C2",
                    backgroundColor: isSelected ? "#173124" : "transparent",
                    color: isSelected ? "#FFFFFF" : "#173124",
                  }}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>

        {/* Health goals */}
        <div
          style={{
            backgroundColor: "#E7E2D7",
            border: "2px solid #C2C8C2",
            borderRadius: "2.5rem",
            padding: "2rem",
            marginBottom: "1.5rem",
          }}
        >
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
            What Are You Hoping to Find?
          </p>
          <textarea
            className="input-base"
            value={healthGoals}
            onChange={(e) => setHealthGoals(e.target.value)}
            placeholder="What matters most to you right now? e.g., someone to have coffee with, a person to call on hard days, a friend who gets what this stage of life is like."
            rows={3}
            style={{ resize: "vertical" }}
          />
        </div>

        {/* Emergency contact */}
        <div
          style={{
            backgroundColor: "#E7E2D7",
            border: "2px solid #C2C8C2",
            borderRadius: "2.5rem",
            padding: "2rem",
            marginBottom: "2rem",
          }}
        >
          <p
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#735C00",
              marginBottom: "0.5rem",
            }}
          >
            Emergency Contact
          </p>
          <p style={{ fontSize: "0.9rem", color: "#727973", marginBottom: "1.25rem" }}>
            Optional but recommended for your safety
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "1rem" }}>
                Contact Name
              </label>
              <input
                type="text"
                className="input-base"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "1rem" }}>
                Phone Number
              </label>
              <input
                type="tel"
                className="input-base"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="(602) 555-0100"
              />
            </div>
          </div>
        </div>

        </div>{/* end two-column grid */}

        {/* Save button */}
        <button
          type="submit"
          style={{
            backgroundColor: saved ? "#735C00" : "#173124",
            color: "#FFFFFF",
            fontWeight: 600,
            padding: "1rem 2rem",
            borderRadius: "3rem",
            fontSize: "1.125rem",
            border: "none",
            cursor: "pointer",
            width: "100%",
            minHeight: "56px",
            transition: "background-color 0.3s",
          }}
        >
          {saved ? "✓ Profile Saved!" : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
