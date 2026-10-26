import { z } from "zod";

// Dates appear in two formats across the codebase:
//  - "YYYY-MM-DD"  — produced by the app's date pickers / user input
//  - full ISO 8601 — returned by Supabase TIMESTAMPTZ columns
// Validation must accept both, otherwise saved data fails to load (and
// valid user input is rejected before it ever reaches the database).
export const DateStringSchema = z.union([
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (use YYYY-MM-DD)"),
  z.string().datetime("Invalid date"),
]);

// VendorContact: phone/email default to empty string if not provided.
// Using `z.string().default("")` (without `.optional()`) ensures the
// inferred output type is `string` (not `string | undefined`), which
// matches the rest of the codebase expectations.
export const VendorContactSchema = z.object({
  phone: z.string().default(""),
  email: z.string().default(""),
  website: z.string().optional(),
  instagram: z.string().optional(),
});

export const VendorFeatureSchema = z.union([
  z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
  }),
  z.string(),
]);

export const VendorServiceSchema = z.union([
  z.object({
    id: z.string(),
    title: z.string(),
    included: z.boolean().optional(),
  }),
  z.string(),
]);

export const VendorPackageSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  title: z.string().optional(),
  price: z.union([z.string(), z.number()]).optional(),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  items: z.array(z.string()).optional(),
});

// Enhanced location schema with geolocation
export const VendorLocationSchema = z.union([
  z.object({
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    pincode: z.string().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  }),
  z.string(),
]);

// Vendor availability schema
export const VendorAvailabilitySchema = z.object({
  date: z.string(),
  isAvailable: z.boolean().optional(),
  timeSlots: z
    .array(
      z.object({
        startTime: z.string(),
        endTime: z.string(),
        isBooked: z.boolean().optional(),
      })
    )
    .optional(),
});

// Enhanced vendor review schema
export const ReviewSchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  userId: z.string(),
  rating: z.number().min(1).max(5),
  title: z.string().max(100, "Title must be 100 characters or less").optional(),
  content: z
    .string()
    .min(10, "Review must be at least 10 characters")
    .max(500, "Review must be 500 characters or less"),
  helpful: z.number().default(0),
  edited: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),

  // Computed fields
  userInitials: z.string().optional(),
  timeAgo: z.string().optional(),
});

// Review input schema for form validation
export const ReviewInputSchema = z.object({
  rating: z.number().min(1, "Rating is required").max(5),
  title: z.string().max(100, "Title must be 100 characters or less").optional(),
  content: z
    .string()
    .min(10, "Review must be at least 10 characters")
    .max(500, "Review must be 500 characters or less"),
  vendorId: z.string().min(1, "Vendor ID is required"),
});

// Rating distribution schema
export const RatingDistributionSchema = z.object({
  1: z.number().min(0).default(0),
  2: z.number().min(0).default(0),
  3: z.number().min(0).default(0),
  4: z.number().min(0).default(0),
  5: z.number().min(0).default(0),
  total: z.number().min(0).default(0),
  average: z.number().min(0).max(5).default(0),
});

// Review vote schema for helpful voting
export const ReviewVoteSchema = z.object({
  id: z.string(),
  reviewId: z.string(),
  userId: z.string(),
  helpful: z.boolean(),
  createdAt: z.string().datetime(),
});

// Legacy vendor review schema (for backward compatibility)
export const VendorReviewSchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  userId: z.string(),
  userName: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(1, "Review comment is required"),
  photos: z.array(z.string()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
});

// Enhanced vendor schema
export const VendorSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Vendor name is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  location: VendorLocationSchema,
  rating: z.number().min(0).max(5),
  reviewCount: z.number().min(0),
  ratingDistribution: RatingDistributionSchema.optional(),
  priceRange: z.string().min(1, "Price range is required"),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  coverImage: z.string(),
  photos: z.array(z.string()),
  completedBookings: z.number().min(0),
  gallery: z.array(z.string()),
  contact: VendorContactSchema,
  features: z.array(VendorFeatureSchema),
  services: z.array(VendorServiceSchema),
  packages: z.array(VendorPackageSchema),
  availability: z.array(VendorAvailabilitySchema).optional(),
  isAvailable: z.boolean(),
  featured: z.boolean(),
  verified: z.boolean().optional(),
  businessHours: z
    .object({
      monday: z.string().optional(),
      tuesday: z.string().optional(),
      wednesday: z.string().optional(),
      thursday: z.string().optional(),
      friday: z.string().optional(),
      saturday: z.string().optional(),
      sunday: z.string().optional(),
    })
    .optional(),
  userId: z.string().uuid().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

// Checklist schemas
export const ChecklistItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  dueDate: DateStringSchema,
  completed: z.boolean(),
  priority: z.enum(["high", "medium", "low"]),
  userId: z.string().uuid().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const ChecklistCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Category name is required"),
  items: z.array(ChecklistItemSchema),
});

// Budget schemas
export const BudgetExpenseSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Expense name is required"),
  amount: z.number().min(0, "Amount must be positive"),
  date: DateStringSchema,
  paid: z.boolean(),
  vendor: z.string().optional(),
  notes: z.string().optional(),
  userId: z.string().uuid().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const BudgetItemSchema = z.object({
  id: z.string(),
  category: z.string().min(1, "Category name is required"),
  estimated: z.number().min(0, "Estimated amount must be positive"),
  spent: z.number().min(0, "Spent amount must be positive"),
  items: z.array(BudgetExpenseSchema),
  userId: z.string().uuid().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

// Wedding details schema
export const WeddingDetailsSchema = z.object({
  id: z.string().uuid().optional(),
  coupleName: z.string().min(1, "Couple name is required"),
  weddingDate: DateStringSchema,
  weddingLocation: z.string().min(1, "Wedding location is required"),
  totalBudget: z.number().min(0, "Budget must be positive"),
  culture: z.string().optional(),
  profileImageUrl: z.string().url("Invalid profile image URL").optional(),
  userId: z.string().uuid().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

// Vendor booking schema
export const VendorBookingSchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  userId: z.string(),
  eventDate: DateStringSchema,
  eventType: z.string().min(1, "Event type is required"),
  packageId: z.string().optional(),
  customRequirements: z.string().optional(),
  totalAmount: z.number().min(0),
  advanceAmount: z.number().min(0).optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
  paymentStatus: z.enum(["pending", "partial", "paid", "refunded"]),
  bookingDate: DateStringSchema,
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
});

// Vendor inquiry/message schema
export const VendorInquirySchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  userId: z.string(),
  userName: z.string(),
  userEmail: z.string().email(),
  userPhone: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
  eventDate: DateStringSchema.optional(),
  eventType: z.string().optional(),
  budget: z.number().min(0).optional(),
  status: z.enum(["new", "read", "replied", "closed"]),
  vendorResponse: z.string().optional(),
  responseDate: DateStringSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
});

// Vendor search filters schema
export const VendorSearchFiltersSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  location: z
    .object({
      city: z.string().optional(),
      state: z.string().optional(),
      radius: z.number().min(0).max(100).optional(), // in km
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    .optional(),
  priceRange: z
    .object({
      min: z.number().min(0).optional(),
      max: z.number().min(0).optional(),
    })
    .optional(),
  rating: z.number().min(0).max(5).optional(),
  availability: z
    .object({
      date: z.string().datetime().optional(),
      isAvailable: z.boolean().optional(),
    })
    .optional(),
  features: z.array(z.string()).optional(),
  verified: z.boolean().optional(),
  sortBy: z
    .enum(["rating", "price", "distance", "popularity", "newest"])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

// Type exports
export type Vendor = z.infer<typeof VendorSchema>;
export type VendorLocation = z.infer<typeof VendorLocationSchema>;
export type VendorAvailability = z.infer<typeof VendorAvailabilitySchema>;
export type VendorReview = z.infer<typeof VendorReviewSchema>;
export type VendorBooking = z.infer<typeof VendorBookingSchema>;
export type VendorInquiry = z.infer<typeof VendorInquirySchema>;
export type VendorSearchFilters = z.infer<typeof VendorSearchFiltersSchema>;
export type VendorContact = z.infer<typeof VendorContactSchema>;
export type VendorFeature = z.infer<typeof VendorFeatureSchema>;
export type VendorService = z.infer<typeof VendorServiceSchema>;
export type VendorPackage = z.infer<typeof VendorPackageSchema>;
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;
export type ChecklistCategory = z.infer<typeof ChecklistCategorySchema>;
export type BudgetExpense = z.infer<typeof BudgetExpenseSchema>;
export type BudgetItem = z.infer<typeof BudgetItemSchema>;
export type WeddingDetails = z.infer<typeof WeddingDetailsSchema>;

// Article schemas for wedding inspiration
export const ArticleAuthorSchema = z.object({
  name: z.string().min(1, "Author name is required"),
  avatar: z.string().url("Invalid avatar URL").optional(),
});

export const ArticleSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Article title is required"),
  description: z.string().min(1, "Article description is required"),
  content: z.string().min(1, "Article content is required"),
  image: z.string().url("Invalid image URL"),
  category: z.string().min(1, "Category is required"),
  readTime: z.string().min(1, "Read time is required"),
  author: ArticleAuthorSchema,
  publishDate: z.string().datetime("Invalid publish date"),
  tags: z.array(z.string()),
  isFavorite: z.boolean().default(false),
  isBookmarked: z.boolean().default(false),
  viewCount: z.number().min(0).default(0),
  shareCount: z.number().min(0).default(0),
  relatedArticleIds: z.array(z.string()),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const SearchFilterStateSchema = z.object({
  query: z.string().default(""),
  category: z.string().default("All"),
  sortBy: z.enum(["newest", "popular", "trending"]).default("newest"),
  tags: z.array(z.string()).default([]),
});

export const ReadingProgressStateSchema = z.object({
  articleId: z.string(),
  progress: z.number().min(0).max(100).default(0),
  lastReadPosition: z.number().min(0).default(0),
  timeSpent: z.number().min(0).default(0),
});

// New review-related types
export type Review = z.infer<typeof ReviewSchema>;
export type ReviewInput = z.infer<typeof ReviewInputSchema>;
export type RatingDistribution = z.infer<typeof RatingDistributionSchema>;
export type ReviewVote = z.infer<typeof ReviewVoteSchema>;

// Article-related types
export type Article = z.infer<typeof ArticleSchema>;
export type ArticleAuthor = z.infer<typeof ArticleAuthorSchema>;
export type SearchFilterState = z.infer<typeof SearchFilterStateSchema>;
export type ReadingProgressState = z.infer<typeof ReadingProgressStateSchema>;

// Chat schemas
export const ChatConversationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  vendorId: z.string(),
  vendorName: z.string().optional(),
  vendorImage: z.string().optional(),
  vendorCategory: z.string().optional(),
  lastMessage: z.string().optional(),
  lastMessageAt: z.string().optional(),
  unreadCount: z.number().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ChatMessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  senderId: z.string(),
  senderType: z.enum(["user", "vendor"]),
  content: z.string(),
  messageType: z.enum(["text", "image", "file"]).default("text"),
  read: z.boolean().default(false),
  createdAt: z.string(),
});

export type ChatConversation = z.infer<typeof ChatConversationSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
