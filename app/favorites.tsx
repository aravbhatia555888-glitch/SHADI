import VendorCard from "@/components/VendorCard";
import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import type { Vendor } from "@/schemas/wedding";
import { useAuthStore } from "@/stores/auth-store";
import { useWeddingStore } from "@/stores/wedding-store";
import { FontWeight } from "@/types/styles";
import { Stack,useRouter } from "expo-router";
import { BookOpen,Clock,Grid,Heart,List,Users } from "lucide-react-native";
import { useEffect,useMemo,useState } from "react";
import {
FlatList,
Image,
ScrollView,
StyleSheet,
Text,
TouchableOpacity,
View,
} from "react-native";

interface InspirationArticle {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  readTime: string;
}

const INSPIRATION_ARTICLES: InspirationArticle[] = [
  {
    id: "1",
    title: "Traditional Elegance",
    description:
      "Blend traditional elements with modern touches for a timeless wedding experience.",
    image:
      "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=1296&q=80",
    category: "Themes",
    readTime: "5 min read",
  },
  {
    id: "2",
    title: "Outdoor Garden Wedding Ideas",
    description:
      "Create a magical outdoor celebration with these stunning garden wedding inspirations.",
    image:
      "https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1296&q=80",
    category: "Venues",
    readTime: "7 min read",
  },
  {
    id: "3",
    title: "Mehendi Ceremony Essentials",
    description:
      "Everything you need to know for planning the perfect mehendi celebration.",
    image:
      "https://images.unsplash.com/photo-1583391733956-6c78276477e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1296&q=80",
    category: "Ceremonies",
    readTime: "6 min read",
  },
  {
    id: "4",
    title: "Bridal Lehenga Trends 2024",
    description:
      "Discover the latest trends in bridal lehengas for your special day.",
    image:
      "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?ixlib=rb-4.0.3&auto=format&fit=crop&w=1296&q=80",
    category: "Fashion",
    readTime: "4 min read",
  },
  {
    id: "5",
    title: "Wedding Photography Tips",
    description:
      "Capture your special moments with these professional photography tips.",
    image:
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1296&q=80",
    category: "Photography",
    readTime: "8 min read",
  },
  {
    id: "6",
    title: "Destination Wedding Planning",
    description:
      "Plan your dream destination wedding with these expert tips and ideas.",
    image:
      "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1296&q=80",
    category: "Planning",
    readTime: "10 min read",
  },
];

export default function FavoritesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { vendors, favoriteVendors, favoriteArticles, initialize } =
    useWeddingStore();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [activeTab, setActiveTab] = useState<"vendors" | "articles">("vendors");

  useEffect(() => {
    if (user?.id) initialize(user.id);
  }, [initialize, user?.id]);

  const allFavoriteVendors = useMemo(
    () => vendors.filter((vendor) => favoriteVendors.includes(vendor.id)),
    [vendors, favoriteVendors]
  );

  const allFavoriteArticles = useMemo(
    () =>
      INSPIRATION_ARTICLES.filter((article) =>
        favoriteArticles.includes(article.id)
      ),
    [favoriteArticles]
  );

  const favoriteVendorsByCategory = useMemo(() => {
    const groupedByCategory = allFavoriteVendors.reduce((acc, vendor) => {
      const category = vendor.category;
      const existingCategory = acc.find((item) => item.category === category);

      if (existingCategory) {
        existingCategory.vendors.push(vendor);
      } else {
        acc.push({
          category,
          vendors: [vendor],
        });
      }

      return acc;
    }, [] as { category: string; vendors: Vendor[] }[]);

    return groupedByCategory;
  }, [allFavoriteVendors]);

  const navigateToVendor = (vendor: Vendor) => {
    router.push({
      pathname: "/vendor/[id]",
      params: { id: vendor.id },
    });
  };

  const navigateToArticle = (article: InspirationArticle) => {
    router.push({
      pathname: "/inspiration/[articleId]",
      params: { articleId: article.id },
    });
  };

  const renderVendorItem = ({ item }: { item: Vendor }) => (
    <View style={viewMode === "grid" ? styles.gridItem : styles.listItem}>
      <VendorCard vendor={item} onPress={() => navigateToVendor(item)} />
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              style={styles.viewToggle}
              accessibilityRole="button"
              accessibilityLabel={
                viewMode === "grid"
                  ? "Switch to list view"
                  : "Switch to grid view"
              }
            >
              {viewMode === "grid" ? (
                <List size={20} color={Colors.light.background} />
              ) : (
                <Grid size={20} color={Colors.light.background} />
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "vendors" && styles.activeTab]}
          onPress={() => setActiveTab("vendors")}
          accessibilityRole="tab"
          accessibilityLabel={`Vendors tab, ${allFavoriteVendors.length} favorites`}
          accessibilityState={{ selected: activeTab === "vendors" }}
        >
          <Users
            size={20}
            color={
              activeTab === "vendors"
                ? Colors.light.primary
                : Colors.light.textLight
            }
            strokeWidth={1.5}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "vendors" && styles.activeTabText,
            ]}
          >
            Vendors ({allFavoriteVendors.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "articles" && styles.activeTab]}
          onPress={() => setActiveTab("articles")}
          accessibilityRole="tab"
          accessibilityLabel={`Articles tab, ${allFavoriteArticles.length} favorites`}
          accessibilityState={{ selected: activeTab === "articles" }}
        >
          <BookOpen
            size={20}
            color={
              activeTab === "articles"
                ? Colors.light.primary
                : Colors.light.textLight
            }
            strokeWidth={1.5}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "articles" && styles.activeTabText,
            ]}
          >
            Articles ({allFavoriteArticles.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "vendors" && favoriteVendorsByCategory.length > 0 ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              {allFavoriteVendors.length} favorite{" "}
              {allFavoriteVendors.length === 1 ? "vendor" : "vendors"} across{" "}
              {favoriteVendorsByCategory.length}{" "}
              {favoriteVendorsByCategory.length === 1
                ? "category"
                : "categories"}
            </Text>
          </View>

          {favoriteVendorsByCategory.map((category) => (
            <View key={category.category} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>{category.category}</Text>
                <Text style={styles.categoryCount}>
                  {category.vendors.length}{" "}
                  {category.vendors.length === 1 ? "vendor" : "vendors"}
                </Text>
              </View>

              <FlatList
                data={category.vendors}
                renderItem={renderVendorItem}
                numColumns={viewMode === "grid" ? 2 : 1}
                key={`${category.category}-${viewMode}`}
                scrollEnabled={false}
                contentContainerStyle={styles.vendorList}
              />
            </View>
          ))}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      ) : activeTab === "vendors" ? (
        <View style={styles.emptyContainer}>
          <Heart
            size={64}
            color={Colors.light.error}
            fill={Colors.light.error}
            strokeWidth={1.5}
          />
          <Text style={styles.emptyTitle}>No Favorite Vendors Yet</Text>
          <Text style={styles.emptySubtext}>
            Start exploring vendors and tap the heart icon to add them to your
            favorites
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push("/(tabs)/vendors")}
            accessibilityRole="button"
            accessibilityLabel="Browse vendors"
          >
            <Text style={styles.browseButtonText}>Browse Vendors</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {activeTab === "articles" && allFavoriteArticles.length > 0 ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              {allFavoriteArticles.length} saved{" "}
              {allFavoriteArticles.length === 1 ? "article" : "articles"}
            </Text>
          </View>

          <View style={styles.articlesContainer}>
            {allFavoriteArticles.map((article) => (
              <TouchableOpacity
                key={article.id}
                style={styles.articleCard}
                onPress={() => navigateToArticle(article)}
                accessibilityRole="button"
                accessibilityLabel={`Read article: ${article.title}`}
              >
                <Image
                  source={{ uri: article.image }}
                  style={styles.articleImage}
                />
                <View style={styles.articleContent}>
                  <View style={styles.articleCategoryBadge}>
                    <Text style={styles.articleCategoryText}>
                      {article.category}
                    </Text>
                  </View>
                  <Text style={styles.articleTitle}>{article.title}</Text>
                  <Text style={styles.articleDescription} numberOfLines={2}>
                    {article.description}
                  </Text>
                  <View style={styles.articleFooter}>
                    <Clock
                      size={14}
                      color={Colors.light.textLight}
                      strokeWidth={1.5}
                    />
                    <Text style={styles.articleReadTime}>
                      {article.readTime}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      ) : activeTab === "articles" ? (
        <View style={styles.emptyContainer}>
          <BookOpen size={64} color={Colors.light.primary} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No Saved Articles Yet</Text>
          <Text style={styles.emptySubtext}>
            Explore wedding inspiration articles and tap the heart icon to save
            them
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push("/inspiration")}
            accessibilityRole="button"
            accessibilityLabel="Browse articles"
          >
            <Text style={styles.browseButtonText}>Browse Articles</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  viewToggle: {
    padding: 4,
    marginRight: 8,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    padding: 16,
    backgroundColor: Colors.light.backgroundAlt,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  statsText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
    textAlign: "center",
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.backgroundAlt,
  },
  categoryTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
  },
  categoryCount: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
    fontWeight: "500" as FontWeight,
  },
  vendorList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  gridItem: {
    flex: 1,
    margin: 8,
  },
  listItem: {
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
    marginTop: 24,
    marginBottom: 12,
  },
  emptySubtext: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.textLight,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  browseButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  browseButtonText: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "600" as FontWeight,
    color: Colors.light.background,
  },
  bottomSpacing: {
    height: 32,
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundAlt,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: Colors.light.primary,
  },
  tabText: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.textLight,
    fontWeight: "500" as FontWeight,
  },
  activeTabText: {
    color: Colors.light.primary,
    fontWeight: "600" as FontWeight,
  },
  articlesContainer: {
    padding: 16,
  },
  articleCard: {
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: Colors.light.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  articleImage: {
    width: "100%",
    height: 180,
  },
  articleContent: {
    padding: 16,
  },
  articleCategoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.light.primary + "20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  articleCategoryText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.primary,
    fontWeight: "600" as FontWeight,
  },
  articleTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "700" as FontWeight,
    color: Colors.light.text,
    marginBottom: 8,
  },
  articleDescription: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
    lineHeight: 20,
    marginBottom: 12,
  },
  articleFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  articleReadTime: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.textLight,
  },
});
