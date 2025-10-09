// screens/ProfileScreen.js
import React, { useState, useEffect, useRef } from "react";
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../contexts/AuthContext";
import { profileService } from "../services/profileService";
import { carsService } from "../services/carsService";
import { communityService } from "../services/communityService"; // ✅ added
import CarShowcase from "../components/CarShowcase";

const { width } = Dimensions.get("window");

export default function ProfileScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [cars, setCars] = useState([]);
  const [followers, setFollowers] = useState(0);        // ✅ added
  const [followingCount, setFollowingCount] = useState(0); // ✅ added
  const [editVisible, setEditVisible] = useState(false);
  const [loading, setLoading] = useState(false);
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

  // ✅ NEW: safe follower/following loader with guards
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
    <LinearGradient colors={["#000", "#0a0a0a", "#000"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.bannerContainer}>
          <LinearGradient colors={["#150000", "#000000"]} style={styles.bannerGradient}>
            <Text style={styles.bannerText}>
              {profile?.full_name ? `${profile.full_name}'s Garage` : "Welcome to Your Garage"}
            </Text>
          </LinearGradient>
        </View>

        {profile && (
          <Animated.View style={[styles.profileContainer, { opacity: fadeAnim }]}>
            <View style={styles.avatarWrapper}>
              <Animated.View
                style={[styles.avatarGlow, { opacity: glowAnim, shadowOpacity: glowAnim }]}
              />
              <TouchableOpacity onPress={handleAvatarChange}>
                <Image
                  source={{
                    uri:
                      profile.avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        profile.full_name || "User"
                      )}&background=000&color=fff`,
                  }}
                  style={styles.avatar}
                />
              </TouchableOpacity>
            </View>

            <Animated.Text style={[styles.name, { transform: [{ scale: pulseAnim }] }]}>
              {profile.full_name || "Unnamed Racer"}
            </Animated.Text>
            <Text style={styles.username}>@{profile.username || "user"}</Text>
            {renderBadges()}

            <Text style={styles.bio}>{profile.bio || "Every car tells a story. This is mine."}</Text>

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

            {/* ✅ Stats now: Followers / Following / Cars */}
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

      {/* Edit Modal */}
      <Modal visible={editVisible} animationType="slide" onRequestClose={() => setEditVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Edit Profile</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
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
  scrollContent: { alignItems: "center", paddingBottom: 100 },
  bannerContainer: { width: "100%", height: 140 },
  bannerGradient: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: "#8B0000",
  },
  bannerText: { color: "#fff", fontSize: 20, fontWeight: "600", textTransform: "uppercase" },
  profileContainer: { alignItems: "center", width: "90%", marginTop: 20 },
  avatarWrapper: { alignItems: "center", justifyContent: "center", marginBottom: 16 },
  avatarGlow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#8B0000",
    opacity: 0.4,
    shadowColor: "#ff0000",
    shadowRadius: 30,
    shadowOpacity: 0.8,
    elevation: 8,
  },
  avatar: { width: 130, height: 130, borderRadius: 65, borderWidth: 1.5, borderColor: "#ff1f1f" },
  name: { color: "#fff", fontSize: 22, fontWeight: "bold", marginTop: 6 },
  username: { color: "#ff1f1f", fontSize: 14, marginBottom: 8 },
  bio: { color: "#bbb", fontSize: 13, textAlign: "center", marginBottom: 20, width: width * 0.8 },
  badgeContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginBottom: 10 },
  badgeChip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, margin: 4, shadowColor: "#ff1f1f", shadowOpacity: 0.6, shadowRadius: 10 },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  actionRow: { flexDirection: "row", justifyContent: "space-around", width: "100%", marginBottom: 25 },
  actionButton: { alignItems: "center", justifyContent: "center", backgroundColor: "#0a0a0a", borderRadius: 50, width: 70, height: 70, borderWidth: 1, borderColor: "#222" },
  actionGlow: { shadowColor: "#8B0000", shadowRadius: 10, shadowOpacity: 0.5 },
  actionLabel: { color: "#fff", fontSize: 12, marginTop: 5, fontWeight: "500" },
  statsContainer: { flexDirection: "row", justifyContent: "space-between", width: "95%", marginBottom: 25, backgroundColor: "#0d0d0d", borderRadius: 12, paddingVertical: 12 },
  statCard: { alignItems: "center", flex: 1 },
  statValue: { color: "#fff", fontSize: 17, fontWeight: "bold" },
  statLabel: { color: "#777", fontSize: 12 },
  socialRow: { flexDirection: "row", gap: 28, marginBottom: 30 },
  signOutButton: { marginTop: 15 },
  signOutText: { color: "#666", fontSize: 14 },
  modalContainer: { flex: 1, backgroundColor: "#000", padding: 20 },
  modalTitle: { color: "#fff", fontSize: 22, fontWeight: "bold", marginBottom: 15 },
  input: { backgroundColor: "#111", color: "#fff", borderRadius: 10, padding: 10, marginBottom: 15, borderWidth: 1, borderColor: "#1c1c1c" },
  bioInput: { height: 80, textAlignVertical: "top" },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 15 },
  cancelBtn: { padding: 10 },
  cancelText: { color: "#888" },
  saveBtn: { backgroundColor: "#8B0000", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  saveText: { color: "#fff", fontWeight: "bold" },
});
