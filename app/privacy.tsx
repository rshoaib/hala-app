/**
 * Removed in v3.0 — privacy screen was cut along with settings.
 * Stores can still link to the privacy policy URL hosted externally.
 */
import { Redirect } from 'expo-router';

export default function PrivacyRemoved() {
  return <Redirect href="/today" />;
}