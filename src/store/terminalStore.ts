import { create } from 'zustand';
import { SessionState } from '../types/terminal';

interface TerminalStore {
  sessions: Record<string, SessionState>;
  registerSession: (id: string, cwd: string, shell: string) => void;
  updateCwd: (id: string, cwd: string) => void;
  updateTitle: (id: string, title: string) => void;
  markDead: (id: string) => void;
  removeSession: (id: string) => void;
}

export const useTerminalStore = create<TerminalStore>((set) => ({
  sessions: {},

  registerSession: (id, cwd, shell) =>
    set((s) => ({
      sessions: {
        ...s.sessions,
        [id]: { id, cwd, title: '', isAlive: true, shell },
      },
    })),

  updateCwd: (id, cwd) =>
    set((s) => ({
      sessions: s.sessions[id]
        ? { ...s.sessions, [id]: { ...s.sessions[id], cwd } }
        : s.sessions,
    })),

  updateTitle: (id, title) =>
    set((s) => ({
      sessions: s.sessions[id]
        ? { ...s.sessions, [id]: { ...s.sessions[id], title } }
        : s.sessions,
    })),

  markDead: (id) =>
    set((s) => ({
      sessions: s.sessions[id]
        ? { ...s.sessions, [id]: { ...s.sessions[id], isAlive: false } }
        : s.sessions,
    })),

  removeSession: (id) =>
    set((s) => {
      const { [id]: _, ...rest } = s.sessions;
      return { sessions: rest };
    }),
}));
