# Hala — Spec vs. Current Build Audit

**Date:** 2026-04-21
**Spec reviewed:** `docs/hala-product-spec.md`
**Build reviewed:** `app/`, `services/`, `data/` (v1.1.0, package.json)

## Top-line verdict

The app today is a **single-deck SRS flashcard app with streak/XP gamification** — roughly the shape of "Anki with a Dubai skin." The product spec describes a **research-backed, tiered, CEFR-aligned program with speaking practice, missions, cultural modules, and graduation assessments.**

Content-wise the dialect-first vocabulary pool is in good shape (5 seed missions + ~20 themed decks = 500+ phrases, all authentically Emirati/khaleeji). Methodology-wise, only 1 of 5 spec pillars (spaced repetition) is actually wired up, and the engagement model directly contradicts the spec's "no streaks, no shame loops, adult seriousness" pillar.

---

## Pillar-by-pillar audit

### Brand pillar 1 — Research over gimmicks
- **Built:** SM-2-style SRS engine (`services/srs.ts`) with Again/Hard/Good/Easy self-rating and ease-factor adjustment. This is legitimate research-backed scheduling.
- **Missing:** No placement test, no adaptive pathing based on performance, no CI+1 pitching, no output+feedback loop, no interleaving logic beyond shuffling new/review cards.
- **Contradicts spec:** The app's primary reward loop is XP + streaks — exactly the "gimmicks" the spec rejects.

### Brand pillar 2 — Dialect-first, not MSA-first
- **Built well.** `data/missions.ts` and `data/phrases.ts` are genuinely Emirati (hala, shakhbarak, wayid, abā, bāchir, machboos, majlis-appropriate idioms). Transliteration follows khaleeji conventions. This is the strongest area of alignment with the spec.
- **Caveat:** TTS is hard-coded to `ar-SA` (Saudi) in `services/speechService.ts:18`. Acceptable fallback since Emirati TTS doesn't exist on device, but worth noting.

### Brand pillar 3 — Measurable competence (CEFR, not XP)
- **Contradicts spec.** `you.tsx` shows XP, level titles, and a "recall %" proxy. There is no CEFR tracking, no "skills mastered" breakdown (verbs conjugated, phrases produced, hours of CI), no weekly progress email, no graduation certificate logic anywhere in the code.
- `data/missions.ts:183` defines four gamified levels ("Survival Emirati" → "Fluent") that do not map to the spec's Basic/Intermediate/Expert tiers or CEFR bands.

### Brand pillar 4 — Cultural depth
- **Missing.** No majlis etiquette module, no business Arabic module, no regional variation notes (AUH/DXB/SHJ/Northern), no cultural context cards, no guest content from Emirati speakers/poets. Some idiom phrases exist in the themed decks but without cultural framing.

### Brand pillar 5 — Adult seriousness, no streaks/shame loops
- **Directly contradicts spec.** The Today screen leads with a 🔥 flame, "day streak," freeze counter, and XP. `session.tsx:196` grants XP on completion. The spec is explicit: "No streaks that punish missed days. No fake urgency timers. Weekly goals you set (not daily goals forced on you)." The current onboarding (`app/onboarding.tsx:49`) forces a daily-cards goal as the terminal onboarding step.

---

## Methodology feature audit (spec PART 2)

| Principle | Spec product feature | Implemented? | Where |
|---|---|---|---|
| Spaced Repetition | Recall Cycle at end of every lesson | **Partial** — SRS runs, but lessons don't exist; every session is one flat queue of 12 cards | `services/srs.ts`, `app/session.tsx` |
| Comprehensible Input +1 | Placement test + weekly recalibration | **No** — no placement test, no level model, no adaptive pathing | — |
| Output + Feedback | Daily speaking drills w/ AI pronunciation + fluency scoring; weekly branching conversation sims | **No** — `speechService.ts` is TTS output only; no recording, no STT, no scoring, no dialogue trees | — |
| Task-Based Learning | Mission per unit, graduate by completing the mission | **Content only** — 5 mission scenarios exist in `data/missions.ts` but the Session screen treats their phrases as undifferentiated flashcards. No mission gating, no "graduate the unit by doing the mission," no scenario player | `data/missions.ts` |
| Interleaving / Desirable Difficulty | Mixed-topic quizzes, rising cognitive load | **Partial** — queue interleaves new + review; no cross-topic mixing strategy, no difficulty ramp | `services/srs.ts:107` |

---

## Program architecture audit (spec PART 3)

### Tier structure (Basic 3mo / Intermediate 6mo / Expert 12mo)
- **Not implemented.** No paywall, no tier selection, no duration-bound curriculum. `revenuecat-key.json` is present in the repo which hints at planned IAP, but no RevenueCat SDK is wired in `package.json` and no paywall screen exists.
- `data/missions.ts:183` has 4 gamified levels that are not the spec's 3 tiers and are not CEFR-aligned.

### Graduation moments
- **Not implemented.** No Fluency Demonstration flow, no recorded-conversation capture, no authentic-media comprehension test, no certificate generation.

### Core feature set checklist

**Learning**
- Adaptive lesson pathing: **No**
- Dialect-native audio library across speakers: **No** — device TTS only, single synthetic voice
- AI speaking practice with pronunciation/fluency scoring: **No**
- Weekly mission-based units: **No** — 5 missions exist as data but aren't surfaced as units
- Recall Cycles at end of every lesson: **Partial** — all of Session is effectively a recall cycle, but there's no "lesson" construct preceding it
- Cultural context cards: **No**

**Measurement**
- CEFR-aligned progress tracking: **No** — XP/level only
- Skills-mastered dashboard: **No**
- Weekly progress email: **No** — `notificationService.ts` is for a daily-word push only
- Graduation certificates: **No**

**Cultural depth**
- Majlis, business, regional-variation modules: **No**
- Guest content from Emirati speakers: **No**

**Engagement (intentionally restrained)**
- No streaks → **Fails.** Streak is the hero element on Today.
- No fake urgency → **Mostly passes** — no countdowns observed.
- Weekly goals user-set, not daily forced → **Fails.** Daily goal is forced in onboarding; weekly goals don't exist.
- Optional study partner social: **No**

---

## Landing / store copy audit (spec PARTS 5 & 6)

- No landing page or web marketing surface exists in the repo beyond `privacy-policy/index.html`. `feature.html` is a single Play Store feature graphic, not the spec's landing.
- App Store / Play Store copy in the build is not reviewed here, but the spec's short description ("Learn Emirati Arabic with a research-backed 3-to-12 month program") cannot be truthfully used today because the 3/6/12-month program doesn't exist.

---

## MVP-priority audit (spec PART 7)

The spec's build order is:

1. Placement test — **missing**
2. Basic tier content (3mo, mission units) — **content seeded (5 missions), not delivered as a tier/program**
3. Spaced recall engine — **done**
4. AI speaking practice — **missing**
5. Progress dashboard (skills, not XP) — **built wrong — XP dashboard exists, skills dashboard doesn't**
6. Graduation assessment + certificate — **missing**
7. Intermediate tier — n/a
8. Cultural modules — **missing**
9. Expert tier + live tutor — **missing**

**Score: 1.5 of 9 MVP items delivered.**

---

## Alignment score (opinion)

- **Content / dialect authenticity:** 8/10 — strongest area
- **SLA methodology coverage:** 2/10 — SR only, four other pillars missing
- **Program architecture (tiers, CEFR, graduation):** 0/10
- **Brand discipline (no streaks/XP):** 2/10 — actively inverted
- **Cultural depth features:** 0/10

The repo today is a capable flashcard MVP with excellent Emirati content, but it's **not the product the spec describes.** It's closer to a Duolingo-flavored Anki than to the "adult, research-backed, CEFR-aligned" positioning the spec sells.

---

## The smallest set of moves that would pull the build toward the spec

Ordered by leverage-per-effort, not by spec order:

1. **Strip or demote streak/XP from the Today screen.** This is the single biggest brand contradiction and the cheapest to fix. Replace with a "Skills mastered" / "Cards in long-term memory" tile driven by existing SRS state (intervalDays ≥ 21 as a proxy for "learned").
2. **Promote missions from data to UX.** The mission scenarios, phrases, and quizzes are already written in `data/missions.ts` — build a Missions screen that gates phrases by mission and has a "mission complete" moment. Lifts task-based-learning coverage from 0 → 1.
3. **Add a rules-based placement test.** Spec explicitly says "even if rules-based" — a 2-minute quiz that seeds initial SRS intervals unlocks the personalization narrative and is a 1-day build.
4. **Add a speaking drill using on-device STT.** `expo-speech` only does TTS; adding `expo-av` recording + comparing against expected transliteration gives you a "you spoke it, here's feedback" moment. Crude scoring is fine; it's the output loop that matters.
5. **Replace "Level 1: Survival Emirati" framing with CEFR A1 framing** in `data/missions.ts` and `you.tsx`. Trivial rename, aligns measurement vocabulary with the spec.
6. **Add a simple tier gate / paywall stub** so the 3/6/12-month program is at least a visible architecture. RevenueCat key is already in the repo.
7. **Graduation certificate as a generated PDF** after completing all Basic-tier missions with ≥80% recall. Nets the "I actually learned this" moment cheaply.

Items 1, 2, 3, 5 together would move the alignment score materially without requiring AI speaking infra.
