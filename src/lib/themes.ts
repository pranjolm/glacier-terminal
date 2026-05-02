export interface GlacierTheme {
  name: string;
  label: string;
  background: string;
  foreground: string;
  cursor: string;
  selectionBackground: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
  // UI chrome colors
  uiBg: string;
  uiBorder: string;
  uiText: string;
  uiTextMuted: string;
  uiAccent: string;
}

export const THEMES: Record<string, GlacierTheme> = {
  'tokyo-night': {
    name: 'tokyo-night',
    label: 'Tokyo Night',
    background: '#1a1b26',
    foreground: '#c0caf5',
    cursor: '#c0caf5',
    selectionBackground: '#283457',
    black: '#15161e',
    red: '#f7768e',
    green: '#9ece6a',
    yellow: '#e0af68',
    blue: '#7aa2f7',
    magenta: '#bb9af7',
    cyan: '#7dcfff',
    white: '#a9b1d6',
    brightBlack: '#414868',
    brightRed: '#f7768e',
    brightGreen: '#9ece6a',
    brightYellow: '#e0af68',
    brightBlue: '#7aa2f7',
    brightMagenta: '#bb9af7',
    brightCyan: '#7dcfff',
    brightWhite: '#c0caf5',
    uiBg: '#16161e',
    uiBorder: '#292e42',
    uiText: '#c0caf5',
    uiTextMuted: '#565f89',
    uiAccent: '#7aa2f7',
  },
  'catppuccin-mocha': {
    name: 'catppuccin-mocha',
    label: 'Catppuccin Mocha',
    background: '#1e1e2e',
    foreground: '#cdd6f4',
    cursor: '#f5e0dc',
    selectionBackground: '#313244',
    black: '#45475a',
    red: '#f38ba8',
    green: '#a6e3a1',
    yellow: '#f9e2af',
    blue: '#89b4fa',
    magenta: '#f5c2e7',
    cyan: '#94e2d5',
    white: '#bac2de',
    brightBlack: '#585b70',
    brightRed: '#f38ba8',
    brightGreen: '#a6e3a1',
    brightYellow: '#f9e2af',
    brightBlue: '#89b4fa',
    brightMagenta: '#f5c2e7',
    brightCyan: '#94e2d5',
    brightWhite: '#a6adc8',
    uiBg: '#181825',
    uiBorder: '#313244',
    uiText: '#cdd6f4',
    uiTextMuted: '#6c7086',
    uiAccent: '#89b4fa',
  },
  'gruvbox-dark': {
    name: 'gruvbox-dark',
    label: 'Gruvbox Dark',
    background: '#282828',
    foreground: '#ebdbb2',
    cursor: '#ebdbb2',
    selectionBackground: '#3c3836',
    black: '#282828',
    red: '#cc241d',
    green: '#98971a',
    yellow: '#d79921',
    blue: '#458588',
    magenta: '#b16286',
    cyan: '#689d6a',
    white: '#a89984',
    brightBlack: '#928374',
    brightRed: '#fb4934',
    brightGreen: '#b8bb26',
    brightYellow: '#fabd2f',
    brightBlue: '#83a598',
    brightMagenta: '#d3869b',
    brightCyan: '#8ec07c',
    brightWhite: '#ebdbb2',
    uiBg: '#1d2021',
    uiBorder: '#3c3836',
    uiText: '#ebdbb2',
    uiTextMuted: '#928374',
    uiAccent: '#fabd2f',
  },
  'one-dark': {
    name: 'one-dark',
    label: 'One Dark',
    background: '#282c34',
    foreground: '#abb2bf',
    cursor: '#528bff',
    selectionBackground: '#3e4451',
    black: '#282c34',
    red: '#e06c75',
    green: '#98c379',
    yellow: '#e5c07b',
    blue: '#61afef',
    magenta: '#c678dd',
    cyan: '#56b6c2',
    white: '#abb2bf',
    brightBlack: '#545862',
    brightRed: '#e06c75',
    brightGreen: '#98c379',
    brightYellow: '#e5c07b',
    brightBlue: '#61afef',
    brightMagenta: '#c678dd',
    brightCyan: '#56b6c2',
    brightWhite: '#c8ccd4',
    uiBg: '#21252b',
    uiBorder: '#3e4451',
    uiText: '#abb2bf',
    uiTextMuted: '#5c6370',
    uiAccent: '#61afef',
  },
};

export function applyTheme(theme: GlacierTheme) {
  const root = document.documentElement;
  root.style.setProperty('--gl-bg', theme.background);
  root.style.setProperty('--gl-fg', theme.foreground);
  root.style.setProperty('--gl-ui-bg', theme.uiBg);
  root.style.setProperty('--gl-ui-border', theme.uiBorder);
  root.style.setProperty('--gl-ui-text', theme.uiText);
  root.style.setProperty('--gl-ui-text-muted', theme.uiTextMuted);
  root.style.setProperty('--gl-ui-accent', theme.uiAccent);
}

export function getXtermTheme(theme: GlacierTheme) {
  return {
    background: theme.background,
    foreground: theme.foreground,
    cursor: theme.cursor,
    selectionBackground: theme.selectionBackground,
    black: theme.black,
    red: theme.red,
    green: theme.green,
    yellow: theme.yellow,
    blue: theme.blue,
    magenta: theme.magenta,
    cyan: theme.cyan,
    white: theme.white,
    brightBlack: theme.brightBlack,
    brightRed: theme.brightRed,
    brightGreen: theme.brightGreen,
    brightYellow: theme.brightYellow,
    brightBlue: theme.brightBlue,
    brightMagenta: theme.brightMagenta,
    brightCyan: theme.brightCyan,
    brightWhite: theme.brightWhite,
  };
}
