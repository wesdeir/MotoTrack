import { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ColorThemeProvider } from './context/ColorThemeContext';
import { useVehicle } from './hooks/useVehicle';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import MaintenancePage from './pages/Maintenance';
import FuelPage from './pages/Fuel';
import ReportsPage from './pages/Reports';
import SettingsPage from './pages/Settings';
import Onboarding from './pages/Onboarding';

const ONBOARDING_KEY = 'mototrack-onboarding-seen';

function AppRoutes() {
  const { vehicle, allVehicles } = useVehicle();
  const [onboardingDone, setOnboardingDone] = useState(
    () => localStorage.getItem(ONBOARDING_KEY) === '1',
  );

  const handleOnboardingDone = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    setOnboardingDone(true);
  };

  if (vehicle === undefined) return null;

  if (allVehicles.length === 0 && !onboardingDone) {
    return <Onboarding onDone={handleOnboardingDone} />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/fuel" element={<FuelPage />} />
        <Route path="/reports" element={<ReportsPage />} />
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
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </ColorThemeProvider>
    </ThemeProvider>
  );
}
