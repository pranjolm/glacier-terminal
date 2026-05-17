import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { invoke } from '@tauri-apps/api/core';
import { useSettingsStore } from '../../store/settingsStore';
import {
  getOrCreateEntry,
  openEntry,
  updateEntryTheme,
} from '../../lib/terminalRegistry';

export interface TerminalViewHandle {
  terminal: Terminal | null;
  fit: () => void;
}

interface Props {
  sessionId: string;
  onReady: (terminal: Terminal) => void;
  onResize: (cols: number, rows: number) => void;
}

const TerminalView = forwardRef<TerminalViewHandle, Props>(
  ({ sessionId, onReady, onResize }, ref) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const { settings } = useSettingsStore();
    const [bgUrl, setBgUrl] = useState<string>('');

    // Keep a stable ref to onReady/onResize so the mount effect doesn't re-run
    const onReadyRef = useRef(onReady);
    const onResizeRef = useRef(onResize);
    useEffect(() => { onReadyRef.current = onReady; }, [onReady]);
    useEffect(() => { onResizeRef.current = onResize; }, [onResize]);

    useImperativeHandle(ref, () => ({
      get terminal() {
        return getOrCreateEntry(sessionId, settings).terminal;
      },
      fit() {
        getOrCreateEntry(sessionId, settings).fitAddon.fit();
      },
    }));

    // Mount / unmount: attach and detach the persistent container
    useEffect(() => {
      const mount = mountRef.current;
      if (!mount) return;

      const entry = getOrCreateEntry(sessionId, settings);
      mount.appendChild(entry.container);

      openEntry(entry);

      entry.fitAddon.fit();
      entry.terminal.focus();
      onReadyRef.current(entry.terminal);
      onResizeRef.current(entry.terminal.cols, entry.terminal.rows);

      const ro = new ResizeObserver(() => {
        entry.fitAddon.fit();
        onResizeRef.current(entry.terminal.cols, entry.terminal.rows);
      });
      ro.observe(mount);

      const handleVisibilityChange = () => {
        if (!document.hidden) {
          entry.fitAddon.fit();
          entry.terminal.refresh(0, entry.terminal.rows - 1);
          entry.terminal.focus();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      const handleFocus = () => {
        entry.fitAddon.fit();
        entry.terminal.refresh(0, entry.terminal.rows - 1);
      };
      window.addEventListener('focus', handleFocus);

      return () => {
        ro.disconnect();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
        // Detach container from DOM — terminal instance stays alive in registry
        if (entry.container.parentNode === mount) {
          mount.removeChild(entry.container);
        }
      };
      // Intentionally omit settings — theme changes handled separately below
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    // Read image through Rust backend and get a data URL for CSS background-image
    useEffect(() => {
      if (!settings.backgroundImage) {
        setBgUrl('');
        return;
      }
      let cancelled = false;
      invoke<string>('read_image_file', { path: settings.backgroundImage })
        .then((url) => { if (!cancelled) setBgUrl(url); })
        .catch(() => { if (!cancelled) setBgUrl(''); });
      return () => { cancelled = true; };
    }, [settings.backgroundImage]);

    // Reactively update terminal options when settings change (no remount needed)
    useEffect(() => {
      updateEntryTheme(sessionId, settings);
    }, [sessionId, settings]);

    return (
      <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
        {bgUrl && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `linear-gradient(rgba(0,0,0,${1 - settings.backgroundOpacity}),rgba(0,0,0,${1 - settings.backgroundOpacity})),url(${bgUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              zIndex: 0,
            }}
          />
        )}
        <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }} />
      </div>
    );
  },
);

TerminalView.displayName = 'TerminalView';
export default TerminalView;
