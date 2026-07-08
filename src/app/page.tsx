'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuid } from 'uuid';
import type { Presentation } from '@/types/slide';
import { storage } from '@/lib/storage';
import { DEFAULT_THEMES } from '@/lib/themes';
import { createSlideFromLayout } from '@/lib/templates';
import { SlideMiniature } from '@/components/editor/SlideMiniature';
import { NewPresentationWizard } from '@/components/NewPresentationWizard';
import { Onboarding } from '@/components/Onboarding';
import { Modal } from '@/components/ui/Modal';
import { ToastContainer, useToasts } from '@/components/ui/Toast';
import { t } from '@/lib/i18n';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ── Icon components ──────────────────────────────────────────── */
function IcoPresentation() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>;
}
function IcoPlus() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>;
}
function IcoSparkle() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></svg>;
}
function IcoSearch() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
}
function IcoSettings() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
}
function IcoLayout() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>;
}
function IcoDownload() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>;
}
function IcoEllipsis() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>;
}
function IcoDuplicate() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
}
function IcoTrash() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>;
}
function IcoOpen() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>;
}

/* ── Theme Toggle ─────────────────────────────────────────────── */
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
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
      </button>
      <button
        data-set-theme="auto"
        aria-label="Seguir sistema"
        className={pref === 'auto' ? 'active' : ''}
        onClick={() => apply('auto')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
      </button>
      <button
        data-set-theme="dark"
        aria-label="Tema escuro"
        className={pref === 'dark' ? 'active' : ''}
        onClick={() => apply('dark')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
      </button>
    </div>
  );
}

/* ── Card de Apresentação ─────────────────────────────────────── */
function PresentationCard({
  presentation: p,
  onOpen,
  onDuplicate,
  onDelete,
}: {
  presentation: Presentation;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const coverSlide = p.slides[0];
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const menuItems = [
    { label: t.card_open, icon: <IcoOpen />, action: (e: React.MouseEvent) => { e.stopPropagation(); onOpen(); setMenuOpen(false); } },
    { label: t.card_duplicate, icon: <IcoDuplicate />, action: (e: React.MouseEvent) => { e.stopPropagation(); onDuplicate(); setMenuOpen(false); } },
    { label: t.card_delete, icon: <IcoTrash />, action: (e: React.MouseEvent) => { e.stopPropagation(); onDelete(); setMenuOpen(false); }, danger: true },
  ];

  return (
    <div
      className="card clickable"
      style={{ overflow: 'hidden', position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); }}
      onClick={onOpen}
    >
      {/* Thumbnail 16:9 */}
      <div style={{
        height: 0,
        paddingBottom: '56.25%',
        position: 'relative',
        background: coverSlide?.background?.type === 'color'
          ? coverSlide.background.color
          : coverSlide?.background?.type === 'gradient'
            ? `linear-gradient(${coverSlide.background.gradient?.direction ?? 135}deg, ${coverSlide.background.gradient?.from}, ${coverSlide.background.gradient?.to})`
            : 'var(--surface-2)',
        overflow: 'hidden',
      }}>
        {coverSlide && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0,
            transform: 'scale(0.289)',
            transformOrigin: 'top left',
            width: 960,
            height: 540,
            pointerEvents: 'none',
          }}>
            <SlideMiniature slide={coverSlide} presentation={p} />
          </div>
        )}

        {/* Slide count badge */}
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
          {p.slides.length} slides
        </div>

        {/* Hover overlay */}
        {hovered && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.15s',
          }}>
            <div style={{
              background: 'var(--accent)',
              color: '#fff',
              borderRadius: 'var(--r-sm)',
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 3l14 9-14 9V3z"/></svg>
              Abrir editor
            </div>
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.01em',
            }}>
              {p.title}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-3)' }}>
              Editado {formatDate(p.metadata.updatedAt)}
            </p>
          </div>

          {/* Menu ··· */}
          <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
              aria-label="Mais opções"
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              style={{
                background: menuOpen ? 'var(--surface-2)' : 'transparent',
                border: '1px solid transparent',
                borderRadius: 'var(--r-xs)',
                padding: '4px 6px',
                cursor: 'pointer',
                color: 'var(--text-3)',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={(e) => { if (!menuOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; } }}
            >
              <IcoEllipsis />
            </button>

            {menuOpen && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 4px)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                padding: '4px 0',
                zIndex: 99,
                minWidth: 160,
                boxShadow: 'var(--shadow-lg)',
              }}>
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    style={{
                      width: '100%',
                      padding: '9px 14px',
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      fontSize: 13,
                      fontWeight: 500,
                      color: item.danger ? 'var(--bad)' : 'var(--text-2)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontFamily: 'inherit',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = item.danger ? 'var(--bad-soft)' : 'var(--surface-2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Theme swatches */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10 }}>
          {[p.theme.colors.primary, p.theme.colors.secondary, p.theme.colors.accent].map((c, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />
          ))}
          <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 2 }}>{p.theme.name}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton Card ────────────────────────────────────────────── */
function CardSkeleton() {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="skeleton" style={{ height: 158 }} />
      <div style={{ padding: '14px 16px' }}>
        <div className="skeleton" style={{ height: 14, width: '70%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 11, width: '45%' }} />
      </div>
    </div>
  );
}

/* ── Toast System ─────────────────────────────────────────────── */
/* ── Home Page ────────────────────────────────────────────────── */
export default function HomePage() {
  const router = useRouter();
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [showAIWizard, setShowAIWizard] = useState(false);
  const [newTitle, setNewTitle] = useState('Nova Apresentação');
  const [newThemeId, setNewThemeId] = useState('slate');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { toasts, showToast, removeToast } = useToasts();

  const load = useCallback(() => {
    setPresentations(storage.list());
    setLoading(false);
  }, []);

  useEffect(() => {
    // Show cached data immediately, then sync from Supabase
    load();
    storage.init().then((hadRemote) => { if (hadRemote) load(); });
  }, [load]);

  const handleCreate = useCallback(() => {
    const theme = DEFAULT_THEMES.find((th) => th.id === newThemeId) ?? DEFAULT_THEMES[0];
    const now = new Date().toISOString();
    const p: Presentation = {
      id: uuid(),
      title: newTitle || 'Nova Apresentação',
      theme,
      slides: [
        createSlideFromLayout('cover', theme),
        createSlideFromLayout('content', theme),
        createSlideFromLayout('closing', theme),
      ],
      metadata: { createdAt: now, updatedAt: now, version: '1.0' },
    };
    storage.set(p);
    router.push(`/editor/${p.id}`);
  }, [newTitle, newThemeId, router]);

  const handleDelete = useCallback(async (id: string) => {
    setDeleteConfirm(null);
    const result = await storage.delete(id);
    load();
    if (result.ok) {
      showToast('Apresentação excluída', 'bad');
    } else {
      showToast(`Não foi possível excluir: ${result.error ?? 'erro desconhecido'}`, 'bad');
    }
  }, [load, showToast]);

  const handleDuplicate = useCallback((p: Presentation) => {
    const now = new Date().toISOString();
    const copy: Presentation = {
      ...p,
      id: uuid(),
      title: `${p.title} (cópia)`,
      metadata: { ...p.metadata, createdAt: now, updatedAt: now },
    };
    storage.set(copy);
    load();
    showToast('Apresentação duplicada', 'ok');
  }, [load, showToast]);

  const filtered = presentations.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navItems = [
    { icon: <IcoPresentation />, label: 'Apresentações', active: true, badge: presentations.length > 0 ? presentations.length : null, route: null },
    { icon: <IcoLayout />, label: 'Templates', active: false, badge: null, route: '/templates' },
    { icon: <IcoDownload />, label: 'Exportações', active: false, badge: null, route: '/exportacoes' },
    { icon: <IcoSettings />, label: 'Configurações', active: false, badge: null, route: '/configuracoes' },
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

        {/* Nova apresentação */}
        <div style={{ padding: '12px 12px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button
            data-onboarding="new-presentation"
            onClick={() => setShowNew(true)}
            title={sidebarCollapsed ? 'Nova Apresentação' : undefined}
            className="btn btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: sidebarCollapsed ? '8px' : undefined,
              minWidth: 0,
            }}
          >
            <IcoPlus />
            {!sidebarCollapsed && 'Nova Apresentação'}
          </button>
          <button
            data-onboarding="ai-wizard"
            onClick={() => setShowAIWizard(true)}
            title={sidebarCollapsed ? 'Gerar com IA' : undefined}
            className="btn btn-ghost"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: sidebarCollapsed ? '8px' : undefined,
              minWidth: 0,
              fontSize: 12.5,
              color: 'var(--sidebar-text)',
            }}
          >
            <IcoSparkle />
            {!sidebarCollapsed && 'Gerar com IA'}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '4px 8px', overflowY: 'auto', overflowX: 'hidden' }} className="sidebar-scroll">
          {!sidebarCollapsed && (
            <div style={{ marginBottom: 4, padding: '8px 4px 4px', fontSize: 11, fontWeight: 600, color: 'var(--sidebar-text)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
              Principal
            </div>
          )}
          {sidebarCollapsed && <div style={{ height: 12 }} />}
          {navItems.map((item) => (
            <button
              key={item.label}
              data-onboarding={item.label === 'Templates' ? 'templates-nav' : undefined}
              title={sidebarCollapsed ? item.label : undefined}
              className={`nav-item${item.active ? ' active' : ''}`}
              onClick={() => item.route && router.push(item.route)}
              style={{
                marginBottom: 2,
                justifyContent: sidebarCollapsed ? 'center' : undefined,
                padding: sidebarCollapsed ? '9px 8px' : undefined,
                cursor: item.route ? 'pointer' : 'default',
              }}
            >
              <span style={{ color: item.active ? 'var(--sidebar-accent)' : 'var(--sidebar-text)', flexShrink: 0 }}>
                {item.icon}
              </span>
              {!sidebarCollapsed && item.label}
              {!sidebarCollapsed && item.badge !== null && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 12px', borderTop: '1px solid var(--sidebar-border)' }}>
          {/* User info row */}
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
          {/* Collapse toggle */}
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

      {/* ── Main area ──────────────────────────────────────────── */}
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
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
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
              placeholder="Buscar apresentações…"
              className="input"
              style={{ paddingLeft: 36, fontSize: 13.5 }}
            />
          </div>

          <div style={{ flex: 1 }} />

          {/* Theme toggle */}
          <ThemeToggle />

          {/* New btn */}
          <button
            onClick={() => setShowNew(true)}
            className="btn btn-primary"
          >
            <IcoPlus />
            Nova apresentação
          </button>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          {/* Page header */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 4 }}>
                {searchQuery ? `Resultados para "${searchQuery}"` : 'Minhas Apresentações'}
              </h1>
              {!loading && (
                <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>
                  {filtered.length} {filtered.length !== 1 ? 'apresentações' : 'apresentação'}
                </p>
              )}
            </div>
          </div>

          {/* Loading skeletons */}
          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {[1, 2, 3, 4, 5, 6].map((i) => <CardSkeleton key={i} />)}
            </div>
          )}

          {/* Empty state */}
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
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2"/>
                  <path d="M8 21h8M12 17v4"/>
                </svg>
              </div>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                  {searchQuery ? 'Nenhum resultado encontrado' : 'Nenhuma apresentação ainda'}
                </h2>
                <p style={{ fontSize: 14, color: 'var(--text-3)', maxWidth: 360, margin: '0 auto' }}>
                  {searchQuery
                    ? `Tente buscar por outro termo.`
                    : 'Crie sua primeira apresentação e comece a contar histórias visuais.'}
                </p>
              </div>
              {!searchQuery && (
                <button onClick={() => setShowNew(true)} className="btn btn-primary" style={{ marginTop: 8 }}>
                  <IcoPlus />
                  Criar primeira apresentação
                </button>
              )}
            </div>
          )}

          {/* Cards grid */}
          {!loading && filtered.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
            }}>
              {filtered.map((p) => (
                <PresentationCard
                  key={p.id}
                  presentation={p}
                  onOpen={() => router.push(`/editor/${p.id}`)}
                  onDuplicate={() => handleDuplicate(p)}
                  onDelete={() => setDeleteConfirm(p.id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ── Modal: Nova Apresentação ─────────────────────────── */}
      {showNew && (
        <Modal onClose={() => setShowNew(false)} title="Nova Apresentação">
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Título
            </label>
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              className="input"
              style={{ fontSize: 15 }}
              placeholder="Nome da apresentação"
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Tema inicial
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {DEFAULT_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setNewThemeId(theme.id)}
                  style={{
                    padding: 12,
                    border: `2px solid ${newThemeId === theme.id ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--r-md)',
                    background: newThemeId === theme.id ? 'var(--accent-soft)' : 'var(--bg)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s var(--ease)',
                  }}
                >
                  {/* Mini preview */}
                  <div style={{ height: 36, borderRadius: 6, background: theme.colors.background, marginBottom: 8, overflow: 'hidden', position: 'relative', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ position: 'absolute', bottom: 6, left: 6, right: 6, height: 3, borderRadius: 2, background: theme.colors.primary, opacity: 0.8 }} />
                    <div style={{ position: 'absolute', bottom: 1, left: 6, width: '50%', height: 2, borderRadius: 2, background: theme.colors.secondary, opacity: 0.5 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                    {[theme.colors.primary, theme.colors.secondary, theme.colors.accent].map((c) => (
                      <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: newThemeId === theme.id ? 'var(--accent)' : 'var(--text-2)' }}>
                    {theme.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => { setShowNew(false); setShowAIWizard(true); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 12.5, fontWeight: 600, padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <IcoSparkle />
              Prefere colar dados e gerar com IA?
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowNew(false)} className="btn btn-ghost">{t.btn_cancel}</button>
              <button onClick={handleCreate} className="btn btn-primary">{t.btn_create}</button>
            </div>
          </div>
        </Modal>
      )}

      {showAIWizard && (
        <NewPresentationWizard onClose={() => setShowAIWizard(false)} showToast={showToast} />
      )}

      {/* ── Modal: Confirmar Exclusão ────────────────────────── */}
      {deleteConfirm && (
        <Modal onClose={() => setDeleteConfirm(null)} title="Excluir Apresentação">
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24, lineHeight: 1.6 }}>
            Esta ação não pode ser desfeita. A apresentação será removida permanentemente do seu armazenamento local.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => setDeleteConfirm(null)} className="btn btn-ghost">{t.btn_cancel}</button>
            <button onClick={() => handleDelete(deleteConfirm)} className="btn btn-danger">
              <IcoTrash />
              {t.btn_delete}
            </button>
          </div>
        </Modal>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <Onboarding />
    </div>
  );
}
