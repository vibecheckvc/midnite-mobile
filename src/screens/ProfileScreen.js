import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors as appColors } from "../constants/colors";

const { width } = Dimensions.get("window");

// Mock user data
const mockUser = {
  name: "Alex Chen",
  username: "SpeedDemon_99",
  avatar: "🏎️",
  location: "Tokyo, Japan",
  bio: "Car enthusiast, drift lover, and midnight racer. Building the perfect RX-7 and sharing the journey with fellow gearheads!",
  followers: 1247,
  following: 892,
  cars: 3,
  posts: 156,
  joinDate: "January 2023",
  verified: true,
};

const mockStats = [
  { label: "Posts", value: "156" },
  { label: "Followers", value: "1.2K" },
  { label: "Following", value: "892" },
  { label: "Cars", value: "3" },
];

const mockAchievements = [
  {
    title: "Speed Demon",
    description: "First track day completed",
    icon: "🏁",
  },
  {
    title: "Social Butterfly",
    description: "100+ followers reached",
    icon: "👥",
  },
  { title: "Garage Master", description: "3 cars in garage", icon: "🏎️" },
];

export default function ProfileScreen() {
  const [user] = useState(mockUser);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

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
            {/* Profile Picture and Basic Info */}
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatar}>{user.avatar}</Text>
                {user.verified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons
                      name="checkmark"
                      size={12}
                      color={appColors.textPrimary}
                    />
                  </View>
                )}
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userHandle}>@{user.username}</Text>
                <View style={styles.locationContainer}>
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color={appColors.textMuted}
                  />
                  <Text style={styles.location}>{user.location}</Text>
                </View>
                <Text style={styles.joinDate}>Joined {user.joinDate}</Text>
              </View>
            </View>

            {/* Bio */}
            <Text style={styles.bio}>{user.bio}</Text>

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
          {/* Achievements */}
          <ProfileSection title="Achievements">
            <View style={styles.achievementsContainer}>
              {mockAchievements.map((achievement, index) => (
                <View key={index} style={styles.achievementCard}>
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementTitle}>
                      {achievement.title}
                    </Text>
                    <Text style={styles.achievementDescription}>
                      {achievement.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ProfileSection>

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
          <TouchableOpacity style={styles.logoutButton}>
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
  profileHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    width: "100%",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 16,
  },
  avatar: {
    fontSize: 60,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: appColors.purple,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: appColors.primary,
  },
  userInfo: {
    flex: 1,
    paddingTop: 8,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: appColors.textPrimary,
    marginBottom: 4,
  },
  userHandle: {
    fontSize: 16,
    color: appColors.purple,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: appColors.textMuted,
    marginLeft: 4,
  },
  joinDate: {
    fontSize: 12,
    color: appColors.textMuted,
  },
  bio: {
    fontSize: 16,
    color: appColors.textSecondary,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
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
  achievementsContainer: {
    backgroundColor: appColors.cardBackground,
    borderRadius: 16,
    padding: 16,
  },
  achievementCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  achievementIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: appColors.textPrimary,
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: appColors.textMuted,
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
