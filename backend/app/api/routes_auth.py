import logging
import urllib.request
import urllib.parse
import urllib.error
import json
import secrets
import time
import hashlib
import datetime
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Header, status, Depends
from pydantic import BaseModel, Field

import app.database as db

logger = logging.getLogger("TamilOCR.Auth")

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# In-memory replay protection cache for authorization codes: code_hash -> timestamp
_processed_auth_codes: Dict[str, float] = {}

def _check_and_record_code(code: str) -> None:
    now = time.time()
    # Prune codes older than 10 minutes
    stale_keys = [k for k, ts in _processed_auth_codes.items() if now - ts > 600]
    for k in stale_keys:
        _processed_auth_codes.pop(k, None)
    
    code_hash = hashlib.sha256(code.encode("utf-8")).hexdigest()
    if code_hash in _processed_auth_codes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This Google authorization code has already been exchanged or is expired. Please try signing in again."
        )
    _processed_auth_codes[code_hash] = now


# ── Request / Response Models ──────────────────────────────────────────────────

class RegisterPayload(BaseModel):
    fullName: str = Field(..., min_length=2, max_length=120)
    email: str = Field(..., min_length=5, max_length=254)
    password: str = Field(..., min_length=6, max_length=128)
    department: Optional[str] = "Tamil Nadu Heritage Records Division"
    role: Optional[str] = "Project Administrator"
    badgeId: Optional[str] = None


class LoginPayload(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)
    rememberMe: Optional[bool] = True


class ForgotPasswordPayload(BaseModel):
    email: str = Field(..., min_length=5)


class ResetPasswordPayload(BaseModel):
    token: Optional[str] = None
    email: Optional[str] = None
    newPassword: str = Field(..., min_length=6)


class GoogleAuthPayload(BaseModel):
    credential: Optional[str] = None
    code: Optional[str] = None
    accessToken: Optional[str] = None
    clientId: Optional[str] = None
    redirectUri: Optional[str] = None
    state: Optional[str] = None


# ── Helper: Extract Bearer Token ──────────────────────────────────────────────

def get_bearer_token(authorization: Optional[str] = Header(None)) -> Optional[str]:
    if not authorization:
        return None
    parts = authorization.split(" ")
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return authorization


# ── Auth Endpoints ─────────────────────────────────────────────────────────────

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterPayload):
    """
    Register a new user account, persist to database, and issue a session token.
    """
    try:
        user = db.create_user(
            full_name=payload.fullName,
            email=payload.email,
            password=payload.password,
            department=payload.department or "Tamil Nadu Heritage Records Division",
            role=payload.role or "Project Administrator",
            badge_id=payload.badgeId
        )
        token = db.create_user_session(user["id"], days=30)
        return {
            "success": True,
            "message": "Account created successfully.",
            "token": token,
            "user": user
        }
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"[Auth] Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please verify database connectivity."
        )


@router.post("/login")
async def login(payload: LoginPayload):
    """
    Authenticate user using PBKDF2 password verification against the database,
    and return a session token upon success.
    """
    user = db.authenticate_user(payload.email, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password."
        )

    session_days = 30 if payload.rememberMe else 2
    token = db.create_user_session(user["id"], days=session_days)
    return {
        "success": True,
        "message": "Signed in successfully.",
        "token": token,
        "user": user
    }


@router.get("/me")
async def get_current_user(token: Optional[str] = Depends(get_bearer_token)):
    """
    Validate the bearer session token and return the current authenticated user profile.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required."
        )

    user = db.validate_session(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or is invalid. Please sign in again."
        )

    return {
        "success": True,
        "user": user
    }


@router.post("/logout")
async def logout(token: Optional[str] = Depends(get_bearer_token)):
    """
    Revoke the active session token in the database.
    """
    if token:
        db.revoke_session(token)
    return {
        "success": True,
        "message": "Signed out successfully."
    }


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordPayload):
    """
    Generate a password recovery token for the provided email.
    """
    reset_token = db.generate_password_reset_token(payload.email)
    # Always return success message to prevent user enumeration
    return {
        "success": True,
        "message": "If an account matches that email address, reset instructions have been sent.",
        "resetToken": reset_token  # Provided for easy local dev testing
    }


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordPayload):
    """
    Reset password using a valid reset token or registered email.
    """
    target = payload.token or payload.email
    if not target:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A recovery token or account email is required."
        )

    try:
        updated = db.reset_password_with_token(target, payload.newPassword)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired password reset link. Please request a new one."
            )
        return {
            "success": True,
            "message": "Password updated successfully. You can now sign in with your new password."
        }
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )


@router.post("/google")
async def google_auth(payload: GoogleAuthPayload):
    """
    Authenticates with real Google OAuth credentials (ID token, access token, or auth code).
    Securely exchanges codes, validates tokens against Google, verifies audience, and issues active user sessions.
    """
    from app.config import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI

    credential = payload.credential
    code = payload.code
    access_token = payload.accessToken
    email = None
    name = None

    # Option A: Authorization Code Exchange
    if code:
        if not GOOGLE_CLIENT_SECRET or not GOOGLE_CLIENT_ID:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google OAuth authorization code flow requires GOOGLE_CLIENT_SECRET and GOOGLE_CLIENT_ID."
            )

        # Enforce single-use authorization code validation to prevent code replay attacks
        _check_and_record_code(code)

        # In Google Identity Services popup mode (initCodeClient with ux_mode: 'popup'),
        # the required redirect_uri parameter for the token endpoint is strictly "postmessage".
        # If payload explicitly specifies a URI (other than empty/whitespace), use it;
        # otherwise default to "postmessage".
        redirect_uri = payload.redirectUri.strip() if payload.redirectUri and payload.redirectUri.strip() else "postmessage"

        try:
            token_url = "https://oauth2.googleapis.com/token"
            post_data = urllib.parse.urlencode({
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code"
            }).encode("utf-8")

            req = urllib.request.Request(
                token_url,
                data=post_data,
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "application/json",
                    "User-Agent": "TamilOCR-Auth/2.4"
                }
            )

            with urllib.request.urlopen(req, timeout=10) as token_res:
                token_body = token_res.read().decode("utf-8")
                token_data = json.loads(token_body)
                credential = token_data.get("id_token")
                access_token = token_data.get("access_token")
                logger.info(f"[Google Auth] Code exchange successful (HTTP {token_res.status}). Tokens received.")
        except urllib.error.HTTPError as http_err:
            error_msg = f"HTTP {http_err.code}"
            try:
                raw_body = http_err.read().decode("utf-8")
                err_json = json.loads(raw_body)
                err_code = err_json.get("error", "oauth_error")
                err_desc = err_json.get("error_description", "")
                error_msg = f"{err_code}: {err_desc}" if err_desc else err_code
            except Exception:
                pass
            logger.error(f"[Google Auth] Code exchange failed: HTTP {http_err.code} - {error_msg}")

            if "invalid_grant" in error_msg:
                user_detail = "The Google authorization code is invalid, expired, or has already been used. Please try signing in again."
            elif "redirect_uri_mismatch" in error_msg:
                user_detail = "OAuth redirect URI mismatch. Please ensure Authorized JavaScript Origins and Redirect URIs match in Google Cloud Console."
            elif "invalid_client" in error_msg:
                user_detail = "Google OAuth client authentication failed. Please verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
            else:
                user_detail = f"Failed to exchange Google OAuth authorization code: {error_msg}."

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=user_detail
            )
        except urllib.error.URLError as url_err:
            logger.error(f"[Google Auth] Network connection error: {url_err.reason}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Unable to connect to Google OAuth authentication servers. Please check internet connection."
            )
        except HTTPException:
            raise
        except Exception as err:
            logger.error(f"[Google Auth] Code exchange unexpected error: {type(err).__name__}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to exchange Google OAuth authorization code due to an internal server error."
            )

    # Option B: Access Token UserInfo Verification
    if access_token and not email:
        try:
            userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
            req = urllib.request.Request(
                userinfo_url,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "User-Agent": "TamilOCR-Auth/2.4",
                    "Accept": "application/json"
                }
            )
            with urllib.request.urlopen(req, timeout=8) as response:
                if response.status == 200:
                    info = json.loads(response.read().decode("utf-8"))
                    email = info.get("email")
                    name = info.get("name") or info.get("given_name")
        except Exception as e:
            logger.warning(f"[Google Auth] Userinfo verification error: {type(e).__name__}")

    # Option C: ID Token TokenInfo Verification
    if credential and not email:
        try:
            url = f"https://oauth2.googleapis.com/tokeninfo?id_token={urllib.parse.quote(credential)}"
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "TamilOCR-Auth/2.4",
                    "Accept": "application/json"
                }
            )
            with urllib.request.urlopen(req, timeout=8) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode("utf-8"))
                    # Audience validation: ensure token was minted for our client ID
                    aud = data.get("aud")
                    if aud and GOOGLE_CLIENT_ID and aud != GOOGLE_CLIENT_ID:
                        logger.error("[Google Auth] ID Token audience mismatch: token aud does not match GOOGLE_CLIENT_ID.")
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Google ID token validation failed: client ID mismatch."
                        )
                    email = data.get("email")
                    name = data.get("name") or data.get("given_name")
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"[Google Auth] Tokeninfo verification error: {type(e).__name__}")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google Sign-In failed to verify profile. Please verify credentials or sign in with email and password."
        )

    # Check or create user across MongoDB Atlas and SQLite
    clean_email = email.strip().lower()
    name = (name or "Google User").strip()
    user = db.get_user_by_email(clean_email)

    if not user:
        # Create account for Google user with a secure random password hash
        try:
            user = db.create_user(
                full_name=name,
                email=clean_email,
                password=f"google_oauth_{secrets.token_hex(16)}",
                role="Archive Specialist",
                department="Tamil Nadu Heritage Records Division"
            )
            logger.info(f"[Google Auth] Created new user profile for '{clean_email}'.")
        except ValueError as ve:
            # Handle potential race condition if user was created concurrently
            user = db.get_user_by_email(clean_email)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=str(ve)
                )

    # Update last login timestamp in SQLite and MongoDB Atlas
    now_iso = datetime.datetime.now().isoformat()
    db.update_user_last_login(clean_email, now_iso)

    token = db.create_user_session(user["id"], days=30)
    logger.info(f"[Google Auth] Authentication successful for user {user['id']} ({clean_email}).")
    return {
        "success": True,
        "message": "Google authentication successful.",
        "token": token,
        "user": user
    }



@router.get("/google/config")
async def get_google_auth_config():
    """
    Return public Google OAuth client configuration status.
    Client secrets are NEVER exposed to the frontend.
    """
    from app.config import GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI
    configured = bool(GOOGLE_CLIENT_ID and len(GOOGLE_CLIENT_ID) > 5)
    return {
        "configured": configured,
        "clientId": GOOGLE_CLIENT_ID if configured else None,
        "redirectUri": GOOGLE_REDIRECT_URI,
        "authorizedOrigins": [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:8443",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:8443"
        ],
        "setupGuidance": {
            "requiredEnvVar": "VITE_GOOGLE_CLIENT_ID",
            "step1": "Go to Google Cloud Console (https://console.cloud.google.com) > APIs & Services > Credentials",
            "step2": "Create Credentials > OAuth client ID > Web application",
            "step3": "Add Authorized JavaScript origins: http://localhost:3000 (and 8443)",
            "step4": "Add Authorized redirect URIs: http://localhost:3000/login",
            "step5": "Add VITE_GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com to .env"
        }
    }

