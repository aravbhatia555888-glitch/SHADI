import Button from "@/components/Button";
import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { AnalyticsEvents,trackEvent } from "@/services/analytics";
import {
buildCheckoutPageUrl,
createSubscriptionOrder,
NATIVE_REDIRECT_URI,
verifyPaymentSignature,
} from "@/services/payment";
import * as WebBrowser from "expo-web-browser";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { FontWeight } from "@/types/styles";
import { hapticError,hapticSuccess } from "@/utils/haptics";
import { useCallback,useEffect,useRef,useState } from "react";
import {
ActivityIndicator,
Linking,
Modal,
Platform,
StyleSheet,
Text,
TouchableOpacity,
View,
} from "react-native";

interface SubscriptionPaymentScreenProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (result: { success: boolean; error?: string }) => void;
  vendorId: string;
  userId: string;
  plan: "basic" | "premium" | "elite";
  interval?: "month" | "year";
  userName: string;
  userEmail: string;
  userPhone: string;
}

type PaymentState =
  | "idle"
  | "creating_order"
  | "checkout"
  | "processing"
  | "success"
  | "failed";

function parseRazorpayUrl(
  url: string
): {
  type: "payment" | "cancel" | "failed";
  paymentId?: string;
  orderId?: string;
  signature?: string;
  errorCode?: string;
  errorDescription?: string;
} | null {
  // C3 fix: results arrive on the app's REGISTERED scheme
  // (shaadibazaar://payment-result) from the server-hosted checkout page;
  // legacy razorpay:// links from old builds still parse.
  if (url.startsWith("razorpay://payment")) {
    const params = new URLSearchParams(url.split("?")[1]);
    return {
      type: "payment",
      paymentId: params.get("razorpay_payment_id") || undefined,
      orderId: params.get("razorpay_order_id") || undefined,
      signature: params.get("razorpay_signature") || undefined,
    };
  }
  if (url.startsWith("shaadibazaar://payment-result")) {
    const params = new URLSearchParams(url.split("?")[1] || "");
    const paymentId = params.get("razorpay_payment_id");
    if (paymentId) {
      return {
        type: "payment",
        paymentId,
        orderId: params.get("razorpay_order_id") || undefined,
        signature: params.get("razorpay_signature") || undefined,
      };
    }
    if (params.get("event") === "failed") {
      return {
        type: "failed",
        errorCode: params.get("error_code") || undefined,
        errorDescription: params.get("error_description") || undefined,
      };
    }
    return { type: "cancel" };
  }
  if (url.startsWith("razorpay://cancel")) {
    return { type: "cancel" };
  }
  if (url.startsWith("razorpay://failed")) {
    const params = new URLSearchParams(url.split("?")[1]);
    return {
      type: "failed",
      errorCode: params.get("error_code") || undefined,
      errorDescription: params.get("error_description") || undefined,
    };
  }
  return null;
}

const PLAN_PRICES: Record<string, number> = {
  basic: 500,
  premium: 2000,
  elite: 5000,
};

export default function SubscriptionPaymentScreen({
  visible,
  onClose,
  onComplete,
  vendorId,
  userId,
  plan,
  interval = "month",
  userName,
  userEmail,
  userPhone,
}: SubscriptionPaymentScreenProps) {
  const [state, setState] = useState<PaymentState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const processingRef = useRef(false);
  const startingPaymentRef = useRef(false);
  const checkoutHandledRef = useRef(false);
  const pendingOrderIdRef = useRef<string | null>(null);
  const { refreshSubscription } = useSubscriptionStore();

  const amount = PLAN_PRICES[plan] || 0;

  const handleDeepLink = useCallback(
    async (url: string) => {
      if (processingRef.current) return;
      const parsed = parseRazorpayUrl(url);
      if (!parsed) return;

      checkoutHandledRef.current = true;
      processingRef.current = true;

      if (parsed.type === "cancel") {
        setState("idle");
        setErrorMessage("");
        processingRef.current = false;
        return;
      }

      if (parsed.type === "failed") {
        setState("failed");
        setErrorMessage(
          parsed.errorDescription ||
            parsed.errorCode ||
            "Payment failed. Please try again."
        );
        hapticError();
        processingRef.current = false;
        return;
      }

      if (parsed.type === "payment") {
        if (!parsed.paymentId || !parsed.orderId || !parsed.signature) {
          setState("failed");
          setErrorMessage("Invalid payment response. Please contact support.");
          hapticError();
          processingRef.current = false;
          return;
        }

        if (
          pendingOrderIdRef.current &&
          parsed.orderId !== pendingOrderIdRef.current
        ) {
          setState("failed");
          setErrorMessage("This payment response belongs to a different checkout.");
          hapticError();
          processingRef.current = false;
          return;
        }

        setState("processing");

        // Server-side signature verification (HMAC-SHA256)
        const verification = await verifyPaymentSignature({
          razorpay_order_id: parsed.orderId,
          razorpay_payment_id: parsed.paymentId,
          razorpay_signature: parsed.signature,
        });

        if (
          !verification.verified ||
          !verification.subscriptionActivated ||
          verification.vendorId !== vendorId
        ) {
          setState("failed");
          setErrorMessage(
            verification.error ||
              "Payment verification did not match this subscription. Please contact support if you were charged."
          );
          hapticError();
          processingRef.current = false;
          return;
        }

        // Reload subscription to get updated state
        await refreshSubscription(vendorId);

        trackEvent(AnalyticsEvents.SUBSCRIPTION_ACTIVATED, {
          plan,
          vendorId,
          paymentId: parsed.paymentId,
        });

        setState("success");
        hapticSuccess();
        onComplete({ success: true });
      }

      processingRef.current = false;
    },
    [vendorId, plan, refreshSubscription, onComplete]
  );

  useEffect(() => {
    if (!visible) return;

    const subscription = Linking.addEventListener("url", (event) => {
      handleDeepLink(event.url);
    });

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    return () => subscription.remove();
  }, [visible, handleDeepLink]);

  const handleStartPayment = useCallback(async () => {
    if (processingRef.current || startingPaymentRef.current) return;
    startingPaymentRef.current = true;
    checkoutHandledRef.current = false;
    setState("creating_order");
    setErrorMessage("");

    try {
      const result = await createSubscriptionOrder({
        vendorId,
        userId,
        plan,
        amount,
        interval,
      });

      if (!result.success) {
        setState("failed");
        setErrorMessage(result.error || "Failed to create payment order");
        hapticError();
        return;
      }

      pendingOrderIdRef.current = result.orderId;

      // C3 fix: server-hosted HTTPS checkout + registered-scheme redirect.
      const checkoutUrl = buildCheckoutPageUrl({
        keyId: result.keyId,
        orderId: result.orderId,
        amountPaise: Math.round(amount * 100),
        name: "ShaadiBazaar",
        description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Subscription`,
        prefillName: userName,
        prefillEmail: userEmail,
        prefillContact: userPhone,
      });

      setState("checkout");

      if (Platform.OS === "web") {
        // Web return leg is handled by the /payment-result route.
        await Linking.openURL(checkoutUrl);
      } else {
        const authResult = await WebBrowser.openAuthSessionAsync(
          checkoutUrl,
          NATIVE_REDIRECT_URI
        );
        if (authResult.type === "success" && authResult.url) {
          await handleDeepLink(authResult.url);
        } else if (!checkoutHandledRef.current) {
          setState("idle");
        }
      }
    } catch (err) {
      setState("failed");
      setErrorMessage(
        err instanceof Error ? err.message : "Payment initialization failed"
      );
      hapticError();
    } finally {
      startingPaymentRef.current = false;
    }
  }, [vendorId, userId, plan, amount, interval, userName, userEmail, userPhone, handleDeepLink]);

  const handleRetry = useCallback(() => {
    setState("idle");
    setErrorMessage("");
    pendingOrderIdRef.current = null;
  }, []);

  const handleClose = useCallback(() => {
    setState("idle");
    setErrorMessage("");
    pendingOrderIdRef.current = null;
    onClose();
  }, [onClose]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {state === "success" ? "Subscription Activated" : "Subscribe"}
          </Text>
          {state !== "checkout" && (
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.content}>
          {state === "idle" && (
            <View style={styles.centerContent}>
              <Text style={styles.planLabel}>
                {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
              </Text>
              <Text style={styles.amountValue}>₹{amount.toLocaleString("en-IN")}</Text>
              <Text style={styles.intervalText}>per {interval}</Text>

              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>Secure Payment</Text>
                <Text style={styles.infoText}>
                  Powered by Razorpay. Your payment information is encrypted and secure.
                  You'll be redirected to your browser to complete the payment.
                </Text>
              </View>

              <Button
                title="Subscribe Now"
                onPress={handleStartPayment}
                style={styles.payButton}
              />
            </View>
          )}

          {state === "creating_order" && (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={Colors.light.primary} />
              <Text style={styles.loadingText}>Initializing payment...</Text>
            </View>
          )}

          {state === "checkout" && (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={Colors.light.primary} />
              <Text style={styles.loadingText}>Opening payment page...</Text>
              <Text style={styles.checkoutHint}>
                Complete the payment in your browser, then return to the app.
              </Text>
            </View>
          )}

          {state === "processing" && (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={Colors.light.primary} />
              <Text style={styles.loadingText}>Activating subscription...</Text>
            </View>
          )}

          {state === "success" && (
            <View style={styles.centerContent}>
              <View style={styles.successIcon}>
                <Text style={styles.successIconText}>✓</Text>
              </View>
              <Text style={styles.successTitle}>Subscription Activated!</Text>
              <Text style={styles.successText}>
                Your {plan} plan is now active. You can start using all features immediately.
              </Text>
              <Button
                title="Done"
                onPress={handleClose}
                style={styles.doneButton}
              />
            </View>
          )}

          {state === "failed" && (
            <View style={styles.centerContent}>
              <View style={styles.errorIcon}>
                <Text style={styles.errorIconText}>✕</Text>
              </View>
              <Text style={styles.errorTitle}>Payment Failed</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <View style={styles.errorButtons}>
                <Button
                  title="Try Again"
                  onPress={handleRetry}
                  style={styles.retryButton}
                />
                <Button
                  title="Cancel"
                  onPress={handleClose}
                  variant="outline"
                  style={styles.cancelButton}
                />
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 16,
    backgroundColor: Colors.light.headerBackground,
  },
  headerTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "700" as FontWeight,
    color: Colors.light.white,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.white,
    fontWeight: "600" as FontWeight,
  },
  content: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  planLabel: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 48,
    fontWeight: "700" as FontWeight,
    color: Colors.light.primary,
    marginBottom: 4,
  },
  intervalText: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.textLight,
    marginBottom: 32,
  },
  infoBox: {
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  infoTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600" as FontWeight,
    color: Colors.light.primary,
    marginBottom: 4,
  },
  infoText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
    lineHeight: 20,
  },
  payButton: {
    width: "100%",
  },
  loadingText: {
    marginTop: 16,
    fontSize: Typography.fontSizes.md,
    color: Colors.light.textLight,
  },
  checkoutHint: {
    marginTop: 8,
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
    textAlign: "center",
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.success,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  successIconText: {
    fontSize: 36,
    color: Colors.light.white,
    fontWeight: "700" as FontWeight,
  },
  successTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
    marginBottom: 12,
  },
  successText: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.textLight,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  doneButton: {
    width: "100%",
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.error,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  errorIconText: {
    fontSize: 36,
    color: Colors.light.white,
    fontWeight: "700" as FontWeight,
  },
  errorTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
    marginBottom: 12,
  },
  errorText: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.textLight,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  errorButtons: {
    width: "100%",
    gap: 12,
  },
  retryButton: {
    width: "100%",
  },
  cancelButton: {
    width: "100%",
  },
});
