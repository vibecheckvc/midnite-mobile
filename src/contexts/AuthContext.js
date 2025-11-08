import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log("✅ AuthProvider rendered, loading:", loading);

  /* ==========================
     INITIAL SESSION + LISTENER
  ========================== */
  useEffect(() => {
    let subscription = null;
    let mounted = true;

    // Check if Supabase has initialization error
    if (supabase.hasError) {
      console.error("❌ Supabase not initialized:", supabase.getError());
      if (mounted) {
        setLoading(false);
      }
      return;
    }

    // Safely get initial session
    const getInitialSession = async () => {
      try {
        // Double-check supabase.auth exists
        if (!supabase || !supabase.auth) {
          console.warn("⚠️ Supabase auth not available");
          setLoading(false);
          return;
        }

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error.message || error);
          // Don't crash on any Supabase errors
        } else {
          if (mounted) {
            setSession(session);
            setUser(session?.user ?? null);
          }
        }
      } catch (error) {
        console.error("Error in getInitialSession:", error.message || error);
        // Never crash - just log and continue
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Safely set up auth state listener
    try {
      if (
        supabase &&
        supabase.auth &&
        typeof supabase.auth.onAuthStateChange === "function"
      ) {
        const result = supabase.auth.onAuthStateChange((event, session) => {
          try {
            console.log("Auth state change:", event);
            if (mounted) {
              setSession(session);
              setUser(session?.user ?? null);
              setLoading(false);
            }
          } catch (error) {
            console.error("Error in auth state change handler:", error);
          }
        });

        // Handle different return formats from onAuthStateChange
        if (result?.data?.subscription) {
          subscription = result.data.subscription;
        } else if (result?.subscription) {
          subscription = result.subscription;
        } else if (result && typeof result.unsubscribe === "function") {
          subscription = result;
        }
      } else {
        console.warn("⚠️ Supabase auth.onAuthStateChange not available");
      }
    } catch (error) {
      console.error("Error setting up auth listener:", error.message || error);
      if (mounted) {
        setLoading(false);
      }
    }

    return () => {
      mounted = false;
      try {
        if (subscription && typeof subscription.unsubscribe === "function") {
          subscription.unsubscribe();
        }
      } catch (error) {
        console.error("Error unsubscribing:", error);
      }
    };
  }, []);

  /* ==========================
     AUTH ACTIONS
  ========================== */

  // 🚀 Sign up (instant, no email confirmation)
  const signUp = async (email, password, username) => {
    try {
      // Check if Supabase is properly configured
      if (supabase.hasError) {
        const configError = supabase.getError();
        console.error(
          "❌ Sign-up failed - Supabase not configured:",
          configError
        );
        return {
          data: null,
          error: {
            message: "App configuration error. Please contact support.",
            details: configError?.message || "Supabase credentials missing",
          },
        };
      }

      console.log("🔍 Attempting sign-up for:", email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: null, // 🔥 disables email confirmation
          data: { username },
        },
      });

      if (error) {
        console.error("❌ Sign-up error:", error.message, error);
        // Check if it's a network error
        if (
          error.message?.includes("network") ||
          error.message?.includes("fetch") ||
          error.message?.includes("Failed")
        ) {
          console.error(
            "❌ Network error detected - this might mean Supabase URL is incorrect or unreachable"
          );
          return {
            data: null,
            error: {
              message:
                "Network request failed. Please check your internet connection and try again.",
              details: error.message,
            },
          };
        }
        throw error;
      }

      // If Supabase instantly returns a session (it will)
      if (data?.session) {
        setSession(data.session);
        setUser(data.session.user);
        console.log("✅ Instant signup success:", data.session.user.email);
      }

      return { data, error: null };
    } catch (error) {
      console.error("Sign-up error (catch):", error.message, error);
      return { data: null, error };
    }
  };

  // 🚀 Sign in
  const signIn = async (email, password) => {
    try {
      // Check if Supabase is properly configured
      if (supabase.hasError) {
        const configError = supabase.getError();
        console.error(
          "❌ Sign-in failed - Supabase not configured:",
          configError
        );
        return {
          data: null,
          error: {
            message: "App configuration error. Please contact support.",
            details: configError?.message || "Supabase credentials missing",
          },
        };
      }

      console.log("🔍 Attempting sign-in for:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("❌ Sign-in error:", error.message, error);
        // Check if it's a network error
        if (
          error.message?.includes("network") ||
          error.message?.includes("fetch") ||
          error.message?.includes("Failed")
        ) {
          console.error(
            "❌ Network error detected - this might mean Supabase URL is incorrect or unreachable"
          );
          return {
            data: null,
            error: {
              message:
                "Network request failed. Please check your internet connection and try again.",
              details: error.message,
            },
          };
        }
        throw error;
      }

      if (data?.session) {
        setSession(data.session);
        setUser(data.session.user);
        console.log("✅ Logged in:", data.session.user.email);
      }

      return { data, error: null };
    } catch (error) {
      console.error("Sign-in error (catch):", error.message, error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // 🚀 Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSession(null);
      console.log("✅ Signed out");
      return { error: null };
    } catch (error) {
      console.error("Sign-out error:", error.message);
      return { error };
    }
  };

  // 🚀 Reset password (still sends reset email)
  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      console.log("✅ Password reset email sent:", email);
      return { data, error: null };
    } catch (error) {
      console.error("Reset password error:", error.message);
      return { data: null, error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
