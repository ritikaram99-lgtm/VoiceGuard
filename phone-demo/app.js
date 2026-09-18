const BACKEND = 'http://127.0.0.1:8123';
const WS_BASE = 'ws://127.0.0.1:8123';
const FAMILY_ID = 'demo-family';
const SON_USER_ID = 'demo-son';

// Mirrors the keyword categories in backend/services/risk_service.py so the
// caller's phone highlights suspicious phrasing instantly, client-side,
// without waiting on a round trip to the backend.
const SUSPICIOUS_PATTERNS = [
  /urgent(ly)?/gi, /immediately/gi, /right now/gi, /asap/gi, /quickly/gi, /hurry/gi,
  /otp/gi, /one[- ]time password/gi, /verification code/gi,
  /password/gi, /pin number/gi, /cvv/gi, /login id/gi,
  /don'?t tell (dad|mom|father|mother|anyone|anybody|family)/gi,
  /keep (this|it) (a )?(secret|quiet)/gi, /keep this between/gi,
  /send (me )?(money|cash|rupees|₹|rs\.?)/gi, /transfer/gi, /account number/gi, /upi/gi,
  /police|arrest(ed)?|court|lawyer|bail|jail|hospital|accident|doctor|emergency|kidnapp(ed|ing)?/gi,
];

const QUICK_PHRASES = [
  "Mom, how are you doing?",
  "I had an accident, I need help.",
  "I need 50000 rupees right now, it's urgent.",
  "Please don't tell Dad about this.",
  "Can you send me the OTP quickly?",
];

const state = {
  callId: null,
  callerTranscriptLines: [],
  sockets: { mom: null, son: null, caller: null },
};

const el = (id) => document.getElementById(id);

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function highlightSuspicious(text) {
  let html = escapeHtml(text);
  for (const pattern of SUSPICIOUS_PATTERNS) {
    html = html.replace(pattern, (m) => `<mark>${m}</mark>`);
  }
  return html;
}

function isSuspicious(text) {
  return SUSPICIOUS_PATTERNS.some((p) => {
    p.lastIndex = 0; // global regexes carry state between calls — reset before each test
    return p.test(text);
  });
}

function addBubble(containerId, text, { outgoing = false, highlight = false } = {}) {
  const container = el(containerId);
  const bubble = document.createElement('div');
  bubble.className = 'bubble' + (outgoing ? ' outgoing' : '');
  bubble.innerHTML = highlight ? highlightSuspicious(text) : escapeHtml(text);
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

function addNotify(containerId, message, type = 'info') {
  const container = el(containerId);
  const note = document.createElement('div');
  note.className = `notify notify-${type}`;
  note.innerHTML = message;
  container.appendChild(note);
  container.scrollTop = container.scrollHeight;
}

function setRiskBadge(level) {
  const badge = el('momRiskBadge');
  badge.classList.remove('risk-low', 'risk-suspicious', 'risk-high');
  if (level === 'HIGH') {
    badge.classList.add('risk-high');
    badge.textContent = 'HIGH RISK';
  } else if (level === 'SUSPICIOUS' || level === 'MEDIUM') {
    badge.classList.add('risk-suspicious');
    badge.textContent = 'SUSPICIOUS';
  } else {
    badge.classList.add('risk-low');
    badge.textContent = 'LOW RISK';
  }
}

function connectRole(role) {
  const ws = new WebSocket(`${WS_BASE}/ws/${FAMILY_ID}?role=${role}`);
  ws.onmessage = (evt) => {
    let payload;
    try { payload = JSON.parse(evt.data); } catch { return; }
    handleEvent(role, payload);
  };
  ws.onerror = () => addNotify(`${role}Notify`, 'Connection error — is the backend running on :8123?', 'danger');
  state.sockets[role] = ws;
  return ws;
}

function handleEvent(role, payload) {
  switch (payload.event) {
    case 'CALL_STARTED':
      if (role === 'mom') {
        el('verifyBtn').disabled = false;
        setRiskBadge('LOW');
      }
      break;

    case 'RISK_UPDATED':
      if (role === 'mom') setRiskBadge(payload.risk_level);
      break;

    case 'VERIFY_REQUESTED':
      if (role === 'son') {
        el('sonIdle').classList.add('hidden');
        el('sonPrompt').classList.remove('hidden');
      }
      break;

    case 'CONTACTING_SON':
      if (role === 'mom') addNotify('momNotify', 'Contacting Rahul\'s trusted device...', 'info');
      break;

    case 'SON_CONFIRMED':
      if (role === 'mom') addNotify('momNotify', '🟢 Rahul confirmed — identity verified.', 'success');
      break;

    case 'SON_DENIED':
      if (role === 'mom') addNotify('momNotify', '🔴 Rahul denied it — impersonation confirmed.', 'danger');
      if (role === 'son') {
        el('sonPrompt').classList.add('hidden');
        el('sonIdle').classList.remove('hidden');
      }
      break;

    case 'SON_TIMEOUT':
      if (role === 'son') {
        el('sonPrompt').classList.add('hidden');
        el('sonIdle').classList.remove('hidden');
      }
      if (role === 'mom') addNotify('momNotify', 'Rahul did not respond in time. Identity unconfirmed (not a scam verdict).', 'info');
      break;

    case 'FAMILY_ALERT':
      if (role === 'mom') addNotify('momNotify', '🚨 Family Shield alert dispatched.', 'danger');
      break;

    case 'PAYMENT_LOCKED':
    case 'ACTION_PROTECTED':
      if (role === 'mom') addNotify('momNotify', '🔒 Sensitive action protected.', 'danger');
      break;

    case 'SEND_CALLER_VERIFICATION':
      if (role === 'caller' && payload.link) {
        addNotify('callerNotify', `Identity verification requested: <a href="${payload.link}" target="_blank">open link</a>`, 'info');
      }
      break;

    case 'VERIFICATION_SUCCESS':
      if (role === 'mom') addNotify('momNotify', '🟢 Caller passed identity verification.', 'success');
      break;

    case 'VERIFICATION_FAILED':
      if (role === 'mom') addNotify('momNotify', '🔴 Caller FAILED identity verification.', 'danger');
      break;
  }
}

async function startNewCall() {
  const res = await fetch(`${BACKEND}/api/calls/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      family_id: FAMILY_ID,
      claimed_identity_user_id: SON_USER_ID,
      caller_number: 'Unknown Number',
    }),
  });
  if (!res.ok) {
    addNotify('momNotify', 'Could not start call — check the backend is running.', 'danger');
    return;
  }
  const data = await res.json();
  state.callId = data.call_id;
  state.callerTranscriptLines = [];

  ['momTranscript', 'callerTranscript'].forEach((id) => (el(id).innerHTML = ''));
  ['momNotify', 'sonNotify', 'callerNotify'].forEach((id) => (el(id).innerHTML = ''));
  el('sonPrompt').classList.add('hidden');
  el('sonIdle').classList.remove('hidden');
  setRiskBadge('LOW');

  el('callStatusPill').textContent = `Call ${data.call_id} active`;
  el('callStatusPill').classList.remove('pill-idle');
  el('callStatusPill').classList.add('pill-active');
  el('endCallBtn').disabled = false;
  el('lineInput').disabled = false;
  el('sendLineBtn').disabled = false;
  el('verifyBtn').disabled = false;

  await fetch(`${BACKEND}/api/calls/${state.callId}/accept`, { method: 'POST' });
}

function endCall() {
  state.callId = null;
  el('callStatusPill').textContent = 'No active call';
  el('callStatusPill').classList.remove('pill-active');
  el('callStatusPill').classList.add('pill-idle');
  el('endCallBtn').disabled = true;
  el('lineInput').disabled = true;
  el('sendLineBtn').disabled = true;
  el('verifyBtn').disabled = true;
  el('sonPrompt').classList.add('hidden');
  el('sonIdle').classList.remove('hidden');
}

async function sendCallerLine(text) {
  if (!text.trim() || !state.callId) return;

  // 1. Instant local feedback on the caller's own phone.
  addBubble('callerTranscript', text, { outgoing: true });

  // 2. Instant client-side keyword flagging — independent of any backend
  //    round trip, exactly like a real-time on-device filter would work.
  const suspicious = isSuspicious(text);
  addBubble('momTranscript', text, { highlight: true });
  if (suspicious) {
    addNotify('momNotify', '⚠ Suspicious phrase detected in caller\'s message', 'danger');
  }

  // 3. Real backend risk analysis — updates the risk badge for real via
  //    the same rule engine and WebSocket broadcast the main app uses.
  state.callerTranscriptLines.push(text);
  await fetch(`${BACKEND}/api/calls/${state.callId}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript: state.callerTranscriptLines.join(' ') }),
  });
}

async function verifyPerson() {
  if (!state.callId) return;
  addNotify('momNotify', 'Requesting identity verification...', 'info');
  await fetch(`${BACKEND}/api/calls/${state.callId}/verify-person`, { method: 'POST' });
}

async function respondSon(confirmed) {
  if (!state.callId) return;
  el('sonPrompt').classList.add('hidden');
  el('sonIdle').classList.remove('hidden');
  await fetch(`${BACKEND}/api/calls/${state.callId}/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirmed }),
  });
}

function renderQuickPhrases() {
  const wrap = el('quickPhrases');
  QUICK_PHRASES.forEach((phrase) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = phrase.length > 28 ? phrase.slice(0, 26) + '…' : phrase;
    chip.title = phrase;
    chip.onclick = () => sendCallerLine(phrase);
    wrap.appendChild(chip);
  });
}

function init() {
  connectRole('mom');
  connectRole('son');
  connectRole('caller');

  el('newCallBtn').onclick = startNewCall;
  el('endCallBtn').onclick = endCall;
  el('verifyBtn').onclick = verifyPerson;
  el('sonYesBtn').onclick = () => respondSon(true);
  el('sonNoBtn').onclick = () => respondSon(false);

  el('sendLineBtn').onclick = () => {
    const input = el('lineInput');
    sendCallerLine(input.value);
    input.value = '';
  };
  el('lineInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') el('sendLineBtn').click();
  });

  renderQuickPhrases();
}

init();
