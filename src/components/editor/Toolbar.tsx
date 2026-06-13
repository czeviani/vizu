'use client';
import { useState, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import type { Presentation, Slide, SlideElement, TextElement, ShapeElement, IconElement } from '@/types/slide';
import { exportToPptx } from '@/lib/pptxExport';

interface Props {
  presentation: Presentation;
  activeSlideId: string | null;
  selectedIds: string[];
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAddElement: (slideId: string, el: SlideElement) => void;
  onSetTitle: (title: string) => void;
  onPreview: () => void;
  zoom: number;
  onZoom: (z: number) => void;
}

const ICON_NAMES = [
  'Star', 'Heart', 'Check', 'X', 'AlertCircle', 'Info', 'Zap', 'Target',
  'TrendingUp', 'TrendingDown', 'Users', 'User', 'Building', 'Globe',
  'Mail', 'Phone', 'Calendar', 'Clock', 'Map', 'Flag', 'Award', 'Shield',
  'Lock', 'Key', 'Search', 'Filter', 'BarChart', 'PieChart', 'Activity',
  'Download', 'Upload', 'Link', 'Code', 'Layers', 'Grid', 'List',
  'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'ChevronRight',
  'Lightbulb', 'Rocket', 'Briefcase', 'DollarSign', 'Percent', 'Package',
];

function ToolBtn({
  title,
  onClick,
  disabled,
  children,
}: {
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '6px 8px',
        background: 'transparent',
        border: 'none',
        borderRadius: 6,
        cursor: disabled ? 'default' : 'pointer',
        color: disabled ? 'var(--text-secondary)' : 'var(--text)',
        opacity: disabled ? 0.4 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 12,
        whiteSpace: 'nowrap',
        transition: 'background 0.12s',
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = 'var(--hover)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />;
}

export function Toolbar({
  presentation,
  activeSlideId,
  selectedIds,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onAddElement,
  onSetTitle,
  onPreview,
  zoom,
  onZoom,
}: Props) {
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const [exporting, setExporting] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);

  const add = useCallback(
    (el: SlideElement) => {
      if (!activeSlideId) return;
      onAddElement(activeSlideId, el);
    },
    [activeSlideId, onAddElement]
  );

  const addText = () =>
    add({
      id: uuid(),
      type: 'text',
      x: 200,
      y: 180,
      width: 300,
      height: 80,
      rotation: 0,
      opacity: 1,
      zIndex: 10,
      locked: false,
      visible: true,
      content: 'Text',
      background: 'transparent',
      border: { width: 0, color: 'transparent', style: 'none', radius: 0 },
      padding: 8,
      verticalAlign: 'middle',
      style: {
        fontFamily: presentation.theme.fonts.body,
        fontSize: 24,
        fontWeight: 400,
        fontStyle: 'normal',
        textDecoration: 'none',
        color: presentation.theme.colors.text,
        textAlign: 'left',
        lineHeight: 1.4,
        letterSpacing: 0,
        textTransform: 'none',
      },
    } as TextElement);

  const addShape = (shape: ShapeElement['shape']) =>
    add({
      id: uuid(),
      type: 'shape',
      shape,
      x: 200,
      y: 180,
      width: 200,
      height: 120,
      rotation: 0,
      opacity: 1,
      zIndex: 10,
      locked: false,
      visible: true,
      fill: presentation.theme.colors.primary,
      border: { width: 0, color: '', style: 'none', radius: 4 },
      shadow: { enabled: false, x: 0, y: 4, blur: 12, color: 'rgba(0,0,0,0.15)' },
    } as ShapeElement);

  const addIcon = (iconName: string) => {
    add({
      id: uuid(),
      type: 'icon',
      iconName,
      x: 200,
      y: 180,
      width: 80,
      height: 80,
      rotation: 0,
      opacity: 1,
      zIndex: 10,
      locked: false,
      visible: true,
      color: presentation.theme.colors.primary,
      background: 'transparent',
      border: { width: 0, color: '', style: 'none', radius: 0 },
    } as IconElement);
    setShowIconPicker(false);
    setIconSearch('');
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportToPptx(presentation);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${presentation.title.replace(/\s+/g, '_')}.pptx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Export failed. Check console for details.');
    }
    setExporting(false);
  };

  const filteredIcons = ICON_NAMES.filter((n) => n.toLowerCase().includes(iconSearch.toLowerCase()));

  return (
    <header
      style={{
        height: 48,
        background: 'var(--panel-bg)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 2,
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Logo */}
      <div
        style={{
          fontWeight: 700,
          fontSize: 16,
          color: 'var(--accent)',
          letterSpacing: -0.5,
          marginRight: 8,
          userSelect: 'none',
        }}
      >
        Vizu
      </div>

      {/* Title */}
      {editingTitle ? (
        <input
          autoFocus
          defaultValue={presentation.title}
          onBlur={(e) => { onSetTitle(e.target.value); setEditingTitle(false); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { onSetTitle(e.currentTarget.value); setEditingTitle(false); } }}
          style={{
            fontSize: 13,
            fontWeight: 500,
            border: '1px solid var(--accent)',
            borderRadius: 4,
            padding: '2px 8px',
            background: 'var(--surface)',
            color: 'var(--text)',
            outline: 'none',
            width: 200,
          }}
        />
      ) : (
        <span
          onClick={() => setEditingTitle(true)}
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text)',
            padding: '2px 8px',
            borderRadius: 4,
            cursor: 'text',
            maxWidth: 200,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title="Click to rename"
        >
          {presentation.title}
        </span>
      )}

      <Sep />

      {/* Undo / Redo */}
      <ToolBtn title="Undo (Ctrl+Z)" onClick={onUndo} disabled={!canUndo}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 14L4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 010 11H11" />
        </svg>
      </ToolBtn>
      <ToolBtn title="Redo (Ctrl+Shift+Z)" onClick={onRedo} disabled={!canRedo}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 14l5-5-5-5" /><path d="M20 9H9.5a5.5 5.5 0 000 11H13" />
        </svg>
      </ToolBtn>

      <Sep />

      {/* Insert tools */}
      <ToolBtn title="Add text box" onClick={addText} disabled={!activeSlideId}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 7V4h16v3M9 20h6M12 4v16" />
        </svg>
        Text
      </ToolBtn>

      {/* Shape dropdown */}
      <div style={{ position: 'relative' }}>
        <ToolBtn title="Add shape" disabled={!activeSlideId}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
          Shape
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </ToolBtn>
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '4px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 4,
            zIndex: 100,
            minWidth: 160,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            pointerEvents: 'none',
            opacity: 0,
          }}
          // We use CSS hover trick below with a wrapper
        />
      </div>

      {/* Better shape menu with hover */}
      <ShapeMenu onAddShape={addShape} disabled={!activeSlideId} />

      {/* Icon picker */}
      <div style={{ position: 'relative' }}>
        <ToolBtn
          title="Add icon"
          onClick={() => setShowIconPicker((v) => !v)}
          disabled={!activeSlideId}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          Icon
        </ToolBtn>

        {showIconPicker && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 98 }}
              onClick={() => setShowIconPicker(false)}
            />
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: 12,
                zIndex: 99,
                width: 280,
                boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
              }}
            >
              <input
                autoFocus
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                placeholder="Search icons..."
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  fontSize: 13,
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  outline: 'none',
                  marginBottom: 10,
                  boxSizing: 'border-box',
                }}
              />
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: 4,
                  maxHeight: 200,
                  overflowY: 'auto',
                }}
              >
                {filteredIcons.map((name) => (
                  <button
                    key={name}
                    title={name}
                    onClick={() => addIcon(name)}
                    style={{
                      padding: 8,
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      background: 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >
                    <IconPreview name={name} />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* Zoom */}
      <ToolBtn title="Zoom out" onClick={() => onZoom(Math.max(0.25, zoom - 0.1))}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35M8 11h6" />
        </svg>
      </ToolBtn>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 36, textAlign: 'center' }}>
        {Math.round(zoom * 100)}%
      </span>
      <ToolBtn title="Zoom in" onClick={() => onZoom(Math.min(2, zoom + 0.1))}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35M11 8v6M8 11h6" />
        </svg>
      </ToolBtn>
      <ToolBtn title="Fit to window" onClick={() => onZoom(0.7)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
        </svg>
      </ToolBtn>

      <Sep />

      {/* Preview */}
      <ToolBtn title="Fullscreen preview" onClick={onPreview}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 3H3v4M21 3h-2v4M5 21H3v-4M21 21h-2v-4" />
          <rect x="7" y="7" width="10" height="10" rx="1" />
        </svg>
        Preview
      </ToolBtn>

      {/* Export */}
      <button
        onClick={handleExport}
        disabled={exporting}
        style={{
          padding: '6px 14px',
          background: 'var(--accent)',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 500,
          cursor: exporting ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          opacity: exporting ? 0.7 : 1,
          marginLeft: 4,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
        {exporting ? 'Exporting…' : 'Export .pptx'}
      </button>
    </header>
  );
}

function ShapeMenu({ onAddShape, disabled }: { onAddShape: (s: ShapeElement['shape']) => void; disabled: boolean }) {
  const [open, setOpen] = useState(false);

  const shapes: { id: ShapeElement['shape']; label: string; path: string }[] = [
    { id: 'rectangle', label: 'Rectangle', path: 'M3 5h18v14H3z' },
    { id: 'rounded-rectangle', label: 'Rounded', path: 'M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z' },
    { id: 'circle', label: 'Circle', path: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z' },
    { id: 'triangle', label: 'Triangle', path: 'M12 2L2 22h20L12 2z' },
    { id: 'diamond', label: 'Diamond', path: 'M12 2l10 10-10 10L2 12 12 2z' },
    { id: 'star', label: 'Star', path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
    { id: 'arrow-right', label: 'Arrow →', path: 'M5 12h14M12 5l7 7-7 7' },
    { id: 'arrow-left', label: 'Arrow ←', path: 'M19 12H5M12 19l-7-7 7-7' },
  ];

  return (
    <div style={{ position: 'relative' }}>
      <ToolBtn title="Add shape" onClick={() => !disabled && setOpen((v) => !v)} disabled={disabled}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
        Shape
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </ToolBtn>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setOpen(false)} />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 8,
              zIndex: 99,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 4,
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              minWidth: 200,
            }}
          >
            {shapes.map((s) => (
              <button
                key={s.id}
                onClick={() => { onAddShape(s.id); setOpen(false); }}
                style={{
                  padding: '8px 12px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  color: 'var(--text)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d={s.path} />
                </svg>
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function IconPreview({ name }: { name: string }) {
  // We lazy-import from lucide but since we can't do async here we use a data approach
  const paths: Record<string, string> = {
    Star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    Heart: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
    Check: 'M20 6L9 17l-5-5',
    X: 'M18 6L6 18M6 6l12 12',
    AlertCircle: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01',
    Info: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 16v-4M12 8h.01',
    Zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    Target: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 18a6 6 0 100-12 6 6 0 000 12zM12 14a2 2 0 100-4 2 2 0 000 4z',
    TrendingUp: 'M23 6l-9.5 9.5-5-5L1 18',
    TrendingDown: 'M23 18l-9.5-9.5-5 5L1 6',
    Users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
    User: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
    Building: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10',
    Globe: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z',
    Mail: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6',
    Phone: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.64A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.72 6.72l1.29-1.29a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z',
    Calendar: 'M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18',
    Clock: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2',
    Map: 'M1 6l7-4 8 4 7-4v16l-7 4-8-4-7 4V6zM8 2v16M16 6v16',
    Flag: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7',
    Award: 'M12 15c4.418 0 8-3.582 8-8S16.418 1 12 1 4 4.582 4 7s3.582 8 8 8zM8.21 13.89L7 23l5-3 5 3-1.21-9.12',
    Shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    Lock: 'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4',
    Key: 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4',
    Search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35',
    Filter: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
    BarChart: 'M12 20V10M18 20V4M6 20v-4',
    PieChart: 'M21.21 15.89A10 10 0 118 2.83M22 12A10 10 0 0012 2v10z',
    Activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
    Download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
    Upload: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12',
    Link: 'M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71',
    Code: 'M16 18l6-6-6-6M8 6l-6 6 6 6',
    Layers: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    Grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
    List: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
    ArrowRight: 'M5 12h14M12 5l7 7-7 7',
    ArrowLeft: 'M19 12H5M12 19l-7-7 7-7',
    ArrowUp: 'M12 19V5M5 12l7-7 7 7',
    ArrowDown: 'M12 5v14M5 12l7 7 7-7',
    ChevronRight: 'M9 18l6-6-6-6',
    Lightbulb: 'M9 18h6M10 22h4M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 01-1 1H9a1 1 0 01-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z',
    Rocket: 'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09zM12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z',
    Briefcase: 'M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2',
    DollarSign: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
    Percent: 'M19 5L5 19M6.5 6.5h.01M17.5 17.5h.01',
    Package: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
  };

  const d = paths[name];
  if (!d) return <span style={{ fontSize: 10 }}>{name[0]}</span>;

  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
