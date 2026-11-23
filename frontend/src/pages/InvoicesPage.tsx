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
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          Invoice Intelligence & OCR <Sparkles className="w-5 h-5 text-emerald-600" />
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Automated multi-field extraction with confidence ratings and line-item reconciliation.
        </p>
      </div>

      {/* Input Options (Upload or Paste) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex gap-4 border-b border-slate-100 pb-3 mb-5">
          <button
            onClick={() => setActiveTab('upload')}
            className={`text-sm font-semibold pb-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Upload Invoice (PDF / Image)
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`text-sm font-semibold pb-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'text'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Paste Invoice Text
          </button>
        </div>

        {activeTab === 'upload' ? (
          <div className="p-7 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 rounded-xl text-center relative transition-all shadow-xs">
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              disabled={isExtracting}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <UploadCloud className="w-8 h-8 text-emerald-600" />
              <p className="text-sm font-bold text-slate-800">
                {isExtracting ? 'Extracting with Groq Vision / LLM...' : 'Drop invoice PDF or image here'}
              </p>
              <p className="text-xs text-slate-500">Auto-detects invoice number, vendor, totals, and line items</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              rows={4}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste raw OCR or invoice text here... e.g. 'Invoice #INV-9823 from CloudTech Inc. Total: $4,500.00...'"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
            <button
              onClick={handleTextExtract}
              disabled={!rawText.trim() || isExtracting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              {isExtracting ? 'Analyzing...' : 'Extract Fields'}
            </button>
          </div>
        )}
      </div>

      {/* Split View: List on left, Selected detail on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoices List */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-2">Processed Invoices</h3>
          <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                onClick={() => setSelectedInvoice(inv)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedInvoice?.id === inv.id
                    ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                    : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{inv.invoice_number}</span>
                  <span className="text-emerald-700 font-mono text-xs font-bold">
                    ${inv.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-1">{inv.vendor_name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Invoice Details */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-6 space-y-6 shadow-xs">
          {selectedInvoice ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedInvoice.invoice_number}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedInvoice.vendor_name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-50 text-emerald-800 text-xs px-3 py-1 rounded-full border border-emerald-200 font-bold">
                    {(selectedInvoice.confidence_score * 100).toFixed(0)}% Confidence Score
                  </span>
                </div>
              </div>

              {/* Amounts Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 uppercase font-semibold">Subtotal</span>
                  <p className="text-base font-bold text-slate-800 mt-1">
                    ${selectedInvoice.subtotal.toFixed(2)}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 uppercase font-semibold">Tax</span>
                  <p className="text-base font-bold text-slate-800 mt-1">
                    ${selectedInvoice.tax_amount.toFixed(2)}
                  </p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                  <span className="text-[11px] text-emerald-800 uppercase font-bold">Total Amount</span>
                  <p className="text-base font-bold text-emerald-700 mt-1">
                    ${selectedInvoice.total_amount.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Extracted Line Items</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Description</th>
                        <th className="p-3 text-right">Qty</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedInvoice.items?.map((item) => (
                        <tr key={item.id} className="text-slate-700 hover:bg-slate-50/50">
                          <td className="p-3 font-medium">{item.description}</td>
                          <td className="p-3 text-right font-mono">{item.quantity}</td>
                          <td className="p-3 text-right font-mono">${item.unit_price.toFixed(2)}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">${item.total_price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              Select or extract an invoice to view structured fields.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
