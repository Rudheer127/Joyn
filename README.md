# JOYN — Move Together. Age with Joy.

> Arizona's high-empathy companionship platform — combating loneliness for adults 60+ by fostering genuine friendships, local event discovery, and meaningful conversations.

**Live Demo**: [https://joyn-two.vercel.app](https://joyn-two.vercel.app)

---

## The Problem

**1 in 3 seniors aged 50–80 feel isolated from others.**  
*(University of Michigan National Poll on Healthy Aging, 2023)*

Social isolation among older adults is a public health crisis. Research shows:
- Regular physical activity and social interaction reduce dementia risk by **41–45%**
- Strong social connections improve survival odds by **50%**
- Yet most digital platforms are built for younger, tech-savvy users and ignore the deep need for accessible, empathetic companionship.

Seniors don't just need another social network — they need a **trusted companion and a safe space to connect**.

---

## The Solution

Joyn is an empathetic, AI-driven companionship platform built specifically for older adults. We use conversational AI to understand users' unique feelings of loneliness, and pair them with compatible friends based on shared interests, life experiences, and preferred connection styles.

```text
Share your story via Voice/Text → Get matched with peers → Discover local events → Build real friendship
```

---

## Features

| Feature | Description |
|---|---|
| 🎙️ **Voice-Assisted Onboarding** | Hands-free and accessible profile setup using browser Speech-to-Text and Text-to-Speech to assist low-vision or typing-averse users. |
| 🤖 **AI Consultation (Jo)** | An empathetic conversational interface that helps users identify their feelings of loneliness and provides tailored suggestions. |
| 🤝 **Smart Companionship Matching** | Paired by shared interests, life experiences, and connection preferences (calls, coffee, walks). |
| 🖼️ **Trust & Privacy Profiles** | User-controlled profile photos with privacy toggles and gender-differentiated avatars for a safe community feel. |
| 📍 **Local Event Discovery** | Curated local events — community classes, social gatherings, support groups — surfaced by AI. |
| 💬 **Secure Messaging** | An easy-to-use, high-contrast messaging interface for connecting with matches. |
| 🔐 **Accessible Auth** | Simple Email/Password and Google OAuth integration via Supabase. |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 15+](https://nextjs.org/) (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 + Vanilla CSS |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) |
| **Auth** | Supabase Auth (Email & Google OAuth) |
| **AI / LLM** | [Vercel AI SDK](https://sdk.vercel.ai/) + [Groq](https://groq.com/) |
| **AI Model** | `llama-3.1-8b-instant` (Lightning fast inference via Groq Cloud) |
| **Embeddings** | Hugging Face Inference API (`sentence-transformers/all-MiniLM-L6-v2`) |
| **Testing** | Vitest + Testing Library |
| **Fonts** | Epilogue (headings), Lexend (body) |

---

## Project Structure

```text
joyn/
├── app/
│   ├── (app)/               # Authenticated app routes (Dynamic data via Supabase)
│   │   ├── dashboard/       # Main user dashboard
│   │   ├── onboard/         # AI-guided onboarding chat (Jo)
│   │   ├── match/           # Match viewing & acceptance
│   │   ├── messages/        # Direct messaging
│   │   ├── sessions/        # Workout session scheduler
│   │   ├── events/          # Arizona events feed
│   │   └── profile/         # User profile manager
│   ├── (auth)/              # Sign-in / Sign-up pages (Google Auth integration)
│   ├── api/                 # Dynamic serverless API routes
│   │   ├── ai/
│   │   │   ├── chat/        # Onboarding AI route
│   │   │   ├── companion/   # Companion AI route (Jo as friend)
│   │   │   └── match/       # Matching & embedding API
│   │   ├── events/          # Fetches local Arizona events
│   │   └── sessions/        # Fetches user workout history
├── components/              # Reusable UI React components
├── lib/
│   ├── supabase/            # Supabase clients (SSR, Client, Middleware)
│   └── rate-limit.ts        # Custom sliding-window API rate limiting
└── supabase/                # DB migrations, policies & schema
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com/) project & database
- A [Groq](https://console.groq.com/) account for free fast inference API key
- A [Hugging Face](https://huggingface.co/) account with API Token for embeddings

### 1. Clone & Install

```bash
git clone https://github.com/Rudheer127/Joyn.git
cd joyn
npm install
```

### 2. Set Up Environment Variables

Copy the example env file and fill in your credentials.

```bash
cp .env.example .env.local
```

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Generative AI (Groq & HuggingFace)
GROQ_API_KEY=your-groq-api-key
HUGGINGFACE_API_KEY=your-hf-api-key
```

### 3. Run Database Migrations

Apply the Supabase migrations to set up your schema and policies:

```bash
npx supabase db push
```

### 4. Start the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How the AI Companionship Works

1. **AI Consultation** — Jo (the AI) creates a warm, empathetic environment to learn about the user's current social needs and feelings of loneliness, using either text or voice.
2. **Profile & Privacy** — The collected data is safely stored in Supabase. Users fully control their identity with public/private photo toggles.
3. **Smart Matching** — We connect users with highly compatible peers based on semantic profile matching, aiming to bridge the gap of social isolation.
4. **Local Integration** — The AI dynamically recommends true-to-life local community events (e.g., in Arizona) as comfortable first-meeting spots.

---

## AI Safety — Jo Companion

The Jo Companion widget is designed with elderly user safety in mind:

- Responds at a Grade 6 reading level
- Limits responses to 2–3 sentences
- **Never** diagnoses medical conditions
- **Never** provides crisis counseling — instead gently redirects to 988 (Suicide & Crisis Lifeline) and trusted family if a user expresses serious distress
- Capped at 30-second response time to prevent hanging

---

## Running Tests

```bash
npm test
```

---

## Roadmap

- [ ] SMS reminders for scheduled sessions
- [ ] Volunteer matching with ASU students (intergenerational)
- [ ] Voice-based onboarding for low-vision users
- [ ] In-app video calling via Daily.co
- [ ] iOS/Android mobile apps

---

## License

MIT — see [LICENSE](./LICENSE) for details.

---

<p align="center">
  Built with 🌻 for Arizona's seniors.<br/>
  <em>Move Together. Age with Joy.</em>
</p>
