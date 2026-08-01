import { useState, useEffect, useCallback } from 'react';
import { UploadCloud, CheckCircle, XCircle, Loader2, Trash2, FileText, RefreshCw, Sparkles } from 'lucide-react';
import { uploadPdfs, listDocuments, deleteDocument, generateSummary } from '../services/api';
import SummaryPanel from './SummaryPanel';

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
  const [summaryData, setSummaryData] = useState(null); // { summary, files }

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  const fetchDocuments = useCallback(async () => {
    try {
      const data = await listDocuments();
      setDocuments(data.files || []);
    } catch {
      // silently ignore if server isn't ready
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    try {
      await uploadPdfs(files);
      setFiles([]);
      showToast(`${files.length} file(s) uploaded successfully!`, 'success');
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
      const data = await generateSummary(documents); // summarize all uploaded docs
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
          <p className="text-sm text-slate-500 mt-1">Upload PDFs to train the assistant.</p>
        </div>

        {/* Drop Zone */}
        <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors group">
          <input
            type="file"
            multiple
            accept=".pdf"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          <UploadCloud className="w-10 h-10 text-slate-400 mb-3 group-hover:text-brand-500 transition-colors" />
          <span className="text-sm font-medium text-slate-600 text-center">
            {files.length > 0 ? (
              <span className="text-brand-600 font-semibold">{files.length} file(s) selected</span>
            ) : (
              <>
                <span className="text-brand-600 font-semibold hover:underline">Click to upload</span> or drag and drop
                <br />
                <span className="text-xs font-normal text-slate-400 mt-1 block">PDFs only</span>
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
            'Upload to Database'
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
              {documents.map((doc) => (
                <li
                  key={doc}
                  className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                >
                  <FileText className="w-4 h-4 text-brand-500 shrink-0" />
                  <span className="flex-1 text-xs text-slate-700 truncate" title={doc}>
                    {doc}
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
              ))}
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
