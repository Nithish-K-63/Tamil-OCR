import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutGrid, 
  Upload, 
  ScanLine, 
  Archive, 
  History, 
  Settings, 
  LogOut,
  FolderArchive
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

import { fetchDashboardStats } from '../api/ocrApi';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [recordCount, setRecordCount] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true;
    fetchDashboardStats().then(data => {
      if (isMounted && data?.total_documents !== undefined) {
        setRecordCount(data.total_documents);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const navItems = [
    { path: '/', label: t('nav_dashboard', 'Dashboard'), icon: LayoutGrid },
    { path: '/upload', label: t('nav_upload', 'Upload Documents'), icon: Upload },
    { path: '/pipeline', label: t('nav_pipeline', 'OCR Processing'), icon: ScanLine },
    { path: '/records', label: t('nav_records', 'Digitized Records'), icon: Archive },
    { path: '/history', label: t('nav_history', 'History'), icon: History },
  ];

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-[#EFE9DC] dark:bg-[#160C1D] border-r border-[#DFD7C7] dark:border-[#261730] text-[#1A1523] dark:text-[#E5E0EE]
      `}>
        {/* Brand Header */}
        <div className="p-5 border-b border-[#DFD7C7] dark:border-white/10 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[#00737D] flex items-center justify-center text-white font-bold text-xl font-tamil shadow-md shadow-[#00737D]/20">
            அ
          </div>
          <div>
            <div className="flex items-center gap-0.5">
              <span className="font-bold text-lg tracking-tight text-[#1A1523] dark:text-white font-english">Tamil</span>
              <span className="font-bold text-lg tracking-tight text-[#F26522] font-english">OCR</span>
            </div>
            <p className="text-[9px] uppercase tracking-wider text-[#7A7185] dark:text-[#9D8DA6] font-medium font-english">
              {t('brand_subtitle', 'MANUSCRIPT INTELLIGENCE')}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-3 custom-scrollbar">
          {/* Section: WORKSPACE */}
          <div className="px-5 pt-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#7A7185] dark:text-[#7E6F89]">
            {t('nav_workspace', 'WORKSPACE')}
          </div>
          <div className="px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path === '/' && location.pathname === '/dashboard') ||
                (item.path === '/pipeline' && location.pathname === '/results');
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`
                    flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 group
                    ${isActive 
                      ? 'bg-[#DFD7C7] dark:bg-[#281B34] text-[#1A1523] dark:text-white border border-[#CDC3AF] dark:border-[#3D2B50] shadow-sm' 
                      : 'text-[#5A5066] dark:text-[#A698B2] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#1A1523] dark:hover:text-white'}
                  `}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#1A1523] dark:text-white' : 'text-[#5A5066] dark:text-[#A698B2] group-hover:text-[#1A1523] dark:group-hover:text-white'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F26522] shadow-[0_0_6px_#F26522]" />
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Section: PREFERENCES */}
          <div className="px-5 pt-6 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#7A7185] dark:text-[#7E6F89]">
            {t('nav_preferences', 'PREFERENCES')}
          </div>
          <div className="px-3 space-y-1">
            <NavLink
              to="/settings"
              onClick={onClose}
              className={`
                flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 group
                ${location.pathname === '/settings' 
                  ? 'bg-[#DFD7C7] dark:bg-[#281B34] text-[#1A1523] dark:text-white border border-[#CDC3AF] dark:border-[#3D2B50] shadow-sm' 
                  : 'text-[#5A5066] dark:text-[#A698B2] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#1A1523] dark:hover:text-white'}
              `}
            >
              <div className="flex items-center gap-3 truncate">
                <Settings className={`w-4 h-4 shrink-0 ${location.pathname === '/settings' ? 'text-[#1A1523] dark:text-white' : 'text-[#5A5066] dark:text-[#A698B2] group-hover:text-[#1A1523] dark:group-hover:text-white'}`} />
                <span className="truncate">{t('nav_settings', 'Settings')}</span>
              </div>
              {location.pathname === '/settings' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#F26522] shadow-[0_0_6px_#F26522]" />
              )}
            </NavLink>
          </div>
        </div>

        {/* Bottom Card: Preserving our past */}
        <div className="mx-3.5 mb-3 p-3 rounded-xl bg-[#E5DFD1] dark:bg-[#22162F] border border-[#D5CDBC] dark:border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#DCD4C4] dark:bg-[#2D1E3E] text-[#00737D] dark:text-[#C47745] flex items-center justify-center shrink-0">
            <FolderArchive className="w-4 h-4 text-[#00737D] dark:text-[#9D8DA6]" />
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-[#1A1523] dark:text-white truncate">{t('sidebar_past_title', 'Preserving our past')}</p>
            <p className="text-[10px] text-[#7A7185] dark:text-[#9D8DA6] truncate">
              {recordCount !== null ? `${recordCount.toLocaleString()} records digitized` : t('sidebar_past_sub', 'Records digitized')}
            </p>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-3.5 border-t border-[#DFD7C7] dark:border-white/10 bg-[#EFE9DC] dark:bg-[#160C1D] flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-9 h-9 rounded-full bg-[#BF573F] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              {user?.avatar || (user?.name ? user.name.slice(0, 2).toUpperCase() : (user?.email ? user.email.slice(0, 2).toUpperCase() : "NK"))}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-[#1A1523] dark:text-white truncate">
                {user?.name || user?.fullName || (user?.email ? user.email.split('@')[0] : "Officer")}
              </p>
              <p className="text-[10px] text-[#7A7185] dark:text-[#9D8DA6] truncate">{user?.role || t('role_admin', 'Project Administrator')}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title={t('btn_sign_out', 'Sign Out')}
            className="p-1.5 rounded-lg text-[#7A7185] hover:text-[#1A1523] hover:bg-black/5 dark:text-[#9D8DA6] dark:hover:text-white dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
