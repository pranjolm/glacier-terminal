import { useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { useSettingsStore } from '../../store/settingsStore';

export default function BackgroundTab() {
  const { settings, update } = useSettingsStore();
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    if (!settings.backgroundImage) {
      setPreviewUrl('');
      return;
    }
    let cancelled = false;
    invoke<string>('read_image_file', { path: settings.backgroundImage })
      .then((url) => { if (!cancelled) setPreviewUrl(url); })
      .catch(() => { if (!cancelled) setPreviewUrl(''); });
    return () => { cancelled = true; };
  }, [settings.backgroundImage]);

  const handlePickImage = async () => {
    const file = await open({
      multiple: false,
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif'] }],
    });
    if (typeof file === 'string') {
      update({ backgroundImage: file });
    }
  };

  const handleClear = () => update({ backgroundImage: undefined });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Field label="Background Image">
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handlePickImage} style={btnStyle}>
            Choose Image…
          </button>
          {settings.backgroundImage && (
            <button onClick={handleClear} style={{ ...btnStyle, color: '#f7768e' }}>
              Clear
            </button>
          )}
        </div>
        {previewUrl && (
          <div
            style={{
              marginTop: 8,
              height: 80,
              borderRadius: 6,
              backgroundImage: `url(${previewUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '1px solid var(--gl-ui-border)',
            }}
          />
        )}
      </Field>

      {settings.backgroundImage && (
        <Field label={`Opacity — ${Math.round(settings.backgroundOpacity * 100)}%`}>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.backgroundOpacity}
            onChange={(e) => update({ backgroundOpacity: Number(e.target.value) })}
            style={{ width: '100%' }}
          />
        </Field>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, color: 'var(--gl-ui-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
        {label}
      </span>
      {children}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '6px 14px',
  background: 'var(--gl-ui-border)',
  color: 'var(--gl-ui-text)',
  border: '1px solid var(--gl-ui-border)',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
};
