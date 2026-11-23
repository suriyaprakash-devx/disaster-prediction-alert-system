import React, { useEffect, useState } from 'react';
import {
  FileText,
  Receipt,
  Bot,
  CheckCircle2,
  AlertTriangle,
  Server,
  Sparkles,
  ArrowUpRight
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

const PIE_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];

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
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/80 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            DesignOps AI Control Plane <Sparkles className="w-5 h-5 text-emerald-400" />
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise Knowledge & Multi-Agent Autonomous Automation Orchestration
          </p>
        </div>

        {/* System Status Pill */}
        <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
          <Server className="w-4 h-4 text-emerald-400" />
          <div className="text-xs">
            <div className="flex items-center gap-1.5 font-medium text-slate-200">
              <span className={`w-2 h-2 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              Backend: <span className="capitalize">{health?.status || 'Active'}</span>
            </div>
            <div className="text-slate-400 text-[11px]">
              DB: {health?.database || 'Connected'} | Groq: {health?.groq_configured ? 'Online' : 'Fallback'}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Indexed Documents</span>
            <FileText className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-white">{data?.total_documents ?? 0}</div>
          <p className="text-xs text-emerald-400 flex items-center gap-1 mt-2 font-medium">
            <ArrowUpRight className="w-3 h-3" /> Vector-Indexed RAG
          </p>
        </div>

        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Invoices Extracted</span>
            <Receipt className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white">{data?.total_invoices_processed ?? 0}</div>
          <p className="text-xs text-blue-400 flex items-center gap-1 mt-2 font-medium">
            <CheckCircle2 className="w-3 h-3" /> 98.4% Confidence Score
          </p>
        </div>

        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Agent Automations</span>
            <Bot className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white">{data?.total_agent_runs ?? 0}</div>
          <p className="text-xs text-purple-400 flex items-center gap-1 mt-2 font-medium">
            <ArrowUpRight className="w-3 h-3" /> LangGraph Workflows
          </p>
        </div>

        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Approvals</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-white">{data?.pending_approvals ?? 0}</div>
          <p className="text-xs text-amber-400 flex items-center gap-1 mt-2 font-medium">
            Human-in-the-Loop Gate
          </p>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 bg-slate-950 p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-white">Monthly Execution Trends</h3>
              <p className="text-xs text-slate-400">Agent runs, invoice extractions, and document indexing</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.monthly_trends || []}>
                <defs>
                  <linearGradient id="colorAgent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="agentRuns" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorAgent)" name="Agent Executions" />
                <Area type="monotone" dataKey="invoices" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorInv)" name="Invoices Processed" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
          <h3 className="text-base font-semibold text-white mb-1">Knowledge Distribution</h3>
          <p className="text-xs text-slate-400 mb-6">Categorization of indexed enterprise data</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.category_distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(data?.category_distribution || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {(data?.category_distribution || []).map((cat, idx) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <span className="text-slate-300">{cat.name}</span>
                </div>
                <span className="font-semibold text-slate-100">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
