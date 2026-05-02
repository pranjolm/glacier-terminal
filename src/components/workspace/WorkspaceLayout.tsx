import { useEffect, useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useTerminalStore } from '../../store/terminalStore';
import { destroyEntry } from '../../lib/terminalRegistry';
import TabBar from './TabBar';
import PaneTree from './PaneTree';
import SettingsPanel from '../settings/SettingsPanel';
import HelpPanel from '../help/HelpPanel';

export default function WorkspaceLayout() {
  const {
    currentTab, updateSessionId, splitPane, autoSplitDirection,
    closePane, addTab,
  } = useWorkspaceStore();
  const { removeSession } = useTerminalStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Subscribe to activePaneId so keyboard shortcut always uses the current pane
  const activePaneId = useWorkspaceStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId);
    return tab?.activePaneId ?? '';
  });

  // Bootstrap the first session on mount
  useEffect(() => {
    const tab = currentTab();
    if (!tab) return;
    const leaf = tab.root.type === 'leaf' ? tab.root : null;
    if (!leaf || leaf.sessionId !== '__placeholder__') return;

    invoke<string>('create_session', { cwd: null, shell: null, cols: 80, rows: 24 })
      .then((sessionId) => updateSessionId(leaf.id, sessionId))
      .catch(console.error);
  }, []);

  // F1 — Help (does not require metaKey)
  const handleF1 = useCallback((e: KeyboardEvent) => {
    if (e.key === 'F1') {
      e.preventDefault();
      setHelpOpen(true);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleF1);
    return () => window.removeEventListener('keydown', handleF1);
  }, [handleF1]);

  // Global keyboard shortcuts — activePaneId is reactive via the selector above
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!e.metaKey) return;

      if (e.key === 'd') {
        e.preventDefault();
        // Auto-tile: alternate split direction based on parent's direction
        const dir = autoSplitDirection(activePaneId);
        invoke<string>('create_session', { cwd: null, shell: null, cols: 80, rows: 24 })
          .then((sid) => splitPane(activePaneId, dir, sid))
          .catch(console.error);
      } else if (e.key === 'w') {
        e.preventDefault();
        // Close active pane and its session
        const tab = useWorkspaceStore.getState().currentTab();
        if (!tab) return;
        const findNode = (node: any, id: string): any => {
          if (node.id === id) return node;
          if (node.type === 'split') {
            return findNode(node.children[0], id) || findNode(node.children[1], id);
          }
          return null;
        };
        const activeNode = findNode(tab.root, activePaneId);
        if (!activeNode || activeNode.type !== 'leaf') return;
        const sessionId = activeNode.sessionId;
        if (sessionId && sessionId !== '__placeholder__') {
          invoke('kill_session', { sessionId }).catch(() => {});
          destroyEntry(sessionId);
          removeSession(sessionId);
        }
        closePane(activePaneId);
      } else if (e.key === 't') {
        e.preventDefault();
        invoke<string>('create_session', { cwd: null, shell: null, cols: 80, rows: 24 })
          .then((sid) => addTab(sid))
          .catch(console.error);
      } else if (e.key === ',') {
        e.preventDefault();
        setSettingsOpen(true);
      }
    },
    [activePaneId, autoSplitDirection, splitPane, closePane, addTab, removeSession],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const tab = currentTab();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <TabBar
        onSettingsOpen={() => setSettingsOpen(true)}
        onHelpOpen={() => setHelpOpen(true)}
      />
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {tab && <PaneTree node={tab.root} />}
      </div>
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <HelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
