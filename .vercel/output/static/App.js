// App.js
import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Font from "expo-font";
import { Ionicons } from "@expo/vector-icons";

// Screens
import LoadingScreen from "./src/screens/LoadingScreen";
import AuthScreen from "./src/screens/AuthScreen";
import MainTabs from "./src/navigation/MainTabs";
import CarDetailScreen from "./src/screens/CarDetailScreen";
import DriverProfileScreen from "./src/screens/DriverProfileScreen";
import ChatScreen from "./src/screens/ChatScreen";

// Supabase + Auth
import { supabase } from "./src/lib/supabase";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";

const Stack = createStackNavigator();

/* =================== APP NAVIGATOR =================== */
function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor="#000000" />
      <Stack.Navigator screenOptions={{ animation: "fade_from_bottom" }}>
        {user ? (
          <>
            <Stack.Screen
              name="MainTabs"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CarDetailScreen"
              options={{ headerShown: false }}
            >
              {(props) => <CarDetailScreen {...props} supabase={supabase} user={user} />}
            </Stack.Screen>
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
            <Stack.Screen
              name="ChatScreen"
              component={ChatScreen}
              options={{
                headerShown: true,
                title: "Chat",
                headerStyle: { backgroundColor: "#0e0e10" },
                headerTintColor: "#fff",
              }}
            />
          </>
        ) : (
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

/* =================== ROOT APP =================== */
export default function App() {
  // Preload icon fonts for web (fix missing icons on Vercel)
  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        ...Ionicons.font,
        Ionicons: require("./node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf"),
        MaterialIcons: require("./node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf"),
        FontAwesome: require("./node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome.ttf"),
      });
    }
    loadFonts();
  }, []);

  // Handle Supabase auth redirect for web
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (access_token && refresh_token) {
        supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
          if (error) {
            console.error("❌ Error restoring Supabase session:", error.message);
          } else {
            console.log("✅ Supabase session restored from URL");
            window.location.replace("/");
          }
        });
      }

      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

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
