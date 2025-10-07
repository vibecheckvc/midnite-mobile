// src/screens/GarageScreen.js
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
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

/* =================== THEME: Blackout Red v2.5 =================== */
const { width } = Dimensions.get("window");
const theme = {
  bgA: "#000000",
  bgB: "#0a0a0b",
  text: "#ffffff",
  muted: "#8b8b90",
  red: "#ff002f",
  redDark: "#7a0018",
  edge: "rgba(255,0,76,0.25)", // border/edge glow (no shadow*)
  glass: "rgba(255,255,255,0.04)",
  glassStrong: "rgba(255,255,255,0.07)",
};

/* =================== SCREEN =================== */
export default function GarageScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();

  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState(null);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const introFade = useRef(new Animated.Value(0)).current;
  const introTranslate = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    // Safe (JS-driven) animations for RN Web compatibility (no native driver)
    Animated.parallel([
      Animated.timing(introFade, { toValue: 1, duration: 650, useNativeDriver: false }),
      Animated.timing(introTranslate, { toValue: 0, duration: 650, useNativeDriver: false }),
    ]).start(() => {
      Animated.timing(fadeIn, { toValue: 1, duration: 650, useNativeDriver: false }).start();
    });
  }, []);

  const fetchCars = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("cars")
      .select("id, make, model, year, mileage, cover_url, is_public, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load cars error:", error.message);
      Alert.alert("Error", "Could not load your garage.");
    }
    setCars(data || []);
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

  const stats = useMemo(() => ({ total: cars.length }), [cars]);

  const confirmDelete = (car) => {
    Alert.alert(
      "Delete Build",
      `Remove ${car.year ?? ""} ${car.make ?? ""} ${car.model ?? ""}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.from("cars").delete().eq("id", car.id);
            if (error) {
              Alert.alert("Error", "Could not delete.");
              return;
            }
            setCars((prev) => prev.filter((c) => c.id !== car.id));
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
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("CarDetail", { car: item })}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={[theme.glass, theme.bgB]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardInner}
      >
        {item.cover_url ? (
          <Image source={{ uri: item.cover_url }} style={styles.coverImg} />
        ) : (
          <View style={styles.noCover}>
            <Ionicons name="car-sport" size={40} color={theme.muted} />
            <Text style={styles.noCoverText}>No Cover</Text>
          </View>
        )}

        <View style={styles.cardBody}>
          <Text style={styles.carTitle}>
            {item.year ? `${item.year} ` : ""}
            {item.make ?? ""} {item.model ?? ""}
          </Text>
          <Text style={styles.carMeta}>
            {typeof item.mileage === "number"
              ? `${item.mileage.toLocaleString()} km`
              : "Mileage N/A"}{" "}
            • {item.is_public ? "Public" : "Private"}
          </Text>

          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => togglePublic(item)} style={styles.iconButton}>
              <Ionicons
                name={item.is_public ? "earth" : "lock-closed"}
                size={18}
                color={theme.red}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setEditingCar(item);
                setModalOpen(true);
              }}
              style={styles.iconButton}
            >
              <Ionicons name="create-outline" size={18} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => confirmDelete(item)} style={styles.iconButton}>
              <Ionicons name="trash-outline" size={18} color={theme.red} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Background */}
      <LinearGradient
        colors={[theme.bgA, theme.bgB]}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle intro (non-blocking) */}
      <Animated.View
        style={[
          styles.introWrap,
          { opacity: introFade, transform: [{ translateY: introTranslate }] },
        ]}
      >
        {/* Handle gracefully if asset is missing */}
        <View style={styles.logoWrap}>
          {(() => {
            try {
              // Per instruction, use this asset path:
              const src = require("../screens/midnte.png");
              return <Image source={src} style={styles.logo} resizeMode="contain" />;
            } catch {
              return (
                <View style={[styles.logo, styles.logoFallback]}>
                  <Ionicons name="speedometer" size={28} color={theme.red} />
                </View>
              );
            }
          })()}
        </View>
        <Text style={styles.introText}>Welcome back, driver.</Text>
        <Text style={styles.introSub}>Your builds are waiting in the bay.</Text>
      </Animated.View>

      {/* Header + Add button */}
      <Animated.View style={[styles.container, { opacity: fadeIn }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Garage</Text>
          <TouchableOpacity
            onPress={() => {
              setEditingCar(null);
              setModalOpen(true);
            }}
          >
            <Ionicons name="add-circle" size={32} color={theme.red} />
          </TouchableOpacity>
        </View>

        {/* Minimal stats strip */}
        <View style={styles.statsRow}>
          <LinearGradient
            colors={["rgba(122,0,24,0.6)", "rgba(255,0,47,0.35)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.statCard}
          >
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Builds</Text>
          </LinearGradient>
        </View>

        {/* Helper text */}
        {cars.length === 0 && !loading && (
          <View style={styles.helperWrap}>
            <Ionicons name="sparkles-outline" size={16} color={theme.muted} />
            <Text style={styles.helperText}>Tap the + to add your first build.</Text>
          </View>
        )}

        {/* List */}
        {loading ? (
          <ActivityIndicator color={theme.red} style={{ marginTop: 36 }} />
        ) : (
          <FlatList
            data={cars}
            keyExtractor={(c) => c.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16, paddingBottom: 160 }}
            refreshControl={
              <RefreshControl
                tintColor={theme.red}
                colors={[theme.red]}
                refreshing={refreshing}
                onRefresh={onRefresh}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="car-sport" size={50} color={theme.muted} />
                <Text style={styles.emptyText}>No builds yet.</Text>
                <Text style={styles.emptySub}>Start by adding your first car.</Text>
              </View>
            }
          />
        )}
      </Animated.View>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <CarModal
          visible={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingCar(null);
          }}
          userId={user?.id}
          initialCar={editingCar}
          onSaved={(saved) => {
            setModalOpen(false);
            setEditingCar(null);
            setCars((prev) => {
              const exists = prev.find((c) => c.id === saved.id);
              return exists ? prev.map((c) => (c.id === saved.id ? saved : c)) : [saved, ...prev];
            });
          }}
        />
      )}
    </SafeAreaView>
  );
}

/* =================== MODAL =================== */
const CarModal = ({ visible, onClose, userId, initialCar, onSaved }) => {
  const isEdit = !!initialCar;

  const [year, setYear] = useState(initialCar?.year ? String(initialCar.year) : "");
  const [make, setMake] = useState(initialCar?.make ?? "");
  const [model, setModel] = useState(initialCar?.model ?? "");
  const [mileage, setMileage] = useState(
    typeof initialCar?.mileage === "number" ? String(initialCar.mileage) : ""
  );
  const [coverUri, setCoverUri] = useState(null);
  const [saving, setSaving] = useState(false);

  const pickCover = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return Alert.alert("Permission needed", "Allow photo library access.");
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

  const uploadCoverToSupabase = async (carId) => {
    if (!coverUri) return null;
    // Works on mobile & web: fetch -> blob
    const res = await fetch(coverUri);
    const blob = await res.blob();
    const filename = `car_${carId}_${Date.now()}.jpg`;
    const { error: uploadErr } = await supabase
      .storage
      .from("car-images")
      .upload(filename, blob, { contentType: "image/jpeg" });

    if (uploadErr) throw uploadErr;

    const { data: pub } = supabase.storage.from("car-images").getPublicUrl(filename);
    return pub?.publicUrl ?? null;
  };

  const save = async () => {
    if (!userId) return Alert.alert("Error", "You must be signed in.");
    if (!make.trim() || !model.trim() || !year.trim()) {
      return Alert.alert("Missing info", "Year, Make, and Model are required.");
    }
    const yr = Number(year);
    const mil = mileage.trim().length ? Number(mileage) : null;
    if (Number.isNaN(yr) || yr < 1885 || yr > 2100) {
      return Alert.alert("Invalid year", "Please enter a valid year.");
    }
    if (mil !== null && Number.isNaN(mil)) {
      return Alert.alert("Invalid mileage", "Mileage must be a number.");
    }

    setSaving(true);
    try {
      let payload = {
        year: yr,
        make: make.trim(),
        model: model.trim(),
        mileage: mil,
        user_id: userId,
      };

      let car;
      if (isEdit) {
        const { data, error } = await supabase
          .from("cars")
          .update(payload)
          .eq("id", initialCar.id)
          .select()
          .single();
        if (error) throw error;
        car = data;
      } else {
        const { data, error } = await supabase.from("cars").insert([payload]).select().single();
        if (error) throw error;
        car = data;
      }

      // If a new cover is selected, upload & update cover_url
      if (coverUri) {
        const publicUrl = await uploadCoverToSupabase(car.id);
        if (publicUrl) {
          const { data: updated, error: updErr } = await supabase
            .from("cars")
            .update({ cover_url: publicUrl })
            .eq("id", car.id)
            .select()
            .single();
          if (updErr) throw updErr;
          car = updated;
        }
      }

      onSaved(car);
    } catch (e) {
      console.error("Save car error:", e);
      Alert.alert("Error", "Could not save your build.");
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
        {/* Sticky header: Save/Cancel always reachable */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{isEdit ? "Edit Build" : "Add Build"}</Text>
          <TouchableOpacity onPress={save} disabled={saving}>
            <Text style={[styles.save, saving && { opacity: 0.6 }]}>
              {saving ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.modalContent}>
          <TouchableOpacity onPress={pickCover} style={styles.coverPicker} activeOpacity={0.8}>
            {coverUri || initialCar?.cover_url ? (
              <Image
                source={{ uri: coverUri || initialCar?.cover_url }}
                style={styles.coverImg}
              />
            ) : (
              <LinearGradient
                colors={[theme.redDark, "rgba(255,0,47,0.35)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.coverPlaceholder}
              >
                <Ionicons name="image-outline" size={22} color={theme.text} />
                <Text style={styles.noCoverText}>Upload Cover</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>

          <LabeledInput
            label="Year"
            value={year}
            onChangeText={setYear}
            keyboardType="number-pad"
            returnKeyType="next"
          />
          <LabeledInput label="Make" value={make} onChangeText={setMake} returnKeyType="next" />
          <LabeledInput label="Model" value={model} onChangeText={setModel} returnKeyType="next" />
          <LabeledInput
            label="Mileage (km)"
            value={mileage}
            onChangeText={setMileage}
            keyboardType="number-pad"
            placeholder="Optional"
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

/* =================== SMALL INPUT =================== */
const LabeledInput = ({ label, ...props }) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={styles.input}
      placeholderTextColor={theme.muted}
      {...props}
    />
  </View>
);

/* =================== STYLES =================== */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bgA },

  /* Intro */
  introWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 18,
    paddingBottom: 12,
  },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.edge,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.glass,
  },
  logo: { width: 80, height: 30, tintColor: theme.red },
  logoFallback: { backgroundColor: "transparent" },
  introText: { color: theme.text, fontSize: 20, fontWeight: "900", marginTop: 10 },
  introSub: { color: theme.muted, fontSize: 13, marginTop: 4 },

  container: { flex: 1 },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  headerTitle: { fontSize: 22, color: theme.text, fontWeight: "900" },

  /* Stats strip */
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  statCard: {
    width: width - 32,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.edge,
    backgroundColor: theme.glass,
  },
  statValue: { fontSize: 20, color: theme.text, fontWeight: "900" },
  statLabel: { color: theme.muted, fontSize: 12, marginTop: 2, letterSpacing: 0.5 },

  /* Helper */
  helperWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    marginTop: 8,
  },
  helperText: { color: theme.muted, fontSize: 12 },

  /* List cards */
  card: {
    marginVertical: 10,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.edge,
    backgroundColor: theme.glass,
  },
  cardInner: { padding: 12 },
  noCover: {
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.glassStrong,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.edge,
  },
  noCoverText: { color: theme.muted, fontSize: 12, marginTop: 6 },
  coverImg: { width: "100%", height: 140, borderRadius: 12 },
  cardBody: { paddingTop: 12 },
  carTitle: { color: theme.text, fontSize: 18, fontWeight: "900" },
  carMeta: { color: theme.muted, fontSize: 13, marginTop: 4 },
  cardActions: { flexDirection: "row", gap: 18, marginTop: 12 },
  iconButton: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.edge,
    backgroundColor: "transparent",
  },

  /* Empty state */
  emptyWrap: { alignItems: "center", marginTop: 80 },
  emptyText: { color: theme.text, fontSize: 18, fontWeight: "900", marginTop: 10 },
  emptySub: { color: theme.muted, fontSize: 13, marginTop: 4 },

  /* Modal */
  modalWrap: { flex: 1, backgroundColor: theme.bgA },
  modalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: theme.edge,
    backgroundColor: theme.bgB,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: { color: theme.text, fontSize: 18, fontWeight: "900" },
  cancel: { color: theme.muted, fontWeight: "700", fontSize: 15 },
  save: { color: theme.red, fontWeight: "900", fontSize: 15 },

  modalContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  coverPicker: {
    height: 150,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.edge,
    backgroundColor: theme.glassStrong,
  },
  coverPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },

  /* Inputs */
  inputLabel: { color: theme.muted, fontSize: 12, marginBottom: 6 },
  input: {
    backgroundColor: theme.glass,
    color: theme.text,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.edge,
  },
});
