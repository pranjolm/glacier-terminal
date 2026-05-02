import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { PaneNode, PaneLeaf, PaneSplit, Tab } from '../types/pane';
import { nanoid } from '../lib/nanoid';

interface WorkspaceStore {
  tabs: Tab[];
  activeTabId: string;
  activePane: () => PaneLeaf | null;
  currentTab: () => Tab | undefined;
  autoSplitDirection: (paneId: string) => 'h' | 'v';
  addTab: (sessionId: string) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  setActivePaneId: (paneId: string) => void;
  splitPane: (paneId: string, direction: 'h' | 'v', newSessionId: string) => void;
  closePane: (paneId: string) => string | null;
  updatePaneSizes: (paneId: string, sizes: [number, number]) => void;
  updateSessionId: (paneId: string, sessionId: string) => void;
}

function makeLeaf(sessionId: string): PaneLeaf {
  return { type: 'leaf', id: nanoid(), sessionId };
}

/** Returns the immediate PaneSplit parent of a node, or null if it's the root. */
function findParent(root: PaneNode, id: string): PaneSplit | null {
  if (root.type !== 'split') return null;
  if (root.children[0].id === id || root.children[1].id === id) return root;
  return findParent(root.children[0], id) ?? findParent(root.children[1], id);
}

function findNode(root: PaneNode, id: string): PaneNode | null {
  if (root.id === id) return root;
  if (root.type === 'split') {
    return findNode(root.children[0], id) || findNode(root.children[1], id);
  }
  return null;
}

function replaceNode(root: PaneNode, id: string, replacement: PaneNode): PaneNode {
  if (root.id === id) return replacement;
  if (root.type === 'split') {
    return {
      ...root,
      children: [
        replaceNode(root.children[0], id, replacement),
        replaceNode(root.children[1], id, replacement),
      ],
    };
  }
  return root;
}

function removeNode(root: PaneNode, id: string): PaneNode | null {
  if (root.id === id) return null;
  if (root.type !== 'split') return root;
  const [a, b] = root.children;
  if (a.id === id) return b;
  if (b.id === id) return a;
  const newA = removeNode(a, id);
  const newB = removeNode(b, id);
  if (!newA) return newB;
  if (!newB) return newA;
  return { ...root, children: [newA, newB] };
}

function firstLeaf(root: PaneNode): PaneLeaf {
  if (root.type === 'leaf') return root;
  return firstLeaf(root.children[0]);
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  immer((set, get) => {
    const makeInitialTab = (sessionId: string): Tab => {
      const leaf = makeLeaf(sessionId);
      return { id: nanoid(), title: 'Terminal', root: leaf, activePaneId: leaf.id };
    };

    const initialTab = makeInitialTab('__placeholder__');

    return {
      tabs: [initialTab],
      activeTabId: initialTab.id,

      currentTab: () => get().tabs.find((t) => t.id === get().activeTabId),

      activePane: () => {
        const tab = get().currentTab();
        if (!tab) return null;
        const node = findNode(tab.root, tab.activePaneId);
        return node?.type === 'leaf' ? node : null;
      },

      autoSplitDirection: (paneId: string) => {
        const tab = get().tabs.find((t) => t.id === get().activeTabId);
        if (!tab) return 'h';
        const parent = findParent(tab.root, paneId);
        // Alternate directions to build a grid: root starts horizontal,
        // each subsequent split goes the other way.
        if (!parent) return 'h';
        return parent.direction === 'h' ? 'v' : 'h';
      },

      addTab: (sessionId) =>
        set((s) => {
          const tab = makeInitialTab(sessionId);
          s.tabs.push(tab);
          s.activeTabId = tab.id;
        }),

      closeTab: (tabId) =>
        set((s) => {
          s.tabs = s.tabs.filter((t) => t.id !== tabId);
          if (s.activeTabId === tabId && s.tabs.length > 0) {
            s.activeTabId = s.tabs[s.tabs.length - 1].id;
          }
        }),

      setActiveTab: (tabId) => set((s) => { s.activeTabId = tabId; }),

      setActivePaneId: (paneId) =>
        set((s) => {
          const tab = s.tabs.find((t) => t.id === s.activeTabId);
          if (tab) tab.activePaneId = paneId;
        }),

      splitPane: (paneId, direction, newSessionId) =>
        set((s) => {
          const tab = s.tabs.find((t) => t.id === s.activeTabId);
          if (!tab) return;
          const target = findNode(tab.root, paneId);
          if (!target || target.type !== 'leaf') return;
          const newLeaf = makeLeaf(newSessionId);
          const split: PaneSplit = {
            type: 'split',
            id: nanoid(),
            direction,
            children: [target, newLeaf],
            sizes: [50, 50],
          };
          tab.root = replaceNode(tab.root, paneId, split) as PaneNode;
          tab.activePaneId = newLeaf.id;
        }),

      closePane: (paneId) => {
        let siblingSessionId: string | null = null;
        set((s) => {
          const tab = s.tabs.find((t) => t.id === s.activeTabId);
          if (!tab) return;
          const newRoot = removeNode(tab.root, paneId);
          if (!newRoot) return;
          tab.root = newRoot;
          const sibling = firstLeaf(newRoot);
          siblingSessionId = sibling.sessionId;
          tab.activePaneId = sibling.id;
        });
        return siblingSessionId;
      },

      updatePaneSizes: (paneId, sizes) =>
        set((s) => {
          const tab = s.tabs.find((t) => t.id === s.activeTabId);
          if (!tab) return;
          const node = findNode(tab.root, paneId) as PaneSplit | null;
          if (node?.type === 'split') node.sizes = sizes;
        }),

      updateSessionId: (paneId, sessionId) =>
        set((s) => {
          const tab = s.tabs.find((t) => t.id === s.activeTabId);
          if (!tab) return;
          const node = findNode(tab.root, paneId);
          if (node?.type === 'leaf') (node as PaneLeaf).sessionId = sessionId;
        }),
    };
  })
);
