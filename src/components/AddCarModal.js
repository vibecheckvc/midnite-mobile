import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../lib/supabase";
import { colors } from "../constants/colors";

export default function AddCarModal({ visible, onClose, onCarAdded, userId, initialCar }) {
  const isEdit = !!initialCar;
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [trim, setTrim] = useState(""); // optional nickname/variant
  const [mileage, setMileage] = useState("");
  const [coverUri, setCoverUri] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      setMake(initialCar.make);
      setModel(initialCar.model);
      setYear(String(initialCar.year));
      setTrim(initialCar.trim || "");
      setMileage(String(initialCar.mileage ?? "0"));
      setCoverUri(initialCar.cover_url || null);
    } else {
      setMake("");
      setModel("");
      setYear("");
      setTrim("");
      setMileage("");
      setCoverUri(null);
    }
  }, [initialCar, isEdit, visible]);

  const pickCover = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setCoverUri(result.assets[0].uri);
    }
  };

  const uploadCoverIfNeeded = async (carId) => {
    if (!coverUri || coverUri.startsWith("http")) return coverUri;
    try {
      const res = await fetch(coverUri);
      const blob = await res.blob();
      const filename = `car_${carId}_${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from("car-images")
        .upload(filename, blob, { contentType: "image/jpeg" });

      if (error) throw error;

      const { data: pub } = supabase.storage.from("car-images").getPublicUrl(filename);
      return pub?.publicUrl ?? null;
    } catch (e) {
      console.error("cover upload failed", e);
      return null;
    }
  };

  const saveCar = async () => {
    if (!make || !model || !year) {
      Alert.alert("Missing info", "Year, Make, and Model are required.");
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        const { data, error } = await supabase
          .from("cars")
          .update({
            make,
            model,
            year: Number(year),
            trim,
            mileage: Number(mileage || 0),
          })
          .eq("id", initialCar.id)
          .select()
          .single();
        if (error) throw error;

        const coverUrl = await uploadCoverIfNeeded(initialCar.id);
        let final = data;
        if (coverUrl) {
          const { data: upd2 } = await supabase
            .from("cars")
            .update({ cover_url: coverUrl })
            .eq("id", initialCar.id)
            .select()
            .single();
          if (upd2) final = upd2;
        }
        onCarAdded(final);
      } else {
        const { data, error } = await supabase
          .from("cars")
          .insert([
            {
              user_id: userId,
              make,
              model,
              year: Number(year),
              trim,
              mileage: Number(mileage || 0),
              is_public: false,
            },
          ])
          .select()
          .single();
        if (error) throw error;

        const coverUrl = await uploadCoverIfNeeded(data.id);
        let final = data;
        if (coverUrl) {
          const { data: upd2 } = await supabase
            .from("cars")
            .update({ cover_url: coverUrl })
            .eq("id", data.id)
            .select()
            .single();
          if (upd2) final = upd2;
        }
        onCarAdded(final);
      }
      onClose();
    } catch (e) {
      Alert.alert("Error", "Could not save car.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{isEdit ? "Edit Car" : "Add Car"}</Text>
          <TouchableOpacity onPress={saveCar} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.purple} /> : <Text style={styles.saveText}>Save</Text>}
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Cover Image */}
          <TouchableOpacity onPress={pickCover} style={styles.coverBox}>
            {coverUri ? (
              <Image source={{ uri: coverUri }} style={styles.coverImage} />
            ) : (
              <LinearGradient colors={colors.purpleGradient} style={styles.coverPlaceholder}>
                <Ionicons name="image-outline" size={32} color={colors.textPrimary} />
                <Text style={styles.coverText}>Add Cover</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>

          {/* Inputs */}
          <FormInput label="Year" value={year} onChangeText={setYear} keyboardType="number-pad" />
          <FormInput label="Make" value={make} onChangeText={setMake} />
          <FormInput label="Model" value={model} onChangeText={setModel} />
          <FormInput label="Trim / Nickname" value={trim} onChangeText={setTrim} />
          <FormInput label="Mileage" value={mileage} onChangeText={setMileage} keyboardType="number-pad" />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const FormInput = ({ label, ...props }) => (
  <View style={styles.inputWrap}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput style={styles.input} placeholderTextColor={colors.textMuted} {...props} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
    backgroundColor: colors.cardBackground,
  },
  cancelText: { color: colors.textMuted, fontWeight: "600" },
  title: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  saveText: { color: colors.purple, fontWeight: "700" },
  content: { padding: 16 },
  coverBox: {
    height: 140,
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.accent,
  },
  coverImage: { width: "100%", height: "100%" },
  coverPlaceholder: { flex: 1, justifyContent: "center", alignItems: "center" },
  coverText: { color: colors.textPrimary, marginTop: 6, fontWeight: "600" },
  inputWrap: { marginBottom: 12 },
  inputLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: 12,
    color: colors.textPrimary,
    backgroundColor: colors.inputBackground,
  },
});
