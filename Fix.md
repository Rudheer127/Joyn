Absolutely — here is a combined **full audit + polished master prompt** you can paste into your coding agent. I based this on the currently visible dashboard, message detail view, and profile flow, which confirm that Joyn still presents itself as a companionship app on the surface but continues to use fitness-oriented matching, workout language, incomplete flows, and a weakly integrated Jo chatbot. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)

## Full audit

The core product issue is that Joyn says it exists to help older adults connect and belong, but the actual experience still behaves like a light fitness partner app with companionship layered on top. The dashboard currently highlights “Beginner,” “Chair Yoga,” “Walking,” and “Stretching” in the companion cards, while the profile still asks users to describe themselves for “workout partners” and emphasizes fitness level and health goals. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)

The right direction is not to remove activity from the product completely, but to reposition activity as one of many ways companionship can happen. Joyn should help older adults reduce loneliness by meeting compatible people locally or farther away, building trust through conversation, and then encouraging calls, video chats, recurring check-ins, or in-person meetups when appropriate. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)

### Product positioning issues

- The app title and dashboard tagline say “Connect. Belong. Age with Joy,” which is good, but the actual match cards still surface fitness-first labels such as “Beginner,” “Moderate,” “Chair Yoga,” and “Walking” as primary identity markers. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)
- The profile form still says “Tell potential workout partners a little about yourself,” which directly contradicts the companionship mission. 
- “What I’m looking for” includes “Someone to talk to,” which is correct, but it is mixed with “An activity buddy” and followed by “Fitness Level” and “Health Goals,” making the product feel confused about whether it solves loneliness or fitness motivation. 
- “Your Upcoming Meetups” currently suggests structured sessions rather than organic companionship or catch-ups, and the empty state says “No upcoming meetups yet,” which is neutral but not emotionally supportive. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)

### Onboarding and first-time user issues

- First-time users appear to be dropped into the dashboard immediately, since the current dashboard already shows personalized match cards before the user has clearly completed a companionship-focused setup. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)
- There is no visible dedicated setup-first experience that asks meaningful loneliness-reduction questions before matching. The current profile page has useful data fields, but it functions more like a generic profile editor than a required onboarding journey. 
- Users should not get auto-matches before the system understands their companionship needs, preferred social style, comfort level, location flexibility, and desired type of connection. The current dashboard already shows three strong-looking matches with percentages, which implies the system is matching too early. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)
- The user-reported Google signup/verification/continue 404 is a critical flow problem and must be treated as a blocker for launch, even though that specific route behavior is not fully visible in the currently opened pages. The current routed app structure strongly suggests auth and onboarding routing are not fully separated from the dashboard experience. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)

### Dashboard issues

- The dashboard is cluttered for an older audience because it includes companion cards, daily check-in, newest connection CTA, upcoming meetups, Arizona events, and the Jo widget all at once. That creates too many competing calls to action for a 60+ user. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)
- “Good morning, Friend” feels generic and emotionally hollow because it does not use the person’s name. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)
- The “0-day connection streak” should not be removed, because it can be encouraging, but it should be reframed more warmly for companionship instead of feeling like a gamified fitness metric. The current streak feature exists and is worth keeping. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)
- “YOUR COMPANIONS” is a good section, but “AI-matched for you” may not be the best emphasis for elderly trust; the value lies in why the match makes sense, not in the AI label itself. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)
- “YOUR CONNECTIONS” and “YOUR COMPANIONS” partially overlap conceptually, which can confuse users. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)
- “ARIZONA EVENTS” is useful, but for a lonely first-time user it may distract from the more important first action: understand matches and reach out. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)

### My Matches issues

- The My Matches section is one of the most important parts of the product and currently does not provide the rich explanation users need. In the dashboard, users can see names, ages, cities, percentages, and interest tags, but the specific “why you both would be a great fit” explanation is missing from the main match-browsing experience. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)
- You specifically want that “why you both would be a great fit” explanation retained and surfaced in My Matches, and that is exactly right because older adults need confidence and reassurance before messaging someone. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)
- Match reasoning should include shared interests, similar life stage, companionship goals, social comfort fit, communication preference, and whether the match is better for in-person connection or regular calls. The current app has enough profile inputs to support this kind of explanation, but the explanation is not surfaced where it matters most. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)

### Messages issues

- The message detail view shows only a tiny back arrow, which is too small and too subtle for older users. 
- The “View profile” link in the message header points to `/match/1`, which may technically work, but it pulls the user away from their conversation context instead of helping them stay grounded in the chat flow. 
- The chat content is sparse and left-biased, which matches your complaint that the message box only fills one side of the page and feels awkward on larger screens. The current visible thread is a narrow conversational stack with a small composer. 
- The message composer is just a textarea with minimal supporting affordances. There are no quick replies, no voice-to-text, no accessibility supports, and no obvious low-pressure prompts for seniors. 
- The sample conversation itself is still fitness-oriented, mentioning hoping to find “someone to walk with in the mornings,” which reinforces the broader product identity problem. 

### Profile issues

- The profile page has useful structure, but it is still heavily fitness-biased. It includes interests such as Chair Yoga, Stretching, Light Resistance, Swimming, and Cycling near the top, which can remain as optional interests but should not dominate the system. 
- The copy “Tell potential workout partners a little about yourself...” must be changed. 
- “Fitness Level” should not be a prominent core section for a loneliness-first product. 
- “Health Goals” is the wrong framing for most users here; a better framing would be companionship goals, emotional goals, or preferred kinds of connection. 
- The city field is Arizona-specific, which is good for the regional version, but the matching logic should still support people outside the immediate neighborhood and explain when a match is ideal for phone/video rather than in-person. 

### Jo chatbot issues

- Jo is present as a persistent assistant in the bottom-right, which is good, but it is not acting like a true in-product guide. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)
- Jo currently uses open-ended conversational replies like “What’s been going on in your world lately?” and “Would you like to talk more about what’s been bothering you?” without guiding the user toward concrete help or navigation. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)
- Jo does not show customer-support style preselective quick actions consistently. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)
- Jo is not visibly linked to dashboard state, onboarding status, messages, profile completion, or page context. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)
- There is no visible voicebot capability, no speech-to-text, and no voice-guided onboarding flow in the current experience. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)
- Jo needs to become a context-aware support and navigation assistant for older adults, not just a chat box.

### Elder-friendly usability issues

- Many controls are too small, especially the back button in messages. 
- The dashboard presents too much at once, which can overwhelm users who need one clear next step. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)
- The current design uses section density and stacked modules that are manageable for younger users, but a 60+ user may struggle to identify the most important action quickly. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)
- The mood check-in is useful, but it should tie into supportive next steps instead of sitting as a standalone widget. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)
- The app needs stronger calm hierarchy: one main action, one secondary action, and everything else optional.

## What should change

Joyn should help older adults find companionship whether nearby or farther away, then guide them toward the **best next connection mode**: message, phone call, video chat, or meetup. The product should not be neighborhood-only and should not act like in-person activity is the only valid outcome, because loneliness can also be reduced through regular calls and emotionally reliable companionship at a distance. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)

My Matches should become the explanation layer of the product. Every match should tell the user not just who the person is, but why they fit, what type of connection makes sense, and how to start in the least intimidating way. That is especially important for a 60+ user who may hesitate before initiating contact. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)

Jo should become the elder-support layer of the product. It should know where the user is, what they have completed, and what they are likely trying to do, then offer guided shortcuts, quick replies, navigation actions, and voice support. The current chatbot presence is promising, but it is not yet a functional assistant. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)

## Master prompt for your agent

Copy and paste this into your coding agent:

You are auditing and fixing the Joyn web app. Joyn is a companionship platform for older adults age 60+, especially in Arizona, whose main goal is to reduce loneliness by helping seniors find meaningful connection with compatible people either locally or farther away. This is **not** a fitness app. Activity can exist as one way people bond, but the core problem being solved is loneliness, emotional isolation, lack of companionship, and lack of consistent human connection.

Your task is to do a full product, UX, copy, navigation, onboarding, and chatbot audit and then fix the app accordingly. Be ruthless, detailed, and implementation-focused. Do not make shallow cosmetic tweaks only. Fix broken flows, wrong product framing, poor elder usability, and missing system behavior.

### Core product direction

Joyn should help older adults:
- Meet compatible people who may also be lonely.
- Connect through messages, calls, video chats, or in-person meetups.
- Find people nearby or farther away, not just immediate neighbors.
- Understand clearly why a match is a good fit.
- Move from first contact to recurring companionship.
- Feel safe, guided, and not overwhelmed.

The product should optimize for companionship first, distance second. Distance should influence the suggested next step, not block a good match. A nearby match may be suited for coffee or walks; a farther-away match may be ideal for regular calls, video chats, and emotional support.

### Critical product fixes

1. Reframe the entire app away from fitness-first positioning.
- Remove or rewrite all copy that frames the app around workout partners or fitness as the primary goal.
- The current profile text “Tell potential workout partners a little about yourself...” must be changed.
- Do not present fitness level as a primary identity signal in match cards.
- Keep activity-related interests only as optional interests, not as the main reason for matching.

2. Preserve the connection streak.
- Do not remove the streak feature.
- Keep it, but reframe it warmly for companionship and consistency.
- Make it feel encouraging, not like a childish fitness gamification mechanic.
- Improve the zero-state so it motivates a first connection.

3. Build a real onboarding flow before dashboard access.
- First-time users must not land directly on the dashboard and receive automatic matches before setup.
- Add onboarding gating after signup/auth.
- Onboarding must collect companionship-relevant inputs, including:
  - what kind of companionship the user wants,
  - preferred way to connect,
  - social comfort level,
  - life stage,
  - interests,
  - availability,
  - whether they prefer local or flexible-distance matches,
  - whether they are open to in-person meetups, phone calls, or video chats.

4. Add onboarding path choice.
- Let first-time users choose between:
  - Voice-guided onboarding with Jo.
  - Manual step-by-step onboarding.
- Make both options senior-friendly with large tap targets and very simple wording.

5. Fix auth and post-signup routing.
- Audit the Google signup, verification, and continue flow.
- Fix the reported issue where first-time Google signup/verification/continue leads to a 404.
- Make sure first-time users route to onboarding and returning users route correctly based on setup completion state.
- Audit sign-in, sign-up, verification callback, auth guard, route guard, and onboarding completion persistence.

6. Add phone number login.
- Add phone number + OTP as a first-class login option alongside Google and email.
- Make OTP entry large and readable for seniors.

7. Fix broken join/signup CTAs.
- Audit every Join, Join Free, Continue, and signup CTA.
- Ensure they route to working screens and never dead-end.

### Dashboard fixes

8. Simplify the dashboard for older adults.
- Reduce clutter and competing modules.
- Show one clear primary next step depending on user state:
  - complete setup,
  - view matches,
  - reply to a message,
  - schedule a catch-up,
  - ask Jo for help.
- Reduce duplication between “Your Companions,” “Your Connections,” and other blocks.

9. Use the user’s actual name.
- Replace “Good morning, Friend” with the real name when available.
- If name is not available, prompt setup gently.

10. Rework match card hierarchy.
- Remove fitness level as the lead badge.
- Prioritize shared interests, companionship goals, and communication fit.
- Keep the match percentage if it helps, but explain it.

11. Add “Why you both would be a great fit” to My Matches.
- This is mandatory.
- Every match card in My Matches should include a clear explanation of why the pair is compatible.
- The explanation should be plain language, human, and reassuring.
- Include factors such as:
  - shared interests,
  - similar life stage,
  - similar companionship goals,
  - social comfort compatibility,
  - preferred connection style,
  - local vs farther-away suitability.
- Example outputs:
  - good for coffee chats and local meetups,
  - ideal for regular phone calls,
  - strong fit for weekly video check-ins,
  - both prefer calm one-on-one connection.
- My Matches must not be a bare list of names and percentages.
- My Matches must not remain in a broken loading state.

12. Support local and non-local companionship.
- Do not restrict matching to the immediate neighborhood.
- Allow nearby, same-city, nearby-city, and farther-away companion matches.
- For every match, explain whether the best first step is:
  - message,
  - phone call,
  - video call,
  - in-person meetup.
- Make distance a context label, not the main filter.

### Messages fixes

13. Fix the messages layout.
- The message pane should not feel cramped or left-only on larger screens.
- Improve thread width, balance, and composer layout for readability.

14. Fix message navigation and context.
- The back button is too small and must be redesigned for older adults.
- Reevaluate “View profile” from message detail.
- Preserve conversation context when opening profile information, either via modal/drawer or an easy return mechanism.

15. Make messaging senior-friendly.
- Increase text size and contrast.
- Add quick reply suggestions.
- Add voice-to-text.
- Add optional call/video escalation CTA where appropriate.
- Add clear first-message prompts for hesitant users.

### Profile fixes

16. Rewrite the profile page for companionship.
- Replace workout-partner language.
- Reframe “Health Goals” into companionship-oriented goals.
- De-emphasize “Fitness Level.”
- Keep useful sections like life stage, social comfort, what I’m looking for, availability, and connection preferences.

17. Improve profile completion logic.
- Profile information should power matching explanations.
- Make incomplete key sections visible and recoverable.
- Use profile progress to guide setup and dashboard states.

### Jo chatbot fixes

18. Turn Jo into a real contextual assistant.
- Jo must not remain a generic chatbot only for open conversation.
- Jo should be a support + navigation assistant for older adults.
- Jo must be aware of:
  - current page,
  - onboarding progress,
  - profile completion,
  - unread messages,
  - available matches,
  - current task context.

19. Add support-bot style quick actions.
- Add preselective quick replies like customer-support bots.
- Examples:
  - Show my matches.
  - Take me to my messages.
  - Help me finish setup.
  - Update my profile.
  - Find events near me.
  - I feel lonely.
  - I need help.
- Jo should be able to navigate the user directly, not just answer passively.

20. Add voice support to Jo.
- Add speech-to-text for user input.
- Add optional text-to-speech or voice output for Jo.
- Add voicebot functionality for onboarding and help.
- Keep typed input available at all times.

21. Make Jo page-aware.
- On dashboard, Jo should help interpret matches and next actions.
- On profile, Jo should help complete the profile.
- On messages, Jo should help the user reply or navigate.
- Jo should understand what the user is doing and offer relevant help automatically.

### Elder usability requirements

22. Audit every page from the perspective of a 60+ user in Arizona.
- Assume slower interaction speed, possible visual limitations, possible dexterity limitations, and low tolerance for confusing flows.
- Check whether buttons are large enough, obvious enough, and placed logically.
- Back buttons must be larger and clearer.
- Important actions must be visible without hunting.
- The interface must feel calm, not crowded.

23. Ensure one obvious primary action per screen.
- Reduce cognitive load.
- Avoid too many equally weighted modules.
- Make the app easy to scan and navigate for elderly users.

### Deliverables

Produce:
- A full issue list by severity: critical, high, medium, low.
- A route-flow map for auth, onboarding, dashboard, matches, messages, profile, sessions, and Jo navigation.
- A page-by-page fix list.
- A copy rewrite list.
- A Jo feature spec.
- A first-time user onboarding spec.
- A redesigned My Matches card spec with “Why you both would be a great fit.”
- An elder-usability checklist.
- A QA checklist for desktop, tablet, and mobile.

### Guardrails

Do not:
- Remove the streak feature.
- Treat Joyn as a fitness product.
- Give first-time users automatic matches before proper setup.
- Leave Jo as a generic unlinked chat box.
- Keep tiny or barely visible back buttons.
- Keep broken auth/signup/join routes.
- Limit companionship to only immediate neighbors.

Do:
- Keep and improve the streak.
- Make companionship the main identity.
- Support both local and farther-away matches.
- Explain every match clearly.
- Encourage messaging, calls, video chats, and meetups appropriately.
- Optimize for older adults first.

## Strong add-on line

Add this one extra line at the top of your prompt because it captures your latest point really well:

“Joyn’s main target is to solve loneliness by helping older adults meet compatible people locally or even elsewhere, so that both people can reduce loneliness through friendship, conversation, check-ins, calls, video chats, and meetups when appropriate.” [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)

## Best-priority fixes

If you want the shortest priority order to give the agent, use this:

1. Fix auth/signup/onboarding routing. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)
2. Add real onboarding before any matches appear. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)
3. Reframe all copy from fitness to companionship. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)
4. Redesign My Matches with “Why you both would be a great fit.” [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)
5. Fix Jo with quick actions, page awareness, navigation, and voice features. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)
6. Simplify the dashboard for elderly users. [joyn-two.vercel](https://joyn-two.vercel.app/dashboard)
7. Fix messages layout and back/profile flow. 
8. Rework profile fields to support loneliness-solving match logic. 
