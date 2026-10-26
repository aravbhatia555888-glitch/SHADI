/**
 * Payment Result (C3 fix — web return leg)
 *
 * The server-hosted Razorpay checkout redirects web users back to
 * <site>/payment-result with the payment triple (or an event= marker).
 * Native users never land here: openAuthSessionAsync resolves in-place.
 *
 * This screen verifies the signature via verify-razorpay-payment and
 * shows the outcome. Verification is idempotent server-side, so arriving
 * here twice is safe.
 */
import Button from "@/components/Button";
import Colors from "@/constants/colors";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle, XCircle } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { verifyPaymentSignature } from "@/services/payment";

type Phase = "verifying" | "success" | "failed";

export default function PaymentResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
    event?: string;
    error_description?: string;
  }>();

  const [phase, setPhase] = useState<Phase>("verifying");
  const [message, setMessage] = useState("Verifying your payment…");
  const [bookingId, setBookingId] = useState<string | undefined>(undefined);
  const [isSubscription, setIsSubscription] = useState(false);

  const runVerify = useCallback(async () => {
    const orderId = Array.isArray(params.razorpay_order_id)
      ? params.razorpay_order_id[0]
      : params.razorpay_order_id;
    const paymentId = Array.isArray(params.razorpay_payment_id)
      ? params.razorpay_payment_id[0]
      : params.razorpay_payment_id;
    const signature = Array.isArray(params.razorpay_signature)
      ? params.razorpay_signature[0]
      : params.razorpay_signature;

    if (params.event === "cancel") {
      setPhase("failed");
      setMessage("Payment was cancelled. You have not been charged.");
      return;
    }
    if (params.event === "failed") {
      setPhase("failed");
      setMessage(
        (Array.isArray(params.error_description)
          ? params.error_description[0]
          : params.error_description) || "Payment failed. Please try again."
      );
      return;
    }
    if (!orderId || !paymentId || !signature) {
      setPhase("failed");
      setMessage("Invalid payment response. Please contact support.");
      return;
    }

    const result = await verifyPaymentSignature({
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    });

    if (result.verified && (result.paymentRecorded || result.subscriptionActivated)) {
      if (result.subscriptionActivated) {
        setIsSubscription(true);
        setPhase("success");
        setMessage("Your vendor subscription has been successfully activated!");
      } else {
        setBookingId(result.bookingId);
        setPhase("success");
        setMessage("Your booking has been confirmed.");
      }
    } else {
      setPhase("failed");
      setMessage(
        result.error ||
          "Verification failed. If you were charged, our support team will process a refund."
      );
    }
  }, [params]);

  useEffect(() => {
    runVerify();
  }, [runVerify]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {phase === "verifying" ? (
          <ActivityIndicator size="large" color={Colors.light.primary} />
        ) : (
          <>
            {phase === "success" ? (
              <CheckCircle size={72} color={Colors.light.success} strokeWidth={2} />
            ) : (
              <XCircle size={72} color={Colors.light.error} strokeWidth={2} />
            )}
            <Text style={styles.title}>
              {phase === "success" ? "Payment Successful" : "Payment Not Completed"}
            </Text>
            <Text style={styles.message}>{message}</Text>
            {bookingId ? (
              <Text style={styles.meta}>Booking: {bookingId}</Text>
            ) : null}
            <View style={styles.actions}>
              <Button
                title={
                  phase === "success"
                    ? isSubscription
                      ? "Go to Vendor Dashboard"
                      : "Go to Home"
                    : "Back to App"
                }
                onPress={() => {
                  if (phase === "success" && isSubscription) {
                    router.replace("/vendor-dashboard");
                  } else if (router.canDismiss()) {
                    router.dismissAll();
                  } else {
                    router.replace("/(tabs)/home");
                  }
                }}
                style={styles.button}
              />
              {phase === "failed" ? (
                <Button
                  title="Retry Verification"
                  onPress={() => {
                    setPhase("verifying");
                    setMessage("Verifying your payment…");
                    runVerify();
                  }}
                  variant="outline"
                  style={styles.button}
                />
              ) : null}
            </View>
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.light.text,
    marginTop: 16,
  },
  message: {
    fontSize: 15,
    color: Colors.light.textLight,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
  meta: {
    fontSize: 12,
    color: Colors.light.textLight,
    marginTop: 12,
  },
  actions: {
    width: "100%",
    maxWidth: 360,
    marginTop: 28,
    gap: 12,
  },
  button: {
    width: "100%",
  },
});
