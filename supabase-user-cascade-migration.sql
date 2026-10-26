-- User Foreign Key ON DELETE CASCADE Migration
-- Ensures proper cascading cleanup when an auth user account is deleted, preventing FK constraint violations.

-- 1. checklist_items
ALTER TABLE checklist_items DROP CONSTRAINT IF EXISTS checklist_items_user_id_fkey;
ALTER TABLE checklist_items ADD CONSTRAINT checklist_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. budget_items
ALTER TABLE budget_items DROP CONSTRAINT IF EXISTS budget_items_user_id_fkey;
ALTER TABLE budget_items ADD CONSTRAINT budget_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. budget_expenses
ALTER TABLE budget_expenses DROP CONSTRAINT IF EXISTS budget_expenses_user_id_fkey;
ALTER TABLE budget_expenses ADD CONSTRAINT budget_expenses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. wedding_details
ALTER TABLE wedding_details DROP CONSTRAINT IF EXISTS wedding_details_user_id_fkey;
ALTER TABLE wedding_details ADD CONSTRAINT wedding_details_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. favorite_vendors
ALTER TABLE favorite_vendors DROP CONSTRAINT IF EXISTS favorite_vendors_user_id_fkey;
ALTER TABLE favorite_vendors ADD CONSTRAINT favorite_vendors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 6. vendor_reviews
ALTER TABLE vendor_reviews DROP CONSTRAINT IF EXISTS vendor_reviews_user_id_fkey;
ALTER TABLE vendor_reviews ADD CONSTRAINT vendor_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 7. vendor_bookings
ALTER TABLE vendor_bookings DROP CONSTRAINT IF EXISTS vendor_bookings_user_id_fkey;
ALTER TABLE vendor_bookings ADD CONSTRAINT vendor_bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 8. vendor_inquiries
ALTER TABLE vendor_inquiries DROP CONSTRAINT IF EXISTS vendor_inquiries_user_id_fkey;
ALTER TABLE vendor_inquiries ADD CONSTRAINT vendor_inquiries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 9. payment_transactions
ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_user_id_fkey;
ALTER TABLE payment_transactions ADD CONSTRAINT payment_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 10. subscription_payments
ALTER TABLE subscription_payments DROP CONSTRAINT IF EXISTS subscription_payments_user_id_fkey;
ALTER TABLE subscription_payments ADD CONSTRAINT subscription_payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 11. vendor_subscriptions
ALTER TABLE vendor_subscriptions DROP CONSTRAINT IF EXISTS vendor_subscriptions_user_id_fkey;
ALTER TABLE vendor_subscriptions ADD CONSTRAINT vendor_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
