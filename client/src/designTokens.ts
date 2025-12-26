// Centralized design-system tokens (Material Design 3 inspired)

export const APP_RADIUS_PX = 12;
export const APP_RADIUS = `${APP_RADIUS_PX}px`;

export const DESIGN_TOKENS = {
  colors: {
    light: {
      primary: "#1976d2",
      onPrimary: "#ffffff",
      surface: "#ffffff",
      onSurface: "#1a1a1a",
      onSurfaceVariant: "#5f6368",
      outline: "#79747e",
      error: "#ba1a1a",
    },
    dark: {
      primary: "#22c9a6",
      onPrimary: "#00382f",
      surface: "#0f0f10",
      onSurface: "#f5f5f5",
      onSurfaceVariant: "rgba(245, 245, 245, 0.7)",
      outline: "#938f99",
      error: "#ffb4ab",
    },
  },
} as const;
