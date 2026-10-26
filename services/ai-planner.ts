/**
 * AI Wedding Planner
 *
 * Provides AI-powered wedding planning assistance.
 * Routes through the centralized ai-proxy service for API calls.
 *
 * SECURITY: See ai-proxy.ts for details on production configuration.
 * All AI calls are rate-limited and go through the proxy URL.
 */

import { callAI } from "./ai-proxy";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const SYSTEM_PROMPT = `You are ShaadiBazaar's AI Wedding Planner, an expert in Indian wedding planning. You help couples plan their dream wedding with personalized advice on:

- Vendor selection and budgeting
- Timeline and scheduling
- Cultural and religious ceremonies
- Decoration and theme ideas
- Guest management
- Food and catering
- Photography and videography
- Music and entertainment
- Wedding day coordination

Be warm, enthusiastic, and culturally sensitive. Provide specific, actionable advice. When appropriate, suggest vendors from our marketplace. Keep responses concise but helpful. Use Indian wedding terminology naturally.`;

export async function sendMessageToAI(
  messages: { role: "user" | "assistant"; content: string }[],
  userContext?: {
    weddingDate?: string;
    budget?: number;
    location?: string;
    culture?: string;
    guests?: number;
  }
): Promise<string> {
  try {
    const contextMessage = userContext
      ? `Context: Wedding date: ${
          userContext.weddingDate || "Not set"
        }, Budget: ₹${userContext.budget || "Not set"}, Location: ${
          userContext.location || "Not set"
        }, Culture: ${userContext.culture || "Not set"}, Expected guests: ${
          userContext.guests || "Not set"
        }.`
      : "";

    const result = await callAI({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT + "\n" + contextMessage },
        ...messages.slice(-10),
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    if (result.error) {
      if (__DEV__) console.error("AI Chat Error:", result.error);
      return "I am having trouble connecting right now. Please check your internet connection and try again.";
    }

    return result.content || "I apologize, I could not generate a response. Please try again.";
  } catch (error) {
    if (__DEV__) console.error("AI Chat Error:", error);
    return "I am having trouble connecting right now. Please check your internet connection and try again.";
  }
}

export async function generateWeddingPlan(context: {
  weddingDate: string;
  budget: number;
  location: string;
  culture: string;
  guests: number;
  style: string;
}): Promise<string> {
  const prompt = `Create a personalized wedding plan for a ${
    context.culture
  } wedding in ${context.location} on ${
    context.weddingDate
  } with a budget of ₹${context.budget.toLocaleString("en-IN")} and ${
    context.guests
  } guests. Style preference: ${context.style}.

Include:
1. Month-by-month timeline
2. Budget allocation breakdown
3. Top 5 vendor categories to prioritize
4. 3 unique theme ideas
5. A special tip for this specific wedding

Format with clear sections and bullet points.`;

  try {
    const result = await callAI({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 1000,
    });

    if (result.error) {
      if (__DEV__) console.error("AI Plan Error:", result.error);
      return "Could not generate wedding plan. Please try again later.";
    }

    return result.content || "Could not generate wedding plan.";
  } catch (error) {
    if (__DEV__) console.error("AI Plan Error:", error);
    return "Could not generate wedding plan. Please try again later.";
  }
}

export async function suggestVendors(
  category: string,
  location: string,
  budget: number
): Promise<string> {
  const prompt = `Suggest what to look for when hiring a ${category} in ${location} with a budget of ₹${budget.toLocaleString(
    "en-IN"
  )}. Give 3-4 key criteria and 2 red flags to watch out for.`;

  try {
    const result = await callAI({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 400,
    });

    if (result.error) {
      if (__DEV__) console.error("AI Suggest Error:", result.error);
      return "Could not generate suggestions. Please try again later.";
    }

    return result.content || "Could not generate suggestions.";
  } catch (error) {
    if (__DEV__) console.error("AI Suggest Error:", error);
    return "Could not generate suggestions. Please try again later.";
  }
}
