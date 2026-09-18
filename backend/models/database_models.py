from typing import Optional

from pydantic import BaseModel


class FamilyMemberIn(BaseModel):
    name: str
    role: str  # mom | dad | son — Verify Person and the caller-verification
    # link are hardcoded around "son" (matching the SON_* WS event names in
    # the product spec); other roles can connect but aren't a protectable
    # claimed identity yet.
    login_id: Optional[str] = None
    password: Optional[str] = None
    phone: Optional[str] = None


class FamilySetupRequest(BaseModel):
    family_name: str
    members: list[FamilyMemberIn]


class StartCallRequest(BaseModel):
    family_id: str
    claimed_identity_user_id: str
    caller_number: str
    scenario: Optional[str] = None  # "normal" | "scam" | custom label, for the demo controller


class AnalyzeCallRequest(BaseModel):
    transcript: Optional[str] = None


class AnalyzeResponse(BaseModel):
    call_id: str
    transcript: str
    risk_score: int
    risk_level: str
    signals: list[str]
    why: list[str]
    recommendation: str
    speaker_match: Optional[bool] = None
    speaker_similarity: Optional[float] = None
    amount_detected: bool = False
    amount_value: Optional[float] = None
    currency: Optional[str] = None


class VerifyPersonResponse(BaseModel):
    call_id: str
    status: str  # "contacting" | "unavailable"
    message: str


class RespondRequest(BaseModel):
    confirmed: bool


class SendVerificationRequest(BaseModel):
    reason: str = "manual"  # offline | timeout | requested_by_son | manual


class SendVerificationResponse(BaseModel):
    token: str
    link: str
    expires_at: str


class LoginRequest(BaseModel):
    login_id: str
    password: str


class LoginResponse(BaseModel):
    status: str  # VERIFIED | FAILED
    message: str


class PaymentCheckRequest(BaseModel):
    call_id: str
    amount: float


class PaymentCheckResponse(BaseModel):
    action_status: str  # ALLOWED | PROTECTED | BLOCKED
    message: str


class SetPresenceRequest(BaseModel):
    family_id: str
    role: str
    status: str  # online | offline


class UpdateCredentialsRequest(BaseModel):
    login_id: Optional[str] = None
    password: Optional[str] = None
    name: Optional[str] = None


class FamilyLoginRequest(BaseModel):
    # Accepts either a phone number or a login_id, whichever the client has.
    identifier: str
    password: str


class FamilyLoginResponse(BaseModel):
    status: str  # OK | FAILED
    user_id: Optional[str] = None
    family_id: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = None
    message: str
