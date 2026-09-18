export const BACKEND_URL = 'http://127.0.0.1:8123';
export const WS_URL = 'ws://127.0.0.1:8123';
export const DEFAULT_FAMILY_ID = 'demo-family';
export const DEFAULT_SON_USER_ID = 'demo-son';

export interface BackendAnalyzeResponse {
  call_id: string;
  transcript: string;
  risk_score: number;
  risk_level: string; // 'LOW' | 'SUSPICIOUS' | 'HIGH'
  signals: string[];
  why: string[];
  recommendation: string;
  speaker_match?: boolean | null;
  speaker_similarity?: number | null;
}

export const api = {
  async startCall(familyId = DEFAULT_FAMILY_ID, claimedUserId = DEFAULT_SON_USER_ID, callerNumber = '+91 98765 43210', scenario = 'normal') {
    try {
      const res = await fetch(`${BACKEND_URL}/api/calls/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family_id: familyId,
          claimed_identity_user_id: claimedUserId,
          caller_number: callerNumber,
          scenario,
        }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async acceptCall(callId: string) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/calls/${callId}/accept`, {
        method: 'POST',
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async analyzeCall(callId: string, transcript?: string, audioFile?: Blob): Promise<BackendAnalyzeResponse | null> {
    try {
      let res: Response;
      if (audioFile) {
        const formData = new FormData();
        formData.append('audio', audioFile, 'call_sample.wav');
        if (transcript) formData.append('transcript', transcript);
        res = await fetch(`${BACKEND_URL}/api/calls/${callId}/analyze`, {
          method: 'POST',
          body: formData,
        });
      } else {
        res = await fetch(`${BACKEND_URL}/api/calls/${callId}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript }),
        });
      }
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async verifyPerson(callId: string) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/calls/${callId}/verify-person`, {
        method: 'POST',
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async respond(callId: string, confirmed: boolean) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/calls/${callId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async sendVerificationLink(callId: string, reason = 'manual') {
    try {
      const res = await fetch(`${BACKEND_URL}/api/calls/${callId}/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async verifyCallerCredentials(token: string, loginId: string, password: string) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/verification/${token}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login_id: loginId, password }),
      });
      const data = await res.json().catch(() => null);
      return { ok: res.ok, status: res.status, data };
    } catch {
      return { ok: false, status: 0, data: null };
    }
  },

  async getVerificationChallenge(token: string) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/verification/${token}`);
      const data = await res.json().catch(() => null);
      return { ok: res.ok, status: res.status, data };
    } catch {
      return { ok: false, status: 0, data: null };
    }
  },

  async getIncidents(familyId = DEFAULT_FAMILY_ID) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/incidents?family_id=${familyId}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getFamily(familyId = DEFAULT_FAMILY_ID) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/family/${familyId}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },
};
