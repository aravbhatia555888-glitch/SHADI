import { create } from "zustand";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

let _toastCounter = 0;
const _toastTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  showToast: (message: string, type: ToastType = "info", duration?: number) => {
    _toastCounter++;
    const id = `toast-${Date.now()}-${_toastCounter}`;
    const resolvedDuration =
      duration ?? (type === "error" ? 7000 : type === "warning" ? 5000 : 3000);
    const toast: Toast = { id, message, type, duration: resolvedDuration };

    set((state) => ({
      toasts: [...state.toasts, toast],
    }));

    // Auto-remove after duration
    if (resolvedDuration > 0) {
      const timer = setTimeout(() => {
        get().removeToast(id);
      }, resolvedDuration);
      _toastTimers.set(id, timer);
    }
  },

  removeToast: (id: string) => {
    const timer = _toastTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      _toastTimers.delete(id);
    }
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    _toastTimers.forEach((timer) => clearTimeout(timer));
    _toastTimers.clear();
    set({ toasts: [] });
  },
}));
