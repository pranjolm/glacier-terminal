import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';

interface Props {
  terminal: Terminal | null;
  suggestion: string;
}

export default function GhostText({ terminal, suggestion }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!terminal) return;

    const updatePosition = () => {
      if (!ref.current || !suggestion) return;

      const core = (terminal as any)._core;
      const dims = core?._renderService?.dimensions;
      if (!dims) return;

      const { actualCellWidth, actualCellHeight } = dims;
      const { x, y } = core.buffer; // absolute coordinates
      const scrollOffset = terminal.buffer.active.viewportY;

      const left = x * actualCellWidth;
      const top = (y - scrollOffset) * actualCellHeight;

      if (Number.isFinite(left) && Number.isFinite(top)) {
        Object.assign(ref.current.style, {
          left: `${left}px`,
          top: `${top}px`,
          height: `${actualCellHeight}px`,
          fontSize: `${terminal.options.fontSize ?? 14}px`,
          fontFamily: terminal.options.fontFamily || 'monospace',
          lineHeight: `${actualCellHeight}px`,
        });
      }
    };

    updatePosition();
    const d1 = terminal.onCursorMove(updatePosition);
    const d2 = terminal.onScroll(updatePosition);

    return () => {
      d1.dispose();
      d2.dispose();
    };
  }, [terminal, suggestion]);

  if (!suggestion) return null;

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        opacity: 0.4,
        color: 'var(--gl-fg)',
        whiteSpace: 'pre',
        zIndex: 10,
      }}
    >
      {suggestion}
    </div>
  );
}
