import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";
// Log for debugging (will show in Xcode console or device logs)
console.log("🔍 Supabase URL present:", !!supabaseUrl);
console.log("🔍 Supabase Key present:", !!supabaseAnonKey);
if (supabaseUrl) {
  console.log("🔍 Supabase URL length:", supabaseUrl.length);
  // Show first and last 10 chars of URL to verify it's correct (not placeholder)
  console.log(
    "🔍 Supabase URL preview:",
    supabaseUrl.substring(0, 10) +
      "..." +
      supabaseUrl.substring(supabaseUrl.length - 10)
  );
} else {
  console.error(
    "❌ CRITICAL: Supabase URL is missing! Check EAS environment variables."
  );
}
if (!supabaseAnonKey) {
  console.error(
    "❌ CRITICAL: Supabase Anon Key is missing! Check EAS environment variables."
  );
}

// Always create a client - never throw at module load time
// If env vars are missing, create with placeholder values
// The app will still launch, but Supabase calls will fail gracefully
let supabaseInstance;
try {
  const url = supabaseUrl || "https://placeholder.supabase.co";
  const key = supabaseAnonKey || "placeholder-key";

  supabaseInstance = createClient(url, key, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: !!supabaseUrl && !!supabaseAnonKey,
      persistSession: !!supabaseUrl && !!supabaseAnonKey,
      detectSessionInUrl: false,
    },
  });

  if (supabaseUrl && supabaseAnonKey) {
    console.log("✅ Supabase client initialized successfully");
  } else {
    console.warn(
      "⚠️ Supabase initialized with placeholder values - env vars missing"
    );
  }
} catch (error) {
  console.error("❌ Critical error creating Supabase client:", error);
  // Even if createClient fails, try to create a minimal client
  // This should never happen, but just in case
  supabaseInstance = createClient(
    "https://placeholder.supabase.co",
    "placeholder-key",
    {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    }
  );
}

// Add helper properties
supabaseInstance.hasError = !supabaseUrl || !supabaseAnonKey;
supabaseInstance.getError = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return new Error(
      `Missing Supabase environment variables. URL: ${!!supabaseUrl}, Key: ${!!supabaseAnonKey}`
    );
  }
  return null;
};

export const supabase = supabaseInstance;
