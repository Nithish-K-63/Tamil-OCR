import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, CheckCircle2, ArrowLeft, Sun, Moon, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { resetPasswordApi } from '../api/authApi';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const emailFromUrl = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordApi({
        token: tokenFromUrl || undefined,
        email: emailFromUrl || undefined,
        newPassword: password
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message || 'Failed to update password. Please check your reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`
      min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 transition-colors duration-200 font-english
      ${isDark ? 'bg-[#131019] text-[#F5F2EB]' : 'bg-[#F4F1EA] text-[#1A1523]'}
    `}>
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleTheme}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all
            ${isDark 
              ? 'bg-[#1C1525] border-[#2C213A] text-[#D8CEE2]' 
              : 'bg-[#EAE4D7] border-[#DDD5C5] text-[#4A4154]'}
          `}
        >
          <Sun className={`w-3.5 h-3.5 ${!isDark ? 'text-amber-600 font-bold' : 'text-gray-400'}`} />
          <Moon className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400 font-bold' : 'text-gray-400'}`} />
        </button>
      </div>

      <div className={`
        w-full max-w-md rounded-2xl border shadow-xl p-8 relative z-10 transition-all
        ${isDark ? 'bg-[#1D1726] border-[#2C2237]' : 'bg-white border-[#DFD7C7]'}
      `}>
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00737D] mb-6 hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Login</span>
        </Link>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[#00737D]/10 text-[#00737D] flex items-center justify-center mx-auto mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-serif font-bold tracking-tight">Set New Password</h1>
          <p className="text-xs text-[#7A7185] dark:text-[#9D93A7] mt-1">
            Update your account password with salted PBKDF2 encryption
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium text-center flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="text-center p-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 space-y-3">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-sm">Password Updated Successfully!</h3>
            <p className="text-xs text-[#5D5467] dark:text-[#A79CB1]">Your credentials were saved. Redirecting to login portal...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#4A4154] dark:text-[#B8ADC4] mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className={`
                  w-full px-4 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00737D]
                  ${isDark ? 'bg-[#15101C] border-[#2C2237] text-white' : 'bg-[#FAF8F5] border-[#DFD7C7] text-gray-900'}
                `}
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A4154] dark:text-[#B8ADC4] mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className={`
                  w-full px-4 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00737D]
                  ${isDark ? 'bg-[#15101C] border-[#2C2237] text-white' : 'bg-[#FAF8F5] border-[#DFD7C7] text-gray-900'}
                `}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#00737D] hover:bg-[#005F67] text-white font-semibold text-xs shadow-md shadow-[#00737D]/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>{loading ? 'Updating Credentials...' : 'Save New Password'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
