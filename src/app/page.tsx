'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuid } from 'uuid';
import type { Presentation } from '@/types/slide';
import { storage } from '@/lib/storage';
import { DEFAULT_THEMES } from '@/lib/themes';
import { createSlideFromLayout } from '@/lib/templates';
import { SlideMiniature } from '@/components/editor/SlideMiniature';
import { t } from '@/lib/i18n';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function HomePage() {
  const router = useRouter();
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('Nova Apresentação');
  const [newThemeId, setNewThemeId] = useState('slate');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(() => setPresentations(storage.list()), []);
  useEffect(() => { load(); }, [load]);

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

  const handleDelete = useCallback((id: string) => {
    storage.delete(id);
    load();
    setDeleteConfirm(null);
  }, [load]);

  const handleDuplicate = useCallback((p: Presentation) => {
    const now = new Date().toISOString();
    const copy: Presentation = { ...p, id: uuid(), title: `${p.title} (cópia)`, metadata: { ...p.metadata, createdAt: now, updatedAt: now } };
    storage.set(copy);
    load();
  }, [load]);

  const filtered = presentations.filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header style={{ background: 'var(--panel-bg)', borderBottom: '1px solid var(--border)', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', gap: 24, position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--accent)', letterSpacing: -0.5 }}>{t.app_name}</div>
        <div style={{ flex: 1 }} />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.home_search_placeholder}
          style={{ padding: '7px 14px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none', width: 240 }}
        />
        <ThemeToggle />
        <button
          onClick={() => setShowNew(true)}
          style={{ padding: '8px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          {t.home_new_btn}
        </button>
      </header>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px' }}>
        {filtered.length === 0 && !searchQuery ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 16, color: 'var(--text-secondary)' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
            </svg>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{t.home_empty_title}</p>
              <p style={{ fontSize: 14, margin: '8px 0 0' }}>{t.home_empty_sub}</p>
            </div>
            <button onClick={() => setShowNew(true)} style={{ padding: '10px 24px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
              {t.home_empty_btn}
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
                {searchQuery ? t.home_result(searchQuery) : t.home_title}
              </h1>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t.home_count(filtered.length)}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
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
          </>
        )}
      </main>

      {showNew && (
        <Modal onClose={() => setShowNew(false)} title={t.modal_new}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontWeight: 500 }}>{t.label_title}</label>
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'var(--bg)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, fontWeight: 500 }}>{t.label_theme}</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {DEFAULT_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setNewThemeId(theme.id)}
                  style={{ padding: 10, border: `2px solid ${newThemeId === theme.id ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 8, background: theme.colors.background, cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s' }}
                >
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[theme.colors.primary, theme.colors.secondary, theme.colors.accent].map((c) => (
                      <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: theme.colors.text }}>{theme.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => setShowNew(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', color: 'var(--text)', fontSize: 14 }}>{t.btn_cancel}</button>
            <button onClick={handleCreate} style={{ padding: '8px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>{t.btn_create}</button>
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal onClose={() => setDeleteConfirm(null)} title={t.modal_delete}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>{t.modal_delete_confirm}</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => setDeleteConfirm(null)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', color: 'var(--text)', fontSize: 14 }}>{t.btn_cancel}</button>
            <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: '8px 20px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>{t.btn_delete}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PresentationCard({ presentation: p, onOpen, onDuplicate, onDelete }: {
  presentation: Presentation; onOpen: () => void; onDuplicate: () => void; onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const coverSlide = p.slides[0];

  return (
    <div
      style={{ background: 'var(--panel-bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.15s', position: 'relative' }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; setMenuOpen(false); }}
      onClick={onOpen}
    >
      <div style={{ height: 158, background: coverSlide?.background?.type === 'color' ? coverSlide.background.color : '#f1f5f9', overflow: 'hidden', position: 'relative' }}>
        {coverSlide && (
          <div style={{ transform: 'scale(0.289)', transformOrigin: 'top left', width: 960, height: 540, pointerEvents: 'none' }}>
            <SlideMiniature slide={coverSlide} presentation={p} />
          </div>
        )}
        <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 11, padding: '2px 7px', borderRadius: 20 }}>
          {p.slides.length} slides
        </div>
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>{formatDate(p.metadata.updatedAt)}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            style={{ background: 'transparent', border: 'none', borderRadius: 6, padding: '3px 6px', cursor: 'pointer', color: 'var(--text-secondary)', position: 'relative' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
            </svg>
            {menuOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
                <div style={{ position: 'absolute', right: 0, top: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 0', zIndex: 99, minWidth: 140, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                  {[
                    { label: t.card_open, action: (e: React.MouseEvent) => { e.stopPropagation(); onOpen(); } },
                    { label: t.card_duplicate, action: (e: React.MouseEvent) => { e.stopPropagation(); onDuplicate(); setMenuOpen(false); } },
                    { label: t.card_delete, action: (e: React.MouseEvent) => { e.stopPropagation(); onDelete(); setMenuOpen(false); }, danger: true },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={item.action}
                      style={{ width: '100%', padding: '8px 14px', background: 'transparent', border: 'none', textAlign: 'left', fontSize: 13, color: (item as { danger?: boolean }).danger ? '#ef4444' : 'var(--text)', cursor: 'pointer' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 8, alignItems: 'center' }}>
          {[p.theme.colors.primary, p.theme.colors.secondary, p.theme.colors.accent].map((c) => (
            <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
          ))}
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 4 }}>{p.theme.name}</span>
        </div>
      </div>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--panel-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, width: 480, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ThemeToggle() {
  const [mode, setMode] = useState<'light' | 'dark' | 'auto'>('auto');

  const cycle = () => {
    const next = mode === 'light' ? 'dark' : mode === 'dark' ? 'auto' : 'light';
    setMode(next);
    if (next === 'auto') {
      document.documentElement.removeAttribute('data-theme');
      localStorage.removeItem('vizu-theme');
    } else {
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('vizu-theme', next);
    }
  };

  return (
    <button
      onClick={cycle}
      title={`Tema: ${mode}`}
      style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {mode === 'dark'
          ? <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          : <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        }
      </svg>
      {mode === 'light' ? t.theme_light : mode === 'dark' ? t.theme_dark : t.theme_auto}
    </button>
  );
}
