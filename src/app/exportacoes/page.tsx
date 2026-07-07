'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';
import {
  getAllExportHistory, removeExportRecord, clearExportHistory, exportAsPptx,
  type ExportRecord,
} from '@/lib/exportUtils';

/* ── Icon components (mesmos da sidebar de Configurações) ─────── */
function IcoPresentation() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>;
}
function IcoLayout() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>;
}
function IcoDownload() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>;
}
function IcoSettings() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
}
function IcoTrash() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>;
}
function IcoFormat({ format }: { format: ExportRecord['format'] }) {
  if (format === 'pptx') {
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 8h8M8 12h5M8 16h8"/></svg>;
  }
  if (format === 'pdf') {
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>;
  }
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function ExportacoesPage() {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [history, setHistory] = useState<ExportRecord[]>([]);
  const [clearStep, setClearStep] = useState<0 | 1>(0);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    setHistory(getAllExportHistory());
  }, []);

  const handleRedownload = useCallback(async (record: ExportRecord) => {
    if (record.format !== 'pptx') {
      // PDF/PNG dependem de renderizar os slides no DOM do editor — reabrir lá para reexportar.
      router.push(`/editor/${record.presentationId}`);
      return;
    }
    const presentation = storage.get(record.presentationId);
    if (!presentation) return;
    setBusyId(record.id);
    try {
      await exportAsPptx(presentation);
    } finally {
      setBusyId(null);
    }
  }, [router]);

  const handleRemove = useCallback((id: string) => {
    removeExportRecord(id);
    setHistory((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleClearAll = useCallback(() => {
    if (clearStep === 0) {
      setClearStep(1);
      return;
    }
    clearExportHistory();
    setHistory([]);
    setClearStep(0);
  }, [clearStep]);

  const navItems = [
    { icon: <IcoPresentation />, label: 'Apresentações', route: '/' },
    { icon: <IcoLayout />, label: 'Templates', route: '/templates' },
    { icon: <IcoDownload />, label: 'Exportações', route: '/exportacoes' },
    { icon: <IcoSettings />, label: 'Configurações', route: '/configuracoes' },
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
        <div style={{ padding: '20px 14px 16px', borderBottom: '1px solid var(--sidebar-border)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: 'var(--sidebar-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <path d="M8 21h8M12 17v4"/>
              </svg>
            </div>
            {!sidebarCollapsed && (
              <div style={{ overflow: 'hidden', flexShrink: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--sidebar-text-active)', letterSpacing: '-0.02em', lineHeight: 1, whiteSpace: 'nowrap' }}>Vizu</div>
                <div style={{ fontSize: 11, color: 'var(--sidebar-text)', marginTop: 2, whiteSpace: 'nowrap' }}>Editor de slides</div>
              </div>
            )}
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', overflowX: 'hidden' }} className="sidebar-scroll">
          {!sidebarCollapsed && (
            <div style={{ marginBottom: 4, padding: '8px 4px 4px', fontSize: 11, fontWeight: 600, color: 'var(--sidebar-text)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
              Principal
            </div>
          )}
          {navItems.map((item) => {
            const isActive = item.route === '/exportacoes';
            return (
              <button
                key={item.label}
                title={sidebarCollapsed ? item.label : undefined}
                className={`nav-item${isActive ? ' active' : ''}`}
                onClick={() => router.push(item.route)}
                style={{
                  marginBottom: 2,
                  justifyContent: sidebarCollapsed ? 'center' : undefined,
                  padding: sidebarCollapsed ? '9px 8px' : undefined,
                }}
              >
                <span style={{ color: isActive ? 'var(--sidebar-accent)' : 'var(--sidebar-text)', flexShrink: 0 }}>
                  {item.icon}
                </span>
                {!sidebarCollapsed && item.label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: '12px 12px', borderTop: '1px solid var(--sidebar-border)' }}>
          <button
            onClick={() => setSidebarCollapsed((v) => !v)}
            title={sidebarCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
            style={{
              width: '100%', padding: '7px 8px', background: 'transparent', border: '1px solid var(--sidebar-border)',
              borderRadius: 'var(--r-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start', gap: 8, color: 'var(--sidebar-text)',
              fontSize: 12, fontWeight: 500, fontFamily: 'inherit', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--sidebar-accent-soft)'; e.currentTarget.style.color = 'var(--sidebar-accent)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sidebar-text)'; }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.22s', flexShrink: 0 }}>
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            {!sidebarCollapsed && 'Recolher'}
          </button>
        </div>
      </aside>

      {/* ── Main area ──────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <header style={{
          height: 60, background: 'var(--surface)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12, flexShrink: 0, zIndex: 5,
        }}>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0, flex: 1 }}>
            Exportações
          </h1>
          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              onMouseLeave={() => { if (clearStep === 1) setTimeout(() => setClearStep(0), 3000); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 'var(--r-sm)',
                fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit',
                border: `1.5px solid ${clearStep === 1 ? 'var(--bad)' : 'var(--border)'}`,
                background: clearStep === 1 ? 'var(--bad)' : 'transparent',
                color: clearStep === 1 ? '#fff' : 'var(--bad)', cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <IcoTrash />
              {clearStep === 0 ? 'Limpar histórico' : 'Confirmar exclusão?'}
            </button>
          )}
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '32px 24px' }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            {history.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '80px 24px', color: 'var(--text-3)',
                border: '1px dashed var(--border)', borderRadius: 'var(--r-md)',
              }}>
                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center', opacity: 0.5 }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                </div>
                <p style={{ fontSize: 14, margin: 0 }}>Nenhuma exportação ainda.</p>
                <p style={{ fontSize: 12.5, margin: '4px 0 0' }}>Exporte uma apresentação no editor para vê-la aqui.</p>
              </div>
            ) : (
              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                {history.map((r, i) => (
                  <div
                    key={r.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                      background: i % 2 === 0 ? 'var(--bg)' : 'var(--surface)',
                      borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <span style={{ color: r.status === 'error' ? 'var(--bad)' : 'var(--text-3)', flexShrink: 0 }}>
                      <IcoFormat format={r.format} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.presentationTitle || 'Sem título'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                        {r.format.toUpperCase()} · {r.slidesCount} slide{r.slidesCount !== 1 ? 's' : ''} · {formatDate(r.createdAt)}
                        {r.status === 'error' && <span style={{ color: 'var(--bad)' }}> · falhou</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRedownload(r)}
                      disabled={busyId === r.id}
                      className="btn btn-ghost"
                      style={{ fontSize: 12.5, flexShrink: 0, opacity: busyId === r.id ? 0.6 : 1 }}
                      title={r.format === 'pptx' ? 'Gerar novamente e baixar' : 'Abrir no editor para reexportar'}
                    >
                      {r.format === 'pptx' ? (busyId === r.id ? 'Gerando…' : 'Baixar novamente') : 'Abrir no editor'}
                    </button>
                    <button
                      onClick={() => handleRemove(r.id)}
                      title="Remover do histórico"
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 6, flexShrink: 0 }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--bad)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-3)'; }}
                    >
                      <IcoTrash />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
