import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../constants/colors";

const { width, height } = Dimensions.get("window");

export default function LoadingScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Scale animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Continuous rotation for loading indicator
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Fallback gradient colors in case colors.darkGradient fails
  const gradientColors = colors?.darkGradient || ["#000000", "#1a1a1a"];

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={colors?.primary || "#000000"} />
      <LinearGradient colors={gradientColors} style={styles.gradient}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Logo/Brand */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            {(() => {
              try {
                return (
                  <Image
                    source={require("./midnte.png")}
                    style={styles.logoImage}
                    resizeMode="contain"
                    onError={() => console.error("Failed to load logo image")}
                  />
                );
              } catch (error) {
                // If image fails, show text instead
                return (
                  <Text style={styles.logoFallback}>MIDNITE</Text>
                );
              }
            })()}
          </Animated.View>

          {/* Tagline */}
          <Text style={styles.tagline}>The 24/7 Car Meet</Text>
          <Text style={styles.description}>
            Instagram but for car enthusiasts
          </Text>

          {/* Loading indicator */}
          <View style={styles.loadingContainer}>
            <Animated.View
              style={[
                styles.loadingCircle,
                {
                  transform: [{ rotate: rotation }],
                },
              ]}
            >
              <View style={styles.loadingDot} />
            </Animated.View>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>

          {/* Animated dots */}
          <View style={styles.dotsContainer}>
            <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
            <Animated.View
              style={[
                styles.dot,
                {
                  opacity: pulseAnim,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
            <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoImage: {
    width: 200,
    height: 80,
  },
  tagline: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 1,
  },
  description: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 40,
    textAlign: "center",
  },
  loadingContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  loadingCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.red,
    borderTopColor: "transparent",
    marginBottom: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.red,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 12,
    letterSpacing: 1,
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors?.red || "#ef4444",
    marginHorizontal: 4,
  },
  logoFallback: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors?.textSecondary || "#ffffff",
  },
});
