'use client';
import { useState, useCallback } from 'react';
import type { Presentation, LayoutType } from '@/types/slide';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '@/types/slide';
import { SlideMiniature } from './SlideMiniature';

interface Props {
  presentation: Presentation;
  activeIndex: number;
  onSelectSlide: (index: number) => void;
  onAddSlide: (layout: LayoutType, afterIndex?: number) => void;
  onDuplicateSlide: (slideId: string) => void;
  onRemoveSlide: (slideId: string) => void;
  onMoveSlide: (slideId: string, toIndex: number) => void;
}

const LAYOUTS: { id: LayoutType; label: string }[] = [
  { id: 'blank', label: 'Blank' },
  { id: 'cover', label: 'Cover' },
  { id: 'section', label: 'Section' },
  { id: 'content', label: 'Content' },
  { id: 'comparison', label: 'Comparison' },
  { id: 'quote', label: 'Quote' },
  { id: 'closing', label: 'Closing' },
];

export function SlidePanel({
  presentation,
  activeIndex,
  onSelectSlide,
  onAddSlide,
  onDuplicateSlide,
  onRemoveSlide,
  onMoveSlide,
}: Props) {
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ slideId: string; x: number; y: number } | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent, slideId: string) => {
    e.preventDefault();
    setContextMenu({ slideId, x: e.clientX, y: e.clientY });
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, slideId: string) => {
    setDragging(slideId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, toIndex: number) => {
      e.preventDefault();
      if (dragging) {
        onMoveSlide(dragging, toIndex);
        setDragging(null);
        setDragOver(null);
      }
    },
    [dragging, onMoveSlide]
  );

  return (
    <aside
      style={{
        width: 200,
        flexShrink: 0,
        background: 'var(--panel-bg)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Add slide button */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => setShowLayoutPicker((v) => !v)}
          style={{
            width: '100%',
            padding: '7px 10px',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Slide
        </button>

        {showLayoutPicker && (
          <div
            style={{
              marginTop: 6,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            {LAYOUTS.map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  onAddSlide(l.id, activeIndex);
                  setShowLayoutPicker(false);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  fontSize: 13,
                  color: 'var(--text)',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {l.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Slide list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {presentation.slides.map((slide, index) => (
          <div
            key={slide.id}
            draggable
            onDragStart={(e) => handleDragStart(e, slide.id)}
            onDragOver={(e) => { e.preventDefault(); setDragOver(index); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => handleDrop(e, index)}
            onContextMenu={(e) => handleContextMenu(e, slide.id)}
            onClick={() => onSelectSlide(index)}
            style={{
              padding: '6px 10px',
              cursor: 'pointer',
              background: activeIndex === index ? 'var(--accent-subtle)' : dragOver === index ? 'var(--hover)' : 'transparent',
              borderLeft: activeIndex === index ? '2.5px solid var(--accent)' : '2.5px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'background 0.12s',
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: 'var(--text-secondary)',
                minWidth: 18,
                textAlign: 'center',
              }}
            >
              {index + 1}
            </span>
            <div
              style={{
                width: 120,
                height: 68,
                flexShrink: 0,
                background: '#f1f5f9',
                borderRadius: 3,
                overflow: 'hidden',
                border: activeIndex === index ? '1.5px solid var(--accent)' : '1px solid var(--border)',
              }}
            >
              <SlideMiniature slide={slide} presentation={presentation} />
            </div>
          </div>
        ))}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
            onClick={() => setContextMenu(null)}
          />
          <div
            style={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '4px 0',
              zIndex: 1000,
              minWidth: 160,
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            }}
          >
            {[
              {
                label: 'Duplicate',
                icon: 'M8 4H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V8l-6-4z',
                action: () => { onDuplicateSlide(contextMenu.slideId); setContextMenu(null); },
              },
              {
                label: 'Delete',
                icon: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
                action: () => {
                  if (presentation.slides.length > 1) {
                    onRemoveSlide(contextMenu.slideId);
                  }
                  setContextMenu(null);
                },
                danger: true,
              },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                style={{
                  width: '100%',
                  padding: '8px 14px',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  fontSize: 13,
                  color: item.danger ? '#ef4444' : 'var(--text)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d={item.icon} />
                </svg>
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
