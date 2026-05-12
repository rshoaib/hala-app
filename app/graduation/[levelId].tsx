/**
 * Removed in v3.0 — graduation assessments were cut. Level changes
 * happen instantly from the home screen toggle, no ceremony required.
 */
import { Redirect } from 'expo-router';

export default function GraduationRemoved() {
  return <Redirect href="/today" />;
}