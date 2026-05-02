import { invoke } from '@tauri-apps/api/core';
import { useWorkspaceStore } from '../../store/workspaceStore';

interface Props {
  onSettingsOpen: () => void;
  onHelpOpen: () => void;
}

export default function TabBar({ onSettingsOpen, onHelpOpen }: Props) {
  const { tabs, activeTabId, setActiveTab, closeTab, addTab } = useWorkspaceStore();

  const handleNewTab = async () => {
    const sessionId = await invoke<string>('create_session', {
      cwd: null, shell: null, cols: 80, rows: 24,
    });
    addTab(sessionId);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 36,
        background: 'var(--gl-ui-bg)',
        borderBottom: '1px solid var(--gl-ui-border)',
        padding: '0 8px',
        gap: 4,
        flexShrink: 0,
        WebkitAppRegion: 'drag',
      } as React.CSSProperties}
    >
      <div
        style={{ display: 'flex', gap: 4, flex: 1, WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 10px',
              height: 26,
              borderRadius: 4,
              cursor: 'pointer',
              background: tab.id === activeTabId ? 'var(--gl-ui-accent)22' : 'transparent',
              border: `1px solid ${tab.id === activeTabId ? 'var(--gl-ui-accent)' : 'transparent'}`,
              color: tab.id === activeTabId ? 'var(--gl-ui-text)' : 'var(--gl-ui-text-muted)',
              fontSize: 12,
              userSelect: 'none',
            }}
          >
            <span>{tab.title}</span>
            {tabs.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  fontSize: 11,
                  padding: 0,
                  lineHeight: 1,
                  opacity: 0.6,
                }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          onClick={handleNewTab}
          title="New tab (⌘T)"
          style={{
            background: 'none',
            border: '1px solid var(--gl-ui-border)',
            color: 'var(--gl-ui-text-muted)',
            cursor: 'pointer',
            borderRadius: 4,
            width: 26,
            height: 26,
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          +
        </button>
      </div>
      <button
        onClick={onHelpOpen}
        title="Help (F1)"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--gl-ui-text-muted)',
          cursor: 'pointer',
          fontSize: 16,
          padding: '0 4px',
          WebkitAppRegion: 'no-drag',
        } as React.CSSProperties}
      >
        ?
      </button>
      <button
        onClick={onSettingsOpen}
        title="Settings (⌘,)"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--gl-ui-text-muted)',
          cursor: 'pointer',
          fontSize: 16,
          padding: '0 4px',
          WebkitAppRegion: 'no-drag',
        } as React.CSSProperties}
      >
        ⚙
      </button>
    </div>
  );
}
