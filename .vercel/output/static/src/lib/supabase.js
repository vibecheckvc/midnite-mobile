// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// 🧠 Helper to ensure session restores before app starts
export async function initializeSupabaseSession() {
  try {
    const result = await supabase.auth.getSession();
    const session = result?.data?.session ?? null;

    if (!session) {
      console.log("⚠️ No existing Supabase session found");
    } else {
      console.log("✅ Session loaded for user:", session.user?.id);
    }

    return session;
  } catch (err) {
    console.error("Supabase session init failed:", err);
    return null;
  }
}
