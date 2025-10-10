// App.js
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Screens
import LoadingScreen from "./src/screens/LoadingScreen";
import AuthScreen from "./src/screens/AuthScreen";
import MainTabs from "./src/navigation/MainTabs";
import CarDetailScreen from "./src/screens/CarDetailScreen";
import DriverProfileScreen from "./src/screens/DriverProfileScreen";
import ChatScreen from "./src/screens/ChatScreen";

// Supabase + Auth
import { supabase, initializeSupabaseSession } from "./src/lib/supabase";
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
      <StatusBar style="light" backgroundColor="#000000" barStyle="light-content" />

      <Stack.Navigator screenOptions={{ animation: "fade_from_bottom" }}>
        {user ? (
          <>
            {/* Main Tabs (garage, community, etc.) */}
            <Stack.Screen
              name="MainTabs"
              component={MainTabs}
              options={{ headerShown: false }}
            />

            {/* Car Detail */}
            <Stack.Screen
              name="CarDetailScreen"
              options={{ headerShown: false }}
            >
              {(props) => (
                <CarDetailScreen {...props} supabase={supabase} user={user} />
              )}
            </Stack.Screen>

            {/* Public Driver Profile */}
            <Stack.Screen
              name="DriverProfileScreen"
              component={DriverProfileScreen}
              options={{
                headerShown: true,
                headerTransparent: true,
                headerTitle: "",
                headerTintColor: "#fff",
                headerBackTitle: "Back",
              }}
            />

            {/* Chat */}
            <Stack.Screen
              name="ChatScreen"
              component={ChatScreen}
              options={{
                headerShown: true,
                headerTransparent: false,
                title: "Chat",
                headerStyle: { backgroundColor: "#000000" },
                headerTintColor: "#fff",
              }}
            />
          </>
        ) : (
          // Auth Flow
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
  const [initialized, setInitialized] = useState(false);

  // ✅ Ensure Supabase session loads before AuthProvider mounts
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await initializeSupabaseSession();
        if (error) {
          console.warn("Supabase init warning:", error.message);
        }
        if (!data?.session) {
          console.log("⚠️ No existing Supabase session found");
        } else {
          console.log("✅ Session restored for:", data.session.user?.email);
        }
      } catch (err) {
        console.error("Supabase init error:", err);
      } finally {
        setInitialized(true);
      }
    })();
  }, []);

  if (!initialized) {
    return <LoadingScreen />;
  }

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
