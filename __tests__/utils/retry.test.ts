import { withRetry } from "@/utils/retry";

describe("withRetry", () => {
  // Use real timers — the retry delays are short (1-3s total) and
  // fake timers interact poorly with AbortController + Promise.race.

  const originalMathRandom = Math.random;

  afterEach(() => {
    Math.random = originalMathRandom;
  });

  it("resolves with the result on first success", async () => {
    const fn = jest.fn(() => Promise.resolve("ok"));

    const result = await withRetry(fn);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  }, 10000);

  it("retries on failure and eventually succeeds", async () => {
    // Fail twice, succeed on third attempt
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error("fail1"))
      .mockRejectedValueOnce(new Error("fail2"))
      .mockResolvedValueOnce("recovered");

    const result = await withRetry(fn, { retries: 3 });
    expect(result).toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(3);
  }, 15000);

  it("throws after all retries are exhausted", async () => {
    const error = new Error("persistent failure");
    const fn = jest.fn(() => Promise.reject(error));

    await expect(withRetry(fn, { retries: 2 })).rejects.toThrow(
      "persistent failure"
    );
    expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  }, 15000);

  it("calls onRetry callback with attempt index and error", async () => {
    Math.random = () => 0; // Eliminate jitter for predictable timing

    const onRetry = jest.fn();
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error("attempt1"))
      .mockRejectedValueOnce(new Error("attempt2"))
      .mockResolvedValueOnce("ok");

    await withRetry(fn, { retries: 2, onRetry });
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenNthCalledWith(1, 0, new Error("attempt1"));
    expect(onRetry).toHaveBeenNthCalledWith(2, 1, new Error("attempt2"));
  }, 15000);

  it("applies custom retries count", async () => {
    const fn = jest.fn(() => Promise.reject(new Error("fail")));

    await expect(withRetry(fn, { retries: 3 })).rejects.toThrow("fail");
    expect(fn).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
  }, 20000);

  it("handles a function that returns a thenable (PromiseLike)", async () => {
    // Promise implements PromiseLike, so this covers the thenable path
    const fn = jest.fn(() => Promise.resolve("thenable-result"));

    const result = await withRetry(fn);
    expect(result).toBe("thenable-result");
    expect(fn).toHaveBeenCalledTimes(1);
  }, 10000);

  it("uses default retries of 2 when not specified", async () => {
    const fn = jest.fn(() => Promise.reject(new Error("fail")));

    await expect(withRetry(fn)).rejects.toThrow("fail");
    expect(fn).toHaveBeenCalledTimes(3); // default is 2 retries = 3 total attempts
  }, 15000);

  it("succeeds immediately when function resolves with null", async () => {
    const fn = jest.fn(() => Promise.resolve(null));

    const result = await withRetry(fn);
    expect(result).toBeNull();
    expect(fn).toHaveBeenCalledTimes(1);
  }, 10000);
});
