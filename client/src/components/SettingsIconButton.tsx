import { IconButton, Tooltip } from "@mui/material";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import { APP_RADIUS } from "../designTokens";

type SettingsIconButtonProps = {
  title?: string;
  onClick: () => void;
  size?: "small" | "medium";
  disabled?: boolean;
};

export default function SettingsIconButton({
  title = "Configura\u00e7\u00f5es",
  onClick,
  size = "small",
  disabled = false,
}: SettingsIconButtonProps) {
  const iconFontSize = size === "small" ? "small" : "medium";
  return (
    <Tooltip title={title} placement="bottom">
      <span>
        <IconButton
          onClick={event => {
            (event.currentTarget as HTMLElement).blur();
            onClick();
          }}
          disabled={disabled}
          size={size}
          sx={theme => ({
            borderRadius: APP_RADIUS,
            border: 1,
            borderColor: disabled
              ? theme.palette.action.disabled
              : theme.palette.primary.main,
            backgroundColor: "transparent",
            color: disabled
              ? theme.palette.action.disabled
              : theme.palette.primary.main,
            "&:hover": disabled
              ? undefined
              : {
                  backgroundColor: theme.palette.action.hover,
                  borderColor: theme.palette.primary.main,
                },
          })}
        >
          <SettingsRoundedIcon fontSize={iconFontSize} />
        </IconButton>
      </span>
    </Tooltip>
  );
}
