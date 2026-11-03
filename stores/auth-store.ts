import { handleSupabaseError,supabase } from "@/config/supabase";
import {
ResetPasswordSchema,
SignInSchema,
SignUpSchema,
UpdateProfileSchema,
UserSchema,
type ResetPasswordData,
type SignInData,
type SignUpData,
type UpdateProfileData,
type User,
type UserRole,
} from "@/schemas/auth";
import { AnalyticsEvents,trackEvent } from "@/services/analytics";
import { setUser as setSentryUser } from "@/services/sentry";
import { signInWithApple,signInWithGoogle } from "@/services/social-auth";
import { withRetry } from "@/utils/retry";
import { transformProfileToUser } from "@/utils/transforms";
import { clearAllPersistedStores } from "@/utils/clear-stores";
import { markOnboardingComplete } from "@/utils/onboarding";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage,persist } from "zustand/middleware";

// Module-level auth subscription reference for proper cleanup
let _authSubscription: { unsubscribe: () => void } | null = null;

// Dev-only synthetic user used by "Explore without signing in".
const GUEST_USER_ID = "00000000-0000-0000-0000-000000000000";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  signIn: (data: SignInData) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (
    data: ResetPasswordData
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (
    data: UpdateProfileData
  ) => Promise<{ success: boolean; error?: string }>;
  setRole: (role: UserRole) => Promise<{ success: boolean; error?: string }>;
  /** Dev-only: open the app as a guest without a Supabase session. */
  continueAsGuest: () => Promise<void>;

  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginWithApple: () => Promise<{ success: boolean; error?: string }>;

  clearError: () => void;
  refreshUser: () => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: true,
      error: null,
      isInitialized: false,

      initialize: async () => {
        if (__DEV__) console.debug("Initializing auth store with Supabase...");
        try {
          // Clean up any existing subscription before creating a new one
          if (_authSubscription) {
            _authSubscription.unsubscribe();
            _authSubscription = null;
          }

          set({ loading: true });

          const sessionResult = await withRetry(
            () => supabase.auth.getSession(),
            { retries: 1, timeout: 10000 }
          );
          const { session } = sessionResult.data;

          if (session?.user) {
            const profileResult = await withRetry(
              () =>
                supabase
                  .from("profiles")
                  .select("*")
                  .eq("id", session.user.id)
                  .single(),
              { retries: 1, timeout: 10000 }
            );
            const profile = profileResult.data;

            // A session without a profile row (or a failed profile fetch) must
            // not leave the store stuck in the loading state forever.
            if (profile) {
              const user = transformProfileToUser(
                profile as Record<string, unknown>
              );
              const validatedUser = UserSchema.parse(user);
              set({ user: validatedUser });
            } else if (__DEV__ && profileResult.error) {
              console.warn("Failed to load profile during init:", profileResult.error);
            }
          }

          // Always resolve initialization — otherwise the app hangs on the
          // splash screen when a session exists but the profile is missing.
          set({ loading: false, isInitialized: true });

          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_OUT" || !session) {
              set({ user: null, isInitialized: true, loading: false });
            }
          });

          // Store the subscription for cleanup on subsequent initialize() calls or logout
          _authSubscription = subscription ?? null;
        } catch (error) {
          if (__DEV__) console.error("Auth store initialization error:", error);
          set({
            error: handleSupabaseError(error),
            loading: false,
            isInitialized: true,
          });
        }
      },

      signIn: async (data: SignInData) => {
        try {
          const validatedData = SignInSchema.parse(data);
          set({ loading: true, error: null });

          const { data: authData, error } =
            await supabase.auth.signInWithPassword({
              email: validatedData.email,
              password: validatedData.password,
            });

          if (error) {
            const errorMessage = handleSupabaseError(error);
            set({ error: errorMessage, loading: false });
            return { success: false, error: errorMessage };
          }

          if (authData.user) {
            const { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", authData.user.id)
              .single();

            if (profileError) {
              const errorMessage = handleSupabaseError(profileError);
              set({ error: errorMessage, loading: false });
              return { success: false, error: errorMessage };
            }

            if (profile) {
              const user = transformProfileToUser(
                profile as Record<string, unknown>
              );
              const validatedUser = UserSchema.parse(user);
              set({ user: validatedUser, loading: false });
              setSentryUser({ id: validatedUser.id, email: validatedUser.email });
              trackEvent(AnalyticsEvents.SIGN_IN, { method: "email" });
              return { success: true };
            }
          }

          set({ error: "Authentication failed", loading: false });
          return { success: false, error: "Authentication failed" };
        } catch (error) {
          const errorMessage = handleSupabaseError(error);
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },

      loginWithGoogle: async () => {
        set({ loading: true, error: null });
        try {
          const result = await signInWithGoogle();
          if (result.success) {
            const {
              data: { user: authUser },
            } = await supabase.auth.getUser();
            if (authUser) {
              const { data: profile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", authUser.id)
                .single();

              if (profile) {
                const userData = transformProfileToUser(
                  profile as Record<string, unknown>
                );
                const validatedUser = UserSchema.parse(userData);
                set({
                  user: validatedUser,
                  loading: false,
                  isInitialized: true,
                });
                setSentryUser({ id: validatedUser.id, email: validatedUser.email });
                trackEvent(AnalyticsEvents.SIGN_IN, { method: "google" });
                return { success: true };
              }
            }
          }
          set({ loading: false });
          return result;
        } catch (error) {
          const errorMessage = handleSupabaseError(error);
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },

      loginWithApple: async () => {
        set({ loading: true, error: null });
        try {
          const result = await signInWithApple();
          if (result.success) {
            const {
              data: { user: authUser },
            } = await supabase.auth.getUser();
            if (authUser) {
              const { data: profile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", authUser.id)
                .single();

              if (profile) {
                const userData = transformProfileToUser(
                  profile as Record<string, unknown>
                );
                const validatedUser = UserSchema.parse(userData);
                set({
                  user: validatedUser,
                  loading: false,
                  isInitialized: true,
                });
                setSentryUser({ id: validatedUser.id, email: validatedUser.email });
                trackEvent(AnalyticsEvents.SIGN_IN, { method: "apple" });
                return { success: true };
              }
            }
          }
          set({ loading: false });
          return result;
        } catch (error) {
          const errorMessage = handleSupabaseError(error);
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },

      signUp: async (data: SignUpData) => {
        try {
          const validatedData = SignUpSchema.parse(data);
          set({ loading: true, error: null });

          const { data: authData, error } = await supabase.auth.signUp({
            email: validatedData.email,
            password: validatedData.password,
            options: {
              data: {
                name: validatedData.name,
              },
            },
          });

          if (error) {
            const errorMessage = handleSupabaseError(error);
            set({ error: errorMessage, loading: false });
            return { success: false, error: errorMessage };
          }

          if (authData.user) {
            // When email confirmation is enabled, signUp returns a user object
            // but NO session. Treating the user as signed-in here would send
            // them into the app where every authenticated API call fails.
            if (!authData.session) {
              set({ loading: false });
              return {
                success: false,
                error:
                  "Account created! Please check your email and verify your account before signing in.",
              };
            }

            // Use upsert instead of insert to handle both cases:
            // 1. Email confirmation disabled — profile may already exist from a trigger
            // 2. Session present — we create/refresh the profile here
            const { error: profileError } = await supabase
              .from("profiles")
              .upsert(
                {
                  id: authData.user.id,
                  email: validatedData.email,
                  name: validatedData.name,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "id" }
              );

            if (profileError) {
              const errorMessage = handleSupabaseError(profileError);
              set({ error: errorMessage, loading: false });
              return { success: false, error: errorMessage };
            }

            const user: User = {
              id: authData.user.id,
              email: validatedData.email,
              name: validatedData.name,
              role: "couple",
            };

            const validatedUser = UserSchema.parse(user);
            set({ user: validatedUser, loading: false });
            trackEvent(AnalyticsEvents.SIGN_UP, { method: "email" });
            return { success: true };
          }

          set({ error: "Authentication failed", loading: false });
          return { success: false, error: "Authentication failed" };
        } catch (error) {
          const errorMessage = handleSupabaseError(error);
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },
      resetPassword: async (data: ResetPasswordData) => {
        try {
          const validatedData = ResetPasswordSchema.parse(data);
          set({ loading: true, error: null });

          const { error } = await supabase.auth.resetPasswordForEmail(
            validatedData.email
          );

          if (error) {
            const errorMessage = handleSupabaseError(error);
            set({ error: errorMessage, loading: false });
            return { success: false, error: errorMessage };
          }

          set({ loading: false });
          trackEvent(AnalyticsEvents.PASSWORD_RESET);
          return { success: true };
        } catch (error) {
          const errorMessage = handleSupabaseError(error);
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },
      logout: async () => {
        try {
          // Clean up auth subscription on logout
          if (_authSubscription) {
            _authSubscription.unsubscribe();
            _authSubscription = null;
          }

          set({ loading: true });
          const { error } = await supabase.auth.signOut();

          if (error) {
            if (__DEV__) console.error("Logout error:", error);
            set({ error: handleSupabaseError(error), loading: false });
          } else {
            set({ user: null, loading: false, error: null });
            // H4 fix: wipe every persisted user-scoped store so the next
            // account on this device cannot see the previous one's data.
            await clearAllPersistedStores();
            setSentryUser(null);
            trackEvent(AnalyticsEvents.SIGN_OUT);
          }
        } catch (error) {
          if (__DEV__) console.error("Logout error:", error);
          set({ error: handleSupabaseError(error), loading: false });
        }
      },
      updateProfile: async (data: UpdateProfileData) => {
        try {
          const validatedData = UpdateProfileSchema.parse(data);
          set({ loading: true, error: null });

          const currentUser = get().user;
          if (!currentUser) {
            set({ error: "No user logged in", loading: false });
            return { success: false, error: "No user logged in" };
          }

          const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
          };

          if (validatedData.name) updateData.name = validatedData.name;
          if (validatedData.weddingDate)
            updateData.wedding_date = validatedData.weddingDate;
          if (validatedData.partner) {
            updateData.partner_name = validatedData.partner.name;
            updateData.partner_email = validatedData.partner.email;
          }

          const { error } = await supabase
            .from("profiles")
            .update(updateData)
            .eq("id", currentUser.id);

          if (error) {
            const errorMessage = handleSupabaseError(error);
            set({ error: errorMessage, loading: false });
            return { success: false, error: errorMessage };
          }

          const updatedUser: User = {
            ...currentUser,
            ...(validatedData.name !== undefined && {
              name: validatedData.name,
            }),
            ...(validatedData.weddingDate !== undefined && {
              weddingDate: validatedData.weddingDate,
            }),
            ...(validatedData.partner !== undefined && {
              partner: validatedData.partner,
            }),
          };

          const validatedUser = UserSchema.parse(updatedUser);
          set({ user: validatedUser, loading: false });
          return { success: true };
        } catch (error) {
          const errorMessage = handleSupabaseError(error);
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },
      setRole: async (role: UserRole) => {
        try {
          const currentUser = get().user;
          if (!currentUser) {
            return { success: false, error: "No user logged in" };
          }
          set({ loading: true, error: null });

          const { error } = await supabase
            .from("profiles")
            .update({ role, updated_at: new Date().toISOString() })
            .eq("id", currentUser.id);

          if (error) {
            const errorMessage = handleSupabaseError(error);
            set({ error: errorMessage, loading: false });
            return { success: false, error: errorMessage };
          }

          const updatedUser = UserSchema.parse({ ...currentUser, role });
          set({ user: updatedUser, loading: false });
          return { success: true };
        } catch (error) {
          const errorMessage = handleSupabaseError(error);
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },
      continueAsGuest: async () => {
        await markOnboardingComplete(GUEST_USER_ID);
        const guest: User = {
          id: GUEST_USER_ID,
          email: "guest@shaadibazaar.local",
          name: "Guest",
          role: "couple",
        };
        set({
          user: UserSchema.parse(guest),
          loading: false,
          isInitialized: true,
          error: null,
        });
      },
      clearError: () => {
        set({ error: null });
      },
      refreshUser: async () => {
        try {
          const {
            data: { user },
            error,
          } = await supabase.auth.getUser();

          if (error || !user) {
            set({ user: null });
            return;
          }

          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (profileError || !profile) {
            if (__DEV__) console.error("Profile refresh error:", profileError);
            return;
          }

          const refreshedUser = transformProfileToUser(
            profile as Record<string, unknown>
          );
          const validatedUser = UserSchema.parse(refreshedUser);
          set({ user: validatedUser });
        } catch (error) {
          if (__DEV__) console.error("User refresh error:", error);
        }
      },
      changePassword: async (currentPassword: string, newPassword: string) => {
        try {
          set({ loading: true, error: null });

          const currentUser = get().user;
          if (!currentUser) {
            set({ error: "No user logged in", loading: false });
            return { success: false, error: "No user logged in" };
          }

          // Verify session is still valid
          const { data: { user: authUser }, error: sessionError } = await supabase.auth.getUser();
          if (sessionError || !authUser) {
            set({ error: "Session expired. Please sign in again.", loading: false });
            return { success: false, error: "Session expired. Please sign in again." };
          }

          // Require the current password — never allow a password change on
          // a hijacked/forgotten session alone.
          const { error: verifyError } = await supabase.auth.signInWithPassword({
            email: currentUser.email,
            password: currentPassword,
          });
          if (verifyError) {
            set({ error: "Current password is incorrect", loading: false });
            return { success: false, error: "Current password is incorrect" };
          }

          const { error } = await supabase.auth.updateUser({
            password: newPassword,
          });

          if (error) {
            const errorMessage = handleSupabaseError(error);
            set({ error: errorMessage, loading: false });
            return { success: false, error: errorMessage };
          }

          set({ loading: false });
          return { success: true };
        } catch (error) {
          const errorMessage = handleSupabaseError(error);
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },
      deleteAccount: async () => {
        try {
          set({ loading: true, error: null });

          const currentUser = get().user;
          if (!currentUser) {
            set({ error: "No user logged in", loading: false });
            return { success: false, error: "No user logged in" };
          }

          // Call server-side Edge Function to properly delete the auth user.
          const { error: deleteError } = await supabase.functions.invoke(
            "delete-user-account",
            { body: { user_id: currentUser.id } }
          );

          if (deleteError) {
            // Do NOT silently fall back to soft-delete — that re-introduces the
            // GDPR hole. Surface the failure so the user can retry.
            const errorMessage = "Account deletion failed. Please try again later or contact support.";
            if (__DEV__) console.warn("Edge Function delete failed:", deleteError);
            set({ error: errorMessage, loading: false });
            return { success: false, error: errorMessage };
          }

          const { error: signOutError } = await supabase.auth.signOut();

          if (signOutError) {
            const errorMessage = handleSupabaseError(signOutError);
            set({ error: errorMessage, loading: false });
            return { success: false, error: errorMessage };
          }

          set({ user: null, loading: false, error: null });
          await clearAllPersistedStores();
          setSentryUser(null);
          return { success: true };
        } catch (error) {
          const errorMessage = handleSupabaseError(error);
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isInitialized: state.isInitialized,
      }),
    }
  )
);
