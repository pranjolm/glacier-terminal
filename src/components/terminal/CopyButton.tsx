import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';

interface Props {
  terminal: Terminal | null;
}

export default function CopyButton({ terminal }: Props) {
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!terminal) return;

    const disposable = terminal.onSelectionChange(() => {
      const sel = terminal.getSelection();
      if (!sel) {
        setPos(null);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const selPos = (terminal as any).getSelectionPosition?.() ?? null;
      if (!selPos) return;

      const core = (terminal as unknown as {
        _core: { _renderService: { dimensions: { actualCellWidth: number; actualCellHeight: number } } };
      })._core;

      if (!core?._renderService?.dimensions) return;
      const { actualCellWidth, actualCellHeight } = core._renderService.dimensions;
      if (!actualCellWidth || !actualCellHeight) return;

      const endRow = selPos.end.y - terminal.buffer.active.viewportY;
      const left = selPos.end.x * actualCellWidth;
      const top = (endRow + 1) * actualCellHeight + 4;
      if (Number.isFinite(left) && Number.isFinite(top)) {
        setPos({ left, top });
      }
    });

    return () => disposable.dispose();
  }, [terminal]);

  const handleCopy = async () => {
    if (!terminal) return;
    await navigator.clipboard.writeText(terminal.getSelection());
    setCopied(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setCopied(false);
      setPos(null);
    }, 1200);
  };

  if (!pos) return null;

  return (
    <button
      onClick={handleCopy}
      style={{
        position: 'absolute',
        left: pos.left,
        top: pos.top,
        zIndex: 20,
        padding: '2px 8px',
        background: 'var(--gl-ui-accent)',
        color: '#fff',
        border: 'none',
        borderRadius: 4,
        fontSize: 11,
        cursor: 'pointer',
        fontFamily: 'system-ui, sans-serif',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      }}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}
