// ── Joyn Demo Mode Data ───────────────────────────────────────────────────────
// This file provides all mock data for the demo experience.
// Every "Try Demo" click resets to this fresh state.

export const DEMO_KEY = "joyn_demo_mode";

export const DEMO_USER = {
  id: "demo-user-001",
  full_name: "Margaret",
  age: 68,
  city: "Scottsdale",
  gender: "female",
  bio: "Retired school teacher who loves gardening, morning walks, and a good cup of tea. I moved here two years ago to be closer to my grandchildren and I'm looking forward to meeting new people and building new friendships.",
  fitness_level: "moderate",
  connection_preference: "both",
  health_goals: ["Reduce loneliness", "Stay active", "Make new friends"],
  interests: ["Gardening", "Reading", "Walking", "Cooking", "Birdwatching"],
  streak_count: 3,
  onboarding_completed: true,
  avatar_url: null,
  photo_public: true,
};

export const DEMO_MATCHES = [
  {
    id: "dm-001",
    name: "Dorothy",
    age: 71,
    city: "Scottsdale",
    gender: "female",
    matchPct: 94,
    distanceLabel: "8 min away",
    fitness: "Moderate",
    interests: ["Walking", "Gardening", "Reading", "Cooking"],
    bio: "Retired librarian who loves early morning walks and cooking for friends. I lost my husband three years ago and found that staying connected keeps me going.",
    whyFit: "You both love morning walks and quiet one-on-one conversations. Dorothy is also a passionate gardener — you two will have a lot to talk about over tea.",
    connectionSuggestion: "coffee",
  },
  {
    id: "dm-002",
    name: "Robert",
    age: 72,
    city: "Phoenix",
    gender: "male",
    matchPct: 88,
    distanceLabel: "22 min away",
    fitness: "Active",
    interests: ["Birdwatching", "Walking", "History", "Chess"],
    bio: "Retired engineer and avid birdwatcher. I moved to Arizona for the weather and the wildlife. Looking for someone to share morning walks and good conversation.",
    whyFit: "Robert shares your love of birdwatching and long walks. He's thoughtful, easy to talk to, and values honest conversation — just like you.",
    connectionSuggestion: "walking",
  },
  {
    id: "dm-003",
    name: "Carol",
    age: 66,
    city: "Mesa",
    gender: "female",
    matchPct: 85,
    distanceLabel: "18 min away",
    fitness: "Gentle",
    interests: ["Reading", "Music", "Cooking", "Movies"],
    bio: "Former nurse who loves mystery novels and home cooking. I retired two years ago and I'm slowly building a new social life after relocating from Chicago.",
    whyFit: "You and Carol are both building social lives in a new chapter — she's warm, patient, and loves the same quiet activities you enjoy.",
    connectionSuggestion: "coffee",
  },
  {
    id: "dm-004",
    name: "Harold",
    age: 74,
    city: "Tempe",
    gender: "male",
    matchPct: 81,
    distanceLabel: "30 min away",
    fitness: "Gentle",
    interests: ["Card Games", "Reading", "History", "Grandchildren"],
    bio: "Retired high school principal. I run a weekly card game group and love talking about history. My grandkids are the light of my life.",
    whyFit: "Harold's warmth and love of connection mirrors yours. You'll both appreciate someone who values real conversation over surface-level small talk.",
    connectionSuggestion: "talk",
  },
  {
    id: "dm-005",
    name: "Patricia",
    age: 63,
    city: "Scottsdale",
    gender: "female",
    matchPct: 79,
    distanceLabel: "12 min away",
    fitness: "Moderate",
    interests: ["Cooking", "Gardening", "Volunteering", "Dancing"],
    bio: "Recently retired florist who volunteers at the local senior centre twice a week. I love growing herbs and cooking with them.",
    whyFit: "Patricia lives nearby and shares your passion for gardening. She's active in the community and would love a companion for weekend meetups.",
    connectionSuggestion: "group",
  },
  {
    id: "dm-006",
    name: "George",
    age: 69,
    city: "Glendale",
    gender: "male",
    matchPct: 76,
    distanceLabel: "35 min away",
    fitness: "Active",
    interests: ["Walking", "Swimming", "Music", "Movies"],
    bio: "Widower and former jazz musician who stays active with daily walks and weekly swims. Looking for good conversation and maybe someone to catch a film with.",
    whyFit: "George is gentle, creative, and emotionally open — the kind of person who makes every conversation feel easy and unhurried.",
    connectionSuggestion: "phone",
  },
];

export const DEMO_MESSAGES = [
  {
    id: "conv-001",
    matchId: "dm-001",
    matchName: "Dorothy",
    matchGender: "female",
    lastMessage: "That sounds lovely! I know a great trail near Camelback that's perfect for mornings.",
    lastTime: "Yesterday",
    unread: 1,
    messages: [
      { from: "them", text: "Hello Margaret! I saw that we were matched on Joyn. I love your bio — I'm a gardener too!", time: "Mon 9:14am" },
      { from: "me", text: "Dorothy! Yes, I was so excited to see your profile. What do you like to grow?", time: "Mon 9:32am" },
      { from: "them", text: "Mostly herbs and roses. I have this little patch that I'm very proud of 😊 Do you like walking?", time: "Mon 9:48am" },
      { from: "me", text: "I do! I try to walk every morning. It's one of my favourite ways to start the day.", time: "Mon 10:03am" },
      { from: "them", text: "That sounds lovely! I know a great trail near Camelback that's perfect for mornings.", time: "Yesterday 8:21am" },
    ],
  },
  {
    id: "conv-002",
    matchId: "dm-002",
    matchName: "Robert",
    matchGender: "male",
    lastMessage: "Let me know - I spotted an Elf Owl last Tuesday!",
    lastTime: "2 days ago",
    unread: 0,
    messages: [
      { from: "them", text: "Hi Margaret! Robert here. I hear we're both birdwatchers?", time: "Sun 7:02am" },
      { from: "me", text: "Yes! I got into it when I moved here — the desert birds are incredible.", time: "Sun 7:45am" },
      { from: "them", text: "They really are. Have you been to the Riparian Preserve? It's wonderful in the morning.", time: "Sun 8:10am" },
      { from: "them", text: "Let me know - I spotted an Elf Owl last Tuesday!", time: "Sun 8:11am" },
    ],
  },
];

export const DEMO_JO_MESSAGES = [
  { role: "assistant", content: "Hello Margaret! I'm Jo, your Joyn companion. It's lovely to meet you.\n\nHow are you feeling today? Is there anything on your mind you'd like to talk through?" },
];

export const DEMO_EVENTS = [
  {
    id: "ev-001",
    title: "Morning Walk at Papago Park",
    date: "Saturday, April 5",
    time: "7:30 AM",
    location: "Papago Park, Phoenix",
    distance: "12 min away",
    spots: 8,
    emoji: "🌅",
    category: "Fitness",
  },
  {
    id: "ev-002",
    title: "Senior Book Club — April",
    date: "Wednesday, April 9",
    time: "2:00 PM",
    location: "Scottsdale Public Library",
    distance: "8 min away",
    spots: 4,
    emoji: "📚",
    category: "Social",
  },
  {
    id: "ev-003",
    title: "Chair Yoga & Coffee Meetup",
    date: "Friday, April 11",
    time: "10:00 AM",
    location: "Camelview Senior Center",
    distance: "10 min away",
    spots: 12,
    emoji: "🧘",
    category: "Wellness",
  },
  {
    id: "ev-004",
    title: "Desert Garden Tour",
    date: "Sunday, April 13",
    time: "8:00 AM",
    location: "Desert Botanical Garden",
    distance: "20 min away",
    spots: 15,
    emoji: "🌵",
    category: "Outdoors",
  },
  {
    id: "ev-005",
    title: "Afternoon Card Games",
    date: "Thursday, April 17",
    time: "1:00 PM",
    location: "Sun City Community Center",
    distance: "18 min away",
    spots: 6,
    emoji: "🃏",
    category: "Social",
  },
  {
    id: "ev-006",
    title: "Movie Afternoon: Classic Films",
    date: "Tuesday, April 22",
    time: "3:00 PM",
    location: "Mayo Clinic Senior Lounge",
    distance: "14 min away",
    spots: 20,
    emoji: "🎬",
    category: "Entertainment",
  },
];

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DEMO_KEY) === "true";
}

export function startDemo(): void {
  localStorage.setItem(DEMO_KEY, "true");
  // Also set a cookie so the server-side proxy can detect demo mode
  document.cookie = `${DEMO_KEY}=true; path=/; max-age=86400; SameSite=Lax`;
}

export function exitDemo(): void {
  localStorage.removeItem(DEMO_KEY);
  // Clear the cookie too
  document.cookie = `${DEMO_KEY}=; path=/; max-age=0; SameSite=Lax`;
}
