export interface AppSettings {
  theme: string;
  customThemePath?: string;
  fontFamily: string;
  fontSize: number;
  backgroundImage?: string;
  backgroundOpacity: number;
  cursorStyle: 'block' | 'bar' | 'underline';
  cursorBlink: boolean;
  shell?: string;
  scrollback: number;
  ligatures: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'tokyo-night',
  fontFamily: 'JetBrains Mono',
  fontSize: 14,
  backgroundOpacity: 1.0,
  cursorStyle: 'block',
  cursorBlink: true,
  scrollback: 10000,
  ligatures: true,
};
