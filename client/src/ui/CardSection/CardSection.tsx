import type { ReactNode } from "react";
import type { PaperProps } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

import AppCard from "../../components/layout/AppCard";

export interface CardSectionProps extends Omit<PaperProps, "children" | "sx"> {
  children: ReactNode;
  size?: "default" | "compact";
  interactive?: boolean;
  sx?: SxProps<Theme>;
}

export function CardSection({ 
  children, 
  size = "default",
  interactive = false,
  sx,
  ...rest
}: CardSectionProps) {
  return (
    <AppCard
      {...rest}
      sx={[
        {
          p: size === "compact" ? 1 : 2,
          cursor: interactive ? "pointer" : undefined,
          "&:hover": interactive ? { bgcolor: "action.hover" } : undefined,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ].filter(Boolean)}
    >
      {children}
    </AppCard>
  );
}
