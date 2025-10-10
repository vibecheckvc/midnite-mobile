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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";

import OverviewTab from "../components/carTabs/OverviewTab";
import MaintenanceTab from "../components/carTabs/MaintenanceTab";
import PartsTab from "../components/carTabs/PartsTab";
import PhotosTab from "../components/carTabs/PhotosTab";
import TasksTab from "../components/carTabs/TasksTab";
import TimelineTab from "../components/carTabs/TimelineTab";

const RED = "#ff375f",
  BG = "#000000",
  BORDER = "rgba(255,55,95,0.2)",
  TEXT = "#ffffff",
  MUTED = "#8e8e93";

export default function CarDetailScreen({ route, navigation }) {
  const { car: passedCar, carId: passedCarId } = route.params || {};
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
  const common = { car, supabase, onReload: reloadAll }; // ✅ removed key from spread

  // 🔹 Loading / not found states
  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={RED} />
      </View>
    );
  }

  if (!car) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ color: TEXT }}>Car not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()}>
          <Ionicons name="arrow-back-outline" size={22} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {car?.make} {car?.model} <Text style={{ color: RED }}>•</Text>{" "}
          {car?.year}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { width }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ position: "relative" }}
        >
          {tabs.map((t, i) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setActive(i)}
              style={[styles.tabBtn, { width: tabW }]}
            >
              <Ionicons
                name={t.icon}
                size={16}
                color={i === active ? "#fff" : MUTED}
              />
              <Text
                style={[styles.tabTxt, i === active && { color: "#fff" }]}
                numberOfLines={1}
              >
                {t.key}
              </Text>
            </TouchableOpacity>
          ))}
          <Animated.View
            style={[styles.underline, { left: underlineX, width: tabW }]}
          />
        </ScrollView>
      </View>

      {/* Body (lazy render only active tab for speed) */}
      <View style={{ flex: 1 }}>
        {active === 0 && <OverviewTab {...common} key={`overview-${refreshKey}`} />}
        {active === 1 && <MaintenanceTab {...common} key={`maint-${refreshKey}`} />}
        {active === 2 && <PartsTab {...common} key={`parts-${refreshKey}`} />}
        {active === 3 && <PhotosTab {...common} key={`photos-${refreshKey}`} />}
        {active === 4 && <TasksTab {...common} key={`tasks-${refreshKey}`} />}
        {active === 5 && <TimelineTab {...common} key={`timeline-${refreshKey}`} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerTitle: {
    color: TEXT,
    fontWeight: "700",
    fontSize: 18,
    letterSpacing: -0.4,
  },
  tabBar: {
    borderTopWidth: 0.5,
    borderBottomWidth: 0,
    borderColor: BORDER,
    backgroundColor: "rgba(28,28,30,0.95)",
  },
  tabBtn: {
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tabTxt: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  underline: {
    position: "absolute",
    bottom: 0,
    height: 2,
    backgroundColor: RED,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
});
