import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { VoiceGuardProvider } from './context/VoiceGuardContext';
import { AppShell } from './components/navigation/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { MomCallPage } from './pages/MomCallPage';
import { RahulDevicePage } from './pages/RahulDevicePage';
import { DadShieldPage } from './pages/DadShieldPage';
import { CallerVerifyPage } from './pages/CallerVerifyPage';
import { FamilyLoginPage } from './pages/FamilyLoginPage';
import { FamilyManagementPage } from './pages/FamilyManagementPage';

export function App() {
  return (
    <VoiceGuardProvider>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/mom" element={<MomCallPage />} />
            <Route path="/rahul" element={<RahulDevicePage />} />
            <Route path="/dad" element={<DadShieldPage />} />
            <Route path="/caller" element={<CallerVerifyPage />} />
            <Route path="/login" element={<FamilyLoginPage />} />
            <Route path="/family" element={<FamilyManagementPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </VoiceGuardProvider>
  );
}

export default App;
