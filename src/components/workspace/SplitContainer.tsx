import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { PaneSplit } from '../../types/pane';
import { useWorkspaceStore } from '../../store/workspaceStore';

interface Props {
  node: PaneSplit;
  children: [React.ReactNode, React.ReactNode];
}

export default function SplitContainer({ node, children }: Props) {
  const { updatePaneSizes } = useWorkspaceStore();

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Allotment
        vertical={node.direction === 'v'}
        defaultSizes={node.sizes}
        onChange={(sizes) => {
          if (sizes.length === 2) {
            const total = sizes[0] + sizes[1];
            updatePaneSizes(node.id, [
              (sizes[0] / total) * 100,
              (sizes[1] / total) * 100,
            ]);
          }
        }}
      >
        <Allotment.Pane>{children[0]}</Allotment.Pane>
        <Allotment.Pane>{children[1]}</Allotment.Pane>
      </Allotment>
    </div>
  );
}
