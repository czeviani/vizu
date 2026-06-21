'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Presentation } from '@/types/slide';
import { SlideMiniature } from './SlideMiniature';
import {
  exportAsPptx,
  exportAsPdf,
  exportAsPng,
  getExportHistory,
  saveExportRecord,
  type ExportRecord,
} from '@/lib/exportUtils';
import { v4 as uuid } from 'uuid';

/* ── Types ─────────────────────────────────────────────────── */

export interface ExportModalProps {
  presentation: Presentation;
  onClose: () => void;
}

type Tab = 'pptx' | 'pdf' | 'png';
type PngQuality = '720p' | '1080p' | '1440p';

/* ── Helpers ────────────────────────────────────────────────── */

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function FormatIcon({ format }: { format: 'pptx' | 'pdf' | 'png' }) {
  if (format === 'pptx') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
      </svg>
    );
  }
  if (format === 'pdf') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <path d="m21 15-5-5L5 21"/>
    </svg>
  );
}

/* ── ExportModal ────────────────────────────────────────────── */

export function ExportModal({ presentation, onClose }: ExportModalProps) {
  const [tab, setTab] = useState<Tab>('pptx');
  const [pngQuality, setPngQuality] = useState<PngQuality>('1080p');
  const [slideRange, setSlideRange] = useState<'all' | 'range'>('all');
  const [rangeFrom, setRangeFrom] = useState(1);
  const [rangeTo, setRangeTo] = useState(presentation.slides.length);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [history, setHistory] = useState<ExportRecord[]>(() =>
    getExportHistory(presentation.id)
  );

  // Hidden slide render refs — one per slide in the presentation
  const slideContainerRefs = useRef<(HTMLDivElement | null)[]>([]);

  /* ── Escape to close ──────────────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  /* ── Toast auto-dismiss ───────────────────────────────────── */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ── Slide selection ──────────────────────────────────────── */
  const slides = presentation.slides;
  const selectedSlides = useCallback(() => {
    if (slideRange === 'all') return slides;
    const from = Math.max(1, rangeFrom) - 1;
    const to = Math.min(slides.length, rangeTo);
    return slides.slice(from, to);
  }, [slides, slideRange, rangeFrom, rangeTo]);

  /* ── Progress helper ──────────────────────────────────────── */
  const handleProgress = (current: number, total: number) => {
    setProgress(Math.round((current / total) * 100));
    setProgressText(`Gerando arquivo… slide ${current} de ${total}`);
  };

  /* ── Ref helpers ──────────────────────────────────────────── */
  // Returns an array of RefObjects for the selected slides, pointing to
  // the hidden DOM containers rendered below.
  const getSelectedRefs = useCallback(() => {
    const sel = selectedSlides();
    return sel.map((s) => {
      const idx = slides.findIndex((x) => x.id === s.id);
      return { current: slideContainerRefs.current[idx] ?? null };
    });
  }, [selectedSlides, slides]);

  /* ── Record helper ────────────────────────────────────────── */
  const recordExport = (format: 'pptx' | 'pdf' | 'png', status: 'completed' | 'error') => {
    const record: ExportRecord = {
      id: uuid(),
      presentationId: presentation.id,
      presentationTitle: presentation.title,
      format,
      status,
      createdAt: new Date().toISOString(),
      slidesCount: selectedSlides().length,
    };
    saveExportRecord(record);
    setHistory(getExportHistory(presentation.id));
    return record;
  };

  /* ── Export handlers ──────────────────────────────────────── */
  const runExport = async (fn: () => Promise<void>, format: 'pptx' | 'pdf' | 'png') => {
    setExporting(true);
    setProgress(0);
    setProgressText('Iniciando exportação…');
    try {
      await fn();
      recordExport(format, 'completed');
      setToast('Exportação concluída!');
    } catch (err) {
      console.error('[ExportModal] export error:', err);
      recordExport(format, 'error');
      setToast('Erro ao exportar. Verifique o console.');
    } finally {
      setExporting(false);
      setProgress(0);
      setProgressText('');
    }
  };

  const handleExportPptx = () =>
    runExport(async () => {
      setProgressText('Gerando arquivo PPTX…');
      setProgress(30);
      // Build a temporary presentation with only selected slides
      const sel = selectedSlides();
      const partial = { ...presentation, slides: sel };
      await exportAsPptx(partial);
      setProgress(100);
    }, 'pptx');

  const handleExportPdf = () =>
    runExport(async () => {
      const refs = getSelectedRefs();
      await exportAsPdf(presentation, refs, handleProgress);
    }, 'pdf');

  const handleExportPng = () =>
    runExport(async () => {
      const refs = getSelectedRefs();
      await exportAsPng(presentation, refs, pngQuality, handleProgress);
    }, 'png');

  /* ── Styles ─────────────────────────────────────────────────── */
  const s = {
    backdrop: {
      position: 'fixed' as const,
      inset: 0,
      zIndex: 1100,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    box: {
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
      boxShadow: 'var(--shadow-lg)',
      width: 520,
      maxWidth: '95vw',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '18px 20px 14px',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
    },
    title: {
      fontSize: 15,
      fontWeight: 700,
      color: 'var(--text)',
      margin: 0,
    },
    body: {
      overflowY: 'auto' as const,
      flex: 1,
      padding: '16px 20px',
    },
    tabs: {
      display: 'flex',
      gap: 4,
      marginBottom: 16,
      background: 'var(--surface-2)',
      borderRadius: 'var(--r-sm)',
      padding: 3,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: 600,
      color: 'var(--text-3)',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      marginBottom: 8,
      marginTop: 16,
    },
    divider: {
      height: 1,
      background: 'var(--border)',
      margin: '16px 0',
    },
    historyRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '7px 0',
      borderBottom: '1px solid var(--border)',
      fontSize: 12.5,
      color: 'var(--text-2)',
    },
  };

  const tabBtn = (id: Tab, label: string) => (
    <button
      key={id}
      onClick={() => setTab(id)}
      style={{
        flex: 1,
        padding: '6px 0',
        fontSize: 12.5,
        fontWeight: tab === id ? 700 : 500,
        color: tab === id ? 'var(--accent)' : 'var(--text-3)',
        background: tab === id ? 'var(--surface)' : 'transparent',
        border: tab === id ? '1px solid var(--border)' : '1px solid transparent',
        borderRadius: 'var(--r-xs)',
        cursor: 'pointer',
        transition: 'all 0.15s',
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  );

  const qBtn = (id: PngQuality, label: string) => (
    <button
      key={id}
      onClick={() => setPngQuality(id)}
      style={{
        flex: 1,
        padding: '7px 0',
        fontSize: 12,
        fontWeight: pngQuality === id ? 700 : 500,
        color: pngQuality === id ? 'var(--accent)' : 'var(--text-3)',
        background: pngQuality === id ? 'var(--accent-soft)' : 'var(--surface-2)',
        border: `1px solid ${pngQuality === id ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 'var(--r-xs)',
        cursor: 'pointer',
        transition: 'all 0.15s',
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  );

  return (
    <>
      {/* Hidden off-screen slide renderers for capture */}
      {/* SlideMiniature renders at 120×68 (scale=0.125). We wrap it in a
          960×540 container with transform: scale(8) + transform-origin top-left
          to produce a full-resolution DOM node that html-to-image can capture. */}
      <div aria-hidden="true" style={{ position: 'fixed', left: -9999, top: 0, pointerEvents: 'none', zIndex: -1 }}>
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            ref={(el) => { slideContainerRefs.current[i] = el; }}
            style={{ width: 960, height: 540, overflow: 'hidden', position: 'relative', flexShrink: 0 }}
          >
            {/* Scale 120→960: factor = 960/120 = 8 */}
            <div style={{ transformOrigin: 'top left', transform: 'scale(8)' }}>
              <SlideMiniature slide={slide} presentation={presentation} />
            </div>
          </div>
        ))}
      </div>

      {/* Backdrop */}
      <div style={s.backdrop} onClick={onClose}>
        <div style={s.box} onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div style={s.header}>
            <h2 style={s.title}>Exportar Apresentação</h2>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: 4 }}
              title="Fechar (Esc)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Body */}
          <div style={s.body}>

            {/* Tabs */}
            <div style={s.tabs}>
              {tabBtn('pptx', 'PPTX')}
              {tabBtn('pdf', 'PDF')}
              {tabBtn('png', 'PNG')}
            </div>

            {/* Slide range selector */}
            <div style={{ marginBottom: 12 }}>
              <div style={s.sectionLabel}>Slides</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  onClick={() => setSlideRange('all')}
                  style={{
                    padding: '5px 12px',
                    fontSize: 12,
                    fontWeight: slideRange === 'all' ? 700 : 500,
                    color: slideRange === 'all' ? 'var(--accent)' : 'var(--text-3)',
                    background: slideRange === 'all' ? 'var(--accent-soft)' : 'var(--surface-2)',
                    border: `1px solid ${slideRange === 'all' ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--r-xs)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Todos ({slides.length})
                </button>
                <button
                  onClick={() => setSlideRange('range')}
                  style={{
                    padding: '5px 12px',
                    fontSize: 12,
                    fontWeight: slideRange === 'range' ? 700 : 500,
                    color: slideRange === 'range' ? 'var(--accent)' : 'var(--text-3)',
                    background: slideRange === 'range' ? 'var(--accent-soft)' : 'var(--surface-2)',
                    border: `1px solid ${slideRange === 'range' ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--r-xs)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Intervalo
                </button>
                {slideRange === 'range' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>De</span>
                    <input
                      type="number"
                      min={1}
                      max={slides.length}
                      value={rangeFrom}
                      onChange={(e) => setRangeFrom(Math.max(1, parseInt(e.target.value) || 1))}
                      className="input"
                      style={{ width: 54, textAlign: 'center', fontSize: 12, padding: '4px 6px' }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>até</span>
                    <input
                      type="number"
                      min={1}
                      max={slides.length}
                      value={rangeTo}
                      onChange={(e) => setRangeTo(Math.min(slides.length, parseInt(e.target.value) || slides.length))}
                      className="input"
                      style={{ width: 54, textAlign: 'center', fontSize: 12, padding: '4px 6px' }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div style={s.divider} />

            {/* ── PPTX tab ─────────────────────────── */}
            {tab === 'pptx' && (
              <div>
                <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 16px', lineHeight: 1.5 }}>
                  Exporta a apresentação no formato PowerPoint (.pptx), compatível com Microsoft PowerPoint,
                  LibreOffice Impress e Google Slides.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={handleExportPptx}
                  disabled={exporting}
                  style={{ width: '100%', justifyContent: 'center', padding: '10px 0', fontSize: 13.5 }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                  </svg>
                  {exporting ? progressText || 'Exportando…' : 'Exportar .pptx'}
                </button>
              </div>
            )}

            {/* ── PDF tab ──────────────────────────── */}
            {tab === 'pdf' && (
              <div>
                <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 16px', lineHeight: 1.5 }}>
                  Gera um PDF paisagem (16:9) com cada slide numa página. Ideal para compartilhar ou imprimir.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 12.5, color: 'var(--text-3)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v4M12 16h.01"/>
                  </svg>
                  Orientação: Paisagem 16:9 (960 × 540 px → 720 × 405 pt)
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleExportPdf}
                  disabled={exporting}
                  style={{ width: '100%', justifyContent: 'center', padding: '10px 0', fontSize: 13.5 }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                  </svg>
                  {exporting ? progressText || 'Exportando…' : 'Exportar PDF'}
                </button>
              </div>
            )}

            {/* ── PNG tab ──────────────────────────── */}
            {tab === 'png' && (
              <div>
                <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 12px', lineHeight: 1.5 }}>
                  Exporta cada slide como imagem PNG. Os arquivos são baixados individualmente com numeração sequencial.
                </p>
                <div style={{ marginBottom: 16 }}>
                  <div style={s.sectionLabel}>Resolução</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {qBtn('720p', '1280 × 720')}
                    {qBtn('1080p', '1920 × 1080')}
                    {qBtn('1440p', '2560 × 1440')}
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleExportPng}
                  disabled={exporting}
                  style={{ width: '100%', justifyContent: 'center', padding: '10px 0', fontSize: 13.5 }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                  </svg>
                  {exporting ? progressText || 'Exportando…' : 'Exportar PNGs'}
                </button>
              </div>
            )}

            {/* ── Progress bar ──────────────────────── */}
            {exporting && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>{progressText}</div>
                <div style={{
                  width: '100%',
                  height: 4,
                  background: 'var(--border)',
                  borderRadius: 99,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: 'var(--accent)',
                    borderRadius: 99,
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            )}

            {/* ── History ───────────────────────────── */}
            <div style={s.divider} />
            <div style={{ ...s.sectionLabel, marginTop: 0 }}>Histórico de Exportações</div>

            {history.length === 0 ? (
              <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: 0, fontStyle: 'italic' }}>
                Nenhuma exportação ainda.
              </p>
            ) : (
              <div>
                {history.slice(0, 10).map((rec) => (
                  <div key={rec.id} style={s.historyRow}>
                    <span style={{ color: 'var(--text-3)', flexShrink: 0 }}>
                      <FormatIcon format={rec.format} />
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', fontSize: 11, minWidth: 32 }}>
                      {rec.format}
                    </span>
                    <span style={{ color: 'var(--text-3)', flex: 1 }}>
                      {rec.slidesCount} slide{rec.slidesCount !== 1 ? 's' : ''}
                    </span>
                    <span style={{ color: 'var(--text-3)', fontSize: 11.5 }}>
                      {formatDate(rec.createdAt)}
                    </span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: 99,
                      background: rec.status === 'completed' ? 'var(--ok-soft, rgba(34,197,94,0.12))' : 'var(--bad-soft, rgba(239,68,68,0.12))',
                      color: rec.status === 'completed' ? 'var(--ok)' : 'var(--bad)',
                      flexShrink: 0,
                    }}>
                      {rec.status === 'completed' ? 'OK' : 'Erro'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 28,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1200,
          background: 'var(--text)',
          color: 'var(--surface)',
          padding: '10px 20px',
          borderRadius: 'var(--r-sm)',
          fontSize: 13,
          fontWeight: 600,
          boxShadow: 'var(--shadow-lg)',
          animation: 'fadeIn 0.2s ease',
          pointerEvents: 'none',
        }}>
          {toast}
        </div>
      )}
    </>
  );
}
