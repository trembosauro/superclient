import { style } from '@vanilla-extract/css';

export const brandRoot = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: 'var(--sc-header-nav-py, 10px) var(--sc-header-nav-px, 14px)',
  borderRadius: 'var(--sc-header-nav-radius, 999px)',
  fontWeight: 'var(--sc-brand-font-weight, 700)',
  fontSize: 'var(--sc-brand-font-size, 0.875rem)',
  lineHeight: 1,
  letterSpacing: 'var(--sc-brand-letter-spacing, 0.02857em)',
  color: 'var(--sc-brand-color)',
  textDecoration: 'none',
  cursor: 'pointer',
  transition: 'background-color 120ms ease',
  border: 'none',
  background: 'transparent',
  
  ':hover': {
    backgroundColor: 'var(--sc-brand-hover-bg)',
  },
  
  ':active': {
    backgroundColor: 'var(--sc-brand-pressed-bg)',
  },
});
