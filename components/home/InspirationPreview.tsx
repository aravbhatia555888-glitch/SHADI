import Card from "@/components/Card";
import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { ChevronRight,Heart } from "lucide-react-native";
import React from "react";
import { Image,StyleSheet,Text,TouchableOpacity,View } from "react-native";

interface InspirationPreviewProps {
  onArticlePress: (articleId: string) => void;
  onViewAllPress: () => void;
}

const ARTICLES = [
  {
    id: "traditional-elegance",
    title: "Traditional Elegance",
    description:
      "Blend traditional elements with modern touches for a timeless wedding experience.",
    imageUri:
      "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1296&q=80",
  },
] as const;

function InspirationPreview({
  onArticlePress,
  onViewAllPress,
}: InspirationPreviewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Wedding Inspiration</Text>
        <TouchableOpacity
          onPress={onViewAllPress}
          style={styles.viewAllButton}
          accessibilityRole="button"
          accessibilityLabel="View all inspiration"
        >
          <Text style={styles.viewAllText}>View All</Text>
          <ChevronRight
            size={16}
            color={Colors.light.primary}
            strokeWidth={1.5}
          />
        </TouchableOpacity>
      </View>
      {ARTICLES.map((article) => (
        <TouchableOpacity
          key={article.id}
          onPress={() => onArticlePress(article.id)}
          accessibilityRole="button"
          accessibilityLabel={`Read article: ${article.title}`}
          activeOpacity={0.8}
        >
          <Card variant="elevated" style={styles.inspirationCard}>
            <Image
              source={{ uri: article.imageUri }}
              style={styles.inspirationImage}
              resizeMode="cover"
            />
            <View style={styles.inspirationContent}>
              <Text style={styles.inspirationTitle}>{article.title}</Text>
              <Text style={styles.inspirationDescription}>
                {article.description}
              </Text>
              <View style={styles.inspirationButton}>
                <Heart
                  size={16}
                  color={Colors.light.primary}
                  strokeWidth={1.5}
                />
                <Text style={styles.inspirationButtonText}>
                  Save to Favorites
                </Text>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default React.memo(InspirationPreview);

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.light.text,
    letterSpacing: -0.3,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.primary,
    fontWeight: "500",
    marginRight: 4,
  },
  inspirationCard: {
    padding: 0,
    overflow: "hidden",
  },
  inspirationImage: {
    width: "100%",
    height: 180,
  },
  inspirationContent: {
    padding: 16,
  },
  inspirationTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 8,
  },
  inspirationDescription: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.textLight,
    marginBottom: 12,
  },
  inspirationButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  inspirationButtonText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.primary,
    fontWeight: "500",
    marginLeft: 4,
  },
});
