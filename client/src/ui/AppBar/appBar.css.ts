import { style } from '@vanilla-extract/css';

export const appBar = style({
  position: 'sticky',
  top: 0,
  zIndex: 10,
  borderBottom: 'solid 1px',
  borderBottomColor: 'color-mix(in srgb, var(--md-sys-color-outline) calc(var(--md-sys-alpha-hover) * 100%), transparent)',
  backdropFilter: 'blur(16px)',
  backgroundColor: 'color-mix(in srgb, var(--md-sys-color-surface) 75%, transparent)',
});

export const appBarInner = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
  minHeight: 'var(--sc-header-height, 64px)',
  padding: '0 var(--sc-header-px-mobile, 16px)',
  
  '@media': {
    '(min-width: 960px)': {
      padding: '0 var(--sc-header-px-desktop, 24px)',
    },
  },
});

export const brandSlot = style({
  display: 'flex',
  alignItems: 'center',
  flex: '0 0 auto',
});

export const navSlot = style({
  flex: '1 1 auto',
  display: 'none',
  justifyContent: 'center',
  gap: 'var(--sc-header-nav-gap, 6px)',
  minWidth: 0,
  
  '@media': {
    '(min-width: 960px)': {
      display: 'flex',
      flexWrap: 'nowrap',
      overflowX: 'auto',
      whiteSpace: 'nowrap',
      scrollbarWidth: 'thin',
    },
  },
  
  '::-webkit-scrollbar': {
    height: '4px',
  },
  
  '::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
  
  '::-webkit-scrollbar-thumb': {
    backgroundColor: 'color-mix(in srgb, var(--md-sys-color-on-surface) 20%, transparent)',
    borderRadius: '2px',
  },
});

export const actionsSlot = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flex: '0 0 auto',
});

export const mobileRightGroup = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '8px',
  flex: 'none',
  width: 'auto',
});

export const menuButton = style({
  padding: '8px',
  color: 'var(--md-sys-color-on-surface)',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: '9999px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  
  ':hover': {
    backgroundColor: 'color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent)',
  },
  
  ':active': {
    backgroundColor: 'color-mix(in srgb, var(--md-sys-color-on-surface) 12%, transparent)',
  },
  
  ':focus-visible': {
    outline: '2px solid var(--md-sys-color-primary)',
    outlineOffset: '2px',
  },
  
  '@media': {
    '(min-width: 960px)': {
      display: 'none',
    },
  },
});
