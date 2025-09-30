import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";

const { width } = Dimensions.get("window");

// Mock data for garage cars
const mockCars = [
  {
    id: "1",
    name: "RX-7 FD",
    year: "1997",
    make: "Mazda",
    model: "RX-7",
    image: "car_1",
    modifications: ["Twin Turbo", "Coilovers", "Widebody Kit"],
    status: "Complete",
    mileage: 45000,
    isFavorite: true,
  },
  {
    id: "2",
    name: "Skyline GT-R",
    year: "1999",
    make: "Nissan",
    model: "Skyline GT-R R34",
    image: "car_2",
    modifications: ["RB26 Engine", "Carbon Fiber", "Titanium Exhaust"],
    status: "In Progress",
    mileage: 62000,
    isFavorite: false,
  },
  {
    id: "3",
    name: "Dream Build",
    year: "2024",
    make: "Toyota",
    model: "Supra MK5",
    image: "car_3",
    modifications: [],
    status: "Planning",
    mileage: 0,
    isFavorite: true,
  },
];

export default function GarageScreen() {
  const [cars, setCars] = useState(mockCars);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const filters = ["All", "Complete", "In Progress", "Planning"];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleFavorite = (carId) => {
    setCars(
      cars.map((car) => {
        if (car.id === carId) {
          return {
            ...car,
            isFavorite: !car.isFavorite,
          };
        }
        return car;
      })
    );
  };

  const getFilteredCars = () => {
    return selectedFilter === "All"
      ? cars
      : cars.filter((car) => car.status === selectedFilter);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Complete":
        return colors.green;
      case "In Progress":
        return colors.warning;
      case "Planning":
        return colors.info;
      default:
        return colors.textMuted;
    }
  };

  const CarCard = ({ car, index }) => (
    <Animated.View
      style={[
        styles.carCard,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            },
          ],
        },
      ]}
    >
      {/* Car Image */}
      <View style={styles.carImageContainer}>
        <LinearGradient colors={colors.purpleGradient} style={styles.carImage}>
          <Ionicons name="car-sport" size={50} color={colors.textPrimary} />
        </LinearGradient>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => handleFavorite(car.id)}
        >
          <Ionicons
            name={car.isFavorite ? "heart" : "heart-outline"}
            size={24}
            color={car.isFavorite ? colors.red : colors.textMuted}
          />
        </TouchableOpacity>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(car.status) },
          ]}
        >
          <Text style={styles.statusText}>{car.status}</Text>
        </View>
      </View>

      {/* Car Info */}
      <View style={styles.carInfo}>
        <Text style={styles.carName}>{car.name}</Text>
        <Text style={styles.carDetails}>
          {car.year} {car.make} {car.model}
        </Text>

        {/* Mileage */}
        <View style={styles.mileageContainer}>
          <Ionicons
            name="speedometer-outline"
            size={16}
            color={colors.textMuted}
          />
          <Text style={styles.mileageText}>
            {car.mileage.toLocaleString()} miles
          </Text>
        </View>

        {/* Modifications */}
        <View style={styles.modificationsContainer}>
          <Text style={styles.modificationsTitle}>Modifications:</Text>
          {car.modifications.length > 0 ? (
            <View style={styles.modificationsList}>
              {car.modifications.slice(0, 2).map((mod, modIndex) => (
                <View key={modIndex} style={styles.modificationTag}>
                  <Text style={styles.modificationText}>{mod}</Text>
                </View>
              ))}
              {car.modifications.length > 2 && (
                <View style={styles.modificationTag}>
                  <Text style={styles.modificationText}>
                    +{car.modifications.length - 2} more
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.noModifications}>No modifications yet</Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.carActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="eye-outline" size={18} color={colors.textMuted} />
            <Text style={styles.actionText}>View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="add-outline" size={18} color={colors.textMuted} />
            <Text style={styles.actionText}>Add Mod</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Garage</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="add-circle" size={28} color={colors.purple} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{cars.length}</Text>
          <Text style={styles.statLabel}>Total Cars</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {cars.filter((car) => car.status === "Complete").length}
          </Text>
          <Text style={styles.statLabel}>Complete</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {cars.filter((car) => car.status === "In Progress").length}
          </Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {cars.filter((car) => car.isFavorite).length}
          </Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter && styles.activeFilterButton,
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter && styles.activeFilterText,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Cars Grid */}
      <ScrollView
        style={styles.carsContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.carsContent}
      >
        {getFilteredCars().map((car, index) => (
          <CarCard key={car.id} car={car} index={index} />
        ))}
      </ScrollView>

      {/* Add Car FAB */}
      <TouchableOpacity style={styles.fab}>
        <LinearGradient
          colors={colors.purpleGradient}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={24} color={colors.textPrimary} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  headerButton: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.purple,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  filterContainer: {
    backgroundColor: colors.cardBackground,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
  },
  filterContent: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: colors.inputBackground,
  },
  activeFilterButton: {
    backgroundColor: colors.purple,
  },
  filterText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: "500",
  },
  activeFilterText: {
    color: colors.textPrimary,
  },
  carsContainer: {
    flex: 1,
  },
  carsContent: {
    padding: 16,
  },
  carCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  carImageContainer: {
    position: "relative",
  },
  carImage: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  favoriteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  statusBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  carInfo: {
    padding: 16,
  },
  carName: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  carDetails: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  mileageContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  mileageText: {
    fontSize: 14,
    color: colors.textMuted,
    marginLeft: 4,
  },
  modificationsContainer: {
    marginBottom: 16,
  },
  modificationsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  modificationsList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  modificationTag: {
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  modificationText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  noModifications: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: "italic",
  },
  carActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.accent,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    fontSize: 14,
    color: colors.textMuted,
    marginLeft: 6,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
});
