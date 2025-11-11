import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

/**
 * BrandBanner component - motivational messaging to make users feel
 * part of the greatest movement for cars and humanity.
 */
export default function BrandBanner({ message, style }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const defaultMessages = [
    "🚗 Every build tells a story.",
    "🔧 Innovation through passion.",
    "🌍 Part of a global movement.",
    "💨 Speed, precision, community.",
    "⚡ The future of car culture.",
  ];

  const text = message || defaultMessages[Math.floor(Math.random() * defaultMessages.length)];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
        style,
      ]}
    >
      <LinearGradient
        colors={["rgba(177, 15, 46, 0.15)", "rgba(255, 0, 47, 0.08)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Text style={styles.text}>{text}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(177, 15, 46, 0.4)",
  },
  gradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  text: {
    color: "#f6f6f7",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.3,
  },
});
