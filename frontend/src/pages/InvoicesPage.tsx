import React, { useState, useEffect } from 'react';
import { Receipt, UploadCloud, CheckCircle2, DollarSign, Calendar, Building, Sparkles } from 'lucide-react';
import { apiClient } from '../api/client';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  vendor_name: string;
  invoice_date?: string;
  due_date?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: string;
  confidence_score: number;
  items: InvoiceItem[];
  created_at: string;
}

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [rawText, setRawText] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');

  const fetchInvoices = async () => {
    try {
      const data = await apiClient<Invoice[]>('/api/invoices');
      setInvoices(data);
      if (data.length > 0 && !selectedInvoice) {
        setSelectedInvoice(data[0]);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const inv = await apiClient<Invoice>('/api/invoices/extract', {
        method: 'POST',
        body: formData,
      });
      setSelectedInvoice(inv);
      await fetchInvoices();
    } catch (err: any) {
      alert(`Extraction failed: ${err.message}`);
    } finally {
      setIsExtracting(false);
      e.target.value = '';
    }
  };

  const handleTextExtract = async () => {
    if (!rawText.trim()) return;

    setIsExtracting(true);
    const formData = new FormData();
    formData.append('raw_text', rawText);

    try {
      const inv = await apiClient<Invoice>('/api/invoices/extract', {
        method: 'POST',
        body: formData,
      });
      setSelectedInvoice(inv);
      setRawText('');
      await fetchInvoices();
    } catch (err: any) {
      alert(`Extraction failed: ${err.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Invoice Intelligence & OCR <Sparkles className="w-5 h-5 text-emerald-400" />
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Automated multi-field extraction with confidence ratings and line-item breakdown.
        </p>
      </div>

      {/* Input Options (Upload or Paste) */}
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
        <div className="flex gap-4 border-b border-slate-800 pb-4 mb-5">
          <button
            onClick={() => setActiveTab('upload')}
            className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Upload Invoice File (PDF / Image)
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
              activeTab === 'text'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Paste Invoice Text
          </button>
        </div>

        {activeTab === 'upload' ? (
          <div className="p-6 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-xl text-center relative transition-colors">
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              disabled={isExtracting}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <UploadCloud className="w-8 h-8 text-emerald-400" />
              <p className="text-sm font-medium text-slate-200">
                {isExtracting ? 'Extracting with Groq Vision / LLM...' : 'Drop invoice PDF or image here'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              rows={4}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste raw OCR or invoice text here... e.g. 'Invoice #INV-9823 from CloudTech Inc. Total: $4,500.00...'"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleTextExtract}
              disabled={!rawText.trim() || isExtracting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {isExtracting ? 'Analyzing...' : 'Extract Fields'}
            </button>
          </div>
        )}
      </div>

      {/* Split View: List on left, Selected detail on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoices List */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white mb-2">Processed Invoices</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                onClick={() => setSelectedInvoice(inv)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-colors ${
                  selectedInvoice?.id === inv.id
                    ? 'bg-emerald-500/10 border-emerald-500/40'
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-white">{inv.invoice_number}</span>
                  <span className="text-emerald-400 font-mono text-xs font-bold">
                    ${inv.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate mt-1">{inv.vendor_name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Invoice Details */}
        <div className="lg:col-span-2 bg-slate-950 rounded-2xl border border-slate-800 p-6 space-y-6">
          {selectedInvoice ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedInvoice.invoice_number}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span>{selectedInvoice.vendor_name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1 rounded-full border border-emerald-500/20 font-medium">
                    {(selectedInvoice.confidence_score * 100).toFixed(0)}% Confidence
                  </span>
                </div>
              </div>

              {/* Amounts Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase">Subtotal</span>
                  <p className="text-base font-bold text-slate-200 mt-1">
                    ${selectedInvoice.subtotal.toFixed(2)}
                  </p>
                </div>
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase">Tax</span>
                  <p className="text-base font-bold text-slate-200 mt-1">
                    ${selectedInvoice.tax_amount.toFixed(2)}
                  </p>
                </div>
                <div className="bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/30">
                  <span className="text-[11px] text-emerald-400 uppercase font-semibold">Total Amount</span>
                  <p className="text-base font-bold text-emerald-400 mt-1">
                    ${selectedInvoice.total_amount.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Extracted Line Items</h4>
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3">Description</th>
                        <th className="p-3 text-right">Qty</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {selectedInvoice.items?.map((item) => (
                        <tr key={item.id} className="text-slate-300">
                          <td className="p-3">{item.description}</td>
                          <td className="p-3 text-right font-mono">{item.quantity}</td>
                          <td className="p-3 text-right font-mono">${item.unit_price.toFixed(2)}</td>
                          <td className="p-3 text-right font-mono font-semibold text-white">${item.total_price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
              Select or extract an invoice to view structured fields.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
