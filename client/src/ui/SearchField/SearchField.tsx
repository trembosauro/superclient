import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { TextField } from "../TextField";
import * as styles from "./searchField.css";

export type SearchFieldProps = {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  fullWidth?: boolean;
  onClear?: () => void;
  endIcon?: React.ReactNode;
  ariaLabel?: string;
  className?: string;
};

export function SearchField({
  value,
  onChange,
  placeholder,
  fullWidth = false,
  onClear,
  endIcon,
  ariaLabel,
  className,
}: SearchFieldProps) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape" && onClear) {
      event.preventDefault();
      onClear();
    }
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    }
  };

  const showClearButton = value.length > 0;

  // Clear button with fixed 48px slot to maintain stable width
  const clearButtonSlot = showClearButton ? (
    endIcon || (
      <button
        type="button"
        onClick={handleClear}
        className={styles.clearButton}
        data-ve="searchfield-clear"
        aria-label="Limpar busca"
      >
        <CloseRoundedIcon fontSize="small" />
      </button>
    )
  ) : (
    // Ghost span maintains 48px slot when no clear button
    <span className={styles.clearButtonGhost} data-ve="searchfield-ghost" aria-hidden="true" />
  );

  return (
    <TextField
      label={placeholder || "Buscar"}
      value={value}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      fullWidth={fullWidth}
      endIcon={clearButtonSlot}
      aria-label={ariaLabel || placeholder}
      className={className}
    />
  );
}