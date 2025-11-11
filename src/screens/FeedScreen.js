// screens/FeedScreen.js
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  FlatList,
  RefreshControl,
  Modal,
  TextInput,
  Share,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchUnifiedFeed,
  toggleLike,
  toggleSave,
  toggleJoinEvent,
} from "../services/feedService";
// import LoadingOverlay from "../components/LoadingOverlay";
// Minimal, clean feed
import { supabase } from "../lib/supabase";

const { width } = Dimensions.get("window");

export default function FeedScreen({ navigation }) {
  const { user } = useAuth();
  const [feedData, setFeedData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("For You");
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [viewMode, setViewMode] = useState("media"); // media | compact
  const [sortMode, setSortMode] = useState("Prioritized"); // Prioritized | Newest
  const [commentFor, setCommentFor] = useState(null); // the item
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState({}); // id -> list
  const hiddenIds = useRef(new Set());

  const filters = ["For You", "Following"]; // simplified

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
    // optional local sort
    const sorted = (data || []).slice().sort((a, b) => {
      if (sortMode === "Newest") {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      return 0; // already prioritized in service
    });
    // filter hidden ones
    setFeedData(sorted.filter((i) => !hiddenIds.current.has(`${i.type}:${i.id}`)));
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

  const openShare = async (item) => {
    try {
      const title = item.type === "event" ? item.title : `${item.title}${item.subtitle ? " · " + item.subtitle : ""}`;
      const link = item.type === "event" ? `https://midnite.app/event/${item.id}` : `https://midnite.app/build/${item.id}`;
      await Share.share({ message: `${title}\n${link}` });
    } catch {}
  };

  const hidePost = (item) => {
    hiddenIds.current.add(`${item.type}:${item.id}`);
    setFeedData((prev) => prev.filter((i) => !(i.id === item.id && i.type === item.type)));
  };

  const overflowMenu = (item) => {
    Alert.alert("Post", undefined, [
      { text: "Hide", style: "destructive", onPress: () => hidePost(item) },
      { text: "Report", onPress: () => Alert.alert("Reported", "Thanks for the feedback") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const openComments = async (item) => {
    setCommentFor(item);
    try {
      const { data, error } = await supabase
        .from("comments")
        .select("id, user_id, text, created_at, profiles:profiles!inner(id, username, avatar_url)")
        .eq("content_id", item.id)
        .eq("content_type", item.type)
        .order("created_at", { ascending: false });
      if (!error) setComments((prev) => ({ ...prev, [item.id]: data || [] }));
      else setComments((prev) => ({ ...prev, [item.id]: [] }));
    } catch {
      setComments((prev) => ({ ...prev, [item.id]: [] }));
    }
  };

  const postComment = async () => {
    if (!commentFor || !commentText.trim()) return;
    const item = commentFor;
    const newComment = {
      user_id: user.id,
      content_id: item.id,
      content_type: item.type,
      text: commentText.trim(),
      created_at: new Date().toISOString(),
    };
    // optimistic
    setComments((prev) => ({
      ...prev,
      [item.id]: [
        {
          ...newComment,
          id: `temp-${Date.now()}`,
          profiles: { id: user.id, username: user.username || "you", avatar_url: null },
        },
        ...(prev[item.id] || []),
      ],
    }));
    setCommentText("");
    try {
      await supabase.from("comments").insert([newComment]);
    } catch {}
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
        <View style={styles.headerActions}>
          <Text style={styles.postTypeIcon}>{getPostTypeIcon(item.type)}</Text>
          <TouchableOpacity onPress={() => openShare(item)} style={styles.headerIconBtn}>
            <Ionicons name="share-outline" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => overflowMenu(item)} style={styles.headerIconBtn}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.titleRow}>
        <Text style={styles.postContent}>{item.title}</Text>
        {item.type === "event" && (
          <View style={styles.datePill}>
            <Ionicons name="calendar-outline" size={12} color={colors.purple} />
            <Text style={styles.datePillText}>{new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</Text>
          </View>
        )}
      </View>
      {item.subtitle && <Text style={styles.postSub}>{item.subtitle}</Text>}
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{formatTimeAgo(item.created_at)}</Text>
        <View style={styles.dot} />
        <Text style={styles.metaText}>{item.type === "event" ? "Event" : "Build"}</Text>
      </View>

      {/* Media */}
      {item.cover && (
        <DoubleTap onDoubleTap={() => handleLike(item)}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() =>
              item.type === "build"
                ? navigation.navigate("CarDetailScreen", { carId: item.id })
                : navigation.navigate("EventsScreen", { eventId: item.id })
            }
          >
            <View>
              <Image source={{ uri: item.cover }} style={[styles.cover, viewMode === "compact" && styles.coverCompact]} />
              <HeartBurst trigger={item.isLiked} />
            </View>
          </TouchableOpacity>
        </DoubleTap>
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

        {/* Comment */}
        <TouchableOpacity style={styles.actionButton} onPress={() => openComments(item)}>
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

  const Header = () => (
    <View style={styles.topBar}>
      <View style={styles.segmented}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            onPress={() => setSelectedFilter(filter)}
            style={[styles.segButton, selectedFilter === filter && styles.segActive]}
            activeOpacity={0.85}
          >
            <Text style={[styles.segText, selectedFilter === filter && styles.segTextActive]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => setViewMode(viewMode === "media" ? "compact" : "media")} style={styles.iconBtn}>
          <Ionicons name={viewMode === "media" ? "list-outline" : "images-outline"} size={18} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSortMode(sortMode === "Newest" ? "Prioritized" : "Newest")} style={styles.iconBtn}>
          <Ionicons name="swap-vertical-outline" size={18} color={colors.textMuted} />
          <Text style={styles.sortLabel}>{sortMode}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={feedData}
        ListHeaderComponent={Header}
        stickyHeaderIndices={[0]}
        renderItem={({ item }) => <PostCard item={item} />}
  keyExtractor={(item) => `${item.type}:${item.id}`}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        removeClippedSubviews={true}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={7}
        updateCellsBatchingPeriod={50}
      />
      <Modal visible={!!commentFor} transparent animationType="slide" onRequestClose={() => setCommentFor(null)}>
        <View style={styles.commentOverlay}>
          <View style={styles.commentCard}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setCommentFor(null)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.commentList}>
              {(comments[commentFor?.id] || []).map((c) => (
                <View key={c.id} style={styles.commentItem}>
                  <View style={styles.commentAvatar}>
                    <Ionicons name="person-circle-outline" size={22} color={colors.textMuted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.commentUser}>@{c.profiles?.username || "user"}</Text>
                    <Text style={styles.commentText}>{c.text}</Text>
                  </View>
                </View>
              ))}
              {(!comments[commentFor?.id] || comments[commentFor?.id].length === 0) && (
                <Text style={styles.commentEmpty}>No comments yet</Text>
              )}
            </View>
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment"
                placeholderTextColor={colors.textMuted}
                value={commentText}
                onChangeText={setCommentText}
              />
              <TouchableOpacity style={styles.commentSend} onPress={postComment}>
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 22,
    marginRight: 10,
    backgroundColor: colors.cardBackground,
  },
  filterActive: { backgroundColor: colors.red, borderColor: colors.red, borderWidth: 1 },
  filterText: { color: colors.textMuted, fontSize: 13 },
  filterTextActive: { color: colors.textPrimary },
  topBar: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6 },
  segmented: {
    flexDirection: "row",
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    overflow: "hidden",
  },
  segButton: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 10 },
  segActive: { backgroundColor: colors.red },
  segText: { color: colors.textMuted, fontWeight: "700" },
  segTextActive: { color: "#fff" },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 8 },
  iconBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 },
  sortLabel: { color: colors.textMuted, fontSize: 12, marginLeft: 4 },
  postCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.accent,
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
  headerActions: { flexDirection: "row", alignItems: "center" },
  headerIconBtn: { paddingLeft: 10 },
  postTypeIcon: { fontSize: 20 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  postContent: { color: colors.textPrimary, fontSize: 15, marginBottom: 4, flex: 1, paddingRight: 10 },
  postSub: { color: colors.textSecondary, fontSize: 13, marginBottom: 10 },
  datePill: { flexDirection: "row", alignItems: "center", backgroundColor: colors.inputBackground, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  datePillText: { color: colors.purple, fontSize: 12, marginLeft: 4, fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  metaText: { color: colors.textMuted, fontSize: 12 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent, marginHorizontal: 8 },
  cover: {
    width: "100%",
    height: width * 0.5,
    borderRadius: 10,
    marginBottom: 10,
  },
  coverCompact: { height: width * 0.35 },
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
  commentOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  commentCard: { backgroundColor: colors.cardBackground, padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderWidth: 1, borderColor: colors.accent },
  commentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  commentTitle: { color: colors.textPrimary, fontWeight: "800", fontSize: 16 },
  commentList: { maxHeight: 260 },
  commentItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  commentAvatar: { width: 26, alignItems: "center", marginRight: 8 },
  commentUser: { color: colors.textPrimary, fontWeight: "700", fontSize: 12 },
  commentText: { color: colors.textSecondary, fontSize: 13 },
  commentEmpty: { color: colors.textMuted, fontSize: 12, textAlign: "center", paddingVertical: 12 },
  commentInputRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  commentInput: { flex: 1, backgroundColor: colors.inputBackground, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, color: colors.textPrimary },
  commentSend: { marginLeft: 8, backgroundColor: colors.purple, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  topBar: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6, backgroundColor: colors.background },
  segmented: {
    flexDirection: "row",
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    overflow: "hidden",
  },
  segButton: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 10 },
  segActive: { backgroundColor: colors.red },
  segText: { color: colors.textMuted, fontWeight: "700" },
  segTextActive: { color: "#fff" },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 8 },
  iconBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 },
  sortLabel: { color: colors.textMuted, fontSize: 12, marginLeft: 4 },
});

// Helper: relative time
function formatTimeAgo(dateInput) {
  const d = new Date(dateInput);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString();
}

// Double-tap wrapper
function DoubleTap({ children, onDoubleTap, delay = 250 }) {
  const lastTapRef = React.useRef(null);
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => {
        const now = Date.now();
        if (lastTapRef.current && now - lastTapRef.current < delay) {
          onDoubleTap?.();
        }
        lastTapRef.current = now;
      }}
    >
      {children}
    </TouchableOpacity>
  );
}

// Animated heart burst
function HeartBurst({ trigger }) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const scale = React.useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    if (!trigger) return;
    opacity.setValue(0);
    scale.setValue(0.6);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1.2, useNativeDriver: true }),
    ]).start(() => {
      Animated.timing(opacity, { toValue: 0, delay: 300, duration: 200, useNativeDriver: true }).start();
    });
  }, [trigger]);
  return (
    <Animated.View style={{ position: "absolute", top: "40%", left: 0, right: 0, alignItems: "center", opacity, transform: [{ scale }] }}>
      <Ionicons name="heart" size={68} color={colors.red} />
    </Animated.View>
  );
}
