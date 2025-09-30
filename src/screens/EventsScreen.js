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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";

const { width } = Dimensions.get("window");

// Enhanced mock data for events
const mockEvents = [
  {
    id: "1",
    title: "Tokyo Drift Night Cruise",
    description:
      "Epic night cruise through Tokyo's most iconic streets. All cars welcome!",
    date: "2025-01-15",
    time: "8:00 PM",
    endTime: "11:00 PM",
    location: {
      name: "Shibuya Crossing",
      address: "Shibuya City, Tokyo",
      coordinates: { lat: 35.6598, lng: 139.7006 },
    },
    type: "Cruise",
    category: "night_cruise",
    organizer: {
      name: "Tokyo Car Scene",
      verified: true,
      avatar: "🏁",
    },
    attendees: 247,
    maxAttendees: 500,
    price: "Free",
    requirements: ["Valid License", "Car Insurance"],
    tags: ["#Tokyo", "#Drift", "#NightCruise", "#JDM"],
    isJoined: false,
    isInterested: false,
    media: [
      { type: "image", url: "event_media_1" },
      { type: "video", url: "event_media_2" },
    ],
    meetupPoints: [
      { name: "Main Meet", time: "7:30 PM", location: "Shibuya Crossing" },
      { name: "Secondary Meet", time: "8:00 PM", location: "Harajuku Bridge" },
    ],
    distance: "2.3 km",
    featured: true,
  },
  {
    id: "2",
    title: "Fuji Speedway Track Day",
    description:
      "Professional track day at Fuji Speedway. Open to all skill levels with instructors available.",
    date: "2025-01-20",
    time: "9:00 AM",
    endTime: "5:00 PM",
    location: {
      name: "Fuji Speedway",
      address: "Oyama, Shizuoka",
      coordinates: { lat: 35.3706, lng: 138.9266 },
    },
    type: "Track Day",
    category: "track_day",
    organizer: {
      name: "Fuji Speedway Official",
      verified: true,
      avatar: "🏎️",
    },
    attendees: 156,
    maxAttendees: 200,
    price: "$150",
    requirements: ["Track License", "Helmet", "Tech Inspection"],
    tags: ["#TrackDay", "#FujiSpeedway", "#Racing", "#Professional"],
    isJoined: true,
    isInterested: true,
    media: [{ type: "image", url: "track_media_1" }],
    meetupPoints: [
      { name: "Registration", time: "8:00 AM", location: "Main Gate" },
      { name: "Tech Inspection", time: "8:30 AM", location: "Pit Lane" },
    ],
    distance: "45.2 km",
    featured: false,
  },
  {
    id: "3",
    title: "Harajuku Car Show & Meet",
    description:
      "Show off your build at the biggest car show in Tokyo. Prizes for best in show!",
    date: "2025-01-25",
    time: "2:00 PM",
    endTime: "8:00 PM",
    location: {
      name: "Harajuku District",
      address: "Shibuya City, Tokyo",
      coordinates: { lat: 35.6702, lng: 139.7026 },
    },
    type: "Car Show",
    category: "car_show",
    organizer: {
      name: "Tokyo Car Culture",
      verified: true,
      avatar: "🚗",
    },
    attendees: 89,
    maxAttendees: 150,
    price: "$25",
    requirements: ["Show Car", "Registration"],
    tags: ["#CarShow", "#Harajuku", "#ShowCar", "#Prizes"],
    isJoined: false,
    isInterested: true,
    media: [
      { type: "image", url: "show_media_1" },
      { type: "video", url: "show_media_2" },
    ],
    meetupPoints: [
      { name: "Check-in", time: "1:30 PM", location: "Event Entrance" },
    ],
    distance: "1.8 km",
    featured: false,
  },
  {
    id: "4",
    title: "Underground Racing League",
    description:
      "Midnight racing event at the underground circuit. Not for the faint of heart!",
    date: "2025-01-30",
    time: "11:00 PM",
    endTime: "3:00 AM",
    location: {
      name: "Underground Circuit",
      address: "Confidential Location",
      coordinates: { lat: 35.6762, lng: 139.6503 },
    },
    type: "Racing",
    category: "racing",
    organizer: {
      name: "Underground Racing",
      verified: false,
      avatar: "🏁",
    },
    attendees: 312,
    maxAttendees: 400,
    price: "$75",
    requirements: ["Fast Car", "Experience", "Safety Gear"],
    tags: ["#Underground", "#Racing", "#Midnight", "#Extreme"],
    isJoined: true,
    isInterested: true,
    media: [{ type: "video", url: "racing_media_1" }],
    meetupPoints: [
      { name: "Secret Meet", time: "10:30 PM", location: "TBA via DM" },
    ],
    distance: "12.5 km",
    featured: true,
  },
];

const mockFollowingEvents = mockEvents.filter((event) => event.isInterested);

export default function EventsScreen() {
  const [events, setEvents] = useState(mockEvents);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [refreshing, setRefreshing] = useState(false);
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const filters = ["All", "Following", "Nearby", "Today", "This Week"];
  const categories = [
    "All",
    "Cruise",
    "Track Day",
    "Car Show",
    "Racing",
    "Garage Day",
  ];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleJoinEvent = (eventId) => {
    setEvents(
      events.map((event) => {
        if (event.id === eventId) {
          return {
            ...event,
            isJoined: !event.isJoined,
            attendees: event.isJoined
              ? event.attendees - 1
              : event.attendees + 1,
          };
        }
        return event;
      })
    );
  };

  const handleInterestEvent = (eventId) => {
    setEvents(
      events.map((event) => {
        if (event.id === eventId) {
          return {
            ...event,
            isInterested: !event.isInterested,
          };
        }
        return event;
      })
    );
  };

  const getFilteredEvents = () => {
    let filtered = events;

    // Apply filter
    switch (selectedFilter) {
      case "Following":
        filtered = filtered.filter((event) => event.isInterested);
        break;
      case "Nearby":
        filtered = filtered.filter((event) => parseFloat(event.distance) < 10);
        break;
      case "Today":
        // Filter for today's events (mock implementation)
        break;
      case "This Week":
        // Filter for this week's events (mock implementation)
        break;
      default:
        break;
    }

    // Apply category filter
    if (selectedCategory !== "All") {
      filtered = filtered.filter((event) => event.type === selectedCategory);
    }

    return filtered;
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case "Cruise":
        return colors.cyan;
      case "Track Day":
        return colors.red;
      case "Car Show":
        return colors.purple;
      case "Racing":
        return colors.warning;
      default:
        return colors.textMuted;
    }
  };

  const EventCard = ({ item, index }) => (
    <Animated.View
      style={[
        styles.eventCard,
        item.featured && styles.featuredCard,
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
      {/* Featured Badge */}
      {item.featured && (
        <View style={styles.featuredBadge}>
          <LinearGradient
            colors={colors.redGradient}
            style={styles.featuredBadgeGradient}
          >
            <Text style={styles.featuredBadgeText}>FEATURED</Text>
          </LinearGradient>
        </View>
      )}

      {/* Event Header */}
      <View style={styles.eventHeader}>
        <View style={styles.eventTypeContainer}>
          <View
            style={[
              styles.eventTypeBadge,
              { backgroundColor: getEventTypeColor(item.type) },
            ]}
          >
            <Text style={styles.eventTypeText}>{item.type}</Text>
          </View>
          <Text style={styles.distanceText}>{item.distance}</Text>
        </View>
        <View style={styles.eventActions}>
          <TouchableOpacity
            style={styles.interestButton}
            onPress={() => handleInterestEvent(item.id)}
          >
            <Ionicons
              name={item.isInterested ? "heart" : "heart-outline"}
              size={20}
              color={item.isInterested ? colors.red : colors.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="share-outline" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Event Title & Description */}
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventDescription}>{item.description}</Text>

      {/* Event Image */}
      <View style={styles.eventImageContainer}>
        <LinearGradient
          colors={colors.purpleGradient}
          style={styles.eventImage}
        >
          <Ionicons name="car-sport" size={40} color={colors.textPrimary} />
          <Text style={styles.eventImageText}>Event Media</Text>
        </LinearGradient>
        <View style={styles.mediaCount}>
          <Ionicons name="images" size={16} color={colors.textPrimary} />
          <Text style={styles.mediaCountText}>{item.media.length}</Text>
        </View>
      </View>

      {/* Event Details */}
      <View style={styles.eventDetails}>
        <View style={styles.detailRow}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={colors.textMuted}
          />
          <Text style={styles.detailText}>
            {item.date} • {item.time}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons
            name="location-outline"
            size={16}
            color={colors.textMuted}
          />
          <Text style={styles.detailText}>{item.location.name}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="people-outline" size={16} color={colors.textMuted} />
          <Text style={styles.detailText}>
            {item.attendees}/{item.maxAttendees} attending
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={16} color={colors.textMuted} />
          <Text style={styles.detailText}>{item.price}</Text>
        </View>
      </View>

      {/* Tags */}
      <View style={styles.tagsContainer}>
        {item.tags.slice(0, 3).map((tag, tagIndex) => (
          <View key={tagIndex} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      {/* Meetup Points */}
      {item.meetupPoints.length > 0 && (
        <View style={styles.meetupContainer}>
          <Text style={styles.meetupTitle}>Meetup Points:</Text>
          {item.meetupPoints.map((point, pointIndex) => (
            <View key={pointIndex} style={styles.meetupPoint}>
              <View style={styles.meetupDot} />
              <View style={styles.meetupDetails}>
                <Text style={styles.meetupName}>{point.name}</Text>
                <Text style={styles.meetupInfo}>
                  {point.time} • {point.location}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.eventActionsContainer}>
        <TouchableOpacity
          style={[styles.joinButton, item.isJoined && styles.joinedButton]}
          onPress={() => handleJoinEvent(item.id)}
        >
          <LinearGradient
            colors={item.isJoined ? colors.purpleGradient : colors.redGradient}
            style={styles.joinButtonGradient}
          >
            <Text style={styles.joinButtonText}>
              {item.isJoined ? "Joined" : "Join Event"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton}>
          <Ionicons name="calendar-outline" size={18} color={colors.purple} />
          <Text style={styles.secondaryButtonText}>Add to Calendar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton}>
          <Ionicons name="navigate-outline" size={18} color={colors.purple} />
          <Text style={styles.secondaryButtonText}>Directions</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowLocationFilter(!showLocationFilter)}
          >
            <Ionicons name="location-outline" size={24} color={colors.purple} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="add-circle" size={24} color={colors.red} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Location Filter */}
      {showLocationFilter && (
        <View style={styles.locationFilterContainer}>
          <Text style={styles.locationFilterTitle}>Filter by Location</Text>
          <View style={styles.radiusSelector}>
            <Text style={styles.radiusLabel}>Radius: 10 km</Text>
            <TouchableOpacity style={styles.radiusButton}>
              <Ionicons
                name="chevron-down"
                size={16}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter && styles.activeFilterButton,
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter && styles.activeFilterText,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.activeCategoryButton,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.activeCategoryText,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Events List */}
      <FlatList
        data={getFilteredEvents()}
        renderItem={({ item, index }) => (
          <EventCard item={item} index={index} />
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
        contentContainerStyle={styles.eventsContent}
      />

      {/* Create Event FAB */}
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
  locationFilterContainer: {
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
  },
  locationFilterTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  radiusSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  radiusLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  radiusButton: {
    padding: 4,
  },
  filterContainer: {
    backgroundColor: colors.cardBackground,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
  },
  filterContent: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: colors.inputBackground,
  },
  activeFilterButton: {
    backgroundColor: colors.purple,
  },
  filterText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: "500",
  },
  activeFilterText: {
    color: colors.textPrimary,
  },
  categoryContainer: {
    backgroundColor: colors.cardBackground,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
  },
  categoryContent: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: colors.inputBackground,
  },
  activeCategoryButton: {
    backgroundColor: colors.red,
  },
  categoryText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "500",
  },
  activeCategoryText: {
    color: colors.textPrimary,
  },
  eventsContent: {
    padding: 16,
  },
  eventCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuredCard: {
    borderWidth: 2,
    borderColor: colors.red,
  },
  featuredBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  featuredBadgeGradient: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    paddingBottom: 0,
  },
  eventTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  eventTypeText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  distanceText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  eventActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  interestButton: {
    padding: 4,
    marginRight: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  eventImageContainer: {
    position: "relative",
    marginHorizontal: 16,
    marginBottom: 16,
  },
  eventImage: {
    height: 150,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  eventImageText: {
    color: colors.textPrimary,
    marginTop: 8,
    fontSize: 14,
  },
  mediaCount: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mediaCountText: {
    color: colors.textPrimary,
    fontSize: 12,
    marginLeft: 4,
  },
  eventDetails: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: colors.purple,
    fontWeight: "500",
  },
  meetupContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  meetupTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  meetupPoint: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  meetupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.purple,
    marginRight: 12,
  },
  meetupDetails: {
    flex: 1,
  },
  meetupName: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  meetupInfo: {
    fontSize: 12,
    color: colors.textMuted,
  },
  eventActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.accent,
  },
  joinButton: {
    flex: 1,
    marginRight: 12,
    borderRadius: 20,
    overflow: "hidden",
  },
  joinedButton: {
    opacity: 0.7,
  },
  joinButtonGradient: {
    paddingVertical: 12,
    alignItems: "center",
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    fontSize: 12,
    color: colors.purple,
    marginLeft: 4,
    fontWeight: "500",
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
