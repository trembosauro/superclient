import { Link } from 'wouter';
import { navItemRoot } from './navItem.css';

export interface NavItemProps {
  label: string;
  href: string;
  active?: boolean;
}

export function NavItem({ label, href, active = false }: NavItemProps) {
  return (
    <Link 
      href={href} 
      className={navItemRoot}
      aria-current={active ? 'page' : undefined}
    >
      {label}
    </Link>
  );
}
