import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'ragbot_chat_sessions';

function generateId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function createSession(name = null) {
  const id = generateId();
  return {
    id,
    name: name || `Chat ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    messages: [],
    createdAt: Date.now(),
  };
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveToStorage(sessions, activeId) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessions, activeId }));
  } catch {
    // quota exceeded — ignore silently
  }
}

export function useChatSessions() {
  const [sessions, setSessions] = useState(() => {
    const stored = loadFromStorage();
    if (stored?.sessions?.length) return stored.sessions;
    const initial = createSession('New Chat');
    return [initial];
  });

  const [activeId, setActiveId] = useState(() => {
    const stored = loadFromStorage();
    return stored?.activeId || sessions[0]?.id;
  });

  // Persist every change to localStorage
  useEffect(() => {
    saveToStorage(sessions, activeId);
  }, [sessions, activeId]);

  // ── Helpers ─────────────────────────────────────────────────────────────

  const activeSession = sessions.find((s) => s.id === activeId) || sessions[0];

  const createNewSession = useCallback(() => {
    const s = createSession();
    setSessions((prev) => [s, ...prev]);
    setActiveId(s.id);
    return s.id;
  }, []);

  const switchSession = useCallback((id) => {
    setActiveId(id);
  }, []);

  const renameSession = useCallback((id, newName) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name: newName.trim() || s.name } : s))
    );
  }, []);

  const deleteSession = useCallback((id) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (next.length === 0) {
        const fresh = createSession('New Chat');
        setActiveId(fresh.id);
        return [fresh];
      }
      // If we deleted the active one, switch to first remaining
      if (id === activeId) {
        setActiveId(next[0].id);
      }
      return next;
    });
  }, [activeId]);

  const addMessage = useCallback((sessionId, message) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, messages: [...s.messages, message] }
          : s
      )
    );
  }, []);

  const updateLastMessage = useCallback((sessionId, updater) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        const msgs = [...s.messages];
        if (msgs.length === 0) return s;
        msgs[msgs.length - 1] = updater(msgs[msgs.length - 1]);
        return { ...s, messages: msgs };
      })
    );
  }, []);

  return {
    sessions,
    activeId,
    activeSession,
    createNewSession,
    switchSession,
    renameSession,
    deleteSession,
    addMessage,
    updateLastMessage,
  };
}
