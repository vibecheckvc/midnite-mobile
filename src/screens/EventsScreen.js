import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  FlatList,
  RefreshControl,
  Alert,
  Share,
  Modal,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";
import { eventsService } from "../services/eventsService";
import { useAuth } from "../contexts/AuthContext";
import CreateEventModal from "./CreateEventModal";

const { width } = Dimensions.get("window");

export default function EventsScreen() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("Upcoming");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { user } = useAuth();

  const filters = ["Upcoming", "My Events", "Past"];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    loadEvents();
  }, []);

  useEffect(() => {
    // Update filtered events when events or filter changes
    updateFilteredEvents();
  }, [events, selectedFilter, user]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await eventsService.getEvents();

      if (error) {
        Alert.alert("Error", "Failed to load events");
        return;
      }

      setEvents(data || []);
    } catch (error) {
      console.error("Error loading events:", error);
      Alert.alert("Error", "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    Alert.alert("Delete Event", "Are you sure you want to delete this event?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await eventsService.deleteEvent(eventId);
            if (error) {
              Alert.alert("Error", "Failed to delete event");
              return;
            }
            setEvents(events.filter((event) => event.id !== eventId));
          } catch (error) {
            console.error("Error deleting event:", error);
            Alert.alert("Error", "Failed to delete event");
          }
        },
      },
    ]);
  };

  const updateFilteredEvents = async () => {
    try {
      let filtered = events;
      const now = new Date();

      switch (selectedFilter) {
        case "Upcoming":
          filtered = events.filter((e) => new Date(e.date) >= now);
          break;
        case "Past":
          filtered = events.filter((e) => new Date(e.date) < now);
          break;
        case "My Events":
          if (user) {
            filtered = events.filter((e) => e.user_id === user.id);
          } else {
            filtered = [];
          }
          break;
        default:
          filtered = events;
          break;
      }

      setFilteredEvents(filtered);
    } catch (error) {
      console.error("Error filtering events:", error);
      setFilteredEvents(events);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTimeAgo = (dateInput) => {
    const d = new Date(dateInput);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    const m = Math.floor(diff / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString();
  };

  const isEventOwner = (eventUserId) => {
    return user && eventUserId === user.id;
  };

  const handleEventCreated = (newEvent) => {
    console.log("New event created:", newEvent);
    console.log("Event image_url:", newEvent.image_url);
    setEvents([newEvent, ...events]);
    setShowCreateModal(false);
  };

  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const handleShareEvent = async (event) => {
    try {
      const shareMessage = `Check out this event: ${
        event.title
      }\n\nDate: ${formatDate(event.date)}\n${
        event.location ? `Location: ${event.location}\n` : ""
      }${
        event.description ? `Description: ${event.description}\n` : ""
      }\nShared from Midnite Auto`;

      await Share.share({
        message: shareMessage,
        title: event.title,
      });
    } catch (error) {
      console.error("Error sharing event:", error);
      Alert.alert("Error", "Failed to share event");
    }
  };

  const EventCard = ({ item, index }) => (
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
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => handleViewDetails(item)}
      >
        <View style={styles.eventImageContainer}>
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={styles.eventImage}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={colors.purpleGradient}
              style={styles.eventImage}
            >
              <Ionicons name="calendar" size={40} color={colors.textPrimary} />
            </LinearGradient>
          )}
          {/* Date Pill */}
          <View style={styles.datePill}>
            <Text style={styles.datePillMonth}>
              {new Date(item.date).toLocaleDateString(undefined, { month: "short" }).toUpperCase()}
            </Text>
            <Text style={styles.datePillDay}>
              {new Date(item.date).getDate()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Event Content */}
      <View style={styles.eventContent}>
        {/* Header Row */}
        <View style={styles.eventHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eventTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>{formatTime(item.date)}</Text>
              <View style={styles.dot} />
              <Text style={styles.metaText}>{formatTimeAgo(item.created_at)}</Text>
            </View>
          </View>
          {isEventOwner(item.user_id) && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteEvent(item.id)}
            >
              <Ionicons name="trash-outline" size={18} color={colors.red} />
            </TouchableOpacity>
          )}
        </View>

        {/* Location */}
        {item.location && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={colors.purple} />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
        )}

        {/* Description Preview */}
        {item.description && (
          <Text style={styles.eventDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {/* Action Bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleViewDetails(item)}
          >
            <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
            <Text style={styles.actionText}>Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleShareEvent(item)}
          >
            <Ionicons name="share-outline" size={18} color={colors.textMuted} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  const Header = () => (
    <View style={styles.topBar}>
      <View style={styles.segmented}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            onPress={() => setSelectedFilter(filter)}
            style={[styles.segButton, selectedFilter === filter && styles.segActive]}
            activeOpacity={0.85}
          >
            <Text style={[styles.segText, selectedFilter === filter && styles.segTextActive]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Events List with sticky header */}
      <FlatList
        data={filteredEvents}
        ListHeaderComponent={Header}
        stickyHeaderIndices={[0]}
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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="calendar-outline"
              size={64}
              color={colors.textMuted}
            />
            <Text style={styles.emptyText}>No events found</Text>
            <Text style={styles.emptySubtext}>
              {loading
                ? "Loading events..."
                : selectedFilter === "My Events"
                ? "You haven't created any events yet!"
                : "Create your first event to get started!"}
            </Text>
          </View>
        }
        removeClippedSubviews={true}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={7}
        updateCellsBatchingPeriod={50}
      />

      {/* Create Event FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
      >
        <LinearGradient colors={colors.redGradient} style={styles.fabGradient}>
          <Ionicons name="add" size={24} color={colors.textPrimary} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Create Event Modal */}
      <CreateEventModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onEventCreated={handleEventCreated}
      />

      {/* Event Details Modal */}
      <Modal
        visible={showEventDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEventDetails(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowEventDetails(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Event Details</Text>
            <View style={styles.placeholder} />
          </View>

          {selectedEvent && (
            <View style={styles.modalContent}>
              {/* Event Image */}
              <View style={styles.modalImageContainer}>
                {selectedEvent.image_url ? (
                  <Image
                    source={{ uri: selectedEvent.image_url }}
                    style={styles.modalImage}
                    resizeMode="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={colors.purpleGradient}
                    style={styles.modalImage}
                  >
                    <Ionicons
                      name="calendar"
                      size={60}
                      color={colors.textPrimary}
                    />
                  </LinearGradient>
                )}
              </View>

              {/* Event Info */}
              <View style={styles.modalInfo}>
                <Text style={styles.modalEventTitle}>
                  {selectedEvent.title}
                </Text>
                <View style={styles.modalDateRow}>
                  <Ionicons name="calendar-outline" size={18} color={colors.purple} />
                  <Text style={styles.modalEventDate}>
                    {formatDate(selectedEvent.date)} at {formatTime(selectedEvent.date)}
                  </Text>
                </View>

                {selectedEvent.location && (
                  <View style={styles.modalDetailRow}>
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color={colors.purple}
                    />
                    <Text style={styles.modalDetailText}>
                      {selectedEvent.location}
                    </Text>
                  </View>
                )}

                {selectedEvent.description && (
                  <View style={styles.modalDescriptionContainer}>
                    <Text style={styles.modalDescriptionTitle}>
                      About this event
                    </Text>
                    <Text style={styles.modalDescription}>
                      {selectedEvent.description}
                    </Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalShareButton}
                  onPress={() => handleShareEvent(selectedEvent)}
                >
                  <LinearGradient
                    colors={colors.purpleGradient}
                    style={styles.modalShareButtonGradient}
                  >
                    <Ionicons
                      name="share-outline"
                      size={20}
                      color={colors.textPrimary}
                    />
                    <Text style={styles.modalShareButtonText}>Share Event</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6, backgroundColor: colors.background },
  segmented: {
    flexDirection: "row",
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    overflow: "hidden",
  },
  segButton: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 10 },
  segActive: { backgroundColor: colors.purple },
  segText: { color: colors.textMuted, fontWeight: "700", fontSize: 14 },
  segTextActive: { color: "#fff" },
  eventsContent: {
    padding: 16,
    paddingBottom: 100,
  },
  eventCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.accent,
  },
  eventImageContainer: {
    position: "relative",
    height: 160,
    backgroundColor: colors.inputBackground,
  },
  eventImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  datePill: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.purple,
  },
  datePillMonth: {
    color: colors.purple,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  datePillDay: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 2,
  },
  eventContent: {
    padding: 14,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  metaText: { color: colors.textMuted, fontSize: 12, marginLeft: 4 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent, marginHorizontal: 6 },
  deleteButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.inputBackground,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  locationText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 6,
    fontWeight: "600",
  },
  eventDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  actionBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.accent,
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 18,
  },
  actionText: {
    fontSize: 13,
    color: colors.textMuted,
    marginLeft: 6,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    paddingHorizontal: 40,
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    paddingBottom: 30,
  },
  modalImageContainer: {
    height: 240,
    marginBottom: 20,
  },
  modalImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalInfo: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  modalEventTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.textPrimary,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  modalDateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  modalEventDate: {
    fontSize: 15,
    color: colors.purple,
    fontWeight: "700",
    marginLeft: 8,
  },
  modalDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  modalDetailText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginLeft: 12,
    fontWeight: "600",
  },
  modalDescriptionContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.accent,
  },
  modalDescriptionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  modalDescription: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  modalActions: {
    paddingHorizontal: 20,
  },
  modalShareButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  modalShareButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  modalShareButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginLeft: 8,
  },
});
