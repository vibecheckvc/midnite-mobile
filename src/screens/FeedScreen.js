import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";

const { width } = Dimensions.get("window");

// Mock data for feed posts
const mockPosts = [
  {
    id: "1",
    user: "SpeedDemon_99",
    avatar: "🏎️",
    time: "2h ago",
    content: "Just finished my RX-7 build! What do you think? 🔥",
    image: null,
    likes: 247,
    comments: 23,
    isLiked: false,
  },
  {
    id: "2",
    user: "Tokyo_Drifter",
    avatar: "🚗",
    time: "4h ago",
    content:
      "Epic night cruise through the city! The neon lights were perfect for this shot.",
    image: "car_image_1",
    likes: 189,
    comments: 15,
    isLiked: true,
  },
  {
    id: "3",
    user: "GTR_Legend",
    avatar: "🏁",
    time: "6h ago",
    content: "Track day was insane today! New personal best lap time 🏆",
    image: null,
    likes: 312,
    comments: 45,
    isLiked: false,
  },
];

export default function FeedScreen() {
  const [posts, setPosts] = useState(mockPosts);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLike = (postId) => {
    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          };
        }
        return post;
      })
    );
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const PostCard = ({ post, index }) => (
    <Animated.View
      style={[
        styles.postCard,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        },
      ]}
    >
      {/* Header */}
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.avatar}>{post.avatar}</Text>
          <View>
            <Text style={styles.username}>{post.user}</Text>
            <Text style={styles.timestamp}>{post.time}</Text>
          </View>
        </View>
        <TouchableOpacity>
          <Ionicons
            name="ellipsis-horizontal"
            size={20}
            color={colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Text style={styles.postContent}>{post.content}</Text>

      {/* Image placeholder */}
      {post.image && (
        <View style={styles.imageContainer}>
          <LinearGradient
            colors={colors.purpleGradient}
            style={styles.imagePlaceholder}
          >
            <Ionicons name="car-sport" size={40} color={colors.textPrimary} />
            <Text style={styles.imageText}>Car Image</Text>
          </LinearGradient>
        </View>
      )}

      {/* Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLike(post.id)}
        >
          <Ionicons
            name={post.isLiked ? "heart" : "heart-outline"}
            size={20}
            color={post.isLiked ? colors.red : colors.textMuted}
          />
          <Text
            style={[styles.actionText, post.isLiked && { color: colors.red }]}
          >
            {post.likes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={colors.textMuted}
          />
          <Text style={styles.actionText}>{post.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="add-circle" size={28} color={colors.purple} />
        </TouchableOpacity>
      </View>

      {/* Stories/Highlights */}
      <View style={styles.storiesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesContent}
        >
          <TouchableOpacity style={styles.addStory}>
            <LinearGradient
              colors={colors.purpleGradient}
              style={styles.addStoryGradient}
            >
              <Ionicons name="add" size={24} color={colors.textPrimary} />
            </LinearGradient>
            <Text style={styles.addStoryText}>Your Story</Text>
          </TouchableOpacity>

          {["🏎️", "🚗", "🏁", "🚙", "🏎️"].map((emoji, index) => (
            <TouchableOpacity key={index} style={styles.storyItem}>
              <LinearGradient
                colors={colors.purpleGradient}
                style={styles.storyBorder}
              >
                <View style={styles.storyAvatar}>
                  <Text style={styles.storyEmoji}>{emoji}</Text>
                </View>
              </LinearGradient>
              <Text style={styles.storyText}>User{index + 1}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Posts */}
      <ScrollView
        style={styles.postsContainer}
        showsVerticalScrollIndicator={false}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      >
        {posts.map((post, index) => (
          <PostCard key={post.id} post={post} index={index} />
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
  storiesContainer: {
    backgroundColor: colors.cardBackground,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
  },
  storiesContent: {
    paddingHorizontal: 16,
  },
  addStory: {
    alignItems: "center",
    marginRight: 16,
  },
  addStoryGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  addStoryText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  storyItem: {
    alignItems: "center",
    marginRight: 16,
  },
  storyBorder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2,
    marginBottom: 6,
  },
  storyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.inputBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  storyEmoji: {
    fontSize: 24,
  },
  storyText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  postsContainer: {
    flex: 1,
  },
  postCard: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    fontSize: 32,
    marginRight: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textMuted,
  },
  postContent: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  imageContainer: {
    marginBottom: 12,
  },
  imagePlaceholder: {
    height: 200,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  imageText: {
    color: colors.textPrimary,
    marginTop: 8,
    fontSize: 14,
  },
  postActions: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.accent,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 24,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: colors.textMuted,
  },
});
