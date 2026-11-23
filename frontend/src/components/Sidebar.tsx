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
    { to: '/', label: 'Overview Dashboard', icon: LayoutDashboard, badge: null },
    { to: '/knowledge', label: 'RAG Knowledge Copilot', icon: BrainCircuit, badge: 'AI' },
    { to: '/documents', label: 'Document Vault', icon: FileText, badge: null },
    { to: '/invoices', label: 'Invoice Intelligence', icon: Receipt, badge: 'OCR' },
    { to: '/agents', label: 'Agent Workflows', icon: Bot, badge: 'LangGraph' },
    { to: '/visual-search', label: 'Visual Product Search', icon: ImageIcon, badge: null },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30 shadow-[1px_0_4px_rgba(0,0,0,0.02)]">
      <div>
        {/* App Brand Header */}
        <div className="h-16 flex items-center px-5 gap-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/25">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-sm tracking-tight leading-tight">DesignOps AI</h1>
            <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Enterprise Copilot</span>
          </div>
        </div>

        {/* Section Label */}
        <div className="px-5 pt-5 pb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Platform Modules</span>
        </div>

        {/* Navigation Links */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-xs border border-emerald-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] bg-emerald-100/80 text-emerald-700 font-bold px-1.5 py-0.5 rounded-md">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User / Sign Out Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/70 m-3 rounded-2xl border border-slate-200/80">
        <div className="flex items-center justify-between mb-3">
          <div className="overflow-hidden pr-2">
            <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name || 'Enterprise Operator'}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email || 'admin@designops.ai'}</p>
          </div>
          <span className="text-[10px] bg-white text-emerald-700 px-2 py-0.5 rounded-full border border-slate-200 font-semibold shadow-xs">
            {user?.role || 'admin'}
          </span>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 bg-white transition-all shadow-xs cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
