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
  Dimensions,
  SafeAreaView,
  StatusBar,
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
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const screenWidth = Dimensions.get("window").width;
  const viewerRef = React.useRef(null);

  const isOwner = user?.id && car?.user_id === user.id;
  const guard = () => {
    if (!isOwner) {
      Alert.alert("Read Only", "You can only modify photos for your own car.");
      return false;
    }
    return true;
  };

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
      Alert.alert("Error", error.message);
    }
  }, [car?.id, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  // Real-time sync for this car’s photo table
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

  // Handles both image pick & upload via helper
  const handleUpload = async () => {
    if (!guard()) return;
    try {
      const photoUrl = await pickAndUploadPhoto(supabase, car.id);
      if (!photoUrl) return;

      setPendingUri(photoUrl);
      setCaption("");
      setShowCaption(true);
    } catch (err) {
      Alert.alert("Error", "Failed to open photo picker.");
    }
  };

  const confirmUpload = async () => {
    if (!guard()) return;
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

      // Insert into DB
      const payload = withUser(
        {
          car_id: car.id,
          url: pendingUri,
          caption: caption?.trim() || null,
        },
        user
      );

      const { data, error } = await supabase.from(TABLE).insert(payload).select().single();
      
      if (error) {
        throw error;
      }

      // Replace temp entry with actual record
      setRows((prev) => [data, ...prev.filter((r) => r.id !== temp.id)]);
      setShowCaption(false);
      setPendingUri(null);
      setCaption("");
      onReload?.();
    } catch (err) {
      Alert.alert("Error", "Failed to upload photo to database.");
    }
  };

  // Delete photo and DB record via helpers
  const remove = (row) => {
    if (!guard()) return;
    return Alert.alert("Delete photo", "Remove this photo permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteRow(supabase, TABLE, row.id, setRows);
          onReload?.();
        },
      },
    ]);
  };

  const Item = ({ item, index }) => (
    <TouchableOpacity
      style={styles.photoCard}
      activeOpacity={0.85}
      onPress={() => {
        setViewerIndex(index);
        setViewerOpen(true);
      }}
    >
      <Image source={{ uri: item.url }} style={styles.photo} resizeMode="cover" />
      {!!item.caption && (
        <Text numberOfLines={1} style={styles.caption}>
          {item.caption}
        </Text>
      )}
      {isOwner && (
        <TouchableOpacity onPress={() => remove(item)} style={styles.del}>
          <Ionicons name="trash-outline" size={18} color="#fff" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.wrap}>
      <FlatList
        data={rows}
        keyExtractor={(x) => String(x.id)}
        numColumns={3}
        columnWrapperStyle={{ gap: 8, paddingHorizontal: 16 }}
  renderItem={({ item, index }) => <Item item={item} index={index} />}
        contentContainerStyle={{ gap: 8, paddingTop: 12, paddingBottom: 24 }}
        // Perf defaults for grid
        removeClippedSubviews={true}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={9}
        updateCellsBatchingPeriod={50}
        refreshControl={
          <RefreshControl tintColor={RED} refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          isOwner ? (
            <View style={{ paddingHorizontal: 16 }}>
              <TouchableOpacity onPress={handleUpload} style={styles.primary}>
                <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                <Text style={styles.primaryTxt}>Upload Photo</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {/* Fullscreen viewer */}
      <Modal
        visible={viewerOpen}
        animationType="fade"
        transparent={false}
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setViewerOpen(false)}
      >
        <SafeAreaView style={styles.viewerWrap}>
          <StatusBar barStyle="light-content" backgroundColor="#000" translucent />
          <View style={styles.viewerHeader}>
            <TouchableOpacity onPress={() => setViewerOpen(false)} style={styles.viewerClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.viewerCounter}>
              {viewerIndex + 1} / {rows.length}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <FlatList
            ref={viewerRef}
            data={rows}
            keyExtractor={(x) => String(x.id)}
            horizontal
            pagingEnabled
            initialScrollIndex={viewerIndex}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
              if (!Number.isNaN(idx)) setViewerIndex(idx);
            }}
            getItemLayout={(_, index) => ({ length: screenWidth, offset: screenWidth * index, index })}
            renderItem={({ item }) => (
              <View style={{ width: screenWidth, flex: 1, backgroundColor: "#000" }}>
                <Image
                  source={{ uri: item.url }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="contain"
                />
                {!!item.caption && (
                  <View style={styles.viewerCaptionBar}>
                    <Text numberOfLines={2} style={styles.viewerCaption}>
                      {item.caption}
                    </Text>
                  </View>
                )}
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showCaption && isOwner}
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
  viewerWrap: { flex: 1, backgroundColor: "#000" },
  viewerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  viewerClose: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    padding: 6,
  },
  viewerCounter: { color: "#fff", fontWeight: "700" },
  viewerCaptionBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  viewerCaption: { color: TEXT, fontSize: 13 },
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
