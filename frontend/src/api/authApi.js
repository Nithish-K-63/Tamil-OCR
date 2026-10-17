/**
 * Real backend authentication client for TamilOCR.
 * Connects to /api/auth endpoints backed by MongoDB Atlas and SQLite fallback.
 */

const getStoredConfig = (key, fallback = "") => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};

const PROD_RENDER_URL = "https://tamil-ocr-ymob.onrender.com";

const resolveUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const baseUrl = import.meta.env.VITE_API_URL || getStoredConfig("tamilocr_api_url", "");
  if (!baseUrl || baseUrl.trim() === "") {
    return cleanEndpoint;
  }
  const cleanBase = baseUrl.replace(/\/+$/, "");
  return `${cleanBase}${cleanEndpoint}`;
};

/**
 * Universal fetch with 45-second timeout and automatic Render HTTPS / local fallback.
 */
const authFetch = async (endpoint, options = {}, timeoutMs = 45000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new Error("Connection timed out waiting for backend server response."));
  }, timeoutMs);

  const headers = {
    "Accept": "application/json",
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {})
  };

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const primaryUrl = resolveUrl(cleanEndpoint);

  try {
    const res = await fetch(primaryUrl, {
      ...options,
      signal: controller.signal,
      headers
    });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);

    const isAbort = err.name === "AbortError" || (err.message && err.message.toLowerCase().includes("abort"));

    // If aborted due to timeout, provide a clear, helpful message
    if (isAbort) {
      throw new Error("The backend server is waking up from sleep. Please try again in a few moments.");
    }

    // Try live Render fallback if primary URL failed
    try {
      const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
      const fallbackBase = isLocal ? "http://127.0.0.1:8000" : PROD_RENDER_URL;
      const fallbackUrl = `${fallbackBase}${cleanEndpoint}`;

      if (fallbackUrl !== primaryUrl) {
        const fbCtrl = new AbortController();
        const fbTimer = setTimeout(() => fbCtrl.abort(), timeoutMs);
        const fbRes = await fetch(fallbackUrl, {
          ...options,
          signal: fbCtrl.signal,
          headers
        });
        clearTimeout(fbTimer);
        return fbRes;
      }
    } catch {
      // Fallback also failed
    }

    throw err;
  }
};

/**
 * Parses response or extracts server error message.
 */
const handleAuthResponse = async (res) => {
  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const message = data.detail || data.message || `Request failed with status ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const loginApi = async (email, password, rememberMe = true) => {
  const res = await authFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, rememberMe })
  });
  return handleAuthResponse(res);
};

export const registerApi = async ({ fullName, email, password, department, role, badgeId }) => {
  const res = await authFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ fullName, email, password, department, role, badgeId })
  });
  return handleAuthResponse(res);
};

export const getCurrentUserApi = async (token) => {
  if (!token) throw new Error("No session token provided");
  const res = await authFetch("/api/auth/me", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  return handleAuthResponse(res);
};

export const logoutApi = async (token) => {
  try {
    const res = await authFetch("/api/auth/logout", {
      method: "POST",
      headers: token ? { "Authorization": `Bearer ${token}` } : {}
    });
    return handleAuthResponse(res);
  } catch {
    return { success: true };
  }
};

export const forgotPasswordApi = async (email) => {
  const res = await authFetch("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email })
  });
  return handleAuthResponse(res);
};

export const resetPasswordApi = async ({ token, email, newPassword }) => {
  const res = await authFetch("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, email, newPassword })
  });
  return handleAuthResponse(res);
};

export const verifyEmailApi = async (token) => {
  const cleanToken = encodeURIComponent(token.trim());
  const res = await authFetch(`/api/auth/verify-email?token=${cleanToken}`, {
    method: "POST",
    body: JSON.stringify({ token: token.trim() })
  });
  return handleAuthResponse(res);
};

export const resendVerificationApi = async (email) => {
  const cleanEmail = email.trim().toLowerCase();
  const res = await authFetch("/api/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email: cleanEmail })
  });
  return handleAuthResponse(res);
};

export const getEmailConfigStatusApi = async () => {
  try {
    const res = await authFetch("/api/auth/email-config", { method: "GET" });
    return await handleAuthResponse(res);
  } catch (err) {
    return { configured: false, missingFields: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD"] };
  }
};

export const getGoogleAuthConfigApi = async () => {
  try {
    const res = await authFetch("/api/auth/google/config", { method: "GET" });
    return await handleAuthResponse(res);
  } catch (err) {
    return { configured: false };
  }
};

export const googleAuthApi = async (params, clientId = null) => {
  const body = typeof params === "string" 
    ? { credential: params, clientId } 
    : params;
  const res = await authFetch("/api/auth/google", {
    method: "POST",
    body: JSON.stringify(body)
  });
  return handleAuthResponse(res);
};

