import { X, FileText, Sparkles } from 'lucide-react';

/**
 * Renders the LLM summary text into sections.
 * The LLM returns markdown-style headings (## Section) which we parse and render.
 */
function renderSummary(text) {
  const lines = text.split('\n');
  const elements = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // ## Heading
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={key++} className="text-sm font-bold text-slate-800 mt-5 mb-2 flex items-center gap-1.5">
          {line.replace('## ', '')}
        </h3>
      );
    }
    // Bullet points
    else if (line.startsWith('- ') || line.startsWith('• ')) {
      elements.push(
        <div key={key++} className="flex items-start gap-2 text-sm text-slate-700 mb-1">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
          <span>{line.replace(/^[-•]\s*/, '')}</span>
        </div>
      );
    }
    // Numbered lists
    else if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\./)[1];
      elements.push(
        <div key={key++} className="flex items-start gap-2 text-sm text-slate-700 mb-1">
          <span className="shrink-0 w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold flex items-center justify-center mt-0.5">
            {num}
          </span>
          <span>{line.replace(/^\d+\.\s*/, '')}</span>
        </div>
      );
    }
    // Blank line
    else if (line.trim() === '') {
      elements.push(<div key={key++} className="h-1" />);
    }
    // Regular paragraph text
    else {
      elements.push(
        <p key={key++} className="text-sm text-slate-700 leading-relaxed mb-1">
          {line}
        </p>
      );
    }
  }

  return elements;
}

export default function SummaryPanel({ summary, files, onClose }) {
  if (!summary) return null;

  return (
    /* Overlay */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      {/* Card */}
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-brand-600 to-brand-500 text-white shrink-0">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold">AI Document Summary</h2>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {files.map((f) => (
                <span key={f} className="flex items-center gap-1 text-[10px] bg-white/20 px-2 py-0.5 rounded-full truncate max-w-[200px]">
                  <FileText className="w-2.5 h-2.5 shrink-0" />
                  {f}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {renderSummary(summary)}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
