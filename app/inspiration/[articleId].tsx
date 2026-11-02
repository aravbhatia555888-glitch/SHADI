import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { useWeddingStore } from "@/stores/wedding-store";
import { FontWeight } from "@/types/styles";
import { Stack,useLocalSearchParams,useRouter } from "expo-router";
import {
ChevronLeft,
ChevronRight,
Clock,
Eye,
Heart,
Share2,
User
} from "lucide-react-native";
import { useEffect,useState } from "react";
import {
Image,
ScrollView,
Share,
StyleSheet,
Text,
TouchableOpacity,
View,
} from "react-native";

// Same articles data (in a real app, this would come from an API)
const INSPIRATION_ARTICLES = [
  {
    id: "1",
    title: "Traditional Elegance",
    description:
      "Blend traditional elements with modern touches for a timeless wedding experience.",
    content: `Traditional weddings have a timeless appeal that never goes out of style. By incorporating classic elements with contemporary touches, you can create a celebration that honors heritage while feeling fresh and modern.

Key Elements of Traditional Elegance:

Rich Fabrics: Consider using luxurious materials like silk, velvet, and brocade for your wedding attire and decor. Ornate Details: Gold accents, intricate embroidery, and traditional patterns add depth and richness. Classic Color Palette: Deep reds, golds, and creams create a sophisticated atmosphere. Traditional Ceremonies: Honor cultural rituals while adapting them to your personal style.

Modern Touches to Consider:

The beauty of traditional elegance lies in its adaptability. You can maintain the essence of tradition while incorporating contemporary elements that reflect your personality. Consider modern photography styles that capture traditional moments in artistic ways, or blend classic venue choices with contemporary catering options.

Planning Tips:

Start planning early to ensure you can secure traditional elements like skilled artisans for custom work, authentic fabrics, and experienced vendors who understand cultural requirements. Remember, the goal is to create a celebration that feels both timeless and personal to you.`,
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
    content: `Garden weddings offer a romantic and natural backdrop for your special day. The key to a successful outdoor celebration lies in thoughtful planning and embracing the natural beauty around you.

Seasonal Considerations:

Spring: Take advantage of blooming flowers and mild weather. Summer: Plan for shade and hydration for guests. Autumn: Embrace warm colors and cozy elements. Winter: Create magical moments with lighting and warmth.

Essential Planning Elements:

Weather contingency plans are crucial for outdoor weddings. Always have a backup indoor option or tent rental ready. Consider the comfort of your guests with appropriate seating, lighting for evening celebrations, and accessibility for all attendees.

Decor and Ambiance:

Let nature be your primary decorator, but enhance it thoughtfully. String lights create magical ambiance, while natural elements like wooden signs and floral arrangements complement the garden setting beautifully.

Practical Considerations:

Think about power sources for music and lighting, restroom facilities, and catering logistics. Work with vendors experienced in outdoor events to ensure smooth execution of your garden wedding vision.`,
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
    content: `The mehendi ceremony is one of the most joyous and colorful pre-wedding celebrations. This traditional event brings together family and friends for an afternoon of henna art, music, and celebration.

Planning Your Mehendi:

Venue Selection: Choose between home, garden, or dedicated event space. Artist Booking: Secure skilled henna artists well in advance. Seating Arrangements: Low tables and comfortable cushions work best. Music and Entertainment: Traditional songs and dance performances.

Creating the Perfect Atmosphere:

The mehendi ceremony should feel relaxed and festive. Bright colors, marigold decorations, and traditional music create an authentic atmosphere. Consider having different stations for various activities - henna application, refreshments, and entertainment.

Guest Experience:

Provide comfortable seating and ensure good lighting for the henna artists. Offer refreshments that are easy to eat while getting henna applied, and consider having entertainment like traditional singers or dancers.

Timeline and Logistics:

Start early in the day to allow time for intricate designs. Plan for 2-4 hours depending on the number of guests and complexity of designs. Have a designated area for drying henna and provide guidance on aftercare.`,
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
    content: `Bridal fashion continues to evolve, blending traditional craftsmanship with contemporary design elements. This year's lehenga trends showcase a beautiful mix of classic silhouettes with modern touches.

Color Trends:

Pastel Palettes: Soft pinks, mint greens, and powder blues. Jewel Tones: Deep emeralds, sapphires, and rich burgundies. Metallic Accents: Gold and silver threading for added glamour. Classic Reds: Still popular but with modern interpretations.

Design Elements:

Contemporary brides are choosing lehengas with unique details like asymmetrical hemlines, cape-style dupattas, and convertible pieces that can be styled multiple ways. Sustainable fabrics and ethical production are also becoming important considerations.

Styling Tips:

Consider your wedding venue and season when choosing your lehenga. Lighter fabrics work well for outdoor ceremonies, while heavier silks are perfect for traditional indoor celebrations. Don't forget to factor in comfort - you'll be wearing this for many hours!

Investment Pieces:

Many brides are opting for lehengas that can be repurposed for other occasions. Separates that can be mixed and matched, or pieces that can be altered for future events, provide excellent value.`,
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
    content: `Great wedding photography goes beyond just taking pictures - it's about capturing emotions, telling a story, and preserving memories that will last a lifetime.

Pre-Wedding Planning:

Timeline Discussion: Plan your day to maximize golden hour lighting. Shot List: Communicate must-have shots and family dynamics. Venue Scouting: Visit locations beforehand for the best angles. Backup Plans: Prepare for weather and equipment contingencies.

Photography Styles:

Consider what style resonates with you - traditional posed portraits, candid photojournalistic shots, or artistic fine art photography. Many couples choose a mix of styles to tell their complete story.

Working with Your Photographer:

Communication is key. Share your vision, discuss any concerns, and trust your photographer's expertise. They know how to capture the best moments while staying unobtrusive during your celebration.

Technical Considerations:

Discuss lighting requirements, especially for indoor venues. Consider whether you want flash photography during the ceremony, and plan for low-light situations during evening receptions.

Post-Wedding:

Understand the timeline for receiving your photos and what's included in your package. Many photographers offer online galleries for easy sharing with family and friends.`,
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
    content: `Destination weddings offer the perfect blend of celebration and vacation, creating unforgettable experiences for couples and their guests.

Planning Timeline:

Start planning 12-18 months in advance to secure the best venues and rates. This also gives guests time to plan their travel and accommodations.

Legal Requirements:

Research marriage requirements for your chosen destination. Some countries have residency requirements or specific documentation needs that must be completed in advance.

Guest Considerations:

Accommodation: Block hotel rooms at different price points. Activities: Plan events for the days surrounding your wedding. Welcome Bags: Include local treats and helpful information. Transportation: Arrange group transportation when possible.

Local Vendors:

Consider hiring a local wedding planner who understands the area's logistics, weather patterns, and vendor network. They can navigate language barriers and cultural differences.

Budget Planning:

Factor in travel costs for yourselves and potentially some key family members. Consider exchange rates and local pricing when budgeting for vendors and services.

Weather and Backup Plans:

Research the climate and have contingency plans for weather. Many destinations have distinct wet and dry seasons that can significantly impact your celebration.`,
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

export default function ArticleDetailScreen() {
  const router = useRouter();
  const { articleId, category } = useLocalSearchParams<{
    articleId: string;
    category?: string;
  }>();
  const { favoriteArticles, toggleFavoriteArticle } = useWeddingStore();

  const [readingProgress, setReadingProgress] = useState(0);

  // Map articles with favorite status from store
  const articlesWithFavorites = INSPIRATION_ARTICLES.map((article) => ({
    ...article,
    isFavorite: favoriteArticles.includes(article.id),
  }));

  const article = articlesWithFavorites.find((a) => a.id === articleId);
  const categoryFilter = category || "All";

  // Get articles in the same category for navigation
  const categoryArticles =
    categoryFilter === "All"
      ? articlesWithFavorites
      : articlesWithFavorites.filter((a) => a.category === categoryFilter);

  const currentIndex = categoryArticles.findIndex((a) => a.id === articleId);
  const previousArticle =
    currentIndex > 0 ? categoryArticles[currentIndex - 1] : null;
  const nextArticle =
    currentIndex < categoryArticles.length - 1
      ? categoryArticles[currentIndex + 1]
      : null;

  // Get related articles
  const relatedArticles = article
    ? articlesWithFavorites
        .filter(
          (a) =>
            article.relatedArticleIds.includes(a.id) ||
            (a.category === article.category && a.id !== article.id)
        )
        .slice(0, 3)
    : [];

  useEffect(() => {
    if (article) {
      // Simulate reading progress (in a real app, this would track scroll position)
      const timer = setTimeout(() => setReadingProgress(25), 1000);
      return () => clearTimeout(timer);
    }
  }, [article]);

  const handleToggleFavorite = async () => {
    if (!article) return;
    await toggleFavoriteArticle(article.id);
  };

  const handleShare = async () => {
    if (!article) return;
    try {
      await Share.share({
        message: `Check out this wedding inspiration article: ${article.title}`,
        title: article.title,
      });
    } catch (error) {
      if (__DEV__) console.error("Error sharing article:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderRelatedArticle = (
    relatedArticle: (typeof INSPIRATION_ARTICLES)[0]
  ) => (
    <TouchableOpacity
      key={relatedArticle.id}
      style={styles.relatedArticleCard}
      onPress={() => {
        router.push({
          pathname: "/inspiration/[articleId]",
          params: { articleId: relatedArticle.id, category: categoryFilter },
        });
      }}
    >
      <Image
        source={{ uri: relatedArticle.image }}
        style={styles.relatedArticleImage}
      />
      <View style={styles.relatedArticleContent}>
        <Text style={styles.relatedArticleTitle} numberOfLines={2}>
          {relatedArticle.title}
        </Text>
        <Text style={styles.relatedArticleReadTime}>
          {relatedArticle.readTime}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (!article) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: "Article Not Found",
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
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Article not found</Text>
          <TouchableOpacity
            style={styles.backToListButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backToListText}>Back to Articles</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ChevronLeft size={24} color={Colors.light.white} strokeWidth={1.5} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleShare}
                style={styles.headerAction}
              >
                <Share2 size={20} color={Colors.light.white} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        <Image source={{ uri: article.image }} style={styles.heroImage} />

        {/* Reading Progress Bar */}
        {readingProgress > 0 && (
          <View style={styles.progressContainer}>
            <View
              style={[styles.progressBar, { width: `${readingProgress}%` }]}
            />
          </View>
        )}

        {/* Article Content */}
        <View style={styles.contentContainer}>
          {/* Category Badge */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{article.category}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{article.title}</Text>

          {/* Author and Meta Info */}
          <View style={styles.metaContainer}>
            <View style={styles.authorContainer}>
              {article.author.avatar ? (
                <Image
                  source={{ uri: article.author.avatar }}
                  style={styles.authorAvatar}
                />
              ) : (
                <View style={styles.authorAvatarPlaceholder}>
                  <User
                    size={16}
                    color={Colors.light.textLight}
                    strokeWidth={1.5}
                  />
                </View>
              )}
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>{article.author.name}</Text>
                <Text style={styles.publishDate}>
                  {formatDate(article.publishDate)}
                </Text>
              </View>
            </View>

            <View style={styles.metaStats}>
              <View style={styles.metaStat}>
                <Clock
                  size={14}
                  color={Colors.light.textLight}
                  strokeWidth={1.5}
                />
                <Text style={styles.metaStatText}>{article.readTime}</Text>
              </View>
              <View style={styles.metaStat}>
                <Eye
                  size={14}
                  color={Colors.light.textLight}
                  strokeWidth={1.5}
                />
                <Text style={styles.metaStatText}>
                  {article.viewCount.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Article Content */}
          <Text style={styles.content}>{article.content}</Text>

          {/* Tags */}
          <View style={styles.tagsContainer}>
            {article.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                article.isFavorite && styles.favoriteActive,
              ]}
              onPress={handleToggleFavorite}
            >
              <Heart
                size={20}
                color={
                  article.isFavorite ? Colors.light.white : Colors.light.primary
                }
                fill={article.isFavorite ? Colors.light.white : "none"}
                strokeWidth={1.5}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  article.isFavorite && styles.favoriteActiveText,
                ]}
              >
                {article.isFavorite
                  ? "Saved to Favorites"
                  : "Save to Favorites"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Navigation */}
          <View style={styles.navigationContainer}>
            {previousArticle && (
              <TouchableOpacity
                style={[styles.navButton, styles.prevButton]}
                onPress={() => {
                  router.push({
                    pathname: "/inspiration/[articleId]",
                    params: {
                      articleId: previousArticle.id,
                      category: categoryFilter,
                    },
                  });
                }}
              >
                <ChevronLeft
                  size={16}
                  color={Colors.light.primary}
                  strokeWidth={1.5}
                />
                <View style={styles.navButtonContent}>
                  <Text style={styles.navButtonLabel}>Previous</Text>
                  <Text style={styles.navButtonTitle} numberOfLines={1}>
                    {previousArticle.title}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {nextArticle && (
              <TouchableOpacity
                style={[styles.navButton, styles.nextButton]}
                onPress={() => {
                  router.push({
                    pathname: "/inspiration/[articleId]",
                    params: {
                      articleId: nextArticle.id,
                      category: categoryFilter,
                    },
                  });
                }}
              >
                <View style={styles.navButtonContent}>
                  <Text style={styles.navButtonLabel}>Next</Text>
                  <Text style={styles.navButtonTitle} numberOfLines={1}>
                    {nextArticle.title}
                  </Text>
                </View>
                <ChevronRight
                  size={16}
                  color={Colors.light.primary}
                  strokeWidth={1.5}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={styles.relatedTitle}>Related Articles</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.relatedArticlesList}
              >
                {relatedArticles.map(renderRelatedArticle)}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
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
  headerActions: {
    flexDirection: "row",
    marginRight: 8,
  },
  headerAction: {
    padding: 4,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  heroImage: {
    width: "100%",
    height: 250,
  },
  progressContainer: {
    height: 3,
    backgroundColor: Colors.light.border,
  },
  progressBar: {
    height: "100%",
    backgroundColor: Colors.light.primary,
  },
  contentContainer: {
    padding: 20,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.light.primary + "20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  categoryText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.primary,
    fontWeight: "600" as FontWeight,
  },
  title: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
    lineHeight: 32,
    marginBottom: 20,
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  authorAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundAlt,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
  },
  publishDate: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
    marginTop: 2,
  },
  metaStats: {
    alignItems: "flex-end",
  },
  metaStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  metaStatText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
  },
  content: {
    fontSize: Typography.fontSizes.md,
    lineHeight: 24,
    color: Colors.light.text,
    marginBottom: 24,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  tag: {
    backgroundColor: Colors.light.backgroundAlt,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
    fontWeight: "500" as FontWeight,
  },
  actionsContainer: {
    marginBottom: 32,
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.backgroundAlt,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    gap: 8,
  },
  favoriteActive: {
    backgroundColor: Colors.light.favorite,
    borderColor: Colors.light.favorite,
  },
  bookmarkButton: {
    borderColor: Colors.light.primary,
  },
  bookmarkActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  actionButtonText: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.primary,
    fontWeight: "600" as FontWeight,
  },
  favoriteActiveText: {
    color: Colors.light.white,
  },
  bookmarkActiveText: {
    color: Colors.light.white,
  },
  navigationContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  navButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundAlt,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  prevButton: {
    marginRight: 6,
  },
  nextButton: {
    marginLeft: 6,
  },
  navButtonContent: {
    flex: 1,
  },
  navButtonLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.textLight,
    fontWeight: "500" as FontWeight,
    marginBottom: 4,
  },
  navButtonTitle: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.text,
    fontWeight: "600" as FontWeight,
  },
  relatedSection: {
    marginTop: 20,
  },
  relatedTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
    marginBottom: 16,
  },
  relatedArticlesList: {
    paddingRight: 20,
  },
  relatedArticleCard: {
    width: 200,
    marginRight: 16,
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 12,
    overflow: "hidden",
  },
  relatedArticleImage: {
    width: "100%",
    height: 120,
  },
  relatedArticleContent: {
    padding: 12,
  },
  relatedArticleTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
    marginBottom: 4,
  },
  relatedArticleReadTime: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.textLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorText: {
    fontSize: Typography.fontSizes.lg,
    color: Colors.light.textLight,
    marginBottom: 20,
  },
  backToListButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backToListText: {
    color: Colors.light.white,
    fontSize: Typography.fontSizes.md,
    fontWeight: "600" as FontWeight,
  },
});
