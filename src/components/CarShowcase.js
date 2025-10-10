// components/CarShowcase.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function CarShowcase({
  cars,
  onSelect,
  title = "Build Showcase",
}) {
  if (!cars || cars.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No builds yet. Add one to light up your garage 🔧
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        horizontal
        data={cars}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.cardWrapper}
            onPress={() => onSelect?.(item)}
          >
            <LinearGradient colors={["#0d0d0d", "#0a0000"]} style={styles.card}>
              <Image
                source={{ uri: item.cover_url }}
                style={styles.image}
                resizeMode="cover"
              />
              <View style={styles.info}>
                <Text style={styles.carName}>
                  {item.make} {item.model}
                </Text>
                <Text style={styles.carSub}>
                  {item.year} {item.trim || ""}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", marginTop: 20 },
  sectionTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 1,
    marginLeft: 12,
    marginBottom: 10,
  },
  cardWrapper: {
    marginHorizontal: 10,
    borderRadius: 16,
    overflow: "hidden",
  },
  card: {
    width: width * 0.6,
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,0,64,0.3)",
    shadowColor: "#ff0040",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  image: {
    width: "100%",
    height: "75%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  info: {
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  carName: { color: "#fff", fontWeight: "600", fontSize: 14 },
  carSub: { color: "#999", fontSize: 12 },
  emptyContainer: { alignItems: "center", marginTop: 20 },
  emptyText: { color: "#777", fontSize: 13, textAlign: "center" },
});
