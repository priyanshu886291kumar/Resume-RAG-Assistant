import Upload from '../components/Upload';
import Chat from '../components/Chat';
import ChatSidebar from '../components/ChatSidebar';
import { useChatSessions } from '../hooks/useChatSessions';

export default function Home() {
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
      {/* ── Chat Session Sidebar ── */}
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

      {/* ── Main Content: Upload + Chat ── */}
      <div className="flex-1 min-w-0 flex flex-col md:flex-row gap-4 p-3 pl-0 overflow-hidden" style={{ height: '100dvh' }}>
        {/* Upload / Document Manager */}
        <div className="w-full md:w-[300px] shrink-0 overflow-y-auto py-1 pr-1">
          <Upload />
        </div>

        {/* Active Chat */}
        <div className="flex-1 min-w-0 min-h-0">
          <Chat
            key={activeId}
            session={activeSession}
            onAddMessage={handleAddMessage}
          />
        </div>
      </div>
    </div>
  );
}
