/**
 * Removed in v3.0 — the SRS card session was cut.
 * The app is now a phrase browser organized by level.
 */
import { Redirect } from 'expo-router';

export default function SessionRemoved() {
  return <Redirect href="/today" />;
}