import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

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
      console.log(
        "Auth state change:",
        event,
        session ? "Session found" : "No session"
      );
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  /* ============================
     🧩 SIGN UP (with auto-login)
  ============================ */
  const signUp = async (email, password, username) => {
    try {
      setLoading(true);

      // Step 1: Create user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: undefined, // disable email verification redirect
        },
      });

      if (error) throw error;

      // Step 2: Immediately sign them in (since verification is off)
      const { data: loginData, error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (loginError) throw loginError;

      // Step 3: Update context manually to guarantee active session
      setUser(loginData.user);
      setSession(loginData.session);

      return { data: loginData, error: null };
    } catch (error) {
      console.error("Sign-up error:", error.message);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  /* ============================
     🔑 SIGN IN
  ============================ */
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      setUser(data.user);
      setSession(data.session);

      return { data, error: null };
    } catch (error) {
      console.error("Sign-in error:", error.message);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  /* ============================
     🚪 SIGN OUT
  ============================ */
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSession(null);
      return { error: null };
    } catch (error) {
      console.error("Sign-out error:", error.message);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  /* ============================
     🔄 RESET PASSWORD
  ============================ */
  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "midnite://reset-password",
      });
      if (error) throw error;
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
