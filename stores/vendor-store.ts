import { handleSupabaseError,supabase } from "@/config/supabase";
import {
VendorSchema,
VendorSearchFiltersSchema,
type Vendor,
type VendorLocation,
type VendorSearchFilters,
} from "@/schemas/wedding";
import { isValidResult,validate,validateOrThrow } from "@/utils/api-validator";
import { transformVendorFromDb } from "@/utils/transforms";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage,persist } from "zustand/middleware";

const PAGE_SIZE = 20;

interface VendorState {
  vendors: Vendor[];
  favoriteVendors: string[];
  loading: boolean;
  error: string | null;
  currentVendorPage: number;
  hasMoreVendors: boolean;
  vendorSearchQuery: string;
  vendorFilters: VendorSearchFilters;

  loadVendors: () => Promise<void>;
  loadMoreVendors: () => Promise<void>;
  searchVendors: (
    filters: VendorSearchFilters
  ) => Promise<{ success: boolean; vendors?: Vendor[]; error?: string }>;
  filterVendors: (vendors: Vendor[], filters: VendorSearchFilters) => Vendor[];
  searchVendorsByLocation: (
    location: VendorLocation,
    radius: number
  ) => Promise<{ success: boolean; vendors?: Vendor[]; error?: string }>;
  sortVendors: (
    vendors: Vendor[],
    sortBy: "rating" | "price" | "distance" | "popularity",
    order: "asc" | "desc"
  ) => Vendor[];
  getVendorById: (vendorId: string) => Vendor | null;

  toggleFavoriteVendor: (
    vendorId: string
  ) => Promise<{ success: boolean; error?: string }>;
  loadFavoriteVendors: (userId: string) => Promise<void>;

  setFilters: (filters: VendorSearchFilters) => void;
  clearFilters: () => void;
  clearError: () => void;
  calculateDistance: (
    location1: VendorLocation,
    location2: VendorLocation
  ) => number;
}

export const useVendorStore = create<VendorState>()(
  persist(
    (set, get) => ({
      vendors: [],
      favoriteVendors: [],
      loading: false,
      error: null,
      currentVendorPage: 0,
      hasMoreVendors: true,
      vendorSearchQuery: "",
      vendorFilters: {},

      loadVendors: async () => {
        try {
          set({ loading: true, error: null, currentVendorPage: 0 });

          const { data: vendorData, error } = await supabase
            .from("vendors")
            .select(
              "id, name, category, description, location, rating, review_count, " +
              "price_range, min_price, max_price, cover_image, photos, completed_bookings, gallery, " +
              "features, services, packages, availability, featured, is_available, verified, " +
              "business_hours, user_id, contact, created_at, updated_at"
            )
            .order("created_at", { ascending: false })
            .range(0, PAGE_SIZE - 1);

          if (error) {
            const errorMessage = handleSupabaseError(error);
            set({ error: errorMessage, loading: false });
            return;
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
            set({
              vendors: validatedVendors,
              loading: false,
              currentVendorPage: 1,
              hasMoreVendors: vendorData.length === PAGE_SIZE,
            });
          }
        } catch (error) {
          const errorMessage = handleSupabaseError(error);
          set({ error: errorMessage, loading: false });
        }
      },

      loadMoreVendors: async () => {
        const { currentVendorPage, hasMoreVendors, loading, vendorFilters } =
          get();
        if (!hasMoreVendors || loading) return;

        try {
          set({ loading: true, error: null });

          const offset = currentVendorPage * PAGE_SIZE;
          let queryBuilder = supabase.from("vendors").select("*");

          if (vendorFilters.query) {
            const sanitizedQuery = vendorFilters.query
              .replace(/[,()]/g, " ")
              .replace(/[%_\\]/g, "\\$&")
              .trim();
            if (sanitizedQuery) {
              queryBuilder = queryBuilder.or(
                `name.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`
              );
            }
          }

          if (vendorFilters.category) {
            queryBuilder = queryBuilder.eq("category", vendorFilters.category);
          }

          if (vendorFilters.rating) {
            queryBuilder = queryBuilder.gte("rating", vendorFilters.rating);
          }

          queryBuilder = queryBuilder
            .order("created_at", { ascending: false })
            .range(offset, offset + PAGE_SIZE - 1);

          const { data: vendorData, error } = await queryBuilder;

          if (error) {
            const errorMessage = handleSupabaseError(error);
            set({ error: errorMessage, loading: false });
            return;
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
            set((state) => ({
              vendors: [...state.vendors, ...validatedVendors],
              loading: false,
              currentVendorPage: currentVendorPage + 1,
              hasMoreVendors: vendorData.length === PAGE_SIZE,
            }));
          }
        } catch (error) {
          const errorMessage = handleSupabaseError(error);
          set({ error: errorMessage, loading: false });
        }
      },

      searchVendors: async (filters: VendorSearchFilters) => {
        try {
          const validatedFilters = validateOrThrow(VendorSearchFiltersSchema, filters, "searchVendors");
          set({
            loading: true,
            error: null,
            vendorSearchQuery: validatedFilters.query || "",
          });

          let queryBuilder = supabase.from("vendors").select("*");

          if (validatedFilters.query) {
            const sanitizedQuery = validatedFilters.query
              .replace(/[,()]/g, " ")
              .replace(/[%_\\]/g, "\\$&")
              .trim();
            if (sanitizedQuery) {
              queryBuilder = queryBuilder.or(
                `name.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`
              );
            }
          }

          if (validatedFilters.category) {
            queryBuilder = queryBuilder.eq(
              "category",
              validatedFilters.category
            );
          }

          if (validatedFilters.priceRange) {
            if (validatedFilters.priceRange.min) {
              queryBuilder = queryBuilder.gte(
                "min_price",
                validatedFilters.priceRange.min
              );
            }
            if (validatedFilters.priceRange.max) {
              queryBuilder = queryBuilder.lte(
                "max_price",
                validatedFilters.priceRange.max
              );
            }
          }

          if (validatedFilters.rating) {
            queryBuilder = queryBuilder.gte("rating", validatedFilters.rating);
          }

          if (validatedFilters.availability?.isAvailable !== undefined) {
            queryBuilder = queryBuilder.eq(
              "is_available",
              validatedFilters.availability.isAvailable
            );
          }

          if (validatedFilters.verified !== undefined) {
            queryBuilder = queryBuilder.eq(
              "verified",
              validatedFilters.verified
            );
          }

          if (validatedFilters.sortBy) {
            const column =
              validatedFilters.sortBy === "price"
                ? "min_price"
                : validatedFilters.sortBy;
            queryBuilder = queryBuilder.order(column, {
              ascending: validatedFilters.sortOrder === "asc",
            });
          }

          if (validatedFilters.limit) {
            queryBuilder = queryBuilder.limit(validatedFilters.limit);
          }
          if (validatedFilters.offset) {
            queryBuilder = queryBuilder.range(
              validatedFilters.offset,
              validatedFilters.offset + (validatedFilters.limit || 10) - 1
            );
          }

          const { data: vendorData, error } = await queryBuilder;

          if (error) {
            const errorMessage = handleSupabaseError(error);
            set({ error: errorMessage, loading: false });
            return { success: false, error: errorMessage };
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
            set({ loading: false });
            return { success: true, vendors: validatedVendors };
          }

          set({ loading: false });
          return { success: true, vendors: [] };
        } catch (error) {
          const errorMessage = handleSupabaseError(error);
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },

      filterVendors: (vendors: Vendor[], filters: VendorSearchFilters) => {
        let filtered = [...vendors];

        if (filters.query) {
          const query = filters.query.toLowerCase();
          filtered = filtered.filter(
            (v) =>
              v.name.toLowerCase().includes(query) ||
              v.description.toLowerCase().includes(query)
          );
        }

        if (filters.category) {
          filtered = filtered.filter((v) => v.category === filters.category);
        }

        if (filters.priceRange) {
          // A vendor is in range when its price band [minPrice, maxPrice]
          // overlaps the selected [min, max] range.
          if (filters.priceRange.min !== undefined) {
            filtered = filtered.filter(
              (v) => (v.maxPrice ?? v.minPrice ?? 0) >= filters.priceRange!.min!
            );
          }
          if (filters.priceRange.max !== undefined) {
            filtered = filtered.filter(
              (v) => (v.minPrice ?? 0) <= filters.priceRange!.max!
            );
          }
        }

        if (filters.rating) {
          filtered = filtered.filter((v) => v.rating >= filters.rating!);
        }

        if (filters.availability?.isAvailable !== undefined) {
          filtered = filtered.filter(
            (v) => v.isAvailable === filters.availability!.isAvailable
          );
        }

        if (filters.verified !== undefined) {
          filtered = filtered.filter((v) => v.verified === filters.verified);
        }

        return filtered;
      },

      searchVendorsByLocation: async (
        location: VendorLocation,
        radius: number
      ) => {
        try {
          if (typeof location === "string") {
            return { success: false, error: "Location coordinates required" };
          }
          if (!location.latitude || !location.longitude) {
            return { success: false, error: "Location coordinates required" };
          }

          set({ loading: true, error: null });

          // Compute a bounding box to narrow results server-side
          const lat = location.latitude;
          const lng = location.longitude;
          const latDelta = radius / 111.32;
          const lngDelta = radius / (111.32 * Math.cos((lat * Math.PI) / 180));
          const minLat = lat - latDelta;
          const maxLat = lat + latDelta;
          const minLng = lng - lngDelta;
          const maxLng = lng + lngDelta;

          // Filter by bounding box on the JSON location column
          let queryBuilder = supabase
            .from("vendors")
            .select(
              "id, name, category, description, location, rating, review_count, " +
              "price_range, min_price, max_price, cover_image, photos, completed_bookings, gallery, " +
              "features, services, packages, availability, featured, is_available, verified, " +
              "business_hours, user_id, contact, created_at, updated_at"
            );

          // Apply bounding box via JSON field filters
          queryBuilder = queryBuilder
            .gte("location->>latitude", String(minLat))
            .lte("location->>latitude", String(maxLat))
            .gte("location->>longitude", String(minLng))
            .lte("location->>longitude", String(maxLng));

          const { data: vendorData, error } = await queryBuilder;

          if (error) {
            const errorMessage = handleSupabaseError(error);
            set({ error: errorMessage, loading: false });
            return { success: false, error: errorMessage };
          }

          if (vendorData) {
            // Client-side Haversine on the much smaller bounding-box result
            const filteredVendors = vendorData
              .filter((v) => {
                const vTyped = v as unknown as Record<string, unknown>;
                const loc = vTyped.location as Record<string, unknown> | undefined;
                if (!loc?.latitude || !loc?.longitude) return false;
                const distance = get().calculateDistance(
                  location,
                  loc as unknown as VendorLocation
                );
                return distance <= radius;
              })
              .map((v) =>
                transformVendorFromDb(
                  v as unknown as Parameters<typeof transformVendorFromDb>[0]
                )
              );

            const validatedVendors = filteredVendors
              .map((v) => validate(VendorSchema, v))
              .filter(isValidResult)
              .map((r) => r.data);
            set({ loading: false });
            return { success: true, vendors: validatedVendors };
          }

          set({ loading: false });
          return { success: true, vendors: [] };
        } catch (error) {
          const errorMessage = handleSupabaseError(error);
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },

      sortVendors: (
        vendors: Vendor[],
        sortBy: "rating" | "price" | "distance" | "popularity",
        order: "asc" | "desc"
      ) => {
        const sorted = [...vendors].sort((a, b) => {
          let aValue: number, bValue: number;

          switch (sortBy) {
            case "rating":
              aValue = a.rating;
              bValue = b.rating;
              break;
            case "price":
              aValue = a.minPrice || 0;
              bValue = b.minPrice || 0;
              break;
            case "popularity":
              aValue = a.completedBookings;
              bValue = b.completedBookings;
              break;
            case "distance":
              // Distance sorting requires a reference location, which isn't
              // passed to this function. Sorting by latitude (the previous
              // behaviour) was meaningless — keep the original order instead.
              return 0;
            default:
              return 0;
          }

          return order === "asc" ? aValue - bValue : bValue - aValue;
        });

        return sorted;
      },

      getVendorById: (vendorId: string) => {
        const vendors = get().vendors;
        return vendors.find((vendor) => vendor.id === vendorId) || null;
      },

      toggleFavoriteVendor: async (vendorId: string) => {
        const previousFavorites = get().favoriteVendors;
        const isFavorite = previousFavorites.includes(vendorId);

        // Optimistic update locally
        const newFavorites = isFavorite
          ? previousFavorites.filter((id) => id !== vendorId)
          : [...previousFavorites, vendorId];
        set({ favoriteVendors: newFavorites });

        // Note: wedding-store syncs via loadFavoriteVendors on screen focus

        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            // Rollback
            set({ favoriteVendors: previousFavorites });
            return { success: false, error: "User not authenticated" };
          }

          if (isFavorite) {
            const { error } = await supabase
              .from("favorite_vendors")
              .delete()
              .eq("user_id", user.id)
              .eq("vendor_id", vendorId);

            if (error) {
              throw error;
            }
          } else {
            const { error } = await supabase.from("favorite_vendors").insert({
              user_id: user.id,
              vendor_id: vendorId,
              created_at: new Date().toISOString(),
            });

            if (error) {
              throw error;
            }
          }

          return { success: true };
        } catch (error) {
          // Rollback optimistic update
          set({ favoriteVendors: previousFavorites });
          // wedding-store syncs via loadFavoriteVendors on screen focus
          const errorMessage = handleSupabaseError(error);
          return { success: false, error: errorMessage };
        }
      },

      loadFavoriteVendors: async (userId: string) => {
        try {
          const { data: favoriteData, error } = await supabase
            .from("favorite_vendors")
            .select("vendor_id")
            .eq("user_id", userId);

          if (error) {
            if (__DEV__)
              console.warn("Failed to load favorite vendors:", error);
            return;
          }

          if (favoriteData) {
            const favoriteIds = favoriteData.map((fav) => fav.vendor_id);
            set({ favoriteVendors: favoriteIds });
            // wedding-store syncs via loadFavoriteVendors on screen focus
          }
        } catch (error) {
          if (__DEV__) console.warn("Error loading favorite vendors:", error);
        }
      },

      setFilters: (filters: VendorSearchFilters) => {
        set({ vendorFilters: filters });
      },

      clearFilters: () => {
        set({ vendorFilters: {}, vendorSearchQuery: "" });
      },

      clearError: () => {
        set({ error: null });
      },

      calculateDistance: (
        location1: VendorLocation,
        location2: VendorLocation
      ) => {
        if (typeof location1 === "string" || typeof location2 === "string")
          return 0;
        if (
          !location1.latitude ||
          !location1.longitude ||
          !location2.latitude ||
          !location2.longitude
        ) {
          return 0;
        }

        const R = 6371;
        const dLat =
          ((location2.latitude - location1.latitude) * Math.PI) / 180;
        const dLon =
          ((location2.longitude - location1.longitude) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((location1.latitude * Math.PI) / 180) *
            Math.cos((location2.latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      },
    }),
    {
      name: "vendor-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        favoriteVendors: state.favoriteVendors,
      }),
    }
  )
);




