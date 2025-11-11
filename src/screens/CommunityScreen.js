import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { communityService } from "../services/communityService";

const theme = {
  bgA: "#000000",
  bgB: "#0a0a0b",
  text: "#ffffff",
  muted: "#8b8b90",
  red: "#ff002f",
  purple: "#8b5cf6",
  edge: "rgba(255,0,76,0.25)",
  glass: "rgba(255,255,255,0.04)",
};

export default function CommunityScreen({ navigation }) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [following, setFollowing] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const searchRef = useRef(null);

  // Show native header like Feed/Events and center the title
  useEffect(() => {
    navigation?.setOptions?.({ headerShown: true, title: "Community", headerTitleAlign: "center" });
  }, [navigation]);

  useEffect(() => {
    if (user?.id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    // subscribe to changes in my "following" list to live-update buttons
    const unsub = communityService.subscribeToFollowChanges(user.id, (p) => {
      // only adjust the local following array when *I* (follower) change follows
      if (p.scope !== "following") return;
      if (p.eventType === "INSERT") {
        setFollowing((prev) =>
          prev.includes(p.new.following_id) ? prev : [...prev, p.new.following_id]
        );
      } else if (p.eventType === "DELETE") {
        setFollowing((prev) => prev.filter((id) => id !== p.old.following_id));
      }
    });
    return () => unsub?.();
  }, [user?.id]);

  const load = async () => {
    try {
      const [{ data: users, error }, { data: follows }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .neq("id", user.id)
          .order("username", { ascending: true }),
        supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id),
      ]);
      if (error) throw error;

      setProfiles(users || []);
      setFollowing((follows || []).map((r) => r.following_id));
    } catch (err) {
      console.error("Community load error:", err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const toggleFollow = async (targetId) => {
    try {
      const currently = following.includes(targetId);
      setFollowing((prev) =>
        currently ? prev.filter((id) => id !== targetId) : [...prev, targetId]
      );

      if (currently) {
        const { error } = await communityService.unfollowUser(user.id, targetId);
        if (error) throw error;
      } else {
        const { error } = await communityService.followUser(user.id, targetId);
        if (error) throw error;
      }
    } catch (e) {
      Alert.alert("Error", "Could not update follow status");
      load();
    }
  };

  const filteredProfiles = useMemo(() => {
    let filtered = profiles;

    if (activeTab === "following") {
      filtered = filtered.filter((p) => following.includes(p.id));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.username?.toLowerCase().includes(q) ||
          p.full_name?.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [profiles, following, activeTab, searchQuery]);

  const UserCard = ({ item }) => {
    const isFollowing = following.includes(item.id);
    return (
      <TouchableOpacity
        style={styles.userCard}
        activeOpacity={0.85}
        onPress={() => navigation.navigate("DriverProfileScreen", { userId: item.id })}
      >
        <View style={styles.cardLeft}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={20} color={theme.muted} />
            </View>
          )}

          <View style={styles.userInfo}>
            <Text style={styles.username} numberOfLines={1}>
              {item.username || "User"}
            </Text>
            {item.full_name && (
              <Text style={styles.fullName} numberOfLines={1}>
                {item.full_name}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            toggleFollow(item.id);
          }}
          style={[
            styles.followBtn,
            isFollowing && styles.followBtnActive,
          ]}
          activeOpacity={0.7}
        >
          <Text style={[styles.followText, isFollowing && styles.followTextActive]}>
            {isFollowing ? "Following" : "Follow"}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

const Header = () => (
  <View style={styles.headerSection}>
    <View style={styles.segmentedControl}>
      <TouchableOpacity
        style={[styles.segment, activeTab === "all" && styles.segmentActive]}
        onPress={() => setActiveTab("all")}
        activeOpacity={0.7}
      >
        <Text style={[styles.segmentText, activeTab === "all" && styles.segmentTextActive]}>
          All Drivers
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.segment, activeTab === "following" && styles.segmentActive]}
        onPress={() => setActiveTab("following")}
        activeOpacity={0.7}
      >
        <Text style={[styles.segmentText, activeTab === "following" && styles.segmentTextActive]}>
          Following ({following.length})
        </Text>
      </TouchableOpacity>
    </View>

    <View style={styles.futureCard}>
      <View style={styles.futureHeader}>
        <Ionicons name="sparkles-outline" size={18} color={theme.text} />
        <Text style={styles.futureTitle}>Coming soon</Text>
      </View>
      <View style={styles.futureItems}>
        <Text style={styles.futureItem}>• Groups and crews</Text>
        <Text style={styles.futureItem}>• Trending tags and people</Text>
        <Text style={styles.futureItem}>• Nearby drivers</Text>
      </View>
    </View>
  </View>
);

return (
  <SafeAreaView style={styles.safe} edges={["top"]}>
    <LinearGradient colors={[theme.bgA, theme.bgB]} style={StyleSheet.absoluteFill} />

    {/* Keep search bar outside the FlatList so it never unmounts while typing */}
    <View style={styles.headerSection}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={theme.muted} />
        <TextInput
          ref={searchRef}
          style={styles.searchInput}
          placeholder="Search drivers..."
          placeholderTextColor={theme.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          blurOnSubmit={true}
          returnKeyType="search"
          onSubmitEditing={() => searchRef.current?.blur()}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={18} color={theme.muted} />
          </TouchableOpacity>
        )}
      </View>
    </View>

    <FlatList
      data={filteredProfiles}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <UserCard item={item} />}
      ListHeaderComponent={Header}
      stickyHeaderIndices={[0]}
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="always"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.red}
          colors={[theme.red]}
        />
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={56} color={theme.muted} />
          <Text style={styles.emptyStateTitle}>
            {searchQuery.trim()
              ? "No drivers found"
              : activeTab === "following"
              ? "Not following anyone yet"
              : "No drivers"}
          </Text>
          <Text style={styles.emptyStateText}>
            {searchQuery.trim()
              ? "Try a different search term"
              : activeTab === "following"
              ? "Start following other drivers"
              : "Check back later"}
          </Text>
        </View>
      }
      // keep header mounted during typing
      removeClippedSubviews={false}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={7}
      updateCellsBatchingPeriod={50}
    />
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bgA },

  headerSection: {
    backgroundColor: theme.bgA,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.edge,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.glass,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.edge,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: theme.text,
    fontSize: 15,
    marginLeft: 8,
    fontWeight: "500",
  },

  segmentedControl: {
    flexDirection: "row",
    backgroundColor: theme.glass,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: theme.edge,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: theme.red,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.muted,
  },
  segmentTextActive: {
    color: theme.text,
  },

  listContent: {
    paddingBottom: 100,
  },

  userCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.bgB,
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.edge,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: theme.edge,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: theme.glass,
    borderWidth: 1.5,
    borderColor: theme.edge,
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: theme.text,
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: -0.2,
  },
  fullName: {
    color: theme.muted,
    fontSize: 13,
    marginTop: 2,
    fontWeight: "500",
  },

  followBtn: {
    backgroundColor: theme.red,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  followBtnActive: {
    backgroundColor: theme.glass,
    borderWidth: 1,
    borderColor: theme.edge,
  },
  followText: {
    color: theme.text,
    fontWeight: "700",
    fontSize: 13,
  },
  followTextActive: {
    color: theme.muted,
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: theme.muted,
    textAlign: "center",
    lineHeight: 20,
  },

  /* Future updates card */
  futureCard: {
    marginTop: 12,
    marginBottom: 6,
    backgroundColor: theme.bgB,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.edge,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  futureHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  futureTitle: { color: theme.text, fontWeight: "800", marginLeft: 8 },
  futureItems: { gap: 2 },
  futureItem: { color: theme.muted, fontSize: 13 },
});
