import { alpha, type Theme } from "@mui/material/styles";
import { APP_RADIUS } from "../designTokens";

// Standard interactive card with hover effects - uses global 16px radius
export const interactiveCardSx = (theme: Theme) => ({
  borderRadius: APP_RADIUS,
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  transition: theme.transitions.create(["background-color", "border-color"], {
    duration: theme.transitions.duration.short,
  }),
  "&:hover": {
    backgroundColor: alpha(theme.palette.text.primary, 0.08),
  },
  "&:active": {
    backgroundColor: alpha(theme.palette.text.primary, 0.12),
  },
});

// Alias for backwards compatibility - same as interactiveCardSx
export const interactiveItemSx = interactiveCardSx;

// Static card: global radius, no hover effects
export const staticCardSx = (theme: Theme) => ({
  borderRadius: APP_RADIUS,
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
});

// Alias for backwards compatibility - same as staticCardSx
export const staticItemSx = staticCardSx;

// Interactive card with hover (alias for interactiveCardSx)
export const clickableCardSx = interactiveCardSx;

// Keep this export for any code still using it - returns APP_RADIUS as number
export const getInteractiveItemRadiusPx = (_theme: Theme) => {
  return 16;
};
