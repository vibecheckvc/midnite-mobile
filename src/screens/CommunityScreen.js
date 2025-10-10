import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { colors } from "../constants/colors";
import { useAuth } from "../contexts/AuthContext";
import { communityService } from "../services/communityService";

export default function CommunityScreen({ navigation }) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [following, setFollowing] = useState([]); // ids I follow
  const [refreshing, setRefreshing] = useState(false);

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
          prev.includes(p.new.following_id)
            ? prev
            : [...prev, p.new.following_id]
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
      // optimistic
      setFollowing((prev) =>
        currently ? prev.filter((id) => id !== targetId) : [...prev, targetId]
      );

      if (currently) {
        const { error } = await communityService.unfollowUser(
          user.id,
          targetId
        );
        if (error) throw error;
      } else {
        const { error } = await communityService.followUser(user.id, targetId);
        if (error) throw error;
      }
    } catch (e) {
      Alert.alert("Error", "Could not update follow status");
      // rollback by reloading
      load();
    }
  };

  const UserCard = ({ item }) => {
    const isFollowing = following.includes(item.id);
    return (
      <TouchableOpacity
        style={styles.userCard}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate("DriverProfileScreen", { userId: item.id })
        }
      >
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={{ fontSize: 18 }}>🚗</Text>
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text style={styles.username}>{item.username || "User"}</Text>
          {item.full_name && (
            <Text style={styles.fullName}>{item.full_name}</Text>
          )}
        </View>

        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation(); // don’t trigger profile nav
            toggleFollow(item.id);
          }}
          style={[
            styles.followBtn,
            isFollowing && { backgroundColor: colors.purple },
          ]}
        >
          <Text style={styles.followText}>
            {isFollowing ? "Following" : "Follow"}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Following (avatars row) */}
      {following.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Following</Text>
          <View style={styles.followingRow}>
            {profiles
              .filter((p) => following.includes(p.id))
              .slice(0, 12)
              .map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() =>
                    navigation.navigate("DriverProfileScreen", { userId: p.id })
                  }
                >
                  {p.avatar_url ? (
                    <Image
                      source={{ uri: p.avatar_url }}
                      style={styles.followingAvatar}
                    />
                  ) : (
                    <View
                      style={[
                        styles.followingAvatar,
                        styles.followingAvatarPlaceholder,
                      ]}
                    >
                      <Text>🚗</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
          </View>
        </>
      )}

      {/* Discover People */}
      <Text style={styles.sectionTitle}>Discover People</Text>
      <FlatList
        data={profiles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <UserCard item={item} />}
        scrollEnabled={false}
      />

      {/* Coming Soon blocks */}
      <Text style={styles.sectionTitle}>Groups</Text>
      <LinearGradient colors={colors.blueGradient} style={styles.comingBox}>
        <Ionicons name="chatbubbles-outline" size={38} color="#fff" />
        <Text style={styles.comingTitle}>Groups & Forums Coming Soon</Text>
        <Text style={styles.comingText}>
          Join clubs, meet crews, and share knowledge with other builders and
          drivers.
        </Text>
      </LinearGradient>

      <Text style={styles.sectionTitle}>Direct Chat</Text>
      <LinearGradient
        colors={colors.redGradient || ["#A00000", "#600000"]}
        style={styles.comingBox}
      >
        <Ionicons name="chatbox-ellipses-outline" size={38} color="#fff" />
        <Text style={styles.comingTitle}>Direct Messaging Coming Soon</Text>
        <Text style={styles.comingText}>
          1:1 DMs, crew chats, and meet planning will land in a future update.
        </Text>
      </LinearGradient>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 24, fontWeight: "700", color: colors.textPrimary },
  sectionTitle: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 16,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 0,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  username: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 16,
    letterSpacing: -0.3,
  },
  fullName: {
    color: colors.textMuted,
    fontSize: 13,
    letterSpacing: -0.2,
  },
  followBtn: {
    backgroundColor: colors.red,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 0,
  },
  followText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: -0.2,
  },
  comingBox: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  comingTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 8 },
  comingText: {
    color: "#eee",
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 18,
  },
  followingRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    paddingHorizontal: 16,
  },
  followingAvatar: { width: 44, height: 44, borderRadius: 22 },
  followingAvatarPlaceholder: {
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
});
