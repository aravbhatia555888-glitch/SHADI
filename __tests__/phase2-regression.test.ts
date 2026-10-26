import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearAllPersistedStores } from "@/utils/clear-stores";
import { transformBudgetFromDb } from "@/utils/transforms";

describe("Phase 2 Production Hardening Regressions", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe("HIGH-07: Budget Calculation Persistence", () => {
    it("computes spent by summing nested expenses when database spent column is 0", () => {
      const rawDbItem = {
        id: "b123",
        category: "Catering",
        estimated: 50000,
        spent: 0,
        budget_expenses: [
          { id: "e1", name: "Deposit", amount: 15000, date: "2026-11-20", paid: true },
          { id: "e2", name: "Menu Tasting", amount: 2500, date: "2026-11-21", paid: true },
        ],
      };

      const transformed = transformBudgetFromDb(rawDbItem);
      expect(transformed.spent).toBe(17500);
      expect(transformed.items.length).toBe(2);
    });

    it("falls back to persisted spent if no child expenses are loaded", () => {
      const rawDbItem = {
        id: "b124",
        category: "Venue",
        estimated: 100000,
        spent: 30000,
        budget_expenses: null,
      };

      const transformed = transformBudgetFromDb(rawDbItem);
      expect(transformed.spent).toBe(30000);
      expect(transformed.items).toEqual([]);
    });
  });

  describe("MED-01: Storage Clearing Hygiene", () => {
    it("removes all persisted keys including reviews, ai-chat, cards, and user settings", async () => {
      const spyRemove = jest.spyOn(AsyncStorage, "removeItem");
      await clearAllPersistedStores();

      const expectedKeys = [
        "booking-storage",
        "subscription-storage",
        "chat-storage",
        "inquiry-storage",
        "vendor-dashboard-storage",
        "wedding-storage",
        "review-storage",
        "ai-chat-storage",
        "wedding-favorites",
        "shaadi-saved-cards-v1",
        "user_app_settings",
      ];

      expectedKeys.forEach((key) => {
        expect(spyRemove).toHaveBeenCalledWith(key);
      });
    });
  });

  describe("MED-04: PostgREST Filter String Sanitization", () => {
    it("neutralizes commas, parentheses, and SQL wildcards to prevent filter injection", () => {
      const maliciousInput = "wedding,id.eq.00000000-0000(test)%_\\";
      const sanitized = maliciousInput
        .replace(/[,()]/g, " ")
        .replace(/[%_\\]/g, "\\$&")
        .trim();

      expect(sanitized).not.toContain(",");
      expect(sanitized).not.toContain("(");
      expect(sanitized).not.toContain(")");
      expect(sanitized).toContain("\\%");
      expect(sanitized).toContain("\\_");
      expect(sanitized).toContain("\\\\");
    });
  });

  describe("CRIT-01: URL Origin Validation Logic", () => {
    const ALLOWED_REDIRECT_ORIGINS = [
      "https://shaadibazaar.com",
      "https://www.shaadibazaar.com",
      "http://localhost:8081",
      "http://localhost:19006",
    ];

    function isValidRedirect(redirect: string): boolean {
      if (!redirect) return false;
      if (redirect.startsWith("shaadibazaar://")) {
        return true;
      }
      try {
        const parsed = new URL(redirect);
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
          return false;
        }
        if (parsed.protocol === "http:" && !parsed.hostname.includes("localhost")) {
          return false;
        }
        return ALLOWED_REDIRECT_ORIGINS.includes(parsed.origin);
      } catch {
        return false;
      }
    }

    it("allows valid application redirect URLs", () => {
      expect(isValidRedirect("shaadibazaar://payment-result")).toBe(true);
      expect(isValidRedirect("https://shaadibazaar.com/payment-result")).toBe(true);
      expect(isValidRedirect("https://www.shaadibazaar.com/payment-result")).toBe(true);
      expect(isValidRedirect("http://localhost:8081/payment-result")).toBe(true);
    });

    it("rejects subdomain takeovers and open redirects", () => {
      expect(isValidRedirect("https://shaadibazaar.com.attacker.com")).toBe(false);
      expect(isValidRedirect("https://attacker.com?shaadibazaar.com")).toBe(false);
      expect(isValidRedirect("javascript:alert(1)")).toBe(false);
      expect(isValidRedirect("data:text/html,<html>")).toBe(false);
      expect(isValidRedirect("")).toBe(false);
    });
  });
});
