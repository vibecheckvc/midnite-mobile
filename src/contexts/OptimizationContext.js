import React, { createContext, useContext, useCallback, useRef } from "react";
import { useSharedValue, runOnJS } from "react-native-reanimated";

/**
 * OptimizationContext provides image caching and lazy-load management
 * to reduce redundant API calls and speed up screen transitions.
 */
const OptimizationContext = createContext();

export function OptimizationProvider({ children }) {
  // Simple in-memory image URI cache
  const imageCache = useRef(new Map());
  const listCache = useRef(new Map());

  // Memoize image URLs to avoid re-fetching
  const getCachedImageUri = useCallback((key, uri) => {
    if (imageCache.current.has(key)) {
      return imageCache.current.get(key);
    }
    if (uri) {
      imageCache.current.set(key, uri);
    }
    return uri;
  }, []);

  // Cache list data with a TTL (time-to-live)
  const getCachedList = useCallback((key, ttl = 60000) => {
    const cached = listCache.current.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    return null;
  }, []);

  const setCachedList = useCallback((key, data) => {
    listCache.current.set(key, { data, timestamp: Date.now() });
  }, []);

  // Clear cache on demand
  const clearCache = useCallback(() => {
    imageCache.current.clear();
    listCache.current.clear();
  }, []);

  const value = {
    getCachedImageUri,
    getCachedList,
    setCachedList,
    clearCache,
  };

  return (
    <OptimizationContext.Provider value={value}>
      {children}
    </OptimizationContext.Provider>
  );
}

export function useOptimization() {
  const context = useContext(OptimizationContext);
  if (!context) {
    throw new Error("useOptimization must be used within OptimizationProvider");
  }
  return context;
}
