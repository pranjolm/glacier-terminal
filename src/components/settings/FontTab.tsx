import { useSettingsStore } from '../../store/settingsStore';

const POPULAR_FONTS = [
  'JetBrains Mono',
  'Fira Code',
  'Cascadia Code',
  'SF Mono',
  'Monaco',
  'Menlo',
  'Inconsolata',
  'Source Code Pro',
  'Hack',
  'IBM Plex Mono',
];

export default function FontTab() {
  const { settings, update } = useSettingsStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Field label="Font Family">
        <select
          value={settings.fontFamily}
          onChange={(e) => update({ fontFamily: e.target.value })}
          style={selectStyle}
        >
          {POPULAR_FONTS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Or type a custom font name…"
          defaultValue={POPULAR_FONTS.includes(settings.fontFamily) ? '' : settings.fontFamily}
          onBlur={(e) => { if (e.target.value) update({ fontFamily: e.target.value }); }}
          style={{ ...inputStyle, marginTop: 6 }}
        />
      </Field>

      <Field label="Font Size">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="range"
            min={8}
            max={32}
            value={settings.fontSize}
            onChange={(e) => update({ fontSize: Number(e.target.value) })}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: 13, minWidth: 28, textAlign: 'right' }}>
            {settings.fontSize}
          </span>
        </div>
      </Field>

      <Field label="Cursor Style">
        <div style={{ display: 'flex', gap: 8 }}>
          {(['block', 'bar', 'underline'] as const).map((s) => (
            <button
              key={s}
              onClick={() => update({ cursorStyle: s })}
              style={{
                padding: '4px 12px',
                borderRadius: 4,
                border: `1px solid ${settings.cursorStyle === s ? 'var(--gl-ui-accent)' : 'var(--gl-ui-border)'}`,
                background: settings.cursorStyle === s ? 'var(--gl-ui-accent)22' : 'transparent',
                color: 'var(--gl-ui-text)',
                cursor: 'pointer',
                fontSize: 12,
                textTransform: 'capitalize',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Cursor Blink">
        <Toggle
          value={settings.cursorBlink}
          onChange={(v) => update({ cursorBlink: v })}
        />
      </Field>

      <Field label="Ligatures">
        <Toggle
          value={settings.ligatures}
          onChange={(v) => update({ ligatures: v })}
        />
      </Field>

      <div
        style={{
          padding: 12,
          background: 'var(--gl-bg)',
          borderRadius: 6,
          fontFamily: `'${settings.fontFamily}', 'Symbols Nerd Font Mono', monospace`,
          fontSize: settings.fontSize,
          color: 'var(--gl-fg)',
        }}
      >
        The quick brown fox
      </div>
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

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        background: value ? 'var(--gl-ui-accent)' : 'var(--gl-ui-border)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.15s',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 2,
          left: value ? 18 : 2,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.15s',
        }}
      />
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  background: 'var(--gl-ui-border)',
  color: 'var(--gl-ui-text)',
  border: '1px solid var(--gl-ui-border)',
  borderRadius: 4,
  padding: '4px 8px',
  fontSize: 13,
  width: '100%',
};

const inputStyle: React.CSSProperties = {
  background: 'var(--gl-ui-border)',
  color: 'var(--gl-ui-text)',
  border: '1px solid var(--gl-ui-border)',
  borderRadius: 4,
  padding: '4px 8px',
  fontSize: 13,
  width: '100%',
  outline: 'none',
};
