const { withGradleProperties } = require('expo/config-plugins');

/**
 * Speeds up LOCAL Android builds by restricting native compilation to
 * arm64-v8a (the only ABI a modern physical device needs). Cloud builds on
 * EAS are left untouched so release artifacts keep every ABI the Play Store
 * requires (armeabi-v7a, x86, x86_64) — EAS sets EAS_BUILD="true".
 *
 * Because `expo prebuild` regenerates android/gradle.properties from scratch,
 * this plugin re-applies the setting on every prebuild instead of relying on a
 * manual edit that gets wiped.
 *
 * To force all ABIs locally (e.g. a local store AAB), run prebuild with
 * EAS_BUILD=true in the environment.
 */
module.exports = function withLocalArm64(config) {
  if (process.env.EAS_BUILD === 'true') return config;
  return withGradleProperties(config, (cfg) => {
    const key = 'reactNativeArchitectures';
    const existing = cfg.modResults.find(
      (item) => item.type === 'property' && item.key === key
    );
    if (existing) {
      existing.value = 'arm64-v8a';
    } else {
      cfg.modResults.push({ type: 'property', key, value: 'arm64-v8a' });
    }
    return cfg;
  });
};
