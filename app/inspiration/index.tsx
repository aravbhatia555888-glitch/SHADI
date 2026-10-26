import Card from "@/components/Card";
import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { useWeddingStore } from "@/stores/wedding-store";
import { FontWeight } from "@/types/styles";
import { Stack,useRouter } from "expo-router";
import {
Bookmark,
ChevronLeft,
ChevronRight,
Clock,
Eye,
Heart,
Search,
Share2,
} from "lucide-react-native";
import { useState } from "react";
import {
FlatList,
Image,
ScrollView,
StyleSheet,
Text,
TextInput,
TouchableOpacity,
View,
} from "react-native";

// Enhanced mock wedding inspiration articles
const INSPIRATION_ARTICLES = [
  {
    id: "1",
    title: "Traditional Elegance",
    description:
      "Blend traditional elements with modern touches for a timeless wedding experience.",
    content:
      "Traditional weddings have a timeless appeal that never goes out of style. By incorporating classic elements with contemporary touches, you can create a celebration that honors heritage while feeling fresh and modern. Consider using rich fabrics like silk and velvet, ornate gold accents, and traditional floral arrangements with roses and jasmine. The key is balance - pair traditional ceremonies with modern photography styles, or combine classic venue choices with contemporary catering options.",
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
      "Garden weddings offer a romantic and natural backdrop for your special day. The key to a successful outdoor celebration lies in thoughtful planning and embracing the natural beauty around you. Consider the season when planning your garden wedding - spring offers blooming flowers, summer provides lush greenery, autumn brings warm colors, and winter can create a magical wonderland. Essential elements include weather contingency plans, appropriate lighting for evening celebrations, and comfortable seating arrangements that complement the natural setting.",
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
      "The mehendi ceremony is one of the most joyous and colorful pre-wedding celebrations. This traditional event brings together family and friends for an afternoon of henna art, music, and celebration. Planning the perfect mehendi requires attention to several key elements: selecting skilled henna artists, creating a comfortable seating arrangement with cushions and low tables, organizing traditional music and dance, and providing refreshments that complement the festive atmosphere. Consider the venue carefully - whether at home, in a garden, or at a dedicated event space.",
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
      "Bridal fashion continues to evolve, blending traditional craftsmanship with contemporary design elements. This year's lehenga trends showcase a beautiful mix of classic silhouettes with modern touches. Popular trends include pastel color palettes beyond traditional reds, intricate thread work and mirror embellishments, crop top and skirt combinations, and sustainable fabric choices. Many brides are also opting for convertible pieces that can be styled differently for various wedding events, maximizing both style and value.",
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
      "Great wedding photography goes beyond just taking pictures - it's about capturing emotions, telling a story, and preserving memories that will last a lifetime. Key tips for stunning wedding photos include planning the timeline to make the most of golden hour lighting, communicating with your photographer about must-have shots and family dynamics, considering both candid and posed moments, and thinking about the overall narrative of your day. Don't forget to discuss backup plans for weather and equipment, and ensure your photographer understands your style preferences.",
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
      "Destination weddings offer the perfect blend of celebration and vacation, creating unforgettable experiences for couples and their guests. Successful destination wedding planning requires careful consideration of location accessibility, local marriage requirements, guest accommodation options, and cultural considerations. Start planning at least 12-18 months in advance to secure the best venues and rates. Consider hiring a local wedding planner who understands the area's logistics, weather patterns, and vendor network. Don't forget to create welcome bags for guests and plan activities for the days surrounding your wedding.",
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

const CATEGORIES = [
  "All",
  "Themes",
  "Venues",
  "Ceremonies",
  "Fashion",
  "Photography",
  "Planning",
];

export default function InspirationScreen() {
  const router = useRouter();
  const { favoriteArticles, toggleFavoriteArticle } = useWeddingStore();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Map articles with favorite status from store
  const articlesWithFavorites = INSPIRATION_ARTICLES.map((article) => ({
    ...article,
    isFavorite: favoriteArticles.includes(article.id),
  }));

  const filteredArticles =
    selectedCategory === "All"
      ? articlesWithFavorites
      : articlesWithFavorites.filter(
          (article) => article.category === selectedCategory
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

  // Show only first 3 articles on main page unless searching
  const displayedArticles = searchQuery
    ? searchFilteredArticles
    : searchFilteredArticles.slice(0, 3);

  const getCategoryCount = (category: string) => {
    if (category === "All") return INSPIRATION_ARTICLES.length;
    return INSPIRATION_ARTICLES.filter(
      (article) => article.category === category
    ).length;
  };

  const handleToggleFavorite = async (articleId: string) => {
    await toggleFavoriteArticle(articleId);
  };

  const handleViewAll = (category: string) => {
    router.push({
      pathname: "/inspiration/view-all",
      params: { category: category === "All" ? "" : category },
    });
  };

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
            params: { articleId: item.id, category: selectedCategory },
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
          title: "Wedding Inspiration",
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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
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
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <View style={styles.categoriesHeader}>
          <Text style={styles.categoriesTitle}>Categories</Text>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => handleViewAll(selectedCategory)}
          >
            <Eye size={16} color={Colors.light.primary} strokeWidth={1.5} />
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.selectedCategoryChip,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === category &&
                    styles.selectedCategoryChipText,
                ]}
              >
                {category} ({getCategoryCount(category)})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Articles */}
      <FlatList
        data={displayedArticles}
        renderItem={renderArticle}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.articlesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {searchQuery
                ? "No articles found matching your search."
                : "No articles available."}
            </Text>
          </View>
        )}
        ListFooterComponent={() =>
          !searchQuery && searchFilteredArticles.length > 3 ? (
            <TouchableOpacity
              style={styles.viewAllFooterButton}
              onPress={() => handleViewAll(selectedCategory)}
            >
              <Text style={styles.viewAllFooterText}>
                View All {searchFilteredArticles.length} Articles
              </Text>
              <ChevronRight
                size={16}
                color={Colors.light.primary}
                strokeWidth={1.5}
              />
            </TouchableOpacity>
          ) : null
        }
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  searchInputContainer: {
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
  categoriesContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  categoriesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  categoriesTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.primary,
    fontWeight: "500" as FontWeight,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundAlt,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  selectedCategoryChip: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  categoryChipText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.text,
    fontWeight: "500" as FontWeight,
  },
  selectedCategoryChipText: {
    color: Colors.light.background,
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
  },
  viewAllFooterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.backgroundAlt,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    marginTop: 20,
    gap: 8,
  },
  viewAllFooterText: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.primary,
    fontWeight: "600" as FontWeight,
  },
});
