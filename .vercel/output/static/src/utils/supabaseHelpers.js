// src/utils/supabaseHelpers.js
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { uploadAsync, UPLOAD_TYPE_BINARY_CONTENT } from "expo-file-system/legacy";

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
    if (setState) setState((prev) => prev.filter((r) => r.id !== id));
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
   UPLOAD PHOTO — Expo 54+ (no Blob/ArrayBuffer)
   - Picks image
   - Uses FileSystem.uploadAsync to Supabase Storage REST endpoint
============================================================ */
export async function pickAndUploadPhoto(supabase, carId) {
  try {
    // 1) Ask permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Allow photo library access to upload.");
      return null;
    }

    // 2) Launch picker (omit mediaTypes confusion; defaults to images)
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (result.canceled) return null;

    const uri = result.assets?.[0]?.uri;
    if (!uri) return null;

    // 3) Build file path & endpoint
    const filename = `car_${carId}_${Date.now()}.jpg`;

    // Pull env for REST endpoint; these are already in your app env
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      Alert.alert("Config error", "Missing Supabase environment variables.");
      return null;
    }

    const uploadUrl = `${supabaseUrl}/storage/v1/object/${BUCKET}/${encodeURI(
      filename
    )}`;

    // 4) Use the user's access token if available (preferred for RLS)
    let accessToken = null;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      accessToken = sessionData?.session?.access_token ?? null;
    } catch {
      // ignore; we'll fall back to anon if needed
    }

    // 5) Upload raw binary directly — NO Blob, NO ArrayBuffer
    const res = await uploadAsync(uploadUrl, uri, {
      httpMethod: "POST",
      uploadType: UPLOAD_TYPE_BINARY_CONTENT,
      headers: {
        "Content-Type": "image/jpeg",
        // auth: prefer user token; include apikey for Supabase edge auth
        Authorization: `Bearer ${accessToken ?? supabaseAnonKey}`,
        apikey: supabaseAnonKey,
        // allow replacing if same path is re-used
        "x-upsert": "true",
      },
    });

    if (res.status < 200 || res.status >= 300) {
      console.error("Upload error (HTTP):", res.status, res.body);
      Alert.alert("Upload failed", `HTTP ${res.status}`);
      return null;
    }

    // 6) Get a public URL for the uploaded file
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
  // Only include user_id if we have it; otherwise let RLS defaults handle it
  return