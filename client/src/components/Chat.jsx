import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, FileText, Download, Copy, Check } from 'lucide-react';
import { askQuestion } from '../services/api';
import jsPDF from 'jspdf';

export default function Chat({ session, onAddMessage }) {
  const messages = session?.messages || [];
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Reset input when session changes
  useEffect(() => {
    setInput('');
    setIsLoading(false);
  }, [session?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setInput('');

    // Add user message to this session
    onAddMessage({ role: 'user', content: userMsg, timestamp });
    setIsLoading(true);

    try {
      // Build history from this session's messages only
      const historyString = messages
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

      const data = await askQuestion(userMsg, historyString);
      const replyTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      onAddMessage({
        role: 'assistant',
        content: data.response,
        sources: data.sources,
        timestamp: replyTimestamp,
      });
    } catch (error) {
      console.error(error);
      const errTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const serverError = error.response?.data?.error;
      const displayMessage = serverError || 'Sorry, I encountered an error while processing your request.';

      onAddMessage({
        role: 'assistant',
        content: displayMessage,
        isError: true,
        timestamp: errTimestamp,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── PDF Export ────────────────────────────────────────────────────────────
  const handleDownloadPDF = () => {
    if (messages.length === 0) return;

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const maxWidth = pageWidth - margin * 2;
    let y = margin;

    const checkPageBreak = (h = 20) => {
      if (y + h > pageHeight - margin) { doc.addPage(); y = margin; }
    };

    // Header
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 60, 'F');
    doc.setFontSize(20); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
    doc.text(`RagBot — ${session?.name || 'Chat Export'}`, margin, 38);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`Exported on ${new Date().toLocaleString()}`, margin, 52);
    y = 80;

    messages.forEach((msg, idx) => {
      const isUser = msg.role === 'user';
      const label = isUser ? 'You' : 'RagBot';
      const labelColor = isUser ? [37, 99, 235] : [16, 124, 65];
      const bubbleBg = isUser ? [239, 246, 255] : [240, 253, 244];
      const textColor = isUser ? [30, 58, 138] : [14, 78, 46];

      if (idx > 0) y += 10;
      doc.setFontSize(10);
      const contentLines = doc.splitTextToSize(msg.content, maxWidth - 20);
      const bubbleHeight = contentLines.length * 14 + 36;
      checkPageBreak(bubbleHeight);

      doc.setFillColor(...bubbleBg);
      doc.roundedRect(margin, y, maxWidth, bubbleHeight, 6, 6, 'F');
      y += 14;

      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...labelColor);
      doc.text(label, margin + 10, y);
      if (msg.timestamp) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(150, 150, 150);
        doc.text(msg.timestamp, margin + 10 + doc.getTextWidth(label) + 8, y);
      }
      y += 4;

      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...textColor);
      contentLines.forEach((line) => { y += 13; doc.text(line, margin + 10, y); });
      y += 14;

      if (!isUser && msg.sources?.length) {
        checkPageBreak(30);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(100, 100, 100);
        doc.text('Sources:', margin + 10, y); y += 12;
        const seen = new Set();
        msg.sources.forEach((src) => {
          const filename = typeof src === 'object' ? src.filename : src;
          const chunk = typeof src === 'object' && src.chunk_index ? src.chunk_index : null;
          const key = `${filename}__${chunk}`;
          if (seen.has(key)) return; seen.add(key);
          checkPageBreak(12);
          doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(80, 80, 80);
          doc.text(chunk ? `• ${filename}  (${chunk})` : `• ${filename}`, margin + 16, y);
          y += 12;
        });
      }
    });

    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(8); doc.setTextColor(180, 180, 180);
      doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 20, { align: 'right' });
      doc.text('Generated by RagBot', margin, pageHeight - 20);
    }

    doc.save(`RagBot_${(session?.name || 'Chat').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 p-4 md:p-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 truncate">
            <Bot className="w-5 h-5 text-brand-500 shrink-0" />
            <span className="truncate">{session?.name || 'Disaster Management Assistant'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Ask questions from disaster management documents & SOPs</p>
        </div>
        <button
          onClick={handleDownloadPDF}
          disabled={messages.length === 0}
          title="Export this chat as PDF"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export PDF</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50/50">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-2">
              <Bot className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">No messages yet</p>
            <p className="text-sm">Ask a question to get started!</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm
              ${msg.role === 'user' ? 'bg-brand-600 text-white' : 'bg-slate-100 border border-slate-200 text-slate-600'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {msg.timestamp && (
                <span className="text-[11px] text-slate-400 mb-1 px-1">{msg.timestamp}</span>
              )}
              <div className={`px-4 py-3 rounded-2xl text-[15px] leading-relaxed shadow-sm
                ${msg.role === 'user'
                  ? 'bg-brand-600 text-white rounded-tr-sm'
                  : msg.isError
                    ? 'bg-rose-50 border border-rose-200 text-rose-700 rounded-tl-sm'
                    : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm group'}`}>
                <div className="flex flex-col gap-1">
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  
                  {msg.role === 'assistant' && !msg.isError && (
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity mt-1 -mb-1">
                      <button
                        onClick={() => handleCopy(msg.content, idx)}
                        className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-brand-600 font-medium transition-colors"
                        title="Copy response"
                      >
                        {copiedIndex === idx ? (
                          <><Check className="w-3.5 h-3.5 text-emerald-500" /> <span className="text-emerald-500">Copied!</span></>
                        ) : (
                          <><Copy className="w-3.5 h-3.5" /> Copy</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Citations */}
              {msg.sources?.length > 0 && (
                <div className="mt-2 w-full">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="w-3 h-3" /> Sources
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      // Deduplicate sources by filename + page combination
                      const seen = new Set();
                      const uniqueSources = [];
                      
                      msg.sources.forEach((src) => {
                        const filename = typeof src === 'object' ? src.filename : src;
                        const chunkStr = typeof src === 'object' && src.chunk_index ? src.chunk_index : '';
                        const pageMatch = chunkStr.match(/Page\s+(\d+)/i);
                        const pageNum = pageMatch ? pageMatch[1] : '1';
                        
                        const key = `${filename}__${pageNum}`;
                        if (!seen.has(key)) {
                          seen.add(key);
                          uniqueSources.push({ filename, pageNum });
                        }
                      });

                      const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

                      return uniqueSources.map((src, sIdx) => {
                        const url = `${API_BASE}/static/${encodeURIComponent(src.filename)}#page=${src.pageNum}`;
                        return (
                          <a 
                            key={sIdx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 shadow-sm transition-all group max-w-full"
                            title={`View ${src.filename} (Page ${src.pageNum})`}
                          >
                            <FileText className="w-3.5 h-3.5 text-brand-500 group-hover:text-brand-600 shrink-0" />
                            <span className="truncate max-w-[150px] sm:max-w-[200px]">{src.filename}</span>
                            <span className="shrink-0 bg-slate-100 text-slate-500 group-hover:bg-brand-100 group-hover:text-brand-700 px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors">
                              Pg {src.pageNum}
                            </span>
                          </a>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 md:gap-4">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-slate-500" />
            </div>
            <div className="bg-white border border-slate-200 px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
              <span className="text-sm font-medium text-slate-500">Analyzing documents...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Input */}
      <div className="p-4 md:p-5 bg-white border-t border-slate-100">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (input.trim() && !isLoading) {
                  handleSubmit(e);
                }
              }
            }}
            placeholder="Ask about disaster management procedures... (Shift+Enter for new line)"
            disabled={isLoading}
            rows={1}
            style={{ minHeight: '52px', maxHeight: '120px' }}
            className="w-full pl-5 pr-14 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 focus:bg-white transition-all disabled:opacity-60 text-[15px] resize-none overflow-y-auto leading-relaxed"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute bottom-2.5 right-2 p-2.5 bg-brand-600 text-white rounded-full hover:bg-brand-700 disabled:bg-slate-300 disabled:text-slate-500 transition-colors shadow-sm"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
