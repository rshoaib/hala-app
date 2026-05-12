/**
 * Removed in v3.0 — the placement test was cut. The user picks
 * Beginner / Intermediate / Expert in onboarding instead.
 *
 * Kept as a redirect so any deep link or stale navigation lands on home.
 */
import { Redirect } from 'expo-router';

export default function PlacementRemoved() {
  return <Redirect href="/today" />;
}