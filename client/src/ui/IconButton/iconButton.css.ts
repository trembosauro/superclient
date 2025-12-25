import { style } from '@vanilla-extract/css';

export const iconButtonBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 'var(--sc-header-icon-size, 36px)',
  height: 'var(--sc-header-icon-size, 36px)',
  padding: 0,
  border: '1px solid transparent',
  borderRadius: 'var(--sc-header-icon-radius, 10px)',
  backgroundColor: 'transparent',
  color: 'var(--sc-header-icon-fg)',
  cursor: 'pointer',
  transition: 'background-color 120ms ease, border-color 120ms ease',
  fontFamily: 'inherit',
  outline: 'none',
  position: 'relative',
  overflow: 'visible',
  
  ':disabled': {
    opacity: 'var(--md-sys-alpha-disabled, 0.38)',
    cursor: 'not-allowed',
    pointerEvents: 'none',
  },
  
  ':hover:not(:disabled)': {
    backgroundColor: 'var(--sc-header-icon-bg-hover)',
  },
  
  ':active:not(:disabled)': {
    backgroundColor: 'var(--sc-header-icon-bg-pressed)',
  },
  
  selectors: {
    '&[data-selected="true"]': {
      borderColor: 'var(--sc-header-icon-border-active)',
      backgroundColor: 'var(--sc-header-icon-bg-active)',
    },
    '&[data-selected="true"]:hover:not(:disabled)': {
      backgroundColor: 'var(--sc-header-icon-bg-hover)',
    },
  },
});

export const badgeDot = style({
  position: 'absolute',
  top: '4px',
  right: '4px',
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: 'var(--md-sys-color-error)',
  border: '2px solid var(--md-sys-color-surface)',
  pointerEvents: 'none',
});
