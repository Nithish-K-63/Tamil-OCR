import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Building, ArrowRight, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Tamil Nadu Heritage Records Division');
  const [role, setRole] = useState('Project Administrator');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all required registration fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setError('You must accept the Government Archives Security Policy.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      register({ fullName, email, department, role });
      setLoading(false);
      navigate('/');
    }, 500);
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
        w-full max-w-lg rounded-2xl border shadow-xl p-8 relative z-10 transition-all my-8
        ${isDark ? 'bg-[#1D1726] border-[#2C2237]' : 'bg-white border-[#DFD7C7]'}
      `}>
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[#00737D] flex items-center justify-center font-bold text-white text-xl font-tamil mx-auto mb-3 shadow-sm">
            அ
          </div>
          <h1 className="text-2xl font-serif font-bold tracking-tight">Create Account</h1>
          <p className="text-xs text-[#7A7185] dark:text-[#9D93A7] mt-1">
            Sign up to access the TamilOCR Digitization Workspace
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#4A4154] dark:text-[#B8ADC4] mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Arun Kumar"
                className={`
                  w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00737D]
                  ${isDark ? 'bg-[#15101C] border-[#2C2237] text-white' : 'bg-[#FAF8F5] border-[#DFD7C7] text-gray-900'}
                `}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#4A4154] dark:text-[#B8ADC4] mb-1">
                Official Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@department.gov.in"
                  className={`
                    w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00737D]
                    ${isDark ? 'bg-[#15101C] border-[#2C2237] text-white' : 'bg-[#FAF8F5] border-[#DFD7C7] text-gray-900'}
                  `}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A4154] dark:text-[#B8ADC4] mb-1">
                Assigned Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={`
                  w-full px-3 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00737D]
                  ${isDark ? 'bg-[#15101C] border-[#2C2237] text-white' : 'bg-[#FAF8F5] border-[#DFD7C7] text-gray-900'}
                `}
              >
                <option value="Project Administrator">Project Administrator</option>
                <option value="Archive Officer">Archive Officer</option>
                <option value="OCR Specialist">OCR Specialist</option>
                <option value="Epigraphist">Senior Epigraphist</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4A4154] dark:text-[#B8ADC4] mb-1">
              Department
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={`
                  w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00737D]
                  ${isDark ? 'bg-[#15101C] border-[#2C2237] text-white' : 'bg-[#FAF8F5] border-[#DFD7C7] text-gray-900'}
                `}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#4A4154] dark:text-[#B8ADC4] mb-1">
                Password
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
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A4154] dark:text-[#B8ADC4] mb-1">
                Confirm Password
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
              />
            </div>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-[#00737D]"
            />
            <span className="text-[11px] text-[#7A7185] dark:text-[#9D93A7] leading-normal">
              I agree to the <span className="text-[#00737D] font-semibold">Archive Security & Digitization Guidelines</span>.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 rounded-xl bg-[#00737D] hover:bg-[#005F67] text-white font-semibold text-xs shadow-md shadow-[#00737D]/20 flex items-center justify-center gap-2 transition-all"
          >
            <span>{loading ? 'Registering...' : 'Complete Registration'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#7A7185] dark:text-[#9D93A7]">
          <span>Already registered? </span>
          <Link to="/login" className="text-[#00737D] font-semibold hover:underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
