import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AIAssistant from './AIAssistant';

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F2EB] dark:bg-[#120E17]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#007A85] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[#7A7185] dark:text-[#9D8DA6] font-medium">
            Verifying secure session...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Outlet />
      {/* Floating AI chatbot enabled exclusively for authenticated application pages */}
      <AIAssistant />
    </>
  );
};

export default ProtectedRoute;
