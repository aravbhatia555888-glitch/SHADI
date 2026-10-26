import { handleSupabaseError,supabase } from "@/config/supabase";
import type { VendorBooking } from "@/schemas/wedding";
import { VendorBookingSchema } from "@/schemas/wedding";
import { isValidResult,validate } from "@/utils/api-validator";
import { withRetry } from "@/utils/retry";
import { transformBookingFromDb } from "@/utils/transforms";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage,persist } from "zustand/middleware";

interface BookingState {
  bookings: VendorBooking[];
  loading: boolean;
  error: string | null;

  loadUserBookings: (userId: string) => Promise<void>;
  createBooking: (
    booking: Omit<VendorBooking, "id" | "createdAt" | "updatedAt">
  ) => Promise<{ success: boolean; bookingId?: string; error?: string }>;
  checkVendorAvailability: (
    vendorId: string,
    date: string
  ) => Promise<{ success: boolean; available?: boolean; error?: string }>;
  updateBookingStatus: (
    bookingId: string,
    status: VendorBooking["status"]
  ) => Promise<{ success: boolean; error?: string }>;
  cancelBooking: (
    bookingId: string
  ) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
  bookings: [],
  loading: false,
  error: null,

  loadUserBookings: async (userId: string) => {
    try {
      set({ loading: true, error: null });

      const { data: bookingData, error } = await withRetry(() =>
        supabase
          .from("vendor_bookings")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50)
      );

      if (error) {
        const errorMessage = handleSupabaseError(error);
        if (__DEV__) console.warn("Failed to load user bookings:", error);
        set({ error: errorMessage, loading: false });
        return;
      }

      if (bookingData) {
        const bookings: VendorBooking[] = bookingData
          .map((b) => transformBookingFromDb(b as Record<string, unknown>))
          .map((b) => validate(VendorBookingSchema, b))
          .filter(isValidResult)
          .map((r) => r.data);

        set({ bookings, loading: false });
      } else {
        set({ bookings: [], loading: false });
      }
    } catch (error) {
      const errorMessage = handleSupabaseError(error);
      if (__DEV__) console.warn("Error loading user bookings:", error);
      set({ error: errorMessage, loading: false });
    }
  },

  createBooking: async (booking) => {
    try {
      set({ loading: true, error: null });

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        set({ loading: false });
        return { success: false, error: "User not authenticated" };
      }

      const { data, error } = await withRetry(() =>
        supabase
          .from("vendor_bookings")
          .insert({
            vendor_id: booking.vendorId,
            user_id: user.id,
            event_date: booking.eventDate,
            event_type: booking.eventType,
            package_id: booking.packageId,
            custom_requirements: booking.customRequirements,
            contact_name: booking.contactName,
            contact_phone: booking.contactPhone,
            contact_email: booking.contactEmail,
            total_amount: booking.totalAmount,
            advance_amount: booking.advanceAmount,
            status: "pending",
            payment_status: "pending",
            booking_date: booking.bookingDate,
            notes: booking.notes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select("id")
          .single()
      );

      if (error) {
        const errorMessage = handleSupabaseError(error);
        set({ error: errorMessage, loading: false });
        return { success: false, error: errorMessage };
      }

      if (data) {
        set({ loading: false });
        return { success: true, bookingId: data.id as string };
      }

      set({ loading: false });
      return { success: false, error: "Failed to create booking" };
    } catch (error) {
      const errorMessage = handleSupabaseError(error);
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  checkVendorAvailability: async (vendorId: string, date: string) => {
    try {
      const { data: bookingData, error } = await withRetry(() =>
        supabase
          .from("vendor_bookings")
          .select("id")
          .eq("vendor_id", vendorId)
          .eq("event_date", date)
          .in("status", ["confirmed", "pending"])
      );

      if (error) {
        const errorMessage = handleSupabaseError(error);
        return { success: false, error: errorMessage };
      }

      const available = !bookingData || bookingData.length === 0;
      return { success: true, available };
    } catch (error) {
      const errorMessage = handleSupabaseError(error);
      return { success: false, error: errorMessage };
    }
  },

  updateBookingStatus: async (bookingId: string, status) => {
    if (status === "cancelled") {
      return get().cancelBooking(bookingId);
    }
    // Booking confirmation and status changes are only performed server-side by Edge Functions
    return { success: false, error: "Booking status updates must be processed through verified payments" };
  },

  cancelBooking: async (bookingId: string) => {
    try {
      set({ loading: true, error: null });

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        set({ loading: false });
        return { success: false, error: "User not authenticated" };
      }

      const { data, error } = await supabase.rpc("cancel_user_booking", {
        p_booking_id: bookingId,
      });

      if (error) {
        const errorMessage = handleSupabaseError(error);
        set({ error: errorMessage, loading: false });
        return { success: false, error: errorMessage };
      }

      if (data && data.success === false) {
        set({ error: data.error || "Failed to cancel booking", loading: false });
        return { success: false, error: data.error };
      }

      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === bookingId ? { ...b, status: "cancelled" } : b
        ),
        loading: false,
      }));

      return { success: true };
    } catch (error) {
      const errorMessage = handleSupabaseError(error);
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  clearError: () => {
    set({ error: null });
  },
    }),
    {
      name: "booking-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        bookings: state.bookings,
      }),
    }
  )
);
