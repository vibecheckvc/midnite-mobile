import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  FlatList,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";

const { width, height } = Dimensions.get("window");

// Enhanced mock data for car content
const mockFeedData = [
  {
    id: "1",
    type: "build",
    user: {
      name: "Alex Chen",
      username: "SpeedDemon_99",
      avatar: "🏎️",
      verified: true,
    },
    content:
      "Just finished my RX-7 FD build! Twin turbo setup is finally dialed in 🔥",
    media: {
      type: "image",
      url: "car_build_1",
    },
    stats: {
      likes: 1247,
      comments: 89,
      shares: 23,
      saves: 156,
    },
    timestamp: "2h ago",
    location: "Tokyo, Japan",
    tags: ["#RX7", "#TwinTurbo", "#JDM", "#Build"],
    buildLink: "RX-7 FD",
    isLiked: false,
    isSaved: false,
  },
  {
    id: "2",
    type: "event",
    user: {
      name: "Midnite Events",
      username: "midnite_events",
      avatar: "🏁",
      verified: true,
    },
    content:
      "TONIGHT: Tokyo Drift Night Cruise starting at 8 PM! Meet at Shibuya Crossing. All cars welcome!",
    media: {
      type: "video",
      url: "event_video_1",
    },
    stats: {
      likes: 892,
      comments: 45,
      shares: 67,
      saves: 234,
    },
    timestamp: "4h ago",
    location: "Shibuya, Tokyo",
    tags: ["#TokyoDrift", "#NightCruise", "#CarMeet"],
    eventInfo: {
      date: "Tonight",
      time: "8:00 PM",
      attendees: 247,
      isJoined: false,
    },
    isLiked: true,
    isSaved: true,
  },
  {
    id: "3",
    type: "story",
    user: {
      name: "Yuki Tanaka",
      username: "Tokyo_Drifter",
      avatar: "🚗",
      verified: false,
    },
    content:
      "Quick dyno pull from yesterday's track day - 420hp at the wheels! 🏆",
    media: {
      type: "video",
      url: "dyno_video_1",
    },
    stats: {
      likes: 634,
      comments: 28,
      shares: 12,
      saves: 89,
    },
    timestamp: "6h ago",
    location: "Fuji Speedway",
    tags: ["#Dyno", "#TrackDay", "#420hp"],
    buildLink: "GT-R R34",
    isLiked: false,
    isSaved: false,
  },
  {
    id: "4",
    type: "recommendation",
    user: {
      name: "Midnite Auto",
      username: "midnite_auto",
      avatar: "🔧",
      verified: true,
    },
    content:
      "Recommended for you: Carbon fiber wing from our partners at AeroDynamics. Perfect for your track build!",
    media: {
      type: "image",
      url: "product_recommendation_1",
    },
    stats: {
      likes: 156,
      comments: 8,
      shares: 15,
      saves: 67,
    },
    timestamp: "1d ago",
    location: null,
    tags: ["#CarbonFiber", "#Aero", "#TrackBuild"],
    productInfo: {
      name: "AeroDynamics CF Wing",
      price: "$899",
      discount: "15% off",
    },
    isLiked: false,
    isSaved: false,
  },
];

export default function FeedScreen() {
  const [feedData, setFeedData] = useState(mockFeedData);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("For You");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const filters = ["For You", "Following", "Local", "Trending"];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLike = (postId) => {
    setFeedData(
      feedData.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            isLiked: !post.isLiked,
            stats: {
              ...post.stats,
              likes: post.isLiked ? post.stats.likes - 1 : post.stats.likes + 1,
            },
          };
        }
        return post;
      })
    );
  };

  const handleSave = (postId) => {
    setFeedData(
      feedData.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            isSaved: !post.isSaved,
            stats: {
              ...post.stats,
              saves: post.isSaved ? post.stats.saves - 1 : post.stats.saves + 1,
            },
          };
        }
        return post;
      })
    );
  };

  const handleJoinEvent = (postId) => {
    setFeedData(
      feedData.map((post) => {
        if (post.id === postId && post.type === "event") {
          return {
            ...post,
            eventInfo: {
              ...post.eventInfo,
              isJoined: !post.eventInfo.isJoined,
              attendees: post.eventInfo.isJoined
                ? post.eventInfo.attendees - 1
                : post.eventInfo.attendees + 1,
            },
          };
        }
        return post;
      })
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getPostTypeIcon = (type) => {
    switch (type) {
      case "build":
        return "🔧";
      case "event":
        return "📅";
      case "story":
        return "⚡";
      case "recommendation":
        return "💡";
      default:
        return "🚗";
    }
  };

  const PostCard = ({ item, index }) => (
    <Animated.View
      style={[
        styles.postCard,
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
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>{item.user.avatar}</Text>
            {item.user.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons
                  name="checkmark"
                  size={8}
                  color={colors.textPrimary}
                />
              </View>
            )}
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.username}>{item.user.name}</Text>
            <Text style={styles.userHandle}>@{item.user.username}</Text>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
          </View>
        </View>
        <View style={styles.postTypeContainer}>
          <Text style={styles.postTypeIcon}>{getPostTypeIcon(item.type)}</Text>
          <TouchableOpacity>
            <Ionicons
              name="ellipsis-horizontal"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Post Content */}
      <Text style={styles.postContent}>{item.content}</Text>

      {/* Media */}
      <View style={styles.mediaContainer}>
        <LinearGradient
          colors={colors.purpleGradient}
          style={styles.mediaPlaceholder}
        >
          <Ionicons name="car-sport" size={50} color={colors.textPrimary} />
          <Text style={styles.mediaText}>
            {item.media.type === "video" ? "Video Content" : "Image Content"}
          </Text>
          {item.media.type === "video" && (
            <View style={styles.playButton}>
              <Ionicons name="play" size={24} color={colors.textPrimary} />
            </View>
          )}
        </LinearGradient>
      </View>

      {/* Tags */}
      {item.tags && (
        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 3).map((tag, tagIndex) => (
            <TouchableOpacity key={tagIndex} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Special Content */}
      {item.type === "event" && item.eventInfo && (
        <View style={styles.eventInfoContainer}>
          <View style={styles.eventDetails}>
            <Ionicons name="calendar" size={16} color={colors.purple} />
            <Text style={styles.eventText}>
              {item.eventInfo.date} at {item.eventInfo.time}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.joinEventButton,
              item.eventInfo.isJoined && styles.joinedButton,
            ]}
            onPress={() => handleJoinEvent(item.id)}
          >
            <LinearGradient
              colors={
                item.eventInfo.isJoined
                  ? colors.purpleGradient
                  : colors.redGradient
              }
              style={styles.joinButtonGradient}
            >
              <Text style={styles.joinButtonText}>
                {item.eventInfo.isJoined ? "Joined" : "Join Event"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {item.type === "recommendation" && item.productInfo && (
        <View style={styles.productInfoContainer}>
          <View style={styles.productDetails}>
            <Text style={styles.productName}>{item.productInfo.name}</Text>
            <Text style={styles.productPrice}>{item.productInfo.price}</Text>
          </View>
          <TouchableOpacity style={styles.shopButton}>
            <LinearGradient
              colors={colors.purpleGradient}
              style={styles.shopButtonGradient}
            >
              <Text style={styles.shopButtonText}>Shop Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Location */}
      {item.location && (
        <View style={styles.locationContainer}>
          <Ionicons
            name="location-outline"
            size={14}
            color={colors.textMuted}
          />
          <Text style={styles.locationText}>{item.location}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLike(item.id)}
        >
          <Ionicons
            name={item.isLiked ? "heart" : "heart-outline"}
            size={20}
            color={item.isLiked ? colors.red : colors.textMuted}
          />
          <Text
            style={[styles.actionText, item.isLiked && { color: colors.red }]}
          >
            {item.stats.likes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={colors.textMuted}
          />
          <Text style={styles.actionText}>{item.stats.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={20} color={colors.textMuted} />
          <Text style={styles.actionText}>{item.stats.shares}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleSave(item.id)}
        >
          <Ionicons
            name={item.isSaved ? "bookmark" : "bookmark-outline"}
            size={20}
            color={item.isSaved ? colors.purple : colors.textMuted}
          />
          <Text
            style={[
              styles.actionText,
              item.isSaved && { color: colors.purple },
            ]}
          >
            {item.stats.saves}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="search" size={24} color={colors.purple} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="add-circle" size={24} color={colors.red} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter && styles.activeFilterButton,
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter && styles.activeFilterText,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Feed */}
      <FlatList
        data={feedData}
        renderItem={({ item, index }) => <PostCard item={item} index={index} />}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.purple}
          />
        }
        contentContainerStyle={styles.feedContent}
      />
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
  filterContainer: {
    backgroundColor: colors.cardBackground,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
  },
  filterContent: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: colors.inputBackground,
  },
  activeFilterButton: {
    backgroundColor: colors.purple,
  },
  filterText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: "500",
  },
  activeFilterText: {
    color: colors.textPrimary,
  },
  feedContent: {
    padding: 16,
  },
  postCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    flex: 1,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    fontSize: 40,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.purple,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.cardBackground,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  userHandle: {
    fontSize: 14,
    color: colors.purple,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textMuted,
  },
  postTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  postTypeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  postContent: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  mediaContainer: {
    marginBottom: 12,
  },
  mediaPlaceholder: {
    height: 250,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  mediaText: {
    color: colors.textPrimary,
    marginTop: 8,
    fontSize: 14,
  },
  playButton: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  tag: {
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: colors.purple,
    fontWeight: "500",
  },
  eventInfoContainer: {
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  eventDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  eventText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  joinEventButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  joinedButton: {
    opacity: 0.7,
  },
  joinButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
  },
  productInfoContainer: {
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  productDetails: {
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.red,
  },
  shopButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  shopButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  shopButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: colors.textMuted,
    marginLeft: 4,
  },
  postActions: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.accent,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 24,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: colors.textMuted,
  },
});
