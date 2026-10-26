/**
 * AI Proxy — Secure AI Features
 *
 * Architecture:
 * ┌──────────────┐   POST /generate    ┌──────────────────────┐   API call   ┌──────────┐
 * │  Client App   │ ───────────────►   │  Supabase Edge        │ ──────────►  │  OpenAI  │
 * │  (Expo)       │                    │  Function (server)    │              │          │
 * │               │ ◄──────────────── │                       │ ◄────────── │          │
 * │               │   AI response      │  API key is HERE     │   response   │          │
 * └──────────────┘                    └──────────────────────┘              └──────────┘
 *
 * SECURITY:
 * - OpenAI API key lives ONLY in the Edge Function environment variable
 * - Client sends request → Edge Function validates auth → calls OpenAI → returns result
 * - Rate limiting, request validation, and logging on the server side
 *
 * SETUP:
 * 1. Deploy the Edge Function:
 *    supabase functions deploy ai-proxy
 *
 * 2. Set environment variable in Supabase:
 *    OPENAI_API_KEY=sk-your-key-here
 *
 * 3. In your .env, set:
 *    EXPO_PUBLIC_AI_PROXY_URL=https://your-project.supabase.co/functions/v1/ai-proxy
 */

import { supabase } from "@/config/supabase";

// ─── Types ──────────────────────────────────────────────────────────

export type AIFeature =
  | "checklist-generator"
  | "budget-optimizer"
  | "wedding-planner"
  | "vendor-recommendation"
  | "content-assistant";

export interface AIProxyRequest {
  feature: AIFeature;
  prompt: string;
  context?: Record<string, unknown>;
  maxTokens?: number;
  temperature?: number;
}

export interface AIProxyResponse {
  success: boolean;
  content?: string;
  error?: string;
  cached?: boolean;
}

// ─── Feature Prompts ────────────────────────────────────────────────

const FEATURE_SYSTEM_PROMPTS: Record<AIFeature, string> = {
  "checklist-generator":
    "You are a wedding planning expert. Generate a detailed wedding checklist " +
    "with timelines, categories, and priority levels. Format as JSON array: " +
    "[{title, description, category, dueDate, priority}]. Be specific to Indian weddings.",

  "budget-optimizer":
    "You are a wedding budget consultant. Analyze the user's budget and provide " +
    "optimization suggestions. Focus on Indian wedding expenses like venue, " +
    "catering, photography, mehndi, and decorations. Provide actionable savings tips.",

  "wedding-planner":
    "You are a senior wedding planner specializing in Indian weddings. Provide " +
    "comprehensive planning advice covering venue selection, vendor coordination, " +
    "timeline management, rituals, and guest experience. Be practical and detailed.",

  "vendor-recommendation":
    "You are a wedding vendor matchmaker. Based on the user's preferences, budget, " +
    "and location, recommend suitable wedding vendors. Focus on Indian wedding vendors " +
    "like photographers, caterers, venues, makeup artists, and decorators.",

  "content-assistant":
    "You are a wedding content writer. Help the user write wedding-related content " +
    "like invitation wording, thank-you notes, speech drafts, or social media posts. " +
    "Be warm, culturally appropriate, and creative.",
};

// ─── API Call ───────────────────────────────────────────────────

export interface CallAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CallAIRequest {
  model?: string;
  messages: CallAIMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: string };
}

export interface CallAIResponse {
  content: string | null;
  error: string | null;
}

/**
 * Low-level AI call with raw messages format (OpenAI-compatible).
 * Used by ai-checklist.ts and ai-planner.ts for structured prompts.
 * Routes through the same secure proxy as askAI().
 */
export async function callAI(request: CallAIRequest): Promise<CallAIResponse> {
  try {
    const systemMessage = request.messages.find((m) => m.role === "system");
    const userMessages = request.messages.filter((m) => m.role !== "system");
    const prompt = userMessages.map((m) => m.content).join("\n");

    const { data, error } = await supabase.functions.invoke("ai-proxy", {
      body: {
        feature: "wedding-planner",
        prompt,
        context: {},
        systemPrompt: systemMessage?.content || "",
        maxTokens: request.max_tokens || 500,
        temperature: request.temperature ?? 0.7,
        responseFormat: request.response_format,
      },
    });

    if (error) {
      if (__DEV__) console.warn("AI proxy error:", error);
      return { content: null, error: error.message || "AI service error" };
    }

    return {
      content: data?.content || null,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI service unavailable";
    if (__DEV__) console.warn("callAI failed:", err);
    return { content: null, error: message };
  }
}

/**
 * Send an AI request through the proxy.
 *
 * The proxy server (Edge Function) handles:
 * 1. Authentication check (validates user session)
 * 2. Rate limiting (prevents abuse)
 * 3. OpenAI API call (with server-side key)
 * 4. Response caching (optional, for repeated queries)
 * 5. Usage logging (for billing / analytics)
 */
export async function askAI(request: AIProxyRequest): Promise<AIProxyResponse> {
  try {
    const { data, error } = await supabase.functions.invoke("ai-proxy", {
      body: {
        feature: request.feature,
        prompt: request.prompt,
        context: request.context || {},
        systemPrompt: FEATURE_SYSTEM_PROMPTS[request.feature],
        maxTokens: request.maxTokens || 500,
        temperature: request.temperature ?? 0.7,
      },
    });

    if (error) {
      if (__DEV__) console.warn("AI proxy error:", error);

      // Map error codes to user-friendly messages
      switch (error.code) {
        case "RATE_LIMITED":
          return {
            success: false,
            error:
              "You've reached the AI request limit. Please try again in a few minutes, or upgrade your plan for unlimited access.",
          };
        case "UNAUTHORIZED":
          return {
            success: false,
            error: "Please sign in to use AI features.",
          };
        case "QUOTA_EXCEEDED":
          return {
            success: false,
            error:
              "AI request quota exceeded for your plan. Upgrade to Premium or Elite for more AI requests.",
          };
        default:
          return {
            success: false,
            error:
              error.message ||
              "AI service temporarily unavailable. Please try again.",
          };
      }
    }

    if (!data?.content) {
      return {
        success: false,
        error: "AI service returned an empty response. Please try again.",
      };
    }

    return {
      success: true,
      content: data.content,
      cached: data.cached || false,
    };
  } catch (err) {
    if (__DEV__) console.warn("AI proxy call failed:", err);
    return {
      success: false,
      error: "Unable to reach AI service. Check your internet connection.",
    };
  }
}

/**
 * Get remaining AI credits for the current user's subscription plan.
 * Free: 5/day, Basic: 20/day, Premium: 100/day, Elite: unlimited
 */
export async function getAICredits(): Promise<{
  remaining: number;
  limit: number;
  resetsAt?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke("ai-proxy", {
      body: { action: "credits" },
    });

    if (error) {
      return { remaining: 0, limit: 5 };
    }

    return {
      remaining: data.remaining ?? 0,
      limit: data.limit ?? 5,
      resetsAt: data.resets_at,
    };
  } catch {
    return { remaining: 0, limit: 5 };
  }
}

/**
 * System prompts for each AI feature.
 * Useful for displaying what the AI can do in the UI.
 */
export const AI_FEATURES: {
  id: AIFeature;
  name: string;
  description: string;
  icon: string;
  requiredPlan: "free" | "basic" | "premium" | "elite";
}[] = [
  {
    id: "checklist-generator",
    name: "Checklist Generator",
    description: "AI creates a personalized wedding checklist with timelines and priorities",
    icon: "CheckSquare",
    requiredPlan: "free",
  },
  {
    id: "budget-optimizer",
    name: "Budget Optimizer",
    description: "Get smart suggestions to optimize your wedding budget",
    icon: "TrendingDown",
    requiredPlan: "free",
  },
  {
    id: "wedding-planner",
    name: "Wedding Planner",
    description: "Ask the AI wedding planner any question about your wedding",
    icon: "Calendar",
    requiredPlan: "basic",
  },
  {
    id: "vendor-recommendation",
    name: "Vendor Matchmaker",
    description: "AI recommends vendors based on your preferences and budget",
    icon: "Store",
    requiredPlan: "premium",
  },
  {
    id: "content-assistant",
    name: "Content Writer",
    description: "Write invitations, thank-you notes, speeches and more",
    icon: "FileText",
    requiredPlan: "basic",
  },
];