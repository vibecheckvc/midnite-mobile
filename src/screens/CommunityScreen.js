import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  FlatList,
  RefreshControl,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";

const { width } = Dimensions.get("window");

// Enhanced mock data for community features
const mockGroups = [
  {
    id: "1",
    name: "Tokyo JDM Nights",
    description:
      "The ultimate JDM community in Tokyo. Weekly meets, builds, and track days.",
    members: 2847,
    posts: 156,
    type: "location",
    category: "JDM",
    avatar: "🏎️",
    verified: true,
    isJoined: true,
    recentActivity: "New build post by @SpeedDemon_99",
    lastActive: "2h ago",
  },
  {
    id: "2",
    name: "RX-7 Enthusiasts",
    description:
      "Dedicated to the legendary Mazda RX-7. Share builds, tips, and track times.",
    members: 1892,
    posts: 89,
    type: "car_model",
    category: "Mazda",
    avatar: "🚗",
    verified: true,
    isJoined: false,
    recentActivity: "Track day results posted",
    lastActive: "4h ago",
  },
  {
    id: "3",
    name: "Track Day Legends",
    description:
      "For serious track enthusiasts. Share lap times, setups, and racing tips.",
    members: 1245,
    posts: 67,
    type: "interest",
    category: "Racing",
    avatar: "🏁",
    verified: true,
    isJoined: true,
    recentActivity: "New lap record at Fuji Speedway",
    lastActive: "6h ago",
  },
];

const mockFriends = [
  {
    id: "1",
    name: "Alex Chen",
    username: "SpeedDemon_99",
    avatar: "🏎️",
    location: "Tokyo, Japan",
    cars: ["RX-7 FD", "Supra MK4"],
    followers: 1247,
    isFollowing: true,
    isOnline: true,
    lastSeen: "Online now",
    mutualFriends: 23,
    recentActivity: "Posted a build update",
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
    lastSeen: "2h ago",
    mutualFriends: 15,
    recentActivity: "Joined Tokyo JDM Nights",
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
    lastSeen: "Online now",
    mutualFriends: 8,
    recentActivity: "New track record",
  },
];

const mockForums = [
  {
    id: "1",
    title: "Build Advice & Tips",
    description: "Get help with your builds from experienced enthusiasts",
    posts: 1247,
    members: 8923,
    lastPost: {
      title: "Best turbo setup for RB26?",
      author: "DriftKing_99",
      time: "1h ago",
    },
    category: "Technical",
    isPinned: true,
  },
  {
    id: "2",
    title: "Classifieds & Marketplace",
    description: "Buy, sell, and trade car parts and vehicles",
    posts: 892,
    members: 4567,
    lastPost: {
      title: "FS: BNIB Greddy turbo kit",
      author: "PartsDealer",
      time: "3h ago",
    },
    category: "Marketplace",
    isPinned: false,
  },
  {
    id: "3",
    title: "Track Day Discussions",
    description: "Share track experiences, lap times, and racing tips",
    posts: 634,
    members: 2345,
    lastPost: {
      title: "Fuji Speedway lap record broken!",
      author: "TrackMaster",
      time: "5h ago",
    },
    category: "Racing",
    isPinned: false,
  },
];

export default function CommunityScreen() {
  const [selectedTab, setSelectedTab] = useState("Groups");
  const [groups, setGroups] = useState(mockGroups);
  const [friends, setFriends] = useState(mockFriends);
  const [forums, setForums] = useState(mockForums);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const tabs = ["Groups", "Friends", "Forums", "Chats"];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleJoinGroup = (groupId) => {
    setGroups(
      groups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            isJoined: !group.isJoined,
            members: group.isJoined ? group.members - 1 : group.members + 1,
          };
        }
        return group;
      })
    );
  };

  const handleFollowFriend = (friendId) => {
    setFriends(
      friends.map((friend) => {
        if (friend.id === friendId) {
          return {
            ...friend,
            isFollowing: !friend.isFollowing,
            followers: friend.isFollowing
              ? friend.followers - 1
              : friend.followers + 1,
          };
        }
        return friend;
      })
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const GroupCard = ({ item, index }) => (
    <Animated.View
      style={[
        styles.groupCard,
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
      <View style={styles.groupHeader}>
        <View style={styles.groupInfo}>
          <Text style={styles.groupAvatar}>{item.avatar}</Text>
          <View style={styles.groupDetails}>
            <View style={styles.groupTitleContainer}>
              <Text style={styles.groupName}>{item.name}</Text>
              {item.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons
                    name="checkmark"
                    size={12}
                    color={colors.textPrimary}
                  />
                </View>
              )}
            </View>
            <Text style={styles.groupDescription}>{item.description}</Text>
            <Text style={styles.groupStats}>
              {item.members.toLocaleString()} members • {item.posts} posts
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.joinButton, item.isJoined && styles.joinedButton]}
          onPress={() => handleJoinGroup(item.id)}
        >
          <LinearGradient
            colors={item.isJoined ? colors.purpleGradient : colors.redGradient}
            style={styles.joinButtonGradient}
          >
            <Text style={styles.joinButtonText}>
              {item.isJoined ? "Joined" : "Join"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.groupFooter}>
        <View style={styles.groupCategory}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        <View style={styles.groupActivity}>
          <Text style={styles.activityText}>{item.recentActivity}</Text>
          <Text style={styles.activityTime}>{item.lastActive}</Text>
        </View>
      </View>
    </Animated.View>
  );

  const FriendCard = ({ item, index }) => (
    <Animated.View
      style={[
        styles.friendCard,
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
      <View style={styles.friendHeader}>
        <View style={styles.friendInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.friendAvatar}>{item.avatar}</Text>
            {item.isOnline && <View style={styles.onlineIndicator} />}
          </View>
          <View style={styles.friendDetails}>
            <Text style={styles.friendName}>{item.name}</Text>
            <Text style={styles.friendUsername}>@{item.username}</Text>
            <Text style={styles.friendLocation}>{item.location}</Text>
            <Text style={styles.friendActivity}>{item.recentActivity}</Text>
          </View>
        </View>
        <View style={styles.friendActions}>
          <TouchableOpacity
            style={[
              styles.followButton,
              item.isFollowing && styles.followingButton,
            ]}
            onPress={() => handleFollowFriend(item.id)}
          >
            <LinearGradient
              colors={
                item.isFollowing ? colors.purpleGradient : colors.redGradient
              }
              style={styles.followButtonGradient}
            >
              <Text style={styles.followButtonText}>
                {item.isFollowing ? "Following" : "Follow"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chatButton}>
            <Ionicons
              name="chatbubble-outline"
              size={20}
              color={colors.purple}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.friendStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{item.followers}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{item.cars.length}</Text>
          <Text style={styles.statLabel}>Cars</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{item.mutualFriends}</Text>
          <Text style={styles.statLabel}>Mutual</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {item.isOnline ? "Online" : item.lastSeen}
          </Text>
          <Text style={styles.statLabel}>Status</Text>
        </View>
      </View>
    </Animated.View>
  );

  const ForumCard = ({ item, index }) => (
    <Animated.View
      style={[
        styles.forumCard,
        item.isPinned && styles.pinnedCard,
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
      <View style={styles.forumHeader}>
        <View style={styles.forumInfo}>
          <Text style={styles.forumTitle}>{item.title}</Text>
          <Text style={styles.forumDescription}>{item.description}</Text>
        </View>
        {item.isPinned && (
          <View style={styles.pinnedBadge}>
            <Ionicons name="pin" size={16} color={colors.textPrimary} />
          </View>
        )}
      </View>

      <View style={styles.forumStats}>
        <View style={styles.forumStat}>
          <Text style={styles.forumStatNumber}>{item.posts}</Text>
          <Text style={styles.forumStatLabel}>Posts</Text>
        </View>
        <View style={styles.forumStat}>
          <Text style={styles.forumStatNumber}>{item.members}</Text>
          <Text style={styles.forumStatLabel}>Members</Text>
        </View>
        <View style={styles.forumStat}>
          <Text style={styles.forumStatNumber}>{item.category}</Text>
          <Text style={styles.forumStatLabel}>Category</Text>
        </View>
      </View>

      <View style={styles.lastPostContainer}>
        <Text style={styles.lastPostTitle}>
          Last Post: {item.lastPost.title}
        </Text>
        <Text style={styles.lastPostAuthor}>
          by {item.lastPost.author} • {item.lastPost.time}
        </Text>
      </View>
    </Animated.View>
  );

  const renderContent = () => {
    switch (selectedTab) {
      case "Groups":
        return (
          <FlatList
            data={groups}
            renderItem={({ item, index }) => (
              <GroupCard item={item} index={index} />
            )}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.purple}
              />
            }
            contentContainerStyle={styles.contentContainer}
          />
        );
      case "Friends":
        return (
          <FlatList
            data={friends}
            renderItem={({ item, index }) => (
              <FriendCard item={item} index={index} />
            )}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.purple}
              />
            }
            contentContainerStyle={styles.contentContainer}
          />
        );
      case "Forums":
        return (
          <FlatList
            data={forums}
            renderItem={({ item, index }) => (
              <ForumCard item={item} index={index} />
            )}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.purple}
              />
            }
            contentContainerStyle={styles.contentContainer}
          />
        );
      case "Chats":
        return (
          <View style={styles.chatsContainer}>
            <Text style={styles.comingSoonText}>
              Chat functionality coming soon!
            </Text>
            <Text style={styles.comingSoonSubtext}>
              Direct messaging and group chats will be available in the next
              update.
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="search" size={24} color={colors.purple} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="add-circle" size={24} color={colors.red} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${selectedTab.toLowerCase()}...`}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>
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

      {/* Content */}
      {renderContent()}

      {/* Create FAB */}
      <TouchableOpacity style={styles.fab}>
        <LinearGradient colors={colors.redGradient} style={styles.fabGradient}>
          <Ionicons name="add" size={24} color={colors.textPrimary} />
        </LinearGradient>
      </TouchableOpacity>
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
  headerActions: {
    flexDirection: "row",
  },
  headerButton: {
    padding: 4,
    marginLeft: 12,
  },
  searchContainer: {
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.textPrimary,
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
  contentContainer: {
    padding: 16,
  },
  groupCard: {
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
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  groupInfo: {
    flexDirection: "row",
    flex: 1,
  },
  groupAvatar: {
    fontSize: 40,
    marginRight: 12,
  },
  groupDetails: {
    flex: 1,
  },
  groupTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.purple,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  groupDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  groupStats: {
    fontSize: 12,
    color: colors.textMuted,
  },
  joinButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  joinedButton: {
    opacity: 0.7,
  },
  joinButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  joinButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  groupFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  groupCategory: {
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: colors.purple,
    fontWeight: "500",
  },
  groupActivity: {
    flex: 1,
    alignItems: "flex-end",
  },
  activityText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  activityTime: {
    fontSize: 10,
    color: colors.textMuted,
  },
  friendCard: {
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
  friendHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  friendInfo: {
    flexDirection: "row",
    flex: 1,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  friendAvatar: {
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
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  friendUsername: {
    fontSize: 14,
    color: colors.purple,
    marginBottom: 4,
  },
  friendLocation: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  friendActivity: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  friendActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  followButton: {
    borderRadius: 20,
    overflow: "hidden",
    marginRight: 8,
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
  chatButton: {
    padding: 8,
  },
  friendStats: {
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
  forumCard: {
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
  pinnedCard: {
    borderWidth: 2,
    borderColor: colors.purple,
  },
  forumHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  forumInfo: {
    flex: 1,
  },
  forumTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  forumDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  pinnedBadge: {
    padding: 4,
  },
  forumStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.accent,
  },
  forumStat: {
    alignItems: "center",
  },
  forumStatNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.purple,
  },
  forumStatLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  lastPostContainer: {
    paddingTop: 12,
  },
  lastPostTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  lastPostAuthor: {
    fontSize: 12,
    color: colors.textMuted,
  },
  chatsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  comingSoonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 12,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
});
