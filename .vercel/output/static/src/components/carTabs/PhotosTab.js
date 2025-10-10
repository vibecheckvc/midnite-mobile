import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { deleteRow, pickAndUploadPhoto, withUser } from "../../utils/supabaseHelpers";

const RED = "#b10f2e",
  BG = "#0b0b0c",
  CARD = "rgba(255,255,255,0.04)",
  BORDER = "rgba(255,255,255,0.08)",
  TEXT = "#f6f6f7",
  MUTED = "#a9a9b3";

const TABLE = "car_photos";

export default function PhotosTab({ car, user, supabase, onReload }) {
  const [rows, setRows] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [caption, setCaption] = useState("");
  const [showCaption, setShowCaption] = useState(false);
  const [pendingUri, setPendingUri] = useState(null);

  // 🔄 Load all photos for this car
  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("car_id", car.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRows(data || []);
    } catch (error) {
      console.error("Photo load error:", error.message);
      Alert.alert("Error", "Failed to load photos.");
    }
  }, [car?.id, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  // 🛰 Real-time sync
  useEffect(() => {
    if (!car?.id) return;
    const ch = supabase
      .channel(`rt_${TABLE}_${car.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLE, filter: `car_id=eq.${car.id}` },
        load
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [car?.id, supabase, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // 📸 Pick and upload photo via helper
  const handleUpload = async () => {
    try {
      const uri = await pickAndUploadPhoto(supabase, car.id);
      if (!uri) return;
      setPendingUri(uri);
      setCaption("");
      setShowCaption(true);
    } catch (err) {
      console.error("Image picker error:", err.message);
      Alert.alert("Error", "Failed to open photo picker.");
    }
  };

  // ✅ Confirm and save uploaded photo
  const confirmUpload = async () => {
    if (!pendingUri) return setShowCaption(false);

    try {
      // Optimistic local preview
      const temp = {
        id: `temp_${Date.now()}`,
        car_id: car.id,
        user_id: user?.id,
        url: pendingUri,
        caption: caption?.trim() || null,
        created_at: new Date().toISOString(),
      };
      setRows((prev) => [temp, ...prev]);

      // Construct payload safely
      const payload = withUser(
        {
          car_id: car.id,
          url: pendingUri,
          caption: caption?.trim() || null,
          created_at: new Date().toISOString(),
        },
        user
      );

      // 🔧 Fix: use .select().single() to get the inserted row back
      const { data, error } = await supabase
        .from(TABLE)
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error("Insert photo error:", error.message);
        throw error;
      }

      // Replace temp with actual record
      setRows((prev) => [data, ...prev.filter((r) => r.id !== temp.id)]);
      setShowCaption(false);
      setPendingUri(null);
      setCaption("");
      onReload?.();
    } catch (err) {
      console.error("Upload save error:", err.message);
      Alert.alert("Error", "Failed to upload photo to database.");
    }
  };

  // 🗑 Delete photo
  const remove = (row) =>
    Alert.alert("Delete photo", "Remove this photo permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteRow(supabase, TABLE, row.id, setRows);
            onReload?.();
          } catch (err) {
            console.error("Delete photo error:", err.message);
            Alert.alert("Error", "Failed to delete photo.");
          }
        },
      },
    ]);

  const Item = ({ item }) => (
    <View style={styles.photoCard}>
      <Image
        source={{ uri: item.url }}
        style={styles.photo}
        resizeMode="cover"
        onError={() => console.warn("Failed to load image:", item.url)}
      />
      {!!item.caption && (
        <Text numberOfLines={1} style={styles.caption}>
          {item.caption}
        </Text>
      )}
      <TouchableOpacity onPress={() => remove(item)} style={styles.del}>
        <Ionicons name="trash-outline" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.wrap}>
      <FlatList
        data={rows}
        keyExtractor={(x) => String(x.id)}
        numColumns={3}
        columnWrapperStyle={{ gap: 8, paddingHorizontal: 16 }}
        renderItem={Item}
        contentContainerStyle={{ gap: 8, paddingTop: 12, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl tintColor={RED} refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 16 }}>
            <TouchableOpacity onPress={handleUpload} style={styles.primary}>
              <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
              <Text style={styles.primaryTxt}>Upload Photo</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Caption modal */}
      <Modal
        visible={showCaption}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCaption(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCaption(false)}>
              <Text style={styles.muted}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add caption</Text>
            <TouchableOpacity onPress={confirmUpload}>
              <Text style={styles.save}>Upload</Text>
            </TouchableOpacity>
          </View>
          <View style={{ padding: 16 }}>
            <Text style={{ color: MUTED, marginBottom: 6 }}>Caption (optional)</Text>
            <TextInput
              value={caption}
              onChangeText={setCaption}
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
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: BG },
  primary: {
    backgroundColor: RED,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  primaryTxt: { color: "#fff", fontWeight: "800" },
  photoCard: {
    position: "relative",
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    overflow: "hidden",
    width: "32%",
  },
  photo: { width: "100%", aspectRatio: 1 },
  caption: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    color: "#fff",
    fontSize: 12,
    padding: 6,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  del: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  modal: { flex: 1, backgroundColor: BG },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: { color: "#f6f6f7", fontWeight: "800" },
  muted: { color: "#a9a9b3" },
  save: { color: RED, fontWeight: "800" },
});
