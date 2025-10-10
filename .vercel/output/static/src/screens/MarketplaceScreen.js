import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  FlatList,
  RefreshControl,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";

const { width } = Dimensions.get("window");

// Enhanced mock data for marketplace
const mockCars = [
  {
    id: "1",
    title: "1997 Mazda RX-7 FD",
    price: "$45,000",
    originalPrice: "$50,000",
    year: "1997",
    make: "Mazda",
    model: "RX-7",
    mileage: "45,000",
    location: "Tokyo, Japan",
    condition: "Excellent",
    description:
      "Fully built RX-7 with twin turbo setup. Perfect for track days and shows.",
    seller: {
      name: "SpeedDemon_99",
      avatar: "🏎️",
      verified: true,
      rating: 4.9,
      sales: 23,
    },
    images: ["car_1", "car_2", "car_3"],
    features: ["Twin Turbo", "Coilovers", "Widebody Kit", "Carbon Fiber"],
    isFavorite: false,
    isNew: true,
    category: "cars",
    tags: ["#JDM", "#RX7", "#TwinTurbo", "#TrackReady"],
    postedDate: "2h ago",
  },
  {
    id: "2",
    title: "Nissan Skyline GT-R R34",
    price: "$85,000",
    originalPrice: null,
    year: "1999",
    make: "Nissan",
    model: "Skyline GT-R R34",
    mileage: "62,000",
    location: "Osaka, Japan",
    condition: "Good",
    description:
      "Classic R34 in Midnight Purple. RB26 engine with minor modifications.",
    seller: {
      name: "Tokyo_Drifter",
      avatar: "🚗",
      verified: true,
      rating: 4.7,
      sales: 15,
    },
    images: ["r34_1", "r34_2"],
    features: ["RB26 Engine", "Carbon Fiber", "Titanium Exhaust"],
    isFavorite: true,
    isNew: false,
    category: "cars",
    tags: ["#JDM", "#GTR", "#R34", "#Classic"],
    postedDate: "1d ago",
  },
];

const mockParts = [
  {
    id: "3",
    title: "Greddy Twin Turbo Kit",
    price: "$3,500",
    originalPrice: "$4,200",
    brand: "Greddy",
    partNumber: "GR-12345",
    condition: "New",
    description:
      "Complete twin turbo kit for RX-7 FD. Includes all necessary components.",
    seller: {
      name: "PartsDealer",
      avatar: "🔧",
      verified: true,
      rating: 4.8,
      sales: 156,
    },
    images: ["turbo_kit_1", "turbo_kit_2"],
    features: ["Complete Kit", "Installation Guide", "Warranty"],
    isFavorite: false,
    isNew: true,
    category: "parts",
    tags: ["#Turbo", "#Greddy", "#RX7", "#Performance"],
    postedDate: "3h ago",
    compatibility: ["Mazda RX-7 FD"],
  },
  {
    id: "4",
    title: "Carbon Fiber Wing",
    price: "$899",
    originalPrice: "$1,200",
    brand: "AeroDynamics",
    partNumber: "AD-CF-001",
    condition: "Like New",
    description:
      "High-quality carbon fiber wing perfect for track builds. Lightweight and durable.",
    seller: {
      name: "AeroSpecialist",
      avatar: "🏁",
      verified: false,
      rating: 4.5,
      sales: 8,
    },
    images: ["wing_1", "wing_2"],
    features: ["Carbon Fiber", "Adjustable", "Lightweight"],
    isFavorite: false,
    isNew: false,
    category: "parts",
    tags: ["#CarbonFiber", "#Aero", "#Track", "#Lightweight"],
    postedDate: "5h ago",
    compatibility: ["Universal"],
  },
];

const mockMarketplaceData = [...mockCars, ...mockParts];

export default function MarketplaceScreen() {
  const [marketplaceData, setMarketplaceData] = useState(mockMarketplaceData);
  const [selectedTab, setSelectedTab] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const tabs = ["All", "Cars", "Parts", "Favorites"];
  const categories = [
    "All",
    "JDM",
    "European",
    "American",
    "Performance",
    "Aero",
  ];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleFavorite = (itemId) => {
    setMarketplaceData(
      marketplaceData.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            isFavorite: !item.isFavorite,
          };
        }
        return item;
      })
    );
  };

  const getFilteredData = () => {
    let filtered = marketplaceData;

    // Apply tab filter
    switch (selectedTab) {
      case "Cars":
        filtered = filtered.filter((item) => item.category === "cars");
        break;
      case "Parts":
        filtered = filtered.filter((item) => item.category === "parts");
        break;
      case "Favorites":
        filtered = filtered.filter((item) => item.isFavorite);
        break;
      default:
        break;
    }

    // Apply search filter
    if (searchQuery.length > 0) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    return filtered;
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case "Excellent":
        return colors.green;
      case "Good":
        return colors.cyan;
      case "Fair":
        return colors.warning;
      case "New":
        return colors.purple;
      case "Like New":
        return colors.green;
      default:
        return colors.textMuted;
    }
  };

  const MarketplaceCard = ({ item, index }) => (
    <Animated.View
      style={[
        styles.marketplaceCard,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            },
          ],
        },
      ]}
    >
      {/* Header with badges */}
      <View style={styles.cardHeader}>
        <View style={styles.badgesContainer}>
          {item.isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
          <View
            style={[
              styles.conditionBadge,
              { backgroundColor: getConditionColor(item.condition) },
            ]}
          >
            <Text style={styles.conditionText}>{item.condition}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => handleFavorite(item.id)}
        >
          <Ionicons
            name={item.isFavorite ? "heart" : "heart-outline"}
            size={24}
            color={item.isFavorite ? colors.red : colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Image */}
      <View style={styles.imageContainer}>
        <LinearGradient colors={colors.purpleGradient} style={styles.itemImage}>
          <Ionicons
            name={item.category === "cars" ? "car-sport" : "construct"}
            size={50}
            color={colors.textPrimary}
          />
          <Text style={styles.imageText}>
            {item.category === "cars" ? "Car Image" : "Part Image"}
          </Text>
        </LinearGradient>
        <View style={styles.imageCount}>
          <Ionicons name="images" size={16} color={colors.textPrimary} />
          <Text style={styles.imageCountText}>{item.images.length}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>

        {/* Price */}
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{item.price}</Text>
          {item.originalPrice && (
            <Text style={styles.originalPrice}>{item.originalPrice}</Text>
          )}
        </View>

        {/* Details */}
        <View style={styles.detailsContainer}>
          {item.category === "cars" ? (
            <>
              <Text style={styles.detailText}>
                {item.year} • {item.mileage} miles
              </Text>
              <Text style={styles.detailText}>{item.location}</Text>
            </>
          ) : (
            <>
              <Text style={styles.detailText}>
                {item.brand} • {item.partNumber}
              </Text>
              <Text style={styles.detailText}>
                Compatible: {item.compatibility.join(", ")}
              </Text>
            </>
          )}
        </View>

        {/* Description */}
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Features */}
        <View style={styles.featuresContainer}>
          {item.features.slice(0, 3).map((feature, featureIndex) => (
            <View key={featureIndex} style={styles.featureTag}>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
          {item.features.length > 3 && (
            <View style={styles.featureTag}>
              <Text style={styles.featureText}>
                +{item.features.length - 3} more
              </Text>
            </View>
          )}
        </View>

        {/* Tags */}
        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 3).map((tag, tagIndex) => (
            <TouchableOpacity key={tagIndex} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Seller Info */}
        <View style={styles.sellerContainer}>
          <View style={styles.sellerInfo}>
            <Text style={styles.sellerAvatar}>{item.seller.avatar}</Text>
            <View style={styles.sellerDetails}>
              <View style={styles.sellerNameContainer}>
                <Text style={styles.sellerName}>{item.seller.name}</Text>
                {item.seller.verified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons
                      name="checkmark"
                      size={8}
                      color={colors.textPrimary}
                    />
                  </View>
                )}
              </View>
              <Text style={styles.sellerRating}>
                ⭐ {item.seller.rating} • {item.seller.sales} sales
              </Text>
            </View>
          </View>
          <Text style={styles.postedDate}>{item.postedDate}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.contactButton}>
            <LinearGradient
              colors={colors.purpleGradient}
              style={styles.contactButtonGradient}
            >
              <Ionicons
                name="chatbubble-outline"
                size={18}
                color={colors.textPrimary}
              />
              <Text style={styles.contactButtonText}>Contact</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewButton}>
            <Ionicons name="eye-outline" size={18} color={colors.purple} />
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Marketplace</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="search" size={24} color={colors.purple} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="add-circle" size={24} color={colors.red} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cars, parts, brands..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.activeTab]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
            {selectedTab === tab && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.activeCategoryButton,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.activeCategoryText,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Marketplace List */}
      <FlatList
        data={getFilteredData()}
        renderItem={({ item, index }) => (
          <MarketplaceCard item={item} index={index} />
        )}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.purple}
          />
        }
        contentContainerStyle={styles.marketplaceContent}
      />

      {/* Create Listing FAB */}
      <TouchableOpacity style={styles.fab}>
        <LinearGradient colors={colors.redGradient} style={styles.fabGradient}>
          <Ionicons name="add" size={24} color={colors.textPrimary} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: "row",
  },
  headerButton: {
    padding: 4,
    marginLeft: 12,
  },
  searchContainer: {
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    position: "relative",
  },
  activeTab: {
    // Active tab styling
  },
  tabText: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: "500",
  },
  activeTabText: {
    color: colors.purple,
    fontWeight: "600",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: "50%",
    marginLeft: -15,
    width: 30,
    height: 3,
    backgroundColor: colors.purple,
    borderRadius: 2,
  },
  categoryContainer: {
    backgroundColor: colors.cardBackground,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
  },
  categoryContent: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: colors.inputBackground,
  },
  activeCategoryButton: {
    backgroundColor: colors.red,
  },
  categoryText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "500",
  },
  activeCategoryText: {
    color: colors.textPrimary,
  },
  marketplaceContent: {
    padding: 16,
  },
  marketplaceCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 0,
  },
  badgesContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  newBadge: {
    backgroundColor: colors.red,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  conditionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  conditionText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  favoriteButton: {
    padding: 4,
  },
  imageContainer: {
    position: "relative",
    marginHorizontal: 16,
    marginBottom: 16,
  },
  itemImage: {
    height: 200,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  imageText: {
    color: colors.textPrimary,
    marginTop: 8,
    fontSize: 14,
  },
  imageCount: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCountText: {
    color: colors.textPrimary,
    fontSize: 12,
    marginLeft: 4,
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.red,
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: colors.textMuted,
    textDecorationLine: "line-through",
  },
  detailsContainer: {
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  featuresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  featureTag: {
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  tag: {
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: colors.purple,
    fontWeight: "500",
  },
  sellerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.accent,
  },
  sellerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sellerAvatar: {
    fontSize: 24,
    marginRight: 8,
  },
  sellerDetails: {
    flex: 1,
  },
  sellerNameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sellerName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginRight: 4,
  },
  verifiedBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.purple,
    justifyContent: "center",
    alignItems: "center",
  },
  sellerRating: {
    fontSize: 12,
    color: colors.textMuted,
  },
  postedDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  contactButton: {
    flex: 1,
    marginRight: 12,
    borderRadius: 20,
    overflow: "hidden",
  },
  contactButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginLeft: 6,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  viewButtonText: {
    fontSize: 14,
    color: colors.purple,
    marginLeft: 6,
    fontWeight: "500",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
});
