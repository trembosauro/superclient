import { ReactNode } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import { IconButton as MuiIconButton } from '@mui/material';
import { 
  appBar, 
  appBarInner, 
  brandSlot as brandSlotClass, 
  navSlot as navSlotClass, 
  actionsSlot as actionsSlotClass, 
  mobileActions 
} from './appBar.css';

export interface AppBarProps {
  brandSlot: ReactNode;
  navSlot?: ReactNode;
  actionsSlot?: ReactNode;
  showMobileMenuButton?: boolean;
  onMenuClick?: (event: React.MouseEvent<HTMLElement>) => void;
  mobileActionsSlot?: ReactNode;
}

export function AppBar({
  brandSlot: brandSlotProp,
  navSlot: navSlotProp,
  actionsSlot: actionsSlotProp,
  showMobileMenuButton = true,
  onMenuClick,
  mobileActionsSlot,
}: AppBarProps) {
  return (
    <header className={appBar}>
      <div className={appBarInner}>
        <div className={brandSlotClass}>
          {brandSlotProp}
        </div>

        {navSlotProp && (
          <nav className={navSlotClass}>
            {navSlotProp}
          </nav>
        )}

        {actionsSlotProp && (
          <div className={actionsSlotClass}>
            {actionsSlotProp}
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
