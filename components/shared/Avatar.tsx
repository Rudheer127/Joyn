"use client";

import Image from "next/image";

interface AvatarProps {
  avatarUrl?: string | null;
  photoPublic?: boolean;
  gender?: string | null;
  name?: string;
  size?: number;
  style?: React.CSSProperties;
}

// Gender-differentiated SVG silhouettes
function MaleSilhouette({ size }: { size: number }) {
  return (
    <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="22" r="16" fill="white" fillOpacity="0.85" />
      <ellipse cx="40" cy="62" rx="26" ry="18" fill="white" fillOpacity="0.85" />
    </svg>
  );
}

function FemaleSilhouette({ size }: { size: number }) {
  return (
    <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="22" r="16" fill="white" fillOpacity="0.85" />
      {/* Slightly wider hip for differentiation */}
      <ellipse cx="40" cy="63" rx="29" ry="17" fill="white" fillOpacity="0.85" />
    </svg>
  );
}

function GenericSilhouette({ size }: { size: number }) {
  return (
    <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="22" r="16" fill="white" fillOpacity="0.85" />
      <ellipse cx="40" cy="62" rx="27" ry="18" fill="white" fillOpacity="0.85" />
    </svg>
  );
}

// Background colours by gender — all green-toned to match Joyn brand
function getBgColor(gender?: string | null) {
  if (gender === "female") return "linear-gradient(135deg, #2D7A5F 0%, #4CAF85 100%)";
  if (gender === "male")   return "linear-gradient(135deg, #173124 0%, #2D5240 100%)";
  return "linear-gradient(135deg, #3B6E55 0%, #5A9E7A 100%)";
}

export function Avatar({ avatarUrl, photoPublic = true, gender, name, size = 72, style }: AvatarProps) {
  const showPhoto = avatarUrl && photoPublic;

  if (showPhoto) {
    return (
      <Image
        src={avatarUrl}
        alt={name ? `${name}'s profile photo` : "Profile photo"}
        width={size}
        height={size}
        style={{
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          border: "3px solid rgba(255,255,255,0.3)",
          ...style,
        }}
      />
    );
  }

  // No photo — show gender silhouette
  return (
    <div
      aria-label={name ? `${name}'s profile silhouette` : "Profile silhouette"}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: getBgColor(gender),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        border: "3px solid rgba(255,255,255,0.2)",
        overflow: "hidden",
        ...style,
      }}
    >
      {gender === "female" ? (
        <FemaleSilhouette size={size} />
      ) : gender === "male" ? (
        <MaleSilhouette size={size} />
      ) : (
        <GenericSilhouette size={size} />
      )}
    </div>
  );
}
