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

export default function CarShowcase({ cars, onSelect, title = "Build Showcase" }) {
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
            <LinearGradient
              colors={["#0d0d0d", "#1a0000"]}
              style={styles.card}
            >
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
        removeClippedSubviews={true}
        initialNumToRender={4}
        maxToRenderPerBatch={6}
        windowSize={5}
        updateCellsBatchingPeriod={50}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", marginTop: 20 },
  sectionTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 17,
    letterSpacing: -0.3,
    marginLeft: 16,
    marginBottom: 14,
  },
  cardWrapper: {
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 16,
    overflow: "hidden",
  },
  card: {
    width: width * 0.65,
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,0,76,0.25)",
  },
  image: {
    width: "100%",
    height: "70%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  info: {
    padding: 12,
    backgroundColor: "rgba(10,10,11,0.95)",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  carName: { 
    color: "#fff", 
    fontWeight: "700", 
    fontSize: 15, 
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  carSub: { color: "#8b8b90", fontSize: 12, fontWeight: "500" },
  emptyContainer: { alignItems: "center", marginTop: 20 },
  emptyText: { color: "#777", fontSize: 13, textAlign: "center" },
});
