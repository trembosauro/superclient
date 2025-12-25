import { style } from '@vanilla-extract/css';

export const cardSection = style({
  backgroundColor: 'var(--sc-card-bg)',
  borderRadius: 'var(--sc-card-radius)',
  border: '1px solid var(--sc-card-border)',
  boxShadow: 'var(--sc-card-shadow)',
  padding: 'var(--sc-card-section-padding-default)',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
});

export const cardSectionInteractive = style({
  cursor: 'pointer',
  transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  
  ':hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.16)',
  },
  
  ':active': {
    transform: 'translateY(0)',
  },
});

export const cardSectionCompact = style({
  padding: 'var(--sc-card-section-padding-compact)',
  minHeight: '64px',
});
