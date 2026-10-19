import type { ComponentType, SVGProps } from 'react';
import { Link, NavLink } from 'react-router';

import { cn } from '../lib/cn';
import { BeanIcon, CupIcon, GridIcon, PinIcon, ReceiptIcon } from '../ui/icons';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Дашборд', icon: GridIcon, end: true },
  { to: '/orders', label: 'Заказы', icon: ReceiptIcon },
  { to: '/menu', label: 'Меню', icon: CupIcon },
  { to: '/locations', label: 'Точки', icon: PinIcon },
];

function Logo() {
  return (
    <Link
      to="/"
      className="flex items-center gap-3 rounded-2xl"
      aria-label="CoffeeMetrics — дашборд"
    >
      <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-on-dark lg:size-12">
        <BeanIcon width={24} height={24} />
      </span>
      <span className="text-lg font-bold tracking-tight text-ink lg:text-xl">CoffeeMetrics</span>
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 z-20 border-b border-line bg-canvas/95 backdrop-blur lg:h-screen lg:w-72 lg:shrink-0 lg:border-r lg:border-b-0 lg:bg-canvas">
      <div className="flex flex-col gap-3 px-4 py-3 sm:px-6 lg:gap-10 lg:px-5 lg:py-8">
        <div className="lg:px-2">
          <Logo />
        </div>
        <nav aria-label="Основная навигация" className="-mx-1 overflow-x-auto">
          <ul className="flex gap-1 px-1 lg:flex-col lg:gap-2">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-2xl px-4 py-2.5 text-[15px] font-medium whitespace-nowrap transition-colors lg:py-3.5',
                      isActive
                        ? 'bg-espresso text-on-dark'
                        : 'text-ink-soft hover:bg-surface-muted hover:text-ink',
                    )
                  }
                >
                  <Icon />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
