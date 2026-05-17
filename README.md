<p align="center">
  <img src="logo.png" alt="Glacier" width="140" />
</p>

<h1 align="center">Glacier</h1>

<p align="center">
  <strong>The terminal macOS deserves.</strong><br/>
  Fast, beautiful, zero-config. Built with Rust + Tauri.
</p>

<p align="center">
  <img alt="Tauri" src="https://img.shields.io/badge/Tauri-2.x-FFC131?logo=tauri&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img alt="Rust" src="https://img.shields.io/badge/Rust-2021-000000?logo=rust&logoColor=white" />
  <img alt="macOS" src="https://img.shields.io/badge/macOS-13+-999999?logo=apple&logoColor=white" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue" />
</p>

<p align="center">
  <img src="screenshot.png" alt="Glacier terminal — auto-tiled panes, file icons, custom background, live themes" width="900" />
</p>

---

## What makes Glacier different?

Most terminal apps feel like they were built twenty years ago — because they were. iTerm2 is a settings labyrinth. Warp requires an account. Terminal.app is Terminal.app. Glacier is something else entirely: a **native macOS terminal that works the second you open it**, with real features you'll actually use every day.

### Auto-tiling panes that don't suck

Press `⌘ D`. Your pane splits — no config, no key chords, no `tmux` manual. Drag the dividers anywhere. Split again. Keep going. The layout is stored as a binary tree and resizes intelligently. It feels like a modern editor, not a terminal emulator from 1992.

### Inline autocomplete — fish-style, for every shell

Type a command. Ghost text appears from your shell history and completions. Press `Tab` or `→` to accept it, or keep typing to narrow further. Works in **Fish, Zsh, and Bash** — automatically. No plugins to install, no shell config to touch. Glacier's shell integration is injected at spawn time via environment variables. Your `.zshrc` and `.bashrc` stay pristine.

### File icons, day one

`ls` and you see file-type icons. `glacier` bundles [`lsd`](https://github.com/lsd-rs/lsd) — a modern, colorful `ls` replacement — inside the app. No Homebrew, no font patching, no Nerd Font setup. The symbols font is bundled too. Your first command already looks polished.

### Terminal, your way

- **Four built-in themes** — Tokyo Night, Catppuccin Mocha, Gruvbox Dark, One Dark. Switch live with one click. Custom themes supported.
- **Custom background images** — set any photo or wallpaper as your terminal background with adjustable opacity. Semi-transparent terminals that look gorgeous.
- **Any font you want** — pick from popular monospace fonts or type a custom name. Size, cursor style, blink, ligatures — all adjustable live, no restart needed.

### Clickable paths. Clickable URLs. No plugins.

`⌘+click` any file path to reveal it in Finder. `⌘+click` any URL to open it in your browser. Paths are validated against the filesystem before opening — you won't get false positives. The link provider runs directly inside xterm.js's buffer scanner, so it works with zero lag.

### Copy and paste that behaves like a Mac app

Select text → `⌘ C` copies. `⌘ V` pastes with full bracketed paste support. `⌘ C` with no selection sends `SIGINT` — exactly what you'd expect. A copy button floats next to your selection so you always know what's captured. No arcane keybindings to memorize.

### Built-in help, not a wiki page

Press `F1`. Every shortcut appears in a clean overlay inside the app. No browser tabs, no search, no external docs. It's right there when you need it.

---

## Install

```
1. Download the latest .dmg from Releases
2. Drag Glacier to Applications
3. Open it
```

**That's it.** No Rust. No Node.js. No Homebrew. Glacier is a single self-contained `.app` bundle. It ships everything it needs — shell integration, icon fonts, `lsd` — inside the bundle.

**Requirements:** macOS 13+ (Apple Silicon)

**First-launch Gatekeeper note:** Glacier isn't code-signed with an Apple Developer certificate yet (coming soon). macOS may show a "damaged" warning. Fix it instantly:

```bash
xattr -cr /Applications/Glacier.app
```

Then open normally. This is a one-time step until proper signing ships.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌘ D` | Split pane (auto-direction) |
| `⌘ W` | Close active pane |
| `⌘ T` | New tab |
| `⌘ ,` | Open settings |
| `⌘ C` | Copy (no selection → SIGINT, with selection → copy) |
| `⌘ V` | Paste (bracketed paste) |
| `⌘+click` | Open path in Finder / URL in browser |
| `Tab` / `→` | Accept autocomplete suggestion |
| `Enter` | Accept suggestion + run command |
| `Esc` | Dismiss autocomplete / close panel |
| `F1` | Keyboard shortcuts help |

---

## Under the Hood

| Layer | Technology |
|---|---|
| App shell | Tauri 2.x (Rust) — not Electron |
| UI | React 19 + TypeScript + Vite 6 |
| Terminal renderer | xterm.js 5.3 + Canvas renderer |
| PTY | `portable-pty` (async Tokio) |
| State | Zustand 5 + Immer |
| Layout engine | `allotment` (binary tree split model) |
| Settings | `tauri-plugin-store` (JSON on disk) |

### Architecture worth mentioning

- **Streaming OSC parser** — a custom Rust state machine strips and interprets OSC sequences (CWD tracking `OSC 7`, autocomplete hints `OSC 684`, semantic prompts `OSC 133`) from the PTY stream in real time. No buffering, no regex, no overhead.
- **Base64-safe IPC** — raw PTY bytes are base64-encoded across the Tauri IPC bridge. Incomplete UTF-8 sequences at chunk boundaries never corrupt terminal state.
- **Zero system modification** — shell integration scripts live in `~/.config/glacier/` and are injected via `ZDOTDIR`, `--rcfile`, and `--init-command`. Your actual dotfiles are never touched.
- **Persistent terminal registry** — xterm.js instances survive React re-mounts. Splitting a pane doesn't destroy your scrollback. The container is detached and re-attached, not re-created.

---

## Development

```bash
npm install
npm run tauri dev       # hot reload for Rust + TypeScript
npm run tauri build     # release DMG
```

Requires Rust and Node.js 20+.

---

## Roadmap

- [x] PTY core (create, write, resize, kill sessions)
- [x] Auto-tiling pane tree with draggable dividers
- [x] Shell integration (Fish, Zsh, Bash) — CWD tracking, autocomplete
- [x] Inline autocomplete with ghost text
- [x] Cmd+click paths (Finder) and URLs (browser)
- [x] Copy/paste with bracketed paste
- [x] Live theme, font, and background settings
- [x] File icons via bundled `lsd`
- [x] Built-in help panel
- [x] High-contrast selection highlighting
- [ ] GPU-accelerated WebGL renderer
- [ ] Search / find in terminal
- [ ] Custom keybindings
- [ ] Windows / Linux support
- [ ] Apple Developer code signing

---

## Releasing

```bash
# Bump version in tauri.conf.json + Cargo.toml
npm run tauri build
# DMG lands in src-tauri/target/release/bundle/dmg/
```

Attach to a GitHub Release. Homebrew Cask coming once the app stabilizes.

---

## License

MIT. Bundled [`lsd`](https://github.com/lsd-rs/lsd) is Apache 2.0 — license and binary included in `src-tauri/resources/lsd/`.
