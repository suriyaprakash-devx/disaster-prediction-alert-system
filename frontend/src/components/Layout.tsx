import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { ShieldCheck, Activity, Bell } from 'lucide-react';

export const Layout: React.FC = () => {
  const { token, isLoading } = useAuth();
  const location = useLocation();
  const [health, setHealth] = useState<{ status: string; environment: string } | null>(null);

  useEffect(() => {
    apiClient<{ status: string; environment: string }>('/health')
      .then(setHealth)
      .catch(() => setHealth({ status: 'offline', environment: 'production' }));
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 text-emerald-600">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Authenticating session...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/':
        return 'Overview Dashboard';
      case '/knowledge':
        return 'Enterprise RAG Knowledge Copilot';
      case '/documents':
        return 'Document Processing Vault';
      case '/invoices':
        return 'Invoice Intelligence & OCR';
      case '/agents':
        return 'LangGraph Agent Orchestration';
      case '/visual-search':
        return 'Visual Product Search & Similarity';
      default:
        return 'Enterprise Workspace';
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200/90 px-8 flex items-center justify-between sticky top-0 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">DesignOps AI</span>
            <span className="text-slate-300">/</span>
            <h2 className="text-sm font-bold text-slate-800">{getPageTitle(location.pathname)}</h2>
          </div>

          <div className="flex items-center gap-4">
            {/* System Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium">
              <span
                className={`w-2 h-2 rounded-full ${
                  health?.status === 'healthy' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="text-slate-600 font-medium">API:</span>
              <span className="text-slate-900 font-semibold capitalize">{health?.status || 'Online'}</span>
            </div>

            {/* Notification Icon */}
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors cursor-pointer">
              <Bell className="w-4 h-4" />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
