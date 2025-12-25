import { style, styleVariants } from '@vanilla-extract/css';

export const buttonBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '10px 24px',
  fontSize: '14px',
  fontWeight: 500,
  lineHeight: '20px',
  borderRadius: 'var(--md-sys-radius-md, 16px)',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  fontFamily: 'inherit',
  textTransform: 'none',
  outline: 'none',
  position: 'relative',
  overflow: 'hidden',
  minHeight: '36px',
  minWidth: 'auto',
  
  ':disabled': {
    opacity: 0.38,
    cursor: 'not-allowed',
    pointerEvents: 'none',
  },
  
});

export const buttonVariant = styleVariants({
  filled: {
    backgroundColor: 'var(--md-sys-color-primary)',
    color: 'var(--md-sys-color-on-primary)',
  },
  outlined: {
    backgroundColor: 'transparent',
    color: 'var(--md-sys-color-primary)',
    border: '1px solid var(--md-sys-color-outline)',
    
    ':hover:not(:disabled)': {
      backgroundColor: 'rgba(144, 202, 249, 0.08)',
    },
  },
  text: {
    backgroundColor: 'transparent',
    color: 'inherit',
    padding: 'var(--sc-nav-item-py, 6px) var(--sc-nav-item-px, 8px)',
    borderRadius: 'var(--sc-nav-item-radius, 16px)',
    
    ':hover:not(:disabled)': {
      backgroundColor: 'var(--sc-nav-hover-bg, rgba(34, 201, 166, 0.08))',
    },
    
    ':active:not(:disabled)': {
      backgroundColor: 'var(--sc-nav-pressed-bg, rgba(34, 201, 166, 0.16))',
    },
  },
});
