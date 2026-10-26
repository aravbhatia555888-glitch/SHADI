import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  if (__DEV__) {
    console.warn(
      "[ShaadiBazaar] Missing Supabase credentials. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file."
    );
  } else {
    // S14 fix: In production, fail loudly instead of silently creating a broken client
    console.error(
      "[ShaadiBazaar] FATAL: Missing Supabase credentials. The app will not function correctly."
    );
  }
}

// The checked-in Database interface is intentionally incomplete (it omits
// several production tables and RPCs), so applying it here would incorrectly
// turn valid queries into `never`. Keep the SDK-inferred client until types are
// regenerated from the deployed schema.
export const supabase = createClient(
  supabaseUrl ?? "",
  supabaseAnonKey ?? "",
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export const handleSupabaseError = (error: unknown): string => {
  if (__DEV__) {
    console.error("Supabase error:", error);
  }

  if (error && typeof error === "object" && "message" in error) {
    const err = error as { message: string; code?: string; status?: number };

    if (err.code) {
      switch (err.code) {
        case "invalid_credentials":
          return "Invalid email or password. Please check your credentials and try again.";
        case "email_not_confirmed":
          return "Please verify your email address before signing in.";
        case "user_already_exists":
          return "An account with this email already exists. Try signing in instead.";
        case "weak_password":
          return "Password is too weak. Use at least 6 characters with a mix of letters and numbers.";
        case "invalid_email":
          return "Please enter a valid email address.";
        case "too_many_requests":
          return "Too many attempts. Please wait a few minutes and try again.";
        case "signup_disabled":
          return "New account registration is currently disabled.";
        case "session_not_found":
          return "Your session has expired. Please sign in again.";
        case "same_password":
          return "New password must be different from your current password.";
        default:
          break;
      }
    }

    if (err.status) {
      switch (err.status) {
        case 400:
          return "Invalid request. Please check your input and try again.";
        case 401:
          return "You are not authorized. Please sign in again.";
        case 403:
          return "You do not have permission to perform this action.";
        case 404:
          return "The requested resource was not found.";
        case 409:
          return "This action conflicts with existing data. Please refresh and try again.";
        case 422:
          return "Invalid data provided. Please check your input.";
        case 429:
          return "Too many requests. Please wait a moment and try again.";
        case 500:
          return "A server error occurred. Please try again later.";
        default:
          break;
      }
    }

    // S15 fix: Never return raw error.message in production — it can leak
    // DB internals (constraint names, schema, table structure).
    // Only in dev mode do we return the actual message for debugging.
    if (err.message.includes("duplicate key")) {
      return "This item already exists.";
    }
    if (err.message.includes("foreign key")) {
      return "Referenced data does not exist.";
    }
    if (
      err.message.includes("permission denied") ||
      err.message.includes("42501")
    ) {
      return "You do not have permission to perform this action.";
    }
    if (err.message.includes("JWT")) {
      return "Your session has expired. Please sign in again.";
    }

    // S15 fix: In production, return generic message. In dev, return actual message.
    if (__DEV__) {
      return error instanceof Error ? error.message : "An unexpected error occurred. Please try again.";
    }
    return "An unexpected error occurred. Please try again.";
  }

  if (error instanceof Error) {
    // S15 fix: Never leak raw error messages in production
    if (__DEV__) {
      return error.message;
    }
    return "An unexpected error occurred. Please try again.";
  }

  return "An unexpected error occurred. Please try again.";
};

export const getDetailedError = (
  error: unknown
): { message: string; code: string; details?: unknown } => {
  if (__DEV__) {
    console.error("Supabase detailed error:", error);
  }

  if (error && typeof error === "object" && "code" in error) {
    const err = error as {
      message: string;
      code: string;
      details?: string;
      hint?: string;
    };
    return {
      message: err.message,
      code: err.code,
      // Only expose full error details in development — production gets code only
      details: __DEV__ ? error : undefined,
    };
  }

  if (error instanceof Error) {
    return {
      message: __DEV__ ? error.message : "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
      details: __DEV__ ? error : undefined,
    };
  }

  return {
    message: "An unexpected error occurred",
    code: "UNKNOWN_ERROR",
  };
};

export const getCurrentUser = () => {
  return supabase.auth.getUser();
};

export const isAuthenticated = async (): Promise<boolean> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return !!user;
};
