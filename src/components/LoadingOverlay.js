import React from "react";
import { View, StyleSheet, Modal, ActivityIndicator } from "react-native";
import { colors } from "../constants/colors";

export default function LoadingOverlay({ visible = false }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.container} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.red} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    padding: 18,
    borderRadius: 12,
    backgroundColor: "rgba(10,10,10,0.85)",
  },
});
