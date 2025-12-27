import type { Theme } from "@mui/material/styles";
import {
  amber,
  blue,
  cyan,
  green,
  grey,
  lime,
  orange,
  pink,
  purple,
  red,
} from "@mui/material/colors";

type MuiPaletteKey =
  | "primary"
  | "secondary"
  | "success"
  | "info"
  | "warning"
  | "error"
  | "grey";

export const CATEGORY_COLOR_OPTIONS = [
  "mui.grey.900",
  "mui.green.600",
  "mui.amber.700",
  "mui.blue.600",
  "mui.cyan.700",
  "mui.orange.700",
  "mui.red.600",
  "mui.purple.500",
  "mui.pink.A200",
  "mui.lime.700",
] as const;

const MUI_COLOR_MAP: Record<string, Record<string, string>> = {
  amber,
  blue,
  cyan,
  green,
  grey,
  lime,
  orange,
  pink,
  purple,
  red,
};

export const resolveThemeColor = (theme: Theme, value: string): string => {
  // MUI color tokens, e.g. "mui.green.600", "mui.pink.A200"
  if (value.startsWith("mui.")) {
    const [, colorName, shade] = value.split(".");
    if (colorName && shade) {
      const bucket = MUI_COLOR_MAP[colorName];
      const resolved = bucket?.[shade];
      if (resolved) {
        return resolved;
      }
    }
  }

  // Palette token, e.g. "primary"
  if (
    value === "primary" ||
    value === "secondary" ||
    value === "success" ||
    value === "info" ||
    value === "warning" ||
    value === "error"
  ) {
    return theme.palette[value].main;
  }

  // Palette reference, e.g. "primary.main", "primary.dark", "grey.700"
  const [paletteKeyRaw, shade] = value.split(".");
  const paletteKey = paletteKeyRaw as MuiPaletteKey;

  if (
    shade &&
    (paletteKey === "primary" ||
      paletteKey === "secondary" ||
      paletteKey === "success" ||
      paletteKey === "info" ||
      paletteKey === "warning" ||
      paletteKey === "error" ||
      paletteKey === "grey")
  ) {
    const palette = theme.palette[paletteKey] as unknown as Record<string, string>;
    const resolved = palette[shade];
    if (resolved) {
      return resolved;
    }
  }

  // Only allow theme-derived colors for category UI.
  return theme.palette.grey[700];
};
