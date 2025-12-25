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
  transition: 'background-color 150ms cubic-bezier(0.4, 0, 0.2, 1), border-color 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  
  ':hover': {
    backgroundColor: 'var(--sc-card-hover-bg)',
    borderColor: 'var(--sc-card-hover-border)',
  },
  
  ':active': {
    backgroundColor: 'var(--sc-card-pressed-bg)',
  },
  
  ':focus-visible': {
    outline: '2px solid var(--md-sys-color-primary)',
    outlineOffset: '2px',
  },
});

export const cardSectionCompact = style({
  padding: 'var(--sc-card-section-padding-compact)',
  minHeight: '64px',
});
