/**
 * AI Checklist Generator
 *
 * Uses AI to generate personalized wedding checklists.
 * Routes through the centralized ai-proxy service for API calls.
 *
 * SECURITY: See ai-proxy.ts for details on production configuration.
 * All AI calls are rate-limited and go through the proxy URL.
 */

import { callAI } from "./ai-proxy";

export interface GeneratedTask {
  title: string;
  description: string;
  category: string;
  priority: "high" | "medium" | "low";
  suggestedDueDate: string;
}

export async function generateSmartChecklist(
  weddingDate: string,
  culture: string,
  budget: number,
  location: string,
  guests: number
): Promise<{ tasks: GeneratedTask[]; wasFallback: boolean; error?: string }> {
  const prompt = `Generate a wedding checklist for a ${culture} wedding in ${location} with ${guests} guests and a budget of ₹${budget.toLocaleString(
    "en-IN"
  )}. Wedding date: ${weddingDate}.

Return ONLY a JSON array of tasks. Each task should have:
- title: string
- description: string
- category: string (one of: Venue, Catering, Photography, Decor, Attire, Music, Invitations, Logistics, Pre-wedding, Honeymoon)
- priority: "high" | "medium" | "low"
- suggestedDueDate: string (description like "12 months before", "6 months before", "3 months before", "1 month before", "2 weeks before", "1 week before", "day before")

Generate 15-20 tasks. Make them specific and actionable.`;

  try {
    const result = await callAI({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a wedding planning expert. Return ONLY valid JSON arrays.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    if (result.error) {
      if (__DEV__) console.warn("AI Checklist Error:", result.error);
      return {
        tasks: getFallbackChecklist(culture),
        wasFallback: true,
        error: "AI is temporarily unavailable. Showing a standard checklist instead.",
      };
    }

    const parsed = JSON.parse(result.content || '{"tasks": []}');
    // The model is asked for an object with a tasks key, but it may return a
    // bare array — accept both shapes so generated tasks are never lost.
    const tasks = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.tasks)
      ? parsed.tasks
      : [];
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return {
        tasks: getFallbackChecklist(culture),
        wasFallback: true,
        error: "AI returned an invalid checklist. Showing a standard checklist instead.",
      };
    }
    return { tasks, wasFallback: false };
  } catch (error) {
    if (__DEV__) console.error("AI Checklist Error:", error);
    return {
      tasks: getFallbackChecklist(culture),
      wasFallback: true,
      error: "AI is temporarily unavailable. Showing a standard checklist instead.",
    };
  }
}

function getFallbackChecklist(culture: string): GeneratedTask[] {
  const baseTasks: GeneratedTask[] = [
    {
      title: "Book Wedding Venue",
      description: "Finalize and book your dream wedding venue",
      category: "Venue",
      priority: "high",
      suggestedDueDate: "9 months before",
    },
    {
      title: "Hire Wedding Photographer",
      description: "Book a professional photographer and videographer",
      category: "Photography",
      priority: "high",
      suggestedDueDate: "8 months before",
    },
    {
      title: "Finalize Catering Menu",
      description: "Decide on menu items and taste samples",
      category: "Catering",
      priority: "high",
      suggestedDueDate: "6 months before",
    },
    {
      title: "Buy Wedding Outfits",
      description: "Purchase or rent wedding attire for bride and groom",
      category: "Attire",
      priority: "high",
      suggestedDueDate: "6 months before",
    },
    {
      title: "Send Invitations",
      description: "Design, print and send wedding invitations",
      category: "Invitations",
      priority: "medium",
      suggestedDueDate: "3 months before",
    },
    {
      title: "Book Makeup Artist",
      description: "Hire a professional makeup and hair artist",
      category: "Attire",
      priority: "medium",
      suggestedDueDate: "4 months before",
    },
    {
      title: "Arrange Transportation",
      description: "Book vehicles for guest transportation",
      category: "Logistics",
      priority: "medium",
      suggestedDueDate: "2 months before",
    },
    {
      title: "Finalize Decor Theme",
      description: "Choose and finalize decoration theme and colors",
      category: "Decor",
      priority: "medium",
      suggestedDueDate: "3 months before",
    },
    {
      title: "Book DJ/Music Band",
      description: "Hire entertainment for reception",
      category: "Music",
      priority: "medium",
      suggestedDueDate: "3 months before",
    },
    {
      title: "Plan Honeymoon",
      description: "Book flights and hotels for honeymoon",
      category: "Honeymoon",
      priority: "low",
      suggestedDueDate: "2 months before",
    },
  ];

  if (culture.toLowerCase().includes("hindu")) {
    baseTasks.splice(
      2,
      0,
      {
        title: "Book Pandit/Priest",
        description: "Find and book a priest for the ceremonies",
        category: "Pre-wedding",
        priority: "high",
        suggestedDueDate: "7 months before",
      },
      {
        title: "Plan Mehendi Ceremony",
        description: "Arrange mehendi artist and venue for pre-wedding event",
        category: "Pre-wedding",
        priority: "medium",
        suggestedDueDate: "5 months before",
      },
      {
        title: "Arrange Sangeet Night",
        description: "Plan music and dance performances for sangeet",
        category: "Music",
        priority: "medium",
        suggestedDueDate: "4 months before",
      }
    );
  }

  if (culture.toLowerCase().includes("muslim")) {
    baseTasks.splice(
      2,
      0,
      {
        title: "Arrange Nikah Venue",
        description: "Book venue for the Nikah ceremony",
        category: "Venue",
        priority: "high",
        suggestedDueDate: "7 months before",
      },
      {
        title: "Plan Mehndi Night",
        description: "Organize pre-wedding mehndi celebration",
        category: "Pre-wedding",
        priority: "medium",
        suggestedDueDate: "5 months before",
      }
    );
  }

  if (culture.toLowerCase().includes("christian")) {
    baseTasks.splice(
      2,
      0,
      {
        title: "Book Church",
        description: "Reserve church for the wedding ceremony",
        category: "Venue",
        priority: "high",
        suggestedDueDate: "8 months before",
      },
      {
        title: "Arrange Choir",
        description: "Book choir or musicians for church ceremony",
        category: "Music",
        priority: "medium",
        suggestedDueDate: "4 months before",
      }
    );
  }

  if (culture.toLowerCase().includes("sikh")) {
    baseTasks.splice(
      2,
      0,
      {
        title: "Book Gurdwara",
        description: "Reserve Gurdwara for Anand Karaj ceremony",
        category: "Venue",
        priority: "high",
        suggestedDueDate: "8 months before",
      },
      {
        title: "Plan Maiyan Ceremony",
        description: "Organize pre-wedding turmeric ceremony",
        category: "Pre-wedding",
        priority: "medium",
        suggestedDueDate: "5 months before",
      }
    );
  }

  return baseTasks;
}
