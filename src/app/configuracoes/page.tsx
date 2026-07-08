'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_THEMES } from '@/lib/themes';
import { getSettings, saveSettings, DEFAULT_SETTINGS } from '@/lib/settingsStorage';
import type { VisuSettings } from '@/lib/settingsStorage';
import { resetOnboarding } from '@/components/Onboarding';

/* ── Icon components ──────────────────────────────────────────── */
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
function IcoPlus() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>;
}
function IcoCheck() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>;
}

/* ── Theme Toggle ─────────────────────────────────────────────── */
function ThemeToggle({ value, onChange }: { value: 'light' | 'dark' | 'auto'; onChange: (v: 'light' | 'dark' | 'auto') => void }) {
  const apply = (next: 'light' | 'dark' | 'auto') => {
    onChange(next);
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
        className={value === 'light' ? 'active' : ''}
        onClick={() => apply('light')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
      </button>
      <button
        data-set-theme="auto"
        aria-label="Seguir sistema"
        className={value === 'auto' ? 'active' : ''}
        onClick={() => apply('auto')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
      </button>
      <button
        data-set-theme="dark"
        aria-label="Tema escuro"
        className={value === 'dark' ? 'active' : ''}
        onClick={() => apply('dark')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
      </button>
    </div>
  );
}

/* ── Toggle component ─────────────────────────────────────────── */
function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
      aria-label={label}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        background: value ? 'var(--accent)' : 'var(--border)',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute',
        top: 3,
        left: value ? 21 : 3,
        width: 16,
        height: 16,
        borderRadius: 8,
        background: '#fff',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}

/* ── Section header ───────────────────────────────────────────── */
function SectionHeader({ title }: { title: string }) {
  return (
    <h2 style={{
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--text-3)',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      margin: '0 0 16px 0',
      paddingBottom: 8,
      borderBottom: '1px solid var(--border)',
    }}>
      {title}
    </h2>
  );
}

/* ── Field row ────────────────────────────────────────────────── */
function FieldRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 24,
      padding: '12px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text)', lineHeight: 1.3 }}>{label}</div>
        {description && (
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.4 }}>{description}</div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

/* ── Keyboard shortcut table ──────────────────────────────────── */
const SHORTCUTS = [
  { action: 'Desfazer', keys: 'Ctrl+Z' },
  { action: 'Refazer', keys: 'Ctrl+Shift+Z' },
  { action: 'Duplicar elemento', keys: 'Ctrl+D' },
  { action: 'Salvar', keys: 'Ctrl+S' },
  { action: 'Exportar', keys: 'Ctrl+Shift+E' },
  { action: 'Selecionar todos', keys: 'Ctrl+A' },
  { action: 'Excluir elemento', keys: 'Delete / Backspace' },
  { action: 'Zoom in', keys: 'Ctrl+=' },
  { action: 'Zoom out', keys: 'Ctrl+-' },
  { action: 'Ajustar à tela', keys: 'Ctrl+0' },
  { action: 'Preview', keys: 'F5' },
  { action: 'Alternar grade', keys: 'Ctrl+G' },
  { action: 'Inserir texto', keys: 'T' },
  { action: 'Inserir forma', keys: 'R' },
  { action: 'Inserir imagem', keys: 'M' },
  { action: 'Inserir ícone', keys: 'I' },
];

const FONTS = [
  'Inter',
  'Georgia',
  'Courier New',
  'Arial',
  'Verdana',
  'Times New Roman',
  'Trebuchet MS',
];

/* ── Main page ────────────────────────────────────────────────── */
export default function ConfiguracoesPage() {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settings, setSettings] = useState<VisuSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [clearStep, setClearStep] = useState<0 | 1>(0);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const update = useCallback(<K extends keyof VisuSettings>(key: K, value: VisuSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      saveSettings(next);
      return next;
    });
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    setSaved(true);
    savedTimerRef.current = setTimeout(() => setSaved(false), 1500);
  }, []);

  const handleThemeChange = useCallback((v: 'light' | 'dark' | 'auto') => {
    update('theme', v);
  }, [update]);

  const handleExportData = useCallback(() => {
    try {
      const raw = localStorage.getItem('vizu_presentations') ?? '{}';
      const presentations = JSON.parse(raw);
      const blob = new Blob([JSON.stringify({ presentations, settings, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vizu-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently fail
    }
  }, [settings]);

  const handleClearPresentations = useCallback(() => {
    if (clearStep === 0) {
      setClearStep(1);
      return;
    }
    localStorage.removeItem('vizu_presentations');
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
        <div style={{ padding: '12px 12px 8px' }}>
          <button
            onClick={() => router.push('/')}
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
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '4px 8px', overflowY: 'auto', overflowX: 'hidden' }} className="sidebar-scroll">
          {!sidebarCollapsed && (
            <div style={{ marginBottom: 4, padding: '8px 4px 4px', fontSize: 11, fontWeight: 600, color: 'var(--sidebar-text)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
              Principal
            </div>
          )}
          {sidebarCollapsed && <div style={{ height: 12 }} />}
          {navItems.map((item) => {
            const isActive = item.route === '/configuracoes';
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
                {(settings.displayName?.[0] ?? 'U').toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden', minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sidebar-text-active)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {settings.displayName || 'Usuário'}
                </div>
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
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0, flex: 1 }}>
            Configurações
          </h1>

          {/* Saved indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--ok)',
            opacity: saved ? 1 : 0,
            transition: 'opacity 0.3s',
          }}>
            <IcoCheck />
            Salvo
          </div>

          <ThemeToggle value={settings.theme} onChange={handleThemeChange} />
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px 24px' }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>

            {/* ── Aparência ─────────────────────────────────── */}
            <section style={{ marginBottom: 40 }}>
              <SectionHeader title="Aparência" />

              <FieldRow label="Tema da interface" description="Define se a interface usa cores claras, escuras ou segue o sistema.">
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['light', 'auto', 'dark'] as const).map((opt) => {
                    const labels = { light: '☀ Claro', auto: '⚙ Auto', dark: '☾ Escuro' };
                    const isActive = settings.theme === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => handleThemeChange(opt)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--r-full)',
                          border: `1.5px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                          background: isActive ? 'var(--accent-soft)' : 'transparent',
                          color: isActive ? 'var(--accent-hover)' : 'var(--text-2)',
                          fontSize: 12,
                          fontWeight: isActive ? 600 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          fontFamily: 'inherit',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {labels[opt]}
                      </button>
                    );
                  })}
                </div>
              </FieldRow>

              <FieldRow label="Fonte padrão" description="Fonte utilizada por padrão ao inserir novos textos.">
                <select
                  aria-label="Fonte padrão"
                  className="select"
                  style={{ width: 180 }}
                  value={settings.defaultFontFamily}
                  onChange={(e) => update('defaultFontFamily', e.target.value)}
                >
                  {FONTS.map((f) => (
                    <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                  ))}
                </select>
              </FieldRow>
            </section>

            {/* ── Editor ────────────────────────────────────── */}
            <section style={{ marginBottom: 40 }}>
              <SectionHeader title="Editor" />

              <FieldRow label="Autossalvar" description="Intervalo de salvamento automático durante a edição.">
                <select
                  aria-label="Autossalvar"
                  className="select"
                  style={{ width: 160 }}
                  value={settings.autosaveInterval}
                  onChange={(e) => update('autosaveInterval', Number(e.target.value))}
                >
                  <option value={5}>A cada 5 segundos</option>
                  <option value={15}>A cada 15 segundos</option>
                  <option value={30}>A cada 30 segundos</option>
                  <option value={60}>A cada 1 minuto</option>
                  <option value={0}>Desativado</option>
                </select>
              </FieldRow>

              <FieldRow
                label="Exibir grade"
                description="Mostra a grade de pontos no canvas do editor."
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Toggle label="Exibir grade" value={settings.showGrid} onChange={(v) => update('showGrid', v)} />
                  {settings.showGrid && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="number"
                        min={5}
                        max={100}
                        step={5}
                        value={settings.gridSize}
                        onChange={(e) => update('gridSize', Math.max(5, Math.min(100, Number(e.target.value))))}
                        className="input"
                        style={{ width: 64, padding: '5px 8px', fontSize: 13, textAlign: 'center' }}
                      />
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>px</span>
                    </div>
                  )}
                </div>
              </FieldRow>

              <FieldRow label="Snap à grade" description="Encaixa elementos na grade ao mover ou redimensionar.">
                <Toggle label="Snap à grade" value={settings.snapToGrid} onChange={(v) => update('snapToGrid', v)} />
              </FieldRow>

              <FieldRow label="Guias inteligentes" description="Exibe linhas de alinhamento ao mover elementos.">
                <Toggle label="Guias inteligentes" value={settings.smartGuides} onChange={(v) => update('smartGuides', v)} />
              </FieldRow>

              <FieldRow label="Unidade de medida" description="Unidade exibida nas propriedades de posição e tamanho.">
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['px', 'cm'] as const).map((opt) => {
                    const isActive = settings.unit === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => update('unit', opt)}
                        style={{
                          padding: '6px 16px',
                          borderRadius: 'var(--r-full)',
                          border: `1.5px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                          background: isActive ? 'var(--accent-soft)' : 'transparent',
                          color: isActive ? 'var(--accent-hover)' : 'var(--text-2)',
                          fontSize: 12,
                          fontWeight: isActive ? 600 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          fontFamily: 'inherit',
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </FieldRow>
            </section>

            {/* ── Nova Apresentação ─────────────────────────── */}
            <section style={{ marginBottom: 40 }}>
              <SectionHeader title="Nova Apresentação" />

              <FieldRow label="Tamanho padrão" description="Dimensão do slide usada ao criar novas apresentações.">
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['16:9', '4:3', 'A4'] as const).map((opt) => {
                    const isActive = settings.defaultSlideSize === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => update('defaultSlideSize', opt)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 'var(--r-full)',
                          border: `1.5px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                          background: isActive ? 'var(--accent-soft)' : 'transparent',
                          color: isActive ? 'var(--accent-hover)' : 'var(--text-2)',
                          fontSize: 12,
                          fontWeight: isActive ? 600 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          fontFamily: 'inherit',
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </FieldRow>

              {/* Theme cards */}
              <div style={{ paddingTop: 16 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text)', marginBottom: 12 }}>Tema padrão</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {DEFAULT_THEMES.map((theme) => {
                    const isActive = settings.defaultThemeId === theme.id;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => update('defaultThemeId', theme.id)}
                        style={{
                          padding: 12,
                          border: `2px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                          borderRadius: 'var(--r-md)',
                          background: isActive ? 'var(--accent-soft)' : 'var(--bg)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s var(--ease)',
                          fontFamily: 'inherit',
                        }}
                      >
                        {/* Mini preview */}
                        <div style={{
                          height: 36,
                          borderRadius: 6,
                          background: theme.colors.background,
                          marginBottom: 8,
                          overflow: 'hidden',
                          position: 'relative',
                          border: '1px solid rgba(0,0,0,0.06)',
                        }}>
                          <div style={{ position: 'absolute', bottom: 6, left: 6, right: 6, height: 3, borderRadius: 2, background: theme.colors.primary, opacity: 0.8 }} />
                          <div style={{ position: 'absolute', bottom: 1, left: 6, width: '50%', height: 2, borderRadius: 2, background: theme.colors.secondary, opacity: 0.5 }} />
                        </div>
                        <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                          {[theme.colors.primary, theme.colors.secondary, theme.colors.accent].map((c) => (
                            <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                          ))}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: isActive ? 'var(--accent-hover)' : 'var(--text-2)' }}>
                          {theme.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ── Ajuda ─────────────────────────────────────── */}
            <section style={{ marginBottom: 40 }}>
              <SectionHeader title="Ajuda" />

              <FieldRow label="Tour de boas-vindas" description="Reveja a introdução rápida às principais funções da Vizu.">
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: 13 }}
                  onClick={() => { resetOnboarding(); router.push('/'); }}
                >
                  Reiniciar tour
                </button>
              </FieldRow>
            </section>

            {/* ── Atalhos de Teclado ────────────────────────── */}
            <section style={{ marginBottom: 40 }}>
              <SectionHeader title="Atalhos de Teclado" />

              <div style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                overflow: 'hidden',
              }}>
                {SHORTCUTS.map((s, i) => (
                  <div
                    key={s.action}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 16px',
                      background: i % 2 === 0 ? 'var(--bg)' : 'var(--surface)',
                      borderBottom: i < SHORTCUTS.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{s.action}</span>
                    <kbd style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: 'var(--text-3)',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--r-xs)',
                      padding: '3px 8px',
                      fontFamily: 'Courier New, monospace',
                      letterSpacing: '0.02em',
                    }}>
                      {s.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Conta ─────────────────────────────────────── */}
            <section style={{ marginBottom: 40 }}>
              <SectionHeader title="Conta" />

              <FieldRow label="Nome de exibição" description="Aparece na sidebar e na identificação dos seus projetos.">
                <input
                  type="text"
                  value={settings.displayName}
                  onChange={(e) => update('displayName', e.target.value)}
                  className="input"
                  style={{ width: 200 }}
                  placeholder="Seu nome"
                  maxLength={50}
                />
              </FieldRow>

              <FieldRow label="Email" description="Conta vinculada ao Vizu.">
                <span style={{
                  fontSize: 13,
                  color: 'var(--text-3)',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-sm)',
                  padding: '6px 12px',
                  display: 'block',
                  userSelect: 'text',
                }}>
                  caiquezeviani@gmail.com
                </span>
              </FieldRow>

              <div style={{ paddingTop: 16 }}>
                <button
                  className="btn btn-ghost"
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  disabled
                  title="Funcionalidade não disponível nesta versão"
                >
                  Sair da conta
                </button>
              </div>

              {/* Zona de perigo */}
              <div style={{
                marginTop: 32,
                padding: '20px',
                border: '1px solid var(--bad)',
                borderRadius: 'var(--r-md)',
                background: 'var(--bad-soft)',
              }}>
                <h3 style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--bad)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 16,
                }}>
                  Zona de perigo
                </h3>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-ghost"
                    onClick={handleExportData}
                    style={{ fontSize: 13 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    Exportar meus dados
                  </button>

                  <button
                    onClick={handleClearPresentations}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '9px 16px',
                      borderRadius: 'var(--r-sm)',
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: 'inherit',
                      border: `1.5px solid ${clearStep === 1 ? 'var(--bad)' : 'var(--border)'}`,
                      background: clearStep === 1 ? 'var(--bad)' : 'transparent',
                      color: clearStep === 1 ? '#fff' : 'var(--bad)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseLeave={() => {
                      if (clearStep === 1) {
                        setTimeout(() => setClearStep(0), 3000);
                      }
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                    {clearStep === 0 ? 'Limpar apresentações' : 'Confirmar exclusão?'}
                  </button>
                </div>

                {clearStep === 1 && (
                  <p style={{ fontSize: 12, color: 'var(--bad)', marginTop: 10, margin: '10px 0 0' }}>
                    Todas as apresentações serão excluídas permanentemente. Esta ação não pode ser desfeita.
                  </p>
                )}
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}
