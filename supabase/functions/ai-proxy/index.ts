/**
 * AI Proxy Edge Function
 *
 * SECURE bridge between the ShaadiBazaar app and OpenAI.
 * The OpenAI API key lives ONLY in this function's environment variables.
 *
 * ---
 * Setup:
 * 1. supabase functions deploy ai-proxy
 * 2. Set OPENAI_API_KEY in Supabase Edge Function secrets
 * 3. Optionally set AI_USAGE_LIMIT_FREE, AI_USAGE_LIMIT_BASIC, etc.
 * ---
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Allowed origins for CORS — lock to actual production domains
const ALLOWED_ORIGINS = [
  "https://shaadibazaar.com",
  "https://www.shaadibazaar.com",
  "http://localhost:8081",
  "http://localhost:19006",
  "exp://localhost:19000",
];

// Daily AI usage limits per subscription plan
const USAGE_LIMITS: Record<string, number> = {
  free: 5,
  basic: 20,
  premium: 100,
  elite: -1, // unlimited
};

// Server-side bounds for client-supplied parameters (S16 fix)
const MAX_TOKENS_LIMIT = 4096;
const MAX_TEMPERATURE = 1.5;

// Persistent rate limit config (uses Supabase RPC — survives cold starts)
const RATE_LIMIT_KEY = "ai-proxy";
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_SEC = 60;

serve(async (req) => {
  // ── CORS headers (S13 fix: don't echo origin for non-matching requests) ──
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
    // ── Auth ──────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", code: "UNAUTHORIZED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting via persistent Supabase RPC
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: rateOk } = await adminClient.rpc("check_rate_limit", {
      p_key: `${RATE_LIMIT_KEY}:${user.id}`,
      p_limit: RATE_LIMIT_MAX,
      p_window_seconds: RATE_LIMIT_WINDOW_SEC,
    });

    if (rateOk === false) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please wait a moment.", code: "RATE_LIMITED" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Parse request ────────────────────────────────────────────
    const body = await req.json();

    // Handle credit check action
    if (body.action === "credits") {
      const { plan } = await getUserSubscription(supabase, user.id);
      const limit = USAGE_LIMITS[plan] || 5;
      const { count } = await getTodayUsage(supabase, user.id);

      return new Response(
        JSON.stringify({
          remaining: Math.max(0, limit - count),
          limit,
          resets_at: getNextMidnightISO(),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate required fields
    const { feature, prompt, systemPrompt, maxTokens: rawMaxTokens, temperature: rawTemperature } = body;
    if (!prompt || !feature) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: prompt, feature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Bound client-supplied parameters (S16 fix)
    const maxTokens = Math.min(Math.max(Number(rawMaxTokens) || 500, 1), MAX_TOKENS_LIMIT);
    const temperature = Math.min(Math.max(Number(rawTemperature) ?? 0.7, 0), MAX_TEMPERATURE);

    // ── Quota check ────────────────────────────────────────────────
    const { plan, subscriptionTier } = await getUserSubscription(supabase, user.id);
    const limit = USAGE_LIMITS[plan] || 5;
    const { count, error: countError } = await getTodayUsage(adminClient, user.id);

    if (countError) {
      console.error("Failed to count usage:", countError);
    }

    if (count >= limit) {
      return new Response(
        JSON.stringify({
          error: `Daily AI request limit reached (${limit}/day). Upgrade your plan for more.`,
          code: "QUOTA_EXCEEDED",
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Call OpenAI ───────────────────────────────────────────────
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured", code: "CONFIG_ERROR" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // cheap & fast — ~$0.15/1M input tokens
        messages: [
          { role: "system", content: systemPrompt || "" },
          { role: "user", content: prompt },
        ],
        max_tokens: maxTokens || 500,
        temperature: temperature ?? 0.7,
      }),
    });

    if (!openAIResponse.ok) {
      const errorBody = await openAIResponse.text();
      console.error("OpenAI API error:", openAIResponse.status, errorBody);

      if (openAIResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again later.", code: "RATE_LIMITED" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          error: "AI service error. Please try again.",
          code: "AI_ERROR",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await openAIResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // ── Log usage (S5 fix: use service-role client) ──────────────
    await adminClient.from("ai_usage_logs").insert({
      user_id: user.id,
      feature,
      plan,
      subscription_tier: subscriptionTier,
      tokens_used: aiData.usage?.total_tokens || 0,
      created_at: new Date().toISOString(),
    });

    // ── Return response ───────────────────────────────────────────
    return new Response(
      JSON.stringify({ content, cached: false }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("AI proxy error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", code: "INTERNAL_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ─── Helpers ───────────────────────────────────────────────────────

async function getUserSubscription(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<{ plan: string; subscriptionTier: string }> {
  try {
    // First check vendor_subscriptions
    const { data } = await supabase
      .from("vendor_subscriptions")
      .select("plan")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.plan) {
      return { plan: data.plan, subscriptionTier: data.plan };
    }
  } catch {
    // Fall through to free
  }
  return { plan: "free", subscriptionTier: "free" };
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function getTodayStartUTC(): string {
  const now = new Date();
  const nowIST = new Date(now.getTime() + IST_OFFSET_MS);
  const startOfTodayIST = Date.UTC(
    nowIST.getUTCFullYear(),
    nowIST.getUTCMonth(),
    nowIST.getUTCDate(),
    0,
    0,
    0,
    0
  );
  return new Date(startOfTodayIST - IST_OFFSET_MS).toISOString();
}

function getNextMidnightISO(): string {
  const now = new Date();
  const nowIST = new Date(now.getTime() + IST_OFFSET_MS);
  const nextMidnightIST = Date.UTC(
    nowIST.getUTCFullYear(),
    nowIST.getUTCMonth(),
    nowIST.getUTCDate() + 1,
    0,
    0,
    0,
    0
  );
  return new Date(nextMidnightIST - IST_OFFSET_MS).toISOString();
}

async function getTodayUsage(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<{ count: number; error?: string }> {
  try {
    const todayStart = getTodayStartUTC();

    const { count, error } = await supabase
      .from("ai_usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", todayStart);

    return { count: count || 0, error: error?.message };
  } catch {
    return { count: 0 };
  }
}