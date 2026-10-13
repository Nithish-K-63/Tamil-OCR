import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, ScanLine, Sun, Moon, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleNotice, setGoogleNotice] = useState('');

  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const handleSubmit = (e) => {
    e?.preventDefault();
    setError('');
    setGoogleNotice('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      login(email, password, rememberMe);
      setLoading(false);
      navigate('/');
    }, 400);
  };

  const handleGoogleLogin = () => {
    setError('');
    // Check if Google OAuth is configured in this deployment
    const hasGoogleAuth = typeof window !== 'undefined' && 
      (Boolean(window.google?.accounts?.id) || Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID));

    if (hasGoogleAuth && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt();
        return;
      } catch (err) {
        console.warn('Google prompt invocation error:', err);
      }
    }

    // Google OAuth is not configured: display clear notification, do NOT simulate successful login
    setGoogleNotice(
      'Google Sign-In is not yet configured for this deployment. Please sign in using your official email address and password.'
    );
  };

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row font-english transition-colors duration-200 select-text ${isDark ? 'bg-[#0E0C13]' : 'bg-[#F5F2EB]'}`}>
      {/* ========================================================
          LEFT COLUMN: Manuscript Showcase Hero (Deep Plum / Aubergine)
          ======================================================== */}
      <div className="lg:w-1/2 bg-[#150D1D] text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden min-h-[580px] lg:min-h-screen">
        {/* Subtle decorative glowing background orbs */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-[#00737D]/12 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-[#4A154B]/25 blur-3xl pointer-events-none" />

        {/* Top Header Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-full bg-[#007A85] flex items-center justify-center text-white font-bold text-xl font-tamil shadow-md shadow-[#007A85]/20 ring-1 ring-white/10">
            அ
          </div>
          <div>
            <div className="flex items-center">
              <span className="font-bold text-lg tracking-tight text-white font-english">TamilOCR</span>
            </div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#9D8DA6] font-semibold font-english">
              MANUSCRIPT INTELLIGENCE
            </p>
          </div>
        </div>

        {/* Center: Manuscript Preview Graphic with Orbiting Rings */}
        <div className="my-auto py-8 sm:py-12 flex flex-col items-center justify-center relative z-10">
          {/* Orbital rings container */}
          <div className="relative w-72 h-80 sm:w-88 sm:h-96 flex items-center justify-center">
            {/* Outer faint orbital ring with glowing accent dots */}
            <div className="absolute inset-0 rounded-full border border-white/[0.08] pointer-events-none">
              {/* Glowing orange dot on outer orbit (~2 o'clock) */}
              <div className="absolute top-[28%] right-[10%] w-2 h-2 rounded-full bg-[#D97736] shadow-[0_0_8px_#D97736]" />
            </div>

            {/* Inner faint orbital ring */}
            <div className="absolute inset-8 sm:inset-10 rounded-full border border-white/[0.06] pointer-events-none">
              {/* Glowing orange dot on inner orbit (~10 o'clock) */}
              <div className="absolute top-[24%] left-[12%] w-2 h-2 rounded-full bg-[#D97736] shadow-[0_0_8px_#D97736]" />
            </div>

            {/* Tilted Manuscript Paper Document Card */}
            <div className="w-60 sm:w-68 bg-[#F2EBD9] text-[#2C241D] rounded-2xl shadow-2xl p-6 sm:p-7 border border-[#DFD5BE] transform -rotate-[4deg] hover:-rotate-[1deg] transition-transform duration-300 relative select-none">
              {/* Year Stamp */}
              <div className="absolute top-4 right-4 px-2.5 py-0.5 border border-[#8B3A2B]/50 rounded text-[#8B3A2B] text-[11px] font-mono font-bold tracking-wider">
                1978
              </div>

              {/* Manuscript Content in Tamil */}
              <div className="font-tamil space-y-2 pt-1">
                <h4 className="font-bold text-base sm:text-lg text-[#1D1712] tracking-wide">
                  தமிழ்நாடு
                </h4>
                <h4 className="font-bold text-sm sm:text-base text-[#1D1712] tracking-wide">
                  அரசு
                </h4>
                <p className="text-xs sm:text-sm text-[#4A3E31] leading-tight">
                  வருவாய்த்
                </p>
                <p className="text-xs sm:text-sm text-[#4A3E31] leading-tight">
                  துறை
                </p>
                <div className="w-6 h-0.5 bg-[#4A3E31]/40 my-1" />
                <p className="text-xs sm:text-sm text-[#4A3E31] leading-tight">
                  நிலப்
                </p>
                <p className="text-xs sm:text-sm text-[#4A3E31] leading-tight">
                  பதிவு
                </p>
                <p className="text-xs sm:text-sm text-[#4A3E31] leading-tight">
                  மாவட்டம்:
                </p>
              </div>

              {/* Circular Red Seal Stamp (த.நா. அரசு) */}
              <div className="absolute bottom-6 right-5 w-14 h-14 rounded-full border-2 border-[#8B3A2B]/60 flex flex-col items-center justify-center text-[#8B3A2B] text-[10px] font-bold font-tamil rotate-[-10deg] shadow-inner ring-1 ring-[#8B3A2B]/30">
                <span>த.நா.</span>
                <span>அரசு</span>
              </div>
            </div>

            {/* Floating Tamil AI Recognition Badge */}
            <div className="absolute bottom-1 sm:bottom-3 right-[-8px] sm:right-2 bg-[#1A1224]/95 border border-[#3B2B4C] rounded-xl px-3.5 py-2.5 shadow-2xl flex items-center gap-2.5 backdrop-blur-md z-20">
              <div className="w-7 h-7 rounded-lg bg-[#007A85]/20 flex items-center justify-center text-[#00A3B0]">
                <ScanLine className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-tight">Tamil AI Recognition</p>
                <p className="text-[10px] text-[#9D8DA6]">Preserving every character</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Headline and Footer */}
        <div className="relative z-10 space-y-4">
          <div className="space-y-1">
            <span className="text-3xl text-[#D97736] font-serif leading-none block">“</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white tracking-tight leading-tight">
              Preserving Tamil Heritage<br />Through AI.
            </h2>
            <p className="text-xs text-[#9D8DA6] font-tamil pt-1">
              தமிழ் மரபை தொழில்நுட்பத்தின் மூலம் பாதுகாப்போம்
            </p>
          </div>

          <div className="pt-6 border-t border-white/[0.08] flex items-center justify-between text-[10px] text-[#786A83] uppercase tracking-[0.18em] font-semibold">
            <span>GOVERNMENT ARCHIVE PROTOTYPE</span>
            <span>SECURE · ACCESSIBLE · UNICODE</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          RIGHT COLUMN: Login Form (Target Screenshot 2 Layout)
          ======================================================== */}
      <div className={`
        lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative transition-colors duration-200
        ${isDark ? 'bg-[#0E0C13] text-[#F5F2EB]' : 'bg-[#F5F2EB] text-[#1A1523]'}
      `}>
        {/* Top Right Theme Toggle (Pill Button) */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={toggleTheme}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all shadow-xs
              ${isDark 
                ? 'bg-[#181322] border-[#2A2036] text-[#9D8DA6] hover:bg-[#221A30]' 
                : 'bg-[#EAE4D7] border-[#DDD5C5] text-[#4A4154] hover:bg-[#E2DBCB]'}
            `}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
            aria-label="Toggle theme"
          >
            <Sun className={`w-3.5 h-3.5 ${!isDark ? 'text-amber-600 font-bold' : 'text-gray-400'}`} />
            <Moon className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400 font-bold' : 'text-gray-400'}`} />
          </button>
        </div>

        {/* Center Form Container */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D97736] mb-2 font-english">
            SECURE ARCHIVE ACCESS
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-serif font-bold tracking-tight mb-2 leading-tight">
            Welcome back
          </h1>
          <p className="text-xs text-[#8D8399] dark:text-[#8D8399] mb-8">
            Sign in to continue digitizing Tamil heritage records.
          </p>

          {/* Form Error Message */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs font-medium flex items-center justify-between">
              <span>{error}</span>
              <button type="button" onClick={() => setError('')} className="text-red-400 hover:text-red-300">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Google Auth Status / Notice */}
          {googleNotice && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <div className="flex-1 text-[11px] leading-relaxed">
                {googleNotice}
              </div>
              <button 
                type="button" 
                onClick={() => setGoogleNotice('')}
                className="text-amber-500 hover:text-amber-400 p-0.5"
                aria-label="Dismiss notice"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold mb-2 text-[#4A4154] dark:text-white/90">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#685E75] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@department.gov.in"
                  className={`
                    w-full pl-11 pr-4 py-3.5 rounded-xl border text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#007A85]
                    ${isDark 
                      ? 'bg-[#181322] border-[#2A2036] text-white placeholder-[#5C5369]' 
                      : 'bg-white border-[#DDD5C5] text-gray-900 placeholder-[#8D8399]'}
                  `}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold mb-2 text-[#4A4154] dark:text-white/90">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#685E75] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`
                    w-full pl-11 pr-11 py-3.5 rounded-xl border text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#007A85]
                    ${isDark 
                      ? 'bg-[#181322] border-[#2A2036] text-white placeholder-[#5C5369]' 
                      : 'bg-white border-[#DDD5C5] text-gray-900 placeholder-[#8D8399]'}
                  `}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#685E75] hover:text-[#9D8DA6] dark:hover:text-white transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Options Row (Remember me & Forgot password) */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-400 accent-[#007A85]"
                />
                <span className="text-[#5D5467] dark:text-[#8D8399]">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-[#009AA6] hover:text-[#00B4C2] font-medium transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button (Sign In Securely) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#007A85] hover:bg-[#006973] text-white font-semibold text-xs shadow-md shadow-[#007A85]/20 flex items-center justify-center gap-2 transition-all mt-3 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? 'Signing In...' : 'Sign In Securely'}</span>
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 relative flex items-center justify-center">
            <div className="w-full border-t border-gray-300 dark:border-white/[0.08]" />
            <span className={`absolute px-3 text-[11px] lowercase font-medium ${isDark ? 'bg-[#0E0C13] text-[#685E75]' : 'bg-[#F5F2EB] text-[#7A7185]'}`}>
              or continue with
            </span>
          </div>

          {/* Continue with Google Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className={`
              w-full py-3.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs
              ${isDark 
                ? 'bg-[#181322] border-[#2A2036] text-white hover:bg-[#20192D]' 
                : 'bg-white border-[#DDD5C5] text-gray-800 hover:bg-gray-50'}
            `}
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* New Account Link */}
          <div className="mt-6 text-center text-xs text-[#7A7185] dark:text-[#8D8399]">
            <span>New to TamilOCR? </span>
            <Link to="/register" className="text-[#009AA6] hover:text-[#00B4C2] font-semibold transition-colors">
              Request an account
            </Link>
          </div>

          {/* Demonstration Notice Card */}
          <div className={`
            mt-6 p-3.5 rounded-xl border flex items-center gap-3 text-xs
            ${isDark 
              ? 'bg-[#181322]/80 border-[#2A2036] text-[#8D8399]' 
              : 'bg-[#EFE9DD] border-[#DFD7C7] text-[#635A6D]'}
          `}>
            <Lock className="w-4 h-4 shrink-0 text-[#C07D2A]" />
            <p className="text-[11px] leading-relaxed">
              Protected demonstration environment. Authentication is simulated until connected to an identity provider.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-300 dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#7A7185] dark:text-[#685E75] gap-2">
          <span>© 2026 TamilOCR Project</span>
          <div className="flex items-center gap-3">
            <span className="hover:underline cursor-pointer">Privacy</span>
            <span>·</span>
            <span className="hover:underline cursor-pointer">Accessibility</span>
            <span>·</span>
            <span className="hover:underline cursor-pointer">Help</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
