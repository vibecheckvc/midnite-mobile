import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors as appColors } from "../constants/colors";
import { useAuth } from "../contexts/AuthContext";

const { width } = Dimensions.get("window");

// Mock stats data
const mockStats = [
  { label: "Posts", value: "156" },
  { label: "Followers", value: "1.2K" },
  { label: "Following", value: "892" },
  { label: "Cars", value: "3" },
];

export default function ProfileScreen() {
  const { signOut, user: authUser } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Get username from auth user metadata or email
  const username =
    authUser?.user_metadata?.username ||
    authUser?.email?.split("@")[0] ||
    "User";
  const displayName = authUser?.user_metadata?.full_name || username;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            Alert.alert("Error", "Failed to sign out");
          }
        },
      },
    ]);
  };

  const ProfileSection = ({ title, children, style }) => (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
        style,
      ]}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <LinearGradient
          colors={appColors?.darkGradient || ["#1a1a2e", "#16213e"]}
          style={styles.header}
        >
          <Animated.View
            style={[
              styles.headerContent,
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
            {/* Profile Picture */}
            <View style={styles.profilePictureContainer}>
              <View style={styles.profilePicture}>
                <Image
                  source={{
                    uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      displayName
                    )}&background=8b5cf6&color=fff&size=120&bold=true`,
                  }}
                  style={styles.profileImage}
                  defaultSource={require("./midnte.png")}
                />
              </View>
              <TouchableOpacity style={styles.editPhotoButton}>
                <Ionicons
                  name="camera"
                  size={16}
                  color={appColors.textPrimary}
                />
              </TouchableOpacity>
            </View>

            {/* User Info */}
            <View style={styles.userInfoContainer}>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userHandle}>@{username}</Text>
            </View>

            {/* Bio */}
            <Text style={styles.bio}>
              Car enthusiast, drift lover, and midnight racer. Building the
              perfect ride and sharing the journey with fellow gearheads!
            </Text>

            {/* Stats */}
            <View style={styles.statsContainer}>
              {mockStats.map((stat, index) => (
                <View key={index} style={styles.statItem}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </LinearGradient>

        {/* Content Sections */}
        <View style={styles.content}>
          {/* Quick Actions */}
          <ProfileSection title="Quick Actions">
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionCard}>
                <LinearGradient
                  colors={appColors?.purpleGradient || ["#8b5cf6", "#7c3aed"]}
                  style={styles.actionGradient}
                >
                  <Ionicons
                    name="settings-outline"
                    size={24}
                    color={appColors.textPrimary}
                  />
                </LinearGradient>
                <Text style={styles.actionText}>Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard}>
                <LinearGradient
                  colors={appColors?.blueGradient || ["#06b6d4", "#3b82f6"]}
                  style={styles.actionGradient}
                >
                  <Ionicons
                    name="notifications-outline"
                    size={24}
                    color={appColors.textPrimary}
                  />
                </LinearGradient>
                <Text style={styles.actionText}>Notifications</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard}>
                <LinearGradient
                  colors={appColors?.redGradient || ["#ef4444", "#dc2626"]}
                  style={styles.actionGradient}
                >
                  <Ionicons
                    name="help-circle-outline"
                    size={24}
                    color={appColors.textPrimary}
                  />
                </LinearGradient>
                <Text style={styles.actionText}>Help</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard}>
                <LinearGradient
                  colors={["#10b981", "#059669"]}
                  style={styles.actionGradient}
                >
                  <Ionicons
                    name="share-outline"
                    size={24}
                    color={appColors.textPrimary}
                  />
                </LinearGradient>
                <Text style={styles.actionText}>Share Profile</Text>
              </TouchableOpacity>
            </View>
          </ProfileSection>

          {/* App Info */}
          <ProfileSection title="About">
            <View style={styles.aboutContainer}>
              <Text style={styles.aboutText}>
                Midnite Auto - The 24/7 Car Meet
              </Text>
              <Text style={styles.aboutSubtext}>
                Version 1.0.0 • Built with ❤️ for car enthusiasts
              </Text>
            </View>
          </ProfileSection>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color={appColors.red} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerContent: {
    alignItems: "center",
  },
  profilePictureContainer: {
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: appColors.purple,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  editPhotoButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: appColors.purple,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: appColors.primary,
  },
  userInfoContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
    color: appColors.textPrimary,
    marginBottom: 4,
  },
  userHandle: {
    fontSize: 18,
    color: appColors.purple,
    fontWeight: "500",
  },
  bio: {
    fontSize: 16,
    color: appColors.textSecondary,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: appColors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: appColors.textMuted,
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: appColors.textPrimary,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    width: (width - 60) / 2,
    alignItems: "center",
    marginBottom: 16,
  },
  actionGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: appColors.textMuted,
    textAlign: "center",
  },
  aboutContainer: {
    backgroundColor: appColors.cardBackground,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  aboutText: {
    fontSize: 16,
    fontWeight: "600",
    color: appColors.textPrimary,
    marginBottom: 8,
  },
  aboutSubtext: {
    fontSize: 14,
    color: appColors.textMuted,
    textAlign: "center",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: appColors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },
  logoutText: {
    fontSize: 16,
    color: appColors.red,
    marginLeft: 8,
    fontWeight: "600",
  },
});
