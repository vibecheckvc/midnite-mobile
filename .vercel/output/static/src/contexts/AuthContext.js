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

  /* ==========================
     INITIAL SESSION + LISTENER
  ========================== */
  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) console.error("Error getting session:", error);
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error("Error in getInitialSession:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state change:", event);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  /* ==========================
     AUTH ACTIONS
  ========================== */

  // 🚀 Sign up (instant, no email confirmation)
  const signUp = async (email, password, username) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: null, // 🔥 disables email confirmation
          data: { username },
        },
      });
      if (error) throw error;

      // If Supabase instantly returns a session (it will)
      if (data?.session) {
        setSession(data.session);
        setUser(data.session.user);
        console.log("✅ Instant signup success:", data.session.user.email);
      }

      return { data, error: null };
    } catch (error) {
      console.error("Sign-up error:", error.message);
      return { data: null, error };
    }
  };

  // 🚀 Sign in
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      if (data?.session) {
        setSession(data.session);
        setUser(data.session.user);
        console.log("✅ Logged in:", data.session.user.email);
      }

      return { data, error: null };
    } catch (error) {
      console.error("Sign-in error:", error.message);
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
