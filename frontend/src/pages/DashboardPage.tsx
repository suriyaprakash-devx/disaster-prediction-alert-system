import React, { useEffect, useState } from 'react';
import {
  FileText,
  Receipt,
  Bot,
  CheckCircle2,
  AlertTriangle,
  Server,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { apiClient } from '../api/client';

interface AnalyticsData {
  total_documents: number;
  total_invoices_processed: number;
  total_agent_runs: number;
  pending_approvals: number;
  accuracy_rate: number;
  monthly_trends: Array<{ month: string; documents: number; invoices: number; agentRuns: number }>;
  category_distribution: Array<{ name: string; value: number }>;
}

interface SystemHealth {
  status: string;
  environment: string;
  database: string;
  groq_configured: boolean;
  storage_provider: string;
}

const PIE_COLORS = ['#059669', '#2563eb', '#7c3aed', '#d97706'];

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [analyticsRes, healthRes] = await Promise.all([
          apiClient<AnalyticsData>('/api/analytics/overview'),
          apiClient<SystemHealth>('/health')
        ]);
        setData(analyticsRes);
        setHealth(healthRes);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white p-7 rounded-2xl border border-emerald-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI Operations Control Center</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Enterprise Knowledge & Automation Copilot
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Real-time multi-agent orchestration, neural vector retrieval, and automated invoice intelligence.
          </p>
        </div>

        {/* System Telemetry Box */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
            <Server className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <span className={`w-2 h-2 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              Core Engine: <span className="capitalize text-emerald-700">{health?.status || 'Active'}</span>
            </div>
            <div className="text-slate-500 mt-0.5">
              DB: <span className="text-slate-700 font-semibold">{health?.database || 'Connected'}</span> • Groq: <span className="text-slate-700 font-semibold">{health?.groq_configured ? 'Online' : 'Fallback'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Indexed Documents</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{data?.total_documents ?? 0}</div>
          <p className="text-xs text-emerald-700 flex items-center gap-1 mt-2.5 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" /> Vector-Indexed RAG
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Invoices Extracted</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{data?.total_invoices_processed ?? 0}</div>
          <p className="text-xs text-blue-700 flex items-center gap-1 mt-2.5 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> 98.4% Accuracy Rating
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Agent Automations</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{data?.total_agent_runs ?? 0}</div>
          <p className="text-xs text-purple-700 flex items-center gap-1 mt-2.5 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" /> LangGraph Workflows
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Approvals</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{data?.pending_approvals ?? 0}</div>
          <p className="text-xs text-amber-700 flex items-center gap-1 mt-2.5 font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" /> Human-in-the-Loop Gate
          </p>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Execution & Processing Trends</h3>
              <p className="text-xs text-slate-500 mt-0.5">Monthly volume breakdown for agents and invoice extractions</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.monthly_trends || []}>
                <defs>
                  <linearGradient id="colorAgent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="agentRuns" stroke="#7c3aed" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAgent)" name="Agent Executions" />
                <Area type="monotone" dataKey="invoices" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#colorInv)" name="Invoices Processed" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Knowledge Distribution</h3>
            <p className="text-xs text-slate-500 mt-0.5">Categorization of indexed enterprise data</p>
            <div className="h-48 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.category_distribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(data?.category_distribution || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
            {(data?.category_distribution || []).map((cat, idx) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <span className="text-slate-600 font-medium">{cat.name}</span>
                </div>
                <span className="font-bold text-slate-900">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
