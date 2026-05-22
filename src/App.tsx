import { lazy, Suspense, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ColorThemeProvider } from './context/ColorThemeContext';
import { TutorialProvider, useTutorial } from './context/TutorialContext';
import { useVehicle } from './hooks/useVehicle';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import MaintenancePage from './pages/Maintenance';
import FuelPage from './pages/Fuel';
import SettingsPage from './pages/Settings';
import Onboarding from './pages/Onboarding';

// Lazy-load the Reports page so recharts (~280 KB) doesn't inflate the initial bundle.
const ReportsPage = lazy(() => import('./pages/Reports'));

const ONBOARDING_KEY = 'mototrack-onboarding-seen';

function AppRoutes() {
  const { vehicle, allVehicles } = useVehicle();
  const { start: startTutorial } = useTutorial();
  const [onboardingDone, setOnboardingDone] = useState(
    () => localStorage.getItem(ONBOARDING_KEY) === '1',
  );

  const handleOnboardingDone = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    setOnboardingDone(true);
  };

  if (vehicle === undefined) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#F2F2F7] dark:bg-black">
        <div className="w-8 h-8 rounded-full border-2 border-ios-blue/30 border-t-ios-blue animate-spin" />
      </div>
    );
  }

  if (allVehicles.length === 0 && !onboardingDone) {
    return (
      <Onboarding
        onDone={handleOnboardingDone}
        onStartTutorial={() => {
          handleOnboardingDone(); // lift the gate so AppShell renders with demo data
          startTutorial();       // activate the tutorial banner
        }}
      />
    );
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/fuel" element={<FuelPage />} />
        <Route path="/reports" element={
          <Suspense fallback={
            <div className="fixed inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-ios-blue/30 border-t-ios-blue animate-spin" />
            </div>
          }>
            <ReportsPage />
          </Suspense>
        } />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ColorThemeProvider>
        <TutorialProvider>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </TutorialProvider>
      </ColorThemeProvider>
    </ThemeProvider>
  );
}
