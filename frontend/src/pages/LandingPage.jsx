import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sun,
  Moon,
  ArrowRight,
  Upload,
  Sliders,
  RefreshCw,
  FileCheck,
  Download,
  BookOpen,
  Database,
  Building,
  Users,
  Search,
  CheckCircle2,
  ChevronDown,
  Menu,
  X,
  Archive,
  Shield,
  FileText,
  Sparkles,
  Cpu,
  Layers,
  ShieldCheck,
  Check,
  Lock,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const LandingPage = () => {
  const { isAuthenticated, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isDark = theme === 'dark';

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const navOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
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
          <Link to="/" className="flex items-center gap-3 group">
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

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-medium text-[#645A70] dark:text-[#A79BB3]">
            <button
              type="button"
              onClick={() => scrollToSection('overview')}
              className="hover:text-[#007A85] dark:hover:text-[#00D4E0] transition-colors cursor-pointer"
            >
              System Overview
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-[#007A85] dark:hover:text-[#00D4E0] transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('features')}
              className="hover:text-[#007A85] dark:hover:text-[#00D4E0] transition-colors cursor-pointer"
            >
              Key Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('beneficiaries')}
              className="hover:text-[#007A85] dark:hover:text-[#00D4E0] transition-colors cursor-pointer"
            >
              Who Can Use
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('about')}
              className="hover:text-[#007A85] dark:hover:text-[#00D4E0] transition-colors cursor-pointer"
            >
              About Project
            </button>
          </nav>

          {/* Right Action Items: Theme Toggle, Sign In, Request Account */}
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

            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#007A85] hover:bg-[#006E78] text-white shadow-md shadow-[#007A85]/20 transition-all cursor-pointer"
              >
                <span>Workspace ({user?.name ? user.name.split(' ')[0] : 'Open'})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                {/* Sign In Navigation Link */}
                <Link
                  to="/login"
                  id="topNavSignInBtn"
                  className={`
                    inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-xs hover:shadow-sm
                    ${isDark
                      ? 'border-[#2E223D] text-[#E0D7E8] hover:text-white hover:bg-[#181224]'
                      : 'border-[#E0D9CD] text-[#221A2C] hover:bg-[#F5EFE3]'}
                  `}
                >
                  Sign In
                </Link>

                {/* Request Account / Sign Up Link */}
                <Link
                  to="/register"
                  id="topNavSignUpBtn"
                  aria-label="Sign Up or Request an Account"
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#007A85] hover:bg-[#006E78] active:scale-[0.98] text-white shadow-md shadow-[#007A85]/20 transition-all cursor-pointer"
                >
                  <span>Request Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl border border-transparent text-[#7A6F87] dark:text-[#9D8DA6] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className={`lg:hidden px-4 pt-2 pb-5 border-t border-b space-y-2 text-xs font-medium animate-in slide-in-from-top-2 duration-200 ${isDark ? 'bg-[#120C1C] border-[#271E36]' : 'bg-[#FAF9F5] border-[#E6E1D7]'}`}>
            <button
              type="button"
              onClick={() => scrollToSection('overview')}
              className="block w-full text-left py-2 px-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            >
              System Overview
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="block w-full text-left py-2 px-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('features')}
              className="block w-full text-left py-2 px-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            >
              Key Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('beneficiaries')}
              className="block w-full text-left py-2 px-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            >
              Who Can Use This Platform
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('about')}
              className="block w-full text-left py-2 px-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            >
              About the Project
            </button>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
              <Link
                to="/login"
                className="py-2 px-3 font-semibold text-[#007A85] dark:text-[#00D4E0] cursor-pointer"
              >
                Sign In →
              </Link>
              <Link
                to="/register"
                className="py-2 px-3 rounded-lg bg-[#007A85] text-white font-semibold text-xs inline-flex items-center gap-1"
              >
                <span>Request Account</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================
          2. ELEGANT HERO SECTION (NO LOGIN FORM HERE)
          ======================================================== */}
      <section className={`relative overflow-hidden border-b transition-colors duration-200 py-20 sm:py-28 px-4 sm:px-6 lg:px-8 ${
        isDark ? 'bg-gradient-to-b from-[#0E0C14] via-[#120B1B] to-[#0E0C14] border-[#271E36]' : 'bg-gradient-to-b from-[#FAF9F5] via-[#F4EFE6] to-[#FAF9F5] border-[#E6E1D7]'
      }`}>
        {/* Ambient decorative glowing backdrops */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#007A85]/10 dark:bg-[#007A85]/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/4 right-10 w-[400px] h-[300px] bg-[#D97736]/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8">
          
          {/* Top badges */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#007A85]/10 dark:bg-[#007A85]/20 text-[#007A85] dark:text-[#00D4E0] border border-[#007A85]/25 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AI-POWERED ARCHIVAL HERITAGE PRESERVATION</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-[#181320] dark:text-white leading-[1.15]">
            Preserving Centuries of <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#007A85] via-[#00A3B0] to-[#D97736]">
              Tamil Heritage Manuscripts
            </span>
          </h1>

          {/* Subtitle Description */}
          <p className="max-w-3xl mx-auto text-sm sm:text-base lg:text-lg text-[#645A70] dark:text-[#B1A4BD] leading-relaxed">
            An advanced optical character recognition platform engineered to transcribe aged Tamil handwriting, palm-leaf scriptures, and historic revenue deeds into verified, searchable modern Tamil Unicode text.
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3.5 sm:gap-4">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-7 py-4 rounded-2xl bg-gradient-to-r from-[#007A85] to-[#00919E] hover:from-[#006E78] hover:to-[#007A85] text-white font-semibold text-sm shadow-xl shadow-[#007A85]/25 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Enter Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  id="heroSignInBtn"
                  className="px-7 py-4 rounded-2xl bg-gradient-to-r from-[#007A85] to-[#00919E] hover:from-[#006E78] hover:to-[#007A85] text-white font-semibold text-sm shadow-xl shadow-[#007A85]/25 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => scrollToSection('overview')}
                  className={`
                    px-7 py-4 rounded-2xl border font-semibold text-sm transition-all inline-flex items-center gap-2 cursor-pointer
                    ${isDark
                      ? 'bg-[#181224] border-[#2E223D] text-[#D8CFE0] hover:text-white hover:bg-[#201830]'
                      : 'bg-white border-[#E0D9CD] text-[#2F2638] hover:bg-[#F2ECE0] shadow-xs'}
                  `}
                >
                  <span>Explore Platform</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Quick Metrics & System Proof Badges */}
          <div className="pt-8 border-t border-black/5 dark:border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#140F20]/60 border-[#271E36]' : 'bg-white/70 border-[#E8E2D6]'}`}>
              <div className="text-xl sm:text-2xl font-bold font-serif text-[#007A85] dark:text-[#00D4E0]">94.2%</div>
              <div className="text-[11px] text-[#7A6F87] dark:text-[#9D8DA6]">Recognition Accuracy</div>
            </div>
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#140F20]/60 border-[#271E36]' : 'bg-white/70 border-[#E8E2D6]'}`}>
              <div className="text-xl sm:text-2xl font-bold font-serif text-[#D97736]">U+0B80</div>
              <div className="text-[11px] text-[#7A6F87] dark:text-[#9D8DA6]">Tamil Unicode Standard</div>
            </div>
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#140F20]/60 border-[#271E36]' : 'bg-white/70 border-[#E8E2D6]'}`}>
              <div className="text-xl sm:text-2xl font-bold font-serif text-[#007A85] dark:text-[#00D4E0]">5-Stage</div>
              <div className="text-[11px] text-[#7A6F87] dark:text-[#9D8DA6]">Vision Preprocessing</div>
            </div>
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#140F20]/60 border-[#271E36]' : 'bg-white/70 border-[#E8E2D6]'}`}>
              <div className="text-xl sm:text-2xl font-bold font-serif text-emerald-600 dark:text-emerald-400">Atlas + SQLite</div>
              <div className="text-[11px] text-[#7A6F87] dark:text-[#9D8DA6]">Dual Database Vault</div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================
          3. CENTRE PROJECT DESCRIPTION: TAMIL HANDWRITTEN RECOGNITION SYSTEM
          ======================================================== */}
      <section id="overview" className={`py-20 px-4 sm:px-6 lg:px-8 border-b transition-colors duration-200 ${isDark ? 'bg-[#0B0912] border-[#271E36]' : 'bg-[#F4EFE6] border-[#E5DECF]'}`}>
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#007A85] dark:text-[#00D4E0] bg-[#007A85]/10 dark:bg-[#007A85]/20 border border-[#007A85]/25 mb-4">
              ARCHIVAL COMPUTER VISION PLATFORM
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-[#181320] dark:text-white leading-tight mb-5">
              Tamil Handwritten Document Recognition System
            </h2>
            <p className="text-sm sm:text-base text-[#645A70] dark:text-[#A79BB3] leading-relaxed">
              An artificial-intelligence digitization infrastructure developed to transcribe, catalog, and safeguard centuries of physical Tamil archival records, revenue deeds, and historical manuscripts into accessible digital text.
            </p>
          </div>

          {/* Architectural Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Pillar 1: Archival Document Preservation */}
            <div className={`p-6 sm:p-7 rounded-2xl border transition-all ${isDark ? 'bg-[#150F22] border-[#2D2140] hover:border-[#007A85]/50' : 'bg-white border-[#E4DCD0] shadow-sm hover:border-[#007A85]'}`}>
              <div className="w-11 h-11 rounded-xl bg-[#007A85]/15 flex items-center justify-center text-[#007A85] dark:text-[#00D4E0] mb-5">
                <Archive className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#181320] dark:text-white mb-2.5">
                Digitizing Historical Government Records
              </h3>
              <p className="text-xs text-[#645A70] dark:text-[#A79BB3] leading-relaxed">
                Transforming centuries-old land registers, revenue documents, administrative gazettes, and district court deeds into permanently preserved, indexable digital repositories before physical parchment deteriorates.
              </p>
            </div>

            {/* Pillar 2: Handwritten Tamil OCR */}
            <div className={`p-6 sm:p-7 rounded-2xl border transition-all ${isDark ? 'bg-[#150F22] border-[#2D2140] hover:border-[#007A85]/50' : 'bg-white border-[#E4DCD0] shadow-sm hover:border-[#007A85]'}`}>
              <div className="w-11 h-11 rounded-xl bg-[#D97736]/15 flex items-center justify-center text-[#D97736] mb-5">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#181320] dark:text-white mb-2.5">
                Handwritten Tamil Script Processing
              </h3>
              <p className="text-xs text-[#645A70] dark:text-[#A79BB3] leading-relaxed">
                Overcomes the orthographic complexities of Tamil handwriting—including cursive variations, distinct character loops, non-linear modifiers, and historical ligatures—with specialized stroke analysis.
              </p>
            </div>

            {/* Pillar 3: Multi-Stage Image Preprocessing */}
            <div className={`p-6 sm:p-7 rounded-2xl border transition-all ${isDark ? 'bg-[#150F22] border-[#2D2140] hover:border-[#007A85]/50' : 'bg-white border-[#E4DCD0] shadow-sm hover:border-[#007A85]'}`}>
              <div className="w-11 h-11 rounded-xl bg-[#007A85]/15 flex items-center justify-center text-[#007A85] dark:text-[#00D4E0] mb-5">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#181320] dark:text-white mb-2.5">
                Advanced Image Preprocessing
              </h3>
              <p className="text-xs text-[#645A70] dark:text-[#A79BB3] leading-relaxed">
                Applies automated deskewing, Otsu binarization, morphological opening, Gaussian noise filtering, and illumination correction to restore ink fidelity on aged, discolored manuscripts.
              </p>
            </div>

            {/* Pillar 4: AI-Powered Recognition */}
            <div className={`p-6 sm:p-7 rounded-2xl border transition-all ${isDark ? 'bg-[#150F22] border-[#2D2140] hover:border-[#007A85]/50' : 'bg-white border-[#E4DCD0] shadow-sm hover:border-[#007A85]'}`}>
              <div className="w-11 h-11 rounded-xl bg-[#007A85]/15 flex items-center justify-center text-[#007A85] dark:text-[#00D4E0] mb-5">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#181320] dark:text-white mb-2.5">
                AI Character & Sequence Recognition
              </h3>
              <p className="text-xs text-[#645A70] dark:text-[#A79BB3] leading-relaxed">
                Deep neural vision models recognize individual Tamil vowels (உயிர்), consonants (மெய்), and compound syllables (உயிர்மெய்) with high discriminative capability across varied handwriting styles.
              </p>
            </div>

            {/* Pillar 5: Tamil Unicode Conversion */}
            <div className={`p-6 sm:p-7 rounded-2xl border transition-all ${isDark ? 'bg-[#150F22] border-[#2D2140] hover:border-[#007A85]/50' : 'bg-white border-[#E4DCD0] shadow-sm hover:border-[#007A85]'}`}>
              <div className="w-11 h-11 rounded-xl bg-[#D97736]/15 flex items-center justify-center text-[#D97736] mb-5">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#181320] dark:text-white mb-2.5">
                Standard Tamil Unicode (U+0B80–U+0BFF)
              </h3>
              <p className="text-xs text-[#645A70] dark:text-[#A79BB3] leading-relaxed">
                Raw character predictions are converted into modern standardized Tamil Unicode text, enabling instant copy-pasting, global search indexing, screen-reader accessibility, and database querying.
              </p>
            </div>

            {/* Pillar 6: Archival Database Persistence */}
            <div className={`p-6 sm:p-7 rounded-2xl border transition-all ${isDark ? 'bg-[#150F22] border-[#2D2140] hover:border-[#007A85]/50' : 'bg-white border-[#E4DCD0] shadow-sm hover:border-[#007A85]'}`}>
              <div className="w-11 h-11 rounded-xl bg-[#007A85]/15 flex items-center justify-center text-[#007A85] dark:text-[#00D4E0] mb-5">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#181320] dark:text-white mb-2.5">
                Digital Preservation & Export
              </h3>
              <p className="text-xs text-[#645A70] dark:text-[#A79BB3] leading-relaxed">
                Processed records are securely saved into cloud MongoDB Atlas collections with local SQLite resilience, complete with record provenance, timestamping, confidence ratings, and multi-format export.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================
          4. HOW IT WORKS SECTION (Step 1 to 5)
          ======================================================== */}
      <section id="how-it-works" className={`py-20 px-4 sm:px-6 lg:px-8 border-b transition-colors duration-200 ${isDark ? 'bg-[#0E0C14] border-[#271E36]' : 'bg-[#FAF9F5] border-[#E6E1D7]'}`}>
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#007A85] dark:text-[#00D4E0] bg-[#007A85]/10 dark:bg-[#007A85]/20 border border-[#007A85]/25 mb-4">
              STEP-BY-STEP WORKFLOW
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-[#181320] dark:text-white mb-4">
              How the TamilOCR Pipeline Operates
            </h2>
            <p className="text-xs sm:text-sm text-[#645A70] dark:text-[#A79BB3] leading-relaxed">
              From raw physical manuscript to searchable Tamil Unicode text in five straightforward stages.
            </p>
          </div>

          {/* 5-Step Progress Flow Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 relative">

            {/* Step 1 */}
            <div className={`p-5 rounded-2xl border flex flex-col justify-between ${isDark ? 'bg-[#140F20] border-[#2D2140]' : 'bg-white border-[#E6E0D4] shadow-xs'}`}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#007A85]/15 text-[#007A85] dark:text-[#00D4E0]">
                    STEP 01
                  </span>
                  <Upload className="w-4 h-4 text-[#007A85] dark:text-[#00D4E0]" />
                </div>
                <h3 className="text-sm font-bold text-[#181320] dark:text-white mb-2">
                  Upload Document
                </h3>
                <p className="text-[11px] text-[#645A70] dark:text-[#A79BB3] leading-relaxed">
                  Ingest scanned image files (JPG, PNG) or multi-page archival document records through the drag-and-drop upload portal.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 text-[10px] font-mono text-[#7A6F87]">
                Archival Scan Ingestion
              </div>
            </div>

            {/* Step 2 */}
            <div className={`p-5 rounded-2xl border flex flex-col justify-between ${isDark ? 'bg-[#140F20] border-[#2D2140]' : 'bg-white border-[#E6E0D4] shadow-xs'}`}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#007A85]/15 text-[#007A85] dark:text-[#00D4E0]">
                    STEP 02
                  </span>
                  <Sliders className="w-4 h-4 text-[#007A85] dark:text-[#00D4E0]" />
                </div>
                <h3 className="text-sm font-bold text-[#181320] dark:text-white mb-2">
                  Select OCR Model
                </h3>
                <p className="text-[11px] text-[#645A70] dark:text-[#A79BB3] leading-relaxed">
                  Choose between Tamil Handwritten CNN, Printed Tamil, or Hybrid recognition engines based on manuscript vintage.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 text-[10px] font-mono text-[#7A6F87]">
                Model Architecture Match
              </div>
            </div>

            {/* Step 3 */}
            <div className={`p-5 rounded-2xl border flex flex-col justify-between ${isDark ? 'bg-[#140F20] border-[#2D2140]' : 'bg-white border-[#E6E0D4] shadow-xs'}`}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#007A85]/15 text-[#007A85] dark:text-[#00D4E0]">
                    STEP 03
                  </span>
                  <RefreshCw className="w-4 h-4 text-[#007A85] dark:text-[#00D4E0]" />
                </div>
                <h3 className="text-sm font-bold text-[#181320] dark:text-white mb-2">
                  Process Image
                </h3>
                <p className="text-[11px] text-[#645A70] dark:text-[#A79BB3] leading-relaxed">
                  Automated computer vision executes grayscale conversion, adaptive thresholding, deskewing, and character segmentation.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 text-[10px] font-mono text-[#7A6F87]">
                Vision Preprocessing
              </div>
            </div>

            {/* Step 4 */}
            <div className={`p-5 rounded-2xl border flex flex-col justify-between ${isDark ? 'bg-[#140F20] border-[#2D2140]' : 'bg-white border-[#E6E0D4] shadow-xs'}`}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#007A85]/15 text-[#007A85] dark:text-[#00D4E0]">
                    STEP 04
                  </span>
                  <FileCheck className="w-4 h-4 text-[#007A85] dark:text-[#00D4E0]" />
                </div>
                <h3 className="text-sm font-bold text-[#181320] dark:text-white mb-2">
                  Review Tamil Text
                </h3>
                <p className="text-[11px] text-[#645A70] dark:text-[#A79BB3] leading-relaxed">
                  Inspect recognized Tamil characters side-by-side with original document bounding boxes and apply manual corrections.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 text-[10px] font-mono text-[#7A6F87]">
                Side-by-Side Verification
              </div>
            </div>

            {/* Step 5 */}
            <div className={`p-5 rounded-2xl border flex flex-col justify-between ${isDark ? 'bg-[#140F20] border-[#2D2140]' : 'bg-white border-[#E6E0D4] shadow-xs'}`}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#007A85]/15 text-[#007A85] dark:text-[#00D4E0]">
                    STEP 05
                  </span>
                  <Download className="w-4 h-4 text-[#007A85] dark:text-[#00D4E0]" />
                </div>
                <h3 className="text-sm font-bold text-[#181320] dark:text-white mb-2">
                  Copy, Save or Export
                </h3>
                <p className="text-[11px] text-[#645A70] dark:text-[#A79BB3] leading-relaxed">
                  Copy extracted Unicode text, persist into the Digital Archives archive, or export as structured records for administrative workflows.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 text-[10px] font-mono text-[#7A6F87]">
                Archive Preservation
              </div>
            </div>

          </div>

          {/* Quick CTA to Form */}
          <div className="mt-12 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#007A85] hover:bg-[#006C76] text-white font-semibold text-xs shadow-md shadow-[#007A85]/20 cursor-pointer transition-all"
            >
              <span>Sign In to Launch Recognition Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </section>

      {/* ========================================================
          5. KEY FEATURES SECTION
          ======================================================== */}
      <section id="features" className={`py-20 px-4 sm:px-6 lg:px-8 border-b transition-colors duration-200 ${isDark ? 'bg-[#0B0912] border-[#271E36]' : 'bg-[#F4EFE6] border-[#E5DECF]'}`}>
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#007A85] dark:text-[#00D4E0] bg-[#007A85]/10 dark:bg-[#007A85]/20 border border-[#007A85]/25 mb-4">
              SYSTEM CAPABILITIES
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-[#181320] dark:text-white mb-4">
              Engineered for Archival Rigor
            </h2>
            <p className="text-xs sm:text-sm text-[#645A70] dark:text-[#A79BB3] leading-relaxed">
              Built with purpose-driven features specifically designed to handle the nuances of Tamil epigraphy, aged ink, and digital administrative records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#150F22] border-[#2D2140]' : 'bg-white border-[#E6E0D4]'}`}>
              <div className="w-10 h-10 rounded-xl bg-[#007A85]/15 flex items-center justify-center text-[#007A85] dark:text-[#00D4E0] mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#181320] dark:text-white mb-2">
                Tamil Unicode Compliance
              </h3>
              <p className="text-xs text-[#645A70] dark:text-[#A79BB3] leading-relaxed">
                Full fidelity with Unicode 15.0 Tamil block (U+0B80–U+0BFF), preserving vowel signs, pulli marks, grantha characters, and traditional digits.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#150F22] border-[#2D2140]' : 'bg-white border-[#E6E0D4]'}`}>
              <div className="w-10 h-10 rounded-xl bg-[#007A85]/15 flex items-center justify-center text-[#007A85] dark:text-[#00D4E0] mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#181320] dark:text-white mb-2">
                Multi-Stage Preprocessing
              </h3>
              <p className="text-xs text-[#645A70] dark:text-[#A79BB3] leading-relaxed">
                Adaptive thresholding and morphological filters strip away scan artifacts, paper creases, and bleed-through shadows from the reverse page.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#150F22] border-[#2D2140]' : 'bg-white border-[#E6E0D4]'}`}>
              <div className="w-10 h-10 rounded-xl bg-[#007A85]/15 flex items-center justify-center text-[#007A85] dark:text-[#00D4E0] mb-4">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#181320] dark:text-white mb-2">
                Side-by-Side Review Workspace
              </h3>
              <p className="text-xs text-[#645A70] dark:text-[#A79BB3] leading-relaxed">
                Archivists can pan and zoom high-res scans alongside editable recognized text, ensuring zero transcription errors before official preservation.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#150F22] border-[#2D2140]' : 'bg-white border-[#E6E0D4]'}`}>
              <div className="w-10 h-10 rounded-xl bg-[#007A85]/15 flex items-center justify-center text-[#007A85] dark:text-[#00D4E0] mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#181320] dark:text-white mb-2">
                Dual Database Architecture
              </h3>
              <p className="text-xs text-[#645A70] dark:text-[#A79BB3] leading-relaxed">
                Active synchronization with MongoDB Atlas for enterprise archive management, accompanied by zero-configuration local SQLite failover.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#150F22] border-[#2D2140]' : 'bg-white border-[#E6E0D4]'}`}>
              <div className="w-10 h-10 rounded-xl bg-[#007A85]/15 flex items-center justify-center text-[#007A85] dark:text-[#00D4E0] mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#181320] dark:text-white mb-2">
                Role-Based Archival Security
              </h3>
              <p className="text-xs text-[#645A70] dark:text-[#A79BB3] leading-relaxed">
                Salted PBKDF2 cryptography protects user credentials, accompanied by immutable audit timestamps for every digitization and edit event.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#150F22] border-[#2D2140]' : 'bg-white border-[#E6E0D4]'}`}>
              <div className="w-10 h-10 rounded-xl bg-[#007A85]/15 flex items-center justify-center text-[#007A85] dark:text-[#00D4E0] mb-4">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#181320] dark:text-white mb-2">
                Full-Text Search & Cataloging
              </h3>
              <p className="text-xs text-[#645A70] dark:text-[#A79BB3] leading-relaxed">
                All digitized records become immediately searchable by keywords, document title, date stamp, or department classification.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================
          6. WHO CAN USE THIS PLATFORM?
          ======================================================== */}
      <section id="beneficiaries" className={`py-20 px-4 sm:px-6 lg:px-8 border-b transition-colors duration-200 ${isDark ? 'bg-[#0E0C14] border-[#271E36]' : 'bg-[#FAF9F5] border-[#E6E1D7]'}`}>
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#007A85] dark:text-[#00D4E0] bg-[#007A85]/10 dark:bg-[#007A85]/20 border border-[#007A85]/25 mb-4">
              USER ROLES & STAKEHOLDERS
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-[#181320] dark:text-white mb-4">
              Who Can Use This Platform?
            </h2>
            <p className="text-xs sm:text-sm text-[#645A70] dark:text-[#A79BB3] leading-relaxed">
              Designed for institutional workflows, scholarly exploration, and historical document stewardship.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            <div className={`p-6 rounded-2xl border flex gap-4 ${isDark ? 'bg-[#140F20] border-[#2D2140]' : 'bg-white border-[#E6E0D4] shadow-xs'}`}>
              <div className="w-12 h-12 rounded-2xl bg-[#007A85]/15 flex items-center justify-center text-[#007A85] dark:text-[#00D4E0] shrink-0">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#181320] dark:text-white mb-1.5">
                  Government & Archival Departments
                </h3>
                <p className="text-xs text-[#645A70] dark:text-[#A79BB3] leading-relaxed">
                  Revenue officers, survey registrars, and government archive curators digitizing century-old taluk records, land deeds, and administrative decrees for fast retrieval.
                </p>
              </div>
            </div>

            <div className={`p-6 rounded-2xl border flex gap-4 ${isDark ? 'bg-[#140F20] border-[#2D2140]' : 'bg-white border-[#E6E0D4] shadow-xs'}`}>
              <div className="w-12 h-12 rounded-2xl bg-[#D97736]/15 flex items-center justify-center text-[#D97736] shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#181320] dark:text-white mb-1.5">
                  Manuscript Libraries & Conservators
                </h3>
                <p className="text-xs text-[#645A70] dark:text-[#A79BB3] leading-relaxed">
                  Specialists at oriental research institutes, university libraries, and private collections preserving palm-leaf manuscripts and early Tamil printed gazettes.
                </p>
              </div>
            </div>

            <div className={`p-6 rounded-2xl border flex gap-4 ${isDark ? 'bg-[#140F20] border-[#2D2140]' : 'bg-white border-[#E6E0D4] shadow-xs'}`}>
              <div className="w-12 h-12 rounded-2xl bg-[#007A85]/15 flex items-center justify-center text-[#007A85] dark:text-[#00D4E0] shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#181320] dark:text-white mb-1.5">
                  Tamil Linguists & Researchers
                </h3>
                <p className="text-xs text-[#645A70] dark:text-[#A79BB3] leading-relaxed">
                  Epigraphists and philologists studying historical orthography, dialect evolution, and regional handwriting patterns across different centuries and scribal schools.
                </p>
              </div>
            </div>

            <div className={`p-6 rounded-2xl border flex gap-4 ${isDark ? 'bg-[#140F20] border-[#2D2140]' : 'bg-white border-[#E6E0D4] shadow-xs'}`}>
              <div className="w-12 h-12 rounded-2xl bg-[#D97736]/15 flex items-center justify-center text-[#D97736] shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#181320] dark:text-white mb-1.5">
                  Legal & Historical Record Analysts
                </h3>
                <p className="text-xs text-[#645A70] dark:text-[#A79BB3] leading-relaxed">
                  Professionals reviewing historical property ownership chains, gazette notices, and lineage documents that require verifiable text extraction.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================
          7. BENEFITS FOR HISTORICAL ARCHIVES
          ======================================================== */}
      <section id="benefits" className={`py-20 px-4 sm:px-6 lg:px-8 border-b transition-colors duration-200 ${isDark ? 'bg-[#0B0912] border-[#271E36]' : 'bg-[#F4EFE6] border-[#E5DECF]'}`}>
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#007A85] dark:text-[#00D4E0] bg-[#007A85]/10 dark:bg-[#007A85]/20 border border-[#007A85]/25 mb-4">
              ARCHIVAL IMPACT
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-[#181320] dark:text-white mb-4">
              Benefits for Historical Archives
            </h2>
            <p className="text-xs sm:text-sm text-[#645A70] dark:text-[#A79BB3] leading-relaxed">
              Addressing the urgent challenge of physical document deterioration through automated digital preservation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#150F22] border-[#2D2140]' : 'bg-white border-[#E6E0D4]'}`}>
              <CheckCircle2 className="w-6 h-6 text-[#007A85] dark:text-[#00D4E0] mb-3" />
              <h4 className="text-sm font-bold text-[#181320] dark:text-white mb-1.5">
                Halts Information Loss
              </h4>
              <p className="text-xs text-[#645A70] dark:text-[#A79BB3] leading-relaxed">
                Captures legible text before ink fade, humidity, acid paper breakdown, or physical brittleness destroys original documents.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#150F22] border-[#2D2140]' : 'bg-white border-[#E6E0D4]'}`}>
              <CheckCircle2 className="w-6 h-6 text-[#007A85] dark:text-[#00D4E0] mb-3" />
              <h4 className="text-sm font-bold text-[#181320] dark:text-white mb-1.5">
                Instant Searchability
              </h4>
              <p className="text-xs text-[#645A70] dark:text-[#A79BB3] leading-relaxed">
                Eliminates hours of manual shelf browsing by allowing keyword searches across thousands of digitized pages in milliseconds.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#150F22] border-[#2D2140]' : 'bg-white border-[#E6E0D4]'}`}>
              <CheckCircle2 className="w-6 h-6 text-[#007A85] dark:text-[#00D4E0] mb-3" />
              <h4 className="text-sm font-bold text-[#181320] dark:text-white mb-1.5">
                Universal Accessibility
              </h4>
              <p className="text-xs text-[#645A70] dark:text-[#A79BB3] leading-relaxed">
                Standardized Unicode text works natively across modern web browsers, mobile operating systems, and screen-readers.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#150F22] border-[#2D2140]' : 'bg-white border-[#E6E0D4]'}`}>
              <CheckCircle2 className="w-6 h-6 text-[#007A85] dark:text-[#00D4E0] mb-3" />
              <h4 className="text-sm font-bold text-[#181320] dark:text-white mb-1.5">
                High Throughput
              </h4>
              <p className="text-xs text-[#645A70] dark:text-[#A79BB3] leading-relaxed">
                Accelerates preservation initiatives, allowing small archivist teams to process volumes that previously required manual typists.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================
          8. ABOUT THE PROJECT SECTION
          ======================================================== */}
      <section id="about" className={`py-20 px-4 sm:px-6 lg:px-8 border-b transition-colors duration-200 ${isDark ? 'bg-[#0E0C14] border-[#271E36]' : 'bg-[#FAF9F5] border-[#E6E1D7]'}`}>
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#007A85] dark:text-[#00D4E0] bg-[#007A85]/10 dark:bg-[#007A85]/20 border border-[#007A85]/25">
            ABOUT THE INITIATIVE
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-[#181320] dark:text-white">
            Dedicated to Tamil Linguistic & Archival Preservation
          </h2>
          <p className="text-xs sm:text-sm text-[#645A70] dark:text-[#A79BB3] leading-relaxed max-w-2xl mx-auto">
            TamilOCR is engineered as a production-ready web application uniting modern computer vision, optical character recognition research, and archival document standards. The project operates with honest, real-time capabilities—featuring actual neural model execution, secure credential hashing, and dual-database resilience.
          </p>

          <div className="pt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/login"
              className="px-6 py-3 rounded-xl bg-[#007A85] hover:bg-[#006C76] text-white font-semibold text-xs shadow-md shadow-[#007A85]/20 cursor-pointer transition-all inline-flex items-center gap-2"
            >
              <span>Sign In to Archive Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/register"
              className={`
                px-6 py-3 rounded-xl border font-semibold text-xs transition-all
                ${isDark
                  ? 'border-[#2D2140] text-[#D8CFE0] hover:bg-[#181224] hover:text-white'
                  : 'border-[#E0D9CD] text-[#332A3B] hover:bg-white shadow-xs'}
              `}
            >
              Request an Account
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================
          9. COMPREHENSIVE LANDING FOOTER
          ======================================================== */}
      <footer className={`py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200 ${isDark ? 'bg-[#09070E] text-[#8C7D98]' : 'bg-[#F2ECE0] text-[#5C5266]'}`}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-xs">
          
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#007A85] to-[#00A3B0] flex items-center justify-center text-white font-bold font-tamil text-base">
                அ
              </div>
              <span className="font-bold text-base text-[#181320] dark:text-white">TamilOCR</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#7A6F87] dark:text-[#A79BB3]">
              Government Archives Digitization & Handwritten Tamil Optical Character Recognition Portal.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#181320] dark:text-white text-xs uppercase tracking-wider mb-3">
              Navigation
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <button type="button" onClick={() => scrollToSection('overview')} className="hover:underline cursor-pointer">
                  System Overview
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('how-it-works')} className="hover:underline cursor-pointer">
                  How It Works
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('features')} className="hover:underline cursor-pointer">
                  Key Features
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('beneficiaries')} className="hover:underline cursor-pointer">
                  Target Beneficiaries
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[#181320] dark:text-white text-xs uppercase tracking-wider mb-3">
              Authentication & Access
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <Link to="/login" className="hover:underline">
                  Officer Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:underline">
                  Request an Account
                </Link>
              </li>
              <li>
                <Link to="/forgot-password" className="hover:underline">
                  Password Recovery
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[#181320] dark:text-white text-xs uppercase tracking-wider mb-3">
              Archival Standards
            </h4>
            <p className="text-[11px] leading-relaxed mb-3">
              Built in accordance with open Tamil Unicode character encoding specifications (U+0B80–U+0BFF).
            </p>
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#007A85] dark:text-[#00D4E0]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>MongoDB Atlas & SQLite Active</span>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] gap-2">
          <span>© 2026 TamilOCR Project · Directorate of Historical Archives & Digitization Portal</span>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-[#007A85] dark:text-[#00D4E0] hover:underline cursor-pointer font-semibold">
              Go to Sign In →
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
