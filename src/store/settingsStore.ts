import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { AppSettings, DEFAULT_SETTINGS } from '../types/settings';
import { THEMES, applyTheme } from '../lib/themes';

interface SettingsStore {
  settings: AppSettings;
  initialized: boolean;
  load: () => Promise<void>;
  update: (partial: Partial<AppSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  initialized: false,

  load: async () => {
    try {
      console.log('Loading settings from Rust...');
      const settings = await invoke<AppSettings>('get_settings');
      console.log('Successfully loaded settings:', settings);
      set({ settings, initialized: true });
      const theme = THEMES[settings.theme];
      if (theme) applyTheme(theme);
    } catch (e) {
      console.error('Failed to load settings:', e);
      set({ initialized: true });
      const theme = THEMES[DEFAULT_SETTINGS.theme];
      if (theme) applyTheme(theme);
    }
  },

  update: async (partial) => {
    const next = { ...get().settings, ...partial };
    console.log('Updating settings to:', next);
    set({ settings: next });
    const theme = THEMES[next.theme];
    if (theme) applyTheme(theme);
    try {
      await invoke('set_settings', { settings: next });
      console.log('Persisted settings successfully');
    } catch (e) {
      console.error('Failed to persist settings:', e);
    }
  },
}));
