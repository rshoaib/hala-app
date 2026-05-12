/**
 * Removed in v3.0 — the settings screen was cut. Level switching now
 * lives directly on the home screen as a top-row toggle.
 */
import { Redirect } from 'expo-router';

export default function SettingsRemoved() {
  return <Redirect href="/today" />;
}