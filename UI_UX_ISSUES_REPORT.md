# Hala App — UI/UX Code Review Report

**Date:** 2026-06-27
**Scope:** Full source review of all screens, components, services, data, and configuration
**Files reviewed:** 16 source files + 2 config files

---

## Critical — Crashes, broken functionality, data loss risk

### C1. Memory leak from uncleared timers and animations in splash screen

**File:** `components/AnimatedSplash.tsx`, lines 76–192

`startAnimationSequence()` launches 10+ `setTimeout` callbacks and three `Animated.loop()` calls. None are cancelled on unmount. If the user taps to skip the splash (calling `finish(250)` at line 252), the remaining `setTimeout` callbacks still fire — calling `setGreetingIndex()` and starting new animations on an unmounted component. On React 19 this logs warnings; in edge cases it corrupts animation state.

**Fix:** Store all timeout IDs and `Animated.CompositeAnimation` references, and call `clearTimeout()` / `.stop()` in a `useEffect` cleanup function.

---

### C2. `new Animated.Value` created during every render

**File:** `components/AnimatedSplash.tsx`, line 283

```jsx
scale: Animated.add(glowPulse, new Animated.Value(0.8)),
```

Every render creates a fresh `Animated.Value(0.8)`, which breaks the animation graph's identity. This causes the glow pulse to stutter or freeze on re-renders.

**Fix:** Hoist the constant `Animated.Value(0.8)` into a `useRef` alongside the other animation values.

---

### C3. Duplicate phrase causes SRS data collision

**File:** `data/phrases.ts`, lines 149 and 153

`fd-017` (Food & Drink) and `vb-001` (Basic Verbs) both represent `أبا` / "I want". They have different IDs, so both appear in the beginner phrase list. This means:

- The user sees the same Arabic+English twice in the browse list.
- `buildOptions` may produce a distractor set where the correct answer appears twice.
- The SRS tracks them independently, so "I want" is reviewed at double the intended frequency.

**Fix:** Remove the duplicate entry (likely `fd-017` since `vb-001` already covers "I want" in the verbs section).

---

### C4. Version mismatch between app.json and package.json

**File:** `app.json` line 5 → `"version": "1.3.0"` | `package.json` line 4 → `"version": "1.2.0"`

EAS Build reads the version from `app.json`, but npm scripts reference `package.json`. A mismatch can cause store submissions with a stale version string, or confuse CI/CD pipelines.

**Fix:** Synchronize both to the same version. Ideally, source the version from a single place.

---

## Major — Poor UX that frustrates users, accessibility issues, missing error handling

### M1. Phrase list uses ScrollView + `.map()` instead of virtualized list

**File:** `app/(tabs)/today.tsx`, lines 267–331

All phrases for a level are rendered upfront inside a `ScrollView`. The beginner level has 96 phrases across 5 themes; each is a full card with Arabic text, transliteration, English, and an icon button. On lower-end Android devices this causes frame drops during initial render and while scrolling.

**Fix:** Replace with `SectionList` (themes become sections). This virtualizes off-screen items and supports `keyExtractor`, `stickyHeaders`, and `onEndReached` for free.

---

### M2. No keyboard dismiss on scroll

**File:** `app/(tabs)/today.tsx`, line 267

The `ScrollView` for the phrase list doesn't set `keyboardDismissMode`. After typing in the search box, the keyboard stays up while scrolling, covering half the screen.

**Fix:** Add `keyboardDismissMode="on-drag"` to the ScrollView (or the replacement SectionList).

---

### M3. GoldButton uses deprecated `TouchableWithoutFeedback`

**File:** `components/GoldButton.tsx`, line 82

`TouchableWithoutFeedback` is the legacy touch API. It provides zero visual feedback unless custom animations are added (the component does add scale animation, but it has other problems — see M4). The React Native team recommends `Pressable` for all new code.

**Fix:** Replace with `Pressable`. Use `onPressIn`/`onPressOut` for the spring animation, and use the `style` callback's `pressed` state for immediate visual feedback.

---

### M4. GoldButton disabled state still animates on press

**File:** `components/GoldButton.tsx`, lines 46–63, 83

When `disabled` is `true`, the component passes `onPress={undefined}` but `onPressIn` and `onPressOut` still fire, running the scale spring animation. The button visually "bounces" on touch but does nothing — this confuses users about whether the tap registered.

**Fix:** Guard `handlePressIn`/`handlePressOut` with `if (disabled) return;` (which is done at lines 47/55 but only blocks the animation start — `TouchableWithoutFeedback` still calls them). With `Pressable`, use `disabled` prop directly which blocks all interaction.

---

### M5. GoldButton disabled style doesn't cover all variants properly

**File:** `components/GoldButton.tsx`, lines 98–103, 162–164

The `disabled` style only overrides `backgroundColor`. For the `outline` variant, the border remains `Colors.primary`, so a disabled outline button still looks active. For the `accent` variant, the bottom border and shadow remain colored.

**Fix:** Expand the disabled style to neutralize borders, shadows, and text color for all variants.

---

### M6. Onboarding gives no error feedback on failure

**File:** `app/onboarding.tsx`, lines 32–41

```tsx
} catch {
  setBusy(false);
}
```

If `Storage.setLevel()` or `Storage.setOnboarded()` throws, the busy spinner simply disappears and the button reappears with no explanation. The user has no idea anything went wrong.

**Fix:** Add a visible error state (e.g. a short toast or inline message like "Something went wrong — please try again").

---

### M7. Not-found screen ignores safe area insets

**File:** `app/+not-found.tsx`, lines 7–21

The screen has `flex: 1` centered content but doesn't use `useSafeAreaInsets()`. On notched devices, the "Go home" button could overlap the home indicator, and content near the top could sit behind the status bar.

**Fix:** Wrap in `SafeAreaView` or apply insets manually with `useSafeAreaInsets()`.

---

### M8. Not-found screen uses deprecated `TouchableOpacity`

**File:** `app/+not-found.tsx`, line 15

Uses `TouchableOpacity` from `react-native` (legacy touch API). Should use `Pressable` for consistency with the rest of the app.

**Fix:** Replace with `Pressable` and add an opacity style callback on `pressed`.

---

### M9. Level pills have wrong accessibility role

**File:** `app/(tabs)/today.tsx`, lines 195–208

Level pills use `accessibilityRole="button"` but they function as exclusive-select tabs (picking one deselects the others). Screen readers announce them as independent buttons, giving no indication they're part of a group.

**Fix:** Use `accessibilityRole="tab"` on each pill and wrap the container `<View style={styles.pillRow}>` with `accessibilityRole="tablist"`.

---

### M10. Radio group missing on onboarding options

**File:** `app/onboarding.tsx`, lines 64–93

Each level option correctly uses `accessibilityRole="radio"` and `accessibilityState={{ checked }}`, but the parent `<View style={styles.options}>` has no `accessibilityRole="radiogroup"`. Screen readers won't announce "radio button 1 of 3".

**Fix:** Add `accessibilityRole="radiogroup"` to the parent `<View>`.

---

### M11. Invisible space characters announced by screen readers

**File:** `app/practice.tsx`, line 339 | `app/(tabs)/today.tsx`, line 218

Both files use `' '` (a space character) as placeholder text to reserve layout space. Screen readers may announce this as "space" or trigger an unexpected announcement.

**Fix:** Use `{'​'}` (zero-width space) which is silent to screen readers, or use `minHeight` on the container and render `null` when there's no content.

---

### M12. No animation on question transitions in practice

**File:** `app/practice.tsx`, lines 131–134

When the user taps "Next", the question content swaps instantly: Arabic text, transliteration, and all four options change in a single frame. This is jarring and makes it unclear whether the screen actually advanced, especially on fast taps.

**Fix:** Add a brief fade or slide transition between questions using `Animated` or `react-native-reanimated` (already a dependency).

---

### M13. Practice summary doesn't show which phrases were missed

**File:** `app/practice.tsx`, lines 192–237

The summary screen only shows "X / Y answered correctly". Users can't see which specific phrases they got wrong, missing a critical learning reinforcement opportunity. Language learning apps universally show a recap of errors.

**Fix:** Track the missed phrases during the session (e.g. `wrongPhrases` state array) and list them on the summary screen with their correct English meanings.

---

### M14. Daily notification picks a random phrase, not SRS-aligned

**File:** `services/notificationService.ts`, lines 56–59

`pickPhrase` uses `Math.random()` to select the notification phrase. The chosen phrase may be one the user already knows well (at SRS stage 4), while a phrase due for review today goes un-surfaced.

**Fix:** Integrate with the SRS state — pick a phrase that is due or nearly due. Fall back to random only if nothing is due.

---

### M15. `cancelAllScheduledNotificationsAsync` clears ALL notifications

**File:** `services/notificationService.ts`, line 73

The function cancels every scheduled notification, not just the daily phrase. If the app ever adds a second notification type (e.g. streak reminders), this call will silently kill it. Even now, calling `scheduleDailyPhrase()` on every level change or app open cancels and re-schedules, which could cause a brief window with no notification scheduled if the process crashes mid-function.

**Fix:** Use `Notifications.cancelScheduledNotificationAsync(identifier)` with a stored notification ID, or assign a known identifier and cancel only that one.

---

### M16. Splash screen progress bar ignores safe area

**File:** `components/AnimatedSplash.tsx`, lines 449–456

```tsx
progressContainer: {
  position: 'absolute',
  bottom: 80,
  ...
}
```

The hardcoded `bottom: 80` doesn't account for safe area insets. On iPhone models with large home indicators, the progress bar may overlap or sit too close to the system chrome. On small-screen Android devices it may be too high.

**Fix:** Use `useSafeAreaInsets()` and compute `bottom` as `insets.bottom + someMargin`.

---

### M17. Splash screen uses static `Dimensions.get('window')`

**File:** `components/AnimatedSplash.tsx`, line 24

```tsx
const { width, height } = Dimensions.get('window');
```

Captured at module load time. On foldable devices, split-screen mode, or if the splash screen is ever shown after a screen rotation, the values will be stale.

**Fix:** Use the `useWindowDimensions()` hook inside the component.

---

### M18. No pull-to-refresh on the home screen

**File:** `app/(tabs)/today.tsx`

The practice card count updates on focus and foreground events, but users have no manual way to refresh. The common pull-to-refresh gesture is absent. Users returning after a day boundary might not see updated counts until they navigate away and back.

**Fix:** Wrap the content in a `RefreshControl`-enabled `ScrollView` (or `SectionList`) and re-fetch practice counts on pull.

---

### M19. Speech service uses `ar-SA` instead of `ar-AE`

**File:** `services/speechService.ts`, line 18

The app teaches Emirati Arabic but uses `ar-SA` (Saudi Arabic) for TTS. While pragmatically this is the most widely-supported Arabic locale, the pronunciation differences are noticeable to Gulf Arabic speakers — the app's target audience.

**Fix:** Try `ar-AE` first, and fall back to `ar-SA` if unavailable. Expo Speech's `getAvailableVoicesAsync()` can be used to check availability.

---

## Minor — Cosmetic issues, inconsistencies, polish items

### m1. `FontWeight` object missing `as const`

**File:** `constants/theme.ts`, line 70

Every other token object (`Colors`, `FontSize`, `FontFamily`, `Spacing`, `BorderRadius`, `Shadows`, `ComponentTokens`, `Surfaces`) is declared `as const`. `FontWeight` is the lone exception. This weakens type inference — the values are typed as `string` instead of `'400'`, `'700'`, etc.

**Fix:** Add `as const` to the `FontWeight` declaration.

---

### m2. Inconsistent Spacing key naming

**File:** `constants/theme.ts`, lines 102–111

Most keys are bare identifiers (`xs`, `sm`, `md`) but two use string keys: `'2xs'` and `'3xl'`. This forces bracket notation (`Spacing['2xs']`) at usage sites, breaking the dot-access pattern.

**Fix:** Rename to `xxs` and `xxxl` for consistency, or accept the inconsistency and document it.

---

### m3. Hardcoded magic numbers in styles

**Files:**
- `app/(tabs)/today.tsx`, lines 468, 482 → `marginBottom: 2`
- `components/GoldButton.tsx`, line 112 → `marginRight: 8`
- `components/AnimatedSplash.tsx`, lines 416, 429, 434, 449 → `marginTop: 28`, `marginTop: 4`, `marginTop: 40`, `bottom: 80`

The theme defines a spacing scale but these values bypass it. Even `2` and `4` have tokens (`Spacing['2xs']` and `Spacing.xs`).

**Fix:** Replace with the appropriate spacing tokens from the theme.

---

### m4. `letterSpacing: 0.3` hardcoded in GoldButton

**File:** `components/GoldButton.tsx`, line 138

Button text letter spacing is a magic number rather than a theme token. If the design system ever adjusts letter spacing globally, this value will be missed.

**Fix:** Add a `letterSpacing` token to the theme or to `ComponentTokens.button`.

---

### m5. Redundant `fontWeight` alongside `fontFamily` throughout

**Files:** `app/practice.tsx`, `app/(tabs)/today.tsx`, `app/onboarding.tsx`, `components/GoldButton.tsx`, `components/AnimatedSplash.tsx`

Many styles specify both `fontFamily: FontFamily.bold` (which loads the 700-weight Nunito file) AND `fontWeight: FontWeight.bold`. On Android, this is redundant — the font file determines the weight. On iOS, both are needed. However, the inconsistency of having it in most places but not all creates confusion.

**Fix:** Create a helper or extend `TextStyles` to always pair `fontFamily` + `fontWeight` consistently. Consider a `fontStyle(weight)` utility function.

---

### m6. StatusBar hardcoded to `dark`

**File:** `app/_layout.tsx`, line 83

```tsx
<StatusBar style="dark" />
```

If dark mode is ever added, this won't adapt. The splash background is warm-toned (`#FBF7F0`), so `dark` is correct there, but the main app background is cool (`#F6F7FB`) — still light, but worth centralizing.

**Fix:** Use `style="auto"` or derive from the theme.

---

### m7. `I18nManager.allowRTL(true)` is effectively dead code

**File:** `app/_layout.tsx`, lines 46–48

```tsx
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
}
```

`allowRTL(true)` permits the system to flip the layout if the device locale is RTL, but it doesn't force it. Since no `forceRTL` call follows, and the app's UI language is English, this has no practical effect. The Arabic text already uses `writingDirection: 'rtl'` where needed.

**Fix:** Either remove the dead code or add a comment clarifying the intent (e.g. "allows RTL layout for Arabic-locale devices").

---

### m8. Emoji rendering inconsistency in theme titles

**File:** `app/(tabs)/today.tsx`, lines 289–291

```tsx
<Text style={styles.themeEmoji}>{theme.emoji}  </Text>
```

The double-space after the emoji is a layout hack. Emoji rendering varies by platform and font — some render wider or taller. The emoji also lacks a fixed-width container, so title text alignment can shift between themes.

**Fix:** Wrap the emoji in a fixed-width `<View>` with `width: 28` (or similar) and center it, so all theme titles have consistent left alignment.

---

### m9. `hitSlop` on practice close button is redundant

**File:** `app/practice.tsx`, line 251

```tsx
hitSlop={8}
```

The close button already has a 44x44pt container (`ComponentTokens.iconButton.size`), which meets the minimum tap target. The 8pt hitSlop extends it slightly but adds no meaningful benefit. More importantly, the hitSlop is smaller than typical recommendations (12–16px) if the button were undersized.

**Fix:** Either remove the redundant `hitSlop` or increase it to 12+ for extra forgiving touch targets.

---

### m10. No haptic feedback on answer selection

**File:** `app/practice.tsx`, lines 103–116

Selecting an answer in practice provides visual feedback (color change) and text feedback ("Correct!" / "Not quite"), but no haptic response. A light vibration on correct/incorrect answers is standard in language learning apps and adds satisfying physicality.

**Fix:** Add `expo-haptics` — `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)` for correct, `.Error` for incorrect.

---

### m11. Practice "empty" state button is full-width but content is centered

**File:** `app/practice.tsx`, lines 185–188

The "All caught up" screen centers its content but wraps the "Done" button in `<View style={styles.emptyCta}>` with `alignSelf: 'stretch'`, making the GoldButton span the full width. Visually this works, but it creates an unusually wide tap target for a simple dismiss action on an otherwise minimal screen.

**Fix:** Consider a narrower button (e.g. `fullWidth={false}`) or accept the current design as intentional.

---

### m12. (tabs) layout uses `Stack` instead of `Tabs` navigator

**File:** `app/(tabs)/_layout.tsx`, lines 15–25

The directory is named `(tabs)` (suggesting a tab bar), but the layout uses a `Stack` navigator with a single route. There is no visible tab bar. This is confusing for developers reading the code — the naming convention implies bottom tabs.

**Fix:** Either rename the group to something like `(main)` to match the actual navigator, or add a `Tabs` navigator if a tab bar is planned.

---

### m13. No loading skeleton for the home screen

**File:** `app/(tabs)/today.tsx`, lines 174–180

The initial loading state shows only a centered `ActivityIndicator` on a blank background. The user sees a spinner with no context about what's loading. A skeleton screen (gray blocks mimicking the header, pills, and card layout) would feel faster and more polished.

**Fix:** Add a skeleton placeholder matching the home screen layout.

---

### m14. Search bar has no "no results" illustration

**File:** `app/(tabs)/today.tsx`, lines 275–281

The empty state for search shows plain text ("No matching phrases / Try a different search or switch levels") with no illustration. An empty-state illustration (even a simple icon) would make this feel less like an error.

**Fix:** Add an icon or illustration above the text (e.g. a magnifying glass with a question mark).

---

### m15. `router` in useEffect dependency array

**File:** `app/practice.tsx`, line 95 | `app/(tabs)/today.tsx`, line 85

Both init effects include `router` in the dependency array. With `expo-router`, the router object is stable, so this is technically harmless — but it signals that the effect should re-run if the router changes, which is never the intent. It's initialization logic.

**Fix:** Use `// eslint-disable-next-line react-hooks/exhaustive-deps` with an empty dep array, or extract `router` via a ref to communicate intent.

---

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 4     |
| Major    | 19    |
| Minor    | 15    |
| **Total** | **38** |

### Top priorities

1. Fix the AnimatedSplash memory leak and render-time Animated.Value (C1, C2)
2. Remove duplicate "I want" phrase (C3)
3. Sync version numbers (C4)
4. Replace ScrollView+map with SectionList for phrase list (M1)
5. Add keyboard dismiss on scroll (M2)
6. Migrate GoldButton to Pressable with proper disabled handling (M3, M4, M5)
7. Add error feedback to onboarding (M6)
8. Fix accessibility roles on level pills and onboarding radio group (M9, M10)
