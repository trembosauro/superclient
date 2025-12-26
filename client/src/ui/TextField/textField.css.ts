import { style } from '@vanilla-extract/css';

export const textFieldContainer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  width: '100%',
});

export const textFieldContainerInline = style({
  width: 'auto',
});

export const label = style({
  fontSize: '14px',
  fontWeight: 500,
  lineHeight: 1.4,
  color: 'var(--sc-input-label-color)',
  marginBottom: '2px',
});

export const labelFloating = style({
  position: 'absolute',
  left: '16px',
  top: '50%',
  transform: 'translateY(-50%)',
  transformOrigin: 'top left',
  fontSize: '16px',
  lineHeight: 1,
  color: 'var(--sc-input-placeholder-color)',
  pointerEvents: 'none',
  transition: 'transform 200ms cubic-bezier(0.0, 0, 0.2, 1), color 200ms cubic-bezier(0.0, 0, 0.2, 1)',
  backgroundColor: 'transparent',
  paddingInline: '6px',
  marginLeft: '-6px',
  zIndex: 1,
  maxWidth: 'calc(100% - 32px)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const labelRaised = style({
  transform: 'translateY(-28px) scale(0.75)',
  color: 'var(--sc-input-label-color)',
  backgroundColor: 'var(--sc-input-bg)',
  paddingInline: '8px',
  marginLeft: '-8px',
});

export const labelRequired = style({
  ':after': {
    content: '" *"',
    color: 'var(--sc-input-error-color)',
  },
});

export const inputWrapper = style({
  position: 'relative',
  display: 'block',
  backgroundColor: 'var(--sc-input-bg)',
  border: '1px solid var(--sc-input-border-default)',
  borderRadius: 'var(--sc-input-radius)',
  padding: '0 16px',
  height: '56px',
  boxSizing: 'border-box',
  transition: 'border-color 200ms cubic-bezier(0.0, 0, 0.2, 1)',
  
  ':hover': {
    borderColor: 'var(--sc-input-border-hover)',
  },
  
  ':focus-within': {
    borderColor: 'var(--sc-input-border-focus)',
    outline: 'none',
  },
});

export const inputWrapperError = style({
  borderColor: 'var(--sc-input-border-error)',
  
  ':hover': {
    borderColor: 'var(--sc-input-border-error)',
  },
  
  ':focus-within': {
    borderColor: 'var(--sc-input-border-error)',
  },
});

export const inputWrapperDisabled = style({
  borderColor: 'var(--sc-input-border-disabled)',
  opacity: 'var(--sc-input-disabled-alpha)',
  cursor: 'not-allowed',
  
  ':hover': {
    borderColor: 'var(--sc-input-border-disabled)',
  },
});

export const input = style({
  width: '100%',
  backgroundColor: 'transparent',
  border: '0',
  outline: '0',
  boxShadow: 'none',
  color: 'var(--sc-input-text-color)',
  fontSize: '16px',
  lineHeight: '1.4375em',
  padding: '16.5px 0',
  height: 'auto',
  boxSizing: 'border-box',
  
  '::placeholder': {
    color: 'transparent',
    opacity: 0,
  },
  
  ':focus': {
    border: '0',
    outline: '0',
    boxShadow: 'none',
  },
  
  ':disabled': {
    cursor: 'not-allowed',
  },
});

export const icon = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--sc-input-label-color)',
  verticalAlign: 'middle',
  marginTop: '-2px',
});

export const helperText = style({
  fontSize: '12px',
  lineHeight: 1.4,
  color: 'var(--sc-input-helper-color)',
  margin: 0,
});

export const errorText = style({
  fontSize: '12px',
  lineHeight: 1.4,
  color: 'var(--sc-input-error-color)',
  margin: 0,
});
