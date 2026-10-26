/**
 * Retry utility with exponential backoff, jitter, and configurable timeout.
 *
 * Usage:
 *   const data = await withRetry(() => supabase.from("vendors").select("*"));
 *
 *   const data = await withRetry(() => fetch(url), {
 *     retries: 3,
 *     timeout: 10000,
 *     onRetry: (attempt, error) => console.warn(`Retry ${attempt}:`, error),
 *   });
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 2) */
  retries?: number;
  /** Timeout in ms for each attempt (default: 15000) */
  timeout?: number;
  /** Called before each retry with the attempt number (0-indexed) and error */
  onRetry?: (attempt: number, error: unknown) => void;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Wraps an async function with exponential backoff retry logic.
 * Throws if all retries are exhausted or if the timeout fires.
 */
export async function withRetry<T>(
  fn: () => PromiseLike<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { retries = 2, timeout = 15_000, onRetry } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    // Run with timeout via AbortController + race
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener("abort", () => {
            reject(new Error(`Request timed out after ${timeout}ms`));
          });
        }),
      ]);
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;

      // Don't retry aborted/timeout errors if it's the last attempt
      if (attempt < retries) {
        if (onRetry) onRetry(attempt, error);
        // Exponential backoff with jitter: 1s, 2s, 4s, ...
        const delay = Math.min(1000 * Math.pow(2, attempt), 10_000);
        const jitter = Math.random() * 500;
        await sleep(delay + jitter);
      }
    }
  }

  throw lastError;
}

/**
 * Helper to create a timeout promise for Promise.race.
 * Rejects after `ms` milliseconds.
 */
export function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
  });
}
