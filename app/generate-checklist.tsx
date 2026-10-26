import Button from "@/components/Button";
import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { generateSmartChecklist } from "@/services/ai-checklist";
import { useToastStore } from "@/stores/toast-store";
import { useWeddingStore } from "@/stores/wedding-store";
import { FontWeight } from "@/types/styles";
import { Stack,useRouter } from "expo-router";
import { Check,ChevronLeft,Wand2 } from "lucide-react-native";
import { useState } from "react";
import {
ScrollView,
StyleSheet,
Text,
TouchableOpacity,
View,
} from "react-native";

const CULTURES = [
  "Hindu",
  "Muslim",
  "Christian",
  "Sikh",
  "Jain",
  "Buddhist",
  "Interfaith",
];

export default function GenerateChecklistScreen() {
  const router = useRouter();
  const { weddingDetails } = useWeddingStore();
  const [selectedCulture, setSelectedCulture] = useState("Hindu");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateSmartChecklist(
        weddingDetails?.weddingDate || new Date().toISOString(),
        selectedCulture,
        weddingDetails?.totalBudget || 500000,
        weddingDetails?.weddingLocation || "India",
        200
      );

      if (result.wasFallback) {
        useToastStore.getState().showToast(
          result.error || "AI is temporarily unavailable. Showing a standard checklist instead.",
          "warning",
          4000
        );
      }

      router.push({
        pathname: "/(tabs)/checklist",
        params: { generated: JSON.stringify(result.tasks) },
      });
    } catch (_error) {
      useToastStore.getState().showToast("Failed to generate checklist. Please try again.", "error");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={Colors.light.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Checklist Generator</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <Wand2 size={48} color={Colors.light.primary} />
        </View>

        <Text style={styles.title}>Smart Checklist</Text>
        <Text style={styles.subtitle}>
          Let AI create a personalized wedding checklist based on your culture,
          budget, and timeline.
        </Text>

        <Text style={styles.sectionLabel}>Select Your Culture</Text>
        <View style={styles.cultureGrid}>
          {CULTURES.map((culture) => (
            <TouchableOpacity
              key={culture}
              style={[
                styles.cultureChip,
                selectedCulture === culture && styles.selectedCultureChip,
              ]}
              onPress={() => setSelectedCulture(culture)}
              accessibilityLabel={culture}
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedCulture === culture }}
            >
              {selectedCulture === culture && (
                <Check size={14} color={Colors.light.white} />
              )}
              <Text
                style={[
                  styles.cultureText,
                  selectedCulture === culture && styles.selectedCultureText,
                ]}
              >
                {culture}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>What you&apos;ll get:</Text>
          {[
            "15-20 personalized tasks",
            "Culture-specific ceremonies",
            "Priority-based ordering",
            "Timeline-aware due dates",
          ].map((item, i) => (
            <View key={i} style={styles.infoRow}>
              <Check size={16} color={Colors.light.success} />
              <Text style={styles.infoText}>{item}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={generating ? "Generating..." : "Generate My Checklist"}
          onPress={handleGenerate}
          loading={generating}
          renderIcon={() =>
            generating ? null : <Wand2 size={20} color={Colors.light.white} />
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.headerBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "600" as FontWeight,
    color: Colors.light.white,
  },
  content: { flex: 1, padding: 24 },
  iconContainer: { alignItems: "center", marginVertical: 24 },
  title: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.textLight,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
    marginBottom: 12,
  },
  cultureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 32,
  },
  cultureChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundAlt,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  selectedCultureChip: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  cultureText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.text,
    fontWeight: "500" as FontWeight,
  },
  selectedCultureText: { color: Colors.light.white },
  infoCard: {
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  infoTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  infoText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
});
