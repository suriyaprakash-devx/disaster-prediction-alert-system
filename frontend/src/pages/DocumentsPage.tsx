import React, { useState, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Clock, Trash2, ArrowUpRight } from 'lucide-react';
import { apiClient } from '../api/client';

interface DocumentItem {
  id: string;
  title: string;
  filename: string;
  file_type: string;
  file_size: number;
  status: string;
  created_at: string;
  metadata_json?: { chunk_count?: number; characters?: number };
}

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      const data = await apiClient<DocumentItem[]>('/api/documents');
      setDocuments(data);
    } catch (err: any) {
      console.error('Error fetching documents:', err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      await apiClient<DocumentItem>('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
      await fetchDocuments();
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Enterprise Document Vault</h2>
        <p className="text-sm text-slate-400 mt-1">
          Ingest PDF, DOCX, TXT, and CSV documents into semantic vector memory.
        </p>
      </div>

      {/* Upload Zone */}
      <div className="bg-slate-950 p-8 rounded-2xl border-2 border-dashed border-slate-800 hover:border-emerald-500/50 transition-colors text-center relative">
        <input
          type="file"
          accept=".pdf,.docx,.txt,.csv"
          onChange={handleFileUpload}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">
              {isUploading ? 'Extracting, chunking & indexing vectors...' : 'Click to upload or drag & drop files'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Supported: PDF, DOCX, TXT, CSV (Max 25MB)</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Documents List */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Indexed Knowledge Files</h3>
          <span className="text-xs bg-slate-900 text-slate-400 px-2.5 py-1 rounded-full border border-slate-800">
            {documents.length} files
          </span>
        </div>

        {documents.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No documents indexed yet. Upload an operational document or policy above.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {documents.map((doc) => (
              <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-900/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-emerald-400 border border-slate-800">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-200">{doc.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span className="uppercase font-mono text-[11px] text-emerald-400/80">{doc.file_type}</span>
                      <span>•</span>
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>•</span>
                      <span>{doc.metadata_json?.chunk_count || 1} chunks</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      doc.status === 'processed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {doc.status === 'processed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    <span className="capitalize">{doc.status}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
