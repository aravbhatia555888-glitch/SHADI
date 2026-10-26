-- ============================================================
-- ShaadiBazaar SAMPLE DATA (demo only — do NOT run in production)
-- Extracted from supabase-setup.sql (L3 fix) so production setups no
-- longer seed fake vendors with placeholder contact details by default.
-- Requires: supabase-setup.sql already executed.
-- ============================================================

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
