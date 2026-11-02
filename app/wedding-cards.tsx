import Button from "@/components/Button";
import WeddingCardRenderer from "@/components/WeddingCardRenderer";
import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import {
deleteSavedCard,
getSavedCards,
type SavedWeddingCard,
} from "@/services/wedding-cards";
import { AnalyticsEvents,trackEvent } from "@/services/analytics";
import { useToastStore } from "@/stores/toast-store";
import { FontWeight } from "@/types/styles";
import { WEDDING_CARD_TEMPLATES } from "@/types/wedding-card";
import { hapticLight,hapticSuccess } from "@/utils/haptics";
import { Stack,useFocusEffect,useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import {
ChevronLeft,
Edit3,
Palette,
Plus,
Share2,
Sparkles,
Trash2,
} from "lucide-react-native";
import { useCallback,useRef,useState } from "react";
import {
ActivityIndicator,
Alert,
ScrollView,
StyleSheet,
Text,
TouchableOpacity,
View,
} from "react-native";
import { captureRef } from "react-native-view-shot";

export default function WeddingCardsScreen() {
  const router = useRouter();
  const [savedCards, setSavedCards] = useState<SavedWeddingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, View | null>>({});

  const reload = useCallback(async () => {
    const cards = await getSavedCards();
    setSavedCards(cards);
    setLoading(false);
  }, []);

  // Refresh whenever the screen regains focus (e.g. after saving in the designer)
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const handleShare = async (card: SavedWeddingCard) => {
    try {
      setSharingId(card.id);
      const target = cardRefs.current[card.id];
      if (!target) {
        useToastStore.getState().showToast("Card is not ready to share yet", "warning");
        return;
      }
      const uri = await captureRef(target, {
        format: "png",
        quality: 0.9,
      });
      await Sharing.shareAsync(uri, {
        dialogTitle: "Share Wedding Invitation",
        mimeType: "image/png",
      });
      trackEvent(AnalyticsEvents.CARD_SHARE, {
        cardId: card.id,
        templateId: card.templateId,
        isSavedCard: true,
      });
    } catch {
      // User cancelled the share sheet — not an error
    } finally {
      setSharingId(null);
    }
  };

  const handleDelete = (card: SavedWeddingCard) => {
    Alert.alert(
      "Delete this card?",
      `${card.name} will be removed from your saved cards.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const ok = await deleteSavedCard(card.id);
            if (ok) {
              hapticSuccess();
              useToastStore.getState().showToast("Card deleted", "success");
              trackEvent(AnalyticsEvents.CARD_DELETE, {
                cardId: card.id,
                templateId: card.templateId,
              });
              reload();
            } else {
              useToastStore.getState().showToast("Could not delete card", "error");
            }
          },
        },
      ]
    );
  };

  const handleEdit = (card: SavedWeddingCard) => {
    // Note: CARD_UPDATE is tracked when the edit is actually saved in the
    // designer — opening the editor is not itself an update.
    router.push({
      pathname: "/card-designer",
      params: {
        templateId: card.templateId,
        cardId: card.id,
      },
    });
  };

  const renderSavedCard = (card: SavedWeddingCard) => {
    const template =
      WEDDING_CARD_TEMPLATES.find((t) => t.id === card.templateId) ||
      WEDDING_CARD_TEMPLATES[0];

    return (
      <View key={card.id} style={styles.savedCard}>
        <View
          ref={(ref) => {
            cardRefs.current[card.id] = ref;
          }}
          collapsable={false}
          style={styles.savedCardPreview}
        >
          <WeddingCardRenderer template={template} data={card.data} scale={0.3} />
        </View>
        <View style={styles.savedCardInfo}>
          <Text style={styles.savedCardName}>{card.name}</Text>
          <Text style={styles.savedCardDate}>{card.data.date}</Text>
          <Text style={styles.savedCardTemplate}>{template.name}</Text>
          <View style={styles.savedCardActions}>
            <TouchableOpacity
              style={styles.savedCardAction}
              onPress={() => handleEdit(card)}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${card.name} card`}
            >
              <Edit3 size={16} color={Colors.light.primary} />
              <Text style={styles.savedCardActionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.savedCardAction}
              onPress={() => handleShare(card)}
              disabled={sharingId === card.id}
              accessibilityRole="button"
              accessibilityLabel={`Share ${card.name} card`}
            >
              {sharingId === card.id ? (
                <ActivityIndicator size="small" color={Colors.light.primary} />
              ) : (
                <Share2 size={16} color={Colors.light.primary} />
              )}
              <Text style={styles.savedCardActionText}>
                {sharingId === card.id ? "Sharing..." : "Share"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.savedCardAction, styles.deleteAction]}
              onPress={() => handleDelete(card)}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${card.name} card`}
            >
              <Trash2 size={16} color={Colors.light.error} />
              <Text style={[styles.savedCardActionText, styles.deleteActionText]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={Colors.light.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wedding Cards</Text>
        <TouchableOpacity
          onPress={() => {
            hapticLight();
            router.push("/card-designer");
          }}
          style={styles.createButton}
        >
          <Plus size={20} color={Colors.light.white} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Create New Card CTA */}
        <TouchableOpacity
          style={styles.createCardBanner}
          onPress={() => router.push("/card-designer")}
          accessibilityLabel="Create new wedding card"
          accessibilityRole="button"
        >
          <View style={styles.createCardIcon}>
            <Palette size={32} color={Colors.light.primary} />
          </View>
          <View style={styles.createCardText}>
            <Text style={styles.createCardTitle}>Design Your Invitation</Text>
            <Text style={styles.createCardSubtitle}>
              Create beautiful digital wedding cards in minutes
            </Text>
          </View>
          <Sparkles size={20} color={Colors.light.secondary} />
        </TouchableOpacity>

        {/* Quick Templates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Start Templates</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.templatesScroll}
          >
            {WEDDING_CARD_TEMPLATES.slice(0, 4).map((template) => (
              <TouchableOpacity
                key={template.id}
                style={styles.templateCard}
                onPress={() => {
                  hapticLight();
                  router.push({
                    pathname: "/card-designer",
                    params: { templateId: template.id },
                  });
                }}
                accessibilityLabel={`${template.name} template`}
                accessibilityRole="button"
              >
                <View
                  style={[
                    styles.templatePreview,
                    { backgroundColor: template.colors.background },
                  ]}
                >
                  <Text
                    style={[
                      styles.templatePreviewName,
                      { color: template.colors.text },
                    ]}
                  >
                    {template.name}
                  </Text>
                  <View
                    style={[
                      styles.templatePreviewAccent,
                      { backgroundColor: template.colors.primary },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Saved Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Your Cards ({savedCards.length})
          </Text>
          {loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={Colors.light.primary} />
            </View>
          ) : savedCards.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Palette size={40} color={Colors.light.textLight} />
              <Text style={styles.emptyText}>No saved cards yet</Text>
              <Text style={styles.emptySubtext}>
                Design a card and it will appear here
              </Text>
              <Button
                title="Create your first card"
                onPress={() => router.push("/card-designer")}
                style={styles.emptyButton}
              />
            </View>
          ) : (
            savedCards.map(renderSavedCard)
          )}
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Pro Tips</Text>
          {[
            "Add your parents names for a traditional touch",
            "Include RSVP details to manage guest count",
            "Share via WhatsApp for quick distribution",
            "Save as image for printing physical cards",
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  createButton: {
    padding: 4,
  },
  createCardBanner: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    padding: 20,
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.light.primary + "30",
    borderStyle: "dashed",
    gap: 16,
  },
  createCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.light.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  createCardText: {
    flex: 1,
  },
  createCardTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
    marginBottom: 4,
  },
  createCardSubtitle: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
    lineHeight: 18,
  },
  section: {
    marginTop: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
    marginBottom: 12,
  },
  templatesScroll: {
    gap: 12,
  },
  templateCard: {
    width: 160,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: Colors.light.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  templatePreview: {
    height: 200,
    padding: 16,
    justifyContent: "space-between",
  },
  templatePreviewName: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "700" as FontWeight,
  },
  templatePreviewAccent: {
    height: 4,
    borderRadius: 2,
    width: "60%",
  },
  savedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  savedCardPreview: {
    width: 80,
    height: 112,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 14,
  },
  savedCardInfo: {
    flex: 1,
  },
  savedCardName: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
    marginBottom: 2,
  },
  savedCardDate: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
    marginBottom: 4,
  },
  savedCardTemplate: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.primary,
    fontWeight: "600" as FontWeight,
    marginBottom: 8,
  },
  savedCardActions: {
    flexDirection: "row",
    gap: 14,
  },
  savedCardAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  savedCardActionText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.primary,
    fontWeight: "600" as FontWeight,
  },
  deleteAction: {
    marginLeft: "auto",
  },
  deleteActionText: {
    color: Colors.light.error,
  },
  tipsCard: {
    margin: 16,
    padding: 20,
    backgroundColor: Colors.light.softBackground,
    borderRadius: 16,
  },
  tipsTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  tipBullet: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.primary,
    fontWeight: "700" as FontWeight,
    lineHeight: 20,
  },
  tipText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.text,
    lineHeight: 20,
    flex: 1,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 32,
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 8,
  },
  emptyText: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
    textAlign: "center",
  },
  emptyButton: {
    marginTop: 8,
    alignSelf: "center",
  },
});
