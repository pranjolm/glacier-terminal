import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ThemeTab from './ThemeTab';
import FontTab from './FontTab';
import BackgroundTab from './BackgroundTab';

type TabId = 'theme' | 'font' | 'background';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ open, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('theme');

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
          <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>Settings</span>
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

        {/* Tab strip */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--gl-ui-border)',
            padding: '0 8px',
          }}
        >
          {(['theme', 'font', 'background'] as TabId[]).map((id) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${activeTab === id ? 'var(--gl-ui-accent)' : 'transparent'}`,
                color: activeTab === id ? 'var(--gl-ui-text)' : 'var(--gl-ui-text-muted)',
                cursor: 'pointer',
                padding: '8px 12px',
                fontSize: 12,
                textTransform: 'capitalize',
              }}
            >
              {id}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {activeTab === 'theme' && <ThemeTab />}
          {activeTab === 'font' && <FontTab />}
          {activeTab === 'background' && <BackgroundTab />}
        </div>
      </div>
    </>,
    document.body,
  );
}
