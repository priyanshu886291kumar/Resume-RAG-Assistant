import { useState, useEffect, useCallback } from 'react';
import { UploadCloud, CheckCircle, XCircle, Loader2, Trash2, FileText, RefreshCw, Sparkles, File } from 'lucide-react';
import { uploadDocs, listDocuments, deleteDocument, generateSummary } from '../services/api';
import SummaryPanel from './SummaryPanel';

// Supported file extensions (must match the backend)
const SUPPORTED_EXTENSIONS = ['.pdf', '.md', '.csv', '.xlsx'];
const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'text/markdown',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

/** Return a colour class and short label for each doc type. */
function getDocTypeBadge(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const map = {
    pdf: { label: 'PDF', cls: 'bg-red-100 text-red-700' },
    md: { label: 'MD', cls: 'bg-blue-100 text-blue-700' },
    csv: { label: 'CSV', cls: 'bg-emerald-100 text-emerald-700' },
    xlsx: { label: 'XLSX', cls: 'bg-amber-100 text-amber-700' },
  };
  return map[ext] || { label: ext.toUpperCase(), cls: 'bg-slate-100 text-slate-600' };
}

// ── Toast component ──────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto transition-all
            ${t.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}
        >
          {t.type === 'success'
            ? <CheckCircle className="w-4 h-4 shrink-0" />
            : <XCircle className="w-4 h-4 shrink-0" />}
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ── Main Upload component ────────────────────────────────────────────────────
export default function Upload({ onUploadSuccess }) {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [deletingFile, setDeletingFile] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Summary state
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryData, setSummaryData] = useState(null);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  const fetchDocuments = useCallback(async () => {
    try {
      const data = await listDocuments();
      setDocuments(data.files || []);
    } catch {
      // silently ignore if server isn't ready
    }
  }, []);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    const valid = selected.filter((f) => {
      const ext = '.' + f.name.split('.').pop().toLowerCase();
      return SUPPORTED_EXTENSIONS.includes(ext) || SUPPORTED_MIME_TYPES.includes(f.type);
    });

    if (valid.length !== selected.length) {
      showToast(
        `Only PDF, Markdown, CSV, and Excel files are supported. ${selected.length - valid.length} file(s) skipped.`,
        'error'
      );
    }
    setFiles(valid);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      showToast('Please select at least one supported file to upload.', 'error');
      return;
    }
    setIsUploading(true);
    try {
      const result = await uploadDocs(files);
      setFiles([]);
      showToast(result.message || `${files.length} file(s) uploaded successfully!`, 'success');
      if (result.rejected?.length > 0) {
        showToast(`Skipped unsupported: ${result.rejected.join(', ')}`, 'error');
      }
      await fetchDocuments();
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to upload files.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (filename) => {
    setDeletingFile(filename);
    try {
      const result = await deleteDocument(filename);
      showToast(`"${filename}" deleted (${result.embeddings_removed} chunks removed).`, 'success');
      await fetchDocuments();
    } catch (error) {
      showToast(error.response?.data?.error || `Failed to delete "${filename}".`, 'error');
    } finally {
      setDeletingFile(null);
    }
  };

  const handleGenerateSummary = async () => {
    setIsSummarizing(true);
    setSummaryData(null);
    try {
      const data = await generateSummary(documents);
      setSummaryData(data);
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to generate summary.', 'error');
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <>
      <Toast toasts={toasts} />

      {/* Summary Modal */}
      {summaryData && (
        <SummaryPanel
          summary={summaryData.summary}
          files={summaryData.files}
          onClose={() => setSummaryData(null)}
        />
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4">
        {/* Title */}
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Knowledge Base</h2>
          <p className="text-sm text-slate-500 mt-1">
            Upload documents to train the assistant.
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Supported: PDF, Markdown (.md), CSV, Excel (.xlsx)
          </p>
        </div>

        {/* Drop Zone */}
        <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors group">
          <input
            type="file"
            multiple
            accept=".pdf,.md,.csv,.xlsx"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          <UploadCloud className="w-10 h-10 text-slate-400 mb-3 group-hover:text-brand-500 transition-colors" />
          <span className="text-sm font-medium text-slate-600 text-center">
            {files.length > 0 ? (
              <div className="flex flex-col items-center gap-1">
                <span className="text-brand-600 font-semibold">{files.length} file(s) selected:</span>
                <ul className="text-xs text-slate-500 max-h-24 overflow-y-auto w-full max-w-[220px]">
                  {files.map(f => (
                    <li key={f.name} className="truncate text-center" title={f.name}>
                      {f.name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <>
                <span className="text-brand-600 font-semibold hover:underline">Click to upload</span> or drag and drop
                <br />
                <span className="text-xs font-normal text-slate-400 mt-1 block">
                  PDF · Markdown · CSV · Excel
                </span>
              </>
            )}
          </span>
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={files.length === 0 || isUploading}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white font-medium rounded-lg transition-colors"
        >
          {isUploading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</>
          ) : (
            'Upload to Knowledge Base'
          )}
        </button>

        {/* ── Document List ── */}
        {documents.length > 0 && (
          <div className="mt-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-700">
                Uploaded Documents ({documents.length})
              </h3>
              <button
                onClick={fetchDocuments}
                className="text-slate-400 hover:text-brand-600 transition-colors"
                title="Refresh list"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <ul className="flex flex-col gap-2">
              {documents.map((doc) => {
                const badge = getDocTypeBadge(doc);
                return (
                  <li
                    key={doc}
                    className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  >
                    <File className="w-4 h-4 text-brand-500 shrink-0" />
                    <span className="flex-1 text-xs text-slate-700 truncate" title={doc}>
                      {doc}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badge.cls}`}>
                      {badge.label}
                    </span>
                    <button
                      onClick={() => handleDelete(doc)}
                      disabled={deletingFile === doc}
                      title={`Delete ${doc}`}
                      className="shrink-0 p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-colors"
                    >
                      {deletingFile === doc
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* ── Generate Summary Button ── */}
            <button
              onClick={handleGenerateSummary}
              disabled={isSummarizing}
              className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-violet-600 to-brand-600 hover:from-violet-700 hover:to-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-all shadow-sm"
            >
              {isSummarizing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating Summary...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate AI Summary</>
              )}
            </button>
          </div>
        )}

        {documents.length === 0 && !isUploading && (
          <p className="text-xs text-center text-slate-400">No documents uploaded yet.</p>
        )}
      </div>
    </>
  );
}
