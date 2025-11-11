// App.js
import React, { useEffect, Component } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { colors } from "./src/constants/colors";
import { StyleSheet, Platform, View, Text } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Font from "expo-font";
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";

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

/* =================== ERROR BOUNDARY =================== */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    console.error('🚨 ErrorBoundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 ErrorBoundary error details:', error);
    console.error('🚨 ErrorBoundary error info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Show LoadingScreen as fallback instead of blank screen
      return <LoadingScreen />;
    }

    return this.props.children;
  }
}

/* =================== APP NAVIGATOR =================== */
function AppNavigator() {
  try {
    const { user, loading } = useAuth();

    if (loading) return <LoadingScreen />;

    return (
      <NavigationContainer>
        <StatusBar style="light" backgroundColor={colors.primary || "#000000"} />
        <Stack.Navigator screenOptions={{ animation: "fade_from_bottom", cardStyle: { backgroundColor: colors.primary } }}>
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
                {(props) => (
                  <CarDetailScreen {...props} supabase={supabase} user={user} />
                )}
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
  } catch (error) {
    console.error('🚨 Error in AppNavigator:', error);
    return <LoadingScreen />;
  }
}

/* =================== ROOT APP =================== */
export default function App() {
  // Preload icon fonts for web (fix missing icons on Vercel)
  useEffect(() => {
    async function loadFonts() {
      if (Platform.OS !== "web") {
        return;
      }

      await Font.loadAsync({
        ...Ionicons.font,
        ...MaterialIcons.font,
        ...FontAwesome.font,
      });
    }
    loadFonts();
  }, []);

  // Handle Supabase auth redirect for web
  useEffect(() => {
    // Only run on web platform and check if window.location exists
    if (Platform.OS === "web" && typeof window !== "undefined" && window.location && window.location.hash) {
      try {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        if (access_token && refresh_token && !supabase.hasError) {
          supabase.auth
            .setSession({ access_token, refresh_token })
            .then(({ error }) => {
              if (error) {
                console.error(
                  "❌ Error restoring Supabase session:",
                  error.message
                );
              } else {
                console.log("✅ Supabase session restored from URL");
                if (window.location && typeof window.location.replace === "function") {
                  window.location.replace("/");
                }
              }
            })
            .catch((error) => {
              console.error("❌ Error in setSession:", error);
            });
        }

        if (window.history && typeof window.history.replaceState === "function" && window.location) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (error) {
        console.error("❌ Error handling auth redirect:", error);
      }
    }
  }, []);

  // Always render something - even if there's an error
  try {
    return (
      <ErrorBoundary>
        <GestureHandlerRootView style={styles.container}>
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        </GestureHandlerRootView>
      </ErrorBoundary>
    );
  } catch (error) {
    // Ultimate fallback - show a simple black screen with text
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>Loading...</Text>
      </View>
    );
  }
}

// Add a simple test to see if the app is rendering at all
console.log('✅ App component rendered');

/* =================== STYLES =================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#ffffff",
    fontSize: 16,
  },
  fallbackContainer: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  fallbackText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
});
