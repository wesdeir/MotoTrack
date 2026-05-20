import { useLocation, NavLink } from 'react-router-dom';
import { Home, Wrench, Droplets, BarChart2, Settings2 } from 'lucide-react';

const TABS = [
  { to: '/', icon: Home, label: 'Home', exact: true },
  { to: '/maintenance', icon: Wrench, label: 'Service', exact: false },
  { to: '/fuel', icon: Droplets, label: 'Fuel', exact: false },
  { to: '/reports', icon: BarChart2, label: 'Reports', exact: false },
  { to: '/settings', icon: Settings2, label: 'Settings', exact: false },
] as const;

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl border-t border-gray-200 dark:border-zinc-800"
      style={{
        height: `calc(var(--nav-height) + var(--safe-bottom))`,
        paddingBottom: 'var(--safe-bottom)',
      }}
    >
      <div className="flex h-14">
        {TABS.map(({ to, icon: Icon, label, exact }) => {
          const active = exact ? location.pathname === to : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className="flex-1 flex flex-col items-center justify-center gap-0.5"
            >
              <Icon
                size={24}
                className={active ? 'text-ios-blue' : 'text-ios-gray dark:text-gray-500'}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span
                className={`text-[10px] font-medium ${
                  active ? 'text-ios-blue' : 'text-ios-gray dark:text-gray-500'
                }`}
              >
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
