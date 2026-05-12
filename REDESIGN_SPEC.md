---
title: Hala App — Ruthless Redesign Spec
version: 2.0 (April 2026)
status: proposal
---

# Hala — Ruthless Redesign Spec

## 1. Why redesign

The current build is feature-rich but cognitively heavy. Seven tabs (Home, Learn, Play, Practice, Profile, Progress, Radio) fan out into eleven extra stack screens (ai-quiz, ai-tutor, alphabet, arcade, boss-battle, challenge, flashcard, mission, vocabulary, onboarding, settings). Every new visitor has to decide where to learn before they learn anything. Language learning apps die at this exact step: the user opens, feels overwhelmed, closes, forgets.

The redesign strips the surface area to one thing the user can't misinterpret — "do today's session" — and wraps it in the smallest set of retention mechanics that actually have research behind them. Everything else is deleted or demoted.

## 2. Design principles

1. **One verb per screen.** If a screen asks the user to choose between more than one action, it's doing too much.
2. **Retention over breadth.** A user who reviews 10 cards for 60 days will outperform a user who "completes" 40 lessons once. We optimize for returning tomorrow.
3. **The streak is the product.** The streak layer (the "user stack") is not a side feature — it is the spine the whole app hangs off.
4. **Research-weight only.** Every mechanic in the final app must map to a named effect: spaced repetition, testing effect, interleaving, variable reward, or implementation intention. No mechanic survives on vibes.
5. **Cards, not lessons.** A card is a 3–8 second interaction. A lesson is a 3–5 minute commitment. Cards win on daily re-entry; lessons win on time-rich Saturdays. Hala is a daily app.

## 3. The research the redesign is built on

- **Spaced repetition (Ebbinghaus, SM-2).** Review intervals that expand with each correct recall beat massed study for long-term retention by a factor of ~2x. This is the core loop.
- **Testing effect (Roediger & Karpicke, 2006).** Actively recalling a word beats re-reading it. Every card must be an *answer* before it is a *display*.
- **Desirable difficulty (Bjork).** Cards should feel slightly too hard; smooth = forgettable.
- **Interleaving.** Mixing card types (vocab, phrase, listening, cultural) in one session outperforms blocking them. Sessions are always mixed.
- **Variable-ratio reward (Skinner, refined by Fogg Behavior Model).** Occasional unexpected wins — a rare card, a milestone animation — sustain habit beyond extrinsic rewards.
- **Implementation intention (Gollwitzer).** Users who commit to *when* and *where* they will study (e.g., "after morning coffee") return 2–3x more reliably. We ask this once, on day 1.
- **Streak loss aversion (Kahneman).** Protecting a streak is more motivating than earning one. The streak + one "freeze" per week is the full gamification stack. Nothing else.

## 4. What's in → What's out

### Keep (reshaped)
- **Flashcard engine** — becomes the SRS core. Repurpose `app/flashcard.tsx`.
- **Alphabet content** — demoted from a tab to a one-time onboarding module, then surfaced as cards.
- **Vocabulary + phrases data** — becomes the card pool. Data in `data/missions.ts` and `data/alphabet.ts` stays.
- **Streak + XP + weekly dots** — becomes the "stack" layer, surfaced on every screen. Already implemented in `StatPill`, `WeekDots`, `services/storageService`.
- **Onboarding** — simplified (see §7).
- **Radio** — kept, but moved to a single card type ("listen") inside the daily session. The standalone tab is removed.

### Cut (deleted, not hidden)
- Boss Battle — novelty feature, adds cognitive load, no retention evidence.
- Arcade — same.
- AI Tutor — expensive, low-frequency use, can't meet pedagogy bar without careful prompt work. Revisit in v3.
- AI Quiz — redundant with SRS.
- Missions / mission path — the Duolingo-path UI conflicts with SRS. Users tap "next node" instead of what they actually need to review.
- Challenge tab — folded into the daily session as the "warm-up" card.
- Practice tab — redundant with the daily session.
- Progress tab — folded into the Profile tab.
- Radio tab — folded into "listen" card type.
- Vocabulary screen — replaced by SRS. The vocabulary list is now the card pool.

### Net effect
- Tabs: **7 → 3** (Today, Library, You)
- Stack screens: **11 → 3** (Session player, Card detail, Settings)
- Mental model: "Where should I go?" → "Do today's cards."

## 5. Information architecture

```
Tab 1: Today              Tab 2: Library             Tab 3: You
────────────              ───────────────            ──────────────
- Daily session CTA       - Browse by theme          - Streak & stack
- Streak & freeze         - Search all cards         - Weekly activity
- Today's phrase          - Saved / starred          - Freezes & goal
- "Listen" mini-card      - Alphabet reference       - Settings
```

### Core user flow (99% of sessions)
1. Open app → **Today** tab (default).
2. Tap the single CTA: "Start today's session (12 cards)".
3. Cards play in a mixed queue: 5 new + 7 review, interleaved.
4. Each card = prompt → recall → reveal → self-rate (Again / Hard / Good / Easy).
5. Session ends with a one-screen summary: cards done, streak +1, XP, what's due tomorrow.

That's the product. Library and You are for the 1% of sessions where the user wants to explore or check progress.

## 6. The card is the atom

Five card types, all share the same gesture language (tap to reveal, swipe or tap to rate). Interleaved in every session.

| Type          | Prompt                        | Recall target                     | Research lever |
|---------------|-------------------------------|-----------------------------------|----------------|
| Vocab         | Arabic word (script + audio)  | English meaning                   | Retrieval      |
| Phrase        | Situation ("Greet a shopkeeper") | Spoken phrase (audio self-check) | Contextual recall |
| Listen        | Audio-only clip               | Which of 4 translations           | Multi-modal encoding |
| Produce       | English meaning               | Type/speak the Arabic             | Generation effect |
| Cultural      | Scenario card                 | Pick the polite response          | Elaborative encoding |

Every card ends with a 4-option self-rating. That rating drives the SRS interval (SM-2 simplified):

- **Again** → show in ~1 min, same session.
- **Hard** → show tomorrow.
- **Good** → multiply last interval by 2.5.
- **Easy** → multiply last interval by 4.0.

## 7. Onboarding (≤ 60 seconds)

Three questions, one commitment.

1. **What do you want to say first?** (Travel / Make friends / Work / Just curious) → seeds the starting deck.
2. **How many minutes per day?** (3 / 5 / 10) → sets daily card count (8 / 12 / 20).
3. **When will you practice?** (Morning / Lunch / Evening) → schedules the local notification. This is the implementation-intention step. Do not skip.
4. **Show your first card** immediately. No tour, no tutorial. The card teaches the interaction.

## 8. The "stack" (streak + progress)

The progress stack is intentionally thin. Four surfaces, nothing more:

- **Streak number** — visible on Today and You.
- **Weekly dots** — 7 dots, filled as days complete. Already built (`components/WeekDots`).
- **Freezes** — 1 per week, auto-granted. Missing a day consumes a freeze before breaking the streak. This is the single most-requested mechanic in Duolingo's own retention research.
- **Level / XP** — deprioritized visually. It's a nice-to-have, not the point.

No leaderboards, no leagues, no tournaments. Those drive short-term engagement and long-term churn for adult learners (which is most of Hala's audience).

## 9. Visual direction

Keep the existing warm claymorphism — it's an asset. Reuse `constants/theme.ts`. Apply three rules:

1. **One primary action per screen, one tap-target size (56px).** No dueling CTAs.
2. **Arabic script is the hero.** Minimum 36pt on cards, always with audio affordance.
3. **Motion only on reward.** Static by default; confetti / pulse only on streak extension, level up, or card mastery. Removes the "busy" feel.

## 10. Metrics we'll watch

- **D1 retention** (did they come back the day after first session?) — target 45%+.
- **D7 retention** — target 25%+.
- **Sessions per week (active users)** — target 4+.
- **Average cards reviewed per session** — target ≥ 10.
- **Streak length distribution** — healthy distribution has a long tail past 14 days.

We don't optimize for install count, time-in-app (bad proxy), or lesson completions.

## 11. What ships in v2.0

- `app/(tabs)/_layout.tsx` — rewritten for 3 tabs.
- `app/(tabs)/today.tsx` — replaces `index.tsx`, single-CTA home.
- `app/(tabs)/library.tsx` — replaces learn + practice + vocabulary.
- `app/(tabs)/you.tsx` — replaces profile + progress.
- `app/session.tsx` — new, unified card player (replaces flashcard, quiz, arcade, boss-battle, challenge, ai-quiz).
- `services/srs.ts` — new, SM-2 interval logic.
- Deleted: `ai-tutor.tsx`, `ai-quiz.tsx`, `arcade.tsx`, `boss-battle.tsx`, `challenge.tsx`, `vocabulary.tsx`, `alphabet.tsx`, `mission/`, plus the `learn`, `play`, `practice`, `progress`, `radio` tab files.

## 12. What's parked for v2.1+

- AI Tutor, rebuilt as a conversation card type (needs careful prompt + eval).
- Radio, as a passive background mode (not a card, not a tab — a widget).
- Social: family/friend co-streaks (evidence-backed, but requires auth and adds complexity).
- Custom decks (user-created) — only if v2.0 metrics land.

---

*Companion artifact:* `redesign-prototype.html` — clickable prototype of the three tabs and the session player. Open it first.
