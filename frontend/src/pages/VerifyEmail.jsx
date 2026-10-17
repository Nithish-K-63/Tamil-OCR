import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Mail,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sun,
  Moon,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { verifyEmailApi, resendVerificationApi } from '../api/authApi';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const emailFromUrl = searchParams.get('email') || '';

  const [tokenInput, setTokenInput] = useState(tokenFromUrl);
  const [resendEmail, setResendEmail] = useState(emailFromUrl);
  const [loading, setLoading] = useState(Boolean(tokenFromUrl));
  const [status, setStatus] = useState(tokenFromUrl ? 'verifying' : 'idle'); // 'idle' | 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const [verifiedUser, setVerifiedUser] = useState(null);

  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendError, setResendError] = useState('');

  const { setAuthSession } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  // Perform token verification
  const handleVerify = async (tokenToVerify) => {
    const cleanToken = (tokenToVerify || tokenInput).trim();
    if (!cleanToken) {
      setStatus('error');
      setMessage('Please enter or provide a valid verification token.');
      return;
    }

    setLoading(true);
    setStatus('verifying');
    setMessage('Verifying your credentials and activating your account...');

    try {
      const res = await verifyEmailApi(cleanToken);
      if (res?.success) {
        setStatus('success');
        setMessage(res.message || 'Your email has been verified and your account is active!');
        setVerifiedUser(res.user);

        // Store session if backend returned auth token
        if (res.token && res.user) {
          setAuthSession({ token: res.token, user: res.user, remember: true });
        }
      } else {
        setStatus('error');
        setMessage(res?.message || 'Verification token is invalid or has expired.');
      }
    } catch (err) {
      setStatus('error');
      setMessage(err?.message || 'Failed to verify account. The token may be expired or already used.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-verify on load if token is present in URL
  useEffect(() => {
    if (tokenFromUrl) {
      handleVerify(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  // Handle Resend Verification Email
  const handleResend = async (e) => {
    e?.preventDefault();
    setResendError('');
    setResendMessage('');

    const cleanEmail = resendEmail.trim();
    if (!cleanEmail) {
      setResendError('Please enter your registered email address.');
      return;
    }

    setResending(true);
    try {
      const res = await resendVerificationApi(cleanEmail);
      if (res?.emailSent) {
        setResendMessage(`A fresh verification email has been sent to ${cleanEmail}. Please check your inbox.`);
      } else {
        setResendMessage(
          res?.configMessage || 'A new verification link has been generated. Please contact your system administrator.'
        );
      }
    } catch (err) {
      setResendError(err?.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between transition-colors duration-200 ${isDark ? 'bg-[#0E0A14] text-[#F3EFF8]' : 'bg-[#FAF8F5] text-[#221B2A]'}`}>
      
      {/* Header */}
      <header className={`py-4 px-6 border-b flex items-center justify-between ${isDark ? 'border-[#271E36] bg-[#150F22]/90' : 'border-[#E6E1D7] bg-white/90'} backdrop-blur-md sticky top-0 z-10`}>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="flex items-center gap-2 text-xs font-semibold text-[#007A85] dark:text-[#00B4C2] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sign In</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              isDark
                ? 'bg-[#1E162D] border-[#382B4B] text-[#D4CEE0] hover:bg-[#2A1F3D]'
                : 'bg-white border-[#E4DCD0] text-[#554C61] hover:bg-[#F2ECE0]'
            }`}
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
            <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <div className="w-full max-w-md">

          <div className={`p-6 sm:p-8 rounded-3xl border transition-all ${
            isDark
              ? 'bg-[#150F22]/95 border-[#2D2140] shadow-2xl shadow-black/60 backdrop-blur-md'
              : 'bg-white border-[#E4DCD0] shadow-xl shadow-[#007A85]/5'
          }`}>

            {/* Verifying Spinner */}
            {status === 'verifying' && (
              <div className="text-center py-8 space-y-4">
                <div className="w-12 h-12 border-3 border-[#007A85] border-t-transparent rounded-full animate-spin mx-auto" />
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Activating Account
                </h2>
                <p className="text-xs text-[#7A6F87] dark:text-[#A79CB5] leading-relaxed">
                  {message || 'Validating cryptographic activation token...'}
                </p>
              </div>
            )}

            {/* Success State */}
            {status === 'success' && (
              <div className="text-center py-4 space-y-5 animate-in fade-in duration-300">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1.5">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 mb-1">
                    Verified & Active
                  </span>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Account Activated Successfully!
                  </h2>
                  <p className="text-xs text-[#7A6F87] dark:text-[#A79CB5] leading-relaxed">
                    {message}
                  </p>
                </div>

                {verifiedUser && (
                  <div className={`p-3.5 rounded-2xl border text-left text-xs ${
                    isDark ? 'bg-[#1D162B] border-[#36274D]' : 'bg-[#FAF8F5] border-[#E8E2D7]'
                  }`}>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {verifiedUser.name || verifiedUser.fullName}
                    </p>
                    <p className="text-[11px] font-mono text-[#007A85] dark:text-[#00D4E0]">
                      {verifiedUser.email}
                    </p>
                    <p className="text-[11px] text-[#7A6F87] dark:text-[#9D8DA6] mt-1">
                      {verifiedUser.department || 'Tamil Nadu Heritage Records Division'}
                    </p>
                  </div>
                )}

                <div className="pt-2 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="w-full py-3.5 rounded-2xl bg-[#007A85] hover:bg-[#006E78] text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <span>Proceed to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <Link
                    to="/login"
                    className="block text-center text-xs font-semibold text-[#007A85] dark:text-[#00D4E0] hover:underline py-1"
                  >
                    Sign In with another account &rarr;
                  </Link>
                </div>
              </div>
            )}

            {/* Error or Idle State */}
            {(status === 'error' || status === 'idle') && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                    status === 'error'
                      ? 'bg-red-500/10 border border-red-500/20 text-red-500'
                      : 'bg-[#007A85]/10 border border-[#007A85]/20 text-[#007A85] dark:text-[#00D4E0]'
                  }`}>
                    {status === 'error' ? <XCircle className="w-6 h-6" /> : <Mail className="w-6 h-6" />}
                  </div>

                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    {status === 'error' ? 'Activation Link Invalid or Expired' : 'Activate Your Officer Account'}
                  </h2>
                  <p className="text-xs text-[#7A6F87] dark:text-[#A79CB5] leading-relaxed">
                    {message || 'Enter your activation token or request a fresh verification email below.'}
                  </p>
                </div>

                {/* Token Manual Form */}
                <div className="space-y-3">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#635773] dark:text-[#AEA3BD]">
                    Activation Token
                  </label>
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Paste your 32-character token here"
                    className={`w-full px-4 py-3 rounded-xl border text-xs font-mono transition-all outline-none ${
                      isDark
                        ? 'bg-[#1A1226] border-[#372A4E] text-white focus:border-[#007A85]'
                        : 'bg-white border-[#E0D8CB] text-gray-900 focus:border-[#007A85]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => handleVerify(tokenInput)}
                    disabled={loading || !tokenInput.trim()}
                    className="w-full py-3 rounded-xl bg-[#007A85] hover:bg-[#006E78] disabled:opacity-50 text-white text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>{loading ? 'Validating...' : 'Activate Account'}</span>
                  </button>
                </div>

                {/* Resend Section */}
                <div className="pt-4 border-t border-[#E6E1D7] dark:border-[#271E36] space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#007A85] dark:text-[#00D4E0]" />
                    <span className="text-xs font-bold text-gray-800 dark:text-white">
                      Need a new verification link?
                    </span>
                  </div>

                  <form onSubmit={handleResend} className="space-y-3">
                    <input
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="officer.name@department.gov.in"
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs transition-all outline-none ${
                        isDark
                          ? 'bg-[#1A1226] border-[#372A4E] text-white focus:border-[#007A85]'
                          : 'bg-white border-[#E0D8CB] text-gray-900 focus:border-[#007A85]'
                      }`}
                    />

                    {resendMessage && (
                      <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 leading-relaxed">
                        {resendMessage}
                      </p>
                    )}

                    {resendError && (
                      <p className="text-[11px] font-medium text-red-600 dark:text-red-400 leading-relaxed">
                        {resendError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={resending}
                      className={`w-full py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        isDark
                          ? 'bg-[#1E162D] border-[#382B4B] text-white hover:bg-[#281E3B]'
                          : 'bg-[#FAF8F5] border-[#DFD7CA] text-gray-800 hover:bg-[#F2ECE0]'
                      }`}
                    >
                      {resending ? 'Sending...' : 'Resend Verification Link'}
                    </button>
                  </form>
                </div>

              </div>
            )}

            {/* Bottom Security Info */}
            <div className={`mt-6 p-3 rounded-xl border flex items-center gap-2.5 text-[11px] ${
              isDark ? 'bg-[#1A1226]/60 border-[#2D2140] text-[#9D8DA6]' : 'bg-[#FAF8F5] border-[#E8E2D7] text-[#695F75]'
            }`}>
              <ShieldCheck className="w-4 h-4 text-[#007A85] dark:text-[#00D4E0] shrink-0" />
              <span>Cryptographic URL verification with token lifetime validation.</span>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className={`py-4 px-6 border-t text-center text-xs ${isDark ? 'border-[#271E36] text-[#7A6F87]' : 'border-[#E6E1D7] text-[#8C8199]'}`}>
        <p>© 2026 TamilOCR Project · Directorate of Historical Archives & Digitization Portal</p>
      </footer>

    </div>
  );
};

export default VerifyEmail;
