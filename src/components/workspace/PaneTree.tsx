import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { PaneNode } from '../../types/pane';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useTerminalStore } from '../../store/terminalStore';
import SplitContainer from './SplitContainer';
import TerminalPane from '../terminal/TerminalPane';
import { destroyEntry } from '../../lib/terminalRegistry';

interface Props {
  node: PaneNode;
}

export default function PaneTree({ node }: Props) {
  const { splitPane, closePane, setActivePaneId, autoSplitDirection } = useWorkspaceStore();
  const { removeSession } = useTerminalStore();

  // Subscribe so isActive highlights update when focus changes
  const activePaneId = useWorkspaceStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId);
    return tab?.activePaneId;
  });

  const handleSplit = useCallback(
    async (paneId: string, direction: 'h' | 'v' | 'auto') => {
      const dir = direction === 'auto' ? autoSplitDirection(paneId) : direction;
      const sessionId = await invoke<string>('create_session', {
        cwd: null, shell: null, cols: 80, rows: 24,
      });
      splitPane(paneId, dir, sessionId);
    },
    [splitPane, autoSplitDirection],
  );

  const handleClose = useCallback(
    async (paneId: string, sessionId: string) => {
      await invoke('kill_session', { sessionId }).catch(() => {});
      destroyEntry(sessionId);
      removeSession(sessionId);
      closePane(paneId);
    },
    [closePane, removeSession],
  );

  if (node.type === 'split') {
    return (
      <SplitContainer node={node}>
        {[
          <PaneTree key={node.children[0].id} node={node.children[0]} />,
          <PaneTree key={node.children[1].id} node={node.children[1]} />,
        ]}
      </SplitContainer>
    );
  }

  const { id: paneId, sessionId } = node;

  return (
    <TerminalPane
      key={sessionId}
      paneId={paneId}
      sessionId={sessionId}
      isActive={activePaneId === paneId}
      onFocus={() => setActivePaneId(paneId)}
      onClose={() => handleClose(paneId, sessionId)}
      onSplitAuto={() => handleSplit(paneId, 'auto')}
      onSplitH={() => handleSplit(paneId, 'h')}
      onSplitV={() => handleSplit(paneId, 'v')}
    />
  );
}
