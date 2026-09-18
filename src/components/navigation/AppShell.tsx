import React from 'react';
import { Navbar } from './Navbar';
import { DemoFloatingBar } from '../demo/DemoFloatingBar';
import { IncidentCapsule } from '../security/IncidentCapsule';
import { useVoiceGuard } from '../../context/VoiceGuardContext';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { incident, isIncidentModalOpen, setIsIncidentModalOpen } = useVoiceGuard();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#111827] relative selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      <main className="flex-1 flex flex-col relative z-10">{children}</main>

      {/* Floating demo controller for pitch & multi-window control */}
      <DemoFloatingBar />

      {/* Global Incident Capsule Modal */}
      <IncidentCapsule
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        incident={incident}
      />
    </div>
  );
};
