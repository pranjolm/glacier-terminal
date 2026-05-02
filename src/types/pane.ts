export type PaneDirection = 'h' | 'v';

export interface PaneLeaf {
  type: 'leaf';
  id: string;
  sessionId: string;
}

export interface PaneSplit {
  type: 'split';
  id: string;
  direction: PaneDirection;
  children: [PaneNode, PaneNode];
  sizes: [number, number];
}

export type PaneNode = PaneLeaf | PaneSplit;

export interface Tab {
  id: string;
  title: string;
  root: PaneNode;
  activePaneId: string;
}
