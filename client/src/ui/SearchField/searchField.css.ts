import { style } from "@vanilla-extract/css";

/**
 * Clear button for SearchField
 * Fixed 48px slot to maintain stable width
 */
export const clearButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  padding: 0,
  margin: 0,
  border: 'none',
  background: 'transparent',
  backgroundColor: 'transparent',
  color: 'var(--sc-input-label-color)',
  cursor: 'pointer',
  borderRadius: '50%',
  transition: 'background-color 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  flexShrink: 0,
  outline: 'none',
  boxShadow: 'none',
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  
  ':hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  
  ':active': {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  
  ':focus-visible': {
    outline: '2px solid var(--sc-input-border-focus)',
    outlineOffset: '2px',
  },
});

/**
 * Ghost span to maintain 40px slot when clear button is hidden
 * Prevents width shift when typing
 */
export const clearButtonGhost = style({
  display: 'inline-block',
  width: '40px',
  height: '40px',
  flexShrink: 0,
  backgroundColor: 'transparent',
  border: 'none',
  outline: 'none',
  boxShadow: 'none',
  padding: 0,
  margin: 0,
});

