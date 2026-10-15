import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import AIAssistant from './components/AIAssistant';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import Dashboard from './pages/Dashboard';
import DocumentUpload from './pages/DocumentUpload';
import OCRProcessing from './pages/OCRProcessing';
import RecognitionResults from './pages/RecognitionResults';
import DigitizedRecords from './pages/DigitizedRecords';
import ProcessingHistory from './pages/ProcessingHistory';
import Settings from './pages/Settings';

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();

  const getPageTitle = (path) => {
    switch (path) {
      case '/': return { title: t('page_dashboard_title', 'Dashboard'), subtitle: t('page_dashboard_subtitle', 'Overview of your Tamil manuscript digitization workflow') };
      case '/upload': return { title: t('page_upload_title', 'Upload Documents'), subtitle: t('page_upload_subtitle', 'Add a handwritten record and prepare it for recognition') };
      case '/pipeline': return { title: t('page_pipeline_title', 'OCR Processing'), subtitle: t('page_pipeline_subtitle', 'Analyze and extract text from Tamil manuscripts') };
      case '/results': return { title: t('page_results_title', 'Recognition Results'), subtitle: t('page_results_subtitle', 'Review, edit and preserve recognized Tamil text') };
      case '/records': return { title: t('page_records_title', 'Digital Archive'), subtitle: t('page_records_subtitle', 'Search and manage preserved government records') };
      case '/history': return { title: t('page_history_title', 'Activity History'), subtitle: t('page_history_subtitle', 'Track recognition and record management activity') };
      case '/settings': return { title: t('page_settings_title', 'Settings'), subtitle: t('page_settings_subtitle', 'Configure recognition and archive preferences') };
      default: return { title: t('brand_title', 'TamilOCR'), subtitle: t('page_dashboard_subtitle', 'Overview of your Tamil manuscript digitization workflow') };
    }
  };

  const { title, subtitle } = getPageTitle(location.pathname);

  return (
    <div className="min-h-screen flex bg-[#F5F2EB] dark:bg-[#120E17] text-[#1A1523] dark:text-[#F5F2EB] font-english transition-colors">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 lg:ml-72">
        <Navbar 
          onMenuClick={() => setSidebarOpen(true)} 
          title={title} 
          subtitle={subtitle} 
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

import ErrorBoundary from './components/ErrorBoundary';

const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Protected Main App Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<MainLayout><Dashboard /></MainLayout>} />
                  <Route path="/upload" element={<MainLayout><DocumentUpload /></MainLayout>} />
                  <Route path="/pipeline" element={<MainLayout><OCRProcessing /></MainLayout>} />
                  <Route path="/results" element={<MainLayout><RecognitionResults /></MainLayout>} />
                  <Route path="/records" element={<MainLayout><DigitizedRecords /></MainLayout>} />
                  <Route path="/history" element={<MainLayout><ProcessingHistory /></MainLayout>} />
                  <Route path="/settings" element={<MainLayout><Settings /></MainLayout>} />
                </Route>
              </Routes>

              {/* Floating AI Assistant at bottom-right corner of every page */}
              <AIAssistant />
            </BrowserRouter>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;

