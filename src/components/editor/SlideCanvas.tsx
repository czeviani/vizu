'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { Slide, SlideElement, ImageElement, Presentation } from '@/types/slide';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '@/types/slide';
import { CanvasElement } from './CanvasElement';
import { t } from '@/lib/i18n';

interface SnapLine {
  type: 'h' | 'v';
  pos: number;
}

interface Props {
  slide: Slide | null;
  presentation: Presentation;
  selectedIds: string[];
  onSelectIds: (ids: string[]) => void;
  onUpdateElement: (elementId: string, updater: (e: SlideElement) => SlideElement) => void;
  onUpdateSlide: (updater: (s: Slide) => Slide) => void;
  onAddElement?: (el: SlideElement) => void;
  scale: number;
  showGrid?: boolean;
  onContextMenu?: (e: React.MouseEvent, clickedElementId: string | null) => void;
}

export function SlideCanvas({
  slide,
  presentation,
  selectedIds,
  onSelectIds,
  onUpdateElement,
  onUpdateSlide,
  onAddElement,
  scale,
  showGrid = false,
  onContextMenu,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<{ sx: number; sy: number } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [snapLines, setSnapLines] = useState<SnapLine[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const editingElementsRef = useRef<Set<string>>(new Set());

  // ── Pan via Espaço + drag ────────────────────────────────────────────────────
  const [isPanning, setIsPanning] = useState(false);
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number; scrollX: number; scrollY: number } | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        const target = e.target as HTMLElement;
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) return;
        e.preventDefault();
        setIsSpaceDown(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpaceDown(false);
        setIsPanning(false);
        setPanStart(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // ── Escape com dupla função ──────────────────────────────────────────────────
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName)) return;

      // Primeiro Escape: sair de edição de texto inline
      const editingEl = document.querySelector('[contenteditable="true"]');
      if (editingEl) {
        (editingEl as HTMLElement).blur();
        return;
      }
      // Segundo Escape: desselecionar
      onSelectIds([]);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onSelectIds]);

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== containerRef.current) return;
      // Se Espaço pressionado, iniciar pan em vez de seleção
      if (isSpaceDown) {
        setIsPanning(true);
        // O contêiner scrollável é o ancestral com overflow:auto (pai do wrapper com transform)
        const scrollable = containerRef.current?.closest('[style*="overflow: auto"]') as HTMLElement | null
          ?? containerRef.current?.parentElement?.parentElement ?? null;
        setPanStart({
          x: e.clientX,
          y: e.clientY,
          scrollX: scrollable?.scrollLeft ?? 0,
          scrollY: scrollable?.scrollTop ?? 0,
        });
        return;
      }
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
            .filter((el) =>
              el.x < box.x + box.w &&
              el.x + el.width > box.x &&
              el.y < box.y + box.h &&
              el.y + el.height > box.y
            )
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
    [scale, onSelectIds, slide, selectionBox, isSpaceDown]
  );

  // Delete/Backspace: only when NOT in a text-editing context
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!slide || selectedIds.length === 0) return;
      const isEditable =
        (e.target as HTMLElement)?.isContentEditable ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement;
      if (['Delete', 'Backspace'].includes(e.key) && !isEditable) {
        onUpdateSlide((s) => ({
          ...s,
          elements: s.elements.filter((el) => !selectedIds.includes(el.id)),
        }));
        onSelectIds([]);
      }
    },
    [slide, selectedIds, onUpdateSlide, onSelectIds]
  );

  // ── Image drag-drop ──────────────────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    const hasFiles = Array.from(e.dataTransfer.types).includes('Files');
    if (!hasFiles) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'));
      if (!file || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const dropX = Math.max(0, (e.clientX - rect.left) / scale);
      const dropY = Math.max(0, (e.clientY - rect.top) / scale);

      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        if (!src) return;
        const imgEl: ImageElement = {
          id: uuid(),
          type: 'image',
          src,
          alt: file.name,
          objectFit: 'cover',
          x: Math.max(0, dropX - 200),
          y: Math.max(0, dropY - 120),
          width: 400,
          height: 240,
          rotation: 0,
          opacity: 1,
          zIndex: 10,
          locked: false,
          visible: true,
          border: { width: 0, color: '', style: 'none', radius: 0 },
          shadow: { enabled: false, x: 0, y: 4, blur: 12, color: 'rgba(0,0,0,0.15)' },
        };
        onAddElement?.(imgEl);
        onSelectIds([imgEl.id]);
      };
      reader.readAsDataURL(file);
    },
    [scale, onAddElement, onSelectIds]
  );

  // ── Background ───────────────────────────────────────────────────────────────
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

  // Grid overlay (20px grid)
  const gridStyle: React.CSSProperties = showGrid
    ? {
        backgroundImage: `
          linear-gradient(to right, rgba(100,116,139,0.15) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(100,116,139,0.15) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }
    : {};

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        position: 'relative',
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        ...backgroundStyle,
        ...gridStyle,
        overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
        borderRadius: 2,
        flexShrink: 0,
        outline: 'none',
        border: isDragOver ? '2.5px dashed #3b82f6' : '2.5px solid transparent',
        transition: 'border-color 0.15s',
        cursor: isPanning ? 'grabbing' : isSpaceDown ? 'grab' : 'default',
      }}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={(e) => {
        if (isPanning && panStart) {
          const scrollable = containerRef.current?.closest('[style*="overflow: auto"]') as HTMLElement | null
            ?? containerRef.current?.parentElement?.parentElement ?? null;
          if (scrollable) {
            scrollable.scrollLeft = panStart.scrollX - (e.clientX - panStart.x);
            scrollable.scrollTop = panStart.scrollY - (e.clientY - panStart.y);
          }
        }
      }}
      onMouseUp={() => {
        if (isPanning) {
          setIsPanning(false);
          setPanStart(null);
        }
      }}
      onContextMenu={(e) => {
        if (onContextMenu) {
          e.preventDefault();
          const target = e.target as HTMLElement;
          const elementEl = target.closest('[data-element-id]');
          const elementId = elementEl?.getAttribute('data-element-id') ?? null;
          onContextMenu(e, elementId);
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
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
          {t.canvas_no_slide}
        </div>
      )}

      {isDragOver && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(59,130,246,0.08)',
            zIndex: 10000,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              background: 'rgba(59,130,246,0.9)',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            {t.img_drop}
          </div>
        </div>
      )}

      {sorted.map((el) => (
        <CanvasElement
          key={el.id}
          element={el}
          selected={selectedIds.includes(el.id)}
          scale={scale}
          otherElements={sorted.filter((e) => e.id !== el.id)}
          onSnapLines={setSnapLines}
          onEditingChange={(editing) => {
            if (editing) editingElementsRef.current.add(el.id);
            else editingElementsRef.current.delete(el.id);
          }}
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

      {/* Snap lines */}
      {snapLines.map((line, i) =>
        line.type === 'v' ? (
          <div
            key={`v-${i}`}
            style={{
              position: 'absolute',
              left: line.pos,
              top: 0,
              width: 1,
              height: '100%',
              background: '#3b82f6',
              pointerEvents: 'none',
              zIndex: 9998,
            }}
          />
        ) : (
          <div
            key={`h-${i}`}
            style={{
              position: 'absolute',
              top: line.pos,
              left: 0,
              height: 1,
              width: '100%',
              background: '#3b82f6',
              pointerEvents: 'none',
              zIndex: 9998,
            }}
          />
        )
      )}

      {/* Selection rectangle */}
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
