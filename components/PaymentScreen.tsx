import Button from "@/components/Button";
import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import {
  buildCheckoutPageUrl,
  createRazorpayOrder,
  NATIVE_REDIRECT_URI,
  savePaymentTransaction,
  updateBookingPaymentStatus,
  verifyPaymentSignature,
} from "@/services/payment";
import * as WebBrowser from "expo-web-browser";
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

export type PaymentType = "full" | "advance";

interface PaymentScreenProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (result: { success: boolean; transactionId?: string; error?: string }) => void;

  // Booking details
  bookingId: string;
  userId: string;
  vendorId: string;
  vendorName: string;
  amount: number; // in INR
  paymentType: PaymentType;
  advancePercentage?: number;

  // User prefill
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
  // (shaadibazaar://payment-result) from the server-hosted checkout page.
  // The legacy razorpay:// branches are kept only to still parse any
  // stale deep link from an old build.
  const isAppResult = url.startsWith("shaadibazaar://payment-result");
  const isLegacy = url.startsWith("razorpay://payment") || url.startsWith("razorpay://cancel") || url.startsWith("razorpay://failed");
  if (!isAppResult && !isLegacy) return null;

  const params = new URLSearchParams(url.split("?")[1] || "");

  if (isAppResult || url.startsWith("razorpay://payment")) {
    const paymentId = params.get("razorpay_payment_id") || undefined;
    if (paymentId) {
      return {
        type: "payment",
        paymentId,
        orderId: params.get("razorpay_order_id") || undefined,
        signature: params.get("razorpay_signature") || undefined,
      };
    }
    const event = params.get("event");
    if (event === "failed") {
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
  return {
    type: "failed",
    errorCode: params.get("error_code") || undefined,
    errorDescription: params.get("error_description") || undefined,
  };
}

export default function PaymentScreen({
  visible,
  onClose,
  onComplete,
  bookingId,
  userId,
  vendorId,
  vendorName,
  amount,
  paymentType,
  advancePercentage,
  userName,
  userEmail,
  userPhone,
}: PaymentScreenProps) {
  const [state, setState] = useState<PaymentState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Track if we're already processing a return from Razorpay
  const processingRef = useRef(false);
  const startingPaymentRef = useRef(false);
  const checkoutHandledRef = useRef(false);
  const pendingOrderIdRef = useRef<string | null>(null);

  // ── Deep link handler ──────────────────────────────────────────────
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

        // Step 1: Server-side signature verification (HMAC-SHA256)
        const verification = await verifyPaymentSignature({
          razorpay_order_id: parsed.orderId,
          razorpay_payment_id: parsed.paymentId,
          razorpay_signature: parsed.signature,
        });

        if (
          !verification.verified ||
          !verification.paymentRecorded ||
          verification.bookingId !== bookingId
        ) {
          setState("failed");
          setErrorMessage(
            verification.error ||
              "Payment verification did not match this booking. Please contact support if you were charged."
          );
          hapticError();
          processingRef.current = false;
          return;
        }

        // Step 2: Only after server verification passes, save transaction and update status
        const actualAmount =
          paymentType === "advance"
            ? Math.round(amount * (advancePercentage || 25) / 100)
            : amount;

        const saveResult = await savePaymentTransaction({
          bookingId,
          userId,
          vendorId,
          amount: actualAmount,
          razorpayOrderId: parsed.orderId,
          razorpayPaymentId: parsed.paymentId,
          razorpaySignature: parsed.signature,
          paymentType,
          advancePercentage:
            paymentType === "advance" ? advancePercentage || 25 : undefined,
        });

        if (saveResult.success) {
          await updateBookingPaymentStatus({
            bookingId,
            status: paymentType === "advance" ? "partial" : "paid",
          });
          setState("success");
          hapticSuccess();
          onComplete({ success: true, transactionId: saveResult.transactionId });
        } else {
          // Verification passed but DB save failed — contact support scenario
          setState("failed");
          setErrorMessage(
            "Payment verified but failed to record transaction. Please contact support with your payment ID: " +
              parsed.paymentId
          );
          hapticError();
          onComplete({ success: false, error: saveResult.error });
        }
      }

      processingRef.current = false;
    },
    [bookingId, userId, vendorId, amount, paymentType, advancePercentage, onComplete]
  );

  // Listen for deep links when the modal is visible
  useEffect(() => {
    if (!visible) return;

    const subscription = Linking.addEventListener("url", (event) => {
      handleDeepLink(event.url);
    });

    // Check for cold-start deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    return () => subscription.remove();
  }, [visible, handleDeepLink]);

  // ── Start Payment ──────────────────────────────────────────────────
  const handleStartPayment = useCallback(async () => {
    if (processingRef.current || startingPaymentRef.current) return;
    startingPaymentRef.current = true;
    checkoutHandledRef.current = false;
    setState("creating_order");
    setErrorMessage("");

    try {
      const result = await createRazorpayOrder({
        amount,
        bookingId,
        userId,
        vendorId,
        paymentType,
        advancePercentage:
          advancePercentage || (paymentType === "advance" ? 25 : 100),
      });

      if (!result.success) {
        setState("failed");
        setErrorMessage(result.error || "Failed to create payment order");
        hapticError();
        return;
      }

      pendingOrderIdRef.current = result.orderId;

      const actualAmount =
        paymentType === "advance"
          ? Math.round(amount * (advancePercentage || 25) / 100)
          : amount;

      // C3 fix: server-hosted HTTPS checkout page + registered-scheme
      // redirect. The old client-generated `data:text/html` URI is blocked
      // by modern browsers and redirected to `razorpay://`, a scheme no
      // app registers — payment results could never reach this screen.
      const checkoutUrl = buildCheckoutPageUrl({
        keyId: result.keyId,
        orderId: result.orderId,
        amountPaise: Math.round(actualAmount * 100),
        name: "ShaadiBazaar",
        description: `Payment for ${vendorName}${
          paymentType === "advance"
            ? ` (${advancePercentage || 25}% advance)`
            : ""
        }`,
        prefillName: userName,
        prefillEmail: userEmail,
        prefillContact: userPhone,
      });

      setState("checkout");

      if (Platform.OS === "web") {
        // Web cannot receive custom-scheme redirects; the /payment-result
        // route verifies the signature and shows the outcome there.
        await Linking.openURL(checkoutUrl);
      } else {
        // Native: openAuthSessionAsync resolves with the redirect URL
        // itself; the Linking listener below stays as a fallback.
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
  }, [
    amount,
    bookingId,
    userId,
    vendorId,
    vendorName,
    paymentType,
    advancePercentage,
    userName,
    userEmail,
    userPhone,
    handleDeepLink,
  ]);

  // ── UI Handlers ────────────────────────────────────────────────────
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

  // ── Render ─────────────────────────────────────────────────────────
  const computedAmount =
    paymentType === "advance"
      ? Math.round(amount * (advancePercentage || 25) / 100)
      : amount;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {state === "success" ? "Payment Successful" : "Payment"}
          </Text>
          {state !== "checkout" && (
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {state === "idle" && (
            <View style={styles.centerContent}>
              <Text style={styles.amountLabel}>Amount to Pay</Text>
              <Text style={styles.amountValue}>
                ₹{computedAmount.toLocaleString("en-IN")}
              </Text>
              {paymentType === "advance" && (
                <Text style={styles.advanceNote}>
                  {advancePercentage || 25}% advance of ₹
                  {amount.toLocaleString("en-IN")}
                </Text>
              )}
              <Text style={styles.vendorLabel}>{vendorName}</Text>

              <View style={styles.paymentInfoBox}>
                <Text style={styles.paymentInfoTitle}>Secure Payment</Text>
                <Text style={styles.paymentInfoText}>
                  Powered by Razorpay. Your payment information is encrypted
                  and secure. You'll be redirected to your browser to complete
                  the payment.
                </Text>
              </View>

              <Button
                title="Pay Now"
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
              <Text style={styles.loadingText}>
                Opening payment page...
              </Text>
              <Text style={styles.checkoutHint}>
                Complete the payment in your browser, then return to the app.
              </Text>
            </View>
          )}

          {state === "processing" && (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={Colors.light.primary} />
              <Text style={styles.loadingText}>Confirming payment...</Text>
            </View>
          )}

          {state === "success" && (
            <View style={styles.centerContent}>
              <View style={styles.successIcon}>
                <Text style={styles.successIconText}>✓</Text>
              </View>
              <Text style={styles.successTitle}>Payment Successful!</Text>
              <Text style={styles.successText}>
                Your booking has been confirmed. You will receive a
                confirmation email shortly.
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
  amountLabel: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.textLight,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 48,
    fontWeight: "700" as FontWeight,
    color: Colors.light.primary,
    marginBottom: 8,
  },
  advanceNote: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
    marginBottom: 16,
  },
  vendorLabel: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
    marginBottom: 32,
  },
  paymentInfoBox: {
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  paymentInfoTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600" as FontWeight,
    color: Colors.light.primary,
    marginBottom: 4,
  },
  paymentInfoText: {
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
