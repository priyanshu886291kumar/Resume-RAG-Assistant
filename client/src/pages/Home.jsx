import { useState } from 'react';
import Upload from '../components/Upload';
import Chat from '../components/Chat';
import ChatSidebar from '../components/ChatSidebar';
import Evaluation from '../components/Evaluation';
import { useChatSessions } from '../hooks/useChatSessions';
import { MessageSquare, ClipboardList } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'evaluation'

  const {
    sessions,
    activeId,
    activeSession,
    createNewSession,
    switchSession,
    renameSession,
    deleteSession,
    addMessage,
  } = useChatSessions();

  const handleAddMessage = (message) => {
    addMessage(activeId, message);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-stretch">
      {/* ── Chat Session Sidebar (only in chat tab) ── */}
      {activeTab === 'chat' && (
        <div className="p-3 flex shrink-0">
          <ChatSidebar
            sessions={sessions}
            activeId={activeId}
            onNew={createNewSession}
            onSwitch={switchSession}
            onRename={renameSession}
            onDelete={deleteSession}
          />
        </div>
      )}

      {/* ── Main Content ── */}
      <div
        className="flex-1 min-w-0 flex flex-col md:flex-row gap-4 p-3 overflow-hidden"
        style={{ height: '100dvh' }}
      >
        {/* Left Panel: Upload + Tab switcher */}
        <div className="w-full md:w-[300px] shrink-0 flex flex-col gap-3 overflow-y-auto py-1 pr-1">
          {/* Tab Switcher */}
          <div className="flex bg-white rounded-xl border border-slate-200 shadow-sm p-1 gap-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors
                ${activeTab === 'chat'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </button>
            <button
              onClick={() => setActiveTab('evaluation')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors
                ${activeTab === 'evaluation'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
            >
              <ClipboardList className="w-4 h-4" />
              Evaluate
            </button>
          </div>

          {/* Upload Panel (always visible) */}
          <Upload />
        </div>

        {/* Right Panel: Chat or Evaluation view */}
        <div className="flex-1 min-w-0 min-h-0">
          {activeTab === 'chat' ? (
            <Chat
              key={activeId}
              session={activeSession}
              onAddMessage={handleAddMessage}
            />
          ) : (
            <Evaluation />
          )}
        </div>
      </div>
    </div>
  );
}
