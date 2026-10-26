export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          wedding_date: string | null
          partner_name: string | null
          partner_email: string | null
          profile_image_url: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          wedding_date?: string | null
          partner_name?: string | null
          partner_email?: string | null
          profile_image_url?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          wedding_date?: string | null
          partner_name?: string | null
          partner_email?: string | null
          profile_image_url?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      vendors: {
        Row: {
          id: string
          name: string
          category: string
          description: string
          location: Json
          rating: number
          review_count: number
          price_range: string
          min_price: number | null
          max_price: number | null
          cover_image: string
          photos: string[]
          completed_bookings: number
          gallery: string[]
          contact: Json
          features: Json[]
          services: Json[]
          packages: Json[]
          availability: Json[]
          is_available: boolean
          featured: boolean
          verified: boolean | null
          business_hours: Json | null
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          description: string
          location: string
          rating?: number
          review_count?: number
          price_range: string
          cover_image: string
          photos?: string[]
          completed_bookings?: number
          gallery?: string[]
          contact: Json
          features?: Json[]
          services?: Json[]
          packages?: Json[]
          availability?: boolean
          featured?: boolean
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          description?: string
          location?: string
          rating?: number
          review_count?: number
          price_range?: string
          cover_image?: string
          photos?: string[]
          completed_bookings?: number
          gallery?: string[]
          contact?: Json
          features?: Json[]
          services?: Json[]
          packages?: Json[]
          availability?: boolean
          featured?: boolean
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      checklist_items: {
        Row: {
          id: string
          title: string
          description: string
          category: string
          due_date: string
          completed: boolean
          priority: 'high' | 'medium' | 'low'
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          category: string
          due_date: string
          completed?: boolean
          priority: 'high' | 'medium' | 'low'
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          category?: string
          due_date?: string
          completed?: boolean
          priority?: 'high' | 'medium' | 'low'
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      budget_items: {
        Row: {
          id: string
          category: string
          estimated: number
          spent: number
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category: string
          estimated: number
          spent?: number
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category?: string
          estimated?: number
          spent?: number
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      budget_expenses: {
        Row: {
          id: string
          budget_item_id: string
          name: string
          amount: number
          date: string
          paid: boolean
          vendor: string | null
          notes: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          budget_item_id: string
          name: string
          amount: number
          date: string
          paid?: boolean
          vendor?: string | null
          notes?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          budget_item_id?: string
          name?: string
          amount?: number
          date?: string
          paid?: boolean
          vendor?: string | null
          notes?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      wedding_details: {
        Row: {
          id: string
          couple_name: string
          wedding_date: string
          wedding_location: string
          total_budget: number
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          couple_name: string
          wedding_date: string
          wedding_location: string
          total_budget: number
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          couple_name?: string
          wedding_date?: string
          wedding_location?: string
          total_budget?: number
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      favorite_vendors: {
        Row: {
          id: string
          user_id: string
          vendor_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          vendor_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          vendor_id?: string
          created_at?: string
        }
      }
      vendor_reviews: {
        Row: {
          id: string
          vendor_id: string
          user_id: string
          user_name: string
          rating: number
          comment: string
          photos: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          user_id: string
          user_name: string
          rating: number
          comment: string
          photos?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          user_id?: string
          user_name?: string
          rating?: number
          comment?: string
          photos?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      vendor_bookings: {
        Row: {
          id: string
          vendor_id: string
          user_id: string
          event_date: string
          event_type: string
          package_id: string | null
          custom_requirements: string | null
          total_amount: number
          advance_amount: number | null
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          payment_status: 'pending' | 'partial' | 'paid' | 'refunded'
          booking_date: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          user_id: string
          event_date: string
          event_type: string
          package_id?: string | null
          custom_requirements?: string | null
          total_amount: number
          advance_amount?: number | null
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          payment_status?: 'pending' | 'partial' | 'paid' | 'refunded'
          booking_date: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          user_id?: string
          event_date?: string
          event_type?: string
          package_id?: string | null
          custom_requirements?: string | null
          total_amount?: number
          advance_amount?: number | null
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          payment_status?: 'pending' | 'partial' | 'paid' | 'refunded'
          booking_date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      vendor_inquiries: {
        Row: {
          id: string
          vendor_id: string
          user_id: string
          user_name: string
          user_email: string
          user_phone: string | null
          subject: string
          message: string
          event_date: string | null
          event_type: string | null
          budget: number | null
          status: 'new' | 'read' | 'replied' | 'closed'
          vendor_response: string | null
          response_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          user_id: string
          user_name: string
          user_email: string
          user_phone?: string | null
          subject: string
          message: string
          event_date?: string | null
          event_type?: string | null
          budget?: number | null
          status?: 'new' | 'read' | 'replied' | 'closed'
          vendor_response?: string | null
          response_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          user_id?: string
          user_name?: string
          user_email?: string
          user_phone?: string | null
          subject?: string
          message?: string
          event_date?: string | null
          event_type?: string | null
          budget?: number | null
          status?: 'new' | 'read' | 'replied' | 'closed'
          vendor_response?: string | null
          response_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      priority_level: 'high' | 'medium' | 'low'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
