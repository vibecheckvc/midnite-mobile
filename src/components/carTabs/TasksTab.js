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
import { carTasksService } from "../../services/carTasksService";

export default function TasksTab({ carId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    const { data, error } = await carTasksService.getTasks(carId);
    if (error) Alert.alert("Error", "Could not load tasks");
    else setTasks(data || []);
    setLoading(false);
  };

  const toggleCompleted = async (task) => {
    const { data, error } = await carTasksService.updateTask(task.id, {
      completed: !task.completed,
    });
    if (error) Alert.alert("Error", "Update failed");
    else setTasks((prev) => prev.map((t) => (t.id === data.id ? data : t)));
  };

  const handleDelete = async (id) => {
    const { error } = await carTasksService.deleteTask(id);
    if (error) Alert.alert("Error", "Failed to delete task");
    else setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSave = async (task) => {
    if (editingTask) {
      const { data, error } = await carTasksService.updateTask(editingTask.id, task);
      if (error) Alert.alert("Error", "Update failed");
      else setTasks((prev) => prev.map((t) => (t.id === data.id ? data : t)));
    } else {
      const { data, error } = await carTasksService.addTask({ ...task, car_id: carId });
      if (error) Alert.alert("Error", "Add failed");
      else setTasks((prev) => [data, ...prev]);
    }
    setShowModal(false);
    setEditingTask(null);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <Text style={styles.loading}>Loading tasks...</Text>
      ) : tasks.length === 0 ? (
        <Text style={styles.empty}>No tasks yet.</Text>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.taskCard}>
              <TouchableOpacity onPress={() => toggleCompleted(item)}>
                <Ionicons
                  name={item.completed ? "checkbox-outline" : "square-outline"}
                  size={22}
                  color={item.completed ? colors.green : colors.textMuted}
                />
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text
                  style={[
                    styles.taskTitle,
                    item.completed && { textDecorationLine: "line-through", color: colors.textMuted },
                  ]}
                >
                  {item.title}
                </Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => { setEditingTask(item); setShowModal(true); }}>
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
      <TouchableOpacity style={styles.fab} onPress={() => { setEditingTask(null); setShowModal(true); }}>
        <Ionicons name="add" size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      {showModal && (
        <TaskModal
          visible={showModal}
          onClose={() => { setShowModal(false); setEditingTask(null); }}
          onSave={handleSave}
          initialData={editingTask}
        />
      )}
    </View>
  );
}

/* -------------------- Modal -------------------- */
function TaskModal({ visible, onClose, onSave, initialData }) {
  const [title, setTitle] = useState(initialData?.title || "");

  const save = () => {
    if (!title.trim()) {
      Alert.alert("Missing info", "Task title is required.");
      return;
    }
    onSave({ title, completed: initialData?.completed || false });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>{initialData ? "Edit Task" : "Add Task"}</Text>
        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>Task</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Install coilovers"
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <View style={styles.modalActions}>
          <TouchableOpacity onPress={onClose}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity onPress={save}><Text style={styles.save}>Save</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { textAlign: "center", color: colors.textMuted, marginTop: 20 },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 20 },
  taskCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
  },
  taskTitle: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  actions: { flexDirection: "row", gap: 14, marginLeft: 12 },
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
