/**
 * Create Razorpay Order Edge Function
 *
 * Creates a Razorpay order for bookings or subscriptions.
 * The RAZORPAY_KEY_SECRET lives ONLY in this function's environment.
 * The public RAZORPAY_KEY_ID is returned to the client for checkout.
 *
 * Setup:
 * 1. supabase functions deploy create-razorpay-order
 * 2. supabase secrets set RAZORPAY_KEY_ID=rzp_live_xxxx RAZORPAY_KEY_SECRET=xxxx
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID") || "";
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const ALLOWED_ORIGINS = [
  "https://shaadibazaar.com",
  "https://www.shaadibazaar.com",
  "http://localhost:8081",
  "http://localhost:19006",
  "exp://localhost:19000",
];

// Canonical plan prices in paise — server-side source of truth (S2 fix)
const PLAN_PRICES: Record<string, number> = {
  basic: 50000,   // ₹500 in paise
  premium: 200000, // ₹2000 in paise
  elite: 500000,   // ₹5000 in paise
};

// Persistent rate limit config (uses Supabase RPC — survives cold starts)
const RATE_LIMIT_KEY = "create-order";
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_SEC = 60;
const MAX_PAYMENT_AMOUNT_PAISE = 500_000_000; // ₹50,00,000

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
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // ── Auth ──────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") || "", {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting via persistent Supabase RPC
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: rateOk, error: rateError } = await adminClient.rpc("check_rate_limit", {
      p_key: `${RATE_LIMIT_KEY}:${user.id}`,
      p_limit: RATE_LIMIT_MAX,
      p_window_seconds: RATE_LIMIT_WINDOW_SEC,
    });

    if (rateError) {
      console.error("Rate limit check failed:", rateError);
      return new Response(
        JSON.stringify({ error: "Payment service temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (rateOk !== true) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again in a minute." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Validate secrets ──────────────────────────────────────────
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error("Razorpay keys not configured");
      return new Response(
        JSON.stringify({ error: "Payment service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Parse request ─────────────────────────────────────────────
    const body = await req.json();
    const { currency, notes } = body;
    let amount: number;

    if (!notes) {
      return new Response(
        JSON.stringify({ error: "Missing required field: notes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (currency && currency !== "INR") {
      return new Response(
        JSON.stringify({ error: "Unsupported currency" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Server-side price validation for subscriptions (S2 fix) ───
    // For subscription payments, IGNORE the client amount and use the canonical price.
    if (notes?.type === "subscription" && notes?.plan) {
      const canonicalPrice = PLAN_PRICES[notes.plan];
      if (canonicalPrice === undefined) {
        return new Response(
          JSON.stringify({ error: "Invalid subscription plan" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      amount = canonicalPrice;
      const { data: vendor } = await adminClient
        .from("vendors")
        .select("user_id")
        .eq("id", notes.vendor_id)
        .single();

      if (!vendor || vendor.user_id !== user.id) {
        return new Response(
          JSON.stringify({ error: "Vendor not found or not owned by you" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (notes?.booking_id && notes?.vendor_id && !notes?.type) {
      const { data: booking } = await adminClient
        .from("vendor_bookings")
        .select("user_id, vendor_id, total_amount, advance_amount, payment_status, status")
        .eq("id", notes.booking_id)
        .single();

      if (
        !booking ||
        booking.user_id !== user.id ||
        booking.vendor_id !== notes.vendor_id
      ) {
        return new Response(
          JSON.stringify({ error: "Booking not found or not owned by you" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (booking.payment_status === "paid") {
        return new Response(
          JSON.stringify({ error: "Booking is already paid" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // M5 fix: never open an order for a cancelled booking. The finalize RPC
      // also refuses cancelled bookings, so charging here would strand the
      // customer's money on a dead booking.
      if (booking.status === "cancelled") {
        return new Response(
          JSON.stringify({ error: "This booking was cancelled and can no longer be paid" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      let paymentType = notes.payment_type === "advance" ? "advance" : "full";
      let authoritativeAmount = 0;

      if (booking.payment_status === "partial") {
        // Booking has already received advance payment; charge the remaining balance
        const total = Number(booking.total_amount);
        const advance = Number(booking.advance_amount);
        authoritativeAmount = total - advance;

        if (authoritativeAmount <= 0) {
          return new Response(
            JSON.stringify({ error: "No remaining balance for this booking" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        paymentType = "remaining";
        notes.payment_type = "remaining";
        notes.advance_percentage = "75";
      } else {
        // Initial booking payment: full or advance
        authoritativeAmount = paymentType === "advance"
          ? Number(booking.advance_amount)
          : Number(booking.total_amount);
        notes.payment_type = paymentType;
        notes.advance_percentage = paymentType === "advance" ? "25" : "100";
      }

      amount = Math.round(authoritativeAmount * 100);
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid payment context" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For all payments, ensure amount is positive and within reasonable bounds
    if (amount <= 0 || amount > MAX_PAYMENT_AMOUNT_PAISE) {
      return new Response(
        JSON.stringify({ error: "Invalid payment amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Razorpay receipts have a short length limit. Never forward the client's
    // UUID-based receipt; generate a compact, collision-resistant value here.
    const receipt = `sb_${Date.now().toString(36)}_${crypto.randomUUID()
      .replaceAll("-", "")
      .slice(0, 12)}`;

    // ── Create Razorpay Order ─────────────────────────────────────
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
      },
      body: JSON.stringify({
        amount, // in paise
        currency: currency || "INR",
        receipt,
        notes: notes || {},
      }),
    });

    if (!razorpayResponse.ok) {
      const errBody = await razorpayResponse.text();
      console.error("Razorpay order creation failed:", errBody);
      return new Response(
        JSON.stringify({ error: "Failed to create payment order" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const order = await razorpayResponse.json();

    // ── Track subscription payments in DB ─────────────────────────
    if (notes?.type === "subscription" && notes?.vendor_id && notes?.plan) {
      const { error: trackingError } = await adminClient.from("subscription_payments").insert({
        vendor_id: notes.vendor_id,
        user_id: user.id,
        plan: notes.plan,
        razorpay_order_id: order.id,
        amount: amount / 100, // convert paise back to INR for storage
        currency: currency || "INR",
        status: "created",
        metadata: {
          interval: notes.interval || "month",
          receipt,
        },
      });
      if (trackingError) {
        console.error("Failed to track subscription order:", trackingError);
        return new Response(
          JSON.stringify({ error: "Failed to initialize payment tracking" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── Track booking payments in DB ──────────────────────────────
    if (notes?.booking_id && notes?.vendor_id && !notes?.type) {
      const { error: trackingError } = await adminClient.from("payment_transactions").insert({
        booking_id: notes.booking_id,
        user_id: user.id,
        vendor_id: notes.vendor_id,
        razorpay_order_id: order.id,
        amount: amount / 100, // convert paise back to INR for storage
        currency: currency || "INR",
        status: "created",
        payment_type: notes.payment_type || "full",
        advance_percentage: notes.advance_percentage ? Number(notes.advance_percentage) : null,
      });
      if (trackingError) {
        console.error("Failed to track booking order:", trackingError);
        return new Response(
          JSON.stringify({ error: "Failed to initialize payment tracking" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── Return order details to client ────────────────────────────
    return new Response(
      JSON.stringify({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: RAZORPAY_KEY_ID, // public key — safe to return
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Create order error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
