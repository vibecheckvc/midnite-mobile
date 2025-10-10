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
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";
import { eventsService } from "../services/eventsService";
import { storageService } from "../services/storageService";
import { useAuth } from "../contexts/AuthContext";
import * as ImagePicker from "expo-image-picker";

export default function CreateEventModal({ visible, onClose, onEventCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Event</Text>
          <TouchableOpacity
            onPress={handleCreateEvent}
            disabled={loading}
            style={[
              styles.createButton,
              loading && styles.createButtonDisabled,
            ]}
          >
            <Text style={styles.createText}>
              {loading ? "Creating..." : "Create"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            {/* Event Image */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Event Image</Text>
              <TouchableOpacity
                style={styles.imageContainer}
                onPress={showImageOptions}
              >
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.eventImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons
                      name="camera-outline"
                      size={40}
                      color={colors.textMuted}
                    />
                    <Text style={styles.imagePlaceholderText}>
                      Tap to add image
                    </Text>
                  </View>
                )}
                {imageUri && (
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setImageUri(null)}
                  >
                    <Ionicons
                      name="close-circle"
                      size={24}
                      color={colors.red}
                    />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>

            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Event Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter event title"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter event description (optional)"
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter event location (optional)"
                placeholderTextColor={colors.textMuted}
                value={location}
                onChangeText={setLocation}
                maxLength={200}
              />
            </View>

            {/* Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date *</Text>
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
                <Text style={styles.suggestionText}>Use today</Text>
              </TouchableOpacity>
            </View>

            {/* Time */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Time *</Text>
              <TextInput
                style={styles.input}
                placeholder="HH:MM (24-hour format)"
                placeholderTextColor={colors.textMuted}
                value={time}
                onChangeText={setTime}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.suggestionButton}
                onPress={() => setTime(getCurrentTime())}
              >
                <Text style={styles.suggestionText}>Use current time</Text>
              </TouchableOpacity>
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
                    <Text style={styles.previewEventDescription}>
                      {description}
                    </Text>
                  )}
                  {location && (
                    <Text style={styles.previewEventLocation}>
                      📍 {location}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
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
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  createButton: {
    padding: 8,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createText: {
    fontSize: 16,
    color: colors.purple,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: "transparent",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  suggestionButton: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  suggestionText: {
    fontSize: 14,
    color: colors.purple,
    fontWeight: "500",
  },
  previewContainer: {
    marginTop: 20,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  previewEventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  previewEventDate: {
    fontSize: 14,
    color: colors.purple,
    fontWeight: "500",
    marginBottom: 8,
  },
  previewEventDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  previewEventLocation: {
    fontSize: 14,
    color: colors.textMuted,
  },
  imageContainer: {
    position: "relative",
  },
  eventImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.inputBackground,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.accent,
    borderStyle: "dashed",
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
  },
  previewImage: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
  },
});
