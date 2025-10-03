import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../../constants/colors";
import { carPhotosService } from "../../services/carPhotosService";
import { supabase } from "../../lib/supabase";

export default function PhotosTab({ carId }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [caption, setCaption] = useState("");
  const [selectedUri, setSelectedUri] = useState(null);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    setLoading(true);
    const { data, error } = await carPhotosService.getPhotos(carId);
    if (error) Alert.alert("Error", "Could not load photos");
    else setPhotos(data || []);
    setLoading(false);
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo library access to upload.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setSelectedUri(result.assets[0].uri);
      setShowModal(true);
    }
  };

  const uploadPhoto = async () => {
    if (!selectedUri) return;

    try {
      const res = await fetch(selectedUri);
      const blob = await res.blob();
      const filename = `car_${carId}_${Date.now()}.jpg`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("car-photos")
        .upload(filename, blob, { contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage
        .from("car-photos")
        .getPublicUrl(filename);

      // Save DB record via service
      const { data, error } = await carPhotosService.addPhoto({
        car_id: carId,
        url: pub.publicUrl,
        caption,
      });
      if (error) throw error;

      setPhotos((prev) => [data, ...prev]);
      setShowModal(false);
      setCaption("");
      setSelectedUri(null);
    } catch (e) {
      console.error("Photo upload failed", e);
      Alert.alert("Error", "Could not upload photo.");
    }
  };

  const handleDelete = async (id, url) => {
    try {
      const filename = url.split("/").pop();
      await supabase.storage.from("car-photos").remove([filename]);
      const { error } = await carPhotosService.deletePhoto(id);
      if (error) throw error;
      setPhotos((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error("Delete failed", e);
      Alert.alert("Error", "Failed to delete photo.");
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <Text style={styles.loading}>Loading photos...</Text>
      ) : photos.length === 0 ? (
        <Text style={styles.empty}>No photos yet. Add your first!</Text>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => item.id}
          numColumns={3}
          renderItem={({ item }) => (
            <View style={styles.photoWrap}>
              <Image source={{ uri: item.url }} style={styles.photo} />
              {item.caption ? (
                <Text style={styles.caption} numberOfLines={1}>
                  {item.caption}
                </Text>
              ) : null}
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id, item.url)}
              >
                <Ionicons name="trash" size={16} color={colors.red} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={pickPhoto}>
        <Ionicons name="add" size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      {/* Caption Modal */}
      {showModal && (
        <Modal visible={showModal} animationType="slide" onRequestClose={() => setShowModal(false)}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add Photo</Text>
            {selectedUri && <Image source={{ uri: selectedUri }} style={styles.preview} />}
            <TextInput
              placeholder="Caption"
              placeholderTextColor={colors.textMuted}
              value={caption}
              onChangeText={setCaption}
              style={styles.input}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={uploadPhoto}>
                <Text style={styles.save}>Upload</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { textAlign: "center", color: colors.textMuted, marginTop: 20 },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 20 },
  photoWrap: {
    flex: 1 / 3,
    aspectRatio: 1,
    margin: 4,
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: colors.inputBackground,
  },
  photo: { width: "100%", height: "100%" },
  caption: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    color: colors.textPrimary,
    fontSize: 11,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  deleteBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 12,
    padding: 4,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.purple,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  modalContainer: { flex: 1, backgroundColor: colors.background, padding: 20 },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 20,
    textAlign: "center",
  },
  preview: { width: "100%", height: 200, borderRadius: 8, marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
    backgroundColor: colors.inputBackground,
  },
  modalActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  cancel: { color: colors.textMuted, fontWeight: "600" },
  save: { color: colors.purple, fontWeight: "700" },
});
