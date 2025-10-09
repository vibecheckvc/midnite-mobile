// screens/FeedScreen.js
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
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchUnifiedFeed,
  toggleLike,
  toggleSave,
  toggleJoinEvent,
} from "../services/feedService";

const { width } = Dimensions.get("window");

export default function FeedScreen({ navigation }) {
  const { user } = useAuth();
  const [feedData, setFeedData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("For You");
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const filters = ["For You", "Following", "Local", "Trending"];

  useEffect(() => {
    if (user?.id) loadFeed();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [user, selectedFilter]);

  const loadFeed = async () => {
    setLoading(true);
    const { data } = await fetchUnifiedFeed(user.id, selectedFilter);
    setFeedData(data || []);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  };

  const handleLike = async (item) => {
    const updated = feedData.map((p) =>
      p.id === item.id
        ? {
            ...p,
            isLiked: !p.isLiked,
            likesCount: (p.likesCount || 0) + (p.isLiked ? -1 : 1),
          }
        : p
    );
    setFeedData(updated);
    await toggleLike(user.id, item.id, item.type, item.isLiked);
  };

  const handleSave = async (item) => {
    const updated = feedData.map((p) =>
      p.id === item.id
        ? {
            ...p,
            isSaved: !p.isSaved,
            savesCount: (p.savesCount || 0) + (p.isSaved ? -1 : 1),
          }
        : p
    );
    setFeedData(updated);
    await toggleSave(user.id, item.id, item.type, item.isSaved);
  };

  const handleJoinEvent = async (item) => {
    const updated = feedData.map((p) =>
      p.id === item.id && p.type === "event"
        ? {
            ...p,
            isJoined: !p.isJoined,
            attendeesCount:
              (p.attendeesCount || 0) + (p.isJoined ? -1 : 1),
          }
        : p
    );
    setFeedData(updated);
    await toggleJoinEvent(user.id, item.id, item.isJoined);
  };

  const getPostTypeIcon = (type) => {
    switch (type) {
      case "build":
        return "🔧";
      case "event":
        return "📅";
      default:
        return "🚗";
    }
  };

  const PostCard = ({ item }) => (
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
      {/* Header */}
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("DriverProfileScreen", {
                userId: item.user_id,
              })
            }
          >
            <Image
              source={{
                uri:
                  item.user?.avatar_url ||
                  `https://ui-avatars.com/api/?name=${item.user?.username ||
                    "U"}&background=000&color=fff`,
              }}
              style={styles.avatar}
            />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.username}>
              {item.user?.full_name || "User"}
            </Text>
            <Text style={styles.userHandle}>
              @{item.user?.username || "unknown"}
            </Text>
          </View>
        </View>
        <Text style={styles.postTypeIcon}>{getPostTypeIcon(item.type)}</Text>
      </View>

      {/* Content */}
      <Text style={styles.postContent}>{item.title}</Text>
      {item.subtitle && (
        <Text style={styles.postSub}>{item.subtitle}</Text>
      )}

      {/* Media */}
      {item.cover && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            item.type === "build"
              ? navigation.navigate("CarDetailScreen", { carId: item.id })
              : navigation.navigate("EventsScreen", { eventId: item.id })
          }
        >
          <Image source={{ uri: item.cover }} style={styles.cover} />
        </TouchableOpacity>
      )}

      {/* Actions */}
      <View style={styles.postActions}>
        {/* Like */}
        <TouchableOpacity
          onPress={() => handleLike(item)}
          style={styles.actionButton}
        >
          <Ionicons
            name={item.isLiked ? "heart" : "heart-outline"}
            size={20}
            color={item.isLiked ? colors.red : colors.textMuted}
          />
          <Text
            style={[
              styles.actionText,
              item.isLiked && { color: colors.red },
            ]}
          >
            {item.likesCount || 0}
          </Text>
        </TouchableOpacity>

        {/* Comment (placeholder for future) */}
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={colors.textMuted}
          />
          <Text style={styles.actionText}>0</Text>
        </TouchableOpacity>

        {/* Event Join */}
        {item.type === "event" && (
          <TouchableOpacity
            onPress={() => handleJoinEvent(item)}
            style={styles.actionButton}
          >
            <Ionicons
              name={
                item.isJoined ? "calendar" : "calendar-outline"
              }
              size={20}
              color={item.isJoined ? colors.purple : colors.textMuted}
            />
            <Text
              style={[
                styles.actionText,
                item.isJoined && { color: colors.purple },
              ]}
            >
              {item.attendeesCount || 0}
            </Text>
          </TouchableOpacity>
        )}

        {/* Save */}
        <TouchableOpacity
          onPress={() => handleSave(item)}
          style={styles.actionButton}
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
            {item.savesCount || 0}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.purple} />
      </View>
    );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity>
            <Ionicons name="search" size={22} color={colors.purple} />
          </TouchableOpacity>
          <TouchableOpacity style={{ marginLeft: 12 }}>
            <Ionicons name="add-circle" size={22} color={colors.red} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            onPress={() => setSelectedFilter(filter)}
            style={[
              styles.filterButton,
              selectedFilter === filter && styles.filterActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter && styles.filterTextActive,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Feed */}
      <FlatList
        data={feedData}
        renderItem={({ item }) => <PostCard item={item} />}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
  },
  headerTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: "700" },
  headerActions: { flexDirection: "row" },
  filterRow: { paddingHorizontal: 16, paddingVertical: 10 },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: colors.cardBackground,
  },
  filterActive: { backgroundColor: colors.purple },
  filterText: { color: colors.textMuted, fontSize: 13 },
  filterTextActive: { color: colors.textPrimary },
  postCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  postHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  userInfo: { flexDirection: "row", flex: 1, alignItems: "center" },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: { color: colors.textPrimary, fontWeight: "700", fontSize: 15 },
  userHandle: { color: colors.textSecondary, fontSize: 12 },
  postTypeIcon: { fontSize: 20 },
  postContent: { color: colors.textPrimary, fontSize: 15, marginBottom: 4 },
  postSub: { color: colors.textSecondary, fontSize: 13, marginBottom: 10 },
  cover: {
    width: "100%",
    height: width * 0.5,
    borderRadius: 10,
    marginBottom: 10,
  },
  postActions: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.accent,
    paddingTop: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 18,
  },
  actionText: { color: colors.textMuted, fontSize: 13, marginLeft: 6 },
});
