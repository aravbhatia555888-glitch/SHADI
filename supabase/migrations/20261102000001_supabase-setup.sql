-- ShaadiBazaar Database Setup Script
-- Run this in your Supabase SQL Editor

-- L8 fix: removed `ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;`
-- RLS on Supabase's managed auth schema is owned by Supabase itself;
-- toggling it here had no effect on this app's queries and does not
-- belong in a project migration.

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  wedding_date TIMESTAMPTZ,
  partner_name TEXT,
  partner_email TEXT,
  profile_image_url TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for soft-deleted users
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at) WHERE deleted_at IS NOT NULL;

-- Create enhanced vendors table with geolocation
CREATE TABLE IF NOT EXISTS vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  location JSONB NOT NULL, -- Enhanced location with lat/lng
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  price_range TEXT NOT NULL,
  min_price DECIMAL(10,2),
  max_price DECIMAL(10,2),
  cover_image TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}',
  completed_bookings INTEGER DEFAULT 0,
  gallery TEXT[] DEFAULT '{}',
  contact JSONB NOT NULL,
  features JSONB[] DEFAULT '{}',
  services JSONB[] DEFAULT '{}',
  packages JSONB[] DEFAULT '{}',
  availability JSONB[] DEFAULT '{}', -- Enhanced availability with time slots
  is_available BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  business_hours JSONB,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create checklist_items table
CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  completed BOOLEAN DEFAULT false,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create budget_items table
CREATE TABLE IF NOT EXISTS budget_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  estimated DECIMAL(10,2) NOT NULL DEFAULT 0,
  spent DECIMAL(10,2) NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create budget_expenses table
CREATE TABLE IF NOT EXISTS budget_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_item_id UUID REFERENCES budget_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  paid BOOLEAN DEFAULT false,
  vendor TEXT,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create wedding_details table
CREATE TABLE IF NOT EXISTS wedding_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_name TEXT NOT NULL,
  wedding_date TIMESTAMPTZ NOT NULL,
  wedding_location TEXT NOT NULL,
  total_budget DECIMAL(12,2) NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create favorite_vendors table
CREATE TABLE IF NOT EXISTS favorite_vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, vendor_id)
);

-- Create vendor_reviews table
CREATE TABLE IF NOT EXISTS vendor_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  user_name TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, vendor_id) -- One review per user per vendor
);

-- Create vendor_bookings table
CREATE TABLE IF NOT EXISTS vendor_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  event_type TEXT NOT NULL,
  package_id TEXT,
  custom_requirements TEXT,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  advance_amount DECIMAL(10,2) DEFAULT 0,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
  payment_status TEXT CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded')) DEFAULT 'pending',
  booking_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vendor_inquiries table
CREATE TABLE IF NOT EXISTS vendor_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  event_date TIMESTAMPTZ,
  event_type TEXT,
  budget DECIMAL(10,2),
  status TEXT CHECK (status IN ('new', 'read', 'replied', 'closed')) DEFAULT 'new',
  vendor_response TEXT,
  response_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_inquiries ENABLE ROW LEVEL SECURITY;

-- Force RLS on user-data tables (applies to table owners too, except service_role)
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE vendors FORCE ROW LEVEL SECURITY;
ALTER TABLE vendor_bookings FORCE ROW LEVEL SECURITY;
ALTER TABLE vendor_inquiries FORCE ROW LEVEL SECURITY;
ALTER TABLE favorite_vendors FORCE ROW LEVEL SECURITY;
ALTER TABLE vendor_reviews FORCE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Checklist
DROP POLICY IF EXISTS "Users can manage own checklist" ON checklist_items;
CREATE POLICY "Users can manage own checklist" ON checklist_items
  FOR ALL USING (auth.uid() = user_id);

-- Budget
DROP POLICY IF EXISTS "Users can manage own budget" ON budget_items;
CREATE POLICY "Users can manage own budget" ON budget_items
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own expenses" ON budget_expenses;
CREATE POLICY "Users can manage own expenses" ON budget_expenses
  FOR ALL USING (auth.uid() = user_id);

-- Wedding details
DROP POLICY IF EXISTS "Users can manage own wedding details" ON wedding_details;
CREATE POLICY "Users can manage own wedding details" ON wedding_details
  FOR ALL USING (auth.uid() = user_id);

-- Favorite vendors
DROP POLICY IF EXISTS "Users can manage own favorites" ON favorite_vendors;
CREATE POLICY "Users can manage own favorites" ON favorite_vendors
  FOR ALL USING (auth.uid() = user_id);

-- Vendors (public read, owner-only write, server-only sensitive columns)
DROP POLICY IF EXISTS "Anyone can view vendors" ON vendors;
CREATE POLICY "Anyone can view vendors" ON vendors
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage vendors" ON vendors;
DROP POLICY IF EXISTS "Users can insert own vendors" ON vendors;
DROP POLICY IF EXISTS "Users can update own vendors" ON vendors;
DROP POLICY IF EXISTS "Users can delete own vendors" ON vendors;

CREATE POLICY "Users can insert own vendors" ON vendors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vendors" ON vendors
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vendors" ON vendors
  FOR DELETE USING (auth.uid() = user_id);

-- Vendor reviews
DROP POLICY IF EXISTS "Anyone can view reviews" ON vendor_reviews;
CREATE POLICY "Anyone can view reviews" ON vendor_reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own reviews" ON vendor_reviews;
CREATE POLICY "Users can manage own reviews" ON vendor_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reviews" ON vendor_reviews;
CREATE POLICY "Users can update own reviews" ON vendor_reviews
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reviews" ON vendor_reviews;
CREATE POLICY "Users can delete own reviews" ON vendor_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Vendor bookings (users create/view own; status updates are server-only via Edge Functions)
DROP POLICY IF EXISTS "Users can manage own bookings" ON vendor_bookings;
CREATE POLICY "Users can view own bookings" ON vendor_bookings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own bookings" ON vendor_bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
-- No UPDATE policy: booking status/payment_status are only updated by Edge Functions (service_role, bypasses RLS)

-- Vendor inquiries
DROP POLICY IF EXISTS "Users can manage own inquiries" ON vendor_inquiries;
CREATE POLICY "Users can manage own inquiries" ON vendor_inquiries
  FOR ALL USING (auth.uid() = user_id);

-- Add subscription columns to vendors (needed by trigger below and subscription system)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS featured_expires_at TIMESTAMPTZ;

-- Add computed columns for faster geo queries
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10,8) GENERATED ALWAYS AS ((location->>'latitude')::DECIMAL) STORED;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11,8) GENERATED ALWAYS AS ((location->>'longitude')::DECIMAL) STORED;

-- Trigger: prevent client writes to server-only vendor columns
-- subscription_tier, verified, featured, rating, review_count, completed_bookings
-- are only set by Edge Functions (service_role) or admin operations.
-- Handles both INSERT and UPDATE.
CREATE OR REPLACE FUNCTION protect_vendor_sensitive_columns()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('service_role', 'supabase_admin') THEN
    IF TG_OP = 'INSERT' THEN
      -- On INSERT, reject if any sensitive column is set to a non-default value
      IF (NEW.subscription_tier IS NOT NULL AND NEW.subscription_tier != 'free')
         OR NEW.verified = true
         OR NEW.featured = true
         OR (NEW.rating IS NOT NULL AND NEW.rating != 0)
         OR (NEW.review_count IS NOT NULL AND NEW.review_count != 0)
         OR (NEW.completed_bookings IS NOT NULL AND NEW.completed_bookings != 0) THEN
        RAISE EXCEPTION 'Cannot set server-only vendor columns on insert';
      END IF;
    ELSIF TG_OP = 'UPDATE' THEN
      -- On UPDATE, reject if any sensitive column changed
      IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier
         OR NEW.verified IS DISTINCT FROM OLD.verified
         OR NEW.featured IS DISTINCT FROM OLD.featured
         OR NEW.rating IS DISTINCT FROM OLD.rating
         OR NEW.review_count IS DISTINCT FROM OLD.review_count
         OR NEW.completed_bookings IS DISTINCT FROM OLD.completed_bookings THEN
        RAISE EXCEPTION 'Cannot modify server-only vendor columns';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_vendor_sensitive ON vendors;
CREATE TRIGGER trg_protect_vendor_sensitive
  BEFORE INSERT OR UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION protect_vendor_sensitive_columns();

-- updated_at trigger for all tables with updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_vendors_updated_at ON vendors;
CREATE TRIGGER set_vendors_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_checklist_items_updated_at ON checklist_items;
CREATE TRIGGER set_checklist_items_updated_at BEFORE UPDATE ON checklist_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_budget_items_updated_at ON budget_items;
CREATE TRIGGER set_budget_items_updated_at BEFORE UPDATE ON budget_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_budget_expenses_updated_at ON budget_expenses;
CREATE TRIGGER set_budget_expenses_updated_at BEFORE UPDATE ON budget_expenses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_wedding_details_updated_at ON wedding_details;
CREATE TRIGGER set_wedding_details_updated_at BEFORE UPDATE ON wedding_details
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_vendor_reviews_updated_at ON vendor_reviews;
CREATE TRIGGER set_vendor_reviews_updated_at BEFORE UPDATE ON vendor_reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_vendor_bookings_updated_at ON vendor_bookings;
CREATE TRIGGER set_vendor_bookings_updated_at BEFORE UPDATE ON vendor_bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_vendor_inquiries_updated_at ON vendor_inquiries;
CREATE TRIGGER set_vendor_inquiries_updated_at BEFORE UPDATE ON vendor_inquiries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_checklist_user_id ON checklist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_due_date ON checklist_items(due_date);
CREATE INDEX IF NOT EXISTS idx_budget_items_user_id ON budget_items(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_user_id ON budget_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_budget_item_id ON budget_expenses(budget_item_id);
CREATE INDEX IF NOT EXISTS idx_wedding_details_user_id ON wedding_details(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_vendors_user_id ON favorite_vendors(user_id);

-- Vendor indexes (optimized for marketplace queries)
CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(category);
CREATE INDEX IF NOT EXISTS idx_vendors_featured ON vendors(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_vendors_rating ON vendors(rating DESC);
CREATE INDEX IF NOT EXISTS idx_vendors_featured_rating ON vendors(featured, rating DESC);
CREATE INDEX IF NOT EXISTS idx_vendors_category_rating ON vendors(category, rating DESC);
CREATE INDEX IF NOT EXISTS idx_vendors_price ON vendors(min_price, max_price);
CREATE INDEX IF NOT EXISTS idx_vendors_available ON vendors(is_available) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_vendors_verified ON vendors(verified) WHERE verified = true;
CREATE INDEX IF NOT EXISTS idx_vendors_location_gin ON vendors USING GIN(location);
CREATE INDEX IF NOT EXISTS idx_vendors_location_lat ON vendors(location_lat);
CREATE INDEX IF NOT EXISTS idx_vendors_location_lng ON vendors(location_lng);
CREATE INDEX IF NOT EXISTS idx_vendors_created ON vendors(created_at DESC);

-- Composite index for common search pattern: category + available + rating
CREATE INDEX IF NOT EXISTS idx_vendors_search ON vendors(category, is_available, rating DESC);

-- Review indexes
CREATE INDEX IF NOT EXISTS idx_vendor_reviews_vendor_id ON vendor_reviews(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_reviews_vendor_created ON vendor_reviews(vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_reviews_user_id ON vendor_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_reviews_rating ON vendor_reviews(rating);

-- Booking indexes
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_vendor_id ON vendor_bookings(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_user_id ON vendor_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_event_date ON vendor_bookings(event_date);
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_status ON vendor_bookings(status);
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_vendor_status ON vendor_bookings(vendor_id, status);

-- Inquiry indexes
CREATE INDEX IF NOT EXISTS idx_vendor_inquiries_vendor_id ON vendor_inquiries(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_inquiries_user_id ON vendor_inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_inquiries_status ON vendor_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_vendor_inquiries_vendor_status ON vendor_inquiries(vendor_id, status);

-- Full-text search support (optional, requires pg_trgm extension)
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX IF NOT EXISTS idx_vendors_name_trgm ON vendors USING gin (name gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS idx_vendors_description_trgm ON vendors USING gin (description gin_trgm_ops);

-- Sample vendor data moved OUT of the main setup script (L3 fix):
-- running this file against a production project used to seed fake
-- vendors with placeholder phone numbers/emails. Load demo data
-- explicitly and only in non-production projects:
--   \i supabase-sample-data.sql   (or paste its contents)

-- Success message
SELECT 'ShaadiBazaar database setup completed successfully!' as message;
