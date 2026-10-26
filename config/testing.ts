/**
 * Testing Configuration
 *
 * Set TESTING_MODE to true to bypass all Supabase calls and use local/mock data only.
 * This allows immediate testing without setting up Supabase.
 */

export const TESTING_MODE = false;

/**
 * Mock user for testing purposes
 */
export const MOCK_USER = {
  id: "demo-user-123",
  email: "demo@shaadibazaar.com",
  name: "Demo User",
};

/**
 * Testing mode configuration
 */
export const TESTING_CONFIG = {
  // Skip authentication checks
  skipAuth: true,

  // Use local storage only (no cloud uploads)
  useLocalStorage: true,

  // Show console logs for debugging
  enableLogs: true,

  // Simulate network delays (in ms)
  simulateDelay: 500,
};

/**
 * Helper function to simulate async operations in testing mode
 */
export const simulateAsync = async <T>(
  result: T,
  delay: number = TESTING_CONFIG.simulateDelay
): Promise<T> => {
  if (TESTING_MODE && delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  return result;
};

/**
 * Log function for testing mode
 */
export const testingLog = (message: string, ...args: unknown[]) => {
  if (TESTING_MODE && TESTING_CONFIG.enableLogs) {
    console.debug(`[TESTING MODE] ${message}`, ...args);
  }
};
