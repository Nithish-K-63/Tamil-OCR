import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sun,
  Moon,
  AlertCircle,
  X,
  ShieldCheck,
  CheckCircle2,
  Building,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Tamil Nadu Heritage Records Division');
  const [role, setRole] = useState('Project Administrator');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [pendingApproval, setPendingApproval] = useState(false);

  const { register, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  // If already authenticated, redirect to workspace
  useEffect(() => {
    if (isAuthenticated && !pendingApproval) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, pendingApproval, navigate]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccessMessage('');

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    // Client-side Validation
    if (!trimmedName) {
      setError('Please provide your full legal or official name.');
      return;
    }
    if (trimmedName.length < 2) {
      setError('Full name must be at least 2 characters long.');
      return;
    }

    if (!trimmedEmail) {
      setError('Please enter your official email address.');
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      setError('Please provide a valid official email address (e.g. name@department.gov.in).');
      return;
    }

    if (!password) {
      setError('Please create a password for your account.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    if (!agreeTerms) {
      setError('You must accept the Government Archives Security & Digitization Guidelines.');
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        fullName: trimmedName,
        email: trimmedEmail,
        password,
        department,
        role
      });

      // Handle administrator approval workflows if designated by backend
      const requiresApproval =
        res?.user?.status === 'pending_approval' ||
        res?.status === 'pending_approval' ||
        res?.approvalRequired === true;

      if (requiresApproval) {
        setPendingApproval(true);
        setSuccessMessage(
          'Your registration request has been submitted and is currently pending Administrator approval. You will receive an official notification once authorized.'
        );
      } else {
        setSuccessMessage('Account registered successfully! Redirecting to your workspace...');
        setTimeout(() => {
          navigate('/');
        }, 1200);
      }
    } catch (err) {
      const errMsg = err?.message || 'Registration failed. Please check your credentials and try again.';
      // Friendly contextual message for duplicate emails
      if (errMsg.toLowerCase().includes('already exists') || errMsg.toLowerCase().includes('duplicate')) {
        setError('An account with this email address already exists. Please sign in or use a different email.');
      } else {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-english transition-colors duration-200 select-text ${isDark ? 'bg-[#0E0C14] text-[#F5F2EB]' : 'bg-[#FAF9F5] text-[#1A1523]'}`}>

      {/* ========================================================
          1. STICKY TOP NAVIGATION BAR
          ======================================================== */}
      <header className={`
        sticky top-0 z-50 w-full backdrop-blur-xl border-b transition-colors duration-200
        ${isDark
          ? 'bg-[#0E0C14]/90 border-[#271E36] text-white shadow-sm shadow-black/20'
          : 'bg-[#FAF9F5]/90 border-[#E6E1D7] text-[#181320] shadow-xs'}
      `}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">

          {/* Left: Project Logo & Name */}
          <Link to="/login" className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#007A85] to-[#00A3B0] flex items-center justify-center text-white font-bold text-xl font-tamil shadow-md shadow-[#007A85]/20 ring-1 ring-white/10 shrink-0 group-hover:scale-105 transition-transform">
              அ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight font-english">TamilOCR</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#007A85]/15 text-[#007A85] dark:text-[#00D4E0] border border-[#007A85]/20">
                  v2.4
                </span>
              </div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#7A6F87] dark:text-[#9D8DA6] font-semibold font-english">
                GOVERNMENT ARCHIVES DIGITIZATION
              </p>
            </div>
          </Link>

          {/* Right Action Items: Theme Toggle & Return to Sign In */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Theme Switcher Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`
                p-2 rounded-xl border text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center
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

            {/* Link back to Sign In */}
            <Link
              to="/login"
              className={`
                inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer
                ${isDark
                  ? 'border-[#2E223D] text-[#D8CFE0] hover:text-white hover:bg-[#181224]'
                  : 'border-[#E0D9CD] text-[#332A3B] hover:bg-[#F5EFE3]'}
              `}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================
          2. MAIN REGISTRATION VIEW (Centered Card Layout)
          ======================================================== */}
      <main className="relative flex-1 flex flex-col justify-between px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* Ambient background aura glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#007A85]/5 dark:bg-[#007A85]/10 blur-3xl rounded-full pointer-events-none" />

        {/* Top Status Bar */}
        <div className="max-w-xl mx-auto w-full flex items-center justify-between relative z-10 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 text-xs font-medium text-[#7A6F87] dark:text-[#9A8DA7]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono">Archive Database Connected</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-[#007A85] dark:text-[#00D4E0] font-semibold">
            SECURE REGISTRATION
          </span>
        </div>

        {/* Registration Card Container */}
        <div className="w-full max-w-[490px] mx-auto my-auto relative z-10">
          <div
            className={`p-6 sm:p-10 rounded-3xl border transition-all ${isDark
                ? 'bg-[#150F22]/90 border-[#2D2140] shadow-2xl shadow-black/50 backdrop-blur-sm'
                : 'bg-white border-[#E4DCD0] shadow-xl shadow-[#007A85]/5'
              }`}
          >
            {/* Header / Workspace Pill Badge */}
            <div className="mb-6 text-center">
              <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#007A85] bg-[#007A85]/10 dark:text-[#00B4C2] dark:bg-[#007A85]/20 mb-3">
                OFFICIAL ARCHIVE WORKSPACE
              </span>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight mb-2 text-[#181320] dark:text-white">
                Create Account
              </h1>
              <p className="text-xs text-[#70667C] dark:text-[#9C8FA8] leading-relaxed max-w-sm mx-auto">
                Register for official credentials to access the TamilOCR digitization and character recognition portal.
              </p>
            </div>

            {/* Error Notice */}
            {error && (
              <div
                id="registerErrorAlert"
                role="alert"
                className="mb-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium flex items-center justify-between gap-2 shadow-xs animate-in fade-in duration-200"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="text-red-400 hover:text-red-300 cursor-pointer"
                  aria-label="Dismiss error"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Pending Approval Status Notice */}
            {pendingApproval && (
              <div
                id="pendingApprovalAlert"
                className="mb-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-medium shadow-xs animate-in fade-in duration-200"
              >
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-xs text-amber-800 dark:text-amber-200">
                      Registration Pending Administrator Approval
                    </p>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      {successMessage}
                    </p>
                    <div className="pt-2">
                      <Link
                        to="/login"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#007A85] dark:text-[#00D4E0] hover:underline"
                      >
                        <span>Return to Sign In Portal</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Successful Direct Registration Notice */}
            {successMessage && !pendingApproval && (
              <div
                id="registerSuccessAlert"
                className="mb-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2.5 shadow-xs animate-in fade-in duration-200"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Registration Form (hidden once approved/pending state is established) */}
            {!pendingApproval && (
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-xs font-semibold mb-2 text-[#4A4154] dark:text-[#C5BAD3]">
                    Full name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#7B7089] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Dr. S. Ramanathan"
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

                {/* Official Email Address */}
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold mb-2 text-[#4A4154] dark:text-[#C5BAD3]">
                    Official email address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#7B7089] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="officer@tamilocr.gov.in"
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

                {/* Department & Role Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label htmlFor="role" className="block text-xs font-semibold mb-2 text-[#4A4154] dark:text-[#C5BAD3]">
                      Assigned role
                    </label>
                    <select
                      id="role"
                      name="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className={`
                        w-full px-3.5 py-3.5 rounded-2xl border text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#007A85]/25 focus:border-[#007A85] cursor-pointer
                        ${isDark
                          ? 'bg-[#181224] border-[#2C213B] text-white'
                          : 'bg-white border-[#E0D9CD] text-gray-900 shadow-xs'}
                      `}
                    >
                      <option value="Project Administrator">Project Administrator</option>
                      <option value="Archive Officer">Archive Officer</option>
                      <option value="OCR Specialist">OCR Specialist</option>
                      <option value="Epigraphist">Senior Epigraphist</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="department" className="block text-xs font-semibold mb-2 text-[#4A4154] dark:text-[#C5BAD3]">
                      Department
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-[#7B7089] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="department"
                        name="department"
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="Records Division"
                        className={`
                          w-full pl-10 pr-3 py-3.5 rounded-2xl border text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#007A85]/25 focus:border-[#007A85]
                          ${isDark
                            ? 'bg-[#181224] border-[#2C213B] text-white placeholder-[#5E546B]'
                            : 'bg-white border-[#E0D9CD] text-gray-900 placeholder-[#9C92A6] shadow-xs'}
                        `}
                      />
                    </div>
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="block text-xs font-semibold mb-2 text-[#4A4154] dark:text-[#C5BAD3]">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#7B7089] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
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

                {/* Confirm Password Input */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-semibold mb-2 text-[#4A4154] dark:text-[#C5BAD3]">
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#7B7089] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
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
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7B7089] hover:text-[#9D8DA6] dark:hover:text-white transition-colors cursor-pointer"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Agreement Policy Checkbox */}
                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    name="agreeTerms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 dark:border-[#382B4B] accent-[#007A85] cursor-pointer"
                  />
                  <label htmlFor="agreeTerms" className="text-xs text-[#645A70] dark:text-[#9E92AB] cursor-pointer select-none leading-relaxed">
                    I agree to the <span className="text-[#007A85] dark:text-[#00D4E0] font-semibold">Government Archives Security & Digitization Guidelines</span>.
                  </label>
                </div>

                {/* Create Account Submit Button */}
                <button
                  type="submit"
                  id="createAccountSubmitBtn"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#007A85] to-[#008996] hover:from-[#006E78] hover:to-[#007A85] active:scale-[0.99] text-white font-semibold text-xs shadow-lg shadow-[#007A85]/25 flex items-center justify-center gap-2 transition-all mt-4 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                </button>
              </form>
            )}

            {/* Return to Sign In Link */}
            <div className="mt-6 text-center text-xs text-[#70667C] dark:text-[#9C8FA8]">
              <span>Already registered officer or researcher? </span>
              <Link
                to="/login"
                id="returnToSignInLink"
                className="text-[#007A85] dark:text-[#00B4C2] hover:underline font-semibold transition-colors"
              >
                Sign in here
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

        {/* Section Bottom Sub-Footer */}
        <div className="max-w-xl mx-auto w-full pt-6 border-t border-[#E6E1D7] dark:border-[#271E36] flex items-center justify-between text-[11px] text-[#7E748B] dark:text-[#786D85] relative z-10">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-[#007A85] dark:text-[#00D4E0] hover:underline cursor-pointer font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Sign In Portal</span>
          </Link>
          <span>v2.4 Production</span>
        </div>

      </main>

    </div>
  );
};

export default Register;
