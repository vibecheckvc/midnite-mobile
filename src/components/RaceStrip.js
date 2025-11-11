// components/RaceStrip.js
import React from "react";
import { View, StyleSheet } from "react-native";

// A lightweight checkered racing strip to add energy between sections
export default function RaceStrip({ height = 10, block = 12 }) {
  const cells = new Array(24).fill(0);
  return (
    <View style={[styles.wrap, { height }]}
      accessibilityRole="image"
      accessibilityLabel="Racing checkered strip"
    >
      {cells.map((_, i) => (
        <View
          key={i}
          style={[
            styles.cell,
            { width: block },
            i % 2 === 0 ? styles.dark : styles.light,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", overflow: "hidden", borderRadius: 8 },
  cell: { height: "100%" },
  dark: { backgroundColor: "#111" },
  light: { backgroundColor: "#2a2a2a" },
});
