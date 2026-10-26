import * as Sentry from "@sentry/react-native";

export function initSentry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  if (!dsn && !__DEV__) {
    console.error(
      "[Sentry] EXPO_PUBLIC_SENTRY_DSN is not set. Error tracking is DISABLED in production. " +
      "Set it in your .env file or via expo config."
    );
  }

  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: __DEV__ ? "development" : "production",
    debug: __DEV__,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    beforeSend(event) {
      if (__DEV__) {
        return null;
      }
      return event;
    },
  });
}

export function captureError(
  error: unknown,
  context?: Record<string, unknown>
) {
  if (__DEV__) {
    console.error("[Sentry]", error, context);
    return;
  }
  Sentry.captureException(error, { extra: context });
}

export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info"
) {
  if (__DEV__) {
    console.debug(`[Sentry ${level}]`, message);
    return;
  }
  Sentry.captureMessage(message, level);
}

export function setUser(
  user: { id: string; email?: string; username?: string } | null
) {
  Sentry.setUser(user);
}

export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: "info",
  });
}
