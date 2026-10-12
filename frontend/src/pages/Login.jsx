import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, ScanLine, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Login = () => {
  const [email, setEmail] = useState('arun@department.gov.in');
  const [password, setPassword] = useState('TamilOCR@2025');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const handleSubmit = (e) => {
    e?.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address.');
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
    login('arun.kumar@department.gov.in', 'google_sso', true);
    navigate('/');
  };

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row transition-colors duration-200 font-english`}>
      {/* ========================================================
          LEFT COLUMN: Manuscript Showcase Hero (Dark Purple Plum)
          ======================================================== */}
      <div className="lg:w-1/2 bg-[#160C1D] text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden min-h-[500px] lg:min-h-screen">
        {/* Subtle decorative glowing background orbs */}
        <div className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full bg-[#00737D]/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[#4A154B]/20 blur-3xl pointer-events-none" />

        {/* Top Header Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-full bg-[#00737D] flex items-center justify-center text-white font-bold text-xl font-tamil shadow-md shadow-[#00737D]/20">
            அ
          </div>
          <div>
            <div className="flex items-center gap-0.5">
              <span className="font-bold text-lg tracking-tight text-white font-english">Tamil</span>
              <span className="font-bold text-lg tracking-tight text-[#F26522] font-english">OCR</span>
            </div>
            <p className="text-[9px] uppercase tracking-wider text-[#9D8DA6] font-medium font-english">
              MANUSCRIPT INTELLIGENCE
            </p>
          </div>
        </div>

        {/* Center: Manuscript Preview Graphic with Orbiting Rings */}
        <div className="my-auto py-10 flex flex-col items-center justify-center relative z-10">
          {/* Orbital rings */}
          <div className="relative w-72 h-80 sm:w-80 sm:h-96 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-white/10 pointer-events-none animate-[spin_60s_linear_infinite]" />
            <div className="absolute inset-6 rounded-full border border-[#00737D]/20 pointer-events-none" />

            {/* Tilted Paper Document Card */}
            <div className="w-56 sm:w-64 bg-[#EFE8D8] text-[#2C241D] rounded-xl shadow-2xl p-5 border border-[#DFD3BE] transform -rotate-2 hover:rotate-0 transition-transform duration-300 relative">
              {/* Year Stamp */}
              <div className="absolute top-3.5 right-3.5 px-2 py-0.5 border border-[#8B3A2B]/40 rounded text-[#8B3A2B] text-[11px] font-mono font-bold tracking-wider">
                1978
              </div>

              {/* Manuscript Content in Tamil */}
              <div className="font-tamil space-y-2.5 pt-2">
                <h4 className="font-bold text-sm text-[#1F1812] tracking-wide">
                  தமிழ்நாடு அரசு
                </h4>
                <p className="text-xs text-[#4A3E31] leading-relaxed">
                  வருவாய்த் துறை
                </p>
                <div className="w-8 h-0.5 bg-[#4A3E31]/40 my-1" />
                <p className="text-[11px] text-[#5C4F40]">
                  நிலப் பதிவு
                </p>
                <p className="text-[11px] text-[#5C4F40]">
                  மாவட்டம்: தஞ்சாவூர்
                </p>
              </div>

              {/* Circular Red Seal */}
              <div className="absolute bottom-4 right-4 w-12 h-12 rounded-full border-2 border-red-700/60 flex items-center justify-center text-red-800 text-[10px] font-bold font-tamil rotate-[-12deg] shadow-inner">
                த.நா. அரசு
              </div>
            </div>

            {/* Floating Tamil AI Recognition Badge */}
            <div className="absolute bottom-2 right-0 sm:right-2 bg-[#1C1525]/95 border border-[#3D2C4E] rounded-xl px-3.5 py-2.5 shadow-xl flex items-center gap-2.5 backdrop-blur-md">
              <div className="w-7 h-7 rounded-lg bg-[#00737D]/20 flex items-center justify-center text-[#00A3B0]">
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
            <span className="text-3xl text-[#C07D2A] font-serif leading-none block">“</span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight leading-tight">
              Preserving Tamil Heritage Through AI.
            </h2>
            <p className="text-xs text-[#A698B2] font-tamil">
              தமிழ் மரபை தொழில்நுட்பத்தின் மூலம் பாதுகாப்போம்
            </p>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[10px] text-[#7E6F89] uppercase tracking-wider font-semibold">
            <span>GOVERNMENT ARCHIVE PROTOTYPE</span>
            <span>SECURE · ACCESSIBLE · UNICODE</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          RIGHT COLUMN: Login Form (Warm Parchment / Dark Slate)
          ======================================================== */}
      <div className={`
        lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative transition-colors duration-200
        ${isDark ? 'bg-[#131019] text-[#F5F2EB]' : 'bg-[#F4F1EA] text-[#1A1523]'}
      `}>
        {/* Top Right Theme Toggle */}
        <div className="flex justify-end">
          <button
            onClick={toggleTheme}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all
              ${isDark 
                ? 'bg-[#1C1525] border-[#2C213A] text-[#D8CEE2] hover:bg-[#281D35]' 
                : 'bg-[#EAE4D7] border-[#DDD5C5] text-[#4A4154] hover:bg-[#E2DBCB]'}
            `}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          >
            <Sun className={`w-3.5 h-3.5 ${!isDark ? 'text-amber-600 font-bold' : 'text-gray-400'}`} />
            <Moon className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400 font-bold' : 'text-gray-400'}`} />
          </button>
        </div>

        {/* Center Form Container */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          <p className="text-xs font-bold uppercase tracking-wider text-[#C07D2A] mb-2 font-english">
            SECURE ARCHIVE ACCESS
          </p>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight mb-2">
            Welcome back
          </h1>
          <p className="text-xs text-[#7A7185] dark:text-[#9D93A7] mb-8">
            Sign in to continue digitizing Tamil heritage records.
          </p>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[#4A4154] dark:text-[#B8ADC4]">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@department.gov.in"
                  className={`
                    w-full pl-10 pr-4 py-3 rounded-xl border text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#00737D]
                    ${isDark 
                      ? 'bg-[#1D1726] border-[#2E243B] text-white placeholder-gray-500' 
                      : 'bg-white border-[#DDD5C5] text-gray-900 placeholder-gray-400'}
                  `}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[#4A4154] dark:text-[#B8ADC4]">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`
                    w-full pl-10 pr-10 py-3 rounded-xl border text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#00737D]
                    ${isDark 
                      ? 'bg-[#1D1726] border-[#2E243B] text-white placeholder-gray-500' 
                      : 'bg-white border-[#DDD5C5] text-gray-900 placeholder-gray-400'}
                  `}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-gray-400 hover:text-current"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Options Row */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 accent-[#00737D]"
                />
                <span className="text-[#5D5467] dark:text-[#A79CB1]">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-[#00737D] font-medium hover:underline">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#00737D] hover:bg-[#005F67] text-white font-semibold text-xs shadow-md shadow-[#00737D]/20 flex items-center justify-center gap-2 transition-all mt-2"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? 'Signing In...' : 'Sign In Securely'}</span>
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-gray-300 dark:border-white/10" />
            <span className="px-3 text-[11px] text-gray-400 lowercase font-medium">or continue with</span>
            <div className="flex-grow border-t border-gray-300 dark:border-white/10" />
          </div>

          {/* Continue with Google Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className={`
              w-full py-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2.5 transition-all
              ${isDark 
                ? 'bg-[#1D1726] border-[#2E243B] text-white hover:bg-[#251D30]' 
                : 'bg-white border-[#DDD5C5] text-gray-800 hover:bg-gray-50 shadow-xs'}
            `}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* New Account Link */}
          <div className="mt-6 text-center text-xs text-[#7A7185] dark:text-[#9D93A7]">
            <span>New to TamilOCR? </span>
            <Link to="/register" className="text-[#00737D] font-semibold hover:underline">
              Request an account
            </Link>
          </div>

          {/* Demo Banner */}
          <div className={`
            mt-6 p-3.5 rounded-xl border flex items-center gap-3 text-xs
            ${isDark 
              ? 'bg-[#1C1625] border-[#2C2138] text-[#9D93A7]' 
              : 'bg-[#EFE9DD] border-[#DFD7C7] text-[#635A6D]'}
          `}>
            <Lock className="w-4 h-4 shrink-0 text-amber-700/70 dark:text-amber-500/70" />
            <p className="text-[11px] leading-relaxed">
              Protected demonstration environment. Authentication is simulated until connected to an identity provider.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-300 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#7A7185] dark:text-[#9D93A7] gap-2">
          <span>© 2025 TamilOCR Project</span>
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
