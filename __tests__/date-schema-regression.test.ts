/**
 * Regression tests for production-blocking bugs:
 *  1. Date fields must accept BOTH "YYYY-MM-DD" (UI date pickers) and full
 *     ISO-8601 datetimes (Supabase TIMESTAMPTZ columns). Previously the
 *     schemas required strict datetimes, so saving/loading budget expenses,
 *     wedding details and checklist items failed at runtime.
 *  2. Sign-in validation must not reject valid 6-char passwords.
 *  3. transformProfileToUser must carry the profile image URL.
 */

import {
  BudgetExpenseSchema,
  ChecklistItemSchema,
  VendorBookingSchema,
  VendorInquirySchema,
  WeddingDetailsSchema,
} from "@/schemas/wedding";
import { SignInSchema } from "@/schemas/auth";
import { transformProfileToUser } from "@/utils/transforms";

describe("Date schema regression", () => {
  const dateOnly = "2025-06-15";
  const fullIso = "2025-06-15T00:00:00.000Z";

  it("BudgetExpenseSchema accepts date-only and full ISO dates", () => {
    const base = {
      id: "e1",
      name: "Venue deposit",
      amount: 50000,
      paid: false,
    };
    expect(BudgetExpenseSchema.safeParse({ ...base, date: dateOnly }).success).toBe(true);
    expect(BudgetExpenseSchema.safeParse({ ...base, date: fullIso }).success).toBe(true);
  });

  it("ChecklistItemSchema accepts date-only and full ISO due dates", () => {
    const base = {
      id: "c1",
      title: "Book venue",
      description: "Find and book",
      category: "Venue",
      completed: false,
      priority: "high" as const,
    };
    expect(ChecklistItemSchema.safeParse({ ...base, dueDate: dateOnly }).success).toBe(true);
    expect(ChecklistItemSchema.safeParse({ ...base, dueDate: fullIso }).success).toBe(true);
  });

  it("WeddingDetailsSchema accepts date-only and full ISO wedding dates", () => {
    const base = {
      coupleName: "A & B",
      weddingLocation: "Mumbai",
      totalBudget: 500000,
    };
    expect(WeddingDetailsSchema.safeParse({ ...base, weddingDate: dateOnly }).success).toBe(true);
    expect(WeddingDetailsSchema.safeParse({ ...base, weddingDate: fullIso }).success).toBe(true);
  });

  it("VendorBookingSchema accepts date-only and full ISO dates", () => {
    const base = {
      id: "b1",
      vendorId: "v1",
      userId: "u1",
      eventType: "Wedding",
      totalAmount: 100000,
      status: "pending" as const,
      paymentStatus: "pending" as const,
      createdAt: fullIso,
    };
    expect(VendorBookingSchema.safeParse({ ...base, eventDate: dateOnly, bookingDate: dateOnly }).success).toBe(true);
    expect(VendorBookingSchema.safeParse({ ...base, eventDate: fullIso, bookingDate: fullIso }).success).toBe(true);
  });

  it("VendorInquirySchema accepts date-only and full ISO event dates", () => {
    const base = {
      id: "i1",
      vendorId: "v1",
      userId: "u1",
      userName: "Jane",
      userEmail: "jane@example.com",
      subject: "Quote",
      message: "Hello",
      status: "new" as const,
      createdAt: fullIso,
    };
    expect(VendorInquirySchema.safeParse({ ...base, eventDate: dateOnly }).success).toBe(true);
    expect(VendorInquirySchema.safeParse({ ...base, eventDate: fullIso }).success).toBe(true);
  });
});

describe("Sign-in schema regression", () => {
  it("accepts a 6-character password (server is the authority)", () => {
    const result = SignInSchema.safeParse({
      email: "jane@example.com",
      password: "abcdef",
    });
    expect(result.success).toBe(true);
  });
});

describe("Profile image transform regression", () => {
  it("maps profile_image_url onto the user object", () => {
    const user = transformProfileToUser({
      id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      email: "jane@example.com",
      name: "Jane",
      profile_image_url: "https://example.com/avatar.jpg",
    });
    expect(user.profileImageUrl).toBe("https://example.com/avatar.jpg");
  });
});
