// src/screens/CarDetailScreen.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { colors as appColors } from "../constants/colors";

const { width, height } = Dimensions.get("window");

const colors = {
  textPrimary: appColors?.textPrimary || "#fff",
  textMuted: appColors?.textMuted || "#aaa",
  purpleGradient: ["#5a0e2f", "#7c1a40", "#8b5cf6"],
  redGradient: ["#ff004c", "#7a0035"],
  darkGradient: ["#1b0b17", "#2b0d25", "#3a0d2b"],
};

/** ---------- Screen ---------- */
export default function CarDetailScreen({ route }) {
  const { car } = route.params;
  const { user } = useAuth();

  // Preview state
  const [parts, setParts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Orb menu
  const [expanded, setExpanded] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  // Modal + form
  const [activeModal, setActiveModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const actions = useMemo(
    () => [
      { key: "parts", icon: "construct-outline", label: "Part" },
      { key: "tasks", icon: "checkbox-outline", label: "Task" },
      { key: "maintenance", icon: "build-outline", label: "Maintenance" },
      { key: "timeline", icon: "time-outline", label: "Timeline" },
      { key: "photos", icon: "images-outline", label: "Photo" },
    ],
    []
  );

  useEffect(() => {
    loadPreviews();
  }, []);

  const loadPreviews = async () => {
    try {
      setLoading(true);
      const [p, t, m, tl, ph] = await Promise.all([
        supabase.from("car_parts").select("*").eq("car_id", car.id).limit(3),
        supabase.from("car_tasks").select("*").eq("car_id", car.id).limit(3),
        supabase.from("maintenance_logs").select("*").eq("car_id", car.id).limit(2),
        supabase.from("build_timeline").select("*").eq("car_id", car.id).limit(2),
        supabase.from("car_photos").select("*").eq("car_id", car.id).limit(4),
      ]);
      setParts(p.data || []);
      setTasks(t.data || []);
      setMaintenance(m.data || []);
      setTimeline(tl.data || []);
      setPhotos(ph.data || []);
    } finally {
      setLoading(false);
    }
  };

  /** ---------- Orb ---------- */
  const toggleMenu = () => {
    const expanding = !expanded;
    setExpanded(expanding);
    Animated.spring(anim, {
      toValue: expanding ? 1 : 0,
      friction: 6,
      tension: 70,
      useNativeDriver: true,
    }).start();
  };

  const radialPos = (index, total, radius = 110) => {
    const start = -Math.PI / 2;
    const end = Math.PI / 2;
    const step = (end - start) / (total - 1);
    const angle = start + step * index;
    return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
  };

  const openModal = (key) => {
    setForm({});
    setActiveModal(key);
    setExpanded(false);
    Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
  };

  /** ---------- Input ---------- */
  const Input = ({ label, value, onChangeText, ...props }) => (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          value={value ?? ""}
          onChangeText={onChangeText}
          placeholderTextColor={colors.textMuted}
          returnKeyType="done"
          blurOnSubmit={false}
          {...props}
        />
      </View>
    </View>
  );

  /** ---------- Save ---------- */
  const handleSave = async () => {
    if (!activeModal) return;
    setSaving(true);
    try {
      if (activeModal === "parts") {
        const { data, error } = await supabase
          .from("car_parts")
          .insert([{ car_id: car.id, user_id: user?.id, ...form }])
          .select()
          .single();
        if (error) throw error;
        setParts((p) => [data, ...p].slice(0, 3));
      }
      if (activeModal === "tasks") {
        const { data, error } = await supabase
          .from("car_tasks")
          .insert([{ car_id: car.id, user_id: user?.id, ...form }])
          .select()
          .single();
        if (error) throw error;
        setTasks((t) => [data, ...t].slice(0, 3));
      }
      if (activeModal === "maintenance") {
        const { data, error } = await supabase
          .from("maintenance_logs")
          .insert([{ car_id: car.id, user_id: user?.id, ...form }])
          .select()
          .single();
        if (error) throw error;
        setMaintenance((m) => [data, ...m].slice(0, 2));
      }
      if (activeModal === "timeline") {
        const { data, error } = await supabase
          .from("build_timeline")
          .insert([{ car_id: car.id, user_id: user?.id, ...form }])
          .select()
          .single();
        if (error) throw error;
        setTimeline((tl) => [data, ...tl].slice(0, 2));
      }
      if (activeModal === "photos") {
        const { data, error } = await supabase
          .from("car_photos")
          .insert([{ car_id: car.id, user_id: user?.id, ...form }])
          .select()
          .single();
        if (error) throw error;
        setPhotos((ph) => [data, ...ph].slice(0, 4));
      }
      setActiveModal(null);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors.darkGradient} style={StyleSheet.absoluteFill} />

      {/* Background Particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              top: Math.random() * height,
              left: Math.random() * width,
              opacity: 0.15 + Math.random() * 0.3,
            },
          ]}
        />
      ))}

      <ScrollView contentContainerStyle={{ paddingBottom: 180 }}>
        {/* HERO */}
        <View style={styles.hero}>
          <Text style={styles.title}>
            {car.year} {car.make} {car.model}
          </Text>
          <View style={styles.pillRow}>
            <Pill icon="speedometer-outline" text={`${car.mileage ?? 0} mi`} />
            <Pill icon={car.is_public ? "earth" : "lock-closed"} text={car.is_public ? "Public" : "Private"} />
          </View>
        </View>

        {/* HUD */}
        <HUDCard icon="construct-outline" title="Parts" items={parts.map((p) => p.name)} onAdd={() => openModal("parts")} />
        <HUDCard icon="checkbox-outline" title="Tasks" items={tasks.map((t) => t.title)} onAdd={() => openModal("tasks")} />
        <HUDCard icon="build-outline" title="Maintenance" items={maintenance.map((m) => m.type)} onAdd={() => openModal("maintenance")} />
        <HUDCard icon="time-outline" title="Timeline" items={timeline.map((t) => t.title)} onAdd={() => openModal("timeline")} />
        <HUDCard icon="images-outline" title="Photos" items={photos.map((p) => p.url)} onAdd={() => openModal("photos")} />

        {loading && <ActivityIndicator color="#ff1a75" style={{ margin: 20 }} />}
      </ScrollView>

      {/* ORB MENU */}
      <View style={styles.orbWrap}>
        {actions.map((a, i) => {
          const { x, y } = radialPos(i, actions.length);
          const tx = anim.interpolate({ inputRange: [0, 1], outputRange: [0, x] });
          const ty = anim.interpolate({ inputRange: [0, 1], outputRange: [0, y] });
          return (
            <Animated.View
              key={a.key}
              style={[styles.radialItem, { transform: [{ translateX: tx }, { translateY: ty }], opacity: anim }]}
            >
              <TouchableOpacity onPress={() => openModal(a.key)}>
                <LinearGradient colors={colors.purpleGradient} style={styles.radialInner}>
                  <Ionicons name={a.icon} size={22} color="#fff" />
                </LinearGradient>
                <Text style={styles.radialLabel}>{a.label}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
        <TouchableOpacity style={styles.orb} onPress={toggleMenu}>
          <LinearGradient colors={colors.redGradient} style={styles.orbInner}>
            <Ionicons name={expanded ? "close" : "add"} size={34} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* MODAL */}
      <Modal visible={!!activeModal} transparent animationType="fade" onRequestClose={() => setActiveModal(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add {activeModal}</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              {activeModal === "parts" && (
                <>
                  <Input label="Name" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
                  <Input label="Category" value={form.category} onChangeText={(t) => setForm({ ...form, category: t })} />
                </>
              )}
              {activeModal === "tasks" && <Input label="Title" value={form.title} onChangeText={(t) => setForm({ ...form, title: t })} />}
              {activeModal === "maintenance" && (
                <>
                  <Input label="Type" value={form.type} onChangeText={(t) => setForm({ ...form, type: t })} />
                  <Input label="Miles" value={form.current_miles} onChangeText={(t) => setForm({ ...form, current_miles: t })} />
                </>
              )}
              {activeModal === "timeline" && (
                <>
                  <Input label="Title" value={form.title} onChangeText={(t) => setForm({ ...form, title: t })} />
                  <Input label="Date" value={form.date} onChangeText={(t) => setForm({ ...form, date: t })} />
                </>
              )}
              {activeModal === "photos" && (
                <>
                  <Input label="URL" value={form.url} onChangeText={(t) => setForm({ ...form, url: t })} />
                  <Input label="Caption" value={form.caption} onChangeText={(t) => setForm({ ...form, caption: t })} />
                </>
              )}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setActiveModal(null)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={saving ? undefined : handleSave}><Text style={styles.saveText}>{saving ? "Saving..." : "Save"}</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

/** ---------- HUD + Pill ---------- */
const Pill = ({ icon, text }) => (
  <View style={styles.pill}>
    <Ionicons name={icon} size={14} color="#ff1a75" />
    <Text style={styles.pillText}>{text}</Text>
  </View>
);

const HUDCard = ({ icon, title, items, onAdd }) => (
  <LinearGradient colors={["rgba(80,0,60,0.4)", "rgba(50,0,40,0.3)"]} style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Ionicons name={icon} size={18} color="#ff1a75" style={{ marginRight: 6 }} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <TouchableOpacity onPress={onAdd}><Ionicons name="add-circle" size={22} color="#ff1a75" /></TouchableOpacity>
    </View>
    {items.length ? items.map((line, idx) => <Text key={idx} style={styles.cardLine}>• {line}</Text>) : <Text style={styles.cardEmpty}>No {title}</Text>}
  </LinearGradient>
);

/** ---------- Styles ---------- */
const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { alignItems: "center", margin: 16, padding: 20, borderRadius: 20, backgroundColor: "rgba(50,0,40,0.5)" },
  title: { color: "#fff", fontSize: 24, fontWeight: "900", letterSpacing: 1 },
  pillRow: { flexDirection: "row", marginTop: 10, gap: 10 },
  pill: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,0,80,0.1)", padding: 8, borderRadius: 20 },
  pillText: { color: "#fff", marginLeft: 6 },

  card: { margin: 12, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,0,120,0.25)" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  cardTitle: { color: "#fff", fontWeight: "800" },
  cardLine: { color: "#fff", marginTop: 4 },
  cardEmpty: { color: "#bbb", fontStyle: "italic" },

  orbWrap: { position: "absolute", bottom: 50, alignSelf: "center", alignItems: "center" },
  orb: { width: 80, height: 80, borderRadius: 40, overflow: "hidden", elevation: 12 },
  orbInner: { flex: 1, justifyContent: "center", alignItems: "center" },
  radialItem: { position: "absolute", alignItems: "center" },
  radialInner: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  radialLabel: { color: "#fff", fontSize: 10, textAlign: "center", marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 16 },
  modalCard: { backgroundColor: "rgba(40,0,30,0.9)", borderRadius: 20, padding: 20 },
  modalTitle: { color: "#fff", fontWeight: "900", fontSize: 20, marginBottom: 12 },
  modalActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  cancelText: { color: "#bbb" },
  saveText: { color: "#ff1a75", fontWeight: "800" },
  inputLabel: { color: "#ddd", marginBottom: 6 },
  inputWrap: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 10 },
  input: { color: "#fff", padding: 10 },

  particle: { position: "absolute", width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#ff1a75" },
});
