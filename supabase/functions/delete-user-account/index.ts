/**
 * Delete User Account Edge Function  (C4 + M8 rewrite)
 *
 * Previous version purged 14 tables, then called auth.admin.deleteUser()
 * which ALWAYS failed: profiles.id -> auth.users has no ON DELETE action,
 * and vendors.user_id was not covered by the cascade migration. Net
 * effect: data destroyed, account alive, user stuck.
 *
 * This version:
 *  1. Deletes the profile ROW first (its PK references auth.users).
 *  2. Deletes vendor listings owned by the user BEFORE deleting the auth
 *     user (vendors.user_id FK) - dependent rows cascade.
 *  3. RETAINS financial ledgers (payment_transactions,
 *     subscription_payments): supabase-account-deletion-retention.sql
 *     changed their user/booking/vendor FKs to ON DELETE SET NULL, so
 *     deleteUser anonymizes them instead of destroying them (M8 PRODUCT
 *     DEFAULT: retain transaction records, detach personal identifiers).
 *  4. Writes a best-effort audit entry before the irreversible step.
 *
 * Setup: supabase functions deploy delete-user-account
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

const ALLOWED_ORIGINS = [
  "https://shaadibazaar.com",
  "https://www.shaadibazaar.com",
  "http://localhost:8081",
  "http://localhost:19006",
  "exp://localhost:19000",
];

serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : null;
  const corsHeaders: Record<string, string> = {
    ...(allowOrigin ? { "Access-Control-Allow-Origin": allowOrigin } : {}),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1) Purge personal planning data + PII-bearing rows (financial
    //    ledgers intentionally NOT deleted - see header comment).
    await Promise.allSettled([
      adminClient.from("user_push_tokens").delete().eq("user_id", user.id),
      adminClient.from("checklist_items").delete().eq("user_id", user.id),
      adminClient.from("budget_expenses").delete().eq("user_id", user.id),
      adminClient.from("budget_items").delete().eq("user_id", user.id),
      adminClient.from("wedding_details").delete().eq("user_id", user.id),
      adminClient.from("favorite_vendors").delete().eq("user_id", user.id),
      adminClient.from("favorite_articles").delete().eq("user_id", user.id),
      adminClient.from("ai_usage_logs").delete().eq("user_id", user.id),
      adminClient.from("vendor_bookings").delete().eq("user_id", user.id),
      adminClient.from("vendor_reviews").delete().eq("user_id", user.id),
      adminClient.from("vendor_inquiries").delete().eq("user_id", user.id),
    ]);

    // 2) Remove vendor listings owned by this user BEFORE deleting the
    //    auth user (vendors.user_id FK blocks deleteUser otherwise).
    //    Dependent subscriptions/inquiries/bookings-by-others/chats
    //    cascade; payment ledgers are retained via ON DELETE SET NULL.
    await adminClient.from("vendors").delete().eq("user_id", user.id);

    // 3) Audit BEFORE the irreversible step (best-effort).
    await adminClient.from("audit_log").insert({
      user_id: user.id,
      action: "account.deleted",
      entity_type: "auth.users",
      entity_id: user.id,
    });

    // 4) Delete the profile row - its id REFERENCES auth.users(id), so it
    //    MUST be gone before deleteUser() (the old soft-delete kept the
    //    row and broke deletion for every user).
    const { error: profileError } = await adminClient
      .from("profiles")
      .delete()
      .eq("id", user.id);
    if (profileError) {
      console.error("Failed to delete profile row:", profileError);
      return new Response(
        JSON.stringify({ error: "Failed to delete account data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5) Delete the auth user. Remaining user-owned financial rows are
    //    anonymized in place by their ON DELETE SET NULL foreign keys.
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error("Failed to delete auth user:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete account" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Delete account error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
