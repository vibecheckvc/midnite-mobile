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
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { user } = useAuth();

  const filters = ["All", "Today", "This Week", "My Events"];

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

      switch (selectedFilter) {
        case "Today":
          const { data: todayData } = await eventsService.getTodayEvents();
          filtered = todayData || [];
          break;
        case "This Week":
          const { data: weekData } = await eventsService.getThisWeekEvents();
          filtered = weekData || [];
          break;
        case "My Events":
          if (user) {
            const { data: userData } = await eventsService.getEventsByUser(
              user.id
            );
            filtered = userData || [];
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
      hour: "2-digit",
      minute: "2-digit",
    });
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
      {/* Event Header */}
      <View style={styles.eventHeader}>
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          <Text style={styles.eventDate}>{formatDate(item.date)}</Text>
        </View>
        {isEventOwner(item.user_id) && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteEvent(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color={colors.red} />
          </TouchableOpacity>
        )}
      </View>

      {/* Event Image */}
      <View style={styles.eventImageContainer}>
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.eventImage}
            resizeMode="cover"
            onError={(error) => {
              console.log(
                "Image load error for event:",
                item.id,
                "URL:",
                item.image_url,
                "Error:",
                error
              );
            }}
            onLoad={() => {
              console.log(
                "Image loaded successfully for event:",
                item.id,
                "URL:",
                item.image_url
              );
            }}
          />
        ) : (
          <LinearGradient
            colors={colors.purpleGradient}
            style={styles.eventImage}
          >
            <Ionicons name="car-sport" size={40} color={colors.textPrimary} />
            <Text style={styles.eventImageText}>Event</Text>
          </LinearGradient>
        )}
      </View>

      {/* Event Details */}
      <View style={styles.eventDetails}>
        {item.location && (
          <View style={styles.detailRow}>
            <Ionicons
              name="location-outline"
              size={16}
              color={colors.textMuted}
            />
            <Text style={styles.detailText}>{item.location}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={colors.textMuted} />
          <Text style={styles.detailText}>
            Created {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.eventActionsContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => handleViewDetails(item)}
        >
          <LinearGradient
            colors={colors.purpleGradient}
            style={styles.primaryButtonGradient}
          >
            <Ionicons
              name="calendar-outline"
              size={18}
              color={colors.textPrimary}
            />
            <Text style={styles.primaryButtonText}>View Details</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => handleShareEvent(item)}
        >
          <Ionicons name="share-outline" size={18} color={colors.purple} />
          <Text style={styles.secondaryButtonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add-circle" size={24} color={colors.red} />
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
      <FlatList
        data={filteredEvents}
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
            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
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
                      name="car-sport"
                      size={60}
                      color={colors.textPrimary}
                    />
                    <Text style={styles.modalImageText}>Event</Text>
                  </LinearGradient>
                )}
              </View>

              {/* Event Info */}
              <View style={styles.modalInfo}>
                <Text style={styles.modalEventTitle}>
                  {selectedEvent.title}
                </Text>
                <Text style={styles.modalEventDate}>
                  {formatDate(selectedEvent.date)}
                </Text>

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

                <View style={styles.modalDetailRow}>
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={colors.purple}
                  />
                  <Text style={styles.modalDetailText}>
                    Created{" "}
                    {new Date(selectedEvent.created_at).toLocaleDateString()}
                  </Text>
                </View>

                {selectedEvent.description && (
                  <View style={styles.modalDescriptionContainer}>
                    <Text style={styles.modalDescriptionTitle}>
                      Description
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
                    colors={colors.blueGradient}
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
            </ScrollView>
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
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    paddingBottom: 0,
  },
  eventInfo: {
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: colors.purple,
    fontWeight: "500",
  },
  eventDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  eventImageContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  eventImage: {
    height: 120,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  eventImageText: {
    color: colors.textPrimary,
    marginTop: 8,
    fontSize: 14,
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
  eventActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.accent,
  },
  primaryButton: {
    flex: 1,
    marginRight: 12,
    borderRadius: 20,
    overflow: "hidden",
  },
  primaryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginLeft: 6,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
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
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
  },
  modalImageContainer: {
    height: 200,
    marginBottom: 20,
  },
  modalImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImageText: {
    color: colors.textPrimary,
    marginTop: 8,
    fontSize: 16,
  },
  modalInfo: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  modalEventTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  modalEventDate: {
    fontSize: 16,
    color: colors.purple,
    fontWeight: "600",
    marginBottom: 20,
  },
  modalDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  modalDetailText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 12,
  },
  modalDescriptionContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.accent,
  },
  modalDescriptionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  modalActions: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  modalShareButton: {
    borderRadius: 25,
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
    fontWeight: "600",
    color: colors.textPrimary,
    marginLeft: 8,
  },
});
