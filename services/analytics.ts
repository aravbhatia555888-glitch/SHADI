type EventProperties = Record<string, string | number | boolean | undefined>;

export interface AnalyticsProvider {
  trackEvent(name: string, properties?: EventProperties): void;
  trackScreen(screenName: string, properties?: EventProperties): void;
  setUserProperties(
    properties: Record<string, string | number | boolean>
  ): void;
  setUserId(userId: string | null): void;
}

/**
 * Default analytics provider that logs to console in dev and silently
 * discards events in production. Swap via configureAnalytics().
 *
 * USAGE:
 * 1. Create a provider implementing AnalyticsProvider
 * 2. Call configureAnalytics() at app startup before any trackEvent calls
 *
 * Example with Firebase:
 *   import { firebaseAnalyticsProvider } from "./analytics-firebase";
 *   configureAnalytics(firebaseAnalyticsProvider);
 *
 * To create a custom provider for another service (Amplitude, Mixpanel, etc.):
 *   class MyAnalytics implements AnalyticsProvider { ... }
 *   configureAnalytics(new MyAnalytics());
 */
class ConsoleAnalytics implements AnalyticsProvider {
  trackEvent(name: string, properties?: EventProperties) {
    if (__DEV__) {
      console.debug(`[Analytics] Event: ${name}`, properties);
    }
    // In production, this provider does nothing by design.
    // Configure a real provider via configureAnalytics().
  }

  trackScreen(screenName: string, properties?: EventProperties) {
    if (__DEV__) {
      console.debug(`[Analytics] Screen: ${screenName}`, properties);
    }
  }

  setUserProperties(properties: Record<string, string | number | boolean>) {
    if (__DEV__) {
      console.debug(`[Analytics] User Properties:`, properties);
    }
  }

  setUserId(userId: string | null) {
    if (__DEV__) {
      console.debug(`[Analytics] User ID: ${userId}`);
    }
  }
}

let analytics: AnalyticsProvider = new ConsoleAnalytics();

/**
 * Configure a custom analytics provider (e.g., Firebase, Amplitude, Mixpanel).
 * Call this during app initialization with your provider implementation.
 *
 * Example:
 *   import { firebaseAnalyticsProvider } from "./analytics-firebase";
 *   configureAnalytics(firebaseAnalyticsProvider);
 *
 * To create a custom provider, implement the AnalyticsProvider interface.
 */
export function configureAnalytics(provider: AnalyticsProvider) {
  analytics = provider;
  if (__DEV__) {
    console.debug("[Analytics] Provider configured:", provider.constructor.name);
  }
}

export function trackEvent(name: string, properties?: EventProperties) {
  analytics.trackEvent(name, properties);
}

export function trackScreen(screenName: string, properties?: EventProperties) {
  analytics.trackScreen(screenName, properties);
}

export function setUserProperties(
  properties: Record<string, string | number | boolean>
) {
  analytics.setUserProperties(properties);
}

export function setUserId(userId: string | null) {
  analytics.setUserId(userId);
}

export const AnalyticsEvents = {
  SIGN_UP: "sign_up",
  SIGN_IN: "sign_in",
  SIGN_OUT: "sign_out",
  PASSWORD_RESET: "password_reset",

  VENDOR_VIEW: "vendor_view",
  VENDOR_SEARCH: "vendor_search",
  VENDOR_FILTER: "vendor_filter",
  VENDOR_FAVORITE: "vendor_favorite",
  VENDOR_UNFAVORITE: "vendor_unfavorite",
  VENDOR_CONTACT: "vendor_contact",
  INQUIRY_SEND: "inquiry_send",

  BOOKING_START: "booking_start",
  BOOKING_SUBMIT: "booking_submit",
  BOOKING_CONFIRM: "booking_confirm",

  REVIEW_SUBMIT: "review_submit",
  REVIEW_DELETE: "review_delete",

  CHECKLIST_ADD: "checklist_add",
  CHECKLIST_COMPLETE: "checklist_complete",
  CHECKLIST_UNCOMPLETE: "checklist_uncomplete",
  CHECKLIST_DELETE: "checklist_delete",

  BUDGET_ADD_CATEGORY: "budget_add_category",
  BUDGET_ADD_EXPENSE: "budget_add_expense",
  BUDGET_UPDATE_EXPENSE: "budget_update_expense",

  PROFILE_UPDATE: "profile_update",
  PROFILE_IMAGE_UPLOAD: "profile_image_upload",
  ACCOUNT_DELETE: "account_delete",

  SCREEN_VIEW: "screen_view",
  SEARCH: "search",
  SHARE: "share",

  VENDOR_COMPARE: "vendor_compare",
  CARD_CREATE: "card_create",
  CARD_SAVE: "card_save",
  CARD_UPDATE: "card_update",
  CARD_SHARE: "card_share",
  CARD_DELETE: "card_delete",
  CARD_GALLERY_SAVE: "card_gallery_save",

  SUBSCRIPTION_ACTIVATED: "subscription_activated",
  SUBSCRIPTION_CANCELLED: "subscription_cancelled",
  SUBSCRIPTION_UPGRADED: "subscription_upgraded",
  INQUIRY_LIMIT_REACHED: "inquiry_limit_reached",
} as const;
