/**
 * @jest-environment node
 *
 * We use node environment because Zustand's create is synchronous
 * and we don't need React Native rendering for store tests.
 */

import { useToastStore } from "@/stores/toast-store";

/**
 * Reset the module-level _toastCounter by importing the module fresh.
 * We store a reference so we can re-import before each test.
 */
function resetStore() {
  useToastStore.getState().clearToasts();
}

describe("useToastStore", () => {
  beforeEach(() => {
    resetStore();
  });

  afterEach(() => {
    resetStore();
  });

  it("starts with an empty toasts array", () => {
    const { toasts } = useToastStore.getState();
    expect(toasts).toEqual([]);
  });

  it("adds a toast with showToast", () => {
    const { showToast } = useToastStore.getState();
    showToast("Hello!");

    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe("Hello!");
    expect(toasts[0].type).toBe("info");
    expect(toasts[0].duration).toBe(3000);
    expect(toasts[0].id).toMatch(/^toast-/);
  });

  it("adds a toast with custom type and duration", () => {
    const { showToast } = useToastStore.getState();
    showToast("Warning!", "warning", 5000);

    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe("Warning!");
    expect(toasts[0].type).toBe("warning");
    expect(toasts[0].duration).toBe(5000);
  });

  it("removes a toast by id with removeToast", () => {
    const { showToast, removeToast } = useToastStore.getState();
    showToast("Toast 1");
    showToast("Toast 2");

    const { toasts } = useToastStore.getState();
    const idToRemove = toasts[0].id;

    removeToast(idToRemove);

    const { toasts: remaining } = useToastStore.getState();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].message).toBe("Toast 2");
  });

  it("clears all toasts with clearToasts", () => {
    const { showToast, clearToasts } = useToastStore.getState();
    showToast("Toast 1");
    showToast("Toast 2");
    showToast("Toast 3");

    expect(useToastStore.getState().toasts).toHaveLength(3);

    clearToasts();

    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it("auto-removes a toast after its duration elapses", (done) => {
    useToastStore.getState().showToast("Auto-remove test", "success", 50);

    expect(useToastStore.getState().toasts).toHaveLength(1);

    setTimeout(() => {
      expect(useToastStore.getState().toasts).toHaveLength(0);
      done();
    }, 100);
  });

  it("does not auto-remove when duration is 0", (done) => {
    useToastStore.getState().showToast("Persistent", "info", 0);

    expect(useToastStore.getState().toasts).toHaveLength(1);

    setTimeout(() => {
      expect(useToastStore.getState().toasts).toHaveLength(1);
      done();
    }, 50);
  });

  it("generates unique IDs for rapid calls", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 10; i++) {
      useToastStore.getState().showToast(`Toast ${i}`);
    }

    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(10);

    toasts.forEach((t) => {
      expect(ids.has(t.id)).toBe(false);
      ids.add(t.id);
    });
    expect(ids.size).toBe(10);
  });

  it("stacks multiple toasts", () => {
    const { showToast } = useToastStore.getState();
    showToast("First");
    showToast("Second");
    showToast("Third");

    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(3);
    expect(toasts[0].message).toBe("First");
    expect(toasts[1].message).toBe("Second");
    expect(toasts[2].message).toBe("Third");
  });
});
