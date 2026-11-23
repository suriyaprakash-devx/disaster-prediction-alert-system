import React, { useState, useEffect } from 'react';
import { Bot, Play, CheckCircle2, XCircle, Clock, AlertTriangle, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
import { apiClient } from '../api/client';

interface AgentStep {
  id: string;
  step_number: number;
  node_name: string;
  status: string;
  details?: any;
}

interface AgentRun {
  id: string;
  workflow_name: string;
  status: string;
  input_data?: any;
  output_data?: any;
  steps: AgentStep[];
  requires_approval: boolean;
  approval_id?: string;
}

interface ApprovalItem {
  id: string;
  run_id?: string;
  title: string;
  action_type: string;
  payload: any;
  status: string;
  decision_reason?: string;
  created_at: string;
}

export const AgentsPage: React.FC = () => {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [amountInput, setAmountInput] = useState<number>(2500);
  const [workflowType, setWorkflowType] = useState('invoice_payment');
  const [isRunning, setIsRunning] = useState(false);

  const fetchData = async () => {
    try {
      const [runsData, approvalsData] = await Promise.all([
        apiClient<AgentRun[]>('/api/agents/runs'),
        apiClient<ApprovalItem[]>('/api/approvals')
      ]);
      setRuns(runsData);
      setApprovals(approvalsData);
    } catch (err) {
      console.error('Error fetching agent data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTriggerAgent = async () => {
    setIsRunning(true);
    try {
      await apiClient<AgentRun>('/api/agents/run', {
        method: 'POST',
        body: JSON.stringify({
          workflow_name: workflowType,
          input_data: {
            action_type: workflowType,
            amount: amountInput,
            recipient: 'Global Cloud Logistics Ltd',
            description: 'Automated infrastructure vendor disbursement'
          }
        })
      });
      await fetchData();
    } catch (err: any) {
      alert(`Agent run failed: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleDecision = async (approvalId: string, action: 'approve' | 'reject') => {
    try {
      await apiClient(`/api/approvals/${approvalId}/action`, {
        method: 'POST',
        body: JSON.stringify({
          action,
          reason: `Human operator verified policy compliance and chose to ${action}.`
        })
      });
      await fetchData();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          LangGraph Multi-Agent Orchestrator <Bot className="w-5 h-5 text-purple-600" />
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Autonomous state-machine execution with mandatory human approval gating for high-impact actions.
        </p>
      </div>

      {/* Trigger Workflow Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Dispatch Autonomous Business Agent</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Workflow Template</label>
            <select
              value={workflowType}
              onChange={(e) => setWorkflowType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white"
            >
              <option value="invoice_payment">Automated Vendor Payment</option>
              <option value="refund_issuance">Customer Refund Authorization</option>
              <option value="inventory_reorder">Automated Inventory Replenishment</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Transaction Value ($ USD) <span className="text-amber-600 font-bold text-[11px]">(Approval required if ≥ $1,000)</span>
            </label>
            <input
              type="number"
              value={amountInput}
              onChange={(e) => setAmountInput(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white font-mono"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleTriggerAgent}
              disabled={isRunning}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-semibold text-sm transition-all shadow-xs cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isRunning ? 'Orchestrating...' : 'Trigger Workflow'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Human Approval Queue (High Priority) */}
      {approvals.some((a) => a.status === 'pending') && (
        <div className="bg-amber-50/70 border border-amber-200 p-6 rounded-2xl space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-amber-800">
            <UserCheck className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Human-in-the-Loop Action Required</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approvals
              .filter((a) => a.status === 'pending')
              .map((appr) => (
                <div key={appr.id} className="bg-white p-5 rounded-xl border border-amber-200/80 flex flex-col justify-between gap-3 shadow-xs">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{appr.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Action: <span className="font-mono font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">{appr.action_type}</span> | Target: {appr.payload?.recipient || 'Enterprise Entity'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleDecision(appr.id, 'approve')}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Authorize
                    </button>
                    <button
                      onClick={() => handleDecision(appr.id, 'reject')}
                      className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Execution Runs History */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-900">LangGraph Execution Trace History</h3>
          <span className="text-xs text-slate-500 font-semibold">{runs.length} runs recorded</span>
        </div>

        <div className="divide-y divide-slate-100">
          {runs.map((run) => (
            <div key={run.id} className="p-5 space-y-3 hover:bg-slate-50/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{run.workflow_name}</span>
                  <span className="text-xs text-slate-400 font-mono">({run.id.slice(0, 8)})</span>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-bold border ${
                    run.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : run.status === 'paused_for_approval'
                      ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {run.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* State Machine Step Trace */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
                {run.steps.map((step) => (
                  <div key={step.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="font-mono text-[10px] font-bold text-slate-500">Node {step.step_number}</span>
                      <span className="text-[10px] text-emerald-600 font-bold">✓</span>
                    </div>
                    <p className="font-bold text-slate-800 capitalize">{step.node_name.replace(/_/g, ' ')}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
