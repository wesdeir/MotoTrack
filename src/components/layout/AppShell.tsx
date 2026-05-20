import { useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import BottomNav from './BottomNav';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme]);

  return (
    // h-full flex column. BottomNav is position:fixed so it exits the flex
    // flow — main gets the full height. paddingBottom on main ensures
    // scrollable content is never hidden behind the fixed nav.
    <div className="h-full flex flex-col bg-ios-bg dark:bg-ios-dark-bg">
      <main
        className="flex-1 min-h-0 overflow-y-auto scroll-area"
        style={{ paddingBottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
