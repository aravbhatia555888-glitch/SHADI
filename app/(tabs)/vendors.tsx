import Button from "@/components/Button";
import VendorCard from "@/components/VendorCard";
import VendorCardSkeleton from "@/components/home/VendorCardSkeleton";
import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { Vendor } from "@/schemas/wedding";
import { FontWeight } from "@/types/styles";
import { AnalyticsEvents,trackEvent } from "@/services/analytics";
import { useWeddingStore } from "@/stores/wedding-store";
import { hapticSelection } from "@/utils/haptics";
import { parsePriceString } from "@/utils/price";
import { useNavigation,useRouter } from "expo-router";
import {
AlertTriangle,
Building,
Camera,
ChevronDown,
Filter,
Flower,
GitCompare,
Grid,
List,
LucideIcon,
MoreHorizontal,
RotateCcw,
Search,
Sparkles,
Utensils,
X,
} from "lucide-react-native";
import { useLayoutEffect,useMemo,useState } from "react";
import {
FlatList,
Modal,
ScrollView,
StyleSheet,
Text,
TextInput,
TouchableOpacity,
View
} from "react-native";

const categoryIconMap: Record<string, LucideIcon> = {
  venue: Building,
  venues: Building,
  decoration: Flower,
  decor: Flower,
  makeup: Sparkles,
  beauty: Sparkles,
  catering: Utensils,
  photography: Camera,
  "mehendi artist": Sparkles,
  mehendi: Sparkles,
  default: MoreHorizontal,
};

const countries = [
  { code: "IN", name: "India" },
  { code: "US", name: "United States" },
  { code: "UK", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "CA", name: "Canada" },
];

const citiesByCountry: Record<string, string[]> = {
  IN: [
    "Mumbai",
    "Delhi",
    "Bangalore",
    "Hyderabad",
    "Chennai",
    "Kolkata",
    "Pune",
    "Ahmedabad",
    "Jaipur",
    "Lucknow",
  ],
  US: [
    "New York",
    "Los Angeles",
    "Chicago",
    "Houston",
    "Phoenix",
    "Philadelphia",
    "San Antonio",
    "San Diego",
    "Dallas",
    "San Jose",
  ],
  UK: [
    "London",
    "Birmingham",
    "Manchester",
    "Glasgow",
    "Liverpool",
    "Leeds",
    "Sheffield",
    "Edinburgh",
    "Bristol",
    "Cardiff",
  ],
  AU: [
    "Sydney",
    "Melbourne",
    "Brisbane",
    "Perth",
    "Adelaide",
    "Gold Coast",
    "Newcastle",
    "Canberra",
    "Sunshine Coast",
    "Wollongong",
  ],
  CA: [
    "Toronto",
    "Montreal",
    "Vancouver",
    "Calgary",
    "Edmonton",
    "Ottawa",
    "Winnipeg",
    "Quebec City",
    "Hamilton",
    "Kitchener",
  ],
};

const priceRanges = ["₹50k - ₹2L", "₹2L - ₹5L", "₹5L+"];
const ratings = ["4+", "4.5+", "4.8+"];

export default function VendorsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { vendors, favoriteVendors, loading, error, loadVendors } = useWeddingStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState<string[]>([]);

  const categories = useMemo(() => {
    const categoryCount: Record<string, number> = {};

    vendors.forEach((vendor) => {
      const cat = vendor.category.toLowerCase();
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    return Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => {
        const normalizedCat = category.toLowerCase();
        const icon =
          categoryIconMap[normalizedCat] || categoryIconMap["default"];

        return {
          id: normalizedCat,
          name: category.charAt(0).toUpperCase() + category.slice(1),
          icon,
          count,
        };
      });
  }, [vendors]);

  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(
    null
  );
  const [selectedRating, setSelectedRating] = useState<string | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedPriceRange) count++;
    if (selectedRating) count++;
    if (verifiedOnly) count++;
    if (selectedCountry || (selectedCity && selectedCity !== "All")) count++;
    return count;
  }, [selectedCity, selectedCountry, selectedPriceRange, selectedRating, verifiedOnly]);

  useLayoutEffect(() => {
    const activeCount = activeFilterCount;
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[
              styles.headerButton,
              compareMode && styles.headerButtonActive,
            ]}
            onPress={() => {
              // Toggle compare mode; leaving it clears the selection
              setCompareMode(!compareMode);
              if (compareMode) setCompareSelection([]);
            }}
            accessibilityRole="button"
            accessibilityLabel={
              compareMode
                ? "Exit compare mode"
                : "Select vendors to compare"
            }
            accessibilityState={{ selected: compareMode }}
          >
            <GitCompare
              size={20}
              color={
                compareMode
                  ? Colors.light.primary
                  : Colors.light.background
              }
            />
            {compareMode && compareSelection.length > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>
                  {compareSelection.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
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
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSearchModal(true)}
            accessibilityRole="button"
            accessibilityLabel="Search vendors"
          >
            <Search size={20} color={Colors.light.background} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowFilterModal(true)}
            accessibilityRole="button"
            accessibilityLabel={`Filters${
              activeCount > 0 ? `, ${activeCount} active` : ""
            }`}
          >
            <Filter size={20} color={Colors.light.background} />
            {activeCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{activeCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      ),
    });
  }, [
    navigation,
    viewMode,
    compareMode,
    compareSelection.length,
    selectedPriceRange,
    selectedRating,
    verifiedOnly,
    selectedCountry,
    selectedCity,
    activeFilterCount,
  ]);

  const filteredVendors = useMemo(() => {
    let filtered = [...vendors];

    if (showFavoritesOnly) {
      filtered = filtered.filter((vendor) =>
        favoriteVendors.includes(vendor.id)
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (vendor) =>
          vendor.name.toLowerCase().includes(query) ||
          vendor.category.toLowerCase().includes(query) ||
          vendor.description.toLowerCase().includes(query)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        (vendor) =>
          vendor.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (selectedCity && selectedCity !== "All") {
      filtered = filtered.filter((vendor) => {
        const loc = vendor.location;
        if (typeof loc === "string") return loc === selectedCity;
        return loc.city === selectedCity || loc.state === selectedCity;
      });
    }

    if (selectedPriceRange) {
      // Parse both bounds from the selected price range (e.g. "₹50k - ₹2L")
      const rangeParts = selectedPriceRange.split(" - ");
      const lower = parsePriceString(rangeParts[0] || selectedPriceRange);
      const upper = rangeParts[1] ? parsePriceString(rangeParts[1]) : Infinity;

      filtered = filtered.filter((vendor) => {
        // Prefer numeric minPrice for accurate filtering
        const vendorMin = vendor.minPrice ?? parsePriceString(vendor.priceRange);
        const vendorMax = vendor.maxPrice ?? Infinity;
        // Show vendors whose range overlaps with the selected range
        return vendorMin <= upper && vendorMax >= lower;
      });
    }

    if (selectedRating) {
      const minRating = parseFloat(selectedRating);
      filtered = filtered.filter((vendor) => vendor.rating >= minRating);
    }

    if (verifiedOnly) {
      filtered = filtered.filter((vendor) => vendor.verified);
    }

    return filtered;
  }, [
    vendors,
    favoriteVendors,
    showFavoritesOnly,
    searchQuery,
    selectedCategory,
    selectedCity,
    selectedPriceRange,
    selectedRating,
    verifiedOnly,
  ]);

  const navigateToVendor = (vendor: Vendor) => {
    trackEvent(AnalyticsEvents.VENDOR_VIEW, {
      vendorId: vendor.id,
      vendorName: vendor.name,
    });
    router.push({
      pathname: "/vendor/[id]",
      params: { id: vendor.id },
    });
  };

  const handleVendorPress = (vendor: Vendor) => {
    if (compareMode) {
      // Toggle the vendor in the compare selection
      setCompareSelection((prev) =>
        prev.includes(vendor.id)
          ? prev.filter((id) => id !== vendor.id)
          : [...prev, vendor.id]
      );
      return;
    }
    navigateToVendor(vendor);
  };

  const openCompare = () => {
    if (compareSelection.length < 2) {
      // Keep the mode active so the user can select more vendors
      return;
    }
    trackEvent(AnalyticsEvents.VENDOR_COMPARE, {
      count: compareSelection.length,
    });
    router.push({
      pathname: "/compare-vendors",
      params: { ids: compareSelection.join(",") },
    });
  };

  const resetFilters = () => {
    setSelectedCountry("");
    setSelectedCity("");
    setSelectedPriceRange(null);
    setSelectedRating(null);
    setVerifiedOnly(false);
  };

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    const cities = citiesByCountry[countryCode];
    if (cities && cities.length > 0) {
      setSelectedCity(cities[0]);
    } else {
      setSelectedCity("");
    }
    setShowCountryDropdown(false);
    setShowCityDropdown(false);
  };

  const renderCategories = () => (
    <View style={styles.categoriesContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((item) => {
          const IconComponent = item.icon;
          const isSelected = selectedCategory === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.categoryChip,
                isSelected && styles.selectedCategoryChip,
              ]}
              onPress={() => {
                setSelectedCategory(isSelected ? null : item.id);
                hapticSelection();
              }}
              accessibilityRole="button"
              accessibilityLabel={`${item.name} category, ${
                item.count
              } vendors${isSelected ? ", selected" : ""}`}
            >
              <IconComponent
                size={16}
                color={isSelected ? Colors.light.background : Colors.light.text}
              />
              <Text
                style={[
                  styles.categoryText,
                  isSelected && styles.selectedCategoryText,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.vendorCountContainer}>
        <Text style={styles.vendorCount}>
          {showFavoritesOnly ? "Favorite " : ""}
          {filteredVendors.length}{" "}
          {filteredVendors.length === 1 ? "vendor" : "vendors"}
        </Text>
        {showFavoritesOnly && (
          <TouchableOpacity
            onPress={() => setShowFavoritesOnly(false)}
            style={styles.showAllButton}
            accessibilityRole="button"
            accessibilityLabel="Show all vendors"
          >
            <Text style={styles.showAllText}>Show All</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const handleRefresh = () => {
    loadVendors();
  };

  const renderVendors = () => (
    <FlatList
      data={filteredVendors}
      numColumns={viewMode === "grid" ? 2 : 1}
      key={viewMode}
      renderItem={({ item }) => {
        const isSelected = compareMode && compareSelection.includes(item.id);
        // VendorCard is itself a TouchableOpacity — bind the handler once on it.
        return (
          <View
            style={
              viewMode === "grid"
                ? [
                    styles.gridItem,
                    isSelected && styles.selectedVendorCard,
                  ]
                : [
                    styles.listItem,
                    isSelected && styles.selectedVendorCard,
                  ]
            }
          >
            <VendorCard
              vendor={item}
              onPress={() => handleVendorPress(item)}
              accessibilityLabel={
                compareMode
                  ? `${item.name}${isSelected ? ", selected" : ", not selected"} for compare`
                  : `View ${item.name}`
              }
            />
            {isSelected && (
              <View style={styles.compareCheck}>
                <Text style={styles.compareCheckText}>✓</Text>
              </View>
            )}
          </View>
        );
      }}
      contentContainerStyle={[
        styles.vendorList,
        compareMode && styles.vendorListWithCompareBar,
      ]}
      refreshing={loading}
      onRefresh={handleRefresh}
      ListEmptyComponent={() => (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No vendors found</Text>
          <Text style={styles.emptyStateSubtext}>
            Try adjusting your filters
          </Text>
        </View>
      )}
    />
  );

  if (loading && vendors.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        {Array.from({ length: 6 }).map((_, i) => (
          <VendorCardSkeleton key={i} />
        ))}
      </View>
    );
  }

  if (error && vendors.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <AlertTriangle size={48} color={Colors.light.error} strokeWidth={1.5} />
          </View>
          <Text style={styles.errorTitle}>Could not load vendors</Text>
          <Text style={styles.errorDescription}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRefresh}
            accessibilityRole="button"
            accessibilityLabel="Retry loading vendors"
          >
            <RotateCcw size={20} color={Colors.light.background} />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderCategories()}
      {renderVendors()}

      {/* Compare selection bar */}
      {compareMode && (
        <View style={styles.compareBar}>
          <View style={styles.compareBarInfo}>
            <GitCompare size={18} color={Colors.light.primary} />
            <Text style={styles.compareBarText}>
              {compareSelection.length === 0
                ? "Tap vendors to select"
                : `${compareSelection.length} selected`}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.compareBarButton,
              compareSelection.length < 2 &&
                styles.compareBarButtonDisabled,
            ]}
            onPress={openCompare}
            disabled={compareSelection.length < 2}
            accessibilityRole="button"
            accessibilityLabel="Compare selected vendors"
          >
            <Text style={styles.compareBarButtonText}>
              Compare ({compareSelection.length}/2+)
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={showSearchModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSearchModal(false)}
      >
        <View style={styles.searchModalOverlay}>
          <View style={styles.searchModalContent}>
            <View style={styles.searchModalHeader}>
              <Search size={24} color={Colors.light.primary} />
              <Text style={styles.searchModalTitle}>Search Vendors</Text>
              <TouchableOpacity
                onPress={() => setShowSearchModal(false)}
                accessibilityRole="button"
                accessibilityLabel="Close search"
              >
                <X size={24} color={Colors.light.textLight} />
              </TouchableOpacity>
            </View>
            <View style={styles.searchInputContainer}>
              <Search size={20} color={Colors.light.textLight} />
              <TextInput
                style={styles.searchModalInput}
                placeholder="Search by name, category..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={Colors.light.textLight}
                autoFocus
              />
            </View>
            <TouchableOpacity
              style={styles.searchApplyButton}
              onPress={() => setShowSearchModal(false)}
              accessibilityRole="button"
              accessibilityLabel="Apply search"
            >
              <Text style={styles.searchApplyText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showFilterModal}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                accessibilityRole="button"
                accessibilityLabel="Close filters"
              >
                <X size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Country</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setShowCountryDropdown(!showCountryDropdown)}
                  accessibilityRole="button"
                  accessibilityLabel="Select country"
                >
                  <Text style={styles.dropdownText}>
                    {countries.find((c) => c.code === selectedCountry)?.name ||
                      "Select Country"}
                  </Text>
                  <ChevronDown
                    size={20}
                    color={Colors.light.textLight}
                    style={[
                      styles.dropdownIcon,
                      showCountryDropdown && styles.dropdownIconRotated,
                    ]}
                  />
                </TouchableOpacity>
                {showCountryDropdown && (
                  <View style={styles.dropdownList}>
                    {countries.map((country) => (
                      <TouchableOpacity
                        key={country.code}
                        style={[
                          styles.dropdownItem,
                          selectedCountry === country.code &&
                            styles.selectedDropdownItem,
                        ]}
                        onPress={() => {
                          handleCountryChange(country.code);
                          setShowCountryDropdown(false);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={country.name}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            selectedCountry === country.code &&
                              styles.selectedDropdownItemText,
                          ]}
                        >
                          {country.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>City</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setShowCityDropdown(!showCityDropdown)}
                  accessibilityRole="button"
                  accessibilityLabel="Select city"
                >
                  <Text style={styles.dropdownText}>
                    {selectedCity || "Select City"}
                  </Text>
                  <ChevronDown
                    size={20}
                    color={Colors.light.textLight}
                    style={[
                      styles.dropdownIcon,
                      showCityDropdown && styles.dropdownIconRotated,
                    ]}
                  />
                </TouchableOpacity>
                {showCityDropdown && (
                  <View style={styles.dropdownList}>
                    <ScrollView
                      style={styles.cityDropdownContainer}
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                    >
                      {citiesByCountry[selectedCountry]?.map((city) => (
                        <TouchableOpacity
                          key={city}
                          style={[
                            styles.dropdownItem,
                            selectedCity === city &&
                              styles.selectedDropdownItem,
                          ]}
                          onPress={() => {
                            setSelectedCity(city);
                            setShowCityDropdown(false);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={city}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              selectedCity === city &&
                                styles.selectedDropdownItemText,
                            ]}
                          >
                            {city}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Price Range</Text>
                <View style={styles.filterOptions}>
                  {priceRanges.map((range) => (
                    <TouchableOpacity
                      key={range}
                      style={[
                        styles.filterOption,
                        selectedPriceRange === range &&
                          styles.selectedFilterOption,
                      ]}
                      onPress={() =>
                        setSelectedPriceRange(
                          selectedPriceRange === range ? null : range
                        )
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Price ${range}${
                        selectedPriceRange === range ? ", selected" : ""
                      }`}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          selectedPriceRange === range &&
                            styles.selectedFilterOptionText,
                        ]}
                      >
                        {range}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Rating</Text>
                <View style={styles.filterOptions}>
                  {ratings.map((rating) => (
                    <TouchableOpacity
                      key={rating}
                      style={[
                        styles.filterOption,
                        selectedRating === rating &&
                          styles.selectedFilterOption,
                      ]}
                      onPress={() =>
                        setSelectedRating(
                          selectedRating === rating ? null : rating
                        )
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Rating ${rating} stars${
                        selectedRating === rating ? ", selected" : ""
                      }`}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          selectedRating === rating &&
                            styles.selectedFilterOptionText,
                        ]}
                      >
                        {rating} ★
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <TouchableOpacity
                  style={styles.verifiedToggle}
                  onPress={() => setVerifiedOnly(!verifiedOnly)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: verifiedOnly }}
                  accessibilityLabel="Verified vendors only"
                >
                  <View
                    style={[
                      styles.checkbox,
                      verifiedOnly && styles.checkboxChecked,
                    ]}
                  />
                  <Text style={styles.verifiedText}>Verified Vendors Only</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Reset Filters"
                onPress={resetFilters}
                variant="secondary"
                style={styles.resetButton}
              />
              <Button
                title="Apply Filters"
                onPress={() => setShowFilterModal(false)}
                style={styles.applyButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: 16,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginRight: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  headerBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.light.error,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.light.headerBackground,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.light.background,
  },
  searchModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  searchModalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  searchModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  searchModalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.light.text,
    flex: 1,
    marginLeft: 12,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    marginBottom: 16,
  },
  searchModalInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
  },
  searchApplyButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  searchApplyText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.background,
  },
  categoriesContainer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  categoriesContent: {
    gap: 8,
    paddingRight: 16,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: Colors.light.backgroundAlt,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  selectedCategoryChip: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  categoryText: {
    fontSize: 12,
    color: Colors.light.text,
    fontWeight: "500",
  },
  selectedCategoryText: {
    color: Colors.light.background,
    fontWeight: "600",
  },
  vendorCount: {
    fontSize: 11,
    color: Colors.light.textLight,
    fontWeight: "500",
    marginTop: 8,
  },
  vendorList: {
    padding: 16,
  },
  gridItem: {
    flex: 1,
    margin: 8,
  },
  listItem: {
    marginBottom: 16,
  },
  selectedVendorCard: {
    borderWidth: 2,
    borderColor: Colors.light.primary,
    borderRadius: 12,
  },
  vendorListWithCompareBar: {
    paddingBottom: 96,
  },
  compareCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.light.background,
  },
  compareCheckText: {
    color: Colors.light.background,
    fontSize: 13,
    fontWeight: "700",
  },
  compareBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 12,
    shadowColor: Colors.light.text,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  compareBarInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  compareBarText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.text,
    fontWeight: "600" as FontWeight,
  },
  compareBarButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  compareBarButtonDisabled: {
    backgroundColor: Colors.light.textLight,
  },
  compareBarButtonText: {
    color: Colors.light.background,
    fontSize: Typography.fontSizes.sm,
    fontWeight: "700" as FontWeight,
  },
  headerButtonActive: {
    backgroundColor: Colors.light.background,
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
  },
  emptyStateText: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.textLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "600",
    color: Colors.light.text,
  },
  modalBody: {
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterOption: {
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 8,
    padding: 8,
    minWidth: 80,
    alignItems: "center",
  },
  selectedFilterOption: {
    backgroundColor: Colors.light.primary,
  },
  filterOptionText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.text,
  },
  selectedFilterOptionText: {
    color: Colors.light.background,
  },
  verifiedToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  checkboxChecked: {
    backgroundColor: Colors.light.primary,
  },
  verifiedText: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.text,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 8,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  resetButton: {
    flex: 1,
  },
  applyButton: {
    flex: 1,
  },
  vendorCountContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  showAllButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  showAllText: {
    fontSize: 11,
    color: Colors.light.background,
    fontWeight: "600",
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.backgroundAlt,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  dropdownText: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: "500",
  },
  dropdownIcon: {
    transform: [{ rotate: "0deg" }],
  },
  dropdownIconRotated: {
    transform: [{ rotate: "180deg" }],
  },
  dropdownList: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    shadowColor: Colors.light.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
  },
  selectedDropdownItem: {
    backgroundColor: Colors.light.primary + "20",
  },
  dropdownItemText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  selectedDropdownItemText: {
    color: Colors.light.primary,
    fontWeight: "600",
  },
  cityDropdownContainer: {
    maxHeight: 180,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorIcon: {
    backgroundColor: Colors.light.error + "15",
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 12,
    textAlign: "center",
  },
  errorDescription: {
    fontSize: 15,
    color: Colors.light.textLight,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.background,
  },
});
