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
import { colors } from "../constants/colors";

const { width } = Dimensions.get("window");

// Mock data for crew members
const mockCrew = [
  {
    id: "1",
    name: "Alex Chen",
    username: "SpeedDemon_99",
    avatar: "🏎️",
    location: "Tokyo, Japan",
    cars: ["RX-7 FD", "Supra MK4"],
    followers: 1247,
    isFollowing: false,
    isOnline: true,
  },
  {
    id: "2",
    name: "Yuki Tanaka",
    username: "Tokyo_Drifter",
    avatar: "🚗",
    location: "Osaka, Japan",
    cars: ["GT-R R34", "Silvia S15"],
    followers: 892,
    isFollowing: true,
    isOnline: false,
  },
  {
    id: "3",
    name: "Marcus Rodriguez",
    username: "GTR_Legend",
    avatar: "🏁",
    location: "Los Angeles, CA",
    cars: ["GT-R R35", "M3 E46"],
    followers: 2156,
    isFollowing: false,
    isOnline: true,
  },
  {
    id: "4",
    name: "Sarah Kim",
    username: "Drift_Queen",
    avatar: "🚙",
    location: "Seoul, South Korea",
    cars: ["BRZ", "86"],
    followers: 678,
    isFollowing: true,
    isOnline: true,
  },
  {
    id: "5",
    name: "James Wilson",
    username: "Track_Master",
    avatar: "🏎️",
    location: "London, UK",
    cars: ["Porsche 911", "Cayman GT4"],
    followers: 1543,
    isFollowing: false,
    isOnline: false,
  },
];

export default function CrewScreen() {
  const [crew, setCrew] = useState(mockCrew);
  const [selectedTab, setSelectedTab] = useState("All");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const tabs = ["All", "Following", "Online"];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleFollow = (userId) => {
    setCrew(
      crew.map((member) => {
        if (member.id === userId) {
          return {
            ...member,
            isFollowing: !member.isFollowing,
            followers: member.isFollowing
              ? member.followers - 1
              : member.followers + 1,
          };
        }
        return member;
      })
    );
  };

  const getFilteredCrew = () => {
    switch (selectedTab) {
      case "Following":
        return crew.filter((member) => member.isFollowing);
      case "Online":
        return crew.filter((member) => member.isOnline);
      default:
        return crew;
    }
  };

  const CrewCard = ({ member, index }) => (
    <Animated.View
      style={[
        styles.crewCard,
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
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>{member.avatar}</Text>
            {member.isOnline && <View style={styles.onlineIndicator} />}
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.name}>{member.name}</Text>
            <Text style={styles.username}>@{member.username}</Text>
            <View style={styles.locationContainer}>
              <Ionicons
                name="location-outline"
                size={14}
                color={colors.textMuted}
              />
              <Text style={styles.location}>{member.location}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.followButton,
            member.isFollowing && styles.followingButton,
          ]}
          onPress={() => handleFollow(member.id)}
        >
          <LinearGradient
            colors={
              member.isFollowing ? colors.purpleGradient : colors.purpleGradient
            }
            style={styles.followButtonGradient}
          >
            <Text style={styles.followButtonText}>
              {member.isFollowing ? "Following" : "Follow"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Cars */}
      <View style={styles.carsContainer}>
        <Text style={styles.carsTitle}>Cars:</Text>
        <View style={styles.carsList}>
          {member.cars.map((car, carIndex) => (
            <View key={carIndex} style={styles.carTag}>
              <Text style={styles.carText}>{car}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{member.followers}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{member.cars.length}</Text>
          <Text style={styles.statLabel}>Cars</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {member.isOnline ? "Online" : "Offline"}
          </Text>
          <Text style={styles.statLabel}>Status</Text>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Crew</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="search" size={24} color={colors.purple} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.activeTab]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
            {selectedTab === tab && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Crew Stats */}
      <View style={styles.statsHeader}>
        <View style={styles.statCard}>
          <Text style={styles.statCardNumber}>{crew.length}</Text>
          <Text style={styles.statCardLabel}>Total Members</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statCardNumber}>
            {crew.filter((member) => member.isOnline).length}
          </Text>
          <Text style={styles.statCardLabel}>Online Now</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statCardNumber}>
            {crew.filter((member) => member.isFollowing).length}
          </Text>
          <Text style={styles.statCardLabel}>Following</Text>
        </View>
      </View>

      {/* Crew List */}
      <ScrollView
        style={styles.crewContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.crewContent}
      >
        {getFilteredCrew().map((member, index) => (
          <CrewCard key={member.id} member={member} index={index} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  headerButton: {
    padding: 4,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    position: "relative",
  },
  activeTab: {
    // Active tab styling
  },
  tabText: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: "500",
  },
  activeTabText: {
    color: colors.purple,
    fontWeight: "600",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: "50%",
    marginLeft: -15,
    width: 30,
    height: 3,
    backgroundColor: colors.purple,
    borderRadius: 2,
  },
  statsHeader: {
    flexDirection: "row",
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
  },
  statCardNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.purple,
  },
  statCardLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  crewContainer: {
    flex: 1,
  },
  crewContent: {
    padding: 16,
  },
  crewCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: "row",
    flex: 1,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    fontSize: 40,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.green,
    borderWidth: 2,
    borderColor: colors.cardBackground,
  },
  userDetails: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  username: {
    fontSize: 14,
    color: colors.purple,
    marginTop: 2,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  location: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 4,
  },
  followButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  followingButton: {
    opacity: 0.7,
  },
  followButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  carsContainer: {
    marginBottom: 16,
  },
  carsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  carsList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  carTag: {
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  carText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.accent,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.accent,
    marginHorizontal: 8,
  },
});
