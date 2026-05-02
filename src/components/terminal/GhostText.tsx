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
      const dims = core?._renderService?.dimensions ?? core?._viewport?._renderer?.dimensions;
      if (!dims) return;

      // xterm 5.x: dimensions.css.cell.width / .height
      const cellWidth = dims?.css?.cell?.width ?? 0;
      const cellHeight = dims?.css?.cell?.height ?? 0;

      // Use public API for cursor position
      const activeBuffer = terminal.buffer.active;
      const x = activeBuffer.cursorX;
      const y = activeBuffer.cursorY;
      const scrollOffset = activeBuffer.viewportY;

      const left = x * cellWidth;
      const top = (y - scrollOffset) * cellHeight;

      if (Number.isFinite(left) && Number.isFinite(top) && cellWidth > 0 && cellHeight > 0) {
        Object.assign(ref.current.style, {
          left: `${left}px`,
          top: `${top}px`,
          height: `${cellHeight}px`,
          fontSize: `${terminal.options.fontSize ?? 14}px`,
          fontFamily: terminal.options.fontFamily || 'monospace',
          lineHeight: `${cellHeight}px`,
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
