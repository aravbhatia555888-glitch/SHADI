/**
 * Firebase Analytics Provider
 *
 * Usage:
 *   import { firebaseAnalyticsProvider } from "./services/analytics-firebase";
 *   configureAnalytics(firebaseAnalyticsProvider);
 *
 * Requirements:
 *   npm install firebase
 *   Set EXPO_PUBLIC_FIREBASE_API_KEY in your .env file
 */

import type { AnalyticsProvider } from "./analytics";

// Lazy provider factory — never touches Firebase unless EXPO_PUBLIC_FIREBASE_API_KEY is set
function createFirebaseProvider(): AnalyticsProvider | null {
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) return null;

  // Use a deferred pattern: the Firebase SDK is not loaded during module init.
  // The first call to any method triggers the dynamic import.
  let _analytics: unknown = null;
  let _initPromise: Promise<void> | null = null;
  let _initFailed = false;

  async function init(): Promise<void> {
    if (_analytics || _initFailed) return;
    if (_initPromise) return _initPromise;

    _initPromise = (async () => {
      try {
        const firebaseConfig = {
          apiKey,
          authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
          measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
        };

        const firebaseApp = await import("firebase/app");
        const firebaseAnalytics = await import("firebase/analytics");
        const { Platform } = await import("react-native");

        const { initializeApp } = firebaseApp as unknown as {
          initializeApp: (config: Record<string, unknown>) => unknown;
        };
        const { getAnalytics, logEvent, setUserProperties, setUserId } =
          firebaseAnalytics as unknown as {
            getAnalytics: (app: unknown) => unknown;
            logEvent: (analytics: unknown, name: string, props?: Record<string, unknown>) => void;
            setUserProperties: (analytics: unknown, props: Record<string, unknown>) => void;
            setUserId: (analytics: unknown, userId: string) => void;
          };

        const app = initializeApp(firebaseConfig);
        _analytics = getAnalytics(app);

        // Store references for later use
        const analyticsRef = _analytics;
        const logEventRef = logEvent;
        const setUserPropsRef = setUserProperties;
        const setUserIdRef = setUserId;
        const platform = Platform.OS;

        // Rebind methods with initialized references
        provider.trackEvent = (name, properties) => {
          try {
            logEventRef(analyticsRef, name, properties as Record<string, unknown>);
          } catch (e) {
            if (__DEV__) console.warn("Analytics event error:", e);
          }
        };
        provider.trackScreen = (screenName, properties) => {
          try {
            logEventRef(analyticsRef, "screen_view", {
              screen_name: screenName,
              ...(properties as Record<string, unknown>),
            });
          } catch (e) {
            if (__DEV__) console.warn("Analytics screen error:", e);
          }
        };
        provider.setUserProperties = (properties) => {
          try {
            setUserPropsRef(analyticsRef, {
              ...properties,
              platform,
            });
          } catch (e) {
            if (__DEV__) console.warn("Analytics user props error:", e);
          }
        };
        provider.setUserId = (userId) => {
          try {
            setUserIdRef(analyticsRef, userId ?? "");
          } catch (e) {
            if (__DEV__) console.warn("Analytics user ID error:", e);
          }
        };
      } catch (e) {
        _initFailed = true;
        if (__DEV__)
          console.warn(
            "Firebase SDK not installed. Run: npm install firebase",
            e
          );
      }
    })();

    return _initPromise;
  }

  // Mutable provider — methods are replaced once Firebase initializes
  const provider: AnalyticsProvider = {
    trackEvent: () => {
      init().catch(() => {});
    },
    trackScreen: () => {
      init().catch(() => {});
    },
    setUserProperties: () => {
      init().catch(() => {});
    },
    setUserId: () => {
      init().catch(() => {});
    },
  };

  // Kick off initialization in the background
  init().catch(() => {});

  return provider;
}

const _firebaseProvider = createFirebaseProvider();

/** Firebase analytics provider. No-ops gracefully if Firebase SDK is not installed. */
export const firebaseAnalyticsProvider: AnalyticsProvider =
  _firebaseProvider || {
    trackEvent: () => {},
    trackScreen: () => {},
    setUserProperties: () => {},
    setUserId: () => {},
  };

/**
 * Auto-detect if Firebase is configured and return the appropriate provider.
 *
 * - If `EXPO_PUBLIC_FIREBASE_API_KEY` is set, returns the Firebase provider
 *   (which lazily initializes the SDK on first use).
 * - Otherwise returns a no-op provider so nothing breaks in dev.
 */
export function createAutoAnalyticsProvider(): AnalyticsProvider {
  if (process.env.EXPO_PUBLIC_FIREBASE_API_KEY) {
    return firebaseAnalyticsProvider;
  }
  // In production without a real provider, return no-op (not ConsoleAnalytics which logs)
  return {
    trackEvent: () => {},
    trackScreen: () => {},
    setUserProperties: () => {},
    setUserId: () => {},
  };
}
