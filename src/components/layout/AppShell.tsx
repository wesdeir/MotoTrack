import { useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import BottomNav from './BottomNav';
import { useSwipeNavigation } from '../../hooks/useSwipeNavigation';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  useSwipeNavigation();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme]);

  return (
    // `fixed inset-0` pins AppShell to the exact viewport — bypasses the
    // height:100% inheritance chain that iOS Safari breaks when content is
    // short. `main` gets a *definite* height via flex-1 so children can use
    // h-full / flex-1 reliably, and BottomNav is always at the screen bottom
    // regardless of how much content the current page has.
    <div className="fixed inset-0 flex flex-col bg-transparent">
      <main className="flex-1 min-h-0 overflow-y-auto scroll-area">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
