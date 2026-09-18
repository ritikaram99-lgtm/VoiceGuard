import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Mic,
  MicOff,
  PhoneOff,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useVoiceGuard } from '../context/VoiceGuardContext';
import { Avatar } from '../components/common/Avatar';
import { VoiceWaveform } from '../components/call/VoiceWaveform';
import { TranscriptBubble } from '../components/call/TranscriptBubble';

import { WhyPanel } from '../components/call/WhyPanel';
import { VerifyPersonModal } from '../components/call/VerifyPersonModal';
import { ActionProtection } from '../components/security/ActionProtection';
import { LiveMicRecorder } from '../components/call/LiveMicRecorder';



export const MomCallPage: React.FC = () => {
  const {
    callStatus,
    callDuration,
    isMuted,
    isSpeaker,
    callerName,
    callerNumber,
    callId,
    setCallId,
    riskLevel,
    transcript,
    isWhyPanelOpen,
    isVerifyModalOpen,
    actionProtection,
    triggerSuspicious,
    handleLiveAudioAnalysis,
    requestVerification,
    dismissActionProtection,

    setIsWhyPanelOpen,
    setIsVerifyModalOpen,
    setIsIncidentModalOpen,
    toggleMute,
    toggleSpeaker,
    endCall,
    startDemoCall,
  } = useVoiceGuard();

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const isHighRisk =
    riskLevel === 'HIGH RISK' ||
    riskLevel === 'IMPERSONATION DETECTED' ||
    riskLevel === 'IMPERSONATION CONFIRMED';

  const isImpersonation = riskLevel === 'IMPERSONATION CONFIRMED';
  const isVerified = riskLevel === 'IDENTITY VERIFIED';

  return (
    <div className="flex-1 flex flex-col justify-between max-w-lg mx-auto w-full px-4 py-4 sm:py-6 relative min-h-[calc(100vh-4rem)]">
      {/* Top Call Info Bar */}
      <div className="flex items-center justify-between pt-1 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
            Protected Voice Line
          </span>
          <span className="text-xs text-slate-400 font-mono">({callId})</span>
        </div>

        {/* Call Timer */}
        <div className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
          {callStatus === 'ended' ? 'Call Ended' : formatTime(callDuration)}
        </div>
      </div>

      {/* Main Calling Stage: Organic Visual Storytelling */}
      <div className="flex-1 flex flex-col items-center justify-center text-center my-auto space-y-5">
        {/* Caller Avatar with Surrounding Dynamic Ring */}
        <div className="relative my-2">
          <Avatar
            name={callerName}
            role="son"
            size="call-hero"
            showRing
            status={riskLevel}
            isOnline={callStatus !== 'ended'}
          />

          {/* Caller Badge Inside/Around Visual Element */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
            {isImpersonation ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-bold shadow-md animate-bounce">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>IMPERSONATION CONFIRMED</span>
              </div>
            ) : isVerified ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-md">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>IDENTITY VERIFIED</span>
              </div>
            ) : isHighRisk ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-bold shadow-md">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>HIGH RISK</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>LOW RISK</span>
              </div>
            )}
          </div>
        </div>

        {/* Caller Identity Names */}
        <div className="space-y-1 pt-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {callerName}
          </h2>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
            <span>Incoming Call</span>
            <span>•</span>
            <span className="font-mono">{callerNumber}</span>
          </div>
        </div>

        {/* Live Audio Waveform */}
        <div className="w-full max-w-xs">
          <VoiceWaveform
            isActive={callStatus === 'connected'}
            riskLevel={riskLevel}
            barCount={26}
          />
        </div>

        {/* Live Transcript Bubble */}
        <TranscriptBubble
          messages={transcript}
          onOpenWhy={() => setIsWhyPanelOpen(true)}
        />

        {/* Live Microphone Recording Control */}
        {callStatus !== 'ended' && (
          <LiveMicRecorder
            callId={callId}
            onCallIdUpdated={(newId) => setCallId(newId)}
            onAnalysisSuccess={handleLiveAudioAnalysis}
          />
        )}


        {/* Trust Signals Summary (Compact, Never fake probabilities!) */}
        <div className="w-full max-w-md">
          {isHighRisk && !isImpersonation && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-left space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Sensitive information request detected
                </span>
                <button
                  type="button"
                  onClick={() => setIsWhyPanelOpen(true)}
                  className="text-xs font-bold text-rose-700 underline hover:text-rose-900 flex items-center gap-0.5"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>Why?</span>
                </button>
              </div>

              {/* Compact risk signals */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                <span className="px-2 py-0.5 rounded-md bg-white text-[11px] font-semibold text-rose-800 border border-rose-200">
                  Urgency
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white text-[11px] font-semibold text-rose-800 border border-rose-200">
                  OTP request
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white text-[11px] font-semibold text-rose-800 border border-rose-200">
                  Acoustic variance
                </span>
              </div>
            </div>
          )}

          {!isHighRisk && !isVerified && (
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 text-emerald-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Voice recognized • No unusual request</span>
              </div>
              <button
                type="button"
                onClick={triggerSuspicious}
                className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-white/80 px-2 py-1 rounded-lg border border-emerald-200/60"
                title="Simulate suspicious call scenario"
              >
                Test Urgency
              </button>
            </div>
          )}

          {isVerified && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Identity independently confirmed via Rahul’s trusted device.</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls Area */}
      <div className="space-y-4 pt-4 pb-2">
        {/* Dominant Primary Action: VERIFY PERSON */}
        {callStatus !== 'ended' && !isVerified && (
          <div className="w-full">
            <button
              type="button"
              onClick={requestVerification}
              className={`w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg ${
                isHighRisk
                  ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-rose-500/25 animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-500/25'
              }`}
            >
              <UserCheck className="w-5 h-5" />
              <span>VERIFY PERSON</span>
            </button>
          </div>
        )}

        {/* Minimal Secondary Call Controls (Mute, Speaker, End) */}
        <div className="flex items-center justify-center gap-6 pt-1">
          {/* Mute Button */}
          <button
            type="button"
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-sm ${
              isMuted
                ? 'bg-slate-900 text-white'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* End Call Button */}
          {callStatus !== 'ended' ? (
            <button
              type="button"
              onClick={endCall}
              className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition-transform active:scale-95"
              title="End call"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startDemoCall}
              className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
              title="Restart call"
            >
              <UserCheck className="w-7 h-7" />
            </button>
          )}

          {/* Speaker Button */}
          <button
            type="button"
            onClick={toggleSpeaker}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-sm ${
              isSpeaker
                ? 'bg-slate-900 text-white'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
            title={isSpeaker ? 'Speaker Off' : 'Speaker On'}
          >
            {isSpeaker ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Why Bottom Sheet Modal */}
      <WhyPanel
        isOpen={isWhyPanelOpen}
        onClose={() => setIsWhyPanelOpen(false)}
        onVerifyPerson={requestVerification}
      />

      {/* Verify Person Transition Modal */}
      <VerifyPersonModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        claimedName={callerName}
        callId={callId}
      />

      {/* Action Protection Guardrail Modal */}
      <ActionProtection
        protection={actionProtection}
        onDismiss={dismissActionProtection}
        onViewIncident={() => setIsIncidentModalOpen(true)}
      />
    </div>
  );
};
