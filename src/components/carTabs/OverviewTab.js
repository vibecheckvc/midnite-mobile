import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, RefreshControl, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { deleteRow, pickAndUploadPhoto, toLocalISODate, withUser } from "../../utils/supabaseHelpers";

const RED = "#b10f2e",
  BG = "#0b0b0c",
  CARD = "rgba(255,255,255,0.04)",
  BORDER = "rgba(255,255,255,0.08)",
  TEXT = "#f6f6f7",
  MUTED = "#a9a9b3";

export default function OverviewTab({ car, supabase, user }) {
  const [counts, setCounts] = useState({
    parts: 0,
    maintenance: 0,
    tasksAll: 0,
    tasksOpen: 0,
    photos: 0,
    timeline: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  // Helper to fetch record counts across related tables
  const fetchCounts = useCallback(async () => {
    if (!car?.id) return;

    const tables = [
      { name: "car_parts", key: "parts" },
      { name: "maintenance_logs", key: "maintenance" },
      { name: "car_tasks", key: "tasksAll" },
      { name: "car_photos", key: "photos" },
      { name: "build_timeline", key: "timeline" },
    ];

    try {
      const results = await Promise.all(
        tables.map((t) =>
          supabase.from(t.name).select("*", { count: "exact", head: true }).eq("car_id", car.id)
        )
      );

      const tasksOpenRes = await supabase
        .from("car_tasks")
        .select("*", { count: "exact", head: true })
        .eq("car_id", car.id)
        .eq("completed", false);

      const newCounts = results.reduce((acc, res, idx) => {
        acc[tables[idx].key] = res.count || 0;
        return acc;
      }, {});
      newCounts.tasksOpen = tasksOpenRes.count || 0;

      setCounts(newCounts);
    } catch (error) {
      console.error("Error fetching overview counts:", error);
    }
  }, [car?.id, supabase]);

  // Initial load
  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // Real-time listeners for changes across all car tables
  useEffect(() => {
    if (!car?.id) return;

    const tables = ["car_parts", "maintenance_logs", "car_tasks", "car_photos", "build_timeline"];
    const channels = tables.map((t, i) =>
      supabase
        .channel(`rt_${t}_${car.id}_${i}`)
        .on("postgres_changes", { event: "*", schema: "public", table: t, filter: `car_id=eq.${car.id}` }, fetchCounts)
        .subscribe()
    );

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [car?.id, supabase, fetchCounts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCounts();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl tintColor={RED} refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.glassCard}>
        <Text style={styles.title}>
          {car?.make} {car?.model} <Text style={{ color: RED }}>•</Text> {car?.year}
        </Text>
        {!!car?.trim && <Text style={styles.subTitle}>{car.trim}</Text>}
        <Text style={styles.meta}>
          {typeof car?.mileage === "number" ? `${car.mileage.toLocaleString()} mi` : "Mileage —"}
        </Text>
      </View>

      <View style={styles.grid}>
        <Stat icon="construct-outline" label="Parts" value={counts.parts} />
        <Stat icon="hammer-outline" label="Maintenance" value={counts.maintenance} />
        <Stat
          icon="checkbox-outline"
          label="Tasks"
          value={`${counts.tasksAll - counts.tasksOpen}/${counts.tasksAll}`}
        />
        <Stat icon="images-outline" label="Photos" value={counts.photos} />
        <Stat icon="time-outline" label="Timeline" value={counts.timeline} />
      </View>

      <View style={styles.glassCard}>
        <Text style={styles.sectionTitle}>Build Overview</Text>
        <Text style={styles.body}>
          Manage parts, tasks, maintenance, photos, and milestones — all live and synced.
        </Text>
      </View>
    </ScrollView>
  );
}

function Stat({ icon, label, value }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={20} color={TEXT} />
      </View>
      <Text style={styles.statValue}>{String(value)}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  glassCard: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 16,
    margin: 16,
    marginBottom: 8,
  },
  title: { color: TEXT, fontSize: 20, fontWeight: "800" },
  subTitle: { color: MUTED, marginTop: 4 },
  meta: { color: MUTED, marginTop: 6 },
  sectionTitle: { color: TEXT, fontWeight: "800", marginBottom: 8 },
  body: { color: MUTED, lineHeight: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16, marginVertical: 8 },
  statCard: {
    width: "31%",
    minWidth: 96,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(177,15,46,0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(177,15,46,0.35)",
  },
  statValue: { color: TEXT, fontSize: 18, fontWeight: "800", marginTop: 8 },
  statLabel: { color: MUTED, fontSize: 12, marginTop: 2 },
});
