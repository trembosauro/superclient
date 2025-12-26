import type { ReactNode } from "react";

import ActionButton, { type ActionButtonProps } from "./ActionButton";

export type ActionIconButtonProps = Omit<ActionButtonProps, "children"> & {
  icon: ReactNode;
};

export default function ActionIconButton({ icon, sx, ...props }: ActionIconButtonProps) {
  const mergedSx = [
    {
      minWidth: 0,
      px: 1.75,
    },
    ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
  ];

  return (
    <ActionButton {...props} sx={mergedSx}>
      {icon}
    </ActionButton>
  );
}
