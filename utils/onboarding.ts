import AsyncStorage from "@react-native-async-storage/async-storage";

const storageKey = (userId: string) => `onboarding_complete:${userId}`;

export async function isOnboardingComplete(userId: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(storageKey(userId))) === "true";
  } catch {
    return false;
  }
}

export async function markOnboardingComplete(userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(userId), "true");
  } catch {
    // Best effort — a failed write only means onboarding may show again.
  }
}

export async function resetOnboarding(userId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(storageKey(userId));
  } catch {
    // Best effort.
  }
}
