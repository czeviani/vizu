'use client';
import { useRef, useCallback, useState } from 'react';
import type { SlideElement, TextElement } from '@/types/slide';
import { TextEl } from './elements/TextEl';
import { ShapeEl } from './elements/ShapeEl';
import { ImageEl } from './elements/ImageEl';
import { IconEl } from './elements/IconEl';
import { TableEl } from './elements/TableEl';

const HANDLE_SIZE = 8;
const SNAP_THRESHOLD = 8; // px

interface SnapLine {
  type: 'h' | 'v';
  pos: number;
}

interface Props {
  element: SlideElement;
  selected: boolean;
  scale: number;
  onSelect: (e: React.MouseEvent) => void;
  onUpdate: (props: Partial<SlideElement>) => void;
  onUpdateText?: (content: string) => void;
  /** Other elements in the slide for snap-guide computation */
  otherElements?: SlideElement[];
  onSnapLines?: (lines: SnapLine[]) => void;
  onEditingChange?: (editing: boolean) => void;
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

const handles: { id: ResizeHandle; cursor: string; style: React.CSSProperties }[] = [
  { id: 'nw', cursor: 'nw-resize', style: { top: -4, left: -4 } },
  { id: 'n', cursor: 'n-resize', style: { top: -4, left: '50%', transform: 'translateX(-50%)' } },
  { id: 'ne', cursor: 'ne-resize', style: { top: -4, right: -4 } },
  { id: 'e', cursor: 'e-resize', style: { top: '50%', right: -4, transform: 'translateY(-50%)' } },
  { id: 'se', cursor: 'se-resize', style: { bottom: -4, right: -4 } },
  { id: 's', cursor: 's-resize', style: { bottom: -4, left: '50%', transform: 'translateX(-50%)' } },
  { id: 'sw', cursor: 'sw-resize', style: { bottom: -4, left: -4 } },
  { id: 'w', cursor: 'w-resize', style: { top: '50%', left: -4, transform: 'translateY(-50%)' } },
];

function computeSnap(
  x: number,
  y: number,
  w: number,
  h: number,
  others: SlideElement[]
): { x: number; y: number; lines: SnapLine[] } {
  let bestX = x, bestDX = SNAP_THRESHOLD + 1;
  let bestY = y, bestDY = SNAP_THRESHOLD + 1;
  const vLines: number[] = [];
  const hLines: number[] = [];

  for (const o of others) {
    const oL = o.x, oR = o.x + o.width, oCX = o.x + o.width / 2;
    const oT = o.y, oB = o.y + o.height, oCY = o.y + o.height / 2;

    const xCandidates: [number, number, number][] = [
      [x, oL, oL], [x + w, oR, oR], [x + w / 2, oCX, oCX],
      [x, oR, oR], [x + w, oL, oL],
    ];
    for (const [elPt, oPt, line] of xCandidates) {
      const d = Math.abs(elPt - oPt);
      if (d < bestDX) {
        bestDX = d;
        bestX = x + (oPt - elPt);
        vLines.length = 0;
        vLines.push(line);
      } else if (d === bestDX && bestDX < SNAP_THRESHOLD) {
        vLines.push(line);
      }
    }

    const yCandidates: [number, number, number][] = [
      [y, oT, oT], [y + h, oB, oB], [y + h / 2, oCY, oCY],
      [y, oB, oB], [y + h, oT, oT],
    ];
    for (const [elPt, oPt, line] of yCandidates) {
      const d = Math.abs(elPt - oPt);
      if (d < bestDY) {
        bestDY = d;
        bestY = y + (oPt - elPt);
        hLines.length = 0;
        hLines.push(line);
      } else if (d === bestDY && bestDY < SNAP_THRESHOLD) {
        hLines.push(line);
      }
    }
  }

  const lines: SnapLine[] = [
    ...(bestDX <= SNAP_THRESHOLD ? vLines.map((pos) => ({ type: 'v' as const, pos })) : []),
    ...(bestDY <= SNAP_THRESHOLD ? hLines.map((pos) => ({ type: 'h' as const, pos })) : []),
  ];

  return {
    x: bestDX <= SNAP_THRESHOLD ? bestX : x,
    y: bestDY <= SNAP_THRESHOLD ? bestY : y,
    lines,
  };
}

export function CanvasElement({
  element: el,
  selected,
  scale,
  onSelect,
  onUpdate,
  onUpdateText,
  otherElements,
  onSnapLines,
  onEditingChange,
}: Props) {
  const [editing, setEditing] = useState(false);
  const dragStart = useRef<{ mx: number; my: number; ex: number; ey: number } | null>(null);
  const resizeStart = useRef<{
    mx: number; my: number;
    x: number; y: number; w: number; h: number;
    handle: ResizeHandle;
  } | null>(null);

  const setEditingState = useCallback(
    (v: boolean) => {
      setEditing(v);
      onEditingChange?.(v);
    },
    [onEditingChange]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (el.locked) return;
      if (editing) return;
      e.stopPropagation();
      onSelect(e);

      dragStart.current = { mx: e.clientX, my: e.clientY, ex: el.x, ey: el.y };

      const onMove = (ev: MouseEvent) => {
        if (!dragStart.current) return;
        const dx = (ev.clientX - dragStart.current.mx) / scale;
        const dy = (ev.clientY - dragStart.current.my) / scale;
        let nx = dragStart.current.ex + dx;
        let ny = dragStart.current.ey + dy;

        if (otherElements && otherElements.length > 0) {
          const snapped = computeSnap(nx, ny, el.width, el.height, otherElements);
          nx = snapped.x;
          ny = snapped.y;
          onSnapLines?.(snapped.lines);
        }

        onUpdate({ x: nx, y: ny });
      };

      const onUp = () => {
        dragStart.current = null;
        onSnapLines?.([]);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [el, editing, scale, onSelect, onUpdate, otherElements, onSnapLines]
  );

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, handle: ResizeHandle) => {
      e.stopPropagation();
      resizeStart.current = {
        mx: e.clientX, my: e.clientY,
        x: el.x, y: el.y, w: el.width, h: el.height,
        handle,
      };

      const onMove = (ev: MouseEvent) => {
        if (!resizeStart.current) return;
        const r = resizeStart.current;
        const dx = (ev.clientX - r.mx) / scale;
        const dy = (ev.clientY - r.my) / scale;
        let { x, y, w, h } = r;

        if (handle.includes('e')) w = Math.max(24, r.w + dx);
        if (handle.includes('s')) h = Math.max(16, r.h + dy);
        if (handle.includes('w')) { x = r.x + dx; w = Math.max(24, r.w - dx); }
        if (handle.includes('n')) { y = r.y + dy; h = Math.max(16, r.h - dy); }

        onUpdate({ x, y, width: w, height: h });
      };

      const onUp = () => {
        resizeStart.current = null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [el, scale, onUpdate]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (el.type === 'text') setEditingState(true);
    },
    [el.type, setEditingState]
  );

  const handleBlur = useCallback(() => {
    setEditingState(false);
  }, [setEditingState]);

  return (
    <div
      style={{
        position: 'absolute',
        left: el.x,
        top: el.y,
        width: el.width,
        height: el.height,
        transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
        opacity: el.opacity,
        zIndex: el.zIndex,
        visibility: el.visible ? 'visible' : 'hidden',
        boxSizing: 'border-box',
        outline: selected ? '2px solid #3b82f6' : 'none',
        outlineOffset: 1,
        cursor: el.locked ? 'default' : editing ? 'text' : 'move',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onBlur={handleBlur}
    >
      {el.type === 'text' && (
        <TextEl
          element={el as TextElement}
          selected={selected}
          editing={editing}
          onStartEdit={() => setEditingState(true)}
          onChange={(content) => onUpdateText?.(content)}
          onExitEdit={() => setEditingState(false)}
        />
      )}
      {el.type === 'shape' && <ShapeEl element={el as never} />}
      {el.type === 'image' && <ImageEl element={el as never} />}
      {el.type === 'icon' && <IconEl element={el as never} />}
      {el.type === 'table' && <TableEl element={el as never} />}

      {selected && !el.locked && (
        <>
          {handles.map((h) => (
            <div
              key={h.id}
              onMouseDown={(e) => handleResizeMouseDown(e, h.id)}
              style={{
                position: 'absolute',
                width: HANDLE_SIZE,
                height: HANDLE_SIZE,
                background: '#ffffff',
                border: '1.5px solid #3b82f6',
                borderRadius: 2,
                cursor: h.cursor,
                zIndex: 1000,
                ...h.style,
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}
