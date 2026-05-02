import { useTerminalStore } from '../../store/terminalStore';
import { openPath } from '@tauri-apps/plugin-opener';

interface Props {
  sessionId: string;
  onClose: () => void;
  onSplitAuto: () => void;
  onSplitH: () => void;
  onSplitV: () => void;
  isActive: boolean;
}

export default function PaneHeader({ sessionId, onClose, onSplitAuto, onSplitH, onSplitV, isActive }: Props) {
  const session = useTerminalStore((s) => s.sessions[sessionId]);
  const cwd = session?.cwd ?? '';
  const title = session?.title;

  const displayPath = cwd.startsWith(globalThis.__HOME__ ?? '/nonexistent')
    ? '~' + cwd.slice((globalThis.__HOME__ ?? '').length)
    : cwd;

  const handleOpenFolder = async () => {
    if (cwd) {
      try {
        await openPath(cwd);
      } catch (err) {
        console.error('Failed to open folder:', err);
      }
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 28,
        padding: '0 8px',
        background: isActive ? 'var(--gl-ui-bg)' : 'transparent',
        borderBottom: `1px solid var(--gl-ui-border)`,
        gap: 8,
        flexShrink: 0,
      }}
    >
      <span
        onClick={handleOpenFolder}
        title={cwd ? `Open ${cwd} in Finder` : undefined}
        style={{
          flex: 1,
          fontSize: 11,
          color: 'var(--gl-ui-text-muted)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          cursor: cwd ? 'pointer' : 'default',
        }}
        onMouseEnter={(e) => {
          if (cwd) e.currentTarget.style.color = 'var(--gl-ui-text)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--gl-ui-text-muted)';
        }}
      >
        {title || displayPath}
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        <HeaderBtn title="Auto split (⌘D)" onClick={onSplitAuto}>⊕</HeaderBtn>
        <HeaderBtn title="Split right" onClick={onSplitH}>⊢</HeaderBtn>
        <HeaderBtn title="Split down" onClick={onSplitV}>⊥</HeaderBtn>
        <HeaderBtn title="Close pane" onClick={onClose} danger>✕</HeaderBtn>
      </div>
    </div>
  );
}

function HeaderBtn({
  title, onClick, children, danger,
}: {
  title: string; onClick: () => void; children: React.ReactNode; danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={(e) => {
        // Prevent click from bubbling to TerminalPane — otherwise the focus handler
        // fires after the split begins and can re-target the wrong pane
        e.stopPropagation();
        onClick();
      }}
      style={{
        background: 'none',
        border: 'none',
        color: danger ? '#f7768e' : 'var(--gl-ui-text-muted)',
        cursor: 'pointer',
        fontSize: 13,
        padding: '0 3px',
        lineHeight: 1,
        borderRadius: 3,
      }}
    >
      {children}
    </button>
  );
}
