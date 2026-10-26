/**
 * Verify Razorpay Payment Edge Function
 *
 * Performs HMAC-SHA256 verification of Razorpay payment signatures.
 * The RAZORPAY_KEY_SECRET lives ONLY in this function's environment.
 *
 * Setup:
 * 1. supabase functions deploy verify-razorpay-payment
 * 2. supabase secrets set RAZORPAY_KEY_SECRET=rzp_secret_xxxx
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// Persistent rate limit config (uses Supabase RPC — survives cold starts)
const RATE_LIMIT_KEY = "verify-payment";
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_SEC = 60;

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
      JSON.stringify({ verified: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // ── Auth: verify caller is authenticated ─────────────────────
    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") || "", {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ verified: false, error: "Unauthorized" }),
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
        JSON.stringify({ verified: false, error: "Payment service temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (rateOk !== true) {
      return new Response(
        JSON.stringify({ verified: false, error: "Too many requests. Please try again in a minute." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({
          verified: false,
          error: "Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!RAZORPAY_KEY_SECRET) {
      console.error("RAZORPAY_KEY_SECRET not configured");
      return new Response(
        JSON.stringify({
          verified: false,
          error: "Payment verification service not configured",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // HMAC-SHA256 verification
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(RAZORPAY_KEY_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBytes = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(payload)
    );
    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Constant-time signature comparison (S11 fix)
    const expectedBytes = encoder.encode(expectedSignature);
    const providedBytes = encoder.encode(razorpay_signature);
    if (expectedBytes.length !== providedBytes.length) {
      return new Response(
        JSON.stringify({ verified: false, error: "Invalid signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    let mismatch = 0;
    for (let i = 0; i < expectedBytes.length; i++) {
      mismatch |= expectedBytes[i] ^ providedBytes[i];
    }
    const verified = mismatch === 0;

    if (!verified) {
      console.error(
        "Payment signature mismatch for order:",
        razorpay_order_id,
        "payment:",
        razorpay_payment_id
      );
      return new Response(
        JSON.stringify({
          verified: false,
          order_id: razorpay_order_id,
          payment_id: razorpay_payment_id,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Check if this is a subscription payment ─────────────────────
    const { data: subPayment, error: subLookupError } = await adminClient
      .from("subscription_payments")
      .select("*")
      .eq("razorpay_order_id", razorpay_order_id)
      .single();

    if (subLookupError && subLookupError.code !== "PGRST116") {
      console.error("Subscription payment lookup failed:", subLookupError);
      return new Response(
        JSON.stringify({ verified: false, error: "Payment lookup failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (subPayment) {
      // Ownership check (S3 fix): payment must belong to the authenticated user
      if (subPayment.user_id !== user.id) {
        return new Response(
          JSON.stringify({ verified: false, error: "Payment does not belong to you" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Idempotency (S3 fix): if already verified, return success without re-processing
      if (subPayment.status === "verified" || subPayment.status === "paid") {
        return new Response(
          JSON.stringify({
            verified: true,
            subscription_activated: true,
            idempotent: true,
            order_id: razorpay_order_id,
            payment_id: razorpay_payment_id,
            vendor_id: subPayment.vendor_id,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: finalized, error: finalizeError } = await adminClient.rpc(
        "finalize_subscription_payment",
        {
          p_order_id: razorpay_order_id,
          p_payment_id: razorpay_payment_id,
          p_signature: razorpay_signature,
          p_user_id: user.id,
        }
      );

      if (finalizeError || !finalized?.found) {
        console.error("Subscription finalization failed:", finalizeError);
        return new Response(
          JSON.stringify({ verified: false, error: "Payment finalization failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          verified: true,
          subscription_activated: true,
          order_id: razorpay_order_id,
          payment_id: razorpay_payment_id,
          vendor_id: subPayment.vendor_id,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Booking payment — record and confirm ──────────────────────
    const { data: txPayment, error: txLookupError } = await adminClient
      .from("payment_transactions")
      .select("*")
      .eq("razorpay_order_id", razorpay_order_id)
      .single();

    if (txLookupError && txLookupError.code !== "PGRST116") {
      console.error("Booking payment lookup failed:", txLookupError);
      return new Response(
        JSON.stringify({ verified: false, error: "Payment lookup failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (txPayment) {
      // Ownership check: payment must belong to the authenticated user
      if (txPayment.user_id !== user.id) {
        return new Response(
          JSON.stringify({ verified: false, error: "Payment does not belong to you" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Idempotency: if already paid, return success without re-processing
      if (txPayment.status === "paid") {
        return new Response(
          JSON.stringify({
            verified: true,
            payment_recorded: true,
            idempotent: true,
            order_id: razorpay_order_id,
            payment_id: razorpay_payment_id,
            booking_id: txPayment.booking_id,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: finalized, error: finalizeError } = await adminClient.rpc(
        "finalize_booking_payment",
        {
          p_order_id: razorpay_order_id,
          p_payment_id: razorpay_payment_id,
          p_signature: razorpay_signature,
          p_user_id: user.id,
        }
      );

      if (finalizeError || !finalized?.found) {
        console.error("Booking finalization failed:", finalizeError);
        return new Response(
          JSON.stringify({ verified: false, error: "Payment finalization failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          verified: true,
          payment_recorded: true,
          order_id: razorpay_order_id,
          payment_id: razorpay_payment_id,
          booking_id: txPayment.booking_id,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Unknown order — never report success without a tracked order ──
    console.error("Verified payment for unknown order:", razorpay_order_id);
    return new Response(
      JSON.stringify({
        verified: false,
        error: "Payment order not found",
      }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Verify payment error:", err);
    return new Response(
      JSON.stringify({
        verified: false,
        error: "Internal verification error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
