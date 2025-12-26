import { type InputHTMLAttributes, type ReactNode, useId, useState } from 'react';
import {
  textFieldContainer,
  textFieldContainerInline,
  label as labelClass,
  labelRequired,
  labelFloating,
  labelRaised,
  inputWrapper,
  inputWrapperError,
  inputWrapperDisabled,
  input,
  icon,
  helperText as helperTextClass,
  errorText as errorTextClass,
} from './textField.css';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label?: string;
  helperText?: string;
  errorText?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  fullWidth?: boolean;
}

export function TextField({
  label,
  helperText,
  errorText,
  startIcon,
  endIcon,
  fullWidth = true,
  disabled,
  required,
  id: providedId,
  value,
  defaultValue,
  ...inputProps
}: TextFieldProps) {
  const autoId = useId();
  const id = providedId || autoId;
  const hasError = Boolean(errorText);
  const [isFocused, setIsFocused] = useState(false);
  
  const hasValue = (() => {
    if (value !== undefined) {
      const strValue = String(value);
      return strValue.length > 0;
    }
    if (defaultValue !== undefined) {
      const strDefault = String(defaultValue);
      return strDefault.length > 0;
    }
    return false;
  })();
  
  const isShrink = isFocused || hasValue;
  
  const wrapperClasses = [
    inputWrapper,
    hasError && inputWrapperError,
    disabled && inputWrapperDisabled,
  ].filter(Boolean).join(' ');
  
  const containerClasses = [
    textFieldContainer,
    !fullWidth && textFieldContainerInline,
  ].filter(Boolean).join(' ');
  
  const labelClasses = [
    labelClass,
    label && labelFloating,
    isShrink && labelRaised,
    required && labelRequired,
  ].filter(Boolean).join(' ');
  
  return (
    <div className={containerClasses}>
      <div className={wrapperClasses} data-ve="textfield-wrapper">
        {label && (
          <label htmlFor={id} className={labelClasses}>
            {label}
          </label>
        )}
        {startIcon && <span className={icon}>{startIcon}</span>}
        <input
          id={id}
          className={input}
          data-ve="textfield-input"
          disabled={disabled}
          required={required}
          aria-invalid={hasError}
          aria-describedby={errorText ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          value={value}
          defaultValue={defaultValue}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...inputProps}
        />
        {endIcon && <span className={icon}>{endIcon}</span>}
      </div>
      {errorText && (
        <p id={`${id}-error`} className={errorTextClass} role="alert">
          {errorText}
        </p>
      )}
      {!errorText && helperText && (
        <p id={`${id}-helper`} className={helperTextClass}>
          {helperText}
        </p>
      )}
    </div>
  );
}
