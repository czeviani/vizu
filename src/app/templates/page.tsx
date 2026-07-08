'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { VisuTemplate } from '@/lib/templateLibrary';
import { getAllTemplates, createPresentationFromTemplate } from '@/lib/templateLibrary';
import { storage } from '@/lib/storage';
import { SlideMiniature } from '@/components/editor/SlideMiniature';
import type { Slide, Presentation } from '@/types/slide';
import { getThemeById } from '@/lib/themes';

// ── Tipos ─────────────────────────────────────────────────────────

type Category = 'Todos' | 'Negócios' | 'Educação' | 'Criativo' | 'Minimalista' | 'Institucional';

const CATEGORIES: Category[] = ['Todos', 'Negócios', 'Educação', 'Criativo', 'Minimalista', 'Institucional'];

// ── Cores por categoria ───────────────────────────────────────────

const CATEGORY_COLOR: Record<string, { bg: string; color: string }> = {
  'Negócios':      { bg: 'var(--info-soft)',    color: 'var(--info)' },
  'Educação':      { bg: 'var(--ok-soft)',      color: 'var(--ok)' },
  'Criativo':      { bg: 'var(--bad-soft)',     color: 'var(--bad)' },
  'Minimalista':   { bg: 'var(--neutral-soft)', color: 'var(--text-3)' },
  'Institucional': { bg: 'var(--info-soft)',    color: 'var(--info)' },
};

// ── Ícones ────────────────────────────────────────────────────────

function IcoSearch() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  );
}

function IcoArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7"/>
    </svg>
  );
}

function IcoClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  );
}

function IcoChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  );
}

function IcoChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  );
}

function IcoPresentation() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
    </svg>
  );
}

function IcoLayout() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
    </svg>
  );
}

function IcoDownload() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
    </svg>
  );
}

function IcoSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

// ── Theme Toggle ──────────────────────────────────────────────────

function ThemeToggle() {
  const [pref, setPref] = useState<'light' | 'dark' | 'auto'>('auto');

  useEffect(() => {
    const stored = localStorage.getItem('vizu-theme') as 'light' | 'dark' | 'auto' | null;
    setPref(stored ?? 'auto');
  }, []);

  const apply = (next: 'light' | 'dark' | 'auto') => {
    setPref(next);
    localStorage.setItem('vizu-theme', next);
    const dark = next === 'dark' || (next === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme-pref', next);
    document.dispatchEvent(new CustomEvent('themechange', { detail: { dark } }));
  };

  return (
    <div className="theme-toggle" role="radiogroup" aria-label="Tema">
      <button
        data-set-theme="light"
        aria-label="Tema claro"
        className={pref === 'light' ? 'active' : ''}
        onClick={() => apply('light')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
        </svg>
      </button>
      <button
        data-set-theme="auto"
        aria-label="Seguir sistema"
        className={pref === 'auto' ? 'active' : ''}
        onClick={() => apply('auto')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="2" y="3" width="20" height="14" rx="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      </button>
      <button
        data-set-theme="dark"
        aria-label="Tema escuro"
        className={pref === 'dark' ? 'active' : ''}
        onClick={() => apply('dark')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
        </svg>
      </button>
    </div>
  );
}

// ── Card de Template ──────────────────────────────────────────────

function TemplateCard({
  template,
  onPreview,
  onUse,
}: {
  template: VisuTemplate;
  onPreview: () => void;
  onUse: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const firstSlide = template.slides[0];
  const theme = getThemeById(template.themeId);

  // Presentation object mock para SlideMiniature
  const fakePres: Presentation = {
    id: template.id,
    title: template.name,
    theme,
    slides: template.slides,
    metadata: { createdAt: template.createdAt, updatedAt: template.createdAt, version: '1.0' },
  };

  const catStyle = CATEGORY_COLOR[template.category] ?? CATEGORY_COLOR['Minimalista'];

  return (
    <div
      className="card clickable"
      style={{ overflow: 'hidden', position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onPreview}
    >
      {/* Thumbnail 16:9 */}
      <div style={{
        height: 0,
        paddingBottom: '56.25%',
        position: 'relative',
        overflow: 'hidden',
        background: firstSlide?.background?.type === 'color'
          ? firstSlide.background.color
          : firstSlide?.background?.type === 'gradient'
            ? `linear-gradient(${firstSlide.background.gradient?.direction ?? 135}deg, ${firstSlide.background.gradient?.from}, ${firstSlide.background.gradient?.to})`
            : 'var(--surface-2)',
      }}>
        {firstSlide && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: 'scale(0.289)',
            transformOrigin: 'top left',
            width: 960,
            height: 540,
            pointerEvents: 'none',
          }}>
            <SlideMiniature slide={firstSlide} presentation={fakePres} />
          </div>
        )}

        {/* Badge: contagem de slides */}
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
          color: '#fff',
          fontSize: 11,
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 'var(--r-full)',
        }}>
          {template.slides.length} slides
        </div>

        {/* Overlay de hover */}
        {hovered && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            animation: 'fadeIn 0.15s ease',
          }}>
            <button
              onClick={(e) => { e.stopPropagation(); onPreview(); }}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1.5px solid rgba(255,255,255,0.6)',
                borderRadius: 'var(--r-sm)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                padding: '8px 16px',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                fontFamily: 'inherit',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
            >
              Visualizar
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onUse(); }}
              style={{
                background: 'var(--accent)',
                border: '1.5px solid var(--accent)',
                borderRadius: 'var(--r-sm)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                padding: '8px 16px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'filter 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
            >
              Usar template
            </button>
          </div>
        )}
      </div>

      {/* Corpo do card */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
          <h2 style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            letterSpacing: '-0.01em',
            flex: 1,
            minWidth: 0,
          }}>
            {template.name}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span className="tag" style={{ background: catStyle.bg, color: catStyle.color }}>
            {template.category}
          </span>
          {!template.isBuiltIn && (
            <span className="tag tag-accent">Meu template</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Skeleton de card ──────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="skeleton" style={{ height: 158 }} />
      <div style={{ padding: '14px 16px' }}>
        <div className="skeleton" style={{ height: 14, width: '70%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 20, width: '40%' }} />
      </div>
    </div>
  );
}

// ── Modal de Preview ──────────────────────────────────────────────

function PreviewModal({
  template,
  onClose,
  onUse,
}: {
  template: VisuTemplate;
  onClose: () => void;
  onUse: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const theme = getThemeById(template.themeId);
  const catStyle = CATEGORY_COLOR[template.category] ?? CATEGORY_COLOR['Minimalista'];

  const fakePres: Presentation = {
    id: template.id,
    title: template.name,
    theme,
    slides: template.slides,
    metadata: { createdAt: template.createdAt, updatedAt: template.createdAt, version: '1.0' },
  };

  const currentSlide: Slide = template.slides[currentIndex];
  const total = template.slides.length;

  // Navegação por teclado
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  setCurrentIndex((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setCurrentIndex((i) => Math.min(total - 1, i + 1));
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [total, onClose]);

  const PREVIEW_W = 648;
  const PREVIEW_H = 365;
  const PREVIEW_SCALE = PREVIEW_W / 960;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        width: 720,
        maxWidth: '95vw',
        maxHeight: '92vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)',
        animation: 'modalIn 0.2s cubic-bezier(0.4,0,0.2,1)',
      }}>

        {/* Header do modal */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>
                {template.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span className="tag" style={{ background: catStyle.bg, color: catStyle.color, fontSize: 11 }}>
                  {template.category}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {total} {total === 1 ? 'slide' : 'slides'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)',
              padding: 6,
              cursor: 'pointer',
              color: 'var(--text-3)',
              display: 'flex',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; }}
          >
            <IcoClose />
          </button>
        </div>

        {/* Área de preview do slide */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '28px 36px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          background: 'var(--bg)',
        }}>
          {/* Slide principal */}
          <div style={{
            width: PREVIEW_W,
            maxWidth: '100%',
            position: 'relative',
          }}>
            <div style={{
              width: PREVIEW_W,
              height: PREVIEW_H,
              maxWidth: '100%',
              overflow: 'hidden',
              borderRadius: 'var(--r-md)',
              boxShadow: 'var(--shadow-lg)',
              background: currentSlide?.background?.type === 'color'
                ? currentSlide.background.color
                : currentSlide?.background?.type === 'gradient'
                  ? `linear-gradient(${currentSlide.background.gradient?.direction ?? 135}deg, ${currentSlide.background.gradient?.from}, ${currentSlide.background.gradient?.to})`
                  : 'var(--surface)',
              position: 'relative',
            }}>
              {currentSlide && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  transform: `scale(${PREVIEW_SCALE})`,
                  transformOrigin: 'top left',
                  width: 960,
                  height: 540,
                  pointerEvents: 'none',
                }}>
                  <SlideMiniature slide={currentSlide} presentation={fakePres} />
                </div>
              )}
            </div>
          </div>

          {/* Navegação */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 'var(--r-sm)',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                cursor: currentIndex === 0 ? 'default' : 'pointer',
                color: currentIndex === 0 ? 'var(--text-3)' : 'var(--text-2)',
                opacity: currentIndex === 0 ? 0.4 : 1,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { if (currentIndex > 0) { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text)'; }}}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = currentIndex === 0 ? 'var(--text-3)' : 'var(--text-2)'; }}
            >
              <IcoChevronLeft />
            </button>

            {/* Dots */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {template.slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  style={{
                    width: i === currentIndex ? 20 : 8,
                    height: 8,
                    borderRadius: 'var(--r-full)',
                    border: 'none',
                    background: i === currentIndex ? 'var(--accent)' : 'var(--border)',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                  }}
                />
              ))}
            </div>

            <button
              onClick={() => setCurrentIndex((i) => Math.min(total - 1, i + 1))}
              disabled={currentIndex === total - 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 'var(--r-sm)',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                cursor: currentIndex === total - 1 ? 'default' : 'pointer',
                color: currentIndex === total - 1 ? 'var(--text-3)' : 'var(--text-2)',
                opacity: currentIndex === total - 1 ? 0.4 : 1,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { if (currentIndex < total - 1) { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text)'; }}}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = currentIndex === total - 1 ? 'var(--text-3)' : 'var(--text-2)'; }}
            >
              <IcoChevronRight />
            </button>
          </div>

          {/* Miniaturas dos slides */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {template.slides.map((slide, i) => (
              <button
                key={slide.id}
                onClick={() => setCurrentIndex(i)}
                style={{
                  padding: 0,
                  border: `2px solid ${i === currentIndex ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--r-xs)',
                  background: 'transparent',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  transition: 'border-color 0.15s',
                  flexShrink: 0,
                }}
              >
                <div style={{
                  width: 96,
                  height: 54,
                  overflow: 'hidden',
                  position: 'relative',
                  background: slide.background?.type === 'color'
                    ? slide.background.color
                    : 'var(--surface)',
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    transform: 'scale(0.1)',
                    transformOrigin: 'top left',
                    width: 960,
                    height: 540,
                    pointerEvents: 'none',
                  }}>
                    <SlideMiniature slide={slide} presentation={fakePres} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Rodapé com CTA */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexShrink: 0,
          background: 'var(--surface)',
        }}>
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>
            Slide {currentIndex + 1} de {total}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} className="btn btn-ghost">
              Cancelar
            </button>
            <button onClick={onUse} className="btn btn-primary">
              Usar este template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<VisuTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<VisuTemplate | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Carrega templates
  useEffect(() => {
    setTemplates(getAllTemplates());
    setLoading(false);
  }, []);

  // Debounce de busca
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  // Filtro
  const filtered = templates.filter((t) => {
    const matchesCategory = activeCategory === 'Todos' || t.category === activeCategory;
    const matchesSearch = t.name.toLowerCase().includes(debouncedSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleUseTemplate = useCallback((templateId: string) => {
    const presentation = createPresentationFromTemplate(templateId);
    if (!presentation) return;
    storage.set(presentation);
    router.push(`/editor/${presentation.id}`);
  }, [router]);

  const navItems = [
    { icon: <IcoPresentation />, label: 'Apresentações', active: false, onClick: () => router.push('/') },
    { icon: <IcoLayout />, label: 'Templates', active: true, onClick: () => {} },
    { icon: <IcoDownload />, label: 'Exportações', active: false, onClick: () => router.push('/exportacoes') },
    { icon: <IcoSettings />, label: 'Configurações', active: false, onClick: () => router.push('/configuracoes') },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside style={{
        width: sidebarCollapsed ? 64 : 240,
        flexShrink: 0,
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 10,
        transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 14px 16px', borderBottom: '1px solid var(--sidebar-border)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--sidebar-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <path d="M8 21h8M12 17v4"/>
              </svg>
            </div>
            {!sidebarCollapsed && (
              <div style={{ overflow: 'hidden', flexShrink: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--sidebar-text-active)', letterSpacing: '-0.02em', lineHeight: 1, whiteSpace: 'nowrap' }}>
                  Vizu
                </div>
                <div style={{ fontSize: 11, color: 'var(--sidebar-text)', marginTop: 2, whiteSpace: 'nowrap' }}>Editor de slides</div>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px 4px', overflowY: 'auto', overflowX: 'hidden' }} className="sidebar-scroll">
          {!sidebarCollapsed && (
            <div style={{ marginBottom: 4, padding: '0 4px 4px', fontSize: 11, fontWeight: 600, color: 'var(--sidebar-text)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
              Principal
            </div>
          )}
          {sidebarCollapsed && <div style={{ height: 4 }} />}
          {navItems.map((item) => (
            <button
              key={item.label}
              title={sidebarCollapsed ? item.label : undefined}
              className={`nav-item${item.active ? ' active' : ''}`}
              onClick={item.onClick}
              style={{
                marginBottom: 2,
                justifyContent: sidebarCollapsed ? 'center' : undefined,
                padding: sidebarCollapsed ? '9px 8px' : undefined,
              }}
            >
              <span style={{ color: item.active ? 'var(--sidebar-accent)' : 'var(--sidebar-text)', flexShrink: 0 }}>
                {item.icon}
              </span>
              {!sidebarCollapsed && item.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 12px', borderTop: '1px solid var(--sidebar-border)' }}>
          {!sidebarCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'var(--sidebar-accent-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--sidebar-accent)',
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0,
              }}>
                V
              </div>
              <div style={{ overflow: 'hidden', minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sidebar-text-active)', whiteSpace: 'nowrap' }}>Meu espaço</div>
                <div style={{ fontSize: 11, color: 'var(--sidebar-text)', whiteSpace: 'nowrap' }}>Armazenamento local</div>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed((v) => !v)}
            title={sidebarCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
            style={{
              width: '100%',
              padding: '7px 8px',
              background: 'transparent',
              border: '1px solid var(--sidebar-border)',
              borderRadius: 'var(--r-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              gap: 8,
              color: 'var(--sidebar-text)',
              fontSize: 12,
              fontWeight: 500,
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--sidebar-accent-soft)'; e.currentTarget.style.color = 'var(--sidebar-accent)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sidebar-text)'; }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.22s', flexShrink: 0 }}
            >
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            {!sidebarCollapsed && 'Recolher'}
          </button>
        </div>
      </aside>

      {/* ── Área principal ───────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Topbar */}
        <header style={{
          height: 60,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: 12,
          flexShrink: 0,
          zIndex: 5,
        }}>
          {/* Botão Voltar */}
          <button
            onClick={() => router.push('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)',
              cursor: 'pointer',
              color: 'var(--text-2)',
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'inherit',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)'; }}
          >
            <IcoArrowLeft />
            Voltar
          </button>

          <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>
            Templates
          </h1>

          <div style={{ flex: 1 }} />

          {/* Busca */}
          <div style={{ position: 'relative', width: 280 }}>
            <span style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-3)',
              pointerEvents: 'none',
              display: 'flex',
            }}>
              <IcoSearch />
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar templates…"
              className="input"
              style={{ paddingLeft: 36, fontSize: 13.5 }}
            />
          </div>

          <ThemeToggle />
        </header>

        {/* Conteúdo principal */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>

          {/* Tabs de categoria */}
          <div style={{
            display: 'flex',
            gap: 6,
            marginBottom: 28,
            flexWrap: 'wrap',
          }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 'var(--r-full)',
                  border: `1.5px solid ${activeCategory === cat ? 'var(--accent-hover)' : 'var(--border)'}`,
                  background: activeCategory === cat ? 'var(--accent-soft)' : 'var(--surface)',
                  color: activeCategory === cat ? 'var(--accent-hover)' : 'var(--text-2)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s cubic-bezier(0.4,0,0.2,1)',
                }}
                onMouseEnter={(e) => {
                  if (activeCategory !== cat) {
                    e.currentTarget.style.borderColor = 'var(--border-strong)';
                    e.currentTarget.style.color = 'var(--text)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeCategory !== cat) {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.color = 'var(--text-2)';
                  }
                }}
              >
                {cat}
                {cat !== 'Todos' && (
                  <span style={{
                    marginLeft: 6,
                    background: activeCategory === cat ? 'var(--accent)' : 'var(--surface-2)',
                    color: activeCategory === cat ? '#fff' : 'var(--text-3)',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '1px 7px',
                    borderRadius: 'var(--r-full)',
                    transition: 'all 0.15s',
                  }}>
                    {templates.filter((t) => t.category === cat).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Header da seção */}
          {!loading && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>
                {filtered.length} {filtered.length !== 1 ? 'templates encontrados' : 'template encontrado'}
                {debouncedSearch && ` para "${debouncedSearch}"`}
              </p>
            </div>
          )}

          {/* Skeletons de loading */}
          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <CardSkeleton key={i} />)}
            </div>
          )}

          {/* Estado vazio */}
          {!loading && filtered.length === 0 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 0',
              gap: 16,
            }}>
              <div style={{
                width: 72,
                height: 72,
                borderRadius: 'var(--r-lg)',
                background: 'var(--accent-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                  Nenhum template encontrado
                </h2>
                <p style={{ fontSize: 14, color: 'var(--text-3)', maxWidth: 360, margin: '0 auto' }}>
                  Tente outro termo de busca ou selecione uma categoria diferente.
                </p>
              </div>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('Todos'); }}
                className="btn btn-ghost"
                style={{ marginTop: 4 }}
              >
                Limpar filtros
              </button>
            </div>
          )}

          {/* Grid de cards */}
          {!loading && filtered.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
            }}>
              {filtered.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onPreview={() => setPreviewTemplate(template)}
                  onUse={() => handleUseTemplate(template.id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal de Preview */}
      {previewTemplate && (
        <PreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onUse={() => {
            setPreviewTemplate(null);
            handleUseTemplate(previewTemplate.id);
          }}
        />
      )}
    </div>
  );
}
