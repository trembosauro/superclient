import { style } from '@vanilla-extract/css';

export const navItemRoot = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--sc-header-nav-py, 10px) var(--sc-header-nav-px, 14px)',
  borderRadius: 'var(--sc-header-nav-radius, 999px)',
  color: 'var(--sc-header-nav-fg)',
  fontWeight: 600,
  lineHeight: 1,
  textDecoration: 'none',
  transition: 'background-color 120ms ease',
  cursor: 'pointer',
  
  ':hover': {
    backgroundColor: 'var(--sc-header-nav-bg-hover)',
  },
  
  ':active': {
    backgroundColor: 'var(--sc-header-nav-bg-pressed)',
  },
  
  selectors: {
    '&[aria-current="page"]': {
      color: 'var(--sc-header-nav-fg-active)',
      backgroundColor: 'var(--sc-header-nav-bg-active)',
    },
    '&[aria-current="page"]:hover': {
      backgroundColor: 'var(--sc-header-nav-bg-active)',
    },
  },
});
