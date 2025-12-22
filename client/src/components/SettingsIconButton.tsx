import { IconButton, Tooltip } from "@mui/material";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";

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
          onClick={onClick}
          disabled={disabled}
          size={size}
          sx={{ border: 1, borderColor: "divider" }}
        >
          <SettingsRoundedIcon fontSize={iconFontSize} />
        </IconButton>
      </span>
    </Tooltip>
  );
}
