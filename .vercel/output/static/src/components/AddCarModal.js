// src/components/AddCarModal.js
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

const RED = "#b10f2e";
const BG = "#0b0b0c";
const CARD = "rgba(255,255,255,0.04)";
const BORDER = "rgba(255,255,255,0.08)";
const TEXT = "#f6f6f7";
const MUTED = "#a9a9b3";
const BUCKET = "car-photos";

export default function AddCarModal({ visible, onClose, supabase, user, onAdded }) {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [trim, setTrim] = useState("");
  const [mileage, setMileage] = useState("");
  const [coverUri, setCoverUri] = useState(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow photo library access.");
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!r.canceled) setCoverUri(r.assets[0].uri);
  };

  const uploadCover = async (uri, carId) => {
    try {
      const filename = `car_${carId}/cover_${Date.now()}.jpg`;
      const res = await fetch(uri);
      const blob = await res.blob();
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(filename, blob, { contentType: "image/jpeg" });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(filename);
      return pub?.publicUrl || null;
    } catch (e) {
      console.log("Upload error:", e.message);
      return null;
    }
  };

  const handleAdd = async () => {
    if (!make.trim() || !model.trim() || !year.trim()) {
      Alert.alert("Missing fields", "Please fill in make, model, and year.");
      return;
    }
    try {
      setUploading(true);

      const { data: insertData, error: insertError } = await supabase
        .from("cars")
        .insert({
          user_id: user?.id ?? null,
          make: make.trim(),
          model: model.trim(),
          year: parseInt(year),
          trim: trim?.trim() || null,
          mileage: mileage ? parseInt(mileage) : 0,
          is_public: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      let coverUrl = null;

      if (coverUri) {
        coverUrl = await uploadCover(coverUri, insertData.id);
        if (coverUrl) {
          await supabase.from("cars").update({ cover_url: coverUrl }).eq("id", insertData.id);
        }
      }

      onAdded?.(insertData);
      Alert.alert("Success", "Car added successfully!");
      resetForm();
      onClose?.();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", e.message);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setMake("");
    setModel("");
    setYear("");
    setTrim("");
    setMileage("");
    setCoverUri(null);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modal}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.muted}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add Car</Text>
          <TouchableOpacity onPress={handleAdd} disabled={uploading}>
            <Text style={[styles.save, uploading && { opacity: 0.6 }]}>
              {uploading ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <ScrollView contentContainerStyle={styles.form}>
          <Field label="Make" value={make} onChangeText={setMake} />
          <Field label="Model" value={model} onChangeText={setModel} />
          <Field label="Year" value={year} onChangeText={setYear} keyboardType="numeric" />
          <Field label="Trim" value={trim} onChangeText={setTrim} />
          <Field label="Mileage" value={mileage} onChangeText={setMileage} keyboardType="numeric" />

          <View style={{ marginTop: 16 }}>
            <Text style={{ color: MUTED, marginBottom: 8 }}>Cover Photo</Text>
            {coverUri ? (
              <TouchableOpacity onPress={pickImage} style={styles.coverPreview}>
                <Image source={{ uri: coverUri }} style={{ width: "100%", height: 180, borderRadius: 12 }} />
                <View style={styles.changeOverlay}>
                  <Ionicons name="refresh-outline" size={22} color="#fff" />
                  <Text style={{ color: "#fff", marginTop: 4, fontSize: 12 }}>Change</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={pickImage} style={styles.uploadBox}>
                <Ionicons name="cloud-upload-outline" size={22} color={TEXT} />
                <Text style={{ color: TEXT, marginTop: 4 }}>Upload Cover</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function Field({ label, ...props }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: MUTED, marginBottom: 6 }}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={MUTED}
        style={{
          backgroundColor: CARD,
          borderWidth: 1,
          borderColor: BORDER,
          borderRadius: 12,
          padding: 12,
          color: TEXT,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  modal: { flex: 1, backgroundColor: BG },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: { color: TEXT, fontWeight: "700", fontSize: 16 },
  save: { color: RED, fontWeight: "700" },
  muted: { color: MUTED },
  form: { padding: 16, paddingBottom: 40 },
  uploadBox: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  coverPreview: {
    position: "relative",
  },
  changeOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
});
