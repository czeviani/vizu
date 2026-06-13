'use client';
import { useRef, useCallback, useState } from 'react';
import type { SlideElement, TextElement } from '@/types/slide';
import { TextEl } from './elements/TextEl';
import { ShapeEl } from './elements/ShapeEl';
import { ImageEl } from './elements/ImageEl';
import { IconEl } from './elements/IconEl';
import { TableEl } from './elements/TableEl';

const HANDLE_SIZE = 8;

interface Props {
  element: SlideElement;
  selected: boolean;
  scale: number;
  onSelect: (e: React.MouseEvent) => void;
  onUpdate: (props: Partial<SlideElement>) => void;
  onUpdateText?: (content: string) => void;
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

export function CanvasElement({ element: el, selected, scale, onSelect, onUpdate, onUpdateText }: Props) {
  const [editing, setEditing] = useState(false);
  const dragStart = useRef<{ mx: number; my: number; ex: number; ey: number } | null>(null);
  const resizeStart = useRef<{
    mx: number; my: number;
    x: number; y: number; w: number; h: number;
    handle: ResizeHandle;
  } | null>(null);

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
        onUpdate({ x: dragStart.current.ex + dx, y: dragStart.current.ey + dy });
      };

      const onUp = () => {
        dragStart.current = null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [el, editing, scale, onSelect, onUpdate]
  );

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, handle: ResizeHandle) => {
      e.stopPropagation();
      resizeStart.current = {
        mx: e.clientX,
        my: e.clientY,
        x: el.x,
        y: el.y,
        w: el.width,
        h: el.height,
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
      if (el.type === 'text') setEditing(true);
    },
    [el.type]
  );

  const handleBlur = useCallback(() => {
    setEditing(false);
  }, []);

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
          onStartEdit={() => setEditing(true)}
          onChange={(content) => onUpdateText?.(content)}
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
