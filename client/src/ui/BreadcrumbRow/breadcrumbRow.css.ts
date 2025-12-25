import { style } from '@vanilla-extract/css';

export const breadcrumbRowContainer = style({
  maxWidth: 'var(--sc-page-max-width, 1200px)',
  margin: '0 auto',
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
  marginBottom: '8px',
  padding: '0 var(--sc-page-px-mobile, 16px)',
  
  '@media': {
    '(min-width: 960px)': {
      padding: '0 var(--sc-page-px-desktop, 24px)',
    },
    '(max-width: 959px)': {
      display: 'block',
    },
  },
});

export const breadcrumbNav = style({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'nowrap',
  whiteSpace: 'nowrap',
  minWidth: 0,
  flex: '1 1 auto',
  fontSize: '14px',
  color: 'var(--md-sys-color-on-surface-variant)',
  
  '@media': {
    '(max-width: 959px)': {
      width: '100%',
    },
  },
});

export const breadcrumbList = style({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'nowrap',
  listStyle: 'none',
  margin: 0,
  padding: 0,
  minWidth: 0,
});

export const breadcrumbItem = style({
  display: 'inline-flex',
  alignItems: 'center',
  minWidth: 0,
});

export const breadcrumbLink = style({
  color: 'inherit',
  textDecoration: 'none',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  
  ':hover': {
    textDecoration: 'underline',
  },
});

export const breadcrumbText = style({
  color: 'var(--md-sys-color-on-surface)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const breadcrumbSeparator = style({
  margin: '0 var(--md-sys-spacing-8, 8px)',
  color: 'var(--md-sys-color-on-surface-variant)',
  userSelect: 'none',
});

export const actionsContainer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  flexWrap: 'nowrap',
  minWidth: 0,
  flex: '0 0 auto',
  
  '@media': {
    '(max-width: 959px)': {
      display: 'none',
    },
  },
});
