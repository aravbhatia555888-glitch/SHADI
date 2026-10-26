# Security Improvements (May 2026)

## AI API Key Protection

### Problem
The app previously bundled `EXPO_PUBLIC_OPENAI_API_KEY` directly into the client bundle, allowing anyone to extract and abuse the API key.

### Solution
- **Direct OpenAI client creation is REMOVED** from `services/ai-proxy.ts`
- All AI calls now **require** `EXPO_PUBLIC_AI_PROXY_URL` (a backend proxy)
- If no proxy URL is set, AI calls return: `"AI features are currently unavailable..."`
- Client-side rate limiting added: **10 requests/min, 60/hour**
- Tracks calls in-memory per session

### Migration
To enable AI features, deploy a backend proxy:

```env
# .env
EXPO_PUBLIC_AI_PROXY_URL=https://your-proxy.com
# EXPO_PUBLIC_OPENAI_API_KEY -- REMOVED (not used anymore)
```

## Mock Data Fix

Previously, if the vendor API failed, the app silently injected mock vendors, which could confuse users.

**Now**: Shows empty state with explicit error message: "Unable to load vendors. Check your internet connection and try again."

## Subscription Debouncing

Rapid real-time data changes (checklist, budget) could trigger multiple reloads.
**Fix**: 500ms debounce added on subscription callbacks.

## Rate Limiting

Client-side rate limits for AI calls prevent abuse:
- 10 calls/minute per session
- 60 calls/hour per session
