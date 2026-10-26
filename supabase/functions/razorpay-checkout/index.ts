/**
 * Razorpay Checkout Host Page (Edge Function)
 *
 * C3 fix: the previous flow generated checkout HTML client-side and opened
 * it as a `data:text/html` URI (blocked by modern browsers) and redirected
 * back to `razorpay://…`, a scheme no app in this repo registers. Payments
 * could succeed at the gateway while the app never learned about it.
 *
 * This function serves the SAME checkout HTML over real HTTPS so any
 * browser can render it, and redirects back to a caller-supplied URI that
 * MUST match the allowlist below (the app scheme on native, the site
 * origin on web).
 *
 * Security: every parameter here is NON-secret (order_id/key_id are public;
 * Razorpay enforces order.amount server-side regardless of what this page
 * displays). All echoed values are JSON-escaped before embedding.
 *
 * Setup: supabase functions deploy razorpay-checkout
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_REDIRECT_ORIGINS = [
  "https://shaadibazaar.com",
  "https://www.shaadibazaar.com",
  "http://localhost:8081",
  "http://localhost:19006",
];

function isValidRedirect(redirect: string): boolean {
  if (!redirect) return false;
  if (redirect.startsWith("shaadibazaar://")) {
    return true;
  }
  try {
    const parsed = new URL(redirect);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return false;
    }
    if (parsed.protocol === "http:" && !parsed.hostname.includes("localhost")) {
      return false;
    }
    return ALLOWED_REDIRECT_ORIGINS.includes(parsed.origin);
  } catch {
    return false;
  }
}

function safeJsonEmbed(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003C")
    .replace(/>/g, "\\u003E")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

serve(async (req) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const q = (key: string) => url.searchParams.get(key) || "";

  const orderId = q("order_id");
  const keyId = q("key_id");
  const amount = Number(q("amount"));
  const redirect = q("redirect");

  if (!orderId || !keyId || !Number.isFinite(amount) || amount <= 0) {
    return new Response("Invalid checkout parameters", { status: 400 });
  }
  if (!isValidRedirect(redirect)) {
    return new Response("Invalid redirect target", { status: 400 });
  }

  const options = {
    key: keyId.slice(0, 64),
    amount: Math.round(amount), // paise; Razorpay enforces the ORDER amount
    currency: "INR",
    name: q("name").slice(0, 120) || "ShaadiBazaar",
    description: q("description").slice(0, 200),
    order_id: orderId.slice(0, 80),
    prefill: {
      name: q("prefill_name").slice(0, 120),
      email: q("prefill_email").slice(0, 200),
      contact: q("prefill_contact").slice(0, 32),
    },
    theme: { color: "#800000" },
  };

  const safeOptionsJson = safeJsonEmbed(options);
  const safeRedirectJson = safeJsonEmbed(redirect);

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ShaadiBazaar Secure Payment</title>
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<style>body{font-family:-apple-system,sans-serif;background:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;color:#333}</style>
</head>
<body>
<noscript>JavaScript is required to complete this payment.</noscript>
<script>
var rawOptions = ${safeOptionsJson};
var REDIRECT = ${safeRedirectJson};
function back(params) { window.location.href = REDIRECT + (REDIRECT.indexOf("?") === -1 ? "?" : "&") + params; }
rawOptions.handler = function (response) {
  back("razorpay_payment_id=" + encodeURIComponent(response.razorpay_payment_id) +
       "&razorpay_order_id=" + encodeURIComponent(response.razorpay_order_id) +
       "&razorpay_signature=" + encodeURIComponent(response.razorpay_signature));
};
rawOptions.modal = { ondismiss: function () { back("event=cancel"); } };
try {
  var rzp = new Razorpay(rawOptions);
  rzp.on('payment.failed', function (response) {
    back("event=failed&error_code=" + encodeURIComponent((response.error && response.error.code) || "") +
         "&error_description=" + encodeURIComponent((response.error && response.error.description) || ""));
  });
  rzp.open();
} catch (e) {
  document.body.textContent = "Unable to start payment. Please return to the app and retry.";
}
</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
});
