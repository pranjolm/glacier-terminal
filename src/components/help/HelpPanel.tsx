import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string;
  desc: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: '⌘ D', desc: 'Split pane (auto-tile)' },
  { keys: '⌘ W', desc: 'Close active pane' },
  { keys: '⌘ T', desc: 'New tab' },
  { keys: '⌘ ,', desc: 'Settings' },
  { keys: '⌘ C', desc: 'Copy selection' },
  { keys: '⌘ V', desc: 'Paste' },
  { keys: '⌘ Click', desc: 'Open path in Finder / open URL' },
  { keys: 'Tab / →', desc: 'Accept autocomplete suggestion' },
  { keys: 'Esc', desc: 'Close panel / modal' },
];

export default function HelpPanel({ open, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <>
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 100,
          }}
        />
      )}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: 0,
          right: open ? 0 : -400,
          width: 380,
          height: '100%',
          background: 'var(--gl-ui-bg)',
          borderLeft: '1px solid var(--gl-ui-border)',
          zIndex: 101,
          transition: 'right 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid var(--gl-ui-border)',
          }}
        >
          <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>Keyboard Shortcuts</span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--gl-ui-text-muted)',
              cursor: 'pointer',
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              borderRadius: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          <p
            style={{
              fontSize: 12,
              color: 'var(--gl-ui-text-muted)',
              marginBottom: 16,
              lineHeight: 1.5,
            }}
          >
            All shortcuts are self-contained in Glacier — no external documentation needed.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SHORTCUTS.map((s) => (
              <div
                key={s.keys}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: 4,
                  background: 'var(--gl-ui-bg-hover, rgba(255,255,255,0.03))',
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--gl-ui-text)' }}>{s.desc}</span>
                <kbd
                  style={{
                    fontFamily: 'inherit',
                    fontSize: 12,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: 'var(--gl-ui-border)',
                    color: 'var(--gl-ui-text-muted)',
                    border: '1px solid var(--gl-ui-border)',
                  }}
                >
                  {s.keys}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
