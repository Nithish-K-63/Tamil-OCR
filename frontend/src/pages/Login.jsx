import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sun,
  Moon,
  AlertCircle,
  X,
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { googleAuthApi, getGoogleAuthConfigApi } from '../api/authApi';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleClientConfig, setGoogleClientConfig] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  const emailInputRef = useRef(null);

  const { login, isAuthenticated, setAuthSession } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isDark = theme === 'dark';

  const destination = location.state?.from?.pathname || '/dashboard';

  // Automatically redirect authenticated users to workspace
  useEffect(() => {
    if (isAuthenticated) {
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, navigate, destination]);

  // Discover Google OAuth configuration from backend on mount
  useEffect(() => {
    let isMounted = true;
    const checkGoogleConfig = async () => {
      try {
        const config = await getGoogleAuthConfigApi();
        if (isMounted && config) {
          setGoogleClientConfig(config);
        }
      } catch (e) {
        // Fallback gracefully
      }
    };
    checkGoogleConfig();
    return () => { isMounted = false; };
  }, []);

  // Handle redirect-based OAuth callback if redirected with code or error in URL search params
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const oauthError = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    if (oauthError) {
      setError(errorDescription || `Google authentication failed: ${oauthError}`);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code) {
      const processRedirectCode = async () => {
        const savedState = sessionStorage.getItem('tamilocr_oauth_state');
        if (savedState && state && savedState !== state) {
          setError('OAuth state parameter mismatch. Please sign in again.');
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }

        setLoading(true);
        try {
          const configuredClientId =
            import.meta.env.VITE_GOOGLE_CLIENT_ID ||
            googleClientConfig?.clientId ||
            '';
          const res = await googleAuthApi({
            code,
            clientId: configuredClientId,
            redirectUri: `${window.location.origin}/login`,
            state
          });
          if (res?.token && res?.user) {
            setAuthSession(res.token, res.user);
            navigate(destination, { replace: true });
          }
        } catch (err) {
          setError(err.message || 'Failed to exchange Google OAuth authorization code.');
        } finally {
          setLoading(false);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      };

      processRedirectCode();
    }
  }, [googleClientConfig, navigate, setAuthSession, destination]);

  // Focus email on mount
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  // Standard Email & Password Submit
  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(trimmedEmail, password, rememberMe);
      if (res?.success) {
        navigate(destination, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Invalid email address or password.');
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth Handler (Direct interactive popup code flow + fallback)
  const handleGoogleLogin = useCallback(async () => {
    setError('');

    const configuredClientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      googleClientConfig?.clientId ||
      '';

    const hasRealClientId = Boolean(
      configuredClientId &&
      configuredClientId.includes('.apps.googleusercontent.com') &&
      !configuredClientId.includes('your_google_client_id')
    );

    if (!hasRealClientId) {
      setShowGoogleModal(true);
      return;
    }

    if (typeof window !== 'undefined' && window.google?.accounts) {
      try {
        if (window.google.accounts.oauth2) {
          const stateToken = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `state_${Math.random().toString(36).substring(2)}_${Date.now()}`;
          try {
            sessionStorage.setItem('tamilocr_oauth_state', stateToken);
          } catch { }

          const client = window.google.accounts.oauth2.initCodeClient({
            client_id: configuredClientId,
            scope: 'openid email profile',
            ux_mode: 'popup',
            state: stateToken,
            callback: async (response) => {
              if (response?.error) {
                if (response.error !== 'popup_closed_by_user') {
                  setError(response.error_description || `Google authentication error: ${response.error}`);
                }
                return;
              }

              if (response?.code) {
                if (response.state) {
                  const savedState = sessionStorage.getItem('tamilocr_oauth_state');
                  if (savedState && response.state !== savedState) {
                    setError('OAuth security state verification failed. Possible CSRF detected.');
                    return;
                  }
                }

                setLoading(true);
                try {
                  const res = await googleAuthApi({
                    code: response.code,
                    clientId: configuredClientId,
                    redirectUri: 'postmessage',
                    state: response.state || stateToken
                  });
                  if (res?.token && res?.user) {
                    setAuthSession(res.token, res.user);
                    navigate(destination, { replace: true });
                  }
                } catch (err) {
                  setError(err.message || 'Google authentication failed.');
                } finally {
                  setLoading(false);
                }
              }
            },
            error_callback: (err) => {
              if (err?.type !== 'popup_closed') {
                setError(err?.message || 'Google Sign-In was cancelled or failed.');
              }
            }
          });
          client.requestCode();
          return;
        }

        if (window.google.accounts.id) {
          window.google.accounts.id.initialize({
            client_id: configuredClientId,
            callback: async (response) => {
              if (response?.credential) {
                setLoading(true);
                try {
                  const res = await googleAuthApi(response.credential);
                  if (res?.token && res?.user) {
                    setAuthSession(res.token, res.user);
                    navigate(destination, { replace: true });
                  }
                } catch (err) {
                  setError(err.message || 'Google authentication failed.');
                } finally {
                  setLoading(false);
                }
              }
            }
          });
          window.google.accounts.id.prompt();
          return;
        }
      } catch (err) {
        console.warn('Google prompt invocation error:', err);
      }
    }

    const scriptPresent = typeof document !== 'undefined' && document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (scriptPresent) {
      setError('Google Sign-In service is initializing. Please try again in a few seconds.');
      return;
    }

    setShowGoogleModal(true);
  }, [googleClientConfig, navigate, setAuthSession, destination]);

  const copyToClipboard = (text, key) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch { }
  };

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const redirectUri = `${originUrl}/login`;

  return (
    <div className={`min-h-screen flex flex-col justify-between font-english transition-colors duration-200 ${isDark ? 'bg-[#0E0C14] text-[#F5F2EB]' : 'bg-[#FAF9F5] text-[#1A1523]'}`}>

      {/* Top Header with Return Link & Theme Switcher */}
      <header className={`w-full border-b transition-colors duration-200 py-4 px-4 sm:px-8 ${isDark ? 'border-[#271E36] bg-[#0E0C14]/80' : 'border-[#E6E1D7] bg-[#FAF9F5]/80'}`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#007A85] dark:text-[#00D4E0] hover:underline cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Return to Home</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#007A85] to-[#00A3B0] flex items-center justify-center text-white font-bold font-tamil text-sm shadow-sm">
                அ
              </div>
              <span className="font-bold text-base text-[#181320] dark:text-white">TamilOCR</span>
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className={`
                p-2 rounded-xl border text-xs transition-all shadow-xs cursor-pointer ml-3
                ${isDark
                  ? 'bg-[#181224] border-[#2E223D] text-[#9D8DA6] hover:bg-[#231A33]'
                  : 'bg-white border-[#E6E1D7] text-[#4A4154] hover:bg-[#F2EDE2]'}
              `}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Login Form Container */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative">
        {/* Subtle decorative ambient backdrop aura */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-[#007A85]/8 dark:bg-[#007A85]/12 blur-3xl rounded-full pointer-events-none" />

        <div className="w-full max-w-[460px] mx-auto relative z-10">

          {/* Top Status Bar */}
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2 text-xs font-medium text-[#7A6F87] dark:text-[#9A8DA7]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono">Archive Database Connected</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-[#007A85] dark:text-[#00D4E0] font-semibold">
              SECURE SESSION
            </span>
          </div>

          {/* Card Container */}
          <div
            className={`p-6 sm:p-9 rounded-3xl border transition-all ${isDark
                ? 'bg-[#150F22]/95 border-[#2D2140] shadow-2xl shadow-black/60 backdrop-blur-md'
                : 'bg-white border-[#E4DCD0] shadow-xl shadow-[#007A85]/5'
              }`}
          >
            <div className="mb-7 text-center">
              <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#007A85] bg-[#007A85]/10 dark:text-[#00B4C2] dark:bg-[#007A85]/20 mb-3">
                OFFICIAL ARCHIVE WORKSPACE
              </span>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight mb-2 text-[#181320] dark:text-white">
                Welcome back
              </h1>
              <p className="text-xs text-[#70667C] dark:text-[#9C8FA8] leading-relaxed max-w-sm mx-auto">
                Sign in with your credentials to access the TamilOCR digitization and character recognition portal.
              </p>
            </div>

            {/* Error Notice */}
            {error && (
              <div className="mb-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium flex items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="text-red-400 hover:text-red-300 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Continue with Google Social Auth Button */}
            <button
              type="button"
              id="googleSignInBtn"
              onClick={handleGoogleLogin}
              disabled={loading}
              className={`
                w-full py-3.5 px-4 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xs hover:shadow-md
                ${isDark
                  ? 'bg-[#181224] border-[#2C213B] text-white hover:bg-[#201830] hover:border-[#3D2E52]'
                  : 'bg-white border-[#E0D9CD] text-[#221B2A] hover:bg-gray-50/80 hover:border-[#CEC4B3]'}
              `}
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Elegant Divider */}
            <div className="my-6 relative flex items-center justify-center">
              <div className="w-full border-t border-[#E6E1D7] dark:border-[#271E36]" />
              <span className={`absolute px-4 text-[11px] uppercase tracking-wider font-semibold text-[#8C8199] ${isDark ? 'bg-[#150F22]' : 'bg-white'}`}>
                or sign in with email
              </span>
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold mb-2 text-[#4A4154] dark:text-[#C5BAD3]">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#7B7089] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={emailInputRef}
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@tamilocr.gov.in"
                    className={`
                      w-full pl-11 pr-4 py-3.5 rounded-2xl border text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#007A85]/25 focus:border-[#007A85]
                      ${isDark
                        ? 'bg-[#181224] border-[#2C213B] text-white placeholder-[#5E546B]'
                        : 'bg-white border-[#E0D9CD] text-gray-900 placeholder-[#9C92A6] shadow-xs'}
                    `}
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-xs font-semibold text-[#4A4154] dark:text-[#C5BAD3]">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs text-[#007A85] dark:text-[#00B4C2] hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#7B7089] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={`
                      w-full pl-11 pr-11 py-3.5 rounded-2xl border text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#007A85]/25 focus:border-[#007A85]
                      ${isDark
                        ? 'bg-[#181224] border-[#2C213B] text-white placeholder-[#5E546B]'
                        : 'bg-white border-[#E0D9CD] text-gray-900 placeholder-[#9C92A6] shadow-xs'}
                    `}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7B7089] hover:text-[#9D8DA6] dark:hover:text-white transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center text-xs pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    name="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-[#382B4B] accent-[#007A85] cursor-pointer"
                  />
                  <span className="text-[#645A70] dark:text-[#9E92AB]">Remember me for 30 days</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#007A85] to-[#008996] hover:from-[#006E78] hover:to-[#007A85] active:scale-[0.99] text-white font-semibold text-xs shadow-lg shadow-[#007A85]/25 flex items-center justify-center gap-2 transition-all mt-4 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                <span>{loading ? 'Authenticating...' : 'Sign In Securely'}</span>
              </button>
            </form>

            {/* New Account Link */}
            <div className="mt-6 text-center text-xs text-[#70667C] dark:text-[#9C8FA8]">
              <span>New officer or researcher? </span>
              <Link to="/register" className="text-[#007A85] dark:text-[#00B4C2] hover:underline font-semibold transition-colors">
                Request an account
              </Link>
            </div>

            {/* Real Authentication & Database Security Badge */}
            <div className={`
              mt-6 p-3.5 rounded-2xl border flex items-center gap-3 text-xs
              ${isDark
                ? 'bg-[#181224]/80 border-[#2C213B] text-[#9D8DA6]'
                : 'bg-[#F2ECE0] border-[#E0D8CA] text-[#5A5064]'}
            `}>
              <ShieldCheck className="w-4 h-4 shrink-0 text-[#007A85] dark:text-[#00B4C2]" />
              <p className="text-[11px] leading-relaxed">
                Protected by salted PBKDF2 encryption and active MongoDB Atlas / SQLite database session validation.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`py-6 px-4 border-t text-center text-xs ${isDark ? 'border-[#271E36] text-[#7A6F87]' : 'border-[#E6E1D7] text-[#8C8199]'}`}>
        <p>© 2026 TamilOCR Project · Directorate of Historical Archives & Digitization Portal</p>
      </footer>

      {/* Google OAuth Configuration Guidance Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`
            w-full max-w-lg rounded-3xl border shadow-2xl p-6 sm:p-8 relative overflow-hidden transition-all
            ${isDark ? 'bg-[#161022] border-[#36274B] text-white' : 'bg-white border-[#E0D9CD] text-[#1A1523]'}
          `}>
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                  Google Cloud OAuth Setup
                </h3>
                <p className="text-xs text-[#7A6F87] dark:text-[#A79CB5]">
                  Real-time Google Sign-In requires an active OAuth 2.0 Web Client ID
                </p>
              </div>
            </div>

            <p className="text-xs text-[#5C5369] dark:text-[#B5A9C2] leading-relaxed mb-4">
              To guarantee true production security without simulation, TamilOCR verifies Google ID tokens directly against Google&apos;s authentication servers. Confirm that the following Authorized Origins and Redirect URIs match your Google Cloud project:
            </p>

            {/* Step-by-Step Configuration Guide */}
            <div className="space-y-3 mb-5 text-xs">

              {/* Step 1: Authorized Origin */}
              <div className={`p-3 rounded-2xl border ${isDark ? 'bg-[#1E162D] border-[#35264B]' : 'bg-[#FAF8F5] border-[#E8E2D7]'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-800 dark:text-white">1. Authorized JavaScript Origin</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(originUrl, 'origin')}
                    className="flex items-center gap-1 text-[11px] text-[#007A85] dark:text-[#00D4E0] hover:underline font-medium cursor-pointer"
                  >
                    {copiedKey === 'origin' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'origin' ? 'Copied!' : 'Copy Origin'}</span>
                  </button>
                </div>
                <code className="text-[11px] font-mono text-[#D97736] block bg-black/5 dark:bg-black/30 px-2 py-1 rounded">
                  {originUrl}
                </code>
              </div>

              {/* Step 2: Authorized Redirect URI */}
              <div className={`p-3 rounded-2xl border ${isDark ? 'bg-[#1E162D] border-[#35264B]' : 'bg-[#FAF8F5] border-[#E8E2D7]'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-800 dark:text-white">2. Authorized Redirect URI</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(redirectUri, 'uri')}
                    className="flex items-center gap-1 text-[11px] text-[#007A85] dark:text-[#00D4E0] hover:underline font-medium cursor-pointer"
                  >
                    {copiedKey === 'uri' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'uri' ? 'Copied!' : 'Copy URI'}</span>
                  </button>
                </div>
                <code className="text-[11px] font-mono text-[#D97736] block bg-black/5 dark:bg-black/30 px-2 py-1 rounded">
                  {redirectUri}
                </code>
              </div>

              {/* Step 3: Environment Variable */}
              <div className={`p-3 rounded-2xl border ${isDark ? 'bg-[#1E162D] border-[#35264B]' : 'bg-[#FAF8F5] border-[#E8E2D7]'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-800 dark:text-white">3. Your Client ID</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(googleClientConfig?.clientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || '529853114782-35e7lre3l58ust1tq4vk7r4d5af1v340.apps.googleusercontent.com', 'env')}
                    className="flex items-center gap-1 text-[11px] text-[#007A85] dark:text-[#00D4E0] hover:underline font-medium cursor-pointer"
                  >
                    {copiedKey === 'env' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'env' ? 'Copied!' : 'Copy Client ID'}</span>
                  </button>
                </div>
                <code className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 block bg-black/5 dark:bg-black/30 px-2 py-1 rounded break-all">
                  {googleClientConfig?.clientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || '529853114782-35e7lre3l58ust1tq4vk7r4d5af1v340.apps.googleusercontent.com'}
                </code>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#007A85] dark:text-[#00D4E0] hover:underline font-medium"
              >
                <span>Google Cloud Credentials Console</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="px-5 py-2.5 rounded-xl bg-[#007A85] hover:bg-[#006B75] text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                Close & Continue
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Login;
