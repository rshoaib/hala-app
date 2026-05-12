/**
 * Removed in v3.0 — the You tab was cut along with streaks and XP.
 */
import { Redirect } from 'expo-router';

export default function YouRemoved() {
  return <Redirect href="/today" />;
}