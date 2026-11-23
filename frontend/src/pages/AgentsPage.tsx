import React, { useState, useEffect } from 'react';
import { Bot, Play, CheckCircle2, XCircle, Clock, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';
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
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          LangGraph Multi-Agent Orchestrator <Bot className="w-5 h-5 text-purple-400" />
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Autonomous state-machine execution with mandatory human approval gating for high-impact actions.
        </p>
      </div>

      {/* Trigger Workflow Box */}
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
        <h3 className="text-sm font-semibold text-white mb-4">Dispatch Autonomous Business Agent</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Workflow Template</label>
            <select
              value={workflowType}
              onChange={(e) => setWorkflowType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="invoice_payment">Automated Vendor Payment</option>
              <option value="refund_issuance">Customer Refund Authorization</option>
              <option value="inventory_reorder">Automated Inventory Replenishment</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">
              Transaction Value ($ USD) <span className="text-amber-400 text-[11px]">(Approval required if ≥ $1,000)</span>
            </label>
            <input
              type="number"
              value={amountInput}
              onChange={(e) => setAmountInput(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleTriggerAgent}
              disabled={isRunning}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-medium text-sm transition-colors shadow-lg shadow-purple-600/20"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isRunning ? 'Orchestrating...' : 'Trigger Workflow'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Human Approval Queue (High Priority) */}
      {approvals.some((a) => a.status === 'pending') && (
        <div className="bg-amber-950/20 border border-amber-800/60 p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Human-in-the-Loop Action Required</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approvals
              .filter((a) => a.status === 'pending')
              .map((appr) => (
                <div key={appr.id} className="bg-slate-950 p-4 rounded-xl border border-amber-800/50 flex flex-col justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white">{appr.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Action: <span className="font-mono text-amber-400">{appr.action_type}</span> | Target: {appr.payload?.recipient || 'Enterprise Entity'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleDecision(appr.id, 'approve')}
                      className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Authorize
                    </button>
                    <button
                      onClick={() => handleDecision(appr.id, 'reject')}
                      className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
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
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">LangGraph Execution Runs</h3>
          <span className="text-xs text-slate-500">Live Agent Audit Trail</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {runs.map((run) => (
            <div key={run.id} className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-white">{run.workflow_name}</span>
                  <span className="text-xs text-slate-500 font-mono">({run.id.slice(0, 8)})</span>
                </div>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                    run.status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : run.status === 'paused_for_approval'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {run.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* State Machine Step Trace */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2">
                {run.steps.map((step) => (
                  <div key={step.id} className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="font-mono text-[10px]">Node {step.step_number}</span>
                      <span className="text-[10px] text-emerald-400">●</span>
                    </div>
                    <p className="font-semibold text-slate-200 capitalize">{step.node_name.replace(/_/g, ' ')}</p>
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
