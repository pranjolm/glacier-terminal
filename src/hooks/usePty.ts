import { useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { Terminal } from '@xterm/xterm';
import { useTerminalStore } from '../store/terminalStore';

interface PtyOutputPayload { data: string; }
interface PtyCwdPayload { cwd: string; }
interface PtyTitlePayload { title: string; }
interface PtySuggestionPayload { suggestion: string; }

interface UsePtyOptions {
  sessionId: string;
  terminal: Terminal | null;
  onSuggestion?: (text: string) => void;
  onExit?: () => void;
}

export function usePty({ sessionId, terminal, onSuggestion, onExit }: UsePtyOptions) {
  const { updateCwd, updateTitle, markDead } = useTerminalStore();
  const unlistenersRef = useRef<UnlistenFn[]>([]);

  useEffect(() => {
    if (!sessionId || !terminal) return;

    const setup = async () => {
      const unlisten: UnlistenFn[] = [];

      // PTY output → terminal
      unlisten.push(await listen<PtyOutputPayload>(
        `pty://output/${sessionId}`,
        ({ payload }) => {
          const bytes = Uint8Array.from(atob(payload.data), (c) => c.charCodeAt(0));
          terminal.write(bytes);
        },
      ));

      // CWD change
      unlisten.push(await listen<PtyCwdPayload>(
        `pty://cwd_change/${sessionId}`,
        ({ payload }) => updateCwd(sessionId, payload.cwd),
      ));

      // Title change
      unlisten.push(await listen<PtyTitlePayload>(
        `pty://title_change/${sessionId}`,
        ({ payload }) => updateTitle(sessionId, payload.title),
      ));

      // Inline autocomplete suggestion
      unlisten.push(await listen<PtySuggestionPayload>(
        `pty://suggestion/${sessionId}`,
        ({ payload }) => {
          // suggestion received
          onSuggestion?.(payload.suggestion);
        },
      ));

      // Exit
      unlisten.push(await listen(
        `pty://exit/${sessionId}`,
        () => {
          markDead(sessionId);
          onExit?.();
        },
      ));

      unlistenersRef.current = unlisten;
    };

    setup();

    return () => {
      unlistenersRef.current.forEach((fn) => fn());
      unlistenersRef.current = [];
    };
  }, [sessionId, terminal]);

  const write = useCallback((data: string) => {
    invoke('write_to_pty', { sessionId, data }).catch(console.error);
  }, [sessionId]);

  const resize = useCallback((cols: number, rows: number) => {
    invoke('resize_pty', { sessionId, cols, rows }).catch(console.error);
  }, [sessionId]);

  return { write, resize };
}
