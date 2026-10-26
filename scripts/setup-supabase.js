#!/usr/bin/env node

/**
 * Supabase Setup Script for ShaadiBazaar
 * Automatically sets up database tables and RLS policies
 */

const fs = require('fs');
const path = require('path');

const SQL_SETUP = `
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  wedding_date TIMESTAMPTZ,
  partner_name TEXT,
  partner_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Vendors (public read, authenticated write)
DROP POLICY IF EXISTS "Anyone can view vendors" ON vendors;
CREATE POLICY "Anyone can view vendors" ON vendors
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage vendors" ON vendors;
CREATE POLICY "Authenticated users can manage vendors" ON vendors
  FOR ALL USING (auth.role() = 'authenticated');

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

-- Vendor bookings
DROP POLICY IF EXISTS "Users can view own bookings" ON vendor_bookings;
CREATE POLICY "Users can view own bookings" ON vendor_bookings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own bookings" ON vendor_bookings;
CREATE POLICY "Users can create own bookings" ON vendor_bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
-- No UPDATE policy: booking status/payment_status are only updated by Edge Functions (service_role, bypasses RLS)

-- Vendor inquiries
DROP POLICY IF EXISTS "Users can manage own inquiries" ON vendor_inquiries;
CREATE POLICY "Users can manage own inquiries" ON vendor_inquiries
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_checklist_user_id ON checklist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_due_date ON checklist_items(due_date);
CREATE INDEX IF NOT EXISTS idx_budget_items_user_id ON budget_items(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_user_id ON budget_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_budget_item_id ON budget_expenses(budget_item_id);
CREATE INDEX IF NOT EXISTS idx_wedding_details_user_id ON wedding_details(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_vendors_user_id ON favorite_vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(category);
CREATE INDEX IF NOT EXISTS idx_vendors_featured ON vendors(featured);
CREATE INDEX IF NOT EXISTS idx_vendors_rating ON vendors(rating);
CREATE INDEX IF NOT EXISTS idx_vendors_location ON vendors USING GIN(location);
CREATE INDEX IF NOT EXISTS idx_vendor_reviews_vendor_id ON vendor_reviews(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_reviews_user_id ON vendor_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_reviews_rating ON vendor_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_vendor_id ON vendor_bookings(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_user_id ON vendor_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_event_date ON vendor_bookings(event_date);
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_status ON vendor_bookings(status);
CREATE INDEX IF NOT EXISTS idx_vendor_inquiries_vendor_id ON vendor_inquiries(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_inquiries_user_id ON vendor_inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_inquiries_status ON vendor_inquiries(status);

-- Insert sample vendors data with enhanced location
INSERT INTO vendors (
  name, category, description, location, rating, review_count,
  price_range, min_price, max_price, cover_image, contact,
  is_available, featured, verified
) VALUES
(
  'Royal Palace Banquets',
  'Venue',
  'Luxurious banquet hall perfect for grand weddings',
  '{"address": "123 Palace Road", "city": "Mumbai", "state": "Maharashtra", "country": "India", "pincode": "400001", "latitude": 19.0760, "longitude": 72.8777}',
  4.8,
  156,
  '₹2,00,000 - ₹5,00,000',
  200000,
  500000,
  'https://images.unsplash.com/photo-1519167758481-83f29c8d8d86',
  '{"phone": "+91-9876543210", "email": "info@royalpalace.com", "website": "https://royalpalace.com"}',
  true,
  true,
  true
),
(
  'Mehndi Magic',
  'Mehndi Artist',
  'Traditional and contemporary mehndi designs',
  '{"address": "456 Art Street", "city": "Delhi", "state": "Delhi", "country": "India", "pincode": "110001", "latitude": 28.7041, "longitude": 77.1025}',
  4.9,
  89,
  '₹15,000 - ₹50,000',
  15000,
  50000,
  'https://images.unsplash.com/photo-1583391733956-6c78276477e2',
  '{"phone": "+91-9876543211", "email": "contact@mehndimagic.com", "instagram": "@mehndimagic"}',
  true,
  true,
  true
),
(
  'Capture Moments',
  'Photography',
  'Professional wedding photography and videography',
  '{"address": "789 Camera Lane", "city": "Bangalore", "state": "Karnataka", "country": "India", "pincode": "560001", "latitude": 12.9716, "longitude": 77.5946}',
  4.7,
  234,
  '₹80,000 - ₹2,50,000',
  80000,
  250000,
  'https://images.unsplash.com/photo-1606216794074-735e91aa2c92',
  '{"phone": "+91-9876543212", "email": "hello@capturemoments.com", "website": "https://capturemoments.com"}',
  true,
  true,
  true
)
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'ShaadiBazaar database setup completed successfully!' as message;
`;

function createSetupFile() {
  const setupPath = path.join(__dirname, '..', 'supabase-setup.sql');

  fs.writeFileSync(setupPath, SQL_SETUP, 'utf8');

  console.log('✅ Created supabase-setup.sql file');
  console.log('📁 Location:', setupPath);
  console.log('');
  console.log('🚀 Next steps:');
  console.log('1. Copy the SQL content from supabase-setup.sql');
  console.log('2. Go to your Supabase dashboard');
  console.log('3. Navigate to SQL Editor');
  console.log('4. Paste and run the SQL script');
  console.log('5. Configure your .env file with Supabase credentials');
  console.log('');
  console.log('🎉 Your ShaadiBazaar database will be ready!');
}

// Check if running as script
if (require.main === module) {
  createSetupFile();
}

module.exports = { createSetupFile, SQL_SETUP };
