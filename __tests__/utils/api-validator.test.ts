import { z } from "zod";
import {
  validate,
  validateOrThrow,
  validateOrNull,
  validateArray,
  validateAll,
  formatZodErrors,
  firstZodError,
  validatePartial,
  validateStrict,
  isZodError,
  coerce,
} from "@/utils/api-validator";

const TestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.number().min(0, "Age must be positive"),
  email: z.string().email("Invalid email"),
});

const validData = { name: "Alice", age: 30, email: "alice@test.com" };

describe("api-validator", () => {
  // ─── validate ─────────────────────────────────────────────
  describe("validate", () => {
    it("returns success with parsed data for valid input", () => {
      const result = validate(TestSchema, validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
        expect(result.errors).toBeNull();
      }
    });

    it("returns failure with error messages for invalid input", () => {
      const result = validate(TestSchema, { name: "", age: -1, email: "bad" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.data).toBeNull();
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.some((e) => e.includes("Name is required"))).toBe(
          true,
        );
        expect(result.errors.some((e) => e.includes("Age must be positive"))).toBe(
          true,
        );
        expect(result.errors.some((e) => e.includes("Invalid email"))).toBe(
          true,
        );
      }
    });

    it("handles missing keys gracefully", () => {
      const result = validate(TestSchema, {});
      expect(result.success).toBe(false);
    });

    it("handles null / undefined input", () => {
      expect(validate(TestSchema, null).success).toBe(false);
      expect(validate(TestSchema, undefined).success).toBe(false);
    });
  });

  // ─── validateOrThrow ──────────────────────────────────────
  describe("validateOrThrow", () => {
    it("returns parsed data on success", () => {
      expect(validateOrThrow(TestSchema, validData)).toEqual(validData);
    });

    it("throws on invalid data", () => {
      expect(() =>
        validateOrThrow(TestSchema, { name: "" }),
      ).toThrow();
    });

    it("throws with a user-friendly message", () => {
      expect.assertions(1);
      try {
        validateOrThrow(TestSchema, { name: "" });
      } catch (e: any) {
        expect(e.message).toContain("Name is required");
      }
    });

    it("includes custom label in thrown message", () => {
      expect.assertions(1);
      try {
        validateOrThrow(TestSchema, { name: "" }, "SignUp");
      } catch (e: any) {
        expect(e.message).toContain("SignUp:");
      }
    });
  });

  // ─── validateOrNull ───────────────────────────────────────
  describe("validateOrNull", () => {
    it("returns parsed data on success", () => {
      expect(validateOrNull(TestSchema, validData)).toEqual(validData);
    });

    it("returns null on failure", () => {
      expect(validateOrNull(TestSchema, { name: "" })).toBeNull();
    });

    it("returns null on empty object", () => {
      expect(validateOrNull(TestSchema, {})).toBeNull();
    });
  });

  // ─── validateArray ────────────────────────────────────────
  describe("validateArray", () => {
    it("returns success when all items are valid", () => {
      const items = [
        validData,
        { name: "Bob", age: 25, email: "bob@test.com" },
      ];
      const result = validateArray(TestSchema, items);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it("returns partial success with per-item errors", () => {
      const items = [validData, { name: "", age: -1, email: "bad" }];
      const result = validateArray(TestSchema, items);
      expect(result.success).toBe(false);
      expect(result.data).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].index).toBe(1);
    });

    it("handles empty array", () => {
      const result = validateArray(TestSchema, []);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  // ─── validateAll ──────────────────────────────────────────
  describe("validateAll", () => {
    const UserSchema = z.object({ name: z.string().min(1) });
    const QuerySchema = z.object({ page: z.coerce.number().min(1) });

    it("validates multiple schemas independently", () => {
      const result = validateAll({
        user: { schema: UserSchema, data: { name: "Alice" } },
        query: { schema: QuerySchema, data: { page: 2 } },
      });

      expect(result.user.success).toBe(true);
      expect(result.query.success).toBe(true);
    });

    it("reports failures per schema", () => {
      const result = validateAll({
        user: { schema: UserSchema, data: { name: "" } },
        query: { schema: QuerySchema, data: { page: 0 } },
      });

      expect(result.user.success).toBe(false);
      expect(result.query.success).toBe(false);
    });

    it("handles mixed success/failure", () => {
      const result = validateAll({
        user: { schema: UserSchema, data: { name: "Alice" } },
        query: { schema: QuerySchema, data: { page: 0 } },
      });

      expect(result.user.success).toBe(true);
      expect(result.query.success).toBe(false);
    });
  });

  // ─── formatZodErrors ──────────────────────────────────────
  describe("formatZodErrors", () => {
    it("returns array of error messages", () => {
      const parsed = TestSchema.safeParse({ name: "", age: -1, email: "bad" });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        const messages = formatZodErrors(parsed.error);
        expect(Array.isArray(messages)).toBe(true);
        expect(messages.length).toBeGreaterThan(0);
      }
    });

    it("includes field path in messages", () => {
      const parsed = TestSchema.safeParse({ name: "", age: -1, email: "bad" });
      if (!parsed.success) {
        const messages = formatZodErrors(parsed.error);
        expect(messages.some((m) => m.includes("name:"))).toBe(true);
      }
    });

    it("handles empty error list", () => {
      // Construct a ZodError by parsing invalid data
      const parsed = z.string().min(1).safeParse("");
      if (!parsed.success) {
        const messages = formatZodErrors(parsed.error);
        expect(Array.isArray(messages)).toBe(true);
        expect(messages.length).toBeGreaterThan(0);
      }
    });
  });

  // ─── firstZodError ────────────────────────────────────────
  describe("firstZodError", () => {
    it("returns the first error message from a ZodError", () => {
      const parsed = TestSchema.safeParse({ name: "", age: -1, email: "bad" });
      if (!parsed.success) {
        const first = firstZodError(parsed.error);
        expect(typeof first).toBe("string");
        expect(first.length).toBeGreaterThan(0);
      }
    });
  });

  // ─── validatePartial ──────────────────────────────────────
  describe("validatePartial", () => {
    const PartialSchema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
    });

    it("validates a subset of fields successfully", () => {
      const result = validatePartial(PartialSchema, { name: "Alice" });
      expect(result.success).toBe(true);
    });

    it("still validates the fields that are present", () => {
      const result = validatePartial(PartialSchema, { email: "bad" });
      expect(result.success).toBe(false);
    });

    it("accepts empty object (all fields optional)", () => {
      const result = validatePartial(PartialSchema, {});
      expect(result.success).toBe(true);
    });
  });

  // ─── validateStrict ───────────────────────────────────────
  describe("validateStrict", () => {
    it("accepts valid data", () => {
      const result = validateStrict(TestSchema, validData);
      expect(result.success).toBe(true);
    });

    it("rejects invalid data", () => {
      const result = validateStrict(TestSchema, { name: "" });
      expect(result.success).toBe(false);
    });
  });

  // ─── isZodError ───────────────────────────────────────────
  describe("isZodError", () => {
    it("returns true for ZodError instances", () => {
      try {
        TestSchema.parse({ name: "" });
      } catch (e) {
        expect(isZodError(e)).toBe(true);
      }
    });

    it("returns false for regular Errors", () => {
      expect(isZodError(new Error("oops"))).toBe(false);
    });

    it("returns false for non-Errors", () => {
      expect(isZodError("string")).toBe(false);
      expect(isZodError(null)).toBe(false);
      expect(isZodError(undefined)).toBe(false);
    });
  });

  // ─── coerce ───────────────────────────────────────────────
  describe("coerce", () => {
    it("returns parsed data on success", () => {
      const result = coerce(z.coerce.number(), "42", 0);
      expect(result).toBe(42); // Zod coerce transforms string "42" to number 42
    });

    it("returns fallback on failure", () => {
      const result = coerce(z.number(), "not-a-number", -1);
      expect(result).toBe(-1);
    });

    it("returns fallback for undefined/null", () => {
      expect(coerce(z.string(), undefined, "default")).toBe("default");
      expect(coerce(z.string(), null, "default")).toBe("default");
    });
  });
});
