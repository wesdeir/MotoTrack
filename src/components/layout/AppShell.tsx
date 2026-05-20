import { useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import BottomNav from './BottomNav';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme]);

  return (
    // h-full inherits from #root which is 100dvh — the full physical screen height.
    // BottomNav is a normal flex child (not fixed), so it always sits flush at the
    // screen bottom without any iOS Safari fixed-positioning quirks.
    <div className="fixed inset-0 flex flex-col bg-ios-bg dark:bg-ios-dark-bg">
      <main className="flex-1 min-h-0 overflow-y-auto scroll-area">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
