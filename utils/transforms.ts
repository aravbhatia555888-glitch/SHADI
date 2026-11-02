import type { User } from "@/schemas/auth";
import type {
Vendor,
VendorBooking,
VendorInquiry,
VendorReview,
} from "@/schemas/wedding";

interface VendorDbRow {
  id: string;
  name: string;
  category: string;
  description: string;
  location: unknown;
  rating: number;
  review_count: number;
  price_range: string;
  min_price?: number;
  max_price?: number;
  cover_image: string;
  photos?: string[];
  completed_bookings?: number;
  gallery?: string[];
  contact: unknown;
  features?: unknown[];
  services?: unknown[];
  packages?: unknown[];
  availability?: unknown[];
  is_available?: boolean;
  featured?: boolean;
  verified?: boolean;
  business_hours?: unknown;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export function transformVendorFromDb(v: VendorDbRow): Vendor {
  return {
    id: v.id,
    name: v.name,
    category: v.category,
    description: v.description,
    location: v.location as Vendor["location"],
    rating: v.rating ?? 0,
    reviewCount: v.review_count ?? 0,
    priceRange: v.price_range,
    minPrice: v.min_price ?? 0,
    maxPrice: v.max_price ?? 0,
    coverImage: v.cover_image,
    photos: Array.isArray(v.photos) ? v.photos : [],
    completedBookings: v.completed_bookings ?? 0,
    gallery: Array.isArray(v.gallery) ? v.gallery : [],
    contact: v.contact as Vendor["contact"],
    features: Array.isArray(v.features)
      ? (v.features as Vendor["features"])
      : [],
    services: Array.isArray(v.services)
      ? (v.services as Vendor["services"])
      : [],
    packages: Array.isArray(v.packages)
      ? (v.packages as Vendor["packages"])
      : [],
    availability: Array.isArray(v.availability)
      ? (v.availability as Vendor["availability"])
      : [],
    isAvailable: v.is_available ?? true,
    featured: v.featured ?? false,
    verified: v.verified ?? false,
    businessHours: v.business_hours as Vendor["businessHours"],
    userId: v.user_id,
    createdAt: v.created_at,
    updatedAt: v.updated_at,
  };
}

export function transformReviewFromDb(
  r: Record<string, unknown>
): VendorReview {
  return {
    id: r.id as string,
    vendorId: r.vendor_id as string,
    userId: r.user_id as string,
    userName: r.user_name as string,
    rating: r.rating as number,
    comment: r.comment as string,
    photos: Array.isArray(r.photos) ? (r.photos as string[]) : [],
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export function transformBookingFromDb(
  b: Record<string, unknown>
): VendorBooking {
  return {
    id: b.id as string,
    vendorId: b.vendor_id as string,
    userId: b.user_id as string,
    eventDate: b.event_date as string,
    eventType: b.event_type as string,
    packageId: b.package_id as string | undefined,
    customRequirements: b.custom_requirements as string | undefined,
    totalAmount: b.total_amount as number,
    advanceAmount: b.advance_amount as number | undefined,
    status: b.status as VendorBooking["status"],
    paymentStatus: b.payment_status as VendorBooking["paymentStatus"],
    contactName: b.contact_name as string | undefined,
    contactPhone: b.contact_phone as string | undefined,
    contactEmail: b.contact_email as string | undefined,
    bookingDate: b.booking_date as string,
    notes: b.notes as string | undefined,
    createdAt: b.created_at as string,
    updatedAt: b.updated_at as string,
  };
}

export function transformInquiryFromDb(
  i: Record<string, unknown>
): VendorInquiry {
  return {
    id: i.id as string,
    vendorId: i.vendor_id as string,
    userId: i.user_id as string,
    userName: i.user_name as string,
    userEmail: i.user_email as string,
    userPhone: i.user_phone as string | undefined,
    subject: i.subject as string,
    message: i.message as string,
    eventDate: i.event_date as string | undefined,
    eventType: i.event_type as string | undefined,
    budget: i.budget as number | undefined,
    status: i.status as VendorInquiry["status"],
    vendorResponse: i.vendor_response as string | undefined,
    responseDate: i.response_date as string | undefined,
    createdAt: i.created_at as string,
    updatedAt: i.updated_at as string,
  };
}

export function transformProfileToUser(profile: Record<string, unknown>): User {
  return {
    id: profile.id as string,
    email: profile.email as string,
    name: profile.name as string,
    role: (profile.role as User["role"]) ?? "couple",
    weddingDate: (profile.wedding_date as string) || undefined,
    profileImageUrl: (profile.profile_image_url as string) || undefined,
    partner:
      profile.partner_name && profile.partner_email
        ? {
            name: profile.partner_name as string,
            email: profile.partner_email as string,
          }
        : undefined,
  };
}

export function transformChecklistFromDb(item: Record<string, unknown>) {
  return {
    id: item.id as string,
    title: item.title as string,
    description: item.description as string,
    category: item.category as string,
    dueDate: item.due_date as string,
    completed: item.completed as boolean,
    priority: item.priority as "high" | "medium" | "low",
  };
}

export function transformBudgetFromDb(item: Record<string, unknown>) {
  const items = Array.isArray(item.budget_expenses)
    ? (item.budget_expenses as Record<string, unknown>[]).map((expense) => ({
        id: expense.id as string,
        name: expense.name as string,
        amount: Number(expense.amount) || 0,
        date: expense.date as string,
        paid: expense.paid as boolean,
        vendor: expense.vendor as string | undefined,
        notes: expense.notes as string | undefined,
      }))
    : [];

  const computedSpent = items.reduce((sum, exp) => sum + exp.amount, 0);
  const rawSpent = Number(item.spent) || 0;
  const spent = items.length > 0 ? computedSpent : rawSpent;

  return {
    id: item.id as string,
    category: item.category as string,
    estimated: Number(item.estimated) || 0,
    spent,
    items,
  };
}
