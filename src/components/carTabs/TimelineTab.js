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
import { buildTimelineService } from "../../services/buildTimelineService";

export default function TimelineTab({ carId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    const { data, error } = await buildTimelineService.getEvents(carId);
    if (error) Alert.alert("Error", "Could not load timeline");
    else setEvents(data || []);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const { error } = await buildTimelineService.deleteEvent(id);
    if (error) Alert.alert("Error", "Failed to delete event");
    else setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSave = async (event) => {
    if (editingEvent) {
      const { data, error } = await buildTimelineService.updateEvent(editingEvent.id, event);
      if (error) Alert.alert("Error", "Update failed");
      else setEvents((prev) => prev.map((e) => (e.id === data.id ? data : e)));
    } else {
      const { data, error } = await buildTimelineService.addEvent({ ...event, car_id: carId });
      if (error) Alert.alert("Error", "Add failed");
      else setEvents((prev) => [data, ...prev]);
    }
    setShowModal(false);
    setEditingEvent(null);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <Text style={styles.loading}>Loading timeline...</Text>
      ) : events.length === 0 ? (
        <Text style={styles.empty}>No events logged yet.</Text>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.eventCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                {item.description ? <Text style={styles.eventDesc}>{item.description}</Text> : null}
                <Text style={styles.eventDate}>
                  {new Date(item.date).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => { setEditingEvent(item); setShowModal(true); }}>
                  <Ionicons name="create-outline" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Ionicons name="trash-outline" size={20} color={colors.red} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => { setEditingEvent(null); setShowModal(true); }}>
        <Ionicons name="add" size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      {showModal && (
        <TimelineModal
          visible={showModal}
          onClose={() => { setShowModal(false); setEditingEvent(null); }}
          onSave={handleSave}
          initialData={editingEvent}
        />
      )}
    </View>
  );
}

/* -------------------- Modal -------------------- */
function TimelineModal({ visible, onClose, onSave, initialData }) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [date, setDate] = useState(initialData?.date || "");

  const save = () => {
    if (!title.trim() || !date) {
      Alert.alert("Missing info", "Title and Date are required.");
      return;
    }
    onSave({ title, description, date });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>{initialData ? "Edit Event" : "Add Event"}</Text>

        <FormInput label="Title" value={title} onChangeText={setTitle} />
        <FormInput label="Description" value={description} onChangeText={setDescription} />
        <FormInput label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />

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
  eventCard: {
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
  eventTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  eventDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  eventDate: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
  actions: { flexDirection: "row", gap: 12 },
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
