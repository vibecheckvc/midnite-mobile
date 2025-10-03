import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../lib/supabase";
import { colors } from "../../constants/colors";

export default function OverviewTab({ car }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  // modal state
  const [activeModal, setActiveModal] = useState(null); // "part" | "task" | "maintenance" | "timeline" | "photo"
  const [form, setForm] = useState({});

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [parts, tasks, maintenance, photos] = await Promise.all([
        supabase.from("car_parts").select("id").eq("car_id", car.id),
        supabase.from("car_tasks").select("id").eq("car_id", car.id),
        supabase.from("maintenance_logs").select("id").eq("car_id", car.id),
        supabase.from("car_photos").select("id").eq("car_id", car.id),
      ]);

      setStats({
        parts: parts.data?.length || 0,
        tasks: tasks.data?.length || 0,
        maintenance: maintenance.data?.length || 0,
        photos: photos.data?.length || 0,
      });
    } catch (e) {
      console.error("Error loading stats:", e);
    } finally {
      setLoading(false);
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    Animated.spring(anim, {
      toValue: menuOpen ? 0 : 1,
      useNativeDriver: true,
    }).start();
  };

  const menuItems = [
    { icon: "construct-outline", label: "Add Part", type: "part" },
    { icon: "checkbox-outline", label: "Add Task", type: "task" },
    { icon: "build-outline", label: "Add Maintenance", type: "maintenance" },
    { icon: "time-outline", label: "Add Timeline", type: "timeline" },
    { icon: "images-outline", label: "Add Photo", type: "photo" },
  ];

  const handleSave = async () => {
    try {
      if (activeModal === "part") {
        await supabase.from("car_parts").insert([
          { car_id: car.id, name: form.name, category: form.category, cost: Number(form.cost || 0) },
        ]);
      } else if (activeModal === "task") {
        await supabase.from("car_tasks").insert([{ car_id: car.id, title: form.title }]);
      } else if (activeModal === "maintenance") {
        await supabase.from("maintenance_logs").insert([
          {
            car_id: car.id,
            type: form.type,
            interval_miles: Number(form.interval_miles || 0),
            last_done_miles: Number(form.last_done_miles || 0),
          },
        ]);
      } else if (activeModal === "timeline") {
        await supabase.from("build_timeline").insert([
          { car_id: car.id, title: form.title, description: form.description, date: form.date },
        ]);
      } else if (activeModal === "photo") {
        // Later hook in image picker
        await supabase.from("car_photos").insert([
          { car_id: car.id, user_id: car.user_id, url: form.url, caption: form.caption },
        ]);
      }

      Alert.alert("Success", `Added new ${activeModal}!`);
      setActiveModal(null);
      setForm({});
      loadStats();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to save");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
        {/* Cover */}
        <LinearGradient colors={["#2e003e", "#5a0e2f"]} style={styles.coverGradient}>
          {car.cover_url ? (
            <Image source={{ uri: car.cover_url }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="car-sport" size={56} color="#fff" />
              <Text style={styles.coverPlaceholderText}>No Cover</Text>
            </View>
          )}
        </LinearGradient>

        {/* Car Info */}
        <View style={styles.infoCard}>
          <Text style={styles.carTitle}>
            {car.year} {car.make} {car.model}
          </Text>
          {car.trim ? <Text style={styles.trim}>{car.trim}</Text> : null}
          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Ionicons name="speedometer-outline" size={14} color="#fff" />
              <Text style={styles.metaText}>{car.mileage?.toLocaleString() ?? 0} mi</Text>
            </View>
            <View style={styles.metaPill}>
              <Ionicons name={car.is_public ? "earth" : "lock-closed"} size={14} color="#fff" />
              <Text style={styles.metaText}>{car.is_public ? "Public" : "Private"}</Text>
            </View>
          </View>
          <Text style={styles.created}>Added on {new Date(car.created_at).toLocaleDateString()}</Text>
        </View>

        {/* Quick Stats */}
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsGrid}>
          {loading ? (
            <ActivityIndicator color="#ff4d6d" style={{ marginTop: 20 }} />
          ) : (
            <>
              <StatCard label="Parts" value={stats.parts} icon="construct-outline" />
              <StatCard label="Tasks" value={stats.tasks} icon="checkbox-outline" />
              <StatCard label="Maintenance" value={stats.maintenance} icon="build-outline" />
              <StatCard label="Photos" value={stats.photos} icon="images-outline" />
            </>
          )}
        </View>
      </ScrollView>

      {/* Floating Menu */}
      <View style={styles.fabContainer}>
        {menuItems.map((item, index) => {
          const angle = (index * (Math.PI / (menuItems.length - 1))) - Math.PI / 2;
          const x = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 80 * Math.cos(angle)] });
          const y = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 80 * Math.sin(angle)] });
          return (
            <Animated.View
              key={item.label}
              style={[
                styles.menuItem,
                { transform: [{ translateX: x }, { translateY: y }], opacity: anim },
              ]}
            >
              <TouchableOpacity style={styles.menuButton} onPress={() => setActiveModal(item.type)}>
                <Ionicons name={item.icon} size={20} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        <TouchableOpacity style={styles.fab} onPress={toggleMenu}>
          <LinearGradient colors={["#ff4d6d", "#5a0e2f"]} style={styles.fabInner}>
            <Ionicons name={menuOpen ? "close" : "add"} size={26} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Modal */}
      <Modal visible={!!activeModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {activeModal === "part" && "Add Part"}
              {activeModal === "task" && "Add Task"}
              {activeModal === "maintenance" && "Add Maintenance"}
              {activeModal === "timeline" && "Add Timeline Event"}
              {activeModal === "photo" && "Add Photo"}
            </Text>

            {/* Dynamic Inputs */}
            {activeModal === "part" && (
              <>
                <Input label="Name" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
                <Input label="Category" value={form.category} onChangeText={(t) => setForm({ ...form, category: t })} />
                <Input label="Cost" value={form.cost} onChangeText={(t) => setForm({ ...form, cost: t })} keyboardType="number-pad" />
              </>
            )}
            {activeModal === "task" && (
              <Input label="Task Title" value={form.title} onChangeText={(t) => setForm({ ...form, title: t })} />
            )}
            {activeModal === "maintenance" && (
              <>
                <Input label="Type" value={form.type} onChangeText={(t) => setForm({ ...form, type: t })} />
                <Input label="Interval Miles" value={form.interval_miles} onChangeText={(t) => setForm({ ...form, interval_miles: t })} keyboardType="number-pad" />
                <Input label="Last Done Miles" value={form.last_done_miles} onChangeText={(t) => setForm({ ...form, last_done_miles: t })} keyboardType="number-pad" />
              </>
            )}
            {activeModal === "timeline" && (
              <>
                <Input label="Title" value={form.title} onChangeText={(t) => setForm({ ...form, title: t })} />
                <Input label="Description" value={form.description} onChangeText={(t) => setForm({ ...form, description: t })} />
                <Input label="Date (YYYY-MM-DD)" value={form.date} onChangeText={(t) => setForm({ ...form, date: t })} />
              </>
            )}
            {activeModal === "photo" && (
              <>
                <Input label="Image URL" value={form.url} onChangeText={(t) => setForm({ ...form, url: t })} />
                <Input label="Caption" value={form.caption} onChangeText={(t) => setForm({ ...form, caption: t })} />
              </>
            )}

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const Input = ({ label, ...props }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={{ color: "#fff", fontWeight: "600", marginBottom: 4 }}>{label}</Text>
    <View style={{ backgroundColor: "#2e003e", borderRadius: 8, paddingHorizontal: 10 }}>
      <TextInput style={{ height: 40, color: "#fff" }} {...props} />
    </View>
  </View>
);

const StatCard = ({ label, value, icon }) => (
  <LinearGradient colors={["#5a0e2f", "#2e003e"]} style={styles.statCard}>
    <Ionicons name={icon} size={24} color="#ff4d6d" />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </LinearGradient>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  coverGradient: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    height: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  coverImage: { width: "100%", height: "100%", borderRadius: 16 },
  coverPlaceholder: { alignItems: "center", justifyContent: "center" },
  coverPlaceholderText: { color: "#fff", marginTop: 8 },
  infoCard: {
    backgroundColor: "#1a0d1f",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#5a0e2f",
  },
  carTitle: { fontSize: 24, fontWeight: "900", color: "#fff" },
  trim: { fontSize: 14, color: "#ff4d6d", marginTop: 4, fontWeight: "600" },
  metaRow: { flexDirection: "row", gap: 10, marginVertical: 10 },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  metaText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  created: { fontSize: 12, color: "#bbb", marginTop: 6 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ff4d6d",
    marginBottom: 12,
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "47%",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,77,109,0.4)",
  },
  statValue: { fontSize: 20, fontWeight: "900", marginTop: 8, color: "#fff" },
  statLabel: { fontSize: 13, color: "#ddd", marginTop: 2 },

  /* FAB + Menu */
  fabContainer: { position: "absolute", bottom: 24, right: 24, alignItems: "center", justifyContent: "center" },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 6,
    shadowColor: "#ff4d6d",
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabInner: { flex: 1, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  menuItem: { position: "absolute", bottom: 0, right: 0 },
  menuButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#5a0e2f",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  modalCard: {
    width: "90%",
    backgroundColor: "#1a0d1f",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#5a0e2f",
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 12 },
  modalActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  cancelText: { color: "#bbb", fontWeight: "600" },
  saveText: { color: "#ff4d6d", fontWeight: "800" },
});
