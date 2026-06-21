'use client';
import { useState, useCallback } from 'react';
import type { Presentation, LayoutType } from '@/types/slide';
import { SlideMiniature } from './SlideMiniature';
import { t } from '@/lib/i18n';

interface Props {
  presentation: Presentation;
  activeIndex: number;
  onSelectSlide: (index: number) => void;
  onAddSlide: (layout: LayoutType, afterIndex?: number) => void;
  onDuplicateSlide: (slideId: string) => void;
  onRemoveSlide: (slideId: string) => void;
  onMoveSlide: (slideId: string, toIndex: number) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const LAYOUTS: { id: LayoutType; label: string; icon: string }[] = [
  { id: 'blank', label: t.layout_blank, icon: 'M3 3h18v18H3z' },
  { id: 'cover', label: t.layout_cover, icon: 'M4 4h16v10H4zM8 17h8M12 14v3' },
  { id: 'section', label: t.layout_section, icon: 'M3 3h18v18H3zM3 9h18' },
  { id: 'content', label: t.layout_content, icon: 'M3 3h18v18H3zM3 9h18M9 9v12' },
  { id: 'comparison', label: t.layout_comparison, icon: 'M3 3h18v18H3zM12 3v18' },
  { id: 'quote', label: t.layout_quote, icon: 'M3 3h18v18H3zM7 9h3M7 13h10M7 17h7' },
  { id: 'closing', label: t.layout_closing, icon: 'M3 3h18v18H3zM8 12h8' },
];

export function SlidePanel({
  presentation,
  activeIndex,
  onSelectSlide,
  onAddSlide,
  onDuplicateSlide,
  onRemoveSlide,
  onMoveSlide,
  collapsed,
  onToggleCollapse,
}: Props) {
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ slideId: string; x: number; y: number } | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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

  /* ── Collapsed state — faixa estreita ────────────────── */
  if (collapsed) {
    return (
      <aside style={{
        width: 36,
        flexShrink: 0,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 8,
        overflow: 'hidden',
      }}>
        <button
          onClick={onToggleCollapse}
          title="Expandir painel de slides"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
            borderRadius: 'var(--r-xs)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            style={{ transform: 'rotate(180deg)', transition: 'transform 0.22s', flexShrink: 0 }}>
            <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/>
          </svg>
        </button>
      </aside>
    );
  }

  return (
    <aside style={{
      width: 192,
      flexShrink: 0,
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header with title */}
      <div style={{
        padding: '12px 12px 10px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-3)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Slides · {presentation.slides.length}
          </span>
          <button
            onClick={() => setShowLayoutPicker((v) => !v)}
            title="Adicionar slide"
            style={{
              width: 24,
              height: 24,
              borderRadius: 'var(--r-xs)',
              background: showLayoutPicker ? 'var(--accent-soft)' : 'var(--surface-2)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: showLayoutPicker ? 'var(--accent)' : 'var(--text-3)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!showLayoutPicker) {
                e.currentTarget.style.background = 'var(--accent-soft)';
                e.currentTarget.style.color = 'var(--accent)';
                e.currentTarget.style.borderColor = 'var(--accent)';
              }
            }}
            onMouseLeave={(e) => {
              if (!showLayoutPicker) {
                e.currentTarget.style.background = 'var(--surface-2)';
                e.currentTarget.style.color = 'var(--text-3)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
        </div>

        {/* Layout picker dropdown */}
        {showLayoutPicker && (
          <div style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '6px 10px 4px', fontSize: 10.5, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Escolher layout
            </div>
            {LAYOUTS.map((l) => (
              <button
                key={l.id}
                onClick={() => { onAddSlide(l.id, activeIndex); setShowLayoutPicker(false); }}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  textAlign: 'left',
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: 'var(--text-2)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: 'inherit',
                  transition: 'all 0.12s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-soft)'; e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d={l.icon} />
                </svg>
                {l.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Slide list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {presentation.slides.map((slide, index) => {
          const isActive = activeIndex === index;
          const isDragTarget = dragOver === index;
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={slide.id}
              draggable
              onDragStart={(e) => handleDragStart(e, slide.id)}
              onDragOver={(e) => { e.preventDefault(); setDragOver(index); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => handleDrop(e, index)}
              onContextMenu={(e) => handleContextMenu(e, slide.id)}
              onClick={() => onSelectSlide(index)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                padding: '5px 10px',
                cursor: 'pointer',
                background: isActive ? 'var(--accent-soft)' : isDragTarget ? 'var(--surface-2)' : 'transparent',
                borderLeft: `2.5px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                transition: 'background 0.1s',
                position: 'relative',
              }}
            >
              {/* Slide number */}
              <span style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: isActive ? 'var(--accent)' : 'var(--text-3)',
                minWidth: 18,
                textAlign: 'center',
                paddingTop: 4,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {index + 1}
              </span>

              {/* Thumbnail */}
              <div style={{
                width: 120,
                height: 68,
                flexShrink: 0,
                borderRadius: 5,
                overflow: 'hidden',
                border: isActive
                  ? '2px solid var(--accent)'
                  : isDragTarget
                    ? '2px solid var(--accent-soft)'
                    : '1.5px solid var(--border)',
                boxShadow: isActive ? '0 0 0 3px var(--accent-soft)' : 'var(--shadow-sm)',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                background: 'var(--surface-2)',
                position: 'relative',
              }}>
                <SlideMiniature slide={slide} presentation={presentation} />

                {/* Hover actions */}
                {isHovered && !isActive && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDuplicateSlide(slide.id); }}
                      title="Duplicar"
                      style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 4, padding: '4px 6px', cursor: 'pointer', color: '#333', display: 'flex', transition: 'all 0.12s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#fff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.9)'; }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); if (presentation.slides.length > 1) onRemoveSlide(slide.id); }}
                      title="Excluir"
                      disabled={presentation.slides.length <= 1}
                      style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 4, padding: '4px 6px', cursor: presentation.slides.length > 1 ? 'pointer' : 'default', color: presentation.slides.length > 1 ? '#dc2626' : '#999', display: 'flex', transition: 'all 0.12s', opacity: presentation.slides.length > 1 ? 1 : 0.5 }}
                      onMouseEnter={(e) => { if (presentation.slides.length > 1) e.currentTarget.style.background = '#fff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.9)'; }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer — add slide button + collapse */}
      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Botão dashed de adicionar slide */}
        <button
          onClick={() => setShowLayoutPicker((v) => !v)}
          style={{
            width: '100%',
            padding: '8px 10px',
            background: 'transparent',
            border: '1.5px dashed var(--border)',
            borderRadius: 'var(--r-sm)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontSize: 12.5,
            fontWeight: 600,
            color: 'var(--text-3)',
            fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent-soft)';
            e.currentTarget.style.color = 'var(--accent)';
            e.currentTarget.style.borderColor = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-3)';
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Adicionar slide
        </button>

        {/* Botão de colapso */}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expandir painel de slides' : 'Recolher painel de slides'}
          style={{
            width: '100%',
            padding: '5px 8px',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 6,
            color: 'var(--text-3)',
            fontSize: 11,
            fontWeight: 500,
            fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.22s', flexShrink: 0 }}>
            <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/>
          </svg>
          {!collapsed && 'Recolher painel'}
        </button>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setContextMenu(null)} />
          <div style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            padding: '4px 0',
            zIndex: 1000,
            minWidth: 168,
            boxShadow: 'var(--shadow-lg)',
          }}>
            {[
              {
                label: t.slide_duplicate,
                icon: 'M8 4H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V8l-6-4z',
                action: () => { onDuplicateSlide(contextMenu.slideId); setContextMenu(null); },
              },
              {
                label: t.slide_delete,
                icon: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
                action: () => {
                  if (presentation.slides.length > 1) onRemoveSlide(contextMenu.slideId);
                  setContextMenu(null);
                },
                danger: true,
                disabled: presentation.slides.length <= 1,
              },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                disabled={item.disabled}
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  fontSize: 13,
                  fontWeight: 500,
                  color: item.danger ? 'var(--bad)' : 'var(--text-2)',
                  cursor: item.disabled ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: 'inherit',
                  opacity: item.disabled ? 0.4 : 1,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { if (!item.disabled) e.currentTarget.style.background = item.danger ? 'var(--bad-soft)' : 'var(--surface-2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
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
