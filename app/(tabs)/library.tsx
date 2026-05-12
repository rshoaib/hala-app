/**
 * Removed in v3.0 — the Library tab was cut. The home screen is itself a
 * phrase browser, so a separate tab is redundant.
 */
import { Redirect } from 'expo-router';

export default function LibraryRemoved() {
  return <Redirect href="/today" />;
}