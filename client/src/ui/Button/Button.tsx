import { ButtonHTMLAttributes, ReactNode } from 'react';
import { buttonBase, buttonVariant } from './button.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'outlined' | 'text';
  children: ReactNode;
}

export function Button({ 
  variant = 'filled', 
  disabled = false, 
  children, 
  className,
  ...props 
}: ButtonProps) {
  return (
    <button
      className={`${buttonBase} ${buttonVariant[variant]} ${className || ''}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
