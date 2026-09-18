import type { FamilyMember, Incident, RiskSignal, SecurityEvent, TranscriptMessage } from '../types';


export const DEMO_CREDENTIALS = {
  loginId: 'rahul_001',
  password: 'voiceguard-demo-2026',
};

export const INITIAL_FAMILY_MEMBERS: FamilyMember[] = [
  {
    id: 'demo-mom',
    name: 'Mom',
    role: 'mom',
    label: 'Mother',
    status: 'online',
    protectionStatus: 'protected',
    phone: '+91 90000 00001',
    avatarColor: 'rose',
    device: 'iPhone 15 Pro',
  },
  {
    id: 'demo-son',
    name: 'Rahul',
    role: 'son',
    label: 'Son (College)',
    status: 'online',
    protectionStatus: 'protected',
    phone: '+91 90000 00003',
    avatarColor: 'blue',
    device: 'Pixel 9 Pro (Trusted Device)',
  },
  {
    id: 'demo-dad',
    name: 'Dad',
    role: 'dad',
    label: 'Father',
    status: 'online',
    protectionStatus: 'protected',
    phone: '+91 90000 00002',
    avatarColor: 'emerald',
    device: 'Galaxy S24 Ultra',
  },
];

export const INITIAL_SECURITY_EVENTS: SecurityEvent[] = [
  {
    id: 'ev-1',
    title: "Rahul's identity verified",
    subtitle: 'Trusted device confirmation completed via secure prompt',
    timestamp: '12 min ago',
    type: 'verified',
  },
  {
    id: 'ev-2',
    title: 'Suspicious call detected',
    subtitle: 'High urgency & OTP request detected during call',
    timestamp: 'Yesterday',
    type: 'suspicious',
  },
  {
    id: 'ev-3',
    title: 'Family shield active',
    subtitle: '3 members safeguarded with trusted device verification',
    timestamp: '2 days ago',
    type: 'protected',
  },

];

export const INITIAL_TRANSCRIPT: TranscriptMessage[] = [
  {
    id: 't-1',
    speaker: 'Rahul',
    text: 'Mom, how are you?',
    timestamp: '00:04',
  },
];

export const SUSPICIOUS_TRANSCRIPT: TranscriptMessage[] = [
  {
    id: 't-1',
    speaker: 'Rahul',
    text: 'Mom, how are you?',
    timestamp: '00:04',
  },
  {
    id: 't-2',
    speaker: 'Mom',
    text: "I'm good beta! Did you reach college safely?",
    timestamp: '00:08',
  },
  {
    id: 't-3',
    speaker: 'Rahul',
    text: "Mom, I need you to send me Dad's OTP quickly. My admission portal is closing!",
    timestamp: '00:14',
    isSuspicious: true,
    flagReason: 'Sensitive information request & unusual urgency',
  },
];

export const RISK_SIGNALS: RiskSignal[] = [
  {
    id: 'sig-1',
    title: 'Sensitive information request',
    description: 'The caller explicitly requested a one-time password (OTP) or financial authorization credentials.',
    severity: 'high',
    tag: 'OTP Request',
  },
  {
    id: 'sig-2',
    title: 'Unusual urgency',
    description: 'The conversational tone exerts synthetic time pressure ("quickly", "closing now") typical of social engineering.',
    severity: 'high',
    tag: 'Urgency Detected',
  },
  {
    id: 'sig-3',
    title: 'Voice mismatch',
    description: 'Acoustic vocal tract resonances deviate from Rahul’s enrolled voice profile. Note: this is a risk signal, not definitive proof.',
    severity: 'medium',
    tag: 'Voice Variance',
  },
];

export const DEFAULT_INCIDENT: Incident = {
  id: 'inc-2841',
  callId: 'VG-2841',
  timestamp: 'Just now',
  caller: 'Unknown VoIP caller (+91 98765 43210)',
  claimedIdentity: 'Rahul (Son)',
  riskLevel: 'HIGH RISK',
  conversationSignals: [
    'Sensitive information request (Bank OTP)',
    'Urgent coercion tone detected',
    'Acoustic resonance non-match with enrolled voiceprint',
  ],
  voiceResult: 'Acoustic variance detected (Signal only — not treated as definitive proof)',
  verificationResult: 'Trusted device confirmation rejected by Rahul (Explicit NO received)',
  actionTaken: 'Sensitive action blocked (OTP sharing protected). Family Shield emergency alert dispatched to Dad.',
  status: 'active',
};
