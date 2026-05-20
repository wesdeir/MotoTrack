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
    // flex-shrink-0: plain flex child, sits at the bottom of AppShell's
    //   -webkit-fill-available height (= true physical screen bottom).
    // paddingBottom: keeps icons above the home indicator — single safe-area
    //   application (not duplicated on body or AppShell).
    // relative + bleed strip: defensive fill in case any residual sub-pixel
    //   gap remains; has zero height on devices with no safe-area inset.
    <nav
      className="relative flex-shrink-0 bg-white/95 dark:bg-[#080E1C]/80 backdrop-blur-xl border-t border-gray-200 dark:border-white/[0.08]"
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
                className={`${active ? 'text-ios-blue' : 'text-ios-gray dark:text-gray-500'} ${active ? 'nav-icon-active' : ''}`}
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

      {/* Bleed strip: defensive cover for any sub-pixel gap below the nav.
          Resolves to height:0 on devices with no home indicator. */}
      <div
        className="absolute inset-x-0 bg-white dark:bg-[#080E1C]"
        style={{ top: '100%', height: 'env(safe-area-inset-bottom, 0px)' }}
      />
    </nav>
  );
}
