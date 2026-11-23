import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BrainCircuit,
  FileText,
  Receipt,
  Bot,
  Image as ImageIcon,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/knowledge', label: 'RAG Knowledge Base', icon: BrainCircuit },
    { to: '/documents', label: 'Document Vault', icon: FileText },
    { to: '/invoices', label: 'Invoice Intelligence', icon: Receipt },
    { to: '/agents', label: 'Agent Workflows', icon: Bot },
    { to: '/visual-search', label: 'Visual Product Search', icon: ImageIcon },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* App Logo / Header */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-sm tracking-tight leading-none">DesignOps AI</h1>
            <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">Enterprise Copilot</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User / Sign Out Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/50">
        <div className="flex items-center justify-between mb-3">
          <div className="overflow-hidden pr-2">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.full_name || 'Enterprise User'}</p>
            <p className="text-[11px] text-slate-400 truncate">{user?.email || 'authenticated'}</p>
          </div>
          <span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded border border-slate-700 font-mono">
            {user?.role || 'member'}
          </span>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/30 border border-slate-800 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
