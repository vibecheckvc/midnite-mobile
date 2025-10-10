import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";

// Import screens
import FeedScreen from "../screens/FeedScreen";
import EventsScreen from "../screens/EventsScreen";
import GarageScreen from "../screens/GarageScreen";
import ProfileScreen from "../screens/ProfileScreen";
import CommunityScreen from "../screens/CommunityScreen"; // ✅ Added

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Feed") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Events") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "Community") {
            iconName = focused ? "people" : "people-outline";
          } else if (route.name === "Garage") {
            iconName = focused ? "car-sport" : "car-sport-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.purple,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: "rgba(28, 28, 30, 0.95)",
          borderTopColor: "rgba(255, 55, 95, 0.3)",
          borderTopWidth: 0.5,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          position: "absolute",
          backdropFilter: "blur(20px)",
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 4,
          letterSpacing: -0.2,
        },
        headerStyle: {
          backgroundColor: colors.primary,
          borderBottomColor: "rgba(255, 55, 95, 0.2)",
          borderBottomWidth: 0.5,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: "700",
          fontSize: 20,
          letterSpacing: -0.5,
        },
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          title: "Feed",
        }}
      />
      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{
          title: "Events",
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          title: "Community",
        }}
      />
      <Tab.Screen
        name="Garage"
        component={GarageScreen}
        options={{
          title: "Garage",
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
        }}
      />
    </Tab.Navigator>
  );
}
