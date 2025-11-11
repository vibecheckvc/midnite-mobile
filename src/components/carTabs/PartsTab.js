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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { deleteRow, withUser } from "../../utils/supabaseHelpers";

const RED = "#b10f2e",
  BG = "#0b0b0c",
  CARD = "rgba(255,255,255,0.04)",
  BORDER = "rgba(255,255,255,0.08)",
  TEXT = "#f6f6f7",
  MUTED = "#a9a9b3";

const TABLE = "car_parts";

export default function PartsTab({ car, user, supabase, onReload }) {
  const [rows, setRows] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [f, setF] = useState({ name: "", category: "", cost: "" });

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
      Alert.alert("Error", error.message);
    }
  }, [car?.id, supabase]);

  useEffect(() => {
    load();
  }, [load]);

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
    setF({ name: "", category: "", cost: "" });
    setShow(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setF({
      name: r.name || "",
      category: r.category || "",
      cost: r.cost != null ? String(r.cost) : "",
    });
    setShow(true);
  };

  const save = async () => {
    if (!f.name.trim()) return Alert.alert("Missing", "Part name required.");

    const basePayload = {
      car_id: car.id,
      name: f.name.trim(),
      category: f.category?.trim() || null,
      cost: f.cost ? Number(f.cost) : null,
    };

    const payload = withUser(basePayload, user);

    try {
      if (editing) {
        // Optimistic update
        setRows((prev) => prev.map((x) => (x.id === editing.id ? { ...x, ...payload } : x)));
        const { error } = await supabase.from(TABLE).update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const temp = { id: `temp_${Date.now()}`, created_at: new Date().toISOString(), installed: false, ...payload };
        setRows((prev) => [temp, ...prev]);
        const { data, error } = await supabase.from(TABLE).insert(payload).select().single();
        if (error) throw error;
        setRows((prev) => [data, ...prev.filter((r) => r.id !== temp.id)]);
      }
      setShow(false);
      onReload?.();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const toggleInstalled = async (r) => {
    const newInstalled = !r.installed;
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, installed: newInstalled } : x)));
    try {
      const { error } = await supabase.from(TABLE).update({ installed: newInstalled }).eq("id", r.id);
      if (error) throw error;
      onReload?.();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  // Delete via helper
  const del = (id) =>
    Alert.alert("Delete part?", "This cannot be undone.", [
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

  const Item = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{item.name}</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            onPress={() => toggleInstalled(item)}
            style={[styles.chip, item.installed && styles.chipOn]}
          >
            <Text style={styles.chipTxt}>{item.installed ? "Installed" : "Install"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}>
            <Ionicons name="create-outline" size={18} color={TEXT} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => del(item.id)} style={styles.iconBtnDanger}>
            <Ionicons name="trash-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.meta}>
        {item.category || "—"} {item.cost != null ? `· $${Number(item.cost).toLocaleString()}` : ""}
      </Text>
    </View>
  );

  return (
    <View style={styles.wrap}>
      <FlatList
        data={rows}
        keyExtractor={(x) => String(x.id)}
        renderItem={Item}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        // Perf defaults
        removeClippedSubviews={true}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        updateCellsBatchingPeriod={50}
        refreshControl={
          <RefreshControl tintColor={RED} refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <TouchableOpacity onPress={openAdd} style={styles.primary}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.primaryTxt}>Add Part</Text>
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
            <Text style={styles.modalTitle}>{editing ? "Edit Part" : "New Part"}</Text>
            <TouchableOpacity onPress={save}>
              <Text style={styles.save}>Save</Text>
            </TouchableOpacity>
          </View>
          <View style={{ padding: 16 }}>
            <Field label="Name" value={f.name} onChangeText={(t) => setF({ ...f, name: t })} />
            <Field
              label="Category"
              value={f.category}
              onChangeText={(t) => setF({ ...f, category: t })}
            />
            <Field
              label="Cost"
              value={f.cost}
              onChangeText={(t) => setF({ ...f, cost: t })}
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
  card: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 16, padding: 14, marginBottom: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: TEXT, fontWeight: "800", fontSize: 16 },
  meta: { color: MUTED, marginTop: 6 },
  chip: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  chipOn: { backgroundColor: "rgba(177,15,46,0.25)", borderColor: "rgba(177,15,46,0.55)" },
  chipTxt: { color: TEXT, fontSize: 12, fontWeight: "600", textAlign: "center" },
  iconBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    padding: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  iconBtnDanger: {
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
