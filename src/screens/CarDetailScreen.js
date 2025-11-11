// src/screens/CarDetailScreen.js
import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  Image,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

import OverviewTab from "../components/carTabs/OverviewTab";
import MaintenanceTab from "../components/carTabs/MaintenanceTab";
import PartsTab from "../components/carTabs/PartsTab";
import PhotosTab from "../components/carTabs/PhotosTab";
import TasksTab from "../components/carTabs/TasksTab";
import TimelineTab from "../components/carTabs/TimelineTab";
import LoadingOverlay from "../components/LoadingOverlay";

const RED = "#ff002f";
const BG = "#000000";
const BG_ALT = "#0a0a0b";
const BORDER = "rgba(255,0,76,0.25)";
const GREEN = "#00c97e";
const TEXT = "#ffffff";
const MUTED = "#8b8b90";
const GLASS = "rgba(255,255,255,0.04)";
const GLASS_STRONG = "rgba(255,255,255,0.08)";

export default function CarDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { car: passedCar, carId: passedCarId } = route.params || {};
  const { user } = useAuth();
  const [car, setCar] = useState(passedCar || null);
  const [loading, setLoading] = useState(!passedCar);
  const [refreshKey, setRefreshKey] = useState(0);

  // 🔹 Fetch from Supabase if only carId was passed
  useEffect(() => {
    if (!car && passedCarId) {
      (async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from("cars")
          .select("*")
          .eq("id", passedCarId)
          .single();
        if (!error && data) setCar(data);
        setLoading(false);
      })();
    }
  }, [car, passedCarId]);

  const tabs = useMemo(
    () => [
      { key: "Overview", icon: "speedometer-outline" },
      { key: "Maintenance", icon: "hammer-outline" },
      { key: "Parts", icon: "construct-outline" },
      { key: "Photos", icon: "images-outline" },
      { key: "Tasks", icon: "checkbox-outline" },
      { key: "Timeline", icon: "time-outline" },
    ],
    []
  );

  const [active, setActive] = useState(0);
  const underlineX = useRef(new Animated.Value(0)).current;
  const width = Dimensions.get("window").width;
  const tabW = Math.max(Math.floor(width / tabs.length), 68);

  useEffect(() => {
    Animated.timing(underlineX, {
      toValue: active * tabW,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [active, tabW]);

  const reloadAll = () => setRefreshKey((k) => k + 1);
  const common = { car, user, supabase, onReload: reloadAll };
  const tabKey = refreshKey;

  // 🔹 Loading / not found states
  if (loading) {
    return (
      <>
        <View style={styles.container} />
        <LoadingOverlay visible={loading} />
      </>
    );
  }

  if (!car) {
    return (
      <View
        style={[styles.container, { justifyContent: "center", alignItems: "center" }]}
      >
        <Text style={{ color: TEXT }}>Car not found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      {/* Hero / Cover */}
      <View style={styles.heroWrap}>
        {car?.cover_url ? (
          <Image source={{ uri: car.cover_url }} style={styles.heroImage} />
        ) : (
          <LinearGradient
            colors={["#190007", "#300010", "#190007"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroImage}
          />
        )}
        <LinearGradient
          colors={["rgba(0,0,0,0.65)", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.85)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.heroOverlay}
        />
        <View style={[styles.heroContent, { paddingTop: insets.top + 8 }]}>
          <View style={styles.heroTopRow}>
            <TouchableOpacity
              onPress={() => navigation?.goBack?.()}
              style={styles.circleBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={18} color={TEXT} />
            </TouchableOpacity>
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.titleMakeModel} numberOfLines={2}>
              {car?.year ? `${car.year} ` : ""}{car?.make} {car?.model}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.subtitleMeta}>
                {car?.mileage ? `${car.mileage.toLocaleString()} mi` : "Mileage TBD"}
                {car?.created_at ? `  •  Added ${new Date(car.created_at).getFullYear()}` : ""}
              </Text>
              <View style={[styles.visibilityBadge, car.is_public ? styles.badgePublic : styles.badgePrivate]}>
                <Ionicons
                  name={car.is_public ? "globe-outline" : "lock-closed-outline"}
                  size={12}
                  color={car.is_public ? GREEN : "#fff"}
                />
                <Text style={[styles.visibilityBadgeTxt, car.is_public && { color: GREEN }]}>{car.is_public ? "Public" : "Private"}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsOuter}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {tabs.map((t, i) => {
            const activeTab = i === active;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setActive(i)}
                style={[styles.tabChip, activeTab && styles.tabChipActive]}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={t.icon}
                  size={16}
                  color={activeTab ? TEXT : MUTED}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.tabLabel, activeTab && styles.tabLabelActive]}>{t.key}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.contentArea}>
        <View style={styles.contentCard}>
          {active === 0 && <OverviewTab key={tabKey} {...common} />}
          {active === 1 && <MaintenanceTab key={tabKey} {...common} />}
          {active === 2 && <PartsTab key={tabKey} {...common} />}
          {active === 3 && <PhotosTab key={tabKey} {...common} />}
          {active === 4 && <TasksTab key={tabKey} {...common} />}
          {active === 5 && <TimelineTab key={tabKey} {...common} />}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  /* Hero */
  heroWrap: {
    width: "100%",
    height: 220,
    position: "relative",
    backgroundColor: BG_ALT,
  },
  heroImage: { width: "100%", height: "100%", resizeMode: "cover" },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  badgesRow: { flexDirection: "row", alignItems: "center" }, // retained but unused after badge move
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 6, flexWrap: "wrap", gap: 10 },
  visibilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  badgePublic: { backgroundColor: "rgba(0,201,126,0.45)", borderColor: "rgba(0,201,126,0.85)", borderWidth: 1 },
  badgePrivate: { backgroundColor: "rgba(255,0,47,0.6)" },
  visibilityBadgeTxt: { color: TEXT, fontSize: 11, fontWeight: "700", marginLeft: 4 },
  titleBlock: {},
  titleMakeModel: {
    color: TEXT,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  subtitleMeta: {
    color: MUTED,
    fontSize: 12,
    marginTop: 6,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  /* Tabs */
  tabsOuter: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: BG_ALT,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: BORDER,
  },
  tabsScrollContent: { paddingRight: 8 },
  tabChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: GLASS,
  },
  tabChipActive: {
    backgroundColor: RED,
    borderColor: RED,
  },
  tabLabel: { color: MUTED, fontSize: 12, fontWeight: "700" },
  tabLabelActive: { color: TEXT },
  /* Content */
  contentArea: { flex: 1, backgroundColor: BG },
  contentCard: {
    flex: 1,
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: GLASS_STRONG,
    overflow: "hidden",
    padding: 14,
  },
});
