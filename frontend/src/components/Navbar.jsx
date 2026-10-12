import React, { useState } from 'react';
import { 
  Menu, 
  Sun, 
  Moon, 
  Bell, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Navbar = ({ onMenuClick, title, subtitle }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const isDark = theme === 'dark';

  return (
    <header className={`
      sticky top-0 z-30 h-20 px-4 sm:px-8 flex items-center justify-between transition-colors duration-200 border-b
      ${isDark 
        ? 'bg-[#15101C] border-[#261E2E] text-[#F5F2EB]' 
        : 'bg-[#F5F2EB] border-[#E5DFD3] text-[#1A1523]'}
    `}>
      {/* Title & Subtitle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl text-gray-500 hover:text-current hover:bg-black/5 dark:hover:bg-white/5 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-baseline gap-2.5 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold font-serif tracking-tight">
            {title || t('page_dashboard_title', 'Dashboard')}
          </h1>
          <span className="text-amber-700/60 dark:text-amber-500/60 font-serif text-lg hidden sm:inline">—</span>
          {subtitle && (
            <p className="text-xs text-[#7A7185] dark:text-[#9D93A7] hidden sm:inline">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Language Switcher Pill */}
        <div className={`
          flex items-center p-0.5 rounded-lg border text-xs font-semibold
          ${isDark ? 'bg-[#1C1525] border-[#2C213A]' : 'bg-[#EAE4D7] border-[#DDD5C5]'}
        `}>
          <button
            onClick={() => setLanguage('EN')}
            className={`
              px-2.5 py-1 rounded-md transition-all cursor-pointer
              ${language === 'EN' 
                ? (isDark ? 'bg-[#2E1E3D] text-white shadow-xs' : 'bg-[#1E1529] text-white shadow-xs') 
                : (isDark ? 'text-[#8E8299] hover:text-white' : 'text-[#6D6477] hover:text-[#1E1529]')}
            `}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('TA')}
            className={`
              px-2.5 py-1 rounded-md font-tamil transition-all cursor-pointer
              ${language === 'TA' 
                ? (isDark ? 'bg-[#2E1E3D] text-white shadow-xs' : 'bg-[#1E1529] text-white shadow-xs') 
                : (isDark ? 'text-[#8E8299] hover:text-white' : 'text-[#6D6477] hover:text-[#1E1529]')}
            `}
          >
            தமிழ்
          </button>
        </div>

        {/* Theme Switcher Pill */}
        <button
          onClick={toggleTheme}
          className={`
            flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all cursor-pointer
            ${isDark 
              ? 'bg-[#1C1525] border-[#2C213A] text-[#D8CEE2] hover:bg-[#281D35]' 
              : 'bg-[#EAE4D7] border-[#DDD5C5] text-[#4A4154] hover:bg-[#E2DBCB]'}
          `}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
        >
          <Sun className={`w-3.5 h-3.5 ${!isDark ? 'text-amber-600 font-bold' : 'text-gray-400'}`} />
          <Moon className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400 font-bold' : 'text-gray-400'}`} />
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`
              p-2 rounded-lg border relative transition-all cursor-pointer
              ${isDark 
                ? 'bg-[#1C1525] border-[#2C213A] text-[#A79CB1] hover:text-white' 
                : 'bg-[#EAE4D7] border-[#DDD5C5] text-[#5D5467] hover:text-[#1A1523]'}
            `}
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#F26522]"></span>
          </button>

          {showNotifications && (
            <div className={`
              absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl border p-4 z-50 animate-in fade-in duration-150
              ${isDark ? 'bg-[#1F1729] border-[#312440] text-white' : 'bg-white border-[#E0D8C8] text-gray-800'}
            `}>
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-white/10">
                <h4 className="text-xs font-bold font-english">{t('notifications_title', 'Notifications')}</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00737D]/20 text-[#00737D] font-bold">{t('notifications_badge', '2 New')}</span>
              </div>
              <div className="py-2 space-y-2 max-h-60 overflow-y-auto">
                <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 flex gap-3 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-xs">{t('notif_batch_title', 'Batch complete')}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{t('notif_batch_desc', 'Batch #48 processed (14/14 documents verified)')}</p>
                    <span className="text-[9px] text-gray-400">{t('notif_batch_time', '10 mins ago')}</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 flex gap-3 text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-xs">{t('notif_review_title', 'Needs review')}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{t('notif_review_desc', 'Document TNOCR-0247 flagged for low confidence (87.2%)')}</p>
                    <span className="text-[9px] text-gray-400">{t('notif_review_time', '1 hour ago')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-0.5 rounded-full hover:opacity-90 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[#BF573F] text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {user?.avatar || "AK"}
            </div>
          </button>

          {showProfileMenu && (
            <div className={`
              absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl border p-3 z-50 animate-in fade-in duration-150
              ${isDark ? 'bg-[#1F1729] border-[#312440] text-white' : 'bg-white border-[#E0D8C8] text-gray-800'}
            `}>
              <div className="p-2 border-b border-gray-200 dark:border-white/10 mb-2">
                <p className="font-bold text-xs">{user?.name || "Arun Kumar"}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                <p className="text-[10px] text-[#00737D] font-semibold mt-1">{user?.role || t('role_admin', 'Project Administrator')}</p>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <span>{t('btn_sign_out', 'Sign Out')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
