export type RiskLevel =
  | 'LOW RISK'
  | 'SUSPICIOUS'
  | 'HIGH RISK'
  | 'VERIFIED'
  | 'UNVERIFIED'
  | 'IDENTITY VERIFIED'
  | 'IDENTITY VERIFICATION FAILED'
  | 'IMPERSONATION DETECTED'
  | 'IMPERSONATION CONFIRMED';

export type CallStatus = 'idle' | 'calling' | 'connected' | 'verifying' | 'protected' | 'ended';

export type FamilyMemberRole = 'mom' | 'dad' | 'son';

export interface FamilyMember {
  id: string;
  name: string;
  role: FamilyMemberRole;
  label: string;
  status: 'online' | 'offline';
  protectionStatus: 'protected' | 'active_call' | 'alert' | 'unverified';
  phone: string;
  avatarColor: string;
  device: string;
}

export interface TranscriptMessage {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
  isSuspicious?: boolean;
  flagReason?: string;
}

export interface RiskSignal {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  tag: string;
}

export interface VerificationRequest {
  callId: string;
  timestamp: string;
  claimedIdentity: string;
  caller: string;
  status: 'none' | 'pending' | 'confirmed_yes' | 'confirmed_no';
  respondedAt?: string;
  /** Real backend response to the last verify-person call: whether the
   * registered device was actually reachable. */
  deviceStatus?: 'contacting' | 'unavailable';
}

export interface ActionProtectionState {
  isTriggered: boolean;
  actionType: 'OTP Sharing' | 'Fund Transfer' | 'Sensitive Credential';
  reason: string;
  blockedAt?: string;
}

export interface Incident {
  id: string;
  callId: string;
  timestamp: string;
  caller: string;
  claimedIdentity: string;
  riskLevel: RiskLevel;
  conversationSignals: string[];
  voiceResult: string;
  verificationResult: string;
  actionTaken: string;
  status: 'active' | 'resolved';
}

export interface SecurityEvent {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  type: 'verified' | 'suspicious' | 'protected' | 'impersonation';
}

export type DemoStep = 1 | 2 | 3 | 4 | 5;

export interface PendingCallerLink {
  token: string;
  link: string;
  expiresAt?: string;
}
