import { useEffect, useRef, useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Terminal } from '@xterm/xterm';
import { useTerminalStore } from '../../store/terminalStore';
import { usePty } from '../../hooks/usePty';
import { useAutocomplete } from '../../hooks/useAutocomplete';
import { wiredSessions } from '../../lib/terminalRegistry';
import TerminalView, { TerminalViewHandle } from './TerminalView';
import GhostText from './GhostText';
import CopyButton from './CopyButton';
import PaneHeader from './PaneHeader';

interface Props {
  paneId: string;
  sessionId: string;
  isActive: boolean;
  onFocus: () => void;
  onClose: () => void;
  onSplitAuto: () => void;
  onSplitH: () => void;
  onSplitV: () => void;
}

export default function TerminalPane({
  sessionId,
  isActive,
  onFocus,
  onClose,
  onSplitAuto,
  onSplitH,
  onSplitV,
}: Props) {
  const termViewRef = useRef<TerminalViewHandle>(null);
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const { suggestion, handleSuggestion, clearSuggestion } = useAutocomplete();
  const { registerSession } = useTerminalStore();
  const actualSessionId = useRef(sessionId);
  const suggestionRef = useRef(suggestion);
  const writeRef = useRef<((data: string) => void) | null>(null);

  useEffect(() => { actualSessionId.current = sessionId; }, [sessionId]);
  useEffect(() => { suggestionRef.current = suggestion; }, [suggestion]);

  const handleResize = useCallback((cols: number, rows: number) => {
    invoke('resize_pty', { sessionId: actualSessionId.current, cols, rows }).catch(() => {});
  }, []);

  const { write } = usePty({
    sessionId,
    terminal,
    onSuggestion: handleSuggestion,
    onExit: () => { terminal?.writeln('\r\n[Process exited]'); },
  });

  useEffect(() => { writeRef.current = write; }, [write]);

  const handleTerminalReady = useCallback(
    (term: Terminal) => {
      setTerminal(term);
      registerSession(sessionId, globalThis.__HOME__ ?? '/', 'shell');

      // Guard: only wire handlers once per session across all mounts/remounts
      if (wiredSessions.has(sessionId)) return;
      wiredSessions.add(sessionId);

      term.onData((data) => {
        writeRef.current?.(data);
        clearSuggestion();
      });

      term.attachCustomKeyEventHandler((e) => {
        if (e.type !== 'keydown') return true;

        if (e.metaKey && e.key === 'c' && term.hasSelection()) {
          navigator.clipboard.writeText(term.getSelection());
          return false;
        }
        if (e.metaKey && e.key === 'd') return false;

        if (e.key === 'Enter') {
          clearSuggestion();
          return true;
        }

        if (e.key === 'Escape') {
          clearSuggestion();
          return true;
        }

        const sug = suggestionRef.current;
        if (sug && e.key === 'Tab') {
          // Tab always accepts the full suggestion
          writeRef.current?.(sug);
          clearSuggestion();
          return false;
        }
        if (sug && e.key === 'ArrowRight') {
          // Right arrow only accepts if cursor is at end of line
          const buffer = term.buffer.active;
          const line = buffer.getLine(buffer.baseY + buffer.cursorY);
          const lineText = line?.translateToString(true) || '';

          if (buffer.cursorX >= lineText.trimEnd().length) {
            writeRef.current?.(sug);
            clearSuggestion();
            return false;
          }
        }

        // Clear suggestion on cursor movement away from end of line
        if (sug && (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Home' || e.key === 'End')) {
          clearSuggestion();
          return true;
        }

        return true;
      });

    },
    [sessionId, clearSuggestion, registerSession],
  );

  const handlePaneClick = useCallback(() => {
    onFocus();
    terminal?.focus();
  }, [onFocus, terminal]);

  return (
    <div
      onClick={handlePaneClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        outline: isActive ? '1px solid var(--gl-ui-accent)' : '1px solid var(--gl-ui-border)',
        outlineOffset: -1,
      }}
    >
      <PaneHeader
        sessionId={sessionId}
        isActive={isActive}
        onClose={onClose}
        onSplitAuto={onSplitAuto}
        onSplitH={onSplitH}
        onSplitV={onSplitV}
      />

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <TerminalView
          ref={termViewRef}
          sessionId={sessionId}
          onReady={handleTerminalReady}
          onResize={handleResize}
        />
        <GhostText terminal={terminal} suggestion={suggestion} />
        <CopyButton terminal={terminal} />
      </div>
    </div>
  );
}
