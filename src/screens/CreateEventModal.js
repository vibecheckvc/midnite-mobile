import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";
import { eventsService } from "../services/eventsService";
import { storageService } from "../services/storageService";
import { useAuth } from "../contexts/AuthContext";
import * as ImagePicker from "expo-image-picker";

export default function CreateEventModal({ visible, onClose, onEventCreated }) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [tempHour, setTempHour] = useState("00");
  const [tempMinute, setTempMinute] = useState("00");
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleCreateEvent = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter an event title");
      return;
    }

    if (!date.trim()) {
      Alert.alert("Error", "Please enter an event date");
      return;
    }

    if (!time.trim()) {
      Alert.alert("Error", "Please enter an event time");
      return;
    }

    try {
      setLoading(true);

      // Combine date and time into a single datetime string
      const eventDateTime = new Date(`${date}T${time}`);

      // First create the event without image
      const eventData = {
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        date: eventDateTime.toISOString(),
        image_url: null,
      };

      const { data: event, error } = await eventsService.createEvent(eventData);

      if (error) {
        Alert.alert("Error", "Failed to create event");
        return;
      }

      // If there's an image, upload it and update the event
      if (imageUri && event) {
        console.log("Uploading image for event:", event.id);
        const { data: imageUrl, error: uploadError } =
          await storageService.uploadEventImage(imageUri, event.id);

        if (uploadError) {
          console.error("Error uploading image:", uploadError);
          // Event was created successfully, just image upload failed
          Alert.alert(
            "Success",
            "Event created successfully, but image upload failed"
          );
        } else {
          console.log("Image uploaded successfully, URL:", imageUrl);
          // Update event with image URL
          const { error: updateError } = await eventsService.updateEvent(
            event.id,
            { image_url: imageUrl }
          );

          if (updateError) {
            console.error("Error updating event with image:", updateError);
            Alert.alert(
              "Success",
              "Event created successfully, but image upload failed"
            );
          } else {
            console.log("Event updated with image URL:", imageUrl);
            Alert.alert("Success", "Event created successfully!");
            // Update the event data with the image URL
            event.image_url = imageUrl;
          }
        }
      } else {
        Alert.alert("Success", "Event created successfully!");
      }

      onEventCreated(event);
      handleClose();
    } catch (error) {
      console.error("Error creating event:", error);
      Alert.alert("Error", "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setLocation("");
    setDate("");
    setTime("");
    setImageUri(null);
    onClose();
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant camera roll permissions to add images"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant camera permissions to take photos"
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const showImageOptions = () => {
    Alert.alert("Add Event Image", "Choose how you want to add an image", [
      { text: "Camera", onPress: takePhoto },
      { text: "Photo Library", onPress: pickImage },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const getCurrentDate = () => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  const openTimePicker = () => {
    const [h, m] = (time || getCurrentTime()).split(":");
    setTempHour(h);
    setTempMinute(m);
    setTimePickerOpen(true);
  };

  const confirmTime = () => {
    setTime(`${tempHour}:${tempMinute}`);
    setTimePickerOpen(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.modalSafe, { paddingBottom: 0 }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalKbWrap}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Event</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={[
              styles.contentWrap,
              { paddingBottom: insets.bottom + 100 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Cover Picker Card */}
            <TouchableOpacity onPress={showImageOptions} style={styles.coverPickerCard} activeOpacity={0.85}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.coverImg} />
              ) : (
                <LinearGradient
                  colors={colors.purpleGradient}
                  style={styles.coverPlaceholder}
                >
                  <Ionicons name="image-outline" size={32} color={colors.textPrimary} />
                  <Text style={styles.coverPlaceholderText}>Tap to Upload Event Image</Text>
                </LinearGradient>
              )}
              {imageUri && (
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setImageUri(null)}
                >
                  <Ionicons name="close-circle" size={28} color={colors.red} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {/* Info Section */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionLabel}>Event Details</Text>

              <LabeledInput
                label="Event Title *"
                value={title}
                onChangeText={setTitle}
                placeholder="Enter event name"
                maxLength={100}
              />

              <LabeledInput
                label="Description"
                value={description}
                onChangeText={setDescription}
                placeholder="What's this event about? (optional)"
                multiline
                numberOfLines={4}
                style={styles.textArea}
                maxLength={500}
              />

              <LabeledInput
                label="Location"
                value={location}
                onChangeText={setLocation}
                placeholder="Where is it happening? (optional)"
                maxLength={200}
              />

              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Date *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textMuted}
                    value={date}
                    onChangeText={setDate}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    style={styles.suggestionButton}
                    onPress={() => setDate(getCurrentDate())}
                  >
                    <Text style={styles.suggestionText}>Today</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Time *</Text>
                  <TouchableOpacity onPress={openTimePicker}>
                    <View style={[styles.input, { justifyContent: "center" }]}>
                      <Text style={{ color: time ? colors.textPrimary : colors.textMuted, fontSize: 15 }}>
                        {time || "HH:MM"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.suggestionButton}
                    onPress={() => setTime(getCurrentTime())}
                  >
                    <Text style={styles.suggestionText}>Now</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Preview */}
              {title && date && time && (
                <View style={styles.previewContainer}>
                  <Text style={styles.previewTitle}>Preview</Text>
                  <View style={styles.previewCard}>
                    {imageUri && (
                      <Image
                        source={{ uri: imageUri }}
                        style={styles.previewImage}
                      />
                    )}
                    <Text style={styles.previewEventTitle}>{title}</Text>
                    <Text style={styles.previewEventDate}>
                      {new Date(`${date}T${time}`).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    {description && (
                      <Text style={styles.previewEventDescription} numberOfLines={3}>
                        {description}
                      </Text>
                    )}
                    {location && (
                      <View style={styles.previewLocationRow}>
                        <Ionicons name="location-outline" size={14} color={colors.purple} />
                        <Text style={styles.previewEventLocation}>{location}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Sticky Footer with Save Button */}
          <View
            style={[
              styles.modalFooterBar,
              { paddingBottom: insets.bottom + 8, paddingTop: 12 },
            ]}
          >
            <TouchableOpacity
              onPress={handleCreateEvent}
              disabled={loading}
              style={styles.saveButtonLarge}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.saveButtonText, loading && { opacity: 0.6 }]}>
                {loading ? "Creating..." : "Create Event"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Time Picker Modal */}
      <Modal visible={timePickerOpen} transparent animationType="fade" onRequestClose={() => setTimePickerOpen(false)}>
        <View style={styles.timeOverlay}>
          <View style={styles.timeCard}>
            <Text style={styles.timeTitle}>Select Time</Text>
            <View style={styles.timePickersRow}>
              <ScrollView
                style={{ maxHeight: 180 }}
                showsVerticalScrollIndicator={false}
              >
                {hours.map((h) => (
                  <TouchableOpacity key={h} onPress={() => setTempHour(h)} style={[styles.timeItem, tempHour === h && styles.timeItemActive]}>
                    <Text style={[styles.timeItemText, tempHour === h && styles.timeItemTextActive]}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.timeColon}>:</Text>
              <ScrollView
                style={{ maxHeight: 180 }}
                showsVerticalScrollIndicator={false}
              >
                {minutes.map((m) => (
                  <TouchableOpacity key={m} onPress={() => setTempMinute(m)} style={[styles.timeItem, tempMinute === m && styles.timeItemActive]}>
                    <Text style={[styles.timeItemText, tempMinute === m && styles.timeItemTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.timeActions}>
              <TouchableOpacity onPress={() => setTimePickerOpen(false)} style={styles.timeCancel}>
                <Text style={{ color: colors.textMuted, fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmTime} style={styles.timeConfirm}>
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

/* =================== SMALL INPUT =================== */
const LabeledInput = ({ label, style, ...props }) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput style={[styles.input, style]} placeholderTextColor={colors.textMuted} {...props} />
  </View>
);

const styles = StyleSheet.create({
  modalSafe: { flex: 1, backgroundColor: colors.background },
  modalKbWrap: { flex: 1, flexDirection: "column" },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.cardBackground,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "900", textAlign: "center", flex: 1 },
  cancel: { color: colors.textMuted, fontWeight: "700", fontSize: 15 },
  content: { flex: 1 },
  contentWrap: { paddingHorizontal: 16, paddingTop: 16 },

  /* Cover Picker */
  coverPickerCard: {
    height: 180,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.inputBackground,
  },
  coverPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  coverPlaceholderText: { color: colors.textPrimary, fontSize: 15, fontWeight: "600", marginTop: 10 },
  coverImg: { width: "100%", height: "100%", resizeMode: "cover" },
  removeImageButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
  },

  /* Info Section */
  infoSection: { marginBottom: 20 },
  sectionLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },

  rowInputs: { flexDirection: "row", marginBottom: 12, gap: 10 },
  halfInput: { flex: 1 },

  inputLabel: { color: colors.textMuted, fontSize: 13, marginBottom: 6, fontWeight: "700" },
  input: {
    backgroundColor: colors.inputBackground,
    color: colors.textPrimary,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    fontSize: 15,
  },
  textArea: {
    height: 90,
    textAlignVertical: "top",
  },
  suggestionButton: {
    marginTop: 6,
    alignSelf: "flex-start",
  },
  suggestionText: {
    fontSize: 13,
    color: colors.purple,
    fontWeight: "700",
  },

  /* Preview */
  previewContainer: {
    marginTop: 18,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: colors.textMuted,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  previewCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  previewImage: {
    width: "100%",
    height: 110,
    borderRadius: 10,
    marginBottom: 10,
  },
  previewEventTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  previewEventDate: {
    fontSize: 14,
    color: colors.purple,
    fontWeight: "700",
    marginBottom: 8,
  },
  previewEventDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  previewLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  previewEventLocation: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 6,
    fontWeight: "600",
  },

  /* Sticky Footer */
  modalFooterBar: {
    backgroundColor: colors.cardBackground,
    borderTopWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: 16,
  },
  saveButtonLarge: {
    backgroundColor: colors.purple,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: { color: colors.textPrimary, fontSize: 16, fontWeight: "900" },

  /* Time Picker */
  timeOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  timeCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  timeTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "800", marginBottom: 10, textAlign: "center" },
  timePickersRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 },
  timeColon: { color: colors.textPrimary, fontSize: 22, fontWeight: "700", marginHorizontal: 6 },
  timeItem: { paddingVertical: 6, paddingHorizontal: 10, alignItems: "center" },
  timeItemActive: { backgroundColor: colors.inputBackground, borderRadius: 8 },
  timeItemText: { color: colors.textSecondary, fontSize: 18, fontWeight: "600" },
  timeItemTextActive: { color: colors.textPrimary },
  timeActions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 6 },
  timeCancel: { padding: 10 },
  timeConfirm: { backgroundColor: colors.purple, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, marginLeft: 6 },
});
