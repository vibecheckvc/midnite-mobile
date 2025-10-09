// screens/DriverProfileScreen.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Animated,
  Linking,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { carsService } from "../services/carsService";
import { communityService } from "../services/communityService";
import CarShowcase from "../components/CarShowcase";

export default function DriverProfileScreen({ route, navigation }) {
  const { userId } = route.params;
  const [profile, setProfile] = useState(null);
  const [cars, setCars] = useState([]);
  const [followers, setFollowers] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // keep current session user
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setCurrentUserId(currentUser?.id ?? null);
    })();
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (!currentUserId) return;

    // 1) live counts for this profile (followers/following)
    const unsubCounts = communityService.subscribeToFollowChanges(
      userId,
      async () => {
        const counts = await communityService.getFollowCounts(userId);
        setFollowers(counts.followers || 0);
        setFollowingCount(counts.following || 0);
      }
    );

    // 2) live relationship for Follow button (current → viewing)
    const unsubRel = communityService.subscribeToRelationship(
      currentUserId,
      userId,
      ({ exists }) => setIsFollowing(!!exists)
    );

    return () => {
      unsubCounts?.();
      unsubRel?.();
    };
  }, [currentUserId, userId]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [{ data: prof }, carRes, counts] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        carsService.getCarsByUser(userId, false),
        communityService.getFollowCounts(userId),
      ]);

      setProfile(prof || null);
      if (!carRes.error) setCars(carRes.data || []);
      setFollowers(counts.followers || 0);
      setFollowingCount(counts.following || 0);

      // initial follow state if we know the current user
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (currentUser?.id) {
        const rel = await communityService.isFollowing(currentUser.id, userId);
        setIsFollowing(!!rel.following);
      }

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.log("DriverProfile load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUserId || currentUserId === userId) return;

    // optimistic update
    setIsFollowing((prev) => !prev);
    setFollowers((f) => f + (isFollowing ? -1 : 1));

    if (isFollowing) {
      const { error } = await communityService.unfollowUser(
        currentUserId,
        userId
      );
      if (error) {
        // rollback if error
        setIsFollowing(true);
        setFollowers((f) => f + 1);
      }
    } else {
      const { error } = await communityService.followUser(
        currentUserId,
        userId
      );
      if (error) {
        // rollback if error
        setIsFollowing(false);
        setFollowers((f) => f - 1);
      }
    }
  };

  const openLink = (url) => {
    if (!url) return;
    const safe = url.startsWith("http") ? url : `https://${url}`;
    Linking.openURL(safe);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B0000" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={40} color="#8B0000" />
        <Text style={{ color: "#fff", marginTop: 10, fontWeight: "600" }}>
          Profile not found
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            marginTop: 16,
            borderColor: "#8B0000",
            borderWidth: 1,
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#fff" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient colors={["#000", "#0a0a0a", "#000"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{
                uri:
                  profile.avatar_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    profile.full_name || "Driver"
                  )}&background=000&color=fff`,
              }}
              style={styles.avatar}
            />
          </View>

          <Text style={styles.name}>{profile.full_name || "Unnamed Racer"}</Text>
          <Text style={styles.username}>@{profile.username || "user"}</Text>

          <View style={styles.actionRow}>
            {currentUserId !== userId && (
              <TouchableOpacity
                style={[styles.followBtn, isFollowing && { backgroundColor: "#222" }]}
                onPress={handleFollowToggle}
              >
                <Ionicons
                  name={isFollowing ? "checkmark" : "add-outline"}
                  size={18}
                  color="#fff"
                />
                <Text style={styles.followText}>
                  {isFollowing ? "Following" : "Follow"}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.dmBtn}
              onPress={() => {/* keep DM modal for later */}}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.statsContainer}>
            {[
              { label: "Followers", value: followers },
              { label: "Following", value: followingCount },
              { label: "Builds", value: cars.length },
            ].map((stat, i) => (
              <View key={i} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {profile.badges && profile.badges.length > 0 && (
            <View style={styles.badgeContainer}>
              {profile.badges.map((b, i) => (
                <LinearGradient key={i} colors={["#8B0000", "#320000"]} style={styles.badgeChip}>
                  <Text style={styles.badgeText}>{b}</Text>
                </LinearGradient>
              ))}
            </View>
          )}
        </Animated.View>

        {profile.bio && (
          <View style={styles.bioSection}>
            <Text style={styles.bio}>{profile.bio}</Text>
          </View>
        )}

        <View style={styles.socialRow}>
          {profile.instagram && (
            <TouchableOpacity onPress={() => openLink(profile.instagram)}>
              <Ionicons name="logo-instagram" size={28} color="#ff1f1f" />
            </TouchableOpacity>
          )}
          {profile.tiktok && (
            <TouchableOpacity onPress={() => openLink(profile.tiktok)}>
              <Ionicons name="logo-tiktok" size={26} color="#fff" />
            </TouchableOpacity>
          )}
          {profile.youtube && (
            <TouchableOpacity onPress={() => openLink(profile.youtube)}>
              <Ionicons name="logo-youtube" size={28} color="#ff0000" />
            </TouchableOpacity>
          )}
          {profile.website && (
            <TouchableOpacity onPress={() => openLink(profile.website)}>
              <Ionicons name="globe-outline" size={26} color="#aaa" />
            </TouchableOpacity>
          )}
        </View>

        <CarShowcase
          title="Public Builds"
          cars={cars}
          onSelect={(car) => navigation.navigate("CarDetailScreen", { carId: car.id })}
        />

        <View style={{ height: 60 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { alignItems: "center", paddingBottom: 80 },
  header: { alignItems: "center", marginTop: 30 },
  avatarWrapper: { marginBottom: 10 },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
    borderColor: "#8B0000",
  },
  name: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  username: { color: "#ff1f1f", fontSize: 13, marginBottom: 10 },
  actionRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  followBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8B0000",
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 10,
  },
  followText: { color: "#fff", fontSize: 13, marginLeft: 5 },
  dmBtn: {
    backgroundColor: "#111",
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: "#222",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    marginBottom: 15,
    backgroundColor: "#0d0d0d",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  statCard: { alignItems: "center", flex: 1 },
  statValue: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  statLabel: { color: "#777", fontSize: 12 },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 15,
  },
  badgeChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, margin: 3 },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  bioSection: { backgroundColor: "#0d0d0d", borderRadius: 10, padding: 12, marginTop: 10, width: "90%" },
  bio: { color: "#bbb", fontSize: 13, textAlign: "center" },
  socialRow: { flexDirection: "row", gap: 20, marginTop: 20 },
});
