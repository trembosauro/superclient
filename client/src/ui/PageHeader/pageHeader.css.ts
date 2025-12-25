import { style } from '@vanilla-extract/css';

export const pageHeaderContainer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 'var(--sc-page-header-gap, 16px)',
  gap: 'var(--md-sys-spacing-16, 16px)',
  flexWrap: 'wrap',
  
  '@media': {
    '(min-width: 960px)': {
      flexWrap: 'nowrap',
    },
  },
});

export const pageTitleContainer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--md-sys-spacing-8, 8px)',
  minWidth: 0,
  flex: 1,
});

export const pageTitle = style({
  fontSize: 'var(--sc-page-title-size, 24px)',
  fontWeight: 'var(--sc-page-title-weight, 600)',
  lineHeight: 1.2,
  color: 'var(--sc-page-title-color)',
  margin: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const pageSubtitle = style({
  fontSize: 'var(--sc-page-subtitle-size, 14px)',
  lineHeight: 1.5,
  color: 'var(--sc-page-subtitle-color)',
  margin: 0,
});

export const pageActionsContainer = style({
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--sc-page-actions-gap, 8px)',
  flex: 'none',
  whiteSpace: 'nowrap',
});
