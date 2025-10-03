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
import { carPartsService } from "../../services/carPartsService";

export default function PartsTab({ carId }) {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPart, setEditingPart] = useState(null);

  useEffect(() => {
    loadParts();
  }, []);

  const loadParts = async () => {
    setLoading(true);
    const { data, error } = await carPartsService.getParts(carId);
    if (error) {
      console.error(error);
      Alert.alert("Error", "Could not load parts.");
    } else {
      setParts(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const { error } = await carPartsService.deletePart(id);
    if (error) {
      Alert.alert("Error", "Failed to delete part.");
    } else {
      setParts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleSave = async (part) => {
    if (editingPart) {
      const { data, error } = await carPartsService.updatePart(editingPart.id, part);
      if (error) Alert.alert("Error", "Update failed");
      else setParts((prev) => prev.map((p) => (p.id === data.id ? data : p)));
    } else {
      const { data, error } = await carPartsService.addPart({ ...part, car_id: carId });
      if (error) Alert.alert("Error", "Add failed");
      else setParts((prev) => [data, ...prev]);
    }
    setShowModal(false);
    setEditingPart(null);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <Text style={styles.loading}>Loading parts...</Text>
      ) : parts.length === 0 ? (
        <Text style={styles.empty}>No parts logged yet.</Text>
      ) : (
        <FlatList
          data={parts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.partCard}>
              <View>
                <Text style={styles.partName}>{item.name}</Text>
                <Text style={styles.partMeta}>
                  {item.category || "Uncategorized"} • ${item.cost || 0}
                </Text>
                <Text
                  style={[
                    styles.installed,
                    { color: item.installed ? colors.green : colors.warning },
                  ]}
                >
                  {item.installed ? "Installed" : "Not Installed"}
                </Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => {
                    setEditingPart(item);
                    setShowModal(true);
                  }}
                >
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
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setEditingPart(null);
          setShowModal(true);
        }}
      >
        <Ionicons name="add" size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      {showModal && (
        <PartModal
          visible={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingPart(null);
          }}
          onSave={handleSave}
          initialData={editingPart}
        />
      )}
    </View>
  );
}

/* -------------------- Modal -------------------- */
function PartModal({ visible, onClose, onSave, initialData }) {
  const [name, setName] = useState(initialData?.name || "");
  const [category, setCategory] = useState(initialData?.category || "");
  const [cost, setCost] = useState(String(initialData?.cost || ""));
  const [installed, setInstalled] = useState(initialData?.installed || false);

  const save = () => {
    if (!name.trim()) {
      Alert.alert("Missing info", "Part name is required.");
      return;
    }
    onSave({
      name,
      category,
      cost: Number(cost) || 0,
      installed,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>{initialData ? "Edit Part" : "Add Part"}</Text>

        <FormInput label="Name" value={name} onChangeText={setName} />
        <FormInput label="Category" value={category} onChangeText={setCategory} />
        <FormInput
          label="Cost"
          value={cost}
          onChangeText={setCost}
          keyboardType="number-pad"
        />

        {/* Installed toggle */}
        <TouchableOpacity
          style={styles.toggle}
          onPress={() => setInstalled((prev) => !prev)}
        >
          <Ionicons
            name={installed ? "checkbox-outline" : "square-outline"}
            size={22}
            color={installed ? colors.green : colors.textMuted}
          />
          <Text style={styles.toggleText}>
            {installed ? "Installed" : "Not Installed"}
          </Text>
        </TouchableOpacity>

        <View style={styles.modalActions}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={save}>
            <Text style={styles.save}>Save</Text>
          </TouchableOpacity>
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
  partCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.accent,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  partName: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  partMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  installed: { fontSize: 12, marginTop: 4 },
  actions: { flexDirection: "row", gap: 14 },

  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.purple,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },

  /* Modal */
  modalContainer: { flex: 1, backgroundColor: colors.background, padding: 20 },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 20,
    textAlign: "center",
  },
  inputWrap: { marginBottom: 14 },
  inputLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
    backgroundColor: colors.inputBackground,
  },
  toggle: { flexDirection: "row", alignItems: "center", marginTop: 16, marginBottom: 20 },
  toggleText: { marginLeft: 8, color: colors.textPrimary },
  modalActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  cancel: { color: colors.textMuted, fontWeight: "600" },
  save: { color: colors.purple, fontWeight: "700" },
});
