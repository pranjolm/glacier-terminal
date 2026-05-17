import { useSettingsStore } from '../../store/settingsStore';
import { THEMES } from '../../lib/themes';

export default function ThemeTab() {
  const { settings, update } = useSettingsStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Label>Color Theme</Label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {Object.values(THEMES).map((theme) => {
            const isActive = settings.theme === theme.name;
            return (
          <button
            key={theme.name}
            onClick={() => update({ theme: theme.name })}
            style={{
              background: theme.background,
              border: `2px solid ${isActive ? 'var(--gl-ui-accent)' : 'transparent'}`,
              borderLeft: `4px solid ${isActive ? 'var(--gl-ui-accent)' : 'transparent'}`,
              borderRadius: 6,
              padding: isActive ? '10px 10px 10px 6px' : '10px 10px 10px 10px',
              cursor: 'pointer',
              textAlign: 'left',
              boxShadow: isActive ? '0 0 8px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
              {[theme.red, theme.green, theme.yellow, theme.blue, theme.magenta, theme.cyan].map((c) => (
                <span
                  key={c}
                  style={{ width: 10, height: 10, borderRadius: '50%', background: c, display: 'block' }}
                />
              ))}
            </div>
            <span style={{ color: theme.foreground, fontSize: 11, fontWeight: isActive ? 700 : 400, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                color: 'var(--gl-ui-accent)',
                fontWeight: 700,
                fontSize: 13,
                visibility: isActive ? 'visible' : 'hidden',
              }}>▸</span>
              {theme.label}
            </span>
          </button>
          );
        })}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 11, color: 'var(--gl-ui-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
      {children}
    </span>
  );
}
