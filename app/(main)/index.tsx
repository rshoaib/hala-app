/**
 * Index route — the app's "/" entry point.
 *
 * Expo Router resolves the launch URL "/" against the route table. Without
 * an index route it falls through to +not-found, which then sits on top of
 * the (main)/today anchor on every launch after onboarding (fresh installs
 * were rescued by today's onboarding redirect). Deleted by mistake in the
 * v3 dead-code cleanup; do not remove again.
 */
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/today" />;
}
