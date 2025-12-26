import { style } from '@vanilla-extract/css';

// Label transform constants derived from MUI TextField outlined Material 3
// Measured from getComputedStyle on MUI default state
const LABEL_DEFAULT_FONT_SIZE = '16px';
const LABEL_SCALE = 0.75;
// Default state: label positioned at input padding position
const LABEL_DEFAULT_TRANSLATE_X = '14px';
const LABEL_DEFAULT_TRANSLATE_Y = '16px';
// Shrink state: label moves up and scales
const LABEL_SHRINK_TRANSLATE_X = '14px';
const LABEL_SHRINK_TRANSLATE_Y = '-9px';

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
  left: 0,
  top: 0,
  transform: `translate(${LABEL_DEFAULT_TRANSLATE_X}, ${LABEL_DEFAULT_TRANSLATE_Y}) scale(1)`,
  transformOrigin: 'top left',
  fontSize: LABEL_DEFAULT_FONT_SIZE,
  lineHeight: 1,
  color: 'var(--sc-input-placeholder-color)',
  pointerEvents: 'none',
  transition: 'transform 200ms cubic-bezier(0.0, 0, 0.2, 1), color 200ms cubic-bezier(0.0, 0, 0.2, 1), font-size 200ms cubic-bezier(0.0, 0, 0.2, 1)',
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
  transform: `translate(${LABEL_SHRINK_TRANSLATE_X}, ${LABEL_SHRINK_TRANSLATE_Y}) scale(${LABEL_SCALE})`,
  fontSize: LABEL_DEFAULT_FONT_SIZE,
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
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
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
  flex: '1 1 auto',
  minWidth: 0,
  width: '100%',
  backgroundColor: 'transparent',
  border: '0',
  outline: '0',
  boxShadow: 'none',
  color: 'var(--sc-input-text-color)',
  fontSize: '16px',
  fontFamily: 'inherit',
  lineHeight: '1.4375em',
  padding: 0,
  height: 'auto',
  margin: 0,
  boxSizing: 'border-box',
  
  '@media': {
    '(prefers-reduced-motion: no-preference)': {
      transition: 'none',
    },
  },
  
  selectors: {
    '&[type="text"]': {
      appearance: 'none',
      WebkitAppearance: 'none',
      MozAppearance: 'none',
    },
    '&[type="search"]': {
      appearance: 'none',
      WebkitAppearance: 'none',
      MozAppearance: 'none',
    },
    '&::-webkit-search-decoration': {
      display: 'none',
    },
    '&::-webkit-search-cancel-button': {
      display: 'none',
    },
  },
  
  '::placeholder': {
    color: 'transparent',
    opacity: 0,
  },
  
  ':focus': {
    border: '0',
    outline: '0',
    boxShadow: 'none',
    backgroundColor: 'transparent',
  },
  
  ':hover': {
    backgroundColor: 'transparent',
  },
  
  ':disabled': {
    cursor: 'not-allowed',
    opacity: 1,
    backgroundColor: 'transparent',
  },
});

export const icon = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--sc-input-label-color)',
  flexShrink: 0,
  backgroundColor: 'transparent',
  border: 'none',
  outline: 'none',
  boxShadow: 'none',
  padding: 0,
  margin: 0,
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
