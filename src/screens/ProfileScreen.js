// screens/ProfileScreen.js
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Image,
  Modal,
  TextInput,
  Alert,
  Linking,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../contexts/AuthContext";
import { profileService } from "../services/profileService";
import { carsService } from "../services/carsService";
import { communityService } from "../services/communityService"; // counts only
import LoadingOverlay from "../components/LoadingOverlay";
import CarShowcase from "../components/CarShowcase";

const { width } = Dimensions.get("window");
// Premium theme tokens
const RED = "#ff002f";
const BG = "#000000";
const BG_ALT = "#0a0a0b";
const TEXT = "#ffffff";
const MUTED = "#8b8b90";
const BORDER = "rgba(255,0,76,0.25)";
const GLASS = "rgba(255,255,255,0.04)";
const GLASS_STRONG = "rgba(255,255,255,0.08)";
const GREEN = "#00c97e";

export default function ProfileScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [cars, setCars] = useState([]);
  const [followers, setFollowers] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [editVisible, setEditVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [youtube, setYoutube] = useState("");
  const [website, setWebsite] = useState("");

  useEffect(() => {
    loadProfile();
    if (user?.id) {
      loadCars();
      loadFollowCounts(); // ✅ added
    }

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.5, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, [user]);

  // Ensure consistent header when this screen is in a stack
  useLayoutEffect(() => {
    navigation?.setOptions?.({ headerBackTitleVisible: false, title: "Profile" });
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadProfile(), loadCars(), loadFollowCounts()]);
    setRefreshing(false);
  };

  const loadProfile = async () => {
    const { data, error } = await profileService.getProfile(user.id);
    if (error) console.error(error);
    else {
      setProfile(data);
      setFullName(data.full_name || "");
      setBio(data.bio || "");
      setInstagram(data.instagram || "");
      setTiktok(data.tiktok || "");
      setYoutube(data.youtube || "");
      setWebsite(data.website || "");
    }
  };

  const loadCars = async () => {
    const { data, error } = await carsService.getCarsByUser(user.id);
    if (!error && data) setCars(data);
  };
  // Safe follower/following loader with guards (display only)
  const loadFollowCounts = async () => {
    try {
      const counts = await communityService.getFollowCounts(user.id);
      setFollowers(counts?.followers ?? 0);
      setFollowingCount(counts?.following ?? 0);
    } catch (e) {
      console.log("follow count error:", e?.message);
      setFollowers(0);
      setFollowingCount(0);
    }
  };

  const handleAvatarChange = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      setLoading(true);
      const { data, error } = await profileService.uploadAvatar(result.assets[0].uri, user.id);
      if (error) Alert.alert("Upload Failed", error.message);
      else setProfile({ ...profile, avatar_url: data });
      setLoading(false);
    }
  };

  const normalizeLink = (value, platform) => {
    if (!value) return "";
    if (value.startsWith("http")) return value;
    switch (platform) {
      case "instagram":
        return `https://instagram.com/${value.replace("@", "")}`;
      case "tiktok":
        return `https://tiktok.com/@${value.replace("@", "")}`;
      case "youtube":
        return `https://youtube.com/@${value.replace("@", "")}`;
      default:
        return value;
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    const updates = {
      full_name: fullName.trim(),
      bio: bio.trim(),
      instagram: normalizeLink(instagram.trim(), "instagram"),
      tiktok: normalizeLink(tiktok.trim(), "tiktok"),
      youtube: normalizeLink(youtube.trim(), "youtube"),
      website: website.trim(),
    };
    const { error } = await profileService.updateProfile(user.id, updates);
    setLoading(false);
    setEditVisible(false);
    if (error) Alert.alert("Error", "Failed to update profile");
    else {
      loadProfile();
      loadFollowCounts(); // keep stats fresh after edit
    }
  };

  const openLink = (url) => {
    if (!url) return;
    Linking.openURL(url.startsWith("http") ? url : `https://${url}`);
  };

  const renderBadges = () => {
    if (!profile?.badges || profile.badges.length === 0) return null;
    return (
      <View style={styles.badgeContainer}>
        {profile.badges.map((badge, index) => (
          <LinearGradient key={index} colors={["#8B0000", "#320000"]} style={styles.badgeChip}>
            <Text style={styles.badgeText}>{badge}</Text>
          </LinearGradient>
        ))}
      </View>
    );
  };

  return (
    <LinearGradient colors={[BG, BG_ALT, BG]} style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        scrollEventThrottle={16}
        removeClippedSubviews={true}
      >
  {/* Removed banner/quotes for a cleaner look */}

        {/* Hero */}
        <View style={styles.heroWrap}>
          <LinearGradient
            colors={["#190007", "#300010", "#190007"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBg}
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <TouchableOpacity onPress={handleAvatarChange} activeOpacity={0.85}>
              <Image
                source={{
                  uri:
                    profile?.avatar_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      profile?.full_name || "User"
                    )}&background=000&color=fff`,
                }}
                style={styles.heroAvatar}
              />
            </TouchableOpacity>
            <Text style={styles.heroName}>{profile?.full_name || "Unnamed Racer"}</Text>
            <Text style={styles.heroUsername}>@{profile?.username || "user"}</Text>
          </View>
        </View>

        {profile && (
          <Animated.View style={[styles.profileContainer, { opacity: fadeAnim }]}>
            {/* Name & username moved into hero */}
            {renderBadges()}

            {!!profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

            {/* Quick Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionGlow]}
                onPress={() => setEditVisible(true)}
              >
                <Ionicons name="settings-outline" size={22} color="#fff" />
                <Text style={styles.actionLabel}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.actionGlow]}
                onPress={() => navigation.navigate("Garage")}
              >
                <Ionicons name="car-sport-outline" size={22} color="#fff" />
                <Text style={styles.actionLabel}>Garage</Text>
              </TouchableOpacity>
            </View>

            {/* ✅ Stats now: Followers / Following / Cars (static, symmetric) */}
            <View style={styles.statsContainer}>
              {[
                { label: "Followers", value: followers },
                { label: "Following", value: followingCount },
                { label: "Cars", value: cars.length },
              ].map((stat, i) => (
                <View key={i} style={styles.statCard}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>

            {/* Removed race strip divider */}

            {/* Socials */}
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

            {/* Build Showcase */}
            <CarShowcase
              title="My Builds"
              cars={cars}
              onSelect={(car) => navigation.navigate("CarDetailScreen", { carId: car.id })}
            />

            {/* Sign Out */}
            <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

  {/* Show overlay during any save/upload operations */}
  <LoadingOverlay visible={loading} />

      {/* Edit Modal */}
      <Modal visible={editVisible} animationType="slide" onRequestClose={() => setEditVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Edit Profile</Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalCard}>
            <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#777" value={fullName} onChangeText={setFullName} />
            <TextInput style={[styles.input, styles.bioInput]} placeholder="Bio" placeholderTextColor="#777" value={bio} onChangeText={setBio} multiline />
            <TextInput style={styles.input} placeholder="Instagram" placeholderTextColor="#777" value={instagram} onChangeText={setInstagram} />
            <TextInput style={styles.input} placeholder="TikTok" placeholderTextColor="#777" value={tiktok} onChangeText={setTiktok} />
            <TextInput style={styles.input} placeholder="YouTube" placeholderTextColor="#777" value={youtube} onChangeText={setYoutube} />
            <TextInput style={styles.input} placeholder="Website" placeholderTextColor="#777" value={website} onChangeText={setWebsite} />
          </ScrollView>
          <View style={styles.modalButtons}>
            <TouchableOpacity onPress={() => setEditVisible(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveProfile} style={styles.saveBtn}>
              <Text style={styles.saveText}>{loading ? "Saving..." : "Save"}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { alignItems: "center", paddingBottom: 120 },
  heroWrap: {
    width: "100%",
    height: 240,
    position: "relative",
    marginBottom: 18,
  },
  heroBg: { ...StyleSheet.absoluteFillObject },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  heroContent: {
    position: "absolute",
    bottom: 18,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 18,
  },
  heroAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: RED,
    backgroundColor: "#111",
    marginBottom: 12,
  },
  heroName: {
    color: TEXT,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  heroUsername: { color: RED, fontSize: 13, fontWeight: "700", marginTop: 4 },
  profileContainer: {
    alignItems: "center",
    width: "92%",
    backgroundColor: GLASS_STRONG,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  bio: { color: MUTED, fontSize: 13, textAlign: "center", marginBottom: 22, width: width * 0.84, lineHeight: 19 },
  badgeContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginBottom: 14 },
  badgeChip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, margin: 4, backgroundColor: GLASS, borderWidth: 1, borderColor: BORDER },
  badgeText: { color: TEXT, fontSize: 11, fontWeight: "700" },
  actionRow: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginBottom: 24, gap: 14 },
  actionButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GLASS,
    borderRadius: 16,
    height: 74,
    borderWidth: 1,
    borderColor: BORDER,
  },
  actionGlow: { shadowColor: RED, shadowRadius: 10, shadowOpacity: 0.4 },
  actionLabel: { color: TEXT, fontSize: 12, marginTop: 6, fontWeight: "700" },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 26,
    gap: 14,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: GLASS,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: BORDER,
    minHeight: 80,
    justifyContent: "center",
  },
  statValue: { color: TEXT, fontSize: 22, fontWeight: "900", letterSpacing: -0.5, marginBottom: 4 },
  statLabel: { color: MUTED, fontSize: 12, fontWeight: "600", letterSpacing: 0.2, textTransform: "uppercase" },
  socialRow: { flexDirection: "row", justifyContent: "center", gap: 22, width: "100%", marginBottom: 30 },
  signOutButton: { marginTop: 8 },
  signOutText: { color: MUTED, fontSize: 13, fontWeight: "600" },
  modalContainer: { flex: 1, backgroundColor: BG, padding: 16 },
  modalTitle: { color: TEXT, fontSize: 20, fontWeight: "800", marginBottom: 10, textAlign: "center" },
  modalCard: { paddingHorizontal: 8, paddingBottom: 8 },
  input: { backgroundColor: GLASS_STRONG, color: TEXT, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: BORDER, fontSize: 14 },
  bioInput: { height: 90, textAlignVertical: "top" },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", marginTop: 6 },
  cancelBtn: { padding: 12 },
  cancelText: { color: MUTED, fontWeight: "600" },
  saveBtn: { backgroundColor: RED, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, marginRight: 4 },
  saveText: { color: TEXT, fontWeight: "800" },
});
