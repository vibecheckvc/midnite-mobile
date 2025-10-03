import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  FlatList,
  RefreshControl,
  Image,
  Alert,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { useNavigation } from "@react-navigation/native";

const FILTERS = ["All", "Planning", "In Progress", "Complete"];

const statusColor = (status) => {
  switch (status) {
    case "Complete":
      return colors.green;
    case "In Progress":
      return colors.warning;
    case "Planning":
      return colors.info;
    default:
      return colors.textMuted;
  }
};

const humanNumber = (n) =>
  typeof n === "number" ? n.toLocaleString() : String(n ?? "");

export default function GarageScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchCars = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("cars")
      .select("id, make, model, year, trim, mileage, cover_url, is_public, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load your cars.");
    } else {
      setCars(data || []);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCars();
    setRefreshing(false);
  };

  const filteredCars = useMemo(() => {
    if (selectedFilter === "All") return cars;
    return cars.filter(
      (c) =>
        (c?.trim || "Planning") === selectedFilter ||
        c?.status === selectedFilter
    );
  }, [cars, selectedFilter]);

  const stats = useMemo(() => {
    const planning = cars.filter(
      (c) => (c.trim || "").toLowerCase() === "planning"
    ).length;
    const inProgress = cars.filter(
      (c) => (c.trim || "").toLowerCase() === "in progress"
    ).length;
    const complete = cars.filter(
      (c) => (c.trim || "").toLowerCase() === "complete"
    ).length;
    return { total: cars.length, planning, inProgress, complete };
  }, [cars]);

  const confirmDelete = (car) => {
    Alert.alert(
      "Delete Car",
      `Remove ${car.year} ${car.make} ${car.model} from your garage?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.from("cars").delete().eq("id", car.id);
            if (error) {
              Alert.alert("Error", "Failed to delete car.");
            } else {
              setCars((prev) => prev.filter((c) => c.id !== car.id));
            }
          },
        },
      ]
    );
  };

  const togglePublic = async (car) => {
    const next = !car.is_public;
    const { data, error } = await supabase
      .from("cars")
      .update({ is_public: next })
      .eq("id", car.id)
      .select()
      .single();
    if (error) {
      Alert.alert("Error", "Could not update visibility.");
      return;
    }
    setCars((prev) => prev.map((c) => (c.id === car.id ? data : c)));
  };

  const renderItem = ({ item }) => (
    <CarCard
      car={item}
      onEdit={() => {
        setEditingCar(item);
        setModalOpen(true);
      }}
      onDelete={() => confirmDelete(item)}
      onTogglePublic={() => togglePublic(item)}
      onView={() => navigation.navigate("CarDetail", { car: item })}
    />
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Garage</Text>
        <TouchableOpacity
          onPress={() => {
            setEditingCar(null);
            setModalOpen(true);
          }}
          style={styles.headerButton}
        >
          <Ionicons name="add-circle" size={28} color={colors.purple} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Total Cars" value={stats.total} />
        <StatCard label="Complete" value={stats.complete} />
        <StatCard label="In Progress" value={stats.inProgress} />
        <StatCard label="Planning" value={stats.planning} />
      </View>

      <View style={styles.filters}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(f) => f}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedFilter(item)}
              style={[
                styles.filterPill,
                selectedFilter === item && styles.filterPillActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === item && styles.filterTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <SkeletonList />
      ) : (
        <FlatList
          data={filteredCars}
          keyExtractor={(c) => c.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              tintColor={colors.purple}
              colors={[colors.purple]}
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No cars yet"
              subtitle="Add your first build and start logging maintenance, parts, photos, and the full timeline."
              onAdd={() => {
                setEditingCar(null);
                setModalOpen(true);
              }}
            />
          }
        />
      )}

      {modalOpen && (
        <CarModal
          visible={modalOpen}
          onClose={() => setModalOpen(false)}
          userId={user?.id}
          initialCar={editingCar}
          onSaved={(saved) => {
            setModalOpen(false);
            setEditingCar(null);
            setCars((prev) => {
              const exists = prev.find((c) => c.id === saved.id);
              if (exists) return prev.map((c) => (c.id === saved.id ? saved : c));
              return [saved, ...prev];
            });
          }}
        />
      )}
    </Animated.View>
  );
}

/* ----------------- Subcomponents ----------------- */

const StatCard = ({ label, value }) => (
  <View style={styles.statCard}>
    <LinearGradient colors={colors.purpleGradient} style={styles.statGlow} />
    <Text style={styles.statValue}>{humanNumber(value)}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const CarCard = ({ car, onEdit, onDelete, onTogglePublic, onView }) => {
  const navigation = useNavigation();
  return (
    <TouchableOpacity style={styles.card} onPress={onView} activeOpacity={0.9}>
      <LinearGradient colors={colors.darkGradient} style={styles.cover}>
        {car.cover_url ? (
          <Image source={{ uri: car.cover_url }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="car-sport" size={48} color={colors.textPrimary} />
            <Text style={styles.coverPlaceholderText}>No Cover</Text>
          </View>
        )}

        <View style={styles.cardActionsRow}>
          <TouchableOpacity onPress={onTogglePublic} style={styles.iconButton}>
            <Ionicons
              name={car.is_public ? "earth" : "lock-closed"}
              size={18}
              color={car.is_public ? colors.green : colors.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={onEdit} style={styles.iconButton}>
            <Ionicons name="create-outline" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.iconButton}>
            <Ionicons name="trash-outline" size={18} color={colors.red} />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.statusChip,
            { backgroundColor: statusColor(car.trim || "Planning") },
          ]}
        >
          <Text style={styles.statusText}>{car.trim || "Planning"}</Text>
        </View>
      </LinearGradient>

      <View style={styles.cardBody}>
        <Text style={styles.carTitle}>
          {car.year} {car.make} {car.model}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="speedometer-outline" size={16} color={colors.textMuted} />
            <Text style={styles.metaText}>{humanNumber(car.mileage || 0)} miles</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name={car.is_public ? "eye" : "eye-off"} size={16} color={colors.textMuted} />
            <Text style={styles.metaText}>{car.is_public ? "Public" : "Private"}</Text>
          </View>
        </View>

        <View style={styles.quickRow}>
          <QuickLink icon="construct-outline" label="Parts" onPress={() => navigation.navigate("CarDetail", { car, tab: "Parts" })} />
          <QuickLink icon="checkbox-outline" label="Tasks" onPress={() => navigation.navigate("CarDetail", { car, tab: "Tasks" })} />
          <QuickLink icon="build-outline" label="Maintenance" onPress={() => navigation.navigate("CarDetail", { car, tab: "Maintenance" })} />
          <QuickLink icon="time-outline" label="Timeline" onPress={() => navigation.navigate("CarDetail", { car, tab: "Timeline" })} />
          <QuickLink icon="images-outline" label="Photos" onPress={() => navigation.navigate("CarDetail", { car, tab: "Photos" })} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const QuickLink = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.quickItem} onPress={onPress}>
    <View style={styles.quickIconWrap}>
      <Ionicons name={icon} size={16} color={colors.textPrimary} />
    </View>
    <Text style={styles.quickLabel}>{label}</Text>
  </TouchableOpacity>
);

const EmptyState = ({ title, subtitle, onAdd }) => (
  <View style={styles.emptyWrap}>
    <LinearGradient colors={colors.purpleGradient} style={styles.emptyGlow} />
    <Ionicons name="car-sport" size={48} color={colors.textPrimary} />
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptySubtitle}>{subtitle}</Text>
    <TouchableOpacity onPress={onAdd} style={styles.emptyButton}>
      <LinearGradient colors={colors.purpleGradient} style={styles.emptyButtonInner}>
        <Ionicons name="add" size={18} color={colors.textPrimary} />
        <Text style={styles.emptyButtonText}>Add Car</Text>
      </LinearGradient>
    </TouchableOpacity>
  </View>
);

const SkeletonList = () => (
  <View style={{ padding: 16, gap: 16 }}>
    {[0, 1].map((i) => (
      <View key={i} style={styles.skeletonCard}>
        <View style={styles.skeletonCover} />
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: "60%" }]} />
      </View>
    ))}
  </View>
);

const CarModal = ({ visible, onClose, userId, initialCar, onSaved }) => {
  const isEdit = !!initialCar;
  const [make, setMake] = useState(initialCar?.make ?? "");
  const [model, setModel] = useState(initialCar?.model ?? "");
  const [year, setYear] = useState(String(initialCar?.year ?? ""));
  const [trim, setTrim] = useState(initialCar?.trim ?? "Planning");
  const [mileage, setMileage] = useState(String(initialCar?.mileage ?? "0"));
  const [coverUri, setCoverUri] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      setMake(initialCar.make || "");
      setModel(initialCar.model || "");
      setYear(String(initialCar.year || ""));
      setTrim(initialCar.trim || "Planning");
      setMileage(String(initialCar.mileage ?? "0"));
      setCoverUri(null);
    } else {
      setMake("");
      setModel("");
      setYear("");
      setTrim("Planning");
      setMileage("0");
      setCoverUri(null);
    }
  }, [initialCar, isEdit, visible]);

  const pickCover = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow photo library access.");
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
    if (!coverUri) return null;
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

  const save = async () => {
    if (!make.trim() || !model.trim() || !year) {
      Alert.alert("Missing info", "Please fill Year, Make, and Model.");
      return;
    }
    setSaving(true);

    try {
      if (isEdit) {
        let payload = {
          make: make.trim(),
          model: model.trim(),
          year: Number(year),
          trim: trim.trim(),
          mileage: Number(mileage || 0),
        };
        const { data: updated, error } = await supabase
          .from("cars")
          .update(payload)
          .eq("id", initialCar.id)
          .select()
          .single();
        if (error) throw error;

        const coverUrl = await uploadCoverIfNeeded(initialCar.id);
        let final = updated;
        if (coverUrl) {
          const { data: upd2, error: e2 } = await supabase
            .from("cars")
            .update({ cover_url: coverUrl })
            .eq("id", initialCar.id)
            .select()
            .single();
          if (!e2) final = upd2;
        }
        onSaved(final);
      } else {
        const insertPayload = {
          user_id: userId,
          make: make.trim(),
          model: model.trim(),
          year: Number(year),
          trim: trim.trim(),
          mileage: Number(mileage || 0),
          is_public: false,
        };
        const { data: created, error } = await supabase
          .from("cars")
          .insert([insertPayload])
          .select()
          .single();
        if (error) throw error;

        const coverUrl = await uploadCoverIfNeeded(created.id);
        let final = created;
        if (coverUrl) {
          const { data: upd2, error: e2 } = await supabase
            .from("cars")
            .update({ cover_url: coverUrl })
            .eq("id", created.id)
            .select()
            .single();
          if (!e2) final = upd2;
        }
        onSaved(final);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not save car.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalWrap}
      >
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{isEdit ? "Edit Car" : "Add Car"}</Text>
          <TouchableOpacity onPress={save} disabled={saving}>
            <Text style={[styles.saveText, saving && { opacity: 0.6 }]}>
              {saving ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <TouchableOpacity onPress={pickCover} style={styles.coverPicker}>
            {coverUri || initialCar?.cover_url ? (
              <Image source={{ uri: coverUri || initialCar?.cover_url }} style={styles.coverPickerImg} />
            ) : (
              <LinearGradient colors={colors.purpleGradient} style={styles.coverPickerInner}>
                <Ionicons name="image-outline" size={24} color={colors.textPrimary} />
                <Text style={styles.coverPickerText}>Add Cover (optional)</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>

          <Input label="Year" value={year} onChangeText={setYear} keyboardType="number-pad" />
          <Input label="Make" value={make} onChangeText={setMake} />
          <Input label="Model" value={model} onChangeText={setModel} />
          <Input label="Status" value={trim} onChangeText={setTrim} placeholder="Planning / In Progress / Complete" />
          <Input label="Mileage" value={mileage} onChangeText={setMileage} keyboardType="number-pad" />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const Input = ({ label, ...props }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.inputWrap}>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        {...props}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: colors.textPrimary },
  headerButton: { padding: 4 },
  statsRow: { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.cardBackground, borderBottomColor: colors.accent, borderBottomWidth: 1 },
  statCard: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: colors.accent, paddingVertical: 12, alignItems: "center", overflow: "hidden", backgroundColor: colors.cardBackground },
  statGlow: { ...StyleSheet.absoluteFillObject, opacity: 0.12 },
  statValue: { fontSize: 18, fontWeight: "800", color: colors.purple },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  filters: { backgroundColor: colors.cardBackground, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.accent },
  filterPill: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.inputBackground, borderRadius: 18, marginRight: 10 },
  filterPillActive: { backgroundColor: colors.purple, borderColor: colors.purple },
  filterText: { color: colors.textSecondary, fontSize: 13, fontWeight: "600" },
  filterTextActive: { color: colors.textPrimary },
  card: { backgroundColor: colors.cardBackground, borderRadius: 16, borderWidth: 1, borderColor: colors.accent, overflow: "hidden" },
  cover: { height: 180, justifyContent: "flex-end" },
  coverImage: { ...StyleSheet.absoluteFillObject },
  coverPlaceholder: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  coverPlaceholderText: { color: colors.textSecondary, fontSize: 12 },
  cardActionsRow: { position: "absolute", top: 10, right: 10, flexDirection: "row", gap: 8 },
  iconButton: { backgroundColor: "rgba(0,0,0,0.35)", borderRadius: 14, padding: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  statusChip: { alignSelf: "flex-start", margin: 12, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  statusText: { color: colors.textPrimary, fontSize: 11, fontWeight: "700" },
  cardBody: { padding: 14, gap: 10 },
  carTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "800" },
  metaRow: { flexDirection: "row", gap: 16 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { color: colors.textMuted, fontSize: 12 },
  quickRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 6, gap: 10 },
  quickItem: { alignItems: "center" },
  quickIconWrap: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center", backgroundColor: colors.inputBackground, borderWidth: 1, borderColor: colors.accent },
  quickLabel: { color: colors.textSecondary, fontSize: 11, marginTop: 4 },
  emptyWrap: { paddingHorizontal: 26, paddingVertical: 40, alignItems: "center" },
  emptyGlow: { ...StyleSheet.absoluteFillObject, opacity: 0.06, borderRadius: 16 },
  emptyTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "800" },
  emptySubtitle: { color: colors.textMuted, textAlign: "center", fontSize: 13 },
  emptyButton: { marginTop: 8, overflow: "hidden", borderRadius: 12 },
  emptyButtonInner: { paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", gap: 8, alignItems: "center" },
  emptyButtonText: { color: colors.textPrimary, fontWeight: "700" },
  skeletonCard: { height: 240, borderRadius: 16, backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.accent },
  skeletonCover: { height: 150, backgroundColor: colors.inputBackground },
  skeletonLine: { height: 12, backgroundColor: colors.inputBackground, marginTop: 12, marginHorizontal: 12, borderRadius: 8 },
  modalWrap: { flex: 1, backgroundColor: colors.background },
  modalHeader: { paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.accent, backgroundColor: colors.cardBackground },
  cancelText: { color: colors.textMuted, fontWeight: "600" },
  modalTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "800" },
  saveText: { color: colors.purple, fontWeight: "800" },
  modalContent: { padding: 16 },
  coverPicker: { height: 140, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: colors.accent, marginBottom: 6 },
  coverPickerInner: { flex: 1, alignItems: "center", justifyContent: "center" },
  coverPickerText: { color: colors.textPrimary, fontWeight: "700" },
  coverPickerImg: { width: "100%", height: "100%" },
  inputLabel: { color: colors.textSecondary, fontSize: 12, marginBottom: 6 },
  inputWrap: { borderRadius: 10, borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.inputBackground },
  input: { height: 44, paddingHorizontal: 12, color: colors.textPrimary, fontSize: 14 },
});
