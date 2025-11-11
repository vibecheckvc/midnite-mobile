export const colors = {
  // Primary colors - Black minimalist theme
  primary: "#000000", // Pure black background
  secondary: "#0a0a0a", // Very dark grey
  accent: "#0f0f0f", // Slightly lighter dark grey

  // Accent colors - deep crimson lawless palette
  // Keep legacy purple keys but point them to crimson so the whole app becomes lawless-accented
  purple: "#b10f2e", // alias to crimson
  purpleDark: "#7a0018", // darker crimson alias
  red: "#b10f2e", // Crimson for buttons and accents
  green: "#10b981", // Green for success states
  cyan: "#06b6d4", // Light blue/cyan

  // Text colors - White theme
  textPrimary: "#ffffff", // Pure white text
  textSecondary: "#e5e5e5", // Light grey text
  textMuted: "#cccccc", // Muted grey text

  // Background colors - Black minimalist
  background: "#000000", // Pure black background
  cardBackground: "#0a0a0a", // Dark grey card backgrounds (subtle)
  inputBackground: "#0f0f0f", // Input backgrounds

  // Lawless-specific tokens
  edge: "rgba(177,15,46,0.12)",
  highlight: "rgba(177,15,46,0.18)",

  // Status colors
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",

  // Gradients - Red and Purple theme
  purpleGradient: ["#b10f2e", "#7a0018"],
  redGradient: ["#b10f2e", "#7a0018"],
  darkGradient: ["#000000", "#0a0a0a"],
  blueGradient: ["#06b6d4", "#3b82f6"],
};

export const gradients = {
  // keep name for compatibility but use red gradient
  purple: ["#ef4444", "#dc2626"],
  red: ["#ef4444", "#dc2626"],
  dark: ["#000000", "#111111"],
  blue: ["#06b6d4", "#3b82f6"],
};
