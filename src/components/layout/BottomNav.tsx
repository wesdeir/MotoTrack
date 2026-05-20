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
    // position:fixed keeps the nav anchored to bottom:0 of the viewport.
    // paddingBottom pushes tab content above the home indicator.
    //
    // The <div> below ("bleed strip") extends the nav's background colour
    // into the physical safe-area gap that iOS leaves between bottom:0 and
    // the actual screen edge in PWA standalone mode. It has no height when
    // env(safe-area-inset-bottom) is 0 (e.g. desktop / older iPhones), so
    // it never adds unwanted space on non-notched devices.
    <nav
      className="fixed bottom-0 inset-x-0 z-50 bg-white/95 dark:bg-[#1C1C1E] backdrop-blur-xl border-t border-gray-200 dark:border-zinc-800"
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

      {/* Bleed strip: paints the nav colour into the safe-area gap that sits
          between bottom:0 and the physical screen edge on Face ID iPhones.
          top:100% places it flush below the nav element; its height exactly
          equals the safe-area inset so it vanishes on devices without one. */}
      <div
        className="absolute inset-x-0 bg-white dark:bg-[#1C1C1E]"
        style={{ top: '100%', height: 'env(safe-area-inset-bottom, 0px)' }}
      />
    </nav>
  );
}
