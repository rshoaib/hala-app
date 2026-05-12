/**
 * Removed in v3.0 — mission paths were cut. The phrase browser replaces them.
 */
import { Redirect } from 'expo-router';

export default function MissionRemoved() {
  return <Redirect href="/today" />;
}