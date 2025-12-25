// Centralized design-system tokens.
// Update values here to propagate globally.

export const APP_RADIUS_PX = 16;
export const APP_RADIUS = `${APP_RADIUS_PX}px`;

// Design system colors (Material Design 3 inspired)
export const DESIGN_TOKENS = {
  colors: {
    light: {
      primary: '#1976d2',
      onPrimary: '#ffffff',
      surface: '#ffffff',
      onSurface: '#1a1a1a',
      onSurfaceVariant: '#5f6368',
      outline: '#79747e',
      error: '#ba1a1a',
    },
    dark: {
      primary: '#22c9a6',
      onPrimary: '#003258',
      surface: '#0b0f14',
      onSurface: '#e6edf3',
      onSurfaceVariant: '#c9d1d9',
      outline: '#938f99',
      error: '#ffb4ab',
    },
  },
  alpha: {
    hover: '0.08',
    pressed: '0.12',
    selected: '0.12',
    disabled: '0.38',
  },
  radius: {
    sm: '8px',
    md: '16px',
    lg: '24px',
  },
  navigation: {
    itemPaddingX: '8px',
    itemPaddingY: '6px',
    itemRadius: '4px', // TODO: confirmar se deve ser 4px (padrão MUI) ou 16px (override do sistema)
    itemFontWeight: '600',
    activeFg: '#90caf9', // primary.main no dark theme
    inactiveFg: 'rgba(255, 255, 255, 0.7)', // text.secondary
    activeBg: 'rgba(34, 201, 166, 0.12)',
    hoverBg: 'rgba(34, 201, 166, 0.08)',
    pressedBg: 'rgba(34, 201, 166, 0.16)',
  },
  brand: {
    fontWeight: '700',
    fontSize: '0.875rem',
    lineHeight: '1.75',
    letterSpacing: '0.02857em',
    color: 'var(--md-sys-color-on-surface)',
    hoverBg: 'rgba(34, 201, 166, 0.08)',
    pressedBg: 'rgba(34, 201, 166, 0.16)',
  },
  iconButton: {
    padding: '4px', // p: 0.5 no MUI = 4px
    color: 'rgba(34, 201, 166, 0.7)',
    activeBorder: '1px solid rgba(34, 201, 166, 0.6)',
    inactiveBorder: '1px solid transparent',
    activeBg: 'rgba(34, 201, 166, 0.12)',
    hoverBg: 'rgba(34, 201, 166, 0.12)',
    pressedBg: 'rgba(34, 201, 166, 0.28)',
    pressedColor: 'rgba(34, 201, 166, 0.9)',
  },
  avatar: {
    width: '32px',
    height: '32px',
    fontSize: '14px',
    bgcolor: 'rgba(34, 201, 166, 0.18)',
    borderRadius: '16px', // APP_RADIUS
    activeBorder: '1px solid rgba(34, 201, 166, 0.6)',
    inactiveBorder: '1px solid transparent',
    activeBg: 'rgba(34, 201, 166, 0.12)',
  },
  header: {
    height: '64px',
    pxDesktop: '24px',
    pxMobile: '16px',
    actionsGap: '8px',
    navGap: '6px',
    nav: {
      px: '14px',
      py: '10px',
      radius: '999px',
      fg: 'var(--md-sys-color-on-surface-variant)',
      fgActive: 'var(--md-sys-color-primary)',
      bgHover: 'color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent)',
      bgActive: 'color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent)',
      bgPressed: 'color-mix(in srgb, var(--md-sys-color-primary) 16%, transparent)',
    },
    icon: {
      size: '36px',
      radius: '10px',
      fg: 'color-mix(in srgb, var(--md-sys-color-primary) 70%, transparent)',
      bgHover: 'color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent)',
      bgActive: 'color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent)',
      bgPressed: 'color-mix(in srgb, var(--md-sys-color-primary) 28%, transparent)',
      borderActive: 'color-mix(in srgb, var(--md-sys-color-primary) 60%, transparent)',
    },
  },
};

export const applyDesignTokensToCssVars = () => {
  const root = document.documentElement;
  
  // Determine color scheme (default to dark for now)
  const isDark = true; // Could be read from theme context or system preference
  const colors = isDark ? DESIGN_TOKENS.colors.dark : DESIGN_TOKENS.colors.light;
  
  // Apply color tokens
  root.style.setProperty('--md-sys-color-primary', colors.primary);
  root.style.setProperty('--md-sys-color-on-primary', colors.onPrimary);
  root.style.setProperty('--md-sys-color-surface', colors.surface);
  root.style.setProperty('--md-sys-color-on-surface', colors.onSurface);
  root.style.setProperty('--md-sys-color-on-surface-variant', colors.onSurfaceVariant);
  root.style.setProperty('--md-sys-color-outline', colors.outline);
  root.style.setProperty('--md-sys-color-error', colors.error);
  
  // Apply alpha tokens
  root.style.setProperty('--md-sys-alpha-hover', DESIGN_TOKENS.alpha.hover);
  root.style.setProperty('--md-sys-alpha-pressed', DESIGN_TOKENS.alpha.pressed);
  root.style.setProperty('--md-sys-alpha-selected', DESIGN_TOKENS.alpha.selected);
  root.style.setProperty('--md-sys-alpha-disabled', DESIGN_TOKENS.alpha.disabled);
  
  // Apply radius tokens
  root.style.setProperty('--md-sys-radius-sm', DESIGN_TOKENS.radius.sm);
  root.style.setProperty('--md-sys-radius-md', DESIGN_TOKENS.radius.md);
  root.style.setProperty('--md-sys-radius-lg', DESIGN_TOKENS.radius.lg);
  
  // Apply navigation tokens
  root.style.setProperty('--sc-nav-item-px', DESIGN_TOKENS.navigation.itemPaddingX);
  root.style.setProperty('--sc-nav-item-py', DESIGN_TOKENS.navigation.itemPaddingY);
  root.style.setProperty('--sc-nav-item-radius', DESIGN_TOKENS.navigation.itemRadius);
  root.style.setProperty('--sc-nav-item-font-weight', DESIGN_TOKENS.navigation.itemFontWeight);
  root.style.setProperty('--sc-nav-active-fg', DESIGN_TOKENS.navigation.activeFg);
  root.style.setProperty('--sc-nav-inactive-fg', DESIGN_TOKENS.navigation.inactiveFg);
  root.style.setProperty('--sc-nav-active-bg', DESIGN_TOKENS.navigation.activeBg);
  root.style.setProperty('--sc-nav-hover-bg', DESIGN_TOKENS.navigation.hoverBg);
  root.style.setProperty('--sc-nav-pressed-bg', DESIGN_TOKENS.navigation.pressedBg);
  
  // Apply brand tokens
  root.style.setProperty('--sc-brand-font-weight', DESIGN_TOKENS.brand.fontWeight);
  root.style.setProperty('--sc-brand-font-size', DESIGN_TOKENS.brand.fontSize);
  root.style.setProperty('--sc-brand-line-height', DESIGN_TOKENS.brand.lineHeight);
  root.style.setProperty('--sc-brand-letter-spacing', DESIGN_TOKENS.brand.letterSpacing);
  root.style.setProperty('--sc-brand-color', DESIGN_TOKENS.brand.color);
  root.style.setProperty('--sc-brand-hover-bg', DESIGN_TOKENS.brand.hoverBg);
  root.style.setProperty('--sc-brand-pressed-bg', DESIGN_TOKENS.brand.pressedBg);
  
  // Apply icon button tokens
  root.style.setProperty('--sc-iconbtn-padding', DESIGN_TOKENS.iconButton.padding);
  root.style.setProperty('--sc-iconbtn-color', DESIGN_TOKENS.iconButton.color);
  root.style.setProperty('--sc-iconbtn-active-border', DESIGN_TOKENS.iconButton.activeBorder);
  root.style.setProperty('--sc-iconbtn-inactive-border', DESIGN_TOKENS.iconButton.inactiveBorder);
  root.style.setProperty('--sc-iconbtn-active-bg', DESIGN_TOKENS.iconButton.activeBg);
  root.style.setProperty('--sc-iconbtn-hover-bg', DESIGN_TOKENS.iconButton.hoverBg);
  root.style.setProperty('--sc-iconbtn-pressed-bg', DESIGN_TOKENS.iconButton.pressedBg);
  root.style.setProperty('--sc-iconbtn-pressed-color', DESIGN_TOKENS.iconButton.pressedColor);
  
  // Apply avatar tokens
  root.style.setProperty('--sc-avatar-width', DESIGN_TOKENS.avatar.width);
  root.style.setProperty('--sc-avatar-height', DESIGN_TOKENS.avatar.height);
  root.style.setProperty('--sc-avatar-font-size', DESIGN_TOKENS.avatar.fontSize);
  root.style.setProperty('--sc-avatar-bgcolor', DESIGN_TOKENS.avatar.bgcolor);
  root.style.setProperty('--sc-avatar-border-radius', DESIGN_TOKENS.avatar.borderRadius);
  root.style.setProperty('--sc-avatar-active-border', DESIGN_TOKENS.avatar.activeBorder);
  root.style.setProperty('--sc-avatar-inactive-border', DESIGN_TOKENS.avatar.inactiveBorder);
  root.style.setProperty('--sc-avatar-active-bg', DESIGN_TOKENS.avatar.activeBg);
  
  // Apply header layout tokens
  root.style.setProperty('--sc-header-height', DESIGN_TOKENS.header.height);
  root.style.setProperty('--sc-header-px-desktop', DESIGN_TOKENS.header.pxDesktop);
  root.style.setProperty('--sc-header-px-mobile', DESIGN_TOKENS.header.pxMobile);
  root.style.setProperty('--sc-header-actions-gap', DESIGN_TOKENS.header.actionsGap);
  root.style.setProperty('--sc-header-nav-gap', DESIGN_TOKENS.header.navGap);
  
  // Apply header nav tokens
  root.style.setProperty('--sc-header-nav-px', DESIGN_TOKENS.header.nav.px);
  root.style.setProperty('--sc-header-nav-py', DESIGN_TOKENS.header.nav.py);
  root.style.setProperty('--sc-header-nav-radius', DESIGN_TOKENS.header.nav.radius);
  root.style.setProperty('--sc-header-nav-fg', DESIGN_TOKENS.header.nav.fg);
  root.style.setProperty('--sc-header-nav-fg-active', DESIGN_TOKENS.header.nav.fgActive);
  root.style.setProperty('--sc-header-nav-bg-hover', DESIGN_TOKENS.header.nav.bgHover);
  root.style.setProperty('--sc-header-nav-bg-active', DESIGN_TOKENS.header.nav.bgActive);
  root.style.setProperty('--sc-header-nav-bg-pressed', DESIGN_TOKENS.header.nav.bgPressed);
  
  // Apply header icon tokens
  root.style.setProperty('--sc-header-icon-size', DESIGN_TOKENS.header.icon.size);
  root.style.setProperty('--sc-header-icon-radius', DESIGN_TOKENS.header.icon.radius);
  root.style.setProperty('--sc-header-icon-fg', DESIGN_TOKENS.header.icon.fg);
  root.style.setProperty('--sc-header-icon-bg-hover', DESIGN_TOKENS.header.icon.bgHover);
  root.style.setProperty('--sc-header-icon-bg-active', DESIGN_TOKENS.header.icon.bgActive);
  root.style.setProperty('--sc-header-icon-bg-pressed', DESIGN_TOKENS.header.icon.bgPressed);
  root.style.setProperty('--sc-header-icon-border-active', DESIGN_TOKENS.header.icon.borderActive);
  
  // Keep legacy radius variables in sync
  const radius = `${APP_RADIUS_PX}px`;
  root.style.setProperty('--radius', radius);
  root.style.setProperty('--radius-card', radius);
  root.style.setProperty('--radius-button', radius);
};
