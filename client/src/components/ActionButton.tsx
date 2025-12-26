import { Button, Tooltip, type ButtonProps } from "@mui/material";

export type ActionButtonProps = ButtonProps & {
  tooltip?: string;
};

export default function ActionButton({
  tooltip,
  sx,
  onClick,
  variant,
  size,
  ...props
}: ActionButtonProps) {
  const resolvedSize = size ?? "medium";
  const minHeight = resolvedSize === "small" ? 30 : resolvedSize === "large" ? 42 : 36;

  const baseSx = {
    textTransform: "none",
    fontWeight: 600,
    whiteSpace: "nowrap",
    minWidth: 0,
    px: 1.75,
    minHeight,
  };

  const mergedSx = [
    baseSx,
    ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
  ];

  const button = (
    <Button
      {...props}
      variant={variant ?? "outlined"}
      size={resolvedSize}
      onClick={event => {
        (event.currentTarget as HTMLElement).blur();
        onClick?.(event);
      }}
      sx={mergedSx}
    />
  );

  if (!tooltip) {
    return button;
  }

  return (
    <Tooltip title={tooltip} placement="bottom">
      <span>{button}</span>
    </Tooltip>
  );
}
