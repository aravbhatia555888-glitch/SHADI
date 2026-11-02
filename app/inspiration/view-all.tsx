import Card from "@/components/Card";
import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { useWeddingStore } from "@/stores/wedding-store";
import { FontWeight } from "@/types/styles";
import { Stack,useLocalSearchParams,useRouter } from "expo-router";
import {
Bookmark,
ChevronLeft,
Clock,
Heart,
Search,
Share2,
SlidersHorizontal,
} from "lucide-react-native";
import { useState } from "react";
import {
FlatList,
Image,
StyleSheet,
Text,
TextInput,
TouchableOpacity,
View,
} from "react-native";

// Import the same articles data (in a real app, this would come from an API)
const INSPIRATION_ARTICLES = [
  {
    id: "1",
    title: "Traditional Elegance",
    description:
      "Blend traditional elements with modern touches for a timeless wedding experience.",
    content:
      "Traditional weddings have a timeless appeal that never goes out of style. By incorporating classic elements with contemporary touches, you can create a celebration that honors heritage while feeling fresh and modern.",
    image:
      "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1296&q=80",
    category: "Themes",
    readTime: "5 min read",
    author: {
      name: "Priya Sharma",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150",
    },
    publishDate: "2024-10-15T10:00:00Z",
    tags: ["traditional", "elegant", "classic", "heritage"],
    isFavorite: false,
    isBookmarked: false,
    viewCount: 1250,
    shareCount: 89,
    relatedArticleIds: ["3", "4"],
  },
  {
    id: "2",
    title: "Outdoor Garden Wedding Ideas",
    description:
      "Create a magical outdoor celebration with these stunning garden wedding inspirations.",
    content:
      "Garden weddings offer a romantic and natural backdrop for your special day. The key to a successful outdoor celebration lies in thoughtful planning and embracing the natural beauty around you.",
    image:
      "https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1296&q=80",
    category: "Venues",
    readTime: "7 min read",
    author: {
      name: "Arjun Patel",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    },
    publishDate: "2024-10-12T14:30:00Z",
    tags: ["outdoor", "garden", "natural", "romantic"],
    isFavorite: false,
    isBookmarked: false,
    viewCount: 2100,
    shareCount: 156,
    relatedArticleIds: ["5", "6"],
  },
  {
    id: "3",
    title: "Mehendi Ceremony Essentials",
    description:
      "Everything you need to know for planning the perfect mehendi celebration.",
    content:
      "The mehendi ceremony is one of the most joyous and colorful pre-wedding celebrations. This traditional event brings together family and friends for an afternoon of henna art, music, and celebration.",
    image:
      "https://images.unsplash.com/photo-1583391733956-6c78276477e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1296&q=80",
    category: "Ceremonies",
    readTime: "6 min read",
    author: {
      name: "Meera Gupta",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    },
    publishDate: "2024-10-10T16:45:00Z",
    tags: ["mehendi", "ceremony", "traditional", "celebration"],
    isFavorite: false,
    isBookmarked: false,
    viewCount: 1800,
    shareCount: 134,
    relatedArticleIds: ["1", "4"],
  },
  {
    id: "4",
    title: "Bridal Lehenga Trends 2024",
    description:
      "Discover the latest trends in bridal lehengas for your special day.",
    content:
      "Bridal fashion continues to evolve, blending traditional craftsmanship with contemporary design elements. This year's lehenga trends showcase a beautiful mix of classic silhouettes with modern touches.",
    image:
      "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?ixlib=rb-4.0.3&auto=format&fit=crop&w=1296&q=80",
    category: "Fashion",
    readTime: "4 min read",
    author: {
      name: "Kavya Singh",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    },
    publishDate: "2024-10-08T11:20:00Z",
    tags: ["bridal", "lehenga", "fashion", "trends"],
    isFavorite: false,
    isBookmarked: false,
    viewCount: 3200,
    shareCount: 245,
    relatedArticleIds: ["1", "3"],
  },
  {
    id: "5",
    title: "Wedding Photography Tips",
    description:
      "Capture your special moments with these professional photography tips.",
    content:
      "Great wedding photography goes beyond just taking pictures - it's about capturing emotions, telling a story, and preserving memories that will last a lifetime.",
    image:
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1296&q=80",
    category: "Photography",
    readTime: "8 min read",
    author: {
      name: "Rohit Kumar",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    },
    publishDate: "2024-10-05T09:15:00Z",
    tags: ["photography", "tips", "memories", "professional"],
    isFavorite: false,
    isBookmarked: false,
    viewCount: 2800,
    shareCount: 198,
    relatedArticleIds: ["2", "6"],
  },
  {
    id: "6",
    title: "Destination Wedding Planning",
    description:
      "Plan your dream destination wedding with these expert tips and ideas.",
    content:
      "Destination weddings offer the perfect blend of celebration and vacation, creating unforgettable experiences for couples and their guests.",
    image:
      "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1296&q=80",
    category: "Planning",
    readTime: "10 min read",
    author: {
      name: "Anita Desai",
      avatar:
        "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150",
    },
    publishDate: "2024-10-01T13:00:00Z",
    tags: ["destination", "planning", "travel", "celebration"],
    isFavorite: false,
    isBookmarked: false,
    viewCount: 4100,
    shareCount: 312,
    relatedArticleIds: ["2", "5"],
  },
];

type SortOption = "newest" | "popular" | "trending";

export default function ViewAllArticlesScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const { favoriteArticles, toggleFavoriteArticle } = useWeddingStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSortOptions, setShowSortOptions] = useState(false);

  // Map articles with favorite status from store
  const articlesWithFavorites = INSPIRATION_ARTICLES.map((article) => ({
    ...article,
    isFavorite: favoriteArticles.includes(article.id),
  }));

  const categoryFilter = category || "All";

  const filteredArticles =
    categoryFilter === "All"
      ? articlesWithFavorites
      : articlesWithFavorites.filter(
          (article) => article.category === categoryFilter
        );

  const searchFilteredArticles = searchQuery
    ? filteredArticles.filter(
        (article) =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          article.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : filteredArticles;

  const sortedArticles = [...searchFilteredArticles].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return b.viewCount - a.viewCount;
      case "trending":
        return b.shareCount - a.shareCount;
      case "newest":
      default:
        return (
          new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
        );
    }
  });

  const handleToggleFavorite = async (articleId: string) => {
    await toggleFavoriteArticle(articleId);
  };

  const renderSortOption = (option: SortOption, label: string) => (
    <TouchableOpacity
      key={option}
      style={[
        styles.sortOption,
        sortBy === option && styles.selectedSortOption,
      ]}
      onPress={() => {
        setSortBy(option);
        setShowSortOptions(false);
      }}
    >
      <Text
        style={[
          styles.sortOptionText,
          sortBy === option && styles.selectedSortOptionText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderArticle = ({
    item,
  }: {
    item: (typeof INSPIRATION_ARTICLES)[0];
  }) => (
    <Card variant="elevated" style={styles.articleCard}>
      <TouchableOpacity
        onPress={() => {
          router.push({
            pathname: "/inspiration/[articleId]",
            params: { articleId: item.id, category: categoryFilter },
          });
        }}
      >
        <Image source={{ uri: item.image }} style={styles.articleImage} />
        <View style={styles.articleContent}>
          <View style={styles.articleHeader}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
            <View style={styles.articleActions}>
              {item.isBookmarked && (
                <View style={styles.bookmarkIndicator}>
                  <Bookmark
                    size={14}
                    color={Colors.light.primary}
                    fill={Colors.light.primary}
                    strokeWidth={1.5}
                  />
                </View>
              )}
              <TouchableOpacity
                onPress={() => handleToggleFavorite(item.id)}
                style={styles.favoriteButton}
              >
                <Heart
                  size={20}
                  color={
                    item.isFavorite
                      ? Colors.light.favorite
                      : Colors.light.textLight
                  }
                  fill={item.isFavorite ? Colors.light.favorite : "none"}
                  strokeWidth={1.5}
                />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.articleTitle}>{item.title}</Text>
          <Text style={styles.articleDescription}>{item.description}</Text>

          <View style={styles.articleFooter}>
            <View style={styles.readTime}>
              <Clock
                size={14}
                color={Colors.light.textLight}
                strokeWidth={1.5}
              />
              <Text style={styles.readTimeText}>{item.readTime}</Text>
            </View>
            <TouchableOpacity style={styles.shareButton}>
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

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: `${categoryFilter} Articles (${sortedArticles.length})`,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ChevronLeft
                size={24}
                color={Colors.light.white}
                strokeWidth={1.5}
              />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Search and Sort Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={Colors.light.textLight} strokeWidth={1.5} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search articles..."
            placeholderTextColor={Colors.light.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortOptions(!showSortOptions)}
        >
          <SlidersHorizontal
            size={20}
            color={Colors.light.primary}
            strokeWidth={1.5}
          />
        </TouchableOpacity>
      </View>

      {/* Sort Options */}
      {showSortOptions && (
        <View style={styles.sortOptionsContainer}>
          {renderSortOption("newest", "Newest First")}
          {renderSortOption("popular", "Most Popular")}
          {renderSortOption("trending", "Trending")}
        </View>
      )}

      {/* Articles List */}
      <FlatList
        data={sortedArticles}
        renderItem={renderArticle}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.articlesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {searchQuery
                ? `No articles found matching "${searchQuery}" in ${categoryFilter} category.`
                : `No articles available in ${categoryFilter} category.`}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  backButton: {
    marginLeft: 8,
    padding: 4,
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSizes.md,
    color: Colors.light.text,
  },
  sortButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.backgroundAlt,
  },
  sortOptionsContainer: {
    backgroundColor: Colors.light.backgroundAlt,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    padding: 8,
    elevation: 2,
    shadowColor: Colors.light.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sortOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  selectedSortOption: {
    backgroundColor: Colors.light.primary + "20",
  },
  sortOptionText: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.text,
    fontWeight: "500" as FontWeight,
  },
  selectedSortOptionText: {
    color: Colors.light.primary,
    fontWeight: "600" as FontWeight,
  },
  articlesList: {
    padding: 16,
  },
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
  articleActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bookmarkIndicator: {
    padding: 2,
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
    fontWeight: "600" as FontWeight,
  },
  favoriteButton: {
    padding: 4,
  },
  articleTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
    marginBottom: 8,
  },
  articleDescription: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.textLight,
    lineHeight: 22,
    marginBottom: 16,
  },
  articleFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  shareButton: {
    padding: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.textLight,
    textAlign: "center",
    lineHeight: 22,
  },
});
