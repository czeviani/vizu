'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { useRouter } from 'next/navigation';
import type { Presentation, SlideElement, TextElement, ShapeElement, IconElement, ImageElement } from '@/types/slide';
import { ExportModal } from './ExportModal';
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
  onRemoveElement?: (id: string) => void;
  onDuplicateElement?: (id: string) => void;
  onSetTitle: (title: string) => void;
  onPreview: () => void;
  zoom: number;
  onZoom: (z: number) => void;
  saveStatus: 'saved' | null;
  showGrid: boolean;
  onToggleGrid: () => void;
}

/* ── Separator ─────────────────────────────────────────────── */
function Sep() {
  return (
    <div style={{
      width: 1,
      height: 20,
      background: 'var(--border)',
      margin: '0 6px',
      flexShrink: 0,
    }} />
  );
}

/* ── Tool button ───────────────────────────────────────────── */
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
      className={`tool-btn${active ? ' active' : ''}`}
    >
      {children}
    </button>
  );
}

/* ── ThemeToggle (topbar) ──────────────────────────────────── */
function ThemeToggle() {
  const [pref, setPref] = useState<'light' | 'dark' | 'auto'>(() => {
    if (typeof window === 'undefined') return 'auto';
    return (localStorage.getItem('vizu-theme') as 'light' | 'dark' | 'auto') ?? 'auto';
  });

  const apply = (next: 'light' | 'dark' | 'auto') => {
    setPref(next);
    localStorage.setItem('vizu-theme', next);
    const dark = next === 'dark' || (next === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme-pref', next);
    document.dispatchEvent(new CustomEvent('themechange', { detail: { dark } }));
  };

  return (
    <div className="theme-toggle" role="radiogroup" aria-label="Tema" style={{ scale: '0.9' }}>
      <button className={pref === 'light' ? 'active' : ''} onClick={() => apply('light')} aria-label="Claro">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
      </button>
      <button className={pref === 'auto' ? 'active' : ''} onClick={() => apply('auto')} aria-label="Auto">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
      </button>
      <button className={pref === 'dark' ? 'active' : ''} onClick={() => apply('dark')} aria-label="Escuro">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
      </button>
    </div>
  );
}

/* ── Shape Menu ────────────────────────────────────────────── */
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
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
        </svg>
        {t.toolbar_shape}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
      </ToolBtn>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            padding: 8,
            zIndex: 99,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 4,
            boxShadow: 'var(--shadow-lg)',
            minWidth: 210,
          }}>
            {shapes.map((s) => (
              <button
                key={s.id}
                onClick={() => { onAddShape(s.id); setOpen(false); }}
                style={{
                  padding: '8px 12px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-xs)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--text-2)',
                  fontFamily: 'inherit',
                  transition: 'all 0.12s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-soft)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
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

/* ── Icon preview ──────────────────────────────────────────── */
function IconPreview({ name }: { name: string }) {
  const d = ICON_PATHS[name];
  if (!d) return <span style={{ fontSize: 10 }}>{name[0]}</span>;
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

/* ── Toolbar ───────────────────────────────────────────────── */
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
  onRemoveElement,
  onDuplicateElement,
  onSetTitle,
  onPreview,
  zoom,
  onZoom,
  saveStatus,
  showGrid,
  onToggleGrid,
}: Props) {
  const router = useRouter();
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
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

  /* ── Keyboard shortcuts ────────────────────────────────────── */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Guard: não ativar se foco em input/textarea/contenteditable
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) return;

      if (e.key === 'F1') {
        e.preventDefault();
        setShowShortcuts(true);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        setShowExportModal(true);
        return;
      }

      if (!activeSlideId) return; // não inserir sem slide ativo

      // T e R são tratados no editor page (page.tsx) para evitar duplicação
      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        setShowIconPicker((v) => !v);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setShowImageMenu((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlideId, onAddElement]);

  const filteredIcons = ICON_NAMES.filter((n) => n.toLowerCase().includes(iconSearch.toLowerCase()));
  const hasSelection = selectedElements.length > 0;

  return (
    <header style={{
      flexShrink: 0,
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)',
      position: 'relative',
      zIndex: 20,
    }}>
      {/* ── Main toolbar row ─────────────────────────────── */}
      <div style={{
        height: 60,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 2,
      }}>
        {/* Back + Logo */}
        <button
          onClick={() => router.push('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 8px',
            background: 'transparent',
            border: 'none',
            borderRadius: 'var(--r-xs)',
            cursor: 'pointer',
            color: 'var(--text-3)',
            fontSize: 12,
            fontFamily: 'inherit',
            transition: 'all 0.15s',
            marginRight: 4,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover)'; e.currentTarget.style.color = 'var(--text-2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; }}
          title="Voltar às apresentações"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>

        {/* Logo monogram */}
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginRight: 6,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <path d="M8 21h8M12 17v4"/>
          </svg>
        </div>

        {/* Title (editable inline) */}
        {editingTitle ? (
          <input
            autoFocus
            defaultValue={presentation.title}
            onBlur={(e) => { onSetTitle(e.target.value); setEditingTitle(false); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { onSetTitle(e.currentTarget.value); setEditingTitle(false); }
              if (e.key === 'Escape') setEditingTitle(false);
            }}
            style={{
              fontSize: 14,
              fontWeight: 600,
              border: '1px solid var(--accent)',
              borderRadius: 'var(--r-xs)',
              padding: '4px 10px',
              background: 'var(--surface-2)',
              color: 'var(--text)',
              outline: 'none',
              width: 220,
              fontFamily: 'inherit',
              letterSpacing: '-0.01em',
            }}
          />
        ) : (
          <button
            onClick={() => setEditingTitle(true)}
            title={t.toolbar_rename_hint}
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text)',
              padding: '4px 8px',
              borderRadius: 'var(--r-xs)',
              cursor: 'text',
              maxWidth: 220,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              background: 'transparent',
              border: '1px solid transparent',
              fontFamily: 'inherit',
              letterSpacing: '-0.01em',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
          >
            {presentation.title}
          </button>
        )}

        {/* Save status */}
        <div style={{ width: 72, flexShrink: 0 }}>
          {saveStatus && (
            <span style={{
              fontSize: 11.5,
              color: 'var(--ok)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontWeight: 600,
              animation: 'fadeIn 0.2s ease',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
              Salvo
            </span>
          )}
        </div>

        <Sep />

        {/* Insert: Text */}
        <div style={!activeSlideId ? { opacity: 0.4, cursor: 'not-allowed', pointerEvents: 'none' } : undefined}>
          <ToolBtn title="Texto [T]" onClick={addText} disabled={!activeSlideId}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7V4h16v3M9 20h6M12 4v16"/>
            </svg>
            Texto
          </ToolBtn>
        </div>

        {/* Insert: Image */}
        <div style={{ position: 'relative', ...(!activeSlideId ? { opacity: 0.4, cursor: 'not-allowed', pointerEvents: 'none' } : {}) }}>
          <ToolBtn title="Imagem [M]" onClick={() => setShowImageMenu((v) => !v)} disabled={!activeSlideId}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="m21 15-5-5L5 21"/>
            </svg>
            Imagem
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
          </ToolBtn>

          {showImageMenu && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setShowImageMenu(false)} />
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                padding: 14,
                zIndex: 99,
                width: 290,
                boxShadow: 'var(--shadow-lg)',
              }}>
                <button
                  onClick={() => { fileInputRef.current?.click(); }}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                  </svg>
                  Selecionar arquivo
                </button>
                <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--text-3)', marginBottom: 10, fontWeight: 500 }}>ou</div>
                <input
                  type="text"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="Cole a URL da imagem…"
                  className="input"
                  style={{ marginBottom: 8, fontSize: 13 }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && imageUrlInput) addImageFromSrc(imageUrlInput); }}
                />
                <button
                  onClick={() => imageUrlInput && addImageFromSrc(imageUrlInput)}
                  disabled={!imageUrlInput}
                  className="btn btn-ghost"
                  style={{ width: '100%', justifyContent: 'center', opacity: imageUrlInput ? 1 : 0.5 }}
                >
                  Inserir por URL
                </button>
                <p style={{ fontSize: 11.5, color: 'var(--text-3)', margin: '10px 0 0', textAlign: 'center' }}>
                  Ou arraste uma imagem diretamente no canvas
                </p>
              </div>
            </>
          )}
        </div>

        {/* Insert: Shape */}
        <div style={!activeSlideId ? { opacity: 0.4, cursor: 'not-allowed', pointerEvents: 'none' } : undefined}>
          <ShapeMenu onAddShape={addShape} disabled={!activeSlideId} />
        </div>

        {/* Insert: Icon */}
        <div style={{ position: 'relative', ...(!activeSlideId ? { opacity: 0.4, cursor: 'not-allowed', pointerEvents: 'none' } : {}) }}>
          <ToolBtn title="Ícone [I]" onClick={() => setShowIconPicker((v) => !v)} disabled={!activeSlideId}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            Ícone
          </ToolBtn>

          {showIconPicker && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setShowIconPicker(false)} />
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                padding: 12,
                zIndex: 99,
                width: 300,
                boxShadow: 'var(--shadow-lg)',
              }}>
                <input
                  autoFocus
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  placeholder={t.icon_search}
                  className="input"
                  style={{ marginBottom: 10, fontSize: 13 }}
                />
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: 4,
                  maxHeight: 228,
                  overflowY: 'auto',
                }}>
                  {filteredIcons.map((name) => (
                    <button
                      key={name}
                      title={name}
                      onClick={() => addIcon(name)}
                      style={{
                        padding: 8,
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--r-xs)',
                        background: 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-2)',
                        transition: 'all 0.12s',
                        fontFamily: 'inherit',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-soft)'; e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}
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
        <ToolBtn title="Grade [Ctrl+G]" onClick={onToggleGrid} active={showGrid}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          Grade
        </ToolBtn>

        <Sep />

        {/* Undo / Redo */}
        <ToolBtn title={t.toolbar_undo} onClick={onUndo} disabled={!canUndo}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 010 11H11"/>
          </svg>
        </ToolBtn>
        <ToolBtn title={t.toolbar_redo} onClick={onRedo} disabled={!canRedo}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 000 11H13"/>
          </svg>
        </ToolBtn>

        <Sep />

        {/* Zoom */}
        <ToolBtn title={t.toolbar_zoom_out} onClick={() => onZoom(Math.max(0.25, zoom - 0.1))}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M8 11h6"/>
          </svg>
        </ToolBtn>
        <span
          className="num"
          style={{ fontSize: 12, color: 'var(--text-3)', minWidth: 38, textAlign: 'center', userSelect: 'none', fontWeight: 600 }}
        >
          {Math.round(zoom * 100)}%
        </span>
        <ToolBtn title={t.toolbar_zoom_in} onClick={() => onZoom(Math.min(2, zoom + 0.1))}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M11 8v6M8 11h6"/>
          </svg>
        </ToolBtn>
        <ToolBtn title={t.toolbar_zoom_fit} onClick={() => onZoom(0.7)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
          </svg>
        </ToolBtn>

        <Sep />

        {/* Preview */}
        <ToolBtn title="Visualizar [F5]" onClick={onPreview}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M5 3H3v4M21 3h-2v4M5 21H3v-4M21 21h-2v-4"/>
            <rect x="7" y="7" width="10" height="10" rx="1"/>
          </svg>
          Visualizar
        </ToolBtn>

        {/* Export */}
        <button
          onClick={() => setShowExportModal(true)}
          title="Exportar [Ctrl+Shift+E]"
          className="btn btn-primary"
          style={{ marginLeft: 4, padding: '7px 14px', fontSize: 12.5 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          Exportar
        </button>
        {showExportModal && (
          <ExportModal
            presentation={presentation}
            onClose={() => setShowExportModal(false)}
          />
        )}

        {/* Shortcuts help button */}
        <button
          onClick={() => setShowShortcuts(true)}
          title="Atalhos de teclado [F1]"
          className="tool-btn"
          style={{ marginLeft: 4 }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>
          </svg>
        </button>

        {/* Theme toggle */}
        <div style={{ marginLeft: 6 }}>
          <ThemeToggle />
        </div>
      </div>

      {/* ── Context toolbar row ──────────────────────────── */}
      <div style={{
        height: 42,
        borderTop: '1px solid var(--border)',
        background: 'var(--surface-2)',
        display: 'flex',
        alignItems: 'center',
      }}>
        <ContextToolbar
          elements={selectedElements}
          onUpdateElement={onUpdateElement}
          onRemoveElement={onRemoveElement}
          onDuplicateElement={onDuplicateElement}
        />
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* ── Keyboard shortcuts modal ──────────────────────── */}
      {showShortcuts && (
        <div
          className="modal-backdrop"
          onClick={() => setShowShortcuts(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              padding: 24,
              maxWidth: 560,
              width: '90vw',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Atalhos de Teclado</h2>
              <button
                onClick={() => setShowShortcuts(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {[
              {
                grupo: 'Inserção de Elementos',
                atalhos: [
                  ['T', 'Inserir texto'],
                  ['R', 'Inserir retângulo'],
                  ['M', 'Inserir imagem'],
                  ['I', 'Inserir ícone'],
                ],
              },
              {
                grupo: 'Edição',
                atalhos: [
                  ['Ctrl+Z', 'Desfazer'],
                  ['Ctrl+Shift+Z', 'Refazer'],
                  ['Ctrl+D', 'Duplicar elemento'],
                  ['Ctrl+A', 'Selecionar tudo'],
                  ['Del / Backspace', 'Excluir elemento'],
                  ['↑↓←→', 'Mover 1px'],
                  ['Shift+↑↓←→', 'Mover 10px'],
                ],
              },
              {
                grupo: 'Zoom e Visualização',
                atalhos: [
                  ['Ctrl+=', 'Zoom +10%'],
                  ['Ctrl+-', 'Zoom -10%'],
                  ['Ctrl+0', 'Zoom para 70%'],
                  ['Ctrl+G', 'Toggle grade'],
                  ['F5', 'Visualizar em tela cheia'],
                  ['Ctrl+Shift+E', 'Abrir modal de exportação'],
                ],
              },
              {
                grupo: 'Arquivo',
                atalhos: [
                  ['Ctrl+S', 'Salvar agora'],
                  ['F1', 'Mostrar atalhos'],
                  ['Escape', 'Desselecionar / Sair de edição'],
                ],
              },
            ].map(({ grupo, atalhos }) => (
              <div key={grupo} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  {grupo}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {atalhos.map(([key, desc]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{desc}</span>
                      <kbd style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 7px', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                        {key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
