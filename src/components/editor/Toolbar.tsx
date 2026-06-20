'use client';
import { useState, useCallback, useRef } from 'react';
import { v4 as uuid } from 'uuid';
import type { Presentation, SlideElement, TextElement, ShapeElement, IconElement, ImageElement } from '@/types/slide';
import { exportToPptx } from '@/lib/pptxExport';
import { ICON_NAMES, ICON_PATHS } from '@/lib/iconPaths';
import { t } from '@/lib/i18n';
import { ContextToolbar } from './ContextToolbar';

interface Props {
  presentation: Presentation;
  activeSlideId: string | null;
  selectedElements: SlideElement[];
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAddElement: (slideId: string, el: SlideElement) => void;
  onUpdateElement: (id: string, updater: (e: SlideElement) => SlideElement) => void;
  onSetTitle: (title: string) => void;
  onPreview: () => void;
  zoom: number;
  onZoom: (z: number) => void;
  saveStatus: 'saved' | null;
  showGrid: boolean;
  onToggleGrid: () => void;
}

function ToolBtn({
  title,
  onClick,
  disabled,
  active,
  children,
}: {
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '5px 8px',
        background: active ? 'var(--accent-subtle)' : 'transparent',
        border: active ? '1.5px solid var(--accent)' : '1.5px solid transparent',
        borderRadius: 6,
        cursor: disabled ? 'default' : 'pointer',
        color: disabled ? 'var(--text-secondary)' : active ? 'var(--accent)' : 'var(--text)',
        opacity: disabled ? 0.4 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 12,
        whiteSpace: 'nowrap',
        transition: 'background 0.12s',
      }}
      onMouseEnter={(e) => { if (!disabled && !active) e.currentTarget.style.background = 'var(--hover)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 4px', flexShrink: 0 }} />;
}

export function Toolbar({
  presentation,
  activeSlideId,
  selectedElements,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onAddElement,
  onUpdateElement,
  onSetTitle,
  onPreview,
  zoom,
  onZoom,
  saveStatus,
  showGrid,
  onToggleGrid,
}: Props) {
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const [exporting, setExporting] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const add = useCallback(
    (el: SlideElement) => {
      if (!activeSlideId) return;
      onAddElement(activeSlideId, el);
    },
    [activeSlideId, onAddElement]
  );

  const addText = () =>
    add({
      id: uuid(), type: 'text',
      x: 200, y: 180, width: 320, height: 80,
      rotation: 0, opacity: 1, zIndex: 10, locked: false, visible: true,
      content: 'Texto',
      background: 'transparent',
      border: { width: 0, color: 'transparent', style: 'none', radius: 0 },
      padding: 8, verticalAlign: 'middle',
      style: {
        fontFamily: presentation.theme.fonts.body,
        fontSize: 24, fontWeight: 400, fontStyle: 'normal',
        textDecoration: 'none', color: presentation.theme.colors.text,
        textAlign: 'left', lineHeight: 1.4, letterSpacing: 0, textTransform: 'none',
      },
    } as TextElement);

  const addImageFromSrc = (src: string, name = 'Imagem') => {
    add({
      id: uuid(), type: 'image', src, alt: name, objectFit: 'cover',
      x: 200, y: 130, width: 400, height: 240,
      rotation: 0, opacity: 1, zIndex: 10, locked: false, visible: true,
      border: { width: 0, color: '', style: 'none', radius: 0 },
      shadow: { enabled: false, x: 0, y: 4, blur: 12, color: 'rgba(0,0,0,0.15)' },
    } as ImageElement);
    setShowImageMenu(false);
    setImageUrlInput('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      if (src) addImageFromSrc(src, file.name);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const addShape = (shape: ShapeElement['shape']) =>
    add({
      id: uuid(), type: 'shape', shape,
      x: 200, y: 180, width: 200, height: 120,
      rotation: 0, opacity: 1, zIndex: 10, locked: false, visible: true,
      fill: presentation.theme.colors.primary,
      border: { width: 0, color: '', style: 'none', radius: 4 },
      shadow: { enabled: false, x: 0, y: 4, blur: 12, color: 'rgba(0,0,0,0.15)' },
    } as ShapeElement);

  const addIcon = (iconName: string) => {
    add({
      id: uuid(), type: 'icon', iconName,
      x: 200, y: 180, width: 80, height: 80,
      rotation: 0, opacity: 1, zIndex: 10, locked: false, visible: true,
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
      alert('Falha ao exportar. Verifique o console para detalhes.');
    }
    setExporting(false);
  };

  const filteredIcons = ICON_NAMES.filter((n) => n.toLowerCase().includes(iconSearch.toLowerCase()));
  const hasSelection = selectedElements.length > 0;

  return (
    <header style={{ flexShrink: 0, background: 'var(--panel-bg)', borderBottom: '1px solid var(--border)', position: 'relative', zIndex: 10 }}>
      {/* Main toolbar row */}
      <div style={{ height: 48, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 2 }}>
        {/* Logo */}
        <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--accent)', letterSpacing: -0.5, marginRight: 6, userSelect: 'none' }}>
          {t.app_name}
        </div>

        {/* Title */}
        {editingTitle ? (
          <input
            autoFocus
            defaultValue={presentation.title}
            onBlur={(e) => { onSetTitle(e.target.value); setEditingTitle(false); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { onSetTitle(e.currentTarget.value); setEditingTitle(false); }
              if (e.key === 'Escape') setEditingTitle(false);
            }}
            style={{ fontSize: 13, fontWeight: 500, border: '1px solid var(--accent)', borderRadius: 4, padding: '2px 8px', background: 'var(--surface)', color: 'var(--text)', outline: 'none', width: 200 }}
          />
        ) : (
          <span
            onClick={() => setEditingTitle(true)}
            title={t.toolbar_rename_hint}
            style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', padding: '2px 8px', borderRadius: 4, cursor: 'text', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {presentation.title}
          </span>
        )}

        {/* Save indicator */}
        {saveStatus && (
          <span style={{ fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 3, marginLeft: 4 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
            {t.toolbar_saved}
          </span>
        )}

        <div style={{ flex: 1 }} />

        {/* Undo / Redo */}
        <ToolBtn title={t.toolbar_undo} onClick={onUndo} disabled={!canUndo}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 14L4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 010 11H11" />
          </svg>
        </ToolBtn>
        <ToolBtn title={t.toolbar_redo} onClick={onRedo} disabled={!canRedo}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 14l5-5-5-5" /><path d="M20 9H9.5a5.5 5.5 0 000 11H13" />
          </svg>
        </ToolBtn>

        <Sep />

        {/* Insert tools (always visible) */}
        <ToolBtn title={t.toolbar_text} onClick={addText} disabled={!activeSlideId}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7V4h16v3M9 20h6M12 4v16" />
          </svg>
          {t.toolbar_text}
        </ToolBtn>

        {/* Image button with dropdown */}
        <div style={{ position: 'relative' }}>
          <ToolBtn title={t.toolbar_image} onClick={() => setShowImageMenu((v) => !v)} disabled={!activeSlideId}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            {t.toolbar_image}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
          </ToolBtn>

          {showImageMenu && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setShowImageMenu(false)} />
              <div style={{ position: 'absolute', top: '100%', left: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, zIndex: 99, width: 280, boxShadow: '0 12px 32px rgba(0,0,0,0.2)' }}>
                {/* File upload */}
                <button
                  onClick={() => { fileInputRef.current?.click(); }}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                  </svg>
                  Selecionar arquivo
                </button>

                <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>{t.upload_or}</div>

                {/* URL input */}
                <input
                  type="text"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder={t.upload_url_placeholder}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13, background: 'var(--bg)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && imageUrlInput) addImageFromSrc(imageUrlInput); }}
                />
                <button
                  onClick={() => imageUrlInput && addImageFromSrc(imageUrlInput)}
                  disabled={!imageUrlInput}
                  style={{ width: '100%', padding: '8px 0', background: imageUrlInput ? 'var(--hover)' : 'transparent', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13, cursor: imageUrlInput ? 'pointer' : 'default', color: 'var(--text)', opacity: imageUrlInput ? 1 : 0.5 }}
                >
                  Inserir por URL
                </button>

                <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '10px 0 0', textAlign: 'center' }}>
                  Ou arraste uma imagem diretamente no canvas
                </p>
              </div>
            </>
          )}
        </div>

        <ShapeMenu onAddShape={addShape} disabled={!activeSlideId} />

        {/* Icon picker */}
        <div style={{ position: 'relative' }}>
          <ToolBtn title={t.toolbar_icon} onClick={() => setShowIconPicker((v) => !v)} disabled={!activeSlideId}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            {t.toolbar_icon}
          </ToolBtn>

          {showIconPicker && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setShowIconPicker(false)} />
              <div style={{ position: 'absolute', top: '100%', left: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, zIndex: 99, width: 300, boxShadow: '0 12px 32px rgba(0,0,0,0.2)' }}>
                <input
                  autoFocus
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  placeholder={t.icon_search}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13, background: 'var(--bg)', color: 'var(--text)', outline: 'none', marginBottom: 10, boxSizing: 'border-box' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
                  {filteredIcons.map((name) => (
                    <button
                      key={name}
                      title={name}
                      onClick={() => addIcon(name)}
                      style={{ padding: 8, border: '1px solid var(--border)', borderRadius: 6, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}
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

        <Sep />

        {/* Grid toggle */}
        <ToolBtn title={t.toolbar_grid} onClick={onToggleGrid} active={showGrid}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>
          {t.toolbar_grid}
        </ToolBtn>

        <Sep />

        {/* Zoom */}
        <ToolBtn title={t.toolbar_zoom_out} onClick={() => onZoom(Math.max(0.25, zoom - 0.1))}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35M8 11h6" />
          </svg>
        </ToolBtn>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 36, textAlign: 'center', userSelect: 'none' }}>
          {Math.round(zoom * 100)}%
        </span>
        <ToolBtn title={t.toolbar_zoom_in} onClick={() => onZoom(Math.min(2, zoom + 0.1))}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35M11 8v6M8 11h6" />
          </svg>
        </ToolBtn>
        <ToolBtn title={t.toolbar_zoom_fit} onClick={() => onZoom(0.7)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </ToolBtn>

        <Sep />

        <ToolBtn title={t.toolbar_preview} onClick={onPreview}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 3H3v4M21 3h-2v4M5 21H3v-4M21 21h-2v-4" />
            <rect x="7" y="7" width="10" height="10" rx="1" />
          </svg>
          {t.toolbar_preview}
        </ToolBtn>

        <button
          onClick={handleExport}
          disabled={exporting}
          style={{ padding: '6px 14px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: exporting ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: exporting ? 0.7 : 1, marginLeft: 4 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          {exporting ? t.toolbar_exporting : t.toolbar_export}
        </button>
      </div>

      {/* Context toolbar row — visible when elements are selected */}
      {hasSelection && (
        <div
          style={{
            height: 40,
            borderTop: '1px solid var(--border)',
            background: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ContextToolbar elements={selectedElements} onUpdateElement={onUpdateElement} />
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
    </header>
  );
}

function ShapeMenu({ onAddShape, disabled }: { onAddShape: (s: ShapeElement['shape']) => void; disabled: boolean }) {
  const [open, setOpen] = useState(false);

  const shapes: { id: ShapeElement['shape']; label: string; path: string }[] = [
    { id: 'rectangle', label: t.shape_rectangle, path: 'M3 5h18v14H3z' },
    { id: 'rounded-rectangle', label: t.shape_rounded, path: 'M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z' },
    { id: 'circle', label: t.shape_circle, path: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z' },
    { id: 'triangle', label: t.shape_triangle, path: 'M12 2L2 22h20L12 2z' },
    { id: 'diamond', label: t.shape_diamond, path: 'M12 2l10 10-10 10L2 12 12 2z' },
    { id: 'star', label: t.shape_star, path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
    { id: 'arrow-right', label: t.shape_arrow_right, path: 'M5 12h14M12 5l7 7-7 7' },
    { id: 'arrow-left', label: t.shape_arrow_left, path: 'M19 12H5M12 19l-7-7 7-7' },
  ];

  return (
    <div style={{ position: 'relative' }}>
      <ToolBtn title={t.toolbar_shape} onClick={() => !disabled && setOpen((v) => !v)} disabled={disabled}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
        {t.toolbar_shape}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
      </ToolBtn>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', top: '100%', left: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, zIndex: 99, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', minWidth: 200 }}>
            {shapes.map((s) => (
              <button
                key={s.id}
                onClick={() => { onAddShape(s.id); setOpen(false); }}
                style={{ padding: '8px 12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text)' }}
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
  const d = ICON_PATHS[name];
  if (!d) return <span style={{ fontSize: 10 }}>{name[0]}</span>;
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
