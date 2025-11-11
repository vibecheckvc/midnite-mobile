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
  ScrollView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { deleteRow, pickAndUploadPhoto, withUser, toLocalISODate } from "../utils/supabaseHelpers";
import LoadingOverlay from "../components/LoadingOverlay";

/* =================== THEME: Blackout Red v2.5 =================== */
const { width } = Dimensions.get("window");
const theme = {
  bgA: "#000000",
  bgB: "#0a0a0b",
  text: "#ffffff",
  muted: "#8b8b90",
  red: "#ff002f",
  redDark: "#7a0018",
  green: "#00c97e",
  edge: "rgba(255,0,76,0.25)",
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
      style={styles.cardWrapper}
      activeOpacity={0.85}
      onPress={() => navigation.navigate("CarDetailScreen", { carId: item.id })}
    >
      <View style={styles.card}>
        {/* Cover Image with Badge Overlay */}
        <View style={styles.coverContainer}>
          {item.cover_url ? (
            <Image source={{ uri: item.cover_url }} style={styles.coverImg} />
          ) : (
            <View style={styles.noCover}>
              <Ionicons name="image-outline" size={44} color={theme.muted} />
            </View>
          )}
          {/* Public/Private Badge - Premium Design */}
          <View style={[styles.badge, item.is_public ? styles.badgePublic : styles.badgePrivate]}>
            <Ionicons
              name={item.is_public ? "globe-outline" : "lock-closed-outline"}
              size={13}
              color={item.is_public ? theme.green : "#fff"}
            />
            <Text style={[styles.badgeText, item.is_public && { color: theme.green }]}>{item.is_public ? "PUBLIC" : "PRIVATE"}</Text>
          </View>
        </View>

        {/* Card Content Container */}
        <View style={styles.cardContent}>
          {/* Title & Trim */}
          <View style={styles.cardHeader}>
            <View style={styles.titleArea}>
              <Text style={styles.carTitle} numberOfLines={2}>
                {item.year ? `${item.year} ` : ""}
                {item.make ?? ""} {item.model ?? ""}
              </Text>
              {item.trim && <Text style={styles.carTrim}>{item.trim}</Text>}
            </View>
          </View>

          {/* Mileage Divider */}
          {typeof item.mileage === "number" && (
            <View style={styles.cardMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="speedometer-outline" size={15} color={theme.red} />
                <Text style={styles.metaText}>{item.mileage.toLocaleString()} mi</Text>
              </View>
            </View>
          )}

          {/* Premium Action Button Row */}
          <View style={styles.cardActions}>
            {/* Edit Button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setEditingCar(item);
                setModalOpen(true);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil-outline" size={17} color={theme.text} />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>

            {/* Share/Lock Button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => togglePublic(item)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.is_public ? "lock-closed-outline" : "share-social-outline"}
                size={17}
                color={theme.text}
              />
              <Text style={styles.actionButtonText}>{item.is_public ? "Lock" : "Share"}</Text>
            </TouchableOpacity>

            {/* Delete Button - Danger State */}
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonDanger]}
              onPress={() => confirmDelete(item)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={17} color={theme.red} />
              <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={[theme.bgA, theme.bgB]} style={StyleSheet.absoluteFill} />

      {/* Removed intro quotes for cleaner minimal empty state */}

      <Animated.View style={[styles.container, { opacity: fadeIn }]}>
        {/* Header Section - Premium Design */}
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Your Collection</Text>
              <Text style={styles.headerCaption}>
                {stats.total === 0
                  ? "Start your first build"
                  : stats.total === 1
                  ? "1 car in your garage"
                  : `${stats.total} cars in your garage`}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setEditingCar(null);
                setModalOpen(true);
              }}
              style={styles.addButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <LinearGradient
                colors={[theme.red, "rgba(255, 0, 47, 0.8)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.addButtonGradient}
              >
                <Ionicons name="add-sharp" size={24} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Stats Row - Multiple Metrics */}
          {stats.total > 0 && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={styles.statItemIcon}>
                  <Ionicons name="car-sport" size={16} color={theme.red} />
                </View>
                <View>
                  <Text style={styles.statItemValue}>{stats.total}</Text>
                  <Text style={styles.statItemLabel}>Total</Text>
                </View>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                  <View style={styles.statItemIcon}>
                    <Ionicons name="earth" size={16} color={theme.red} />
                </View>
                <View>
                  <Text style={styles.statItemValue}>
                    {cars.filter((c) => c.is_public).length}
                  </Text>
                  <Text style={styles.statItemLabel}>Public</Text>
                </View>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={styles.statItemIcon}>
                  <Ionicons name="lock-closed" size={16} color={theme.red} />
                </View>
                <View>
                  <Text style={styles.statItemValue}>
                    {cars.filter((c) => !c.is_public).length}
                  </Text>
                  <Text style={styles.statItemLabel}>Private</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Main Content */}
        {loading ? (
          <View style={{ minHeight: 200 }} />
        ) : cars.length === 0 ? (
          <View style={styles.emptyStateWrap}>
            <View style={styles.emptyStateIcon}>
              <Ionicons name="car-sport" size={56} color={theme.red} />
            </View>
            <Text style={styles.emptyStateTitle}>No Builds Yet</Text>
            <Text style={styles.emptyStateText}>
              Start by adding your first car to your garage
            </Text>
            <TouchableOpacity
              onPress={() => {
                setEditingCar(null);
                setModalOpen(true);
              }}
              style={styles.emptyStateButton}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[theme.red, "rgba(255, 0, 47, 0.8)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingHorizontal: 28, paddingVertical: 16, borderRadius: 12, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={styles.emptyStateButtonText}>Add Your First Build</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={cars}
            keyExtractor={(c) => c.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 12, paddingBottom: 120 }}
            refreshControl={
              <RefreshControl
                tintColor={theme.red}
                colors={[theme.red]}
                refreshing={refreshing}
                onRefresh={onRefresh}
              />
            }
            removeClippedSubviews={true}
            initialNumToRender={6}
            maxToRenderPerBatch={8}
            windowSize={7}
            updateCellsBatchingPeriod={50}
          />
        )}
        <LoadingOverlay visible={loading} />
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
              return exists ? prev.map((c) => (c.id === saved.id ? saved : c)) : [saved, ...prev];
            });
          }}
        />
      )}
    </SafeAreaView>
  );
}

/* =================== OPTIMIZED MODAL (Mobile-First) =================== */
const CarModal = ({ visible, onClose, user, initialCar, onSaved }) => {
  const insets = useSafeAreaInsets();
  const isEdit = !!initialCar;
  const [year, setYear] = useState(initialCar?.year ? String(initialCar.year) : "");
  const [make, setMake] = useState(initialCar?.make ?? "");
  const [model, setModel] = useState(initialCar?.model ?? "");
  const [mileage, setMileage] = useState(
    typeof initialCar?.mileage === "number" ? String(initialCar.mileage) : ""
  );
  const [coverUrl, setCoverUrl] = useState(initialCar?.cover_url ?? null);
  const [saving, setSaving] = useState(false);

  const pickCover = async () => {
    try {
      const url = await pickAndUploadPhoto(supabase, initialCar?.id || "temp");
      if (url) setCoverUrl(url);
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
        const { data, error } = await supabase.from("cars").insert(payload).select().single();
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
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.modalSafe, { paddingBottom: 0 }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalKbWrap}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          {/* Header */}
          <View style={styles.modalHeaderBar}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{isEdit ? "Edit Build" : "Add Build"}</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={[
              styles.modalContentWrap,
              { paddingBottom: insets.bottom + 100 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Cover Picker Card */}
            <TouchableOpacity onPress={pickCover} style={styles.coverPickerCard} activeOpacity={0.85}>
              {coverUrl ? (
                <Image source={{ uri: coverUrl }} style={styles.coverImg} />
              ) : (
                <LinearGradient
                  colors={[theme.redDark, "rgba(255,0,47,0.35)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.coverPlaceholder}
                >
                  <Ionicons name="image-outline" size={28} color={theme.text} />
                  <Text style={styles.coverPlaceholderText}>Tap to Upload Cover</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>

            {/* Info Section */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionLabel}>Car Details</Text>

              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                  <LabeledInput label="Year" value={year} onChangeText={setYear} keyboardType="number-pad" />
                </View>
                <View style={styles.halfInput}>
                  <LabeledInput label="Make" value={make} onChangeText={setMake} />
                </View>
              </View>

              <LabeledInput label="Model" value={model} onChangeText={setModel} />
              <LabeledInput
                label="Mileage (km)"
                value={mileage}
                onChangeText={setMileage}
                keyboardType="number-pad"
                placeholder="Optional"
              />
            </View>
          </ScrollView>

          {/* Sticky Footer with Save Button */}
          <View
            style={[
              styles.modalFooterBar,
              { paddingBottom: insets.bottom + 8, paddingTop: 12 },
            ]}
          >
            <TouchableOpacity
              onPress={save}
              disabled={saving}
              style={styles.saveButtonLarge}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.saveButtonText, saving && { opacity: 0.6 }]}>
                {saving ? "Saving..." : "Save Build"}
              </Text>
            </TouchableOpacity>
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
    <TextInput style={styles.input} placeholderTextColor={theme.muted} {...props} />
  </View>
);

/* =================== STYLES =================== */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bgA },
  
  /* ===== INTRO ANIMATION ===== */
  introWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    paddingBottom: 8,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.edge,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.glass,
  },
  logo: { width: 64, height: 26, tintColor: theme.red },
  logoFallback: { backgroundColor: "transparent" },
  introText: { color: theme.text, fontSize: 18, fontWeight: "800", marginTop: 6 },
  introSub: { color: theme.muted, fontSize: 12, marginTop: 2 },

  /* ===== MAIN CONTAINER ===== */
  container: { flex: 1, marginTop: -6 },

  /* ===== HEADER SECTION (Premium) ===== */
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.edge,
    backgroundColor: theme.bgA,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: theme.text,
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  headerCaption: {
    fontSize: 13,
    color: theme.muted,
    marginTop: 3,
    fontWeight: "500",
    letterSpacing: 0.15,
    lineHeight: 15,
  },
  addButton: {
    marginLeft: 16,
  },
  addButtonGradient: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  /* ===== STATS ROW (New Premium Layout) ===== */
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: "rgba(10,10,11,0.85)",
    borderWidth: 1,
    borderColor: theme.edge,
    marginTop: 0,
    gap: 16,
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  statItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255, 0, 47, 0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(255,0,76,0.18)",
  },
  statItemValue: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.text,
    letterSpacing: -0.4,
  },
  statItemLabel: {
    fontSize: 10,
    color: theme.muted,
    marginTop: 2,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: theme.edge,
    marginHorizontal: 2,
    borderRadius: 2,
  },

  /* ===== EMPTY STATE ===== */
  emptyStateWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    minHeight: 300,
  },
  emptyStateIcon: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: theme.glass,
    borderWidth: 1.5,
    borderColor: theme.edge,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.text,
    marginBottom: 10,
    textAlign: "center",
    letterSpacing: -0.4,
  },
  emptyStateText: {
    fontSize: 14,
    color: theme.muted,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 21,
    fontWeight: "500",
  },
  emptyStateButton: {
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  emptyStateButtonText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: -0.2,
  },

  /* ===== CARD (Premium Redesigned) ===== */
  cardWrapper: {
    marginHorizontal: 10,
    marginVertical: 6,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.edge,
  },
  cardInner: {
    overflow: "hidden",
  },
  coverContainer: {
    position: "relative",
    height: 140,
    backgroundColor: theme.glassStrong,
  },
  coverImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  noCover: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.glassStrong,
  },

  /* Badge - Enhanced */
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(10px)",
  },
  badgePublic: {
    backgroundColor: "rgba(0, 201, 126, 0.45)",
    borderWidth: 1,
    borderColor: "rgba(0,201,126,0.85)",
  },
  badgePrivate: {
    backgroundColor: "rgba(255, 0, 47, 0.85)",
  },
  badgeText: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "800",
    marginLeft: 4,
  },

  /* Card Content - Better Spacing */
  cardContent: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: theme.bgB,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  titleArea: {
    flex: 1,
  },
  carTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: theme.text,
    letterSpacing: -0.3,
  },
  carTrim: {
    fontSize: 12,
    color: theme.muted,
    marginTop: 3,
    fontWeight: "600",
  },

  /* Meta Info - Better Design */
  cardMeta: {
    flexDirection: "row",
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.edge,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 13,
    color: theme.muted,
    marginLeft: 6,
    fontWeight: "600",
  },

  /* Action Buttons - Smart Layout */
  cardActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.edge,
    backgroundColor: theme.glass,
  },
  actionButtonDanger: {
    borderColor: "rgba(255, 0, 47, 0.3)",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.text,
    marginLeft: 4,
  },
  actionButtonTextDanger: {
    color: theme.red,
  },

  /* ===== MODAL STYLES (Optimized Mobile) ===== */
  modalSafe: { flex: 1, backgroundColor: theme.bgA },
  modalKbWrap: { flex: 1, flexDirection: "column" },
  modalHeaderBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: theme.edge,
    backgroundColor: theme.bgB,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: { color: theme.text, fontSize: 18, fontWeight: "900", textAlign: "center", flex: 1 },
  cancel: { color: theme.muted, fontWeight: "700", fontSize: 15 },

  modalScroll: { flex: 1 },
  modalContentWrap: { paddingHorizontal: 16, paddingTop: 16 },

  /* Cover Picker */
  coverPickerCard: {
    height: 160,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.edge,
    backgroundColor: theme.glassStrong,
  },
  coverPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  coverPlaceholderText: { color: theme.text, fontSize: 14, fontWeight: "600", marginTop: 10 },
  coverImg: { width: "100%", height: "100%", resizeMode: "cover" },

  /* Info Section */
  infoSection: { marginBottom: 20 },
  sectionLabel: { color: theme.muted, fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },

  rowInputs: { flexDirection: "row", marginBottom: 12 },
  halfInput: { flex: 1, paddingRight: 6 },

  labeledInputWrap: { marginBottom: 12 },
  inputLabel: { color: theme.muted, fontSize: 12, marginBottom: 6, fontWeight: "600" },
  input: {
    backgroundColor: theme.glass,
    color: theme.text,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.edge,
    fontSize: 14,
  },

  /* Sticky Footer */
  modalFooterBar: {
    backgroundColor: theme.bgB,
    borderTopWidth: 1,
    borderColor: theme.edge,
    paddingHorizontal: 16,
  },
  saveButtonLarge: {
    backgroundColor: theme.red,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: { color: theme.text, fontSize: 16, fontWeight: "900" },
});
