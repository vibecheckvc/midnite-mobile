// App.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Import screens
import LoadingScreen from "./src/screens/LoadingScreen";
import AuthScreen from "./src/screens/AuthScreen";
import MainTabs from "./src/navigation/MainTabs";
import CarDetailScreen from "./src/screens/CarDetailScreen";
import DriverProfileScreen from "./src/screens/DriverProfileScreen"; // ✅ Added
import ChatScreen from "./src/screens/ChatScreen"; // ✅ New import

// Import Supabase + Auth
import { supabase } from "./src/lib/supabase";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";

const Stack = createStackNavigator();

/* =================== APP NAVIGATION =================== */
function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor="#000000" />

      <Stack.Navigator screenOptions={{ animation: "fade_from_bottom" }}>
        {user ? (
          <>
            {/* Main Tabs (garage, community, etc.) */}
            <Stack.Screen
              name="MainTabs"
              component={MainTabs}
              options={{ headerShown: false }}
            />

            {/* ✅ Car detail page */}
            <Stack.Screen name="CarDetailScreen" options={{ headerShown: false }}>
              {(props) => (
                <CarDetailScreen
                  {...props}
                  supabase={supabase}
                  user={user}
                />
              )}
            </Stack.Screen>

            {/* ✅ Public driver profile page */}
            <Stack.Screen
              name="DriverProfileScreen"
              component={DriverProfileScreen}
              options={{
                headerShown: true,
                headerTransparent: true,
                headerTitle: "",
                headerTintColor: "#fff",
              }}
            />

            {/* ✅ Chat screen */}
            <Stack.Screen
              name="ChatScreen"
              component={ChatScreen}
              options={{
                headerShown: true,
                headerTransparent: false,
                title: "Chat",
                headerStyle: { backgroundColor: "#0e0e10" },
                headerTintColor: "#fff",
              }}
            />
          </>
        ) : (
          /* Auth flow */
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/* =================== ROOT =================== */
export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

/* =================== STYLES =================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
});
