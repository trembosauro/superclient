import { style } from '@vanilla-extract/css';

export const notificationsContainer = style({
  display: 'flex',
  gap: '16px',
  overflowX: 'auto',
  scrollSnapType: 'x mandatory',
  WebkitOverflowScrolling: 'touch',
  scrollbarWidth: 'thin',
  
  '::-webkit-scrollbar': {
    height: '6px',
  },
  
  '::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
  
  '::-webkit-scrollbar-thumb': {
    backgroundColor: 'color-mix(in srgb, var(--md-sys-color-on-surface) 20%, transparent)',
    borderRadius: '3px',
  },
  
  '@media': {
    '(min-width: 960px)': {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      overflowX: 'visible',
      scrollSnapType: 'none',
    },
  },
});

export const notificationItem = style({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '12px',
  minWidth: '200px',
  flex: '0 0 auto',
  scrollSnapAlign: 'start',
  
  '@media': {
    '(min-width: 960px)': {
      minWidth: 'auto',
      flex: '1',
      scrollSnapAlign: 'none',
    },
  },
});

export const notificationIcon = style({
  color: 'var(--md-sys-color-on-surface)',
  flex: '0 0 auto',
  width: '20px',
  height: '20px',
});

export const notificationContent = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  textAlign: 'left',
});

export const notificationTitle = style({
  fontSize: '14px',
  fontWeight: 500,
  lineHeight: 1.4,
  color: 'var(--md-sys-color-on-surface)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  margin: 0,
});

export const notificationTime = style({
  fontSize: '12px',
  lineHeight: 1.4,
  color: 'var(--md-sys-color-on-surface-variant)',
  margin: 0,
});

export const emptyState = style({
  textAlign: 'center',
  padding: '16px 0',
  color: 'var(--md-sys-color-on-surface-variant)',
  fontSize: '14px',
});
