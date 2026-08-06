import { useState } from 'react';
import { ClipboardList, Loader2, ChevronDown, ChevronUp, CheckCircle, XCircle, AlertTriangle, FileText, BarChart2 } from 'lucide-react';
import { runEvaluation } from '../services/api';

/** Colour-code the similarity score badge */
function ScoreBadge({ score }) {
  if (score === null || score === undefined) return null;
  const cls =
    score < 0.5
      ? 'bg-emerald-100 text-emerald-700'
      : score < 1.0
      ? 'bg-amber-100 text-amber-700'
      : 'bg-rose-100 text-rose-700';
  const label =
    score < 0.5 ? 'High' : score < 1.0 ? 'Medium' : 'Low';
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      <BarChart2 className="w-3 h-3" />
      {label} ({score.toFixed(3)})
    </span>
  );
}

/** Single evaluation result card */
function EvalCard({ item, index }) {
  const [expanded, setExpanded] = useState(false);

  const isProtected = item.hallucination_protected;
  const hasSources = item.sources?.length > 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-sm font-bold shrink-0">
          {item.id}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 leading-snug">{item.question}</p>
          <p className="text-xs text-slate-400 mt-0.5">Topic: {item.expected_topic}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isProtected ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              <AlertTriangle className="w-3 h-3" /> Fallback
            </span>
          ) : hasSources ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle className="w-3 h-3" /> Answered
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
              <XCircle className="w-3 h-3" /> No Source
            </span>
          )}
          <ScoreBadge score={item.best_score} />
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/50">
          {/* Generated Answer */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Generated Answer
            </h4>
            <div className={`p-3 rounded-lg text-sm leading-relaxed whitespace-pre-wrap border
              ${isProtected
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-white border-slate-200 text-slate-700'}`}>
              {item.answer}
            </div>
          </div>

          {/* Sources */}
          {item.sources?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Cited Sources
              </h4>
              <div className="flex flex-wrap gap-2">
                {item.sources.map((src, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs text-slate-600 shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                    <span className="font-medium">{src.filename}</span>
                    {src.chunk_index && (
                      <span className="text-slate-400">· {src.chunk_index}</span>
                    )}
                    <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-bold">
                      {src.score?.toFixed(3)}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Retrieved Chunks */}
          {item.chunks?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Retrieved Chunks (Top-{item.chunks.length})
              </h4>
              <div className="flex flex-col gap-2">
                {item.chunks.map((chunk, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-lg p-3 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1 font-semibold text-slate-600">
                        <FileText className="w-3 h-3 text-brand-400" />
                        {chunk.filename}
                        {chunk.chunk_index && (
                          <span className="font-normal text-slate-400">· {chunk.chunk_index}</span>
                        )}
                      </span>
                      <ScoreBadge score={chunk.score} />
                    </div>
                    <p className="text-slate-500 leading-relaxed line-clamp-4">{chunk.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Summary stats bar */
function EvalSummary({ results }) {
  const answered = results.filter((r) => !r.hallucination_protected && r.sources?.length > 0).length;
  const fallback = results.filter((r) => r.hallucination_protected).length;
  const noSource = results.length - answered - fallback;
  const avgScore =
    results.filter((r) => r.best_score !== null).reduce((acc, r) => acc + r.best_score, 0) /
    (results.filter((r) => r.best_score !== null).length || 1);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {[
        { label: 'Total Questions', value: results.length, cls: 'text-slate-700' },
        { label: 'Answered', value: answered, cls: 'text-emerald-600' },
        { label: 'Fallback (Protected)', value: fallback, cls: 'text-amber-600' },
        { label: 'Avg Best Score', value: avgScore.toFixed(3), cls: 'text-brand-600' },
      ].map((stat) => (
        <div key={stat.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
          <p className={`text-2xl font-bold ${stat.cls}`}>{stat.value}</p>
          <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main Evaluation page ─────────────────────────────────────────────────────
export default function Evaluation() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleRun = async () => {
    setIsRunning(true);
    setResults(null);
    setError(null);
    try {
      const data = await runEvaluation();
      setResults(data.results);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to run evaluation. Make sure documents are uploaded.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 p-4 md:p-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-brand-500 shrink-0" />
            RAG Evaluation Suite
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-tests 10 sample disaster management questions — shows retrieved chunks, scores & citations.
          </p>
        </div>
        <button
          onClick={handleRun}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shrink-0"
        >
          {isRunning ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Running...</>
          ) : (
            <><ClipboardList className="w-4 h-4" /> Run Evaluation</>
          )}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Idle state */}
        {!isRunning && !results && !error && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
            <ClipboardList className="w-12 h-12 text-slate-300" />
            <p className="text-slate-500 font-medium">No evaluation run yet.</p>
            <p className="text-sm text-center max-w-xs">
              Click "Run Evaluation" to test your RAG pipeline with 10 sample disaster management questions.
            </p>
          </div>
        )}

        {/* Loading */}
        {isRunning && (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
            <p className="font-medium">Running evaluation suite...</p>
            <p className="text-sm text-slate-400">This may take 30–90 seconds depending on document size.</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 text-sm flex items-start gap-2">
            <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Results */}
        {results && !isRunning && (
          <>
            <EvalSummary results={results} />
            <div className="space-y-3">
              {results.map((item, idx) => (
                <EvalCard key={item.id} item={item} index={idx} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
