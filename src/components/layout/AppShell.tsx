import { useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import BottomNav from './BottomNav';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme]);

  return (
    <div className="flex flex-col h-full bg-ios-bg dark:bg-ios-dark-bg">
      <main
        className="flex-1 overflow-y-auto scroll-area"
        style={{ paddingBottom: `calc(var(--nav-height) + var(--safe-bottom) + 8px)` }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
