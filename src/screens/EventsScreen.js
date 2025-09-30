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

// Mock data for events
const mockEvents = [
  {
    id: "1",
    title: "Tokyo Drift Night",
    date: "2025-01-15",
    time: "8:00 PM",
    location: "Tokyo Streets",
    type: "Night Cruise",
    attendees: 247,
    image: "event_1",
    isJoined: false,
  },
  {
    id: "2",
    title: "Track Day Championship",
    date: "2025-01-20",
    time: "9:00 AM",
    location: "Fuji Speedway",
    type: "Track Event",
    attendees: 156,
    image: "event_2",
    isJoined: true,
  },
  {
    id: "3",
    title: "Car Show & Meet",
    date: "2025-01-25",
    time: "2:00 PM",
    location: "Harajuku District",
    type: "Car Show",
    attendees: 89,
    image: "event_3",
    isJoined: false,
  },
  {
    id: "4",
    title: "Midnight Racing League",
    date: "2025-01-30",
    time: "11:00 PM",
    location: "Underground Circuit",
    type: "Racing",
    attendees: 312,
    image: "event_4",
    isJoined: true,
  },
];

export default function EventsScreen() {
  const [events, setEvents] = useState(mockEvents);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const filters = ["All", "Track Event", "Night Cruise", "Car Show", "Racing"];

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

  const filteredEvents =
    selectedFilter === "All"
      ? events
      : events.filter((event) => event.type === selectedFilter);

  const EventCard = ({ event, index }) => (
    <Animated.View
      style={[
        styles.eventCard,
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
      {/* Event Image */}
      <View style={styles.eventImageContainer}>
        <LinearGradient
          colors={colors.purpleGradient}
          style={styles.eventImage}
        >
          <Ionicons name="car-sport" size={40} color={colors.textPrimary} />
        </LinearGradient>
        <View style={styles.eventTypeBadge}>
          <Text style={styles.eventTypeText}>{event.type}</Text>
        </View>
      </View>

      {/* Event Info */}
      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle}>{event.title}</Text>

        <View style={styles.eventDetails}>
          <View style={styles.detailItem}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={colors.textMuted}
            />
            <Text style={styles.detailText}>{event.date}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color={colors.textMuted} />
            <Text style={styles.detailText}>{event.time}</Text>
          </View>
        </View>

        <View style={styles.locationContainer}>
          <Ionicons
            name="location-outline"
            size={16}
            color={colors.textMuted}
          />
          <Text style={styles.locationText}>{event.location}</Text>
        </View>

        <View style={styles.eventFooter}>
          <View style={styles.attendeesContainer}>
            <Ionicons
              name="people-outline"
              size={16}
              color={colors.textMuted}
            />
            <Text style={styles.attendeesText}>
              {event.attendees} attending
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.joinButton, event.isJoined && styles.joinedButton]}
            onPress={() => handleJoinEvent(event.id)}
          >
            <LinearGradient
              colors={
                event.isJoined ? colors.purpleGradient : colors.purpleGradient
              }
              style={styles.joinButtonGradient}
            >
              <Text style={styles.joinButtonText}>
                {event.isJoined ? "Joined" : "Join"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="add-circle" size={28} color={colors.purple} />
        </TouchableOpacity>
      </View>

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

      {/* Events List */}
      <ScrollView
        style={styles.eventsContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.eventsContent}
      >
        {filteredEvents.map((event, index) => (
          <EventCard key={event.id} event={event} index={index} />
        ))}
      </ScrollView>

      {/* Create Event FAB */}
      <TouchableOpacity style={styles.fab}>
        <LinearGradient
          colors={colors.purpleGradient}
          style={styles.fabGradient}
        >
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
  headerButton: {
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
  eventsContainer: {
    flex: 1,
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
  eventImageContainer: {
    position: "relative",
  },
  eventImage: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },
  eventTypeBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: colors.purple,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventTypeText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  eventInfo: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  eventDetails: {
    flexDirection: "row",
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  eventFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  attendeesContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  attendeesText: {
    fontSize: 14,
    color: colors.textMuted,
    marginLeft: 4,
  },
  joinButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  joinedButton: {
    opacity: 0.7,
  },
  joinButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
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
