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
    // flex-shrink-0: sits at the bottom of AppShell's 100dvh content area.
    // paddingBottom: keeps icons above the home indicator (single safe-area
    //   application — NOT duplicated on body or AppShell).
    // relative: establishes the containing block for the bleed strip below.
    // Bleed strip (absolute, top:100%): extends nav colour into the
    //   env(safe-area-inset-bottom) padding zone that AppShell's box-content
    //   layout creates below the flex content area, eliminating any colour
    //   mismatch between the nav and the physical screen edge.
    <nav
      className="relative flex-shrink-0 bg-white/95 dark:bg-[#1C1C1E] backdrop-blur-xl border-t border-gray-200 dark:border-zinc-800"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex h-14 items-center">
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

      {/* Bleed strip: fills the AppShell box-content padding zone (the
          physical safe-area below the flex content area) with nav colour.
          height matches the safe-area inset so it vanishes on devices
          without a home indicator (resolves to 0px). */}
      <div
        className="absolute inset-x-0 bg-white dark:bg-[#1C1C1E]"
        style={{ top: '100%', height: 'env(safe-area-inset-bottom, 0px)' }}
      />
    </nav>
  );
}
