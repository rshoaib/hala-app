/**
 * AdMob Banner Component
 * Renders Google AdMob banner ads with graceful fallback
 * Safely handles missing native module in Expo Go
 */
import { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';

let BannerAd: any = null;
let BannerAdSize: any = {};
let TestIds: any = {};

try {
  const ads = require('react-native-google-mobile-ads');
  BannerAd = ads.BannerAd;
  BannerAdSize = ads.BannerAdSize;
  TestIds = ads.TestIds;
} catch (e) {
  // react-native-google-mobile-ads not available (Expo Go)
}

// AdMob ad unit IDs (Android: production, iOS: test)
const AD_UNIT_IDS = {
  banner: Platform.select({
    ios: TestIds?.ADAPTIVE_BANNER ?? '',
    android: 'ca-app-pub-3166995085202346/4225177543',
    default: '',
  }),
  interstitial: Platform.select({
    ios: TestIds?.INTERSTITIAL ?? '',
    android: 'ca-app-pub-3166995085202346/7721569425',
    default: '',
  }),
  rewarded: Platform.select({
    ios: TestIds?.REWARDED ?? '',
    android: 'ca-app-pub-3166995085202346/5209421309',
    default: '',
  }),
};

interface AdBannerProps {
  size?: 'banner' | 'largeBanner' | 'mediumRectangle';
}

/**
 * AdBanner component — shows a Google AdMob banner
 */
export function AdBanner({ size = 'banner' }: AdBannerProps) {
  const [adError, setAdError] = useState(false);
  const adUnitId = AD_UNIT_IDS.banner;

  if (!BannerAd || adError || !adUnitId) return null;

  const SIZE_MAP: Record<string, any> = {
    banner: BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
    largeBanner: BannerAdSize.LARGE_BANNER,
    mediumRectangle: BannerAdSize.MEDIUM_RECTANGLE,
  };

  return (
    <View style={styles.adContainer}>
      <BannerAd
        unitId={adUnitId}
        size={SIZE_MAP[size]}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={(error: any) => {
          console.warn('Ad failed to load:', error);
          setAdError(true);
        }}
      />
    </View>
  );
}

/**
 * Show an interstitial ad (between missions)
 */
export async function showInterstitialAd(): Promise<boolean> {
  try {
    const { InterstitialAd, AdEventType } = require('react-native-google-mobile-ads');
    const adUnitId = AD_UNIT_IDS.interstitial;
    if (!adUnitId) return false;

    return new Promise((resolve) => {
      const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });

      interstitial.addAdEventListener(AdEventType.LOADED, () => {
        interstitial.show();
      });

      interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        resolve(true);
      });

      interstitial.addAdEventListener(AdEventType.ERROR, () => {
        resolve(false);
      });

      interstitial.load();

      // Timeout after 5 seconds
      setTimeout(() => resolve(false), 5000);
    });
  } catch {
    return false;
  }
}

/**
 * Show a rewarded ad (for streak freeze, hints)
 */
export async function showRewardedAd(): Promise<boolean> {
  try {
    const { RewardedAd, RewardedAdEventType } = require('react-native-google-mobile-ads');
    const adUnitId = AD_UNIT_IDS.rewarded;
    if (!adUnitId) return true; // Grant reward if no ad unit

    return new Promise((resolve) => {
      const rewarded = RewardedAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });

      rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        resolve(true);
      });

      rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
        rewarded.show();
      });

      rewarded.addAdEventListener('error', () => {
        resolve(false);
      });

      rewarded.load();

      // Timeout after 5 seconds
      setTimeout(() => resolve(false), 5000);
    });
  } catch {
    return false;
  }
}

const styles = StyleSheet.create({
  adContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
});

export { AD_UNIT_IDS };
