import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type {
  ActionProtectionState,
  CallStatus,
  DemoStep,
  FamilyMember,
  Incident,
  RiskLevel,
  SecurityEvent,
  TranscriptMessage,
  VerificationRequest,
} from '../types';

import {
  DEFAULT_INCIDENT,
  INITIAL_FAMILY_MEMBERS,
  INITIAL_SECURITY_EVENTS,
  INITIAL_TRANSCRIPT,
  SUSPICIOUS_TRANSCRIPT,
} from '../data/mockData';
import { api, DEFAULT_FAMILY_ID, WS_URL } from '../services/api';

interface VoiceGuardContextType {

  // Call State
  callStatus: CallStatus;
  callDuration: number;
  isMuted: boolean;
  isSpeaker: boolean;
  callerName: string;
  callerNumber: string;
  callId: string;
  riskLevel: RiskLevel;
  transcript: TranscriptMessage[];
  isWhyPanelOpen: boolean;
  isVerifyModalOpen: boolean;
  isIncidentModalOpen: boolean;

  // Family & Verification State
  familyMembers: FamilyMember[];
  verificationRequest: VerificationRequest;
  actionProtection: ActionProtectionState;
  familyAlert: { isTriggered: boolean; title: string; subtitle: string; timestamp: string } | null;
  incident: Incident;
  recentEvents: SecurityEvent[];
  demoStep: DemoStep;

  // Action methods
  startDemoCall: () => void;
  triggerSuspicious: () => void;
  requestVerification: () => void;
  respondRahul: (isMe: boolean) => void;
  dismissActionProtection: () => void;
  setRiskLevel: (level: RiskLevel) => void;
  setIsWhyPanelOpen: (open: boolean) => void;
  setIsVerifyModalOpen: (open: boolean) => void;
  setIsIncidentModalOpen: (open: boolean) => void;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  endCall: () => void;
  resetDemo: () => void;
  runDemoStep: (step: DemoStep) => void;
}

const VoiceGuardContext = createContext<VoiceGuardContextType | undefined>(undefined);

const BROADCAST_CHANNEL_NAME = 'voiceguard_cross_tab_channel';

export const VoiceGuardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Call state
  const [callStatus, setCallStatus] = useState<CallStatus>('connected');
  const [callDuration, setCallDuration] = useState<number>(14);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeaker, setIsSpeaker] = useState<boolean>(false);
  const [callerName] = useState<string>('Rahul');
  const [callerNumber] = useState<string>('+91 98765 43210');
  const [callId, setCallId] = useState<string>('VG-2841');
  const [riskLevel, setRiskLevelState] = useState<RiskLevel>('LOW RISK');
  const [transcript, setTranscript] = useState<TranscriptMessage[]>(INITIAL_TRANSCRIPT);
  const [isWhyPanelOpen, setIsWhyPanelOpen] = useState<boolean>(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState<boolean>(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState<boolean>(false);

  // Security & Verification state
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(INITIAL_FAMILY_MEMBERS);
  const [verificationRequest, setVerificationRequest] = useState<VerificationRequest>({
    callId: 'VG-2841',
    timestamp: 'Just now',
    claimedIdentity: 'Rahul',
    caller: 'Mom',
    status: 'none',
  });
  const [actionProtection, setActionProtection] = useState<ActionProtectionState>({
    isTriggered: false,
    actionType: 'OTP Sharing',
    reason: 'The caller’s identity could not be independently verified. This action has been temporarily blocked for your protection.',
  });
  const [familyAlert, setFamilyAlert] = useState<{
    isTriggered: boolean;
    title: string;
    subtitle: string;
    timestamp: string;
  } | null>(null);
  const [incident, setIncident] = useState<Incident>(DEFAULT_INCIDENT);


  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>(INITIAL_SECURITY_EVENTS);
  const [demoStep, setDemoStep] = useState<DemoStep>(1);

  // Cross-tab broadcast channel ref
  const channelRef = useRef<BroadcastChannel | null>(null);
  const isBroadcastingRef = useRef<boolean>(false);

  // Broadcast state helper
  const broadcastSync = (data: any) => {
    if (channelRef.current && !isBroadcastingRef.current) {
      try {
        channelRef.current.postMessage({ type: 'VOICEGUARD_SYNC', data });
      } catch (e) {
        console.warn('BroadcastChannel error', e);
      }
    }
  };

  // Timer for active call duration
  useEffect(() => {
    if (callStatus !== 'connected' && callStatus !== 'verifying') return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callStatus]);

  // Initialize BroadcastChannel for multi-window / multi-device demoing
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channelRef.current = channel;

      channel.onmessage = (event) => {
        if (event.data?.type === 'VOICEGUARD_SYNC' && event.data?.data) {
          isBroadcastingRef.current = true;
          const d = event.data.data;
          if (d.callStatus !== undefined) setCallStatus(d.callStatus);
          if (d.riskLevel !== undefined) setRiskLevelState(d.riskLevel);
          if (d.transcript !== undefined) setTranscript(d.transcript);
          if (d.verificationRequest !== undefined) setVerificationRequest(d.verificationRequest);
          if (d.actionProtection !== undefined) setActionProtection(d.actionProtection);
          if (d.familyAlert !== undefined) setFamilyAlert(d.familyAlert);
          if (d.demoStep !== undefined) setDemoStep(d.demoStep);
          if (d.familyMembers !== undefined) setFamilyMembers(d.familyMembers);
          if (d.isVerifyModalOpen !== undefined) setIsVerifyModalOpen(d.isVerifyModalOpen);
          setTimeout(() => {
            isBroadcastingRef.current = false;
          }, 50);
        }
      };

      return () => {
        channel.close();
      };
    }
  }, []);

  // Connect to FastAPI WebSocket while keeping BroadcastChannel active as fallback
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let role = 'mom';
    const path = window.location.pathname;
    if (path.includes('/rahul')) role = 'son';
    else if (path.includes('/dad')) role = 'dad';
    else if (path.includes('/caller')) role = 'scammer';

    let ws: WebSocket | null = null;
    try {
      const wsUrl = `${WS_URL}/ws/${DEFAULT_FAMILY_ID}?role=${role}`;
      ws = new WebSocket(wsUrl);

      ws.onmessage = (messageEvent) => {
        try {
          const payload = JSON.parse(messageEvent.data);
          if (!payload || !payload.event) return;

          switch (payload.event) {
            case 'CALL_STARTED':
              if (payload.call_id) setCallId(payload.call_id);
              setCallStatus('connected');
              break;

            case 'TRANSCRIPT_UPDATED':
              if (payload.transcript) {
                setTranscript((prev) => {
                  const last = prev[prev.length - 1];
                  if (last && last.text === payload.transcript) return prev;
                  return [
                    ...prev,
                    {
                      id: `t-${Date.now()}`,
                      speaker: 'Rahul',
                      text: payload.transcript,
                      timestamp: 'Just now',
                      isSuspicious: payload.transcript.toLowerCase().includes('otp') || payload.transcript.toLowerCase().includes('urgent'),
                    },
                  ];
                });
              }
              break;

            case 'RISK_UPDATED':
              if (payload.risk_level === 'HIGH') {
                setRiskLevelState('HIGH RISK');
              } else if (payload.risk_level === 'SUSPICIOUS' || payload.risk_level === 'MEDIUM') {
                setRiskLevelState('SUSPICIOUS');
              } else if (payload.risk_level === 'LOW') {
                setRiskLevelState('LOW RISK');
              }
              break;

            case 'VERIFY_REQUESTED':
              setVerificationRequest({
                callId: payload.call_id || callId,
                timestamp: 'Just now',
                claimedIdentity: payload.claimed_identity || 'Rahul',
                caller: payload.caller_number || 'Mom',
                status: 'pending',
              });
              setIsVerifyModalOpen(false);
              break;

            case 'SON_CONFIRMED':
            case 'VERIFICATION_SUCCESS':
              setVerificationRequest((prev) => ({ ...prev, status: 'confirmed_yes', respondedAt: 'Just now' }));
              setRiskLevelState('IDENTITY VERIFIED');
              setIsVerifyModalOpen(false);
              break;

            case 'SON_DENIED':
            case 'IMPERSONATION_CONFIRMED':
              setVerificationRequest((prev) => ({ ...prev, status: 'confirmed_no', respondedAt: 'Just now' }));
              setRiskLevelState('IMPERSONATION CONFIRMED');
              setIsVerifyModalOpen(false);
              setActionProtection({
                isTriggered: true,
                actionType: 'OTP Sharing',
                reason: 'The caller’s identity could not be independently verified. This action has been temporarily blocked for your protection.',
                blockedAt: 'Just now',
              });
              break;

            case 'ACTION_PROTECTED':
            case 'PAYMENT_LOCKED':
              setActionProtection({
                isTriggered: true,
                actionType: 'OTP Sharing',
                reason: 'The caller’s identity could not be independently verified. This action has been temporarily blocked for your protection.',
                blockedAt: 'Just now',
              });
              break;

            case 'FAMILY_ALERT':
              setFamilyAlert({
                isTriggered: true,
                title: 'IMPERSONATION ATTEMPT DETECTED',
                subtitle: payload.reason || 'Someone attempted to impersonate Rahul on Mom’s call.',
                timestamp: 'Just now',
              });
              break;

            case 'INCIDENT_CREATED':
              api.getIncidents(DEFAULT_FAMILY_ID).then((incidents) => {
                if (Array.isArray(incidents) && incidents.length > 0) {
                  const latest = incidents[0];
                  setIncident({
                    id: latest.id || 'inc-2841',
                    callId: latest.call_id || 'VG-2841',
                    timestamp: 'Just now',
                    caller: latest.caller_number || 'Unknown VoIP caller',
                    claimedIdentity: latest.claimed_identity || 'Rahul (Son)',
                    riskLevel: latest.risk_level === 'HIGH' ? 'HIGH RISK' : 'SUSPICIOUS',
                    conversationSignals: Array.isArray(latest.risk_signals) ? latest.risk_signals : ['Urgent OTP request'],
                    voiceResult: latest.speaker_result ? `Speaker match: ${latest.speaker_result}` : 'Acoustic variance detected',
                    verificationResult: latest.verification_result || 'IMPERSONATION_CONFIRMED',
                    actionTaken: 'Sensitive action blocked (OTP sharing protected). Family Shield emergency alert dispatched to Dad.',
                    status: 'active',
                  });
                }
              });
              break;

            case 'SON_TIMEOUT':
              setRiskLevelState('UNVERIFIED');
              setVerificationRequest((prev) => ({ ...prev, status: 'none' }));
              break;

            default:
              break;
          }
        } catch {
          // Ignore parse errors
        }
      };
    } catch {
      // Fall back safely to local BroadcastChannel
    }

    return () => {
      if (ws) {
        try {
          ws.close();
        } catch {
          // Ignore close errors
        }
      }
    };
  }, []);


  // Sync state broadcast whenever critical state values change
  const syncCurrentState = (partial: any) => {
    broadcastSync({
      callStatus,
      riskLevel,
      transcript,
      verificationRequest,
      actionProtection,
      familyAlert,
      demoStep,
      familyMembers,
      isVerifyModalOpen,
      ...partial,
    });
  };

  // 1. Start Demo Call
  const startDemoCall = () => {
    setCallStatus('connected');
    setCallDuration(14);
    setRiskLevelState('LOW RISK');
    setTranscript(INITIAL_TRANSCRIPT);
    setVerificationRequest({
      callId: 'VG-2841',
      timestamp: 'Just now',
      claimedIdentity: 'Rahul',
      caller: 'Mom',
      status: 'none',
    });
    setActionProtection({
      isTriggered: false,
      actionType: 'OTP Sharing',
      reason: 'The caller’s identity could not be independently verified. This action has been temporarily blocked for your protection.',
    });
    setFamilyAlert(null);
    setIsWhyPanelOpen(false);
    setIsVerifyModalOpen(false);
    setIsIncidentModalOpen(false);
    setDemoStep(1);

    // Call backend to start and accept call
    api.startCall(DEFAULT_FAMILY_ID, 'demo-son', '+91 98765 43210', 'normal').then((res) => {
      if (res?.call_id) {
        setCallId(res.call_id);
        api.acceptCall(res.call_id);
      }
    });

    // Update family members statuses
    const updatedMembers = INITIAL_FAMILY_MEMBERS.map((m) =>
      m.role === 'mom' ? { ...m, protectionStatus: 'active_call' as const } : m
    );
    setFamilyMembers(updatedMembers);

    syncCurrentState({
      callStatus: 'connected',
      riskLevel: 'LOW RISK',
      transcript: INITIAL_TRANSCRIPT,
      verificationRequest: { status: 'none', callId: 'VG-2841', caller: 'Mom', claimedIdentity: 'Rahul', timestamp: 'Just now' },
      actionProtection: { isTriggered: false, actionType: 'OTP Sharing', reason: '' },
      familyAlert: null,
      demoStep: 1,
      familyMembers: updatedMembers,
      isVerifyModalOpen: false,
    });
  };

  // 2. Trigger Suspicious Request
  const triggerSuspicious = () => {
    setRiskLevelState('HIGH RISK');
    setTranscript(SUSPICIOUS_TRANSCRIPT);
    setDemoStep(2);

    // Call backend analyze endpoint
    api.analyzeCall(callId, "Mom, I need you to send me Dad's OTP quickly. My admission portal is closing!");

    const updatedMembers = familyMembers.map((m) =>
      m.role === 'mom' ? { ...m, protectionStatus: 'alert' as const } : m
    );
    setFamilyMembers(updatedMembers);

    syncCurrentState({
      riskLevel: 'HIGH RISK',
      transcript: SUSPICIOUS_TRANSCRIPT,
      demoStep: 2,
      familyMembers: updatedMembers,
    });
  };

  // 3. Mom requests identity verification
  const requestVerification = () => {
    setIsVerifyModalOpen(true);
    const newReq: VerificationRequest = {
      callId,
      timestamp: 'Just now',
      claimedIdentity: 'Rahul',
      caller: 'Mom',
      status: 'pending',
    };
    setVerificationRequest(newReq);
    setDemoStep(3);

    // Call backend verify-person
    api.verifyPerson(callId);

    syncCurrentState({
      isVerifyModalOpen: true,
      verificationRequest: newReq,
      demoStep: 3,
    });
  };

  // 4. Rahul responds on trusted device
  const respondRahul = (isMe: boolean) => {
    // Notify backend
    api.respond(callId, isMe);

    if (isMe) {
      // Confirmed YES
      const newReq: VerificationRequest = {
        ...verificationRequest,
        status: 'confirmed_yes',
        respondedAt: 'Just now',
      };
      setVerificationRequest(newReq);
      setRiskLevelState('IDENTITY VERIFIED');
      setIsVerifyModalOpen(false);
      setDemoStep(4);


      const updatedMembers = familyMembers.map((m) =>
        m.role === 'mom' ? { ...m, protectionStatus: 'protected' as const } : m
      );
      setFamilyMembers(updatedMembers);

      // Add security event
      setRecentEvents((prev) => [
        {
          id: `ev-${Date.now()}`,
          title: "Rahul confirmed identity",
          subtitle: 'Voice call safely verified via trusted device',
          timestamp: 'Just now',
          type: 'verified',
        },
        ...prev,
      ]);

      syncCurrentState({
        verificationRequest: newReq,
        riskLevel: 'IDENTITY VERIFIED',
        isVerifyModalOpen: false,
        demoStep: 4,
        familyMembers: updatedMembers,
      });
    } else {
      // Confirmed NO -> Impersonation Confirmed!
      const newReq: VerificationRequest = {
        ...verificationRequest,
        status: 'confirmed_no',
        respondedAt: 'Just now',
      };
      setVerificationRequest(newReq);
      setRiskLevelState('IMPERSONATION CONFIRMED');
      setIsVerifyModalOpen(false);

      const protection: ActionProtectionState = {
        isTriggered: true,
        actionType: 'OTP Sharing',
        reason: 'The caller’s identity could not be independently verified. This action has been temporarily blocked for your protection.',
        blockedAt: 'Just now',
      };
      setActionProtection(protection);

      const alert = {
        isTriggered: true,
        title: 'IMPERSONATION ATTEMPT DETECTED',
        subtitle: 'Someone attempted to impersonate Rahul on Mom’s call.',
        timestamp: 'Just now',
      };
      setFamilyAlert(alert);
      setDemoStep(5);

      const updatedMembers = familyMembers.map((m) =>
        m.role === 'mom'
          ? { ...m, protectionStatus: 'alert' as const }
          : m.role === 'dad'
          ? { ...m, protectionStatus: 'alert' as const }
          : m
      );
      setFamilyMembers(updatedMembers);

      // Add security event
      setRecentEvents((prev) => [
        {
          id: `ev-${Date.now()}`,
          title: 'Impersonation blocked',
          subtitle: 'Rahul rejected caller verification. Action protected.',
          timestamp: 'Just now',
          type: 'impersonation',
        },
        ...prev,
      ]);

      syncCurrentState({
        verificationRequest: newReq,
        riskLevel: 'IMPERSONATION CONFIRMED',
        isVerifyModalOpen: false,
        actionProtection: protection,
        familyAlert: alert,
        demoStep: 5,
        familyMembers: updatedMembers,
      });
    }
  };

  const dismissActionProtection = () => {
    setActionProtection((prev) => ({ ...prev, isTriggered: false }));
    syncCurrentState({ actionProtection: { ...actionProtection, isTriggered: false } });
  };

  const setRiskLevel = (level: RiskLevel) => {
    setRiskLevelState(level);
    syncCurrentState({ riskLevel: level });
  };

  const toggleMute = () => setIsMuted((prev) => !prev);
  const toggleSpeaker = () => setIsSpeaker((prev) => !prev);
  const endCall = () => {
    setCallStatus('ended');
    syncCurrentState({ callStatus: 'ended' });
  };

  const resetDemo = () => {
    startDemoCall();
  };

  // Jump directly to any demo step (1 to 5)
  const runDemoStep = (step: DemoStep) => {
    switch (step) {
      case 1:
        startDemoCall();
        break;
      case 2:
        triggerSuspicious();
        break;
      case 3:
        requestVerification();
        break;
      case 4:
        // Rahul confirms YES
        respondRahul(true);
        break;
      case 5:
        // Rahul rejects NO -> Impersonation confirmed
        respondRahul(false);
        break;
      default:
        break;
    }
  };

  return (
    <VoiceGuardContext.Provider
      value={{
        callStatus,
        callDuration,
        isMuted,
        isSpeaker,
        callerName,
        callerNumber,
        callId,
        riskLevel,
        transcript,
        isWhyPanelOpen,
        isVerifyModalOpen,
        isIncidentModalOpen,
        familyMembers,
        verificationRequest,
        actionProtection,
        familyAlert,
        incident,
        recentEvents,
        demoStep,
        startDemoCall,
        triggerSuspicious,
        requestVerification,
        respondRahul,
        dismissActionProtection,
        setRiskLevel,
        setIsWhyPanelOpen,
        setIsVerifyModalOpen,
        setIsIncidentModalOpen,
        toggleMute,
        toggleSpeaker,
        endCall,
        resetDemo,
        runDemoStep,
      }}
    >
      {children}
    </VoiceGuardContext.Provider>
  );
};

export const useVoiceGuard = () => {
  const context = useContext(VoiceGuardContext);
  if (!context) {
    throw new Error('useVoiceGuard must be used within a VoiceGuardProvider');
  }
  return context;
};
