/**
 * Sentry integration is DISABLED.
 *
 * @sentry/react-native is a native module that Expo Go does not bundle; importing
 * it crashes the app at startup when running in Expo Go. This keeps the same API
 * so call sites are unchanged.
 *
 * To re-enable error tracking (in a development/production build, not Expo Go):
 * restore `import * as Sentry from "@sentry/react-native";` and call the Sentry
 * methods below, and set EXPO_PUBLIC_SENTRY_DSN.
 */

type SeverityLevel = "fatal" | "error" | "warning" | "log" | "info" | "debug";

export function initSentry() {
  // Disabled (see file header).
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (__DEV__) {
    console.error("[Sentry disabled]", error, context);
  }
}

export function captureMessage(message: string, level: SeverityLevel = "info") {
  if (__DEV__) {
    console.debug(`[Sentry disabled ${level}]`, message);
  }
}

export function setUser(_user: {
  id: string;
  email?: string;
  username?: string;
} | null) {
  // Disabled (see file header).
}

export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>
) {
  if (__DEV__) {
    console.debug(`[Sentry disabled] ${category}: ${message}`, data);
  }
}
