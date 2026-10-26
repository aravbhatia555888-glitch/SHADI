import { supabase } from "@/config/supabase";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession();

const REDIRECT_URI = "shaadibazaar://auth/callback";

async function signInWithProvider(provider: "google" | "apple"): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: REDIRECT_URI,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.url) {
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        REDIRECT_URI
      );

      if (result.type === "success") {
        const { error: sessionError } =
          await supabase.auth.exchangeCodeForSession(result.url);

        if (sessionError) {
          return { success: false, error: sessionError.message };
        }
        return { success: true };
      }
    }

    return {
      success: false,
      error: `${provider === "google" ? "Google" : "Apple"} sign-in was cancelled`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Authentication failed",
    };
  }
}

export async function signInWithGoogle(): Promise<{
  success: boolean;
  error?: string;
}> {
  return signInWithProvider("google");
}

export async function signInWithApple(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (Platform.OS !== "ios") {
    return {
      success: false,
      error: "Apple Sign In is only available on iOS",
    };
  }
  return signInWithProvider("apple");
}