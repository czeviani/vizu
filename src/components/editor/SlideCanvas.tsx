'use client';
import { useCallback, useRef, useState, useEffect } from 'react';
import type { Slide, SlideElement, Presentation } from '@/types/slide';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '@/types/slide';
import { CanvasElement } from './CanvasElement';

interface Props {
  slide: Slide | null;
  presentation: Presentation;
  selectedIds: string[];
  onSelectIds: (ids: string[]) => void;
  onUpdateElement: (elementId: string, updater: (e: SlideElement) => SlideElement) => void;
  onUpdateSlide: (updater: (s: Slide) => Slide) => void;
  scale: number;
}

export function SlideCanvas({
  slide,
  presentation,
  selectedIds,
  onSelectIds,
  onUpdateElement,
  onUpdateSlide,
  scale,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<{ sx: number; sy: number } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== containerRef.current) return;
      e.preventDefault();
      if (!e.shiftKey) onSelectIds([]);

      const rect = containerRef.current!.getBoundingClientRect();
      const sx = (e.clientX - rect.left) / scale;
      const sy = (e.clientY - rect.top) / scale;
      selectionRef.current = { sx, sy };

      const onMove = (ev: MouseEvent) => {
        if (!selectionRef.current) return;
        const cx = (ev.clientX - rect.left) / scale;
        const cy = (ev.clientY - rect.top) / scale;
        setSelectionBox({
          x: Math.min(cx, selectionRef.current.sx),
          y: Math.min(cy, selectionRef.current.sy),
          w: Math.abs(cx - selectionRef.current.sx),
          h: Math.abs(cy - selectionRef.current.sy),
        });
      };

      const onUp = (ev: MouseEvent) => {
        if (selectionBox && slide) {
          const box = selectionBox;
          const hits = slide.elements
            .filter((el) => {
              return (
                el.x < box.x + box.w &&
                el.x + el.width > box.x &&
                el.y < box.y + box.h &&
                el.y + el.height > box.y
              );
            })
            .map((e) => e.id);
          if (hits.length > 0) onSelectIds(hits);
        }
        selectionRef.current = null;
        setSelectionBox(null);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [scale, onSelectIds, slide, selectionBox]
  );

  // Keyboard delete
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!slide || selectedIds.length === 0) return;
      if (['Delete', 'Backspace'].includes(e.key) && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        // Only delete if target is canvas area
        if (document.activeElement === document.body || containerRef.current?.contains(document.activeElement)) {
          onUpdateSlide((s) => ({
            ...s,
            elements: s.elements.filter((el) => !selectedIds.includes(el.id)),
          }));
          onSelectIds([]);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [slide, selectedIds, onUpdateSlide, onSelectIds]);

  const bg = slide?.background;
  let backgroundStyle: React.CSSProperties = {};
  if (bg?.type === 'color') {
    backgroundStyle = { background: bg.color };
  } else if (bg?.type === 'gradient' && bg.gradient) {
    backgroundStyle = {
      background: `linear-gradient(${bg.gradient.direction}deg, ${bg.gradient.from}, ${bg.gradient.to})`,
    };
  } else if (bg?.type === 'image' && bg.image) {
    backgroundStyle = {
      backgroundImage: `url(${bg.image})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }

  const sorted = slide
    ? [...slide.elements].filter((e) => e.visible).sort((a, b) => a.zIndex - b.zIndex)
    : [];

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        ...backgroundStyle,
        overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
        borderRadius: 2,
        flexShrink: 0,
      }}
      onMouseDown={handleCanvasMouseDown}
    >
      {!slide && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            fontSize: 18,
          }}
        >
          Select a slide
        </div>
      )}

      {sorted.map((el) => (
        <CanvasElement
          key={el.id}
          element={el}
          selected={selectedIds.includes(el.id)}
          scale={scale}
          onSelect={(e) => {
            if (e.shiftKey) {
              onSelectIds(
                selectedIds.includes(el.id)
                  ? selectedIds.filter((id) => id !== el.id)
                  : [...selectedIds, el.id]
              );
            } else {
              onSelectIds([el.id]);
            }
          }}
          onUpdate={(props) => {
            onUpdateElement(el.id, (prev) => ({ ...prev, ...props } as SlideElement));
          }}
          onUpdateText={(content) => {
            onUpdateElement(el.id, (prev) => ({ ...prev, content } as SlideElement));
          }}
        />
      ))}

      {selectionBox && (
        <div
          style={{
            position: 'absolute',
            left: selectionBox.x,
            top: selectionBox.y,
            width: selectionBox.w,
            height: selectionBox.h,
            border: '1.5px dashed #3b82f6',
            background: 'rgba(59,130,246,0.08)',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        />
      )}
    </div>
  );
}
