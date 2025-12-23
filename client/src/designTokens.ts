// Centralized design-system tokens.
// Update values here to propagate globally.

export const APP_RADIUS_PX = 16;
export const APP_RADIUS = `${APP_RADIUS_PX}px`;

export const applyDesignTokensToCssVars = () => {
  // Keep Tailwind/shadcn radius variables in sync with the app radius token.
  const root = document.documentElement;
  const radius = `${APP_RADIUS_PX}px`;

  root.style.setProperty("--radius", radius);
  root.style.setProperty("--radius-card", radius);
  root.style.setProperty("--radius-button", radius);
};
