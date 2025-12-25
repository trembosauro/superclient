import { ButtonHTMLAttributes, ReactNode } from 'react';
import { iconButtonBase, badgeDot } from './iconButton.css';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  ariaLabel: string;
  selected?: boolean;
  badgeDot?: boolean;
}

export function IconButton({ 
  children,
  ariaLabel,
  selected = false,
  disabled = false,
  badgeDot: showBadge = false,
  className,
  ...props 
}: IconButtonProps) {
  return (
    <button
      className={`${iconButtonBase} ${className || ''}`}
      aria-label={ariaLabel}
      disabled={disabled}
      data-selected={selected ? 'true' : undefined}
      {...props}
    >
      {children}
      {showBadge && <span className={badgeDot} />}
    </button>
  );
}
