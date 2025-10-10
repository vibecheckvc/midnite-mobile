import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
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
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import {
  deleteRow,
  pickAndUploadPhoto,
  withUser,
  toLocalISODate,
} from "../utils/supabaseHelpers";

/* =================== THEME: Blackout Red v2.5 =================== */
const { width } = Dimensions.get("window");
const theme = {
  bgA: "#000000",
  bgB: "#0a0a0a",
  text: "#ffffff",
  muted: "#888888",
  red: "#ff0040",
  redDark: "#990026",
  edge: "rgba(255,0,64,0.3)",
  glass: "rgba(255,255,255,0.05)",
  glassStrong: "rgba(255,255,255,0.08)",
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
    Animated.parallel([
      Animated.timing(introFade, {
        toValue: 1,
        duration: 650,
        useNativeDriver: false,
      }),
      Animated.timing(introTranslate, {
        toValue: 0,
        duration: 650,
        useNativeDriver: false,
      }),
    ]).start(() => {
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 650,
        useNativeDriver: false,
      }).start();
    });
  }, []);

  const fetchCars = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("cars")
      .select(
        "id, make, model, year, mileage, cover_url, is_public, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) Alert.alert("Error", "Could not load your garage.");
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

  const confirmDelete = (car) =>
    Alert.alert(
      "Delete Build",
      `Remove ${car.year ?? ""} ${car.make ?? ""} ${car.model ?? ""}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteRow(supabase, "cars", car.id, setCars);
          },
        },
      ]
    );

  const togglePublic = async (car) => {
    const next = !car.is_public;
    try {
      const { data, error } = await supabase
        .from("cars")
        .update({ is_public: next })
        .eq("id", car.id)
        .select()
        .single();
      if (error) throw error;
      setCars((prev) => prev.map((c) => (c.id === car.id ? data : c)));
    } catch {
      Alert.alert("Error", "Could not update visibility.");
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("CarDetailScreen", { car: item })}
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
            <TouchableOpacity
              onPress={() => togglePublic(item)}
              style={styles.iconButton}
            >
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
            <TouchableOpacity
              onPress={() => confirmDelete(item)}
              style={styles.iconButton}
            >
              <Ionicons name="trash-outline" size={18} color={theme.red} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={[theme.bgA, theme.bgB]}
        style={StyleSheet.absoluteFill}
      />

      {/* Intro Animation */}
      <Animated.View
        style={[
          styles.introWrap,
          { opacity: introFade, transform: [{ translateY: introTranslate }] },
        ]}
      >
        <View style={styles.logoWrap}>
          {(() => {
            try {
              const src = require("../screens/midnte.png");
              return (
                <Image source={src} style={styles.logo} resizeMode="contain" />
              );
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

        {cars.length === 0 && !loading && (
          <View style={styles.helperWrap}>
            <Ionicons name="sparkles-outline" size={16} color={theme.muted} />
            <Text style={styles.helperText}>
              Tap the + to add your first build.
            </Text>
          </View>
        )}

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
                <Text style={styles.emptySub}>
                  Start by adding your first car.
                </Text>
              </View>
            }
          />
        )}
      </Animated.View>

      {modalOpen && (
        <CarModal
          visible={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingCar(null);
          }}
          user={user}
          initialCar={editingCar}
          onSaved={(saved) => {
            setModalOpen(false);
            setEditingCar(null);
            setCars((prev) => {
              const exists = prev.find((c) => c.id === saved.id);
              return exists
                ? prev.map((c) => (c.id === saved.id ? saved : c))
                : [saved, ...prev];
            });
          }}
        />
      )}
    </SafeAreaView>
  );
}

/* =================== MODAL =================== */
const CarModal = ({ visible, onClose, user, initialCar, onSaved }) => {
  const isEdit = !!initialCar;
  const [year, setYear] = useState(
    initialCar?.year ? String(initialCar.year) : ""
  );
  const [make, setMake] = useState(initialCar?.make ?? "");
  const [model, setModel] = useState(initialCar?.model ?? "");
  const [mileage, setMileage] = useState(
    typeof initialCar?.mileage === "number" ? String(initialCar.mileage) : ""
  );
  const [coverUrl, setCoverUrl] = useState(initialCar?.cover_url ?? null);
  const [saving, setSaving] = useState(false);

  const pickCover = async () => {
    try {
      const { uri } = await pickAndUploadPhoto(
        supabase,
        initialCar?.id || "temp"
      );
      if (uri) setCoverUrl(uri);
    } catch {
      Alert.alert("Error", "Failed to pick or upload photo.");
    }
  };

  const save = async () => {
    if (!user?.id) return Alert.alert("Error", "You must be signed in.");
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
      let basePayload = {
        year: yr,
        make: make.trim(),
        model: model.trim(),
        mileage: mil,
        cover_url: coverUrl || null,
        created_at: toLocalISODate(new Date()),
      };
      let payload = withUser(basePayload, user);

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
        const { data, error } = await supabase
          .from("cars")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        car = data;
      }
      onSaved(car);
    } catch (e) {
      Alert.alert("Error", "Could not save your build.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalWrap}>
        <StatusBar barStyle="light-content" backgroundColor={theme.bgA} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {isEdit ? "Edit Build" : "Add Build"}
            </Text>
            <TouchableOpacity onPress={save} disabled={saving}>
              <Text style={[styles.save, saving && { opacity: 0.6 }]}>
                {saving ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <TouchableOpacity
              onPress={pickCover}
              style={styles.coverPicker}
              activeOpacity={0.8}
            >
              {coverUrl ? (
                <Image source={{ uri: coverUrl }} style={styles.coverImg} />
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
            />
            <LabeledInput label="Make" value={make} onChangeText={setMake} />
            <LabeledInput label="Model" value={model} onChangeText={setModel} />
            <LabeledInput
              label="Mileage (km)"
              value={mileage}
              onChangeText={setMileage}
              keyboardType="number-pad"
              placeholder="Optional"
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
  introText: {
    color: theme.text,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 10,
  },
  introSub: { color: theme.muted, fontSize: 13, marginTop: 4 },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  headerTitle: { fontSize: 22, color: theme.text, fontWeight: "900" },
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
  statLabel: {
    color: theme.muted,
    fontSize: 12,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  helperWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    marginTop: 8,
  },
  helperText: { color: theme.muted, fontSize: 12 },
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
  emptyWrap: { alignItems: "center", marginTop: 80 },
  emptyText: {
    color: theme.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 10,
  },
  emptySub: { color: theme.muted, fontSize: 13, marginTop: 4 },
  modalWrap: { flex: 1, backgroundColor: theme.bgA },
  modalContent: { flex: 1 },
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
  modalBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  modalTitle: { color: theme.text, fontSize: 18, fontWeight: "900" },
  cancel: { color: theme.muted, fontWeight: "700", fontSize: 15 },
  save: { color: theme.red, fontWeight: "900", fontSize: 15 },
  coverPicker: {
    height: 150,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.edge,
    backgroundColor: theme.glassStrong,
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
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
