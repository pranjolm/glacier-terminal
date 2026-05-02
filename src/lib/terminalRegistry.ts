/**
 * Global terminal registry — keeps xterm.js Terminal instances alive
 * independent of React component lifecycle. When a TerminalPane unmounts
 * (e.g. during a pane split re-render), the Terminal and its scrollback are
 * preserved. The next mount just re-attaches the existing DOM container.
 */
import { Terminal, ILinkProvider, ILink, IBufferLine } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { CanvasAddon } from '@xterm/addon-canvas';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { Unicode11Addon } from '@xterm/addon-unicode11';
import { openUrl, revealItemInDir } from '@tauri-apps/plugin-opener';
import { AppSettings } from '../types/settings';
import { THEMES, getXtermTheme } from './themes';
import { useTerminalStore } from '../store/terminalStore';

export interface TerminalEntry {
  terminal: Terminal;
  fitAddon: FitAddon;
  container: HTMLDivElement;
  opened: boolean;
  sessionId: string;
}

const registry = new Map<string, TerminalEntry>();
export const wiredSessions = new Set<string>();

export function getEntry(sessionId: string): TerminalEntry | undefined {
  return registry.get(sessionId);
}

function isPathLike(word: string): boolean {
  if (word.length < 2) return false;
  return (
    word.startsWith('/') ||
    word.startsWith('~/') ||
    word.startsWith('./') ||
    word.startsWith('../') ||
    (word.includes('/') && word.length > 3) ||
    /\.[a-z0-9]{1,6}$/i.test(word) ||
    /^[\w\-\.]+$/.test(word)
  );
}

function resolvePath(word: string, sessionId: string): string {
  let resolved = word;
  if (resolved.startsWith('~')) {
    resolved = resolved.replace('~', (globalThis as any).__HOME__ ?? '~');
  } else if (!resolved.startsWith('/')) {
    const session = useTerminalStore.getState().sessions[sessionId];
    if (session?.cwd) {
      resolved = `${session.cwd.replace(/\/$/, '')}/${resolved}`;
    }
  }
  return resolved;
}

class PathLinkProvider implements ILinkProvider {
  constructor(
    private readonly _terminal: Terminal,
    private readonly _sessionId: string
  ) {}

  public provideLinks(y: number, callback: (links: ILink[] | undefined) => void): void {
    const line = this._terminal.buffer.active.getLine(y - 1);
    if (!line) {
      callback(undefined);
      return;
    }

    const links: ILink[] = [];
    let start = -1;

    for (let x = 0; x < line.length; x++) {
      const cell = line.getCell(x);
      if (!cell) continue;
      const char = cell.getChars();
      const width = cell.getWidth();

      // Skip empty cells or spaces
      const isWordChar = char !== '' && char !== ' ' && width > 0;

      if (isWordChar && start === -1) {
        start = x;
      } else if (!isWordChar && start !== -1) {
        this._processWord(line, start, x - 1, y, links);
        start = -1;
      }
    }

    if (start !== -1) {
      this._processWord(line, start, line.length - 1, y, links);
    }

    callback(links);
  }

  private _processWord(line: IBufferLine, start: number, end: number, y: number, links: ILink[]) {
    let word = '';
    for (let x = start; x <= end; x++) {
      const cell = line.getCell(x);
      if (cell) word += cell.getChars();
    }

    // Strip Nerd Font icons and trim
    const cleanWord = word.replace(/^[^\s\w\d\x00-\x7F]+/u, '').trim();
    
    if (isPathLike(cleanWord)) {
      links.push({
        range: {
          start: { x: start + 1, y },
          end: { x: end + 1, y }
        },
        text: cleanWord,
        activate: () => {
          const path = resolvePath(cleanWord, this._sessionId);
          revealItemInDir(path).catch(console.error);
        }
      });
    }
  }
}

export function getOrCreateEntry(sessionId: string, settings: AppSettings): TerminalEntry {
  const existing = registry.get(sessionId);
  if (existing) return existing;

  const theme = THEMES[settings.theme] ?? THEMES['tokyo-night'];
  const container = document.createElement('div');
  container.style.cssText = 'width:100%;height:100%;overflow:hidden;';

  const initialTheme = getXtermTheme(theme);
  if (settings.backgroundImage) {
    initialTheme.background = 'transparent';
  }

  const terminal = new Terminal({
    fontFamily: `'${settings.fontFamily}', 'Symbols Nerd Font Mono', monospace`,
    fontSize: settings.fontSize,
    lineHeight: 1.2,
    theme: initialTheme,
    cursorStyle: settings.cursorStyle,
    cursorBlink: settings.cursorBlink,
    scrollback: settings.scrollback,
    allowProposedApi: true,
    allowTransparency: true,
  });

  const fitAddon = new FitAddon();
  const unicode = new Unicode11Addon();
  const weblinks = new WebLinksAddon((_evt, url) => openUrl(url).catch(console.error));

  terminal.loadAddon(fitAddon);
  terminal.loadAddon(unicode);
  terminal.loadAddon(weblinks);
  terminal.unicode.activeVersion = '11';

  const entry: TerminalEntry = { terminal, fitAddon, container, opened: false, sessionId };
  registry.set(sessionId, entry);
  return entry;
}

function clearViewportBackground(entry: TerminalEntry) {
  const viewport = entry.container.querySelector('.xterm-viewport') as HTMLElement | null;
  if (viewport) viewport.style.setProperty('background-color', 'transparent', 'important');
}

export function openEntry(entry: TerminalEntry) {
  if (entry.opened) return;
  entry.opened = true;
  entry.terminal.open(entry.container);
  entry.terminal.loadAddon(new CanvasAddon());
  clearViewportBackground(entry);
  entry.terminal.registerLinkProvider(new PathLinkProvider(entry.terminal, entry.sessionId));
}

export function updateEntryTheme(sessionId: string, settings: AppSettings) {
  const entry = registry.get(sessionId);
  if (!entry) return;
  const theme = THEMES[settings.theme] ?? THEMES['tokyo-night'];
  entry.terminal.options.fontFamily = `'${settings.fontFamily}', 'Symbols Nerd Font Mono', monospace`;
  entry.terminal.options.fontSize = settings.fontSize;
  const xtermTheme = getXtermTheme(theme);
  if (settings.backgroundImage) {
    xtermTheme.background = 'transparent';
  }
  entry.terminal.options.theme = xtermTheme;
  entry.terminal.options.cursorStyle = settings.cursorStyle;
  entry.terminal.options.cursorBlink = settings.cursorBlink;
  clearViewportBackground(entry);
  if (settings.backgroundImage) {
    entry.container.classList.add('xterm-glacier-bg');
  } else {
    entry.container.classList.remove('xterm-glacier-bg');
    entry.container.style.backgroundColor = theme.background;
  }
  entry.fitAddon.fit();
  entry.terminal.refresh(0, entry.terminal.rows - 1);
}

export function destroyEntry(sessionId: string) {
  const entry = registry.get(sessionId);
  if (!entry) return;
  entry.terminal.dispose();
  entry.container.remove();
  registry.delete(sessionId);
  wiredSessions.delete(sessionId);
}