import Button from "@/components/Button";
import WeddingCardRenderer from "@/components/WeddingCardRenderer";
import Colors from "@/constants/colors";
import Constants from "expo-constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Typography from "@/constants/typography";
import { AnalyticsEvents,trackEvent } from "@/services/analytics";
import { useToastStore } from "@/stores/toast-store";
import { FontWeight } from "@/types/styles";
import type {
WeddingCardData,
WeddingCardTemplate,
} from "@/types/wedding-card";
import {
DEFAULT_CARD_DATA,
WEDDING_CARD_TEMPLATES,
} from "@/types/wedding-card";
import { getSavedCards,saveWeddingCard } from "@/services/wedding-cards";
import { hapticLight,hapticSuccess } from "@/utils/haptics";
import { Stack,useLocalSearchParams,useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import {
Bookmark,
Calendar,
Check,
ChevronLeft,
Download,
MapPin,
MessageSquare,
Palette,
Phone,
Share2,
Type,
} from "lucide-react-native";
import { useEffect,useRef,useState } from "react";
import {
Dimensions,
ScrollView,
StyleSheet,
Text,
TextInput,
TouchableOpacity,
View
} from "react-native";
// react-native-view-shot is not bundled in Expo Go; load it lazily so importing
// this route can't crash the app. Returns null when unavailable.
async function loadCaptureRef(): Promise<
  typeof import("react-native-view-shot")["captureRef"] | null
> {
  try {
    const mod = await import("react-native-view-shot");
    return mod.captureRef;
  } catch {
    return null;
  }
}

async function loadMediaLibrary(): Promise<
  typeof import("expo-media-library") | null
> {
  // Not available in Expo Go (ExpoMediaLibraryNext native module is missing).
  if (Constants.executionEnvironment === "storeClient") return null;
  try {
    return await import("expo-media-library");
  } catch {
    return null;
  }
}

const { width: _SCREEN_WIDTH } = Dimensions.get("window");

export default function CardDesignerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { templateId, cardId } = useLocalSearchParams<{
    templateId?: string;
    cardId?: string;
  }>();

  // Prefill from the URL: either a quick-start template or a saved card being
  // edited. The cardId (when present) is the source of truth — the card is
  // loaded from local storage so nothing is trusted from the URL string.
  const initialTemplate =
    WEDDING_CARD_TEMPLATES.find((t) => t.id === templateId) ||
    WEDDING_CARD_TEMPLATES[0];

  const [selectedTemplate, setSelectedTemplate] = useState<WeddingCardTemplate>(
    initialTemplate
  );
  const [cardData, setCardData] = useState<WeddingCardData>(DEFAULT_CARD_DATA);
  const [editingCardId, setEditingCardId] = useState<string | undefined>(
    cardId || undefined
  );

  // Load the saved card being edited (by id — never from URL params).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cardId) return;
      const cards = await getSavedCards();
      if (cancelled) return;
      const saved = cards.find((c) => c.id === cardId);
      if (!saved) return;
      setCardData(saved.data);
      const tpl = WEDDING_CARD_TEMPLATES.find(
        (t) => t.id === saved.templateId
      );
      if (tpl) setSelectedTemplate(tpl);
    })();
    return () => {
      cancelled = true;
    };
  }, [cardId]);

  // Track when a brand-new card is being created (no saved card attached).
  useEffect(() => {
    if (!cardId) {
      trackEvent(AnalyticsEvents.CARD_CREATE, {
        templateId: selectedTemplate.id,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once on mount
  }, []);
  const [activeTab, setActiveTab] = useState<"templates" | "content">(
    "templates"
  );
  const [saving, setSaving] = useState(false);
  const cardRef = useRef<View>(null);

  const updateField = (field: keyof WeddingCardData, value: string) => {
    setCardData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTemplateSelect = (template: WeddingCardTemplate) => {
    setSelectedTemplate(template);
    setCardData((prev) => ({ ...prev, templateId: template.id }));
    hapticLight();
  };

  const handleSaveCard = async () => {
    try {
      setSaving(true);
      const saved = await saveWeddingCard(
        selectedTemplate.id,
        cardData,
        editingCardId
      );
      if (saved) {
        setEditingCardId(saved.id);
        hapticSuccess();
        useToastStore
          .getState()
          .showToast(
            editingCardId ? "Card updated" : "Card saved to Your Cards",
            "success"
          );
        trackEvent(
          editingCardId ? AnalyticsEvents.CARD_UPDATE : AnalyticsEvents.CARD_SAVE,
          { templateId: selectedTemplate.id }
        );
      } else {
        useToastStore.getState().showToast("Could not save card", "error");
      }
    } catch {
      useToastStore.getState().showToast("Could not save card", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveToGallery = async () => {
    try {
      setSaving(true);
      const captureRef = await loadCaptureRef();
      if (!captureRef) {
        useToastStore
          .getState()
          .showToast("Saving cards isn't available in Expo Go.", "warning");
        return;
      }
      const MediaLibrary = await loadMediaLibrary();
      if (!MediaLibrary) {
        useToastStore
          .getState()
          .showToast("Saving to gallery isn't available in Expo Go.", "warning");
        return;
      }
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        useToastStore.getState().showToast("Please allow access to save images.", "warning");
        return;
      }

      const uri = await captureRef(cardRef, {
        format: "png",
        quality: 1,
      });

      await MediaLibrary.saveToLibraryAsync(uri);
      hapticSuccess();
      useToastStore.getState().showToast("Your wedding card has been saved to your gallery!", "success");
      trackEvent(AnalyticsEvents.CARD_GALLERY_SAVE, {
        templateId: selectedTemplate.id,
      });
    } catch (_error) {
      useToastStore.getState().showToast("Failed to save card. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    try {
      setSaving(true);
      const captureRef = await loadCaptureRef();
      if (!captureRef) {
        useToastStore
          .getState()
          .showToast("Sharing cards isn't available in Expo Go.", "warning");
        return;
      }
      const uri = await captureRef(cardRef, {
        format: "png",
        quality: 1,
      });

      await Sharing.shareAsync(uri, {
        dialogTitle: "Share Wedding Invitation",
        mimeType: "image/png",
      });
      trackEvent(AnalyticsEvents.CARD_SHARE, {
        templateId: selectedTemplate.id,
        groomName: cardData.groomName,
      });
    } catch (_error) {
      // User cancelled share
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={Colors.light.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wedding Card Designer</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Card Preview */}
      <View style={styles.previewContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.previewScroll}
        >
          <View ref={cardRef} style={styles.cardWrapper}>
            <WeddingCardRenderer
              template={selectedTemplate}
              data={cardData}
              scale={0.85}
            />
          </View>
        </ScrollView>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "templates" && styles.activeTab]}
          onPress={() => setActiveTab("templates")}
        >
          <Palette
            size={18}
            color={
              activeTab === "templates"
                ? Colors.light.primary
                : Colors.light.textLight
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "templates" && styles.activeTabText,
            ]}
          >
            Templates
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "content" && styles.activeTab]}
          onPress={() => setActiveTab("content")}
        >
          <Type
            size={18}
            color={
              activeTab === "content"
                ? Colors.light.primary
                : Colors.light.textLight
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "content" && styles.activeTabText,
            ]}
          >
            Content
          </Text>
        </TouchableOpacity>
      </View>

      {/* Editor Panel */}
      <View style={styles.editorPanel}>
        {activeTab === "templates" ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.templatesScroll}
          >
            {WEDDING_CARD_TEMPLATES.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[
                  styles.templateCard,
                  selectedTemplate.id === template.id &&
                    styles.selectedTemplateCard,
                ]}
                onPress={() => handleTemplateSelect(template)}
                accessibilityLabel={template.name}
                accessibilityRole="radio"
                accessibilityState={{
                  selected: selectedTemplate.id === template.id,
                }}
              >
                <View
                  style={[
                    styles.templatePreview,
                    { backgroundColor: template.colors.background },
                  ]}
                >
                  <View
                    style={[
                      styles.templateAccent,
                      { backgroundColor: template.colors.primary },
                    ]}
                  />
                  <Text
                    style={[
                      styles.templateName,
                      { color: template.colors.text },
                    ]}
                  >
                    {template.name}
                  </Text>
                  <Text
                    style={[
                      styles.templateStyle,
                      { color: template.colors.secondary },
                    ]}
                  >
                    {template.style}
                  </Text>
                </View>
                {selectedTemplate.id === template.id && (
                  <View style={styles.checkmark}>
                    <Check size={16} color={Colors.light.white} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          >
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Couple Names</Text>
              <View style={styles.rowInputs}>
                <View style={styles.inputWrapper}>
                  <Type size={16} color={Colors.light.textLight} />
                  <TextInput
                    style={styles.input}
                    placeholder="Groom's Name"
                    value={cardData.groomName}
                    onChangeText={(text) => updateField("groomName", text)}
                    placeholderTextColor={Colors.light.textLight}
                  />
                </View>
                <View style={styles.inputWrapper}>
                  <Type size={16} color={Colors.light.textLight} />
                  <TextInput
                    style={styles.input}
                    placeholder="Bride's Name"
                    value={cardData.brideName}
                    onChangeText={(text) => updateField("brideName", text)}
                    placeholderTextColor={Colors.light.textLight}
                  />
                </View>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Date & Time</Text>
              <View style={styles.inputWrapper}>
                <Calendar size={16} color={Colors.light.textLight} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 15th December 2026"
                  value={cardData.date}
                  onChangeText={(text) => updateField("date", text)}
                  placeholderTextColor={Colors.light.textLight}
                />
              </View>
              <View style={styles.inputWrapper}>
                <Calendar size={16} color={Colors.light.textLight} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 7:00 PM onwards"
                  value={cardData.time}
                  onChangeText={(text) => updateField("time", text)}
                  placeholderTextColor={Colors.light.textLight}
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Venue</Text>
              <View style={styles.inputWrapper}>
                <MapPin size={16} color={Colors.light.textLight} />
                <TextInput
                  style={styles.input}
                  placeholder="Venue Name"
                  value={cardData.venue}
                  onChangeText={(text) => updateField("venue", text)}
                  placeholderTextColor={Colors.light.textLight}
                />
              </View>
              <View style={styles.inputWrapper}>
                <MapPin size={16} color={Colors.light.textLight} />
                <TextInput
                  style={styles.input}
                  placeholder="Venue Address"
                  value={cardData.venueAddress}
                  onChangeText={(text) => updateField("venueAddress", text)}
                  placeholderTextColor={Colors.light.textLight}
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Message</Text>
              <View style={styles.inputWrapper}>
                <MessageSquare size={16} color={Colors.light.textLight} />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Personal message..."
                  value={cardData.message}
                  onChangeText={(text) => updateField("message", text)}
                  placeholderTextColor={Colors.light.textLight}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>RSVP</Text>
              <View style={styles.inputWrapper}>
                <Phone size={16} color={Colors.light.textLight} />
                <TextInput
                  style={styles.input}
                  placeholder="Contact Number"
                  value={cardData.rsvpContact}
                  onChangeText={(text) => updateField("rsvpContact", text)}
                  placeholderTextColor={Colors.light.textLight}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.inputWrapper}>
                <Calendar size={16} color={Colors.light.textLight} />
                <TextInput
                  style={styles.input}
                  placeholder="RSVP Deadline"
                  value={cardData.rsvpDate}
                  onChangeText={(text) => updateField("rsvpDate", text)}
                  placeholderTextColor={Colors.light.textLight}
                />
              </View>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>
        )}
      </View>

      {/* Action Buttons */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          title={editingCardId ? "Update Card" : "Save Card"}
          onPress={handleSaveCard}
          loading={saving}
          variant="outline"
          style={styles.footerButton}
          renderIcon={() => <Bookmark size={18} color={Colors.light.primary} />}
        />
        <Button
          title="Save to Gallery"
          onPress={handleSaveToGallery}
          loading={saving}
          variant="outline"
          style={styles.footerButton}
          renderIcon={() => <Download size={18} color={Colors.light.primary} />}
        />
        <Button
          title="Share Card"
          onPress={handleShare}
          loading={saving}
          style={styles.footerButton}
          renderIcon={() => <Share2 size={18} color={Colors.light.white} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "600" as FontWeight,
    color: Colors.light.white,
  },
  previewContainer: {
    backgroundColor: Colors.light.backgroundAlt,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  previewScroll: {
    paddingHorizontal: 24,
  },
  cardWrapper: {
    alignSelf: "center",
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: Colors.light.primary,
    backgroundColor: Colors.light.backgroundAlt,
  },
  tabText: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "500" as FontWeight,
    color: Colors.light.textLight,
  },
  activeTabText: {
    color: Colors.light.primary,
    fontWeight: "600" as FontWeight,
  },
  editorPanel: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  templatesScroll: {
    padding: 16,
    gap: 12,
  },
  templateCard: {
    width: 140,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: Colors.light.border,
    position: "relative",
  },
  selectedTemplateCard: {
    borderColor: Colors.light.primary,
  },
  templatePreview: {
    height: 180,
    padding: 12,
    justifyContent: "flex-end",
  },
  templateAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  templateName: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "700" as FontWeight,
  },
  templateStyle: {
    fontSize: Typography.fontSizes.xs,
    marginTop: 2,
    textTransform: "capitalize" as const,
  },
  checkmark: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  formSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600" as FontWeight,
    color: Colors.light.textLight,
    marginBottom: 10,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  rowInputs: {
    flexDirection: "row",
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSizes.md,
    color: Colors.light.text,
    padding: 0,
  },
  textArea: {
    height: 60,
    textAlignVertical: "top",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  footerButton: {
    flex: 1,
  },
});
