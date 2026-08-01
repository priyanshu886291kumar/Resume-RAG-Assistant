import { useState, useRef, useEffect } from 'react';
import {
  MessageSquarePlus,
  Trash2,
  Pencil,
  Check,
  X,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Database,
} from 'lucide-react';

export default function ChatSidebar({
  sessions,
  activeId,
  onNew,
  onSwitch,
  onRename,
  onDelete,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editingId && inputRef.current) inputRef.current.focus();
  }, [editingId]);

  const startEdit = (session) => {
    setEditingId(session.id);
    setEditValue(session.name);
  };

  const commitEdit = () => {
    if (editingId) {
      onRename(editingId, editValue);
      setEditingId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  return (
    <aside
      className={`relative flex flex-col shrink-0 transition-all duration-300 ease-in-out
        ${collapsed ? 'w-12' : 'w-60'}
        bg-slate-900 rounded-xl overflow-hidden shadow-lg`}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-slate-700/60">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
              <Database className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white tracking-wide">RagBot</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="ml-auto text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-700"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* ── New Chat Button ── */}
      <div className="px-2 pt-3 pb-1">
        <button
          onClick={onNew}
          title="New Chat"
          className={`flex items-center gap-2 w-full py-2 px-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors
            ${collapsed ? 'justify-center' : ''}`}
        >
          <MessageSquarePlus className="w-4 h-4 shrink-0" />
          {!collapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* ── Session List ── */}
      <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 mt-1 scrollbar-thin scrollbar-thumb-slate-700">
        {sessions.map((session) => {
          const isActive = session.id === activeId;
          const isEditing = editingId === session.id;
          const preview = session.messages.find((m) => m.role === 'user')?.content || 'Empty chat';

          return (
            <div
              key={session.id}
              onClick={() => !isEditing && onSwitch(session.id)}
              className={`group relative flex items-center gap-2 rounded-lg px-2 py-2.5 cursor-pointer transition-colors
                ${isActive ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />

              {!collapsed && (
                <>
                  {isEditing ? (
                    <input
                      ref={inputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 min-w-0 bg-slate-600 text-white text-xs rounded px-1.5 py-0.5 outline-none"
                    />
                  ) : (
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{session.name}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{preview}</p>
                    </div>
                  )}

                  {/* Action buttons — shown on hover or when active */}
                  <div
                    className={`flex items-center gap-0.5 shrink-0 transition-opacity
                      ${isActive || isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isEditing ? (
                      <>
                        <button onClick={commitEdit} className="p-0.5 text-emerald-400 hover:text-emerald-300">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={cancelEdit} className="p-0.5 text-slate-400 hover:text-slate-300">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(session)}
                          className="p-0.5 text-slate-400 hover:text-white"
                          title="Rename"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onDelete(session.id)}
                          className="p-0.5 text-slate-400 hover:text-rose-400"
                          title="Delete chat"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      {!collapsed && (
        <div className="px-3 py-2 border-t border-slate-700/60">
          <p className="text-[10px] text-slate-600 text-center">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} · saved locally
          </p>
        </div>
      )}
    </aside>
  );
}
