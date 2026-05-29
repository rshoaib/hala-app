#!/usr/bin/env node
/**
 * Upload an APK to Google Play "Internal App Sharing" via the Play Developer
 * API, authenticated with a service-account key. Zero external dependencies
 * (Node 18+: uses built-in fetch + crypto).
 *
 * Internal App Sharing accepts an APK signed with ANY key (incl. the debug
 * key) and returns a shareable install link for testers — it is NOT the
 * "internal testing" release track (which requires an AAB + upload-key signing).
 *
 * Usage:
 *   node scripts/upload-internal-app-sharing.js [path/to/app.apk]
 *
 * Inputs:
 *   - google-play-key.json   service-account key (override: GOOGLE_PLAY_KEY env)
 *   - app.json               android.package
 *   - APK arg, or default android/app/build/outputs/apk/release/app-release.apk
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const KEY_PATH = process.env.GOOGLE_PLAY_KEY || path.join(ROOT, 'google-play-key.json');
const APK_PATH = process.argv[2] ||
  path.join(ROOT, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');

const b64url = (input) =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function getAccessToken(key) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: key.token_uri || 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const input = `${header}.${claims}`;
  const signature = crypto.createSign('RSA-SHA256').update(input).sign(key.private_key)
    .toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const res = await fetch(key.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${input}.${signature}`,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Auth failed (HTTP ${res.status}): ${JSON.stringify(data)}`);
  return data.access_token;
}

async function uploadApk(pkg, token, apk) {
  // Simple media upload (uploadType=media) is the protocol this method supports.
  const hosts = ['https://androidpublisher.googleapis.com', 'https://www.googleapis.com'];
  let lastErr;
  for (const host of hosts) {
    const url = `${host}/upload/androidpublisher/v3/applications/internalappsharing/${pkg}/artifacts/apk?uploadType=media`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(apk.length),
      },
      body: apk,
    });
    const text = await res.text();
    if (res.ok) return JSON.parse(text);
    lastErr = httpError('Upload', res.status, text);
    // Only a 404 (wrong route on this host) is worth retrying on the other host.
    if (res.status !== 404) throw lastErr;
  }
  throw lastErr;
}

function httpError(stage, status, body) {
  let msg = `${stage} failed (HTTP ${status}).\n${body}`;
  if (status === 401 || status === 403) {
    msg += '\n\nThe service account is likely missing Internal App Sharing permission for this app.' +
      '\nFix in Play Console: Users & permissions → (this service account) → grant app access with' +
      '\n"Internal app sharing" / release permissions, and ensure the app is linked to this developer account.';
  }
  return new Error(msg);
}

(async () => {
  if (!fs.existsSync(KEY_PATH)) throw new Error(`Service-account key not found: ${KEY_PATH}`);
  if (!fs.existsSync(APK_PATH)) throw new Error(`APK not found: ${APK_PATH}\nBuild it first (gradlew assembleRelease).`);

  const key = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8')).expo.android.package;
  const apk = fs.readFileSync(APK_PATH);

  console.log(`App package : ${pkg}`);
  console.log(`Service acct: ${key.client_email}`);
  console.log(`APK         : ${path.relative(ROOT, APK_PATH)} (${(apk.length / 1048576).toFixed(1)} MB)`);
  console.log('Authenticating…');
  const token = await getAccessToken(key);
  console.log('Uploading to Internal App Sharing…');
  const result = await uploadApk(pkg, token, apk);

  console.log('\n✅ Uploaded to Play Internal App Sharing.');
  console.log('\nShareable install link (send to testers):');
  console.log('  ' + result.downloadUrl);
  console.log('\nSHA-256: ' + (result.sha256 || 'n/a'));
})().catch((e) => { console.error('\n❌ ' + (e.message || e)); process.exit(1); });
