import { useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import BottomNav from './BottomNav';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme]);

  return (
    // h-full propagates -webkit-fill-available from html → body → #root → here,
    // giving AppShell the true physical screen height on iOS PWA. BottomNav is a
    // plain flex child so it naturally sits at the real screen bottom.
    <div className="h-full flex flex-col bg-ios-bg dark:bg-ios-dark-bg">
      <main className="flex-1 min-h-0 overflow-y-auto scroll-area">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
