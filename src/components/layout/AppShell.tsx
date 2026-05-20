import { useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import BottomNav from './BottomNav';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme]);

  return (
    // box-content is the key:
    //   height:100dvh sets the CONTENT area to the full dynamic viewport.
    //   padding-bottom:env(safe-area-inset-bottom) then EXTENDS the element's
    //   total box into the physical safe-area zone below — without shrinking the
    //   flex layout area (which stays 100dvh). BottomNav's bleed strip fills
    //   that padding zone with nav colour so no background mismatch is visible.
    //   This pattern avoids the iOS 26+ PWA double-padding bug described at
    //   github.com/we-promise/sure/issues/835.
    <div
      className="box-content flex flex-col bg-ios-bg dark:bg-ios-dark-bg"
      style={{
        height: '100dvh',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <main className="flex-1 min-h-0 overflow-y-auto scroll-area">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
