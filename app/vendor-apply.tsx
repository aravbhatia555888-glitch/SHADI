import Button from "@/components/Button";
import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { useToastStore } from "@/stores/toast-store";
import { useWeddingStore } from "@/stores/wedding-store";
import { FontWeight } from "@/types/styles";
import { hapticError, hapticSelection, hapticSuccess } from "@/utils/haptics";
import { Stack, useRouter } from "expo-router";
import { Check, ChevronLeft, Store } from "lucide-react-native";
import { useState } from "react";
import {
KeyboardAvoidingView,
Platform,
ScrollView,
StyleSheet,
Text,
TextInput,
TouchableOpacity,
View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CATEGORIES = [
  "Venue",
  "Photography",
  "Catering",
  "Mehendi Artist",
  "Decoration",
  "Makeup",
  "Music & DJ",
  "Invitations",
  "Other",
];

export default function VendorApplyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { createVendor } = useWeddingStore();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Venue");
  const [city, setCity] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Add your business name.");
      hapticError();
      return;
    }
    if (!city.trim()) {
      setError("Add the city you serve.");
      hapticError();
      return;
    }
    if (!description.trim()) {
      setError("Add a short description of what you offer.");
      hapticError();
      return;
    }

    const price = Number(startingPrice.replace(/,/g, "").trim());
    if (startingPrice.trim() && (!Number.isFinite(price) || price < 0)) {
      setError("Enter a valid starting price, or leave it blank.");
      hapticError();
      return;
    }

    setError(null);
    setSubmitting(true);

    const result = await createVendor({
      name: name.trim(),
      category,
      city: city.trim(),
      description: description.trim(),
      startingPrice: Number.isFinite(price) ? price : 0,
    });

    setSubmitting(false);

    if (!result.success) {
      setError(result.error || "Could not submit your listing. Please try again.");
      hapticError();
      return;
    }

    hapticSuccess();
    useToastStore
      .getState()
      .showToast(
        "Listing submitted. We'll review it and email you when it's live.",
        "success",
        6000
      );
    router.replace("/(tabs)/home");
  };

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
        <View style={styles.heroBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
          >
            <ChevronLeft size={24} color={Colors.light.background} />
          </TouchableOpacity>
          <Text style={styles.stepCount}>Vendor</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.heroIcon}>
          <Store size={26} color={Colors.light.secondary} />
        </View>
        <Text style={styles.heroKicker}>List your business</Text>
        <Text style={styles.heroTitle}>Get discovered by couples.</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>Business name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (error) setError(null);
            }}
            placeholder="e.g., Royal Palace Banquets"
            placeholderTextColor={Colors.light.textLight}
            accessibilityLabel="Business name"
          />

          <Text style={[styles.label, styles.spaced]}>Category</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.chip, category === option && styles.chipSelected]}
                onPress={() => {
                  hapticSelection();
                  setCategory(option);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: category === option }}
                accessibilityLabel={option}
              >
                {category === option && (
                  <Check size={14} color={Colors.light.background} strokeWidth={3} />
                )}
                <Text
                  style={[
                    styles.chipText,
                    category === option && styles.chipTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, styles.spaced]}>City</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={(text) => {
              setCity(text);
              if (error) setError(null);
            }}
            placeholder="Mumbai"
            placeholderTextColor={Colors.light.textLight}
            accessibilityLabel="City"
          />

          <Text style={[styles.label, styles.spaced]}>Starting price (₹)</Text>
          <TextInput
            style={styles.input}
            value={startingPrice}
            onChangeText={(text) => {
              setStartingPrice(text);
              if (error) setError(null);
            }}
            placeholder="50000"
            placeholderTextColor={Colors.light.textLight}
            keyboardType="numeric"
            accessibilityLabel="Starting price in rupees"
          />

          <Text style={[styles.label, styles.spaced]}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              if (error) setError(null);
            }}
            placeholder="Tell couples what you offer, your style, and what makes you stand out."
            placeholderTextColor={Colors.light.textLight}
            multiline
            numberOfLines={4}
            accessibilityLabel="Description"
          />

          {error ? (
            <Text
              style={styles.error}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
            >
              {error}
            </Text>
          ) : null}

          <Text style={styles.hint}>
            Listings are reviewed before they go live. You can edit the details
            afterwards from your vendor dashboard.
          </Text>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Button
            title={submitting ? "Submitting…" : "Submit for review"}
            size="large"
            loading={submitting}
            onPress={handleSubmit}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  hero: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCount: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700" as FontWeight,
    color: Colors.light.secondary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: Colors.light.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroKicker: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700" as FontWeight,
    color: Colors.light.secondary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800" as FontWeight,
    color: Colors.light.background,
  },
  body: {
    padding: 24,
    flexGrow: 1,
  },
  label: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
    marginBottom: 8,
  },
  spaced: {
    marginTop: 22,
  },
  input: {
    minHeight: 52,
    backgroundColor: Colors.light.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.light.inputBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: Typography.fontSizes.md,
    color: Colors.light.text,
  },
  textArea: {
    height: 110,
    textAlignVertical: "top",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 999,
    backgroundColor: Colors.light.white,
    borderWidth: 1.5,
    borderColor: Colors.light.inputBorder,
  },
  chipSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  chipText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
  },
  chipTextSelected: {
    color: Colors.light.background,
  },
  hint: {
    marginTop: 20,
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.textLight,
    lineHeight: 18,
  },
  error: {
    marginTop: 20,
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.error,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
});
