import { style } from '@vanilla-extract/css';

export const card = style({
  backgroundColor: 'var(--sc-card-bg)',
  borderRadius: 'var(--sc-card-radius)',
  border: '1px solid var(--sc-card-border)',
  boxShadow: 'var(--sc-card-shadow)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
});

export const cardHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
  padding: 'var(--sc-card-header-padding)',
  borderBottom: '1px solid var(--sc-card-border)',
});

export const cardHeaderContent = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

export const cardTitle = style({
  fontSize: '20px',
  fontWeight: 600,
  lineHeight: 1.3,
  color: 'var(--md-sys-color-on-surface)',
  margin: 0,
});

export const cardSubtitle = style({
  fontSize: '14px',
  lineHeight: 1.5,
  color: 'var(--md-sys-color-on-surface-variant)',
  margin: 0,
});

export const cardActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexShrink: 0,
});

export const cardContent = style({
  padding: 'var(--sc-card-content-padding-desktop)',
  flex: 1,
  minHeight: 0,
  
  '@media': {
    '(max-width: 959px)': {
      padding: 'var(--sc-card-content-padding-mobile)',
    },
  },
});
