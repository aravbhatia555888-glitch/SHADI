/**
 * Payment Service — Razorpay Integration
 *
 * Architecture:
 * ┌─────────────┐     create order      ┌──────────────────┐
 * │  Client App  │ ──────────────────►  │  Supabase Edge   │
 * │  (Expo)      │                      │  Function         │
 * │              │ ◄────────────────── │  (server-side)    │
 * │              │   order_id + key     │  ┌────────────┐  │
 * │              │                      │  │ Razorpay   │  │
 * │              │   open checkout      │  │ API Key    │  │
 * │              │ ──────────────────►  │  │ (secret)   │  │
 * │              │   (WebView)          │  └────────────┘  │
 * │              │                      └──────────────────┘
 * └─────────────┘
 *
 * The secret Razorpay key lives ONLY in the Edge Function.
 * The client receives a temporary order_id and the public key.
 *
 * SETUP:
 * 1. Create Razorpay account → get key_id (public) + key_secret (secret)
 * 2. Set env vars in Supabase Edge Function:
 *    RAZORPAY_KEY_ID=rzp_live_xxxx
 *    RAZORPAY_KEY_SECRET=xxxx
 * 3. Deploy Edge Function: supabase functions deploy create-razorpay-order
 * 4. Add EXPO_PUBLIC_RAZORPAY_KEY_ID to client .env
 *    (this is the PUBLIC key — safe to include in client)
 */

import { supabase } from "@/config/supabase";
import { trackEvent } from "@/services/analytics";
import { captureError } from "@/services/sentry";
import { Platform } from "react-native";

export interface RazorpayCheckoutOptions {
  key: string; // Razorpay public key ID
  amount: number; // Amount in paise (₹1 = 100 paise)
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes?: Record<string, string>;
  /**
   * C3 fix: URI the checkout page redirects back to after pay/cancel/fail.
   * Must be the app's registered scheme (native) or an https URL on the
   * site origin (web). The old hardcoded `razorpay://…` targets belonged
   * to no registered app, so payment results never reached the client.
   */
  redirectUri?: string;
}

export interface PaymentResult {
  success: boolean;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  error?: string;
  error_code?: string;
}

/**
 * Step 1: Create a Razorpay order via the Supabase Edge Function.
 * The Edge Function holds the secret key — the client never sees it.
 */
export async function createRazorpayOrder(params: {
  amount: number; // in INR (decimal, e.g. 50000 for ₹50,000)
  currency?: string;
  bookingId: string;
  userId: string;
  vendorId: string;
  paymentType: "full" | "advance";
  advancePercentage?: number;
  receipt?: string;
}): Promise<
  | { success: true; orderId: string; amount: number; keyId: string }
  | { success: false; error: string }
> {
  try {
    const { data, error } = await supabase.functions.invoke(
      "create-razorpay-order",
      {
        body: {
          amount: Math.round(params.amount * 100), // Razorpay expects paise
          currency: params.currency || "INR",
          receipt:
            params.receipt ||
            `booking_${params.bookingId}_${Date.now()}`,
          notes: {
            booking_id: params.bookingId,
            user_id: params.userId,
            vendor_id: params.vendorId,
            payment_type: params.paymentType,
            advance_percentage: String(params.advancePercentage || 100),
          },
        },
      }
    );

    if (error) {
      captureError(error, { flow: "createRazorpayOrder", bookingId: params.bookingId });
      return { success: false, error: error.message || "Failed to create payment order" };
    }

    return {
      success: true,
      orderId: data.order_id,
      amount: data.amount,
      keyId: data.key_id,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment service unavailable";
    if (__DEV__) console.warn("Payment service error:", err);
    return { success: false, error: message };
  }
}

/**
 * Step 2: Open Razorpay Checkout in a WebView.
 *
 * Generates an HTML page that loads the Razorpay checkout.js
 * and posts the payment response back via the URL hash.
 */
export function buildRazorpayCheckoutHtml(options: RazorpayCheckoutOptions): string {
  // Serialize for an inline script and escape characters that can terminate the
  // script element or create ambiguous JavaScript line separators.
  const redirect = options.redirectUri || "shaadibazaar://payment-result";
  const redirectQs = redirect.includes("?") ? "&" : "?";
  const rzpOptions = {
    key: options.key,
    amount: options.amount,
    currency: options.currency,
    name: options.name,
    description: options.description,
    order_id: options.order_id,
    prefill: options.prefill,
    notes: options.notes,
    handler: "__RAZORPAY_HANDLER__",
    modal: { ondismiss: "__RAZORPAY_DISMISS__" },
  };

  const optionsJson = JSON.stringify(rzpOptions)
    .replace(/</g, "\\u003C")
    .replace(/>/g, "\\u003E")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head>
<body>
  <script>
    var rawOptions = ${optionsJson};
    var REDIRECT = ${JSON.stringify(redirect)};
    function back(params) {
      window.location.href = REDIRECT + "${redirectQs}" + params;
    }
    rawOptions.handler = function(response) {
      back("razorpay_payment_id=" + encodeURIComponent(response.razorpay_payment_id) +
        "&razorpay_order_id=" + encodeURIComponent(response.razorpay_order_id) +
        "&razorpay_signature=" + encodeURIComponent(response.razorpay_signature));
    };
    rawOptions.modal = {
      ondismiss: function() {
        back("event=cancel");
      }
    };
    var rzp = new Razorpay(rawOptions);
    rzp.on('payment.failed', function(response) {
      back("event=failed" +
        "&error_code=" + encodeURIComponent((response.error && response.error.code) || "") +
        "&error_description=" + encodeURIComponent((response.error && response.error.description) || ""));
    });
    rzp.open();
  </script>
</body>
</html>`;
}

// ─── C3 fix: hosted checkout + registered-scheme redirects ───────────
/** Native apps return to this registered scheme (app.config.js `scheme`). */
export const NATIVE_REDIRECT_URI = "shaadibazaar://payment-result";

/** Web returns to this route on the site origin (SPA fallback serves it). */
export const WEB_RESULT_PATH = "/payment-result";

/**
 * Build the URL of the SERVER-HOSTED Razorpay checkout page.
 *
 * The old flow opened client-generated HTML as a `data:text/html` URI,
 * which modern browsers block for top-level navigation, and redirected to
 * `razorpay://…`, a scheme nothing registers. Serving the page over HTTPS
 * from the razorpay-checkout Edge Function fixes both. All parameters are
 * non-secret (Razorpay enforces order.amount server-side regardless of
 * what the page displays).
 */
export function buildCheckoutPageUrl(
  params: {
    keyId: string;
    orderId: string;
    amountPaise: number;
    name: string;
    description: string;
    prefillName?: string;
    prefillEmail?: string;
    prefillContact?: string;
  },
  /** Test/staging hook — defaults to EXPO_PUBLIC_SUPABASE_URL. */
  baseUrlOverride?: string
): string {
  const base = (
    baseUrlOverride ??
    process.env.EXPO_PUBLIC_SUPABASE_URL ??
    ""
  ).replace(/\/+$/, "");
  const redirect =
    Platform.OS === "web"
      ? `${getSiteOrigin()}${WEB_RESULT_PATH}`
      : NATIVE_REDIRECT_URI;

  const qs = new URLSearchParams({
    order_id: params.orderId,
    key_id: params.keyId,
    amount: String(Math.round(params.amountPaise)),
    name: params.name,
    description: params.description,
    redirect,
  });
  if (params.prefillName) qs.set("prefill_name", params.prefillName);
  if (params.prefillEmail) qs.set("prefill_email", params.prefillEmail);
  if (params.prefillContact) qs.set("prefill_contact", params.prefillContact);

  return `${base}/functions/v1/razorpay-checkout?${qs.toString()}`;
}

function getSiteOrigin(): string {
  return (process.env.EXPO_PUBLIC_SITE_URL || "https://shaadibazaar.com").replace(/\/+$/, "");
}

/**
 * Step 3: Verify payment signature server-side.
 *
 * Calls the verify-razorpay-payment Edge Function which performs
 * HMAC-SHA256 verification using the secret key stored server-side.
 * Returns true ONLY if the server confirms the signature is valid.
 */
export async function verifyPaymentSignature(params: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{
  verified: boolean;
  error?: string;
  paymentRecorded?: boolean;
  subscriptionActivated?: boolean;
  bookingId?: string;
  vendorId?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke(
      "verify-razorpay-payment",
      {
        body: {
          razorpay_order_id: params.razorpay_order_id,
          razorpay_payment_id: params.razorpay_payment_id,
          razorpay_signature: params.razorpay_signature,
        },
      }
    );

    if (error) {
      captureError(error, { flow: "verifyPaymentSignature" });
      return { verified: false, error: error.message || "Payment verification failed" };
    }

    if (!data?.verified) {
      return {
        verified: false,
        error: "Payment signature verification failed. If you were charged, a refund will be processed within 5-7 business days.",
      };
    }

    return {
      verified: true,
      paymentRecorded: data.payment_recorded === true,
      subscriptionActivated: data.subscription_activated === true,
      bookingId:
        typeof data.booking_id === "string" ? data.booking_id : undefined,
      vendorId:
        typeof data.vendor_id === "string" ? data.vendor_id : undefined,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment verification service unavailable";
    if (__DEV__) console.warn("Payment verification service error:", err);
    return {
      verified: false,
      error: `${message}. If you were charged, a refund will be processed within 5-7 business days.`,
    };
  }
}

/**
 * Step 4: Save payment transaction to Supabase after successful checkout.
 *
 * SECURITY NOTE (S4 fix): This function previously inserted directly into
 * payment_transactions from the client, allowing fabricated payment records.
 * It now calls the verify-razorpay-payment Edge Function which handles
 * both signature verification AND payment recording server-side.
 */
export async function savePaymentTransaction(params: {
  bookingId: string;
  userId: string;
  vendorId: string;
  amount: number;
  currency?: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  paymentType: "full" | "advance";
  advancePercentage?: number;
  paymentMethod?: string;
}): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  // Payment transaction recording is now handled server-side by the
  // verify-razorpay-payment Edge Function. This client function is kept
  // for API compatibility but the actual DB write was removed.
  // The verify endpoint creates the payment_transactions record using
  // the service role key, ensuring amount/status cannot be fabricated.
  try {
    trackEvent("payment_completed", {
      bookingId: params.bookingId,
      paymentType: params.paymentType,
      amount: params.amount,
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save payment";
    if (__DEV__) console.warn("Save payment error:", err);
    return { success: false, error: message };
  }
}

/**
 * Step 5: Update booking payment status after successful payment.
 *
 * SECURITY NOTE (S4 fix): This function previously updated vendor_bookings
 * directly from the client, allowing booking confirmation without payment.
 * It now returns a no-op — booking status must be updated server-side by
 * the verify-razorpay-payment Edge Function after valid signature verification.
 */
export async function updateBookingPaymentStatus(_params: {
  bookingId: string;
  status: "partial" | "paid";
}): Promise<{ success: boolean; error?: string }> {
  // Booking status updates are now handled server-side by the
  // verify-razorpay-payment Edge Function. The client UPDATE policy
  // has been removed from vendor_bookings RLS, and this function is
  // kept for API compatibility only.
  return { success: true };
}

/**
 * Create a Razorpay order specifically for subscription payments.
 * Wraps the create-razorpay-order edge function with subscription-specific notes.
 */
export async function createSubscriptionOrder(params: {
  vendorId: string;
  userId: string;
  plan: string;
  amount: number; // in INR
  interval?: "month" | "year";
}): Promise<
  | { success: true; orderId: string; amount: number; keyId: string }
  | { success: false; error: string }
> {
  try {
    const amountInPaise = Math.round(params.amount * 100);
    const { data, error } = await supabase.functions.invoke(
      "create-razorpay-order",
      {
        body: {
          amount: amountInPaise,
          currency: "INR",
          receipt: `sub_${params.vendorId}_${params.plan}_${Date.now()}`,
          notes: {
            type: "subscription",
            vendor_id: params.vendorId,
            user_id: params.userId,
            plan: params.plan,
            interval: params.interval || "month",
          },
        },
      }
    );

    if (error) {
      if (__DEV__) console.warn("Failed to create subscription order:", error);
      return { success: false, error: error.message || "Failed to create subscription order" };
    }

    return {
      success: true,
      orderId: data.order_id,
      amount: data.amount,
      keyId: data.key_id,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Subscription service unavailable";
    if (__DEV__) console.warn("Subscription order error:", err);
    return { success: false, error: message };
  }
}
