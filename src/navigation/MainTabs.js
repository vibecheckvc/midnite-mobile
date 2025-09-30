import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";

// Import screens
import FeedScreen from "../screens/FeedScreen";
import EventsScreen from "../screens/EventsScreen";
import MarketplaceScreen from "../screens/MarketplaceScreen";
import GarageScreen from "../screens/GarageScreen";
import ProfileScreen from "../screens/ProfileScreen";

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
          } else if (route.name === "Marketplace") {
            iconName = focused ? "storefront" : "storefront-outline";
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
          backgroundColor: colors.cardBackground,
          borderTopColor: colors.accent,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: colors.primary,
          borderBottomColor: colors.accent,
          borderBottomWidth: 1,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 18,
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
        name="Marketplace"
        component={MarketplaceScreen}
        options={{
          title: "Marketplace",
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
