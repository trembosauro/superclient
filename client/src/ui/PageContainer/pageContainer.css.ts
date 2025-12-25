import { style } from '@vanilla-extract/css';

export const pageContainer = style({
  maxWidth: 'var(--sc-page-max-width, 1200px)',
  margin: '0 auto',
  width: '100%',
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  padding: 'var(--sc-page-py-mobile, 16px) var(--sc-page-px-mobile, 16px)',
  
  '@media': {
    '(min-width: 960px)': {
      padding: 'var(--sc-page-py-desktop, 24px) var(--sc-page-px-desktop, 24px)',
    },
  },
});

export const pageContent = style({
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  
  // Ensure first child has no extra margin for perfect alignment with topRow/titleRow
  selectors: {
    '& > *:first-child': {
      marginTop: 0,
    },
  },
});
