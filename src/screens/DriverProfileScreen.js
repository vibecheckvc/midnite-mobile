// screens/DriverProfileScreen.js
import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Animated, Linking } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { carsService } from "../services/carsService";
import { communityService } from "../services/communityService";
import CarShowcase from "../components/CarShowcase";
import LoadingOverlay from "../components/LoadingOverlay";

const theme = {
  bgA: "#000000",
  bgB: "#0a0a0b",
  text: "#ffffff",
  muted: "#8b8b90",
  red: "#ff002f",
  edge: "rgba(255,0,76,0.25)",
  glass: "rgba(255,255,255,0.04)",
};

export default function DriverProfileScreen({ route, navigation }) {
  const { userId } = route.params;
  const [profile, setProfile] = useState(null);
  const [cars, setCars] = useState([]);
  const [followers, setFollowers] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setCurrentUserId(currentUser?.id ?? null);
    })();
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Ensure the native back button shows without a back title (no "Main Tabs")
  useEffect(() => {
    navigation?.setOptions?.({ headerBackTitleVisible: false, headerBackTitle: "" });
  }, [navigation]);

  useEffect(() => {
    if (!currentUserId) return;
    const unsubCounts = communityService.subscribeToFollowChanges(userId, async () => {
      const counts = await communityService.getFollowCounts(userId);
      setFollowers(counts.followers || 0);
      setFollowingCount(counts.following || 0);
    });
    const unsubRel = communityService.subscribeToRelationship(currentUserId, userId, ({ exists }) => setIsFollowing(!!exists));
    return () => { unsubCounts?.(); unsubRel?.(); };
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
      if (prof) {
        navigation.setOptions({ title: prof.username ? `@${prof.username}` : "Profile", headerBackTitleVisible: false, headerBackTitle: "" });
      }
      if (!carRes.error) setCars(carRes.data || []);
      setFollowers(counts.followers || 0);
      setFollowingCount(counts.following || 0);

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser?.id) {
        const rel = await communityService.isFollowing(currentUser.id, userId);
        setIsFollowing(!!rel.following);
      }

      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    } catch (err) {
      console.log("DriverProfile load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUserId || currentUserId === userId) return;
    const prev = isFollowing;
    setIsFollowing(!prev);
    setFollowers((f) => f + (prev ? -1 : 1));
    try {
      if (prev) {
        const { error } = await communityService.unfollowUser(currentUserId, userId);
        if (error) throw error;
      } else {
        const { error } = await communityService.followUser(currentUserId, userId);
        if (error) throw error;
      }
    } catch (err) {
      setIsFollowing(prev);
      setFollowers((f) => f + (prev ? 1 : -1));
    }
  };

  const openLink = (url) => {
    if (!url) return;
    const safe = url.startsWith("http") ? url : `https://${url}`;
    Linking.openURL(safe);
  };

  if (loading) {
    return <LoadingOverlay visible={true} />;
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={40} color={theme.red} />
        <Text style={{ color: theme.text, marginTop: 10, fontWeight: "600" }}>Profile not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16, borderColor: theme.edge, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 }}>
          <Text style={{ color: theme.text }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient colors={[theme.bgA, theme.bgB]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.cover}>
          <LinearGradient colors={["rgba(255,0,47,0.25)", "transparent"]} style={StyleSheet.absoluteFill} />
        </View>

        <Animated.View style={[styles.header, { opacity: fadeAnim }]}> 
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || "Driver")}&background=000&color=fff` }}
              style={styles.avatar}
            />
          </View>

          <Text style={styles.name}>{profile.full_name || "Unnamed Driver"}</Text>
          <Text style={styles.username}>@{profile.username || "user"}</Text>

          <View style={styles.actionRow}>
            {currentUserId !== userId && (
              <TouchableOpacity style={[styles.followBtn, isFollowing && styles.followingState]} onPress={handleFollowToggle}>
                <Ionicons name={isFollowing ? "checkmark" : "add-outline"} size={18} color={theme.text} />
                <Text style={styles.followText}>{isFollowing ? "Following" : "Follow"}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.dmBtn, { marginLeft: 12 }]} onPress={() => {}}>
              <Ionicons name="chatbubble-outline" size={20} color={theme.text} />
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

          {profile.bio && (
            <View style={styles.bioSection}>
              <Text style={styles.bio}>{profile.bio}</Text>
            </View>
          )}

          <View style={styles.socialRow}>
            {profile.instagram && (
              <TouchableOpacity style={styles.socialIcon} onPress={() => openLink(profile.instagram)}>
                <Ionicons name="logo-instagram" size={20} color={theme.text} />
              </TouchableOpacity>
            )}
            {profile.tiktok && (
              <TouchableOpacity style={styles.socialIcon} onPress={() => openLink(profile.tiktok)}>
                <Ionicons name="logo-tiktok" size={20} color={theme.text} />
              </TouchableOpacity>
            )}
            {profile.youtube && (
              <TouchableOpacity style={styles.socialIcon} onPress={() => openLink(profile.youtube)}>
                <Ionicons name="logo-youtube" size={20} color={theme.text} />
              </TouchableOpacity>
            )}
            {profile.website && (
              <TouchableOpacity style={styles.socialIcon} onPress={() => openLink(profile.website)}>
                <Ionicons name="globe-outline" size={20} color={theme.text} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.segmented}>
            <View style={[styles.seg, styles.segActive]}>
              <Text style={styles.segTextActive}>Builds</Text>
            </View>
            <View style={styles.seg}>
              <Text style={styles.segText}>Posts (soon)</Text>
            </View>
          </View>
        </Animated.View>

        <CarShowcase title="Public Builds" cars={cars} onSelect={(car) => navigation.navigate("CarDetailScreen", { carId: car.id })} />
        <View style={{ height: 60 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { alignItems: "center", paddingBottom: 80 },
  cover: { height: 160, width: "100%", backgroundColor: theme.bgB },
  header: { alignItems: "center", marginTop: -55 },
  avatarWrapper: { marginBottom: 10, borderRadius: 56, borderWidth: 2, borderColor: theme.edge, padding: 3, backgroundColor: theme.bgA },
  avatar: { width: 112, height: 112, borderRadius: 56 },
  name: { color: theme.text, fontSize: 20, fontWeight: "900", letterSpacing: -0.2 },
  username: { color: theme.muted, fontSize: 13, marginBottom: 10 },
  actionRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  followBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.red,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  followingState: {
    backgroundColor: theme.glass,
    borderWidth: 1,
    borderColor: theme.edge,
  },
  followText: { color: theme.text, fontSize: 13, marginLeft: 8, fontWeight: "800" },
  dmBtn: {
    backgroundColor: theme.glass,
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: theme.edge,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    marginTop: 10,
    marginBottom: 12,
    backgroundColor: theme.bgB,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: theme.edge,
  },
  statCard: { alignItems: "center", flex: 1 },
  statValue: { color: theme.text, fontSize: 18, fontWeight: "900" },
  statLabel: { color: theme.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  bioSection: { backgroundColor: theme.bgB, borderRadius: 10, padding: 12, marginTop: 8, width: "90%", borderWidth: 1, borderColor: theme.edge },
  bio: { color: theme.muted, fontSize: 13, textAlign: "center" },
  socialRow: { flexDirection: "row", marginTop: 12 },
  socialIcon: { marginHorizontal: 8, padding: 8, backgroundColor: theme.glass, borderRadius: 10, borderWidth: 1, borderColor: theme.edge },
  segmented: { flexDirection: "row", width: "90%", marginTop: 12, marginBottom: 8, backgroundColor: theme.glass, borderRadius: 10, borderWidth: 1, borderColor: theme.edge },
  seg: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 },
  segActive: { backgroundColor: theme.red },
  segText: { color: theme.muted, fontWeight: "700", fontSize: 13 },
  segTextActive: { color: theme.text, fontWeight: "800", fontSize: 13 },
});
