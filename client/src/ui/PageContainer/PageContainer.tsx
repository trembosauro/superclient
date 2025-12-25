import type { ReactNode } from 'react';
import {
  pageContainer,
  pageContent,
} from './pageContainer.css';
import { pageHeaderContainer } from '../PageHeader/pageHeader.css';
import { PageTitle } from '../PageHeader/PageTitle';
import { PageActions } from '../PageHeader/PageActions';

export interface PageContainerProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actionsSlot?: ReactNode;
}

export function PageContainer({ children, title, subtitle, actionsSlot }: PageContainerProps) {
  return (
    <div className={pageContainer}>
      {(title || actionsSlot) && (
        <div 
          className={pageHeaderContainer} 
          style={!title && actionsSlot ? { justifyContent: 'flex-end' } : undefined}
        >
          {title && <PageTitle subtitle={subtitle}>{title}</PageTitle>}
          {actionsSlot && <PageActions>{actionsSlot}</PageActions>}
        </div>
      )}
      <div className={pageContent}>{children}</div>
    </div>
  );
}
