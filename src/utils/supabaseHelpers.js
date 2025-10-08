// src/utils/supabaseHelpers.js
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

/* ============================================================
   THEME UTILITIES
============================================================ */
export const RED = "#b10f2e";
export const BUCKET = "car-photos";

/* ============================================================
   DELETE ROW — safe wrapper for Supabase
============================================================ */
export async function deleteRow(supabase, table, id, setState) {
  try {
    // optimistic local removal if state array is passed
    if (setState) {
      setState(prev => prev.filter(r => r.id !== id));
    }

    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      console.error(`Delete ${table} error:`, error.message);
      Alert.alert("Error", `Couldn't delete: ${error.message}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Delete ${table} exception:`, err);
    Alert.alert("Error", "Unexpected error while deleting.");
    return false;
  }
}

/* ============================================================
   UPLOAD PHOTO — handles permission, upload, public URL
============================================================ */
export async function pickAndUploadPhoto(supabase, carId) {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Allow photo library access to upload.");
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });

    if (result.canceled) return null;

    const uri = result.assets?.[0]?.uri;
    if (!uri) return null;

    const filename = `car_${carId}_${Date.now()}.jpg`;
    const res = await fetch(uri);
    const blob = await res.blob();

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(filename, blob, { contentType: "image/jpeg" });

    if (uploadErr) {
      console.error("Upload error:", uploadErr.message);
      Alert.alert("Upload failed", uploadErr.message);
      return null;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
    return data?.publicUrl ?? null;
  } catch (err) {
    console.error("pickAndUploadPhoto:", err);
    Alert.alert("Error", "Unexpected error while uploading photo.");
    return null;
  }
}

/* ============================================================
   LOCAL DATE FIX — no more UTC offset issues
============================================================ */
export function toLocalISODate(dateInput) {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
}

/* ============================================================
   SAFE INSERT/UPDATE HELPERS (optional)
============================================================ */
export function withUser(payload, user) {
  return { ...payload, user_id: user?.id ?? null };
}
