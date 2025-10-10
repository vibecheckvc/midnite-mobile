import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { deleteRow, toLocalISODate, withUser } from "../../utils/supabaseHelpers";

const RED = "#b10f2e",
  BG = "#0b0b0c",
  CARD = "rgba(255,255,255,0.04)",
  BORDER = "rgba(255,255,255,0.08)",
  TEXT = "#f6f6f7",
  MUTED = "#a9a9b3";

const TABLE = "maintenance_logs";

export default function MaintenanceTab({ car, user, supabase, onReload }) {
  const [rows, setRows] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [f, setF] = useState({
    type: "",
    interval_miles: "",
    last_done_miles: "",
    current_miles: "",
    interval_months: "",
    last_done_date: "",
  });

  // Load all maintenance logs for this car
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
      console.error("Load error:", error.message);
      Alert.alert("Error", "Failed to load maintenance logs.");
    }
  }, [car?.id, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  // Real-time updates
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

  const openAdd = () => {
    setEditing(null);
    setF({
      type: "",
      interval_miles: "",
      last_done_miles: "",
      current_miles: String(car?.mileage ?? ""),
      interval_months: "",
      last_done_date: "",
    });
    setShow(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setF({
      type: r.type || "",
      interval_miles: toS(r.interval_miles),
      last_done_miles: toS(r.last_done_miles),
      current_miles: toS(r.current_miles),
      interval_months: toS(r.interval_months),
      last_done_date: r.last_done_date ? String(r.last_done_date).slice(0, 10) : "",
    });
    setShow(true);
  };

  // Add or update maintenance record
  const save = async () => {
    if (!f.type.trim()) return Alert.alert("Missing", "Maintenance type required.");

    // ✅ Fix: ensure valid types, numbers, and date format
    const basePayload = {
      car_id: car.id,
      type: f.type.trim(),
      interval_miles: numOrNull(f.interval_miles),
      last_done_miles: numOrNull(f.last_done_miles),
      current_miles: numOrNull(f.current_miles),
      interval_months: numOrNull(f.interval_months),
      last_done_date: f.last_done_date ? toLocalISODate(f.last_done_date) : null,
      created_at: new Date().toISOString(),
    };

    const payload = withUser(basePayload, user);

    try {
      if (editing) {
        // Optimistic update
        setRows((prev) => prev.map((r) => (r.id === editing.id ? { ...r, ...payload } : r)));
        const { error } = await supabase.from(TABLE).update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const temp = { id: `temp_${Date.now()}`, ...payload };
        setRows((prev) => [temp, ...prev]);

        // ✅ Fix: use .select().single() to confirm insert worked
        const { data, error } = await supabase
          .from(TABLE)
          .insert(payload)
          .select()
          .single();

        if (error) {
          console.error("Insert error:", error.message);
          throw error;
        }

        // Replace temporary entry
        setRows((prev) => [data, ...prev.filter((r) => r.id !== temp.id)]);
      }

      setShow(false);
      setEditing(null);
      onReload?.();
    } catch (error) {
      console.error("Maintenance save error:", error.message);
      Alert.alert("Error", "Failed to save maintenance record.");
    }
  };

  // Mark maintenance as done now
  const markDoneNow = async (r) => {
    const payload = {
      last_done_miles: r.current_miles ?? car?.mileage ?? 0,
      last_done_date: toLocalISODate(new Date()),
    };
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, ...payload } : x)));
    try {
      const { error } = await supabase.from(TABLE).update(payload).eq("id", r.id);
      if (error) throw error;
      onReload?.();
    } catch (error) {
      console.error("Mark done error:", error.message);
      Alert.alert("Error", "Failed to mark maintenance as done.");
    }
  };

  // Delete maintenance entry
  const del = (id) =>
    Alert.alert("Delete entry?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteRow(supabase, TABLE, id, setRows);
          onReload?.();
        },
      },
    ]);

  const Item = ({ item }) => {
    const dueByMiles = (item.last_done_miles ?? 0) + (item.interval_miles ?? 0);
    const milesLeft = Number.isFinite(dueByMiles)
      ? dueByMiles - (item.current_miles ?? 0)
      : null;

    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>{item.type}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity onPress={() => openEdit(item)} style={styles.chip}>
              <Ionicons name="create-outline" size={16} color={TEXT} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => del(item.id)} style={styles.chipDanger}>
              <Ionicons name="trash-outline" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.meta}>
          Interval: {item.interval_miles ? `${item.interval_miles} mi` : "—"}
          {item.interval_months ? ` · ${item.interval_months} mo` : ""}
        </Text>
        <Text style={styles.meta}>
          Last done:{" "}
          {item.last_done_date
            ? new Date(item.last_done_date).toLocaleDateString()
            : "—"}{" "}
          {typeof item.last_done_miles === "number"
            ? `· ${item.last_done_miles.toLocaleString()} mi`
            : ""}
        </Text>
        <Text style={styles.meta}>
          Current miles:{" "}
          {typeof item.current_miles === "number"
            ? item.current_miles.toLocaleString()
            : "—"}
        </Text>
        <Text
          style={[
            styles.meta,
            { color: milesLeft != null && milesLeft < 0 ? RED : MUTED },
          ]}
        >
          {milesLeft != null
            ? milesLeft >= 0
              ? `${milesLeft.toLocaleString()} mi to due`
              : `${Math.abs(milesLeft).toLocaleString()} mi OVERDUE`
            : "—"}
        </Text>
        <View style={{ marginTop: 10 }}>
          <TouchableOpacity onPress={() => markDoneNow(item)} style={styles.primarySm}>
            <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
            <Text style={styles.primaryTxt}>Mark Done Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.wrap}>
      <FlatList
        data={rows}
        keyExtractor={(x) => String(x.id)}
        renderItem={Item}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl tintColor={RED} refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <TouchableOpacity onPress={openAdd} style={styles.primary}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.primaryTxt}>Add Maintenance</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={show}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShow(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShow(false)}>
              <Text style={styles.muted}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editing ? "Edit Maintenance" : "New Maintenance"}
            </Text>
            <TouchableOpacity onPress={save}>
              <Text style={styles.save}>Save</Text>
            </TouchableOpacity>
          </View>
          <View style={{ padding: 16 }}>
            <Field label="Type" value={f.type} onChangeText={(t) => setF({ ...f, type: t })} />
            <Field
              label="Interval (miles)"
              value={f.interval_miles}
              onChangeText={(t) => setF({ ...f, interval_miles: t })}
              keyboardType="numeric"
            />
            <Field
              label="Interval (months)"
              value={f.interval_months}
              onChangeText={(t) => setF({ ...f, interval_months: t })}
              keyboardType="numeric"
            />
            <Field
              label="Last done miles"
              value={f.last_done_miles}
              onChangeText={(t) => setF({ ...f, last_done_miles: t })}
              keyboardType="numeric"
            />
            <Field
              label="Last done date (YYYY-MM-DD)"
              value={f.last_done_date}
              onChangeText={(t) => setF({ ...f, last_done_date: t })}
              keyboardType={Platform.OS === "web" ? "default" : "numbers-and-punctuation"}
            />
            <Field
              label="Current miles"
              value={f.current_miles}
              onChangeText={(t) => setF({ ...f, current_miles: t })}
              keyboardType="numeric"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Field({ label, ...props }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: MUTED, marginBottom: 6 }}>{label}</Text>
      <TextInput
        {...props}
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
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: BG },
  card: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: TEXT, fontWeight: "800", fontSize: 16 },
  meta: { color: MUTED, marginTop: 6 },
  chip: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    padding: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  chipDanger: {
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.6)",
    padding: 8,
    borderRadius: 999,
    backgroundColor: "rgba(239,68,68,0.24)",
  },
  primary: {
    backgroundColor: RED,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  primarySm: {
    backgroundColor: RED,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    alignSelf: "flex-start",
  },
  primaryTxt: { color: "#fff", fontWeight: "800" },
  modal: { flex: 1, backgroundColor: BG },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: { color: TEXT, fontWeight: "800" },
  muted: { color: MUTED },
  save: { color: RED, fontWeight: "800" },
});

function numOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toS(v) {
  return v === null || v === undefined ? "" : String(v);
}
