import { ReactNode } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import { IconButton as MuiIconButton } from '@mui/material';
import { appBar, appBarInner, brandSlot, navSlot, actionsSlot, mobileActions } from './appBar.css';

export interface AppBarProps {
  brandSlot: ReactNode;
  navSlot?: ReactNode;
  actionsSlot?: ReactNode;
  showMobileMenuButton?: boolean;
  onMenuClick?: () => void;
  mobileActionsSlot?: ReactNode;
}

export function AppBar({
  brandSlot,
  navSlot,
  actionsSlot,
  showMobileMenuButton = true,
  onMenuClick,
  mobileActionsSlot,
}: AppBarProps) {
  return (
    <header className={appBar}>
      <div className={appBarInner}>
        <div className={brandSlot}>
          {brandSlot}
        </div>
        
        {navSlot && (
          <nav className={navSlot}>
            {navSlot}
          </nav>
        )}
        
        {actionsSlot && (
          <div className={actionsSlot}>
            {actionsSlot}
          </div>
        )}
        
        <div className={mobileActions}>
          {mobileActionsSlot}
          {showMobileMenuButton && (
            <MuiIconButton
              aria-label="Abrir menu"
              onClick={onMenuClick}
              sx={{
                color: 'text.primary',
                border: '1px solid rgba(255,255,255,0.12)',
                backgroundColor: 'rgba(7, 9, 13, 0.45)',
                '&:hover': {
                  backgroundColor: 'rgba(7, 9, 13, 0.6)',
                },
              }}
            >
              <MenuIcon fontSize="small" />
            </MuiIconButton>
          )}
        </div>
      </div>
    </header>
  );
}
