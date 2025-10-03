import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";
import { maintenanceService } from "../../services/maintenanceService";

export default function MaintenanceTab({ carId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLog, setEditingLog] = useState(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    const { data, error } = await maintenanceService.getLogs(carId);
    if (error) Alert.alert("Error", "Could not load maintenance logs");
    else setLogs(data || []);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const { error } = await maintenanceService.deleteLog(id);
    if (error) Alert.alert("Error", "Failed to delete log");
    else setLogs((prev) => prev.filter((l) => l.id !== id));
  };

  const handleSave = async (log) => {
    if (editingLog) {
      const { data, error } = await maintenanceService.updateLog(editingLog.id, log);
      if (error) Alert.alert("Error", "Update failed");
      else setLogs((prev) => prev.map((l) => (l.id === data.id ? data : l)));
    } else {
      const { data, error } = await maintenanceService.addLog({ ...log, car_id: carId });
      if (error) Alert.alert("Error", "Add failed");
      else setLogs((prev) => [data, ...prev]);
    }
    setShowModal(false);
    setEditingLog(null);
  };

  const calculateStatus = (log) => {
    let now = new Date();
    let due = false, dueSoon = false;

    if (log.interval_miles && log.last_done_miles !== null && log.current_miles !== null) {
      const nextDue = log.last_done_miles + log.interval_miles;
      if (log.current_miles >= nextDue) due = true;
      else if (log.current_miles >= nextDue - 500) dueSoon = true;
    }

    if (log.interval_months && log.last_done_date) {
      const last = new Date(log.last_done_date);
      const next = new Date(last);
      next.setMonth(next.getMonth() + log.interval_months);
      if (now >= next) due = true;
      else {
        const warn = new Date(next);
        warn.setDate(next.getDate() - 14);
        if (now >= warn) dueSoon = true;
      }
    }

    if (due) return { label: "Overdue", color: colors.red };
    if (dueSoon) return { label: "Due Soon", color: colors.warning };
    return { label: "OK", color: colors.green };
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <Text style={styles.loading}>Loading logs...</Text>
      ) : logs.length === 0 ? (
        <Text style={styles.empty}>No maintenance logs yet.</Text>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const status = calculateStatus(item);
            return (
              <View style={styles.logCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.logTitle}>{item.type}</Text>
                  <Text style={styles.logMeta}>
                    Last done at {item.last_done_miles ?? "-"} miles
                    {item.last_done_date ? ` (${new Date(item.last_done_date).toLocaleDateString()})` : ""}
                  </Text>
                  {item.interval_miles ? <Text style={styles.logMeta}>Every {item.interval_miles} miles</Text> : null}
                  {item.interval_months ? <Text style={styles.logMeta}>Every {item.interval_months} months</Text> : null}
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[styles.status, { color: status.color }]}>{status.label}</Text>
                  <View style={styles.actions}>
                    <TouchableOpacity onPress={() => { setEditingLog(item); setShowModal(true); }}>
                      <Ionicons name="create-outline" size={20} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)}>
                      <Ionicons name="trash-outline" size={20} color={colors.red} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => { setEditingLog(null); setShowModal(true); }}>
        <Ionicons name="add" size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      {showModal && (
        <MaintenanceModal
          visible={showModal}
          onClose={() => { setShowModal(false); setEditingLog(null); }}
          onSave={handleSave}
          initialData={editingLog}
        />
      )}
    </View>
  );
}

/* -------------------- Modal -------------------- */
function MaintenanceModal({ visible, onClose, onSave, initialData }) {
  const [type, setType] = useState(initialData?.type || "");
  const [intervalMiles, setIntervalMiles] = useState(String(initialData?.interval_miles || ""));
  const [lastDoneMiles, setLastDoneMiles] = useState(String(initialData?.last_done_miles || ""));
  const [currentMiles, setCurrentMiles] = useState(String(initialData?.current_miles || ""));
  const [intervalMonths, setIntervalMonths] = useState(String(initialData?.interval_months || ""));
  const [lastDoneDate, setLastDoneDate] = useState(initialData?.last_done_date || "");

  const save = () => {
    if (!type.trim()) {
      Alert.alert("Missing info", "Maintenance type is required.");
      return;
    }
    onSave({
      type,
      interval_miles: Number(intervalMiles) || null,
      last_done_miles: Number(lastDoneMiles) || null,
      current_miles: Number(currentMiles) || null,
      interval_months: Number(intervalMonths) || null,
      last_done_date: lastDoneDate || null,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>{initialData ? "Edit Log" : "Add Maintenance"}</Text>

        <FormInput label="Type" value={type} onChangeText={setType} />
        <FormInput label="Interval (miles)" value={intervalMiles} onChangeText={setIntervalMiles} keyboardType="number-pad" />
        <FormInput label="Last Done (miles)" value={lastDoneMiles} onChangeText={setLastDoneMiles} keyboardType="number-pad" />
        <FormInput label="Current Miles" value={currentMiles} onChangeText={setCurrentMiles} keyboardType="number-pad" />
        <FormInput label="Interval (months)" value={intervalMonths} onChangeText={setIntervalMonths} keyboardType="number-pad" />
        <FormInput label="Last Done Date" value={lastDoneDate} onChangeText={setLastDoneDate} placeholder="YYYY-MM-DD" />

        <View style={styles.modalActions}>
          <TouchableOpacity onPress={onClose}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity onPress={save}><Text style={styles.save}>Save</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const FormInput = ({ label, ...props }) => (
  <View style={styles.inputWrap}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput style={styles.input} placeholderTextColor={colors.textMuted} {...props} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { textAlign: "center", color: colors.textMuted, marginTop: 20 },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 20 },
  logCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.accent,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  logTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  logMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  status: { fontSize: 13, fontWeight: "700", marginTop: 6 },
  actions: { flexDirection: "row", gap: 12, marginTop: 8 },
  fab: {
    position: "absolute",
    bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center", backgroundColor: colors.purple,
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 6, elevation: 6,
  },
  modalContainer: { flex: 1, backgroundColor: colors.background, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: colors.textPrimary, marginBottom: 20, textAlign: "center" },
  inputWrap: { marginBottom: 14 },
  inputLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: colors.accent, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, color: colors.textPrimary,
    backgroundColor: colors.inputBackground,
  },
  modalActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  cancel: { color: colors.textMuted, fontWeight: "600" },
  save: { color: colors.purple, fontWeight: "700" },
});
