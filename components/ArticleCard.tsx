import Card from "@/components/Card";
import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { Article } from "@/schemas/wedding";
import { useRouter } from "expo-router";
import { Clock,Eye,Heart,Share2,User } from "lucide-react-native";
import { Image,StyleSheet,Text,TouchableOpacity,View } from "react-native";

interface ArticleCardProps {
  article: Article;
  onToggleFavorite: (articleId: string) => void;
  onShare?: (article: Article) => void;
  category?: string;
  variant?: "default" | "compact" | "featured";
  showAuthor?: boolean;
  showViewCount?: boolean;
}

export default function ArticleCard({
  article,
  onToggleFavorite,
  onShare,
  category = "All",
  variant = "default",
  showAuthor = false,
  showViewCount = false,
}: ArticleCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: "/inspiration/[articleId]",
      params: {
        articleId: article.id,
        category: category === "All" ? "" : category,
      },
    });
  };

  const handleShare = () => {
    if (onShare) {
      onShare(article);
    }
  };

  const formatViewCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const renderCompactCard = () => (
    <Card variant="elevated" style={styles.compactCard}>
      <TouchableOpacity
        onPress={handlePress}
        style={styles.compactContent}
        accessibilityRole="button"
        accessibilityLabel={`Read article: ${article.title}`}
      >
        <Image source={{ uri: article.image }} style={styles.compactImage} />
        <View style={styles.compactInfo}>
          <View style={styles.compactHeader}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{article.category}</Text>
            </View>
            <TouchableOpacity
              onPress={() => onToggleFavorite(article.id)}
              style={styles.favoriteButton}
              accessibilityRole="button"
              accessibilityLabel={
                article.isFavorite
                  ? "Remove from favorites"
                  : "Add to favorites"
              }
              accessibilityState={{ selected: article.isFavorite }}
            >
              <Heart
                size={16}
                color={
                  article.isFavorite
                    ? Colors.light.error
                    : Colors.light.textLight
                }
                fill={article.isFavorite ? Colors.light.error : "none"}
                strokeWidth={1.5}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.compactTitle} numberOfLines={2}>
            {article.title}
          </Text>

          <View style={styles.compactFooter}>
            <View style={styles.readTime}>
              <Clock
                size={12}
                color={Colors.light.textLight}
                strokeWidth={1.5}
              />
              <Text style={styles.compactReadTimeText}>{article.readTime}</Text>
            </View>
            {showViewCount && (
              <View style={styles.viewCount}>
                <Eye
                  size={12}
                  color={Colors.light.textLight}
                  strokeWidth={1.5}
                />
                <Text style={styles.compactReadTimeText}>
                  {formatViewCount(article.viewCount)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );

  const renderFeaturedCard = () => (
    <Card variant="elevated" style={styles.featuredCard}>
      <TouchableOpacity
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Read article: ${article.title}`}
      >
        <Image source={{ uri: article.image }} style={styles.featuredImage} />
        <View style={styles.featuredOverlay}>
          <View style={styles.featuredHeader}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{article.category}</Text>
            </View>
            <TouchableOpacity
              onPress={() => onToggleFavorite(article.id)}
              style={styles.favoriteButton}
              accessibilityRole="button"
              accessibilityLabel={
                article.isFavorite
                  ? "Remove from favorites"
                  : "Add to favorites"
              }
              accessibilityState={{ selected: article.isFavorite }}
            >
              <Heart
                size={20}
                color={
                  article.isFavorite
                    ? Colors.light.error
                    : Colors.light.background
                }
                fill={article.isFavorite ? Colors.light.error : "none"}
                strokeWidth={1.5}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.featuredContent}>
            <Text style={styles.featuredTitle}>{article.title}</Text>
            <Text style={styles.featuredDescription} numberOfLines={2}>
              {article.description}
            </Text>

            <View style={styles.featuredFooter}>
              <View style={styles.readTime}>
                <Clock
                  size={14}
                  color={Colors.light.background}
                  strokeWidth={1.5}
                />
                <Text style={styles.featuredReadTimeText}>
                  {article.readTime}
                </Text>
              </View>
              {showViewCount && (
                <View style={styles.viewCount}>
                  <Eye
                    size={14}
                    color={Colors.light.background}
                    strokeWidth={1.5}
                  />
                  <Text style={styles.featuredReadTimeText}>
                    {formatViewCount(article.viewCount)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );

  const renderDefaultCard = () => (
    <Card variant="elevated" style={styles.articleCard}>
      <TouchableOpacity
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Read article: ${article.title}`}
      >
        <Image source={{ uri: article.image }} style={styles.articleImage} />
        <View style={styles.articleContent}>
          <View style={styles.articleHeader}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{article.category}</Text>
            </View>
            <TouchableOpacity
              onPress={() => onToggleFavorite(article.id)}
              style={styles.favoriteButton}
              accessibilityRole="button"
              accessibilityLabel={
                article.isFavorite
                  ? "Remove from favorites"
                  : "Add to favorites"
              }
              accessibilityState={{ selected: article.isFavorite }}
            >
              <Heart
                size={20}
                color={
                  article.isFavorite
                    ? Colors.light.error
                    : Colors.light.textLight
                }
                fill={article.isFavorite ? Colors.light.error : "none"}
                strokeWidth={1.5}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.articleTitle}>{article.title}</Text>
          <Text style={styles.articleDescription}>{article.description}</Text>

          {showAuthor && (
            <View style={styles.authorContainer}>
              {article.author.avatar ? (
                <Image
                  source={{ uri: article.author.avatar }}
                  style={styles.authorAvatar}
                />
              ) : (
                <View style={styles.authorAvatarPlaceholder}>
                  <User
                    size={12}
                    color={Colors.light.textLight}
                    strokeWidth={1.5}
                  />
                </View>
              )}
              <Text style={styles.authorName}>{article.author.name}</Text>
            </View>
          )}

          <View style={styles.articleFooter}>
            <View style={styles.footerLeft}>
              <View style={styles.readTime}>
                <Clock
                  size={14}
                  color={Colors.light.textLight}
                  strokeWidth={1.5}
                />
                <Text style={styles.readTimeText}>{article.readTime}</Text>
              </View>
              {showViewCount && (
                <View style={styles.viewCount}>
                  <Eye
                    size={14}
                    color={Colors.light.textLight}
                    strokeWidth={1.5}
                  />
                  <Text style={styles.readTimeText}>
                    {formatViewCount(article.viewCount)}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel="Share article"
            >
              <Share2
                size={16}
                color={Colors.light.textLight}
                strokeWidth={1.5}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );

  switch (variant) {
    case "compact":
      return renderCompactCard();
    case "featured":
      return renderFeaturedCard();
    default:
      return renderDefaultCard();
  }
}

const styles = StyleSheet.create({
  articleCard: {
    marginBottom: 20,
    padding: 0,
    overflow: "hidden",
  },
  articleImage: {
    width: "100%",
    height: 200,
  },
  articleContent: {
    padding: 16,
  },
  articleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: Colors.light.primary + "20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.primary,
    fontWeight: Typography.fontWeights.semiBold,
  },
  favoriteButton: {
    padding: 4,
  },
  articleTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.text,
    marginBottom: 8,
  },
  articleDescription: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.textLight,
    lineHeight: 22,
    marginBottom: 16,
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  authorAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.backgroundAlt,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  authorName: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
    fontWeight: Typography.fontWeights.medium,
  },
  articleFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  readTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  readTimeText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.textLight,
  },
  viewCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  shareButton: {
    padding: 4,
  },

  compactCard: {
    marginBottom: 12,
    padding: 0,
    overflow: "hidden",
  },
  compactContent: {
    flexDirection: "row",
  },
  compactImage: {
    width: 80,
    height: 80,
  },
  compactInfo: {
    flex: 1,
    padding: 12,
  },
  compactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  compactTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.light.text,
    marginBottom: 8,
  },
  compactFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  compactReadTimeText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.textLight,
  },

  featuredCard: {
    marginBottom: 20,
    padding: 0,
    overflow: "hidden",
    height: 300,
  },
  featuredImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  featuredOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    padding: 16,
    justifyContent: "space-between",
  },
  featuredHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  featuredContent: {
    flex: 1,
    justifyContent: "flex-end",
  },
  featuredTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.background,
    marginBottom: 8,
  },
  featuredDescription: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.background,
    lineHeight: 22,
    marginBottom: 12,
    opacity: 0.9,
  },
  featuredFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featuredReadTimeText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.background,
    fontWeight: Typography.fontWeights.medium,
  },
});
