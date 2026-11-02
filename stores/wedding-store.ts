import { handleSupabaseError,supabase } from "@/config/supabase";
import {
BudgetExpenseSchema,
BudgetItemSchema,
ChecklistItemSchema,
VendorSchema,
WeddingDetailsSchema,
type BudgetExpense,
type BudgetItem,
type ChecklistItem,
type Vendor,
type WeddingDetails,
} from "@/schemas/wedding";
import { isValidResult,validate } from "@/utils/api-validator";
import {
transformBudgetFromDb,
transformChecklistFromDb,
transformVendorFromDb,
} from "@/utils/transforms";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage,persist } from "zustand/middleware";

// Module-scoped subscription refs — NOT in Zustand state to avoid re-renders
let _checklistSubscription: ReturnType<typeof supabase.channel> | null = null;
let _budgetSubscription: ReturnType<typeof supabase.channel> | null = null;
let _checklistReloadTimer: ReturnType<typeof setTimeout> | null = null;
let _budgetReloadTimer: ReturnType<typeof setTimeout> | null = null;
// Map of page number → in-flight promise to avoid duplicate parallel loads
const _loadVendorsPromises = new Map<number, Promise<void>>();

// Placeholder cover for self-registered vendors until they upload their own.
const DEFAULT_VENDOR_COVER_IMAGE =
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80";

export type ExpenseId = `e${number}`;

interface WeddingState {
  isInitialized: boolean;
  loading: boolean;
  error: string | null;

  weddingDetails: WeddingDetails | null;

  vendors: Vendor[];
  favoriteVendors: string[];
  favoriteArticles: string[];

  checklistItems: ChecklistItem[];

  budgetItems: BudgetItem[];

  initialize: (userId?: string) => Promise<void>;
  clearError: () => void;

  setWeddingDetails: (
    details: Omit<WeddingDetails, "id" | "userId" | "createdAt" | "updatedAt">
  ) => Promise<{ success: boolean; error?: string }>;
  updateProfileImage: (
    imageUrl: string
  ) => Promise<{ success: boolean; error?: string }>;

  loadVendors: (page?: number, limit?: number) => Promise<void>;
  loadMoreVendors: () => Promise<void>;
  createVendor: (input: {
    name: string;
    category: string;
    city: string;
    description: string;
    startingPrice: number;
  }) => Promise<{ success: boolean; error?: string }>;
  myVendor: {
    id: string;
    name: string;
    isApproved: boolean;
    isAvailable: boolean;
  } | null;
  loadMyVendor: () => Promise<void>;
  hasMoreVendors: boolean;
  currentVendorPage: number;
  /** @deprecated Use vendor-store instead for vendor favorites. */
  toggleFavoriteVendor: (
    vendorId: string
  ) => Promise<{ success: boolean; error?: string }>;
  searchVendors: (
    query: string,
    category?: string
  ) => Promise<{ success: boolean; vendors?: Vendor[]; error?: string }>;
  /** @deprecated Use vendor-store instead for loading favorite vendors. */
  loadFavoriteVendors: (userId: string) => Promise<void>;

  toggleFavoriteArticle: (
    articleId: string
  ) => Promise<{ success: boolean; error?: string }>;
  loadFavoriteArticles: (userId: string) => Promise<void>;

  loadChecklistItems: (userId: string) => Promise<void>;
  updateChecklistItem: (
    itemId: string,
    completed: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  addChecklistItem: (
    item: Omit<ChecklistItem, "id" | "userId" | "createdAt" | "updatedAt">
  ) => Promise<{ success: boolean; error?: string }>;
  deleteChecklistItem: (
    itemId: string
  ) => Promise<{ success: boolean; error?: string }>;

  loadBudgetItems: (userId: string) => Promise<void>;
  updateBudgetItem: (
    itemId: string,
    estimated: number
  ) => Promise<{ success: boolean; error?: string }>;
  addBudgetExpense: (
    budgetItemId: string,
    expense: Omit<BudgetExpense, "id" | "userId" | "createdAt" | "updatedAt">
  ) => Promise<{ success: boolean; error?: string }>;
  deleteBudgetExpense: (
    expenseId: string,
    budgetItemId: string
  ) => Promise<{ success: boolean; error?: string }>;
  addBudgetCategory: (
    category: Omit<
      BudgetItem,
      "id" | "userId" | "createdAt" | "updatedAt" | "items"
    >
  ) => Promise<{ success: boolean; error?: string }>;

  subscribeToChanges: (userId: string) => void;
  unsubscribeFromChanges: () => void;
  resetPersonalData: () => void;
}



export const useWeddingStore = create<WeddingState>()(
  persist(
    (set, get) => ({
      isInitialized: false,
      loading: false,
      error: null,

      weddingDetails: null,
      vendors: [],
      myVendor: null,
      favoriteVendors: [],
      favoriteArticles: [],
      checklistItems: [],
      budgetItems: [],
      hasMoreVendors: true,
      currentVendorPage: 1,

      initialize: async (userId?: string) => {
        try {
          set({ loading: true, error: null });

          if (userId) {
            await Promise.all([
              get().loadVendors(),
              get().loadChecklistItems(userId),
              get().loadBudgetItems(userId),
              get().loadFavoriteVendors(userId),
              get().loadFavoriteArticles(userId),
            ]);

            const { data: weddingData, error: weddingError } = await supabase
              .from("wedding_details")
              .select("*")
              .eq("user_id", userId)
              .maybeSingle();

            if (weddingData && !weddingError) {
              const weddingDetails: WeddingDetails = {
                id: weddingData.id,
                coupleName: weddingData.couple_name,
                weddingDate: weddingData.wedding_date,
                weddingLocation: weddingData.wedding_location,
                totalBudget: weddingData.total_budget,
                culture: weddingData.culture ?? undefined,
                profileImageUrl: weddingData.profile_image_url,
              };

              const validatedDetails = validate(WeddingDetailsSchema, weddingDetails);
              if (validatedDetails.success) {
                set({ weddingDetails: validatedDetails.data });
              }
            }

            get().subscribeToChanges(userId);
          } else {
            // Guest mode: load real public vendors catalog without querying private user tables
            await get().loadVendors();
            set({
              weddingDetails: null,
              favoriteVendors: [],
              favoriteArticles: [],
              checklistItems: [],
              budgetItems: [],
            });
          }

          set({ isInitialized: true, loading: false });
        } catch (error) {
          if (__DEV__)
            console.error("Wedding store initialization error:", error);
          set({
            error: handleSupabaseError(error),
            loading: false,
            isInitialized: true,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setWeddingDetails: async (details) => {
        try {
          const validatedDetails = validate(WeddingDetailsSchema, details);
          if (!validatedDetails.success) {
            const errorMessage = validatedDetails.errors?.[0] || "Invalid wedding details";
            set({ error: errorMessage, loading: false });
            return { success: false, error: errorMessage };
          }
          const validatedData = validatedDetails.data;
          set({ loading: true, error: null });

          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            set({ error: "User not authenticated", loading: false });
            return { success: false, error: "User not authenticated" };
          }

          const { data: existingDetails } = await supabase
            .from("wedding_details")
            .select("id")
            .eq("user_id", user.id)
            .single();

          // NOTE: profile_image_url intentionally lives on `profiles` (the
          // wedding_details table has no such column) — profile photos are
          // managed via updateProfileImage, not here.
          let result;
          if (existingDetails) {
            result = await supabase
              .from("wedding_details")
              .update({
                couple_name: validatedData.coupleName,
                wedding_date: validatedData.weddingDate,
                wedding_location: validatedData.weddingLocation,
                total_budget: validatedData.totalBudget,
                culture: validatedData.culture ?? null,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", user.id);
          } else {
            result = await supabase.from("wedding_details").insert({
              couple_name: validatedData.coupleName,
              wedding_date: validatedData.weddingDate,
              wedding_location: validatedData.weddingLocation,
              total_budget: validatedData.totalBudget,
              culture: validatedData.culture ?? null,
              user_id: user.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }

          if (result.error) {
            const errorMessage = handleSupabaseError(result.error);
            set({ error: errorMessage, loading: false });
            return { success: false, error: errorMessage };
          }

          set({ weddingDetails: validatedData, loading: false });
          return { success: true };
        } catch (error) {
          const errorMessage = handleSupabaseError(error);
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },

      updateProfileImage: async (imageUrl: string) => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            return { success: false, error: "User not authenticated" };
          }

          const { error } = await supabase
            .from("profiles")
            .update({
              profile_image_url: imageUrl,
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

          if (error) {
            const errorMessage = handleSupabaseError(error);
            return { success: false, error: errorMessage };
          }

          const currentDetails = get().weddingDetails;
          if (currentDetails) {
            set({
              weddingDetails: {
                ...currentDetails,
                profileImageUrl: imageUrl,
              },
            });
          }

          return { success: true };
        } catch (error) {
          const errorMessage = handleSupabaseError(error);
          return { success: false, error: errorMessage };
        }
      },

      loadVendors: async (page: number = 1, limit: number = 20) => {
        // Deduplicate in-flight loads per page using a Map
        const existing = _loadVendorsPromises.get(page);
        if (existing) return existing;

        const promise = (async () => {
          const offset = (page - 1) * limit;
          try {
            const { data: vendorData, error } = await supabase
              .from("vendors")
              .select(
                "id, name, category, description, location, rating, review_count, " +
                  "price_range, min_price, max_price, cover_image, photos, completed_bookings, gallery, " +
                  "features, services, packages, availability, featured, is_available, verified, " +
                  "business_hours, user_id, contact, created_at, updated_at"
              )
              .eq("is_available", true)
              .order("rating", { ascending: false })
              .range(offset, offset + limit - 1);

            if (error) {
              if (__DEV__)
                console.warn(
                  "Failed to load vendors from database:",
                  error
                );
              // Show empty state instead of mock data — users need to know the app is offline
              set({
                error:
                  page === 1
                    ? "Unable to load vendors. Check your internet connection and try again."
                    : "Unable to load more vendors. Check your internet connection and try again.",
                ...(page === 1 ? { vendors: [] } : {}),
              });
              return;
            }

            if (vendorData && vendorData.length > 0) {
              const transformedVendors = vendorData.map((v) =>
                transformVendorFromDb(
                  v as unknown as Parameters<typeof transformVendorFromDb>[0]
                )
              );
              const validatedVendors = transformedVendors
                .map((v) => validate(VendorSchema, v))
                .filter(isValidResult)
                .map((r) => r.data);
              set((state) => ({
                vendors:
                  page > 1
                    ? [...state.vendors, ...validatedVendors]
                    : validatedVendors,
                error: null,
              }));
            } else if (page === 1) {
              // No vendors returned from server — show empty state, not mock data
              set({ vendors: [], error: null });
            }
          } catch (error) {
            if (__DEV__) console.warn("Error loading vendors:", error);
            set({
              error:
                page === 1
                  ? "Unable to load vendors. Check your internet connection and try again."
                  : "Unable to load more vendors. Check your internet connection and try again.",
              ...(page === 1 ? { vendors: [] } : {}),
            });
          } finally {
            _loadVendorsPromises.delete(page);
          }
        })();

        _loadVendorsPromises.set(page, promise);
        return promise;
      },

      loadMoreVendors: async () => {
        const { currentVendorPage, hasMoreVendors } = get();
        if (!hasMoreVendors) return;
        const nextPage = currentVendorPage + 1;
        const beforeCount = get().vendors.length;
        await get().loadVendors(nextPage, 20);
        // If the fetch failed, error is set and the list length is unchanged —
        // don't advance the page or disable pagination on a transient error.
        if (get().error) return;
        const afterCount = get().vendors.length;
        // If no new vendors were loaded, we've hit the end
        set({
          currentVendorPage: nextPage,
          hasMoreVendors: afterCount > beforeCount,
        });
      },

      createVendor: async (input) => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            return { success: false, error: "User not authenticated" };
          }

          // Self-registration creates a HIDDEN listing (is_available = false);
          // it stays out of public queries until reviewed. is_available is not
          // a server-only column, so the client may set it.
          const { error } = await supabase.from("vendors").insert({
            name: input.name,
            category: input.category,
            description: input.description,
            location: { city: input.city, country: "India" },
            price_range: `₹${input.startingPrice.toLocaleString("en-IN")}+`,
            min_price: input.startingPrice,
            cover_image: DEFAULT_VENDOR_COVER_IMAGE,
            contact: { email: user.email ?? "" },
            is_available: false,
            user_id: user.id,
          });

          if (error) {
            return { success: false, error: handleSupabaseError(error) };
          }

          return { success: true };
        } catch (error) {
          return { success: false, error: handleSupabaseError(error) };
        }
      },

      loadMyVendor: async () => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            set({ myVendor: null });
            return;
          }

          const { data, error } = await supabase
            .from("vendors")
            .select("id, name, is_approved, is_available")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (error) {
            if (__DEV__) console.warn("Failed to load own vendor:", error);
            set({ myVendor: null });
            return;
          }

          if (data) {
            set({
              myVendor: {
                id: data.id,
                name: data.name,
                isApproved: data.is_approved === true,
                isAvailable: data.is_available === true,
              },
            });
          } else {
            set({ myVendor: null });
          }
        } catch (error) {
          if (__DEV__) console.warn("Error loading own vendor:", error);
        }
      },

      toggleFavoriteVendor: async (vendorId: string) => {
        const previousFavorites = get().favoriteVendors;
        const isFavorite = previousFavorites.includes(vendorId);

        const newFavorites = isFavorite
          ? previousFavorites.filter((id) => id !== vendorId)
          : [...previousFavorites, vendorId];

        // Optimistic update
        set({ favoriteVendors: newFavorites });

        // vendor-store syncs via loadFavoriteVendors on screen focus

        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            if (isFavorite) {
              const { error } = await supabase
                .from("favorite_vendors")
                .delete()
                .eq("user_id", user.id)
                .eq("vendor_id", vendorId);
              if (error) throw error;
            } else {
              const { error } = await supabase
                .from("favorite_vendors")
                .insert({ user_id: user.id, vendor_id: vendorId });
              if (error) throw error;
            }
          }

          await AsyncStorage.setItem(
            "wedding-favorites",
            JSON.stringify(newFavorites)
          );

          return { success: true };
        } catch (error) {
          if (__DEV__) console.error("Error toggling favorite:", error);
          // Rollback optimistic update on failure
          set({ favoriteVendors: previousFavorites });
          // vendor-store syncs via loadFavoriteVendors on screen focus
          return { success: false, error: "Failed to update favorites" };
        }
      },

      searchVendors: async (query: string, category?: string) => {
        try {
          let queryBuilder = supabase.from("vendors").select("*");

          if (query.trim()) {
            const sanitizedQuery = query.replace(/[%_\\]/g, "\\$&");
            queryBuilder = queryBuilder.or(
              `name.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`
            );
          }

          if (category && category !== "All") {
            queryBuilder = queryBuilder.eq("category", category);
          }

          const { data: vendorData, error } = await queryBuilder.limit(50);

          if (error) {
            if (__DEV__) console.warn("Failed to search vendors:", error);
            // Don't silently fall back to mock data — show the error
            return { success: false, error: "Search unavailable. Check your connection." };
          }

          if (vendorData) {
            const transformedVendors = vendorData.map((v) =>
              transformVendorFromDb(
                v as unknown as Parameters<typeof transformVendorFromDb>[0]
              )
            );
            const validatedVendors = transformedVendors
              .map((v) => validate(VendorSchema, v))
                .filter(isValidResult)
              .map((r) => r.data);
            return { success: true, vendors: validatedVendors };
          }

          return { success: true, vendors: [] };
        } catch (error) {
          const errorMessage = handleSupabaseError(error);
          return { success: false, error: errorMessage };
        }
      },

      loadFavoriteVendors: async (_userId: string) => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            const { data } = await supabase
              .from("favorite_vendors")
              .select("vendor_id")
              .eq("user_id", user.id);
            if (data) {
              const ids = data.map((f) => f.vendor_id);
              set({ favoriteVendors: ids });
              await AsyncStorage.setItem(
                "wedding-favorites",
                JSON.stringify(ids)
              );
              return;
            }
          }
          const saved = await AsyncStorage.getItem("wedding-favorites");
          if (saved) set({ favoriteVendors: JSON.parse(saved) });
        } catch (error) {
          if (__DEV__) console.warn("Error loading favorites:", error);
        }
      },

      toggleFavoriteArticle: async (articleId: string) => {
        const previousFavorites = get().favoriteArticles;
        const isFavorite = previousFavorites.includes(articleId);

        const newFavorites = isFavorite
          ? previousFavorites.filter((id) => id !== articleId)
          : [...previousFavorites, articleId];

        // Optimistic update
        set({ favoriteArticles: newFavorites });

        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            if (isFavorite) {
              const { error } = await supabase
                .from("favorite_articles")
                .delete()
                .eq("user_id", user.id)
                .eq("article_id", articleId);
              if (error) throw error;
            } else {
              const { error } = await supabase
                .from("favorite_articles")
                .insert({ user_id: user.id, article_id: articleId });
              if (error) throw error;
            }
          }

          // Also persist locally for guest users and offline resilience
          await AsyncStorage.setItem(
            "wedding-article-favorites",
            JSON.stringify(newFavorites)
          );

          return { success: true };
        } catch (error) {
          if (__DEV__) console.error("Error toggling article favorite:", error);
          // Rollback optimistic update on failure
          set({ favoriteArticles: previousFavorites });
          return {
            success: false,
            error: "Failed to update article favorites",
          };
        }
      },

      loadFavoriteArticles: async (_userId: string) => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            const { data } = await supabase
              .from("favorite_articles")
              .select("article_id")
              .eq("user_id", user.id);
            if (data) {
              const ids = data.map((f) => f.article_id);
              set({ favoriteArticles: ids });
              await AsyncStorage.setItem(
                "wedding-article-favorites",
                JSON.stringify(ids)
              );
              return;
            }
          }
          // Fallback to AsyncStorage for guest users
          const savedFavorites = await AsyncStorage.getItem(
            "wedding-article-favorites"
          );
          if (savedFavorites) {
            const favoriteIds = JSON.parse(savedFavorites);
            set({ favoriteArticles: favoriteIds });
          }
        } catch (error) {
          if (__DEV__) console.warn("Error loading favorite articles:", error);
        }
      },

      loadChecklistItems: async (userId: string) => {
        try {
          const { data: checklistData, error } = await supabase
            .from("checklist_items")
            .select("*")
            .eq("user_id", userId)
            .order("due_date", { ascending: true });

          if (error) {
            if (__DEV__) console.warn("Failed to load checklist items:", error);
            // show empty state instead of confusing mock data
            set({ checklistItems: [], error: "Unable to load checklist. Check your internet connection." });
            return;
          }

          if (checklistData && checklistData.length > 0) {
            const transformedItems = checklistData.map((item) =>
              transformChecklistFromDb(
                item as unknown as Parameters<
                  typeof transformChecklistFromDb
                >[0]
              )
            );
            const validatedItems = transformedItems
              .map((item) => validate(ChecklistItemSchema, item))
                .filter(isValidResult)
              .map((r) => r.data);
            set({ checklistItems: validatedItems, error: null });
          } else {
            // first load? user has no items yet — that’s fine
            set({ checklistItems: [] });
          }
        } catch (error) {
          if (__DEV__) console.warn("Error loading checklist items:", error);
          set({ checklistItems: [], error: "Unable to load checklist. Check your internet connection." });
        }
      },

      updateChecklistItem: async (itemId: string, completed: boolean) => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            return { success: false, error: "User not authenticated" };
          }

          const { error } = await supabase
            .from("checklist_items")
            .update({
              completed,
              updated_at: new Date().toISOString(),
            })
            .eq("id", itemId)
            .eq("user_id", user.id);

          if (error) {
            const errorMessage = handleSupabaseError(error);
            return { success: false, error: errorMessage };
          }

          set((state) => ({
            checklistItems: state.checklistItems.map((item: ChecklistItem) =>
              item.id === itemId ? { ...item, completed } : item
            ),
          }));

          return { success: true };
        } catch (error) {
          const errorMessage = handleSupabaseError(error);
          return { success: false, error: errorMessage };
        }
      },

      addChecklistItem: async (itemData) => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            return { success: false, error: "User not authenticated" };
          }

          const validatedItemResult = validate(
            ChecklistItemSchema.omit({
              id: true,
              userId: true,
              createdAt: true,
              updatedAt: true,
            }),
            itemData
          );
          if (!validatedItemResult.success) {
            return { success: false, error: validatedItemResult.errors?.[0] || "Invalid item" };
          }
          const validatedItem = validatedItemResult.data;

          const { data, error } = await supabase
            .from("checklist_items")
            .insert({
              title: validatedItem.title,
              description: validatedItem.description,
              category: validatedItem.category,
              due_date: validatedItem.dueDate,
              completed: validatedItem.completed,
              priority: validatedItem.priority,
              user_id: user.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (error) {
            const errorMessage = handleSupabaseError(error);
            return { success: false, error: errorMessage };
          }

          if (data) {
            const newItem: ChecklistItem = {
              id: data.id,
              title: data.title,
              description: data.description,
              category: data.category,
              dueDate: data.due_date,
              completed: data.completed,
              priority: data.priority,
            };

            set((state) => ({
              checklistItems: [...state.checklistItems, newItem],
            }));
          }

          return { success: true };
        } catch (error) {
          const errorMessage = handleSupabaseError(error);
          return { success: false, error: errorMessage };
        }
      },

      deleteChecklistItem: async (itemId: string) => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            return { success: false, error: "User not authenticated" };
          }

          const { error } = await supabase
            .from("checklist_items")
            .delete()
            .eq("id", itemId)
            .eq("user_id", user.id);

          if (error) {
            const errorMessage = handleSupabaseError(error);
            return { success: false, error: errorMessage };
          }

          set((state) => ({
            checklistItems: state.checklistItems.filter(
              (item: ChecklistItem) => item.id !== itemId
            ),
          }));

          return { success: true };
        } catch (error) {
          const errorMessage = handleSupabaseError(error);
          return { success: false, error: errorMessage };
        }
      },

      loadBudgetItems: async (userId: string) => {
        try {
          const { data: budgetData, error } = await supabase
            .from("budget_items")
            .select(
              `
              *,
              budget_expenses (*)
            `
            )
            .eq("user_id", userId);

          if (error) {
            if (__DEV__) console.warn("Failed to load budget items:", error);
            set({ budgetItems: [], error: "Unable to load budget. Check your internet connection." });
            return;
          }

          if (budgetData && budgetData.length > 0) {
            const transformedItems = budgetData.map((item) =>
              transformBudgetFromDb(
                item as unknown as Parameters<typeof transformBudgetFromDb>[0]
              )
            );
            const validatedItems = transformedItems
              .map((item) => validate(BudgetItemSchema, item))
                .filter(isValidResult)
              .map((r) => r.data);
            set({ budgetItems: validatedItems, error: null });
          } else {
            set({ budgetItems: [] });
          }
        } catch (error) {
          if (__DEV__) console.warn("Error loading budget items:", error);
          set({ budgetItems: [], error: "Unable to load budget. Check your internet connection." });
        }
      },

      updateBudgetItem: async (itemId: string, estimated: number) => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            return { success: false, error: "User not authenticated" };
          }

          const { error } = await supabase
            .from("budget_items")
            .update({
              estimated,
              updated_at: new Date().toISOString(),
            })
            .eq("id", itemId)
            .eq("user_id", user.id);

          if (error) {
            const errorMessage = handleSupabaseError(error);
            return { success: false, error: errorMessage };
          }

          set((state) => ({
            budgetItems: state.budgetItems.map((item: BudgetItem) =>
              item.id === itemId ? { ...item, estimated } : item
            ),
          }));

          return { success: true };
        } catch (error) {
          const errorMessage = handleSupabaseError(error);
          return { success: false, error: errorMessage };
        }
      },

      addBudgetExpense: async (budgetItemId: string, expenseData) => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            return { success: false, error: "User not authenticated" };
          }

          const validatedExpenseResult = validate(
            BudgetExpenseSchema.omit({
              id: true,
              userId: true,
              createdAt: true,
              updatedAt: true,
            }),
            expenseData
          );
          if (!validatedExpenseResult.success) {
            return { success: false, error: validatedExpenseResult.errors?.[0] || "Invalid expense" };
          }
          const validatedExpense = validatedExpenseResult.data;

          const { data, error } = await supabase
            .from("budget_expenses")
            .insert({
              budget_item_id: budgetItemId,
              name: validatedExpense.name,
              amount: validatedExpense.amount,
              date: validatedExpense.date,
              paid: validatedExpense.paid,
              vendor: validatedExpense.vendor,
              notes: validatedExpense.notes,
              user_id: user.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (error) {
            const errorMessage = handleSupabaseError(error);
            return { success: false, error: errorMessage };
          }

          if (data) {
            const newExpense: BudgetExpense = {
              id: data.id,
              name: data.name,
              amount: data.amount,
              date: data.date,
              paid: data.paid,
              vendor: data.vendor,
              notes: data.notes,
            };

            set((state) => ({
              budgetItems: state.budgetItems.map((item: BudgetItem) =>
                item.id === budgetItemId
                  ? {
                      ...item,
                      items: [...item.items, newExpense],
                      spent: item.spent + newExpense.amount,
                    }
                  : item
              ),
            }));
          }

          return { success: true };
        } catch (error) {
          const errorMessage = handleSupabaseError(error);
          return { success: false, error: errorMessage };
        }
      },

      deleteBudgetExpense: async (expenseId: string, budgetItemId: string) => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            return { success: false, error: "User not authenticated" };
          }

          const { data: expenseData, error: fetchError } = await supabase
            .from("budget_expenses")
            .select("amount")
            .eq("id", expenseId)
            .eq("user_id", user.id)
            .single();

          if (fetchError) {
            const errorMessage = handleSupabaseError(fetchError);
            return { success: false, error: errorMessage };
          }

          const { error } = await supabase
            .from("budget_expenses")
            .delete()
            .eq("id", expenseId)
            .eq("user_id", user.id);

          if (error) {
            const errorMessage = handleSupabaseError(error);
            return { success: false, error: errorMessage };
          }

          set((state) => ({
            budgetItems: state.budgetItems.map((item: BudgetItem) =>
              item.id === budgetItemId
                ? {
                    ...item,
                    items: item.items.filter(
                      (expense: BudgetExpense) => expense.id !== expenseId
                    ),
                    spent: item.spent - (expenseData?.amount || 0),
                  }
                : item
            ),
          }));

          return { success: true };
        } catch (error) {
          const errorMessage = handleSupabaseError(error);
          return { success: false, error: errorMessage };
        }
      },

      addBudgetCategory: async (categoryData) => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            return { success: false, error: "User not authenticated" };
          }

          const validatedCategoryResult = validate(BudgetItemSchema, {
            ...categoryData,
            items: [],
            spent: 0,
          });
          if (!validatedCategoryResult.success) {
            return { success: false, error: validatedCategoryResult.errors?.[0] || "Invalid category" };
          }
          const validatedCategory = validatedCategoryResult.data;

          const { data, error } = await supabase
            .from("budget_items")
            .insert({
              category: validatedCategory.category,
              estimated: validatedCategory.estimated,
              spent: 0,
              user_id: user.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (error) {
            const errorMessage = handleSupabaseError(error);
            return { success: false, error: errorMessage };
          }

          if (data) {
            const newCategory: BudgetItem = {
              id: data.id,
              category: data.category,
              estimated: data.estimated,
              spent: data.spent,
              items: [],
            };

            set((state) => ({
              budgetItems: [...state.budgetItems, newCategory],
            }));
          }

          return { success: true };
        } catch (error) {
          const errorMessage = handleSupabaseError(error);
          return { success: false, error: errorMessage };
        }
      },

      subscribeToChanges: (userId: string) => {
        // Clean up existing subscriptions before creating new ones
        if (_checklistSubscription) {
          supabase.removeChannel(_checklistSubscription);
        }
        if (_budgetSubscription) {
          supabase.removeChannel(_budgetSubscription);
        }

        const checklistChannel = `checklist_changes_${userId}`;
        const budgetChannel = `budget_changes_${userId}`;

        _checklistSubscription = supabase
          .channel(checklistChannel)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "checklist_items",
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              if (__DEV__) console.debug("Checklist change received:", payload);
              // Debounce rapid updates
              if (_checklistReloadTimer) clearTimeout(_checklistReloadTimer);
              _checklistReloadTimer = setTimeout(() => {
                get().loadChecklistItems(userId);
              }, 500);
            }
          )
          .subscribe();

        _budgetSubscription = supabase
          .channel(budgetChannel)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "budget_items",
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              if (__DEV__) console.debug("Budget change received:", payload);
              // Debounce rapid updates
              if (_budgetReloadTimer) clearTimeout(_budgetReloadTimer);
              _budgetReloadTimer = setTimeout(() => {
                get().loadBudgetItems(userId);
              }, 500);
            }
          )
          .subscribe();
      },

      unsubscribeFromChanges: () => {
        if (_checklistReloadTimer) {
          clearTimeout(_checklistReloadTimer);
          _checklistReloadTimer = null;
        }
        if (_budgetReloadTimer) {
          clearTimeout(_budgetReloadTimer);
          _budgetReloadTimer = null;
        }
        if (_checklistSubscription) {
          supabase.removeChannel(_checklistSubscription);
          _checklistSubscription = null;
        }
        if (_budgetSubscription) {
          supabase.removeChannel(_budgetSubscription);
          _budgetSubscription = null;
        }
      },

      resetPersonalData: () => {
        get().unsubscribeFromChanges();
        set({
          weddingDetails: null,
          myVendor: null,
          favoriteVendors: [],
          favoriteArticles: [],
          checklistItems: [],
          budgetItems: [],
          isInitialized: false,
          loading: false,
          error: null,
        });
      },
    }),
    {
      name: "wedding-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        weddingDetails: state.weddingDetails,
        favoriteVendors: state.favoriteVendors,
        favoriteArticles: state.favoriteArticles,
        isInitialized: state.isInitialized,
      }),
    }
  )
);
