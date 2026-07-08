import type { RefObject } from 'react';
import type { Presentation } from '@/types/slide';
import { exportToPptx } from '@/lib/pptxExport';

/* ── Types ────────────────────────────────────────────────── */

export interface ExportRecord {
  id: string;
  presentationId: string;
  presentationTitle: string;
  format: 'pptx' | 'pdf' | 'png';
  status: 'completed' | 'error';
  createdAt: string;
  slidesCount: number;
}

/* ── History helpers ──────────────────────────────────────── */

const HISTORY_KEY = 'vizu-export-history';
const MAX_HISTORY = 10;

export function getExportHistory(presentationId: string): ExportRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const all: ExportRecord[] = JSON.parse(raw);
    return all
      .filter((r) => r.presentationId === presentationId)
      .slice(0, MAX_HISTORY);
  } catch {
    return [];
  }
}

export function saveExportRecord(record: ExportRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const all: ExportRecord[] = raw ? JSON.parse(raw) : [];
    all.unshift(record);
    // Keep total size bounded
    localStorage.setItem(HISTORY_KEY, JSON.stringify(all.slice(0, 100)));
  } catch {
    // ignore storage errors
  }
}

export function clearExportHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(HISTORY_KEY);
}

export function getAllExportHistory(): ExportRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function removeExportRecord(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const all: ExportRecord[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(all.filter((r) => r.id !== id)));
  } catch {
    // ignore storage errors
  }
}

/* ── Resolution scale ─────────────────────────────────────── */

export function resolutionScale(quality: '720p' | '1080p' | '1440p'): number {
  switch (quality) {
    case '720p':  return 1;
    case '1080p': return 1.5;
    case '1440p': return 2;
  }
}

/* ── Download helpers ─────────────────────────────────────── */

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function safeTitle(title: string) {
  return title.replace(/[^a-zA-Z0-9_\-À-ɏ]/g, '_').slice(0, 60);
}

/* ── Export functions ─────────────────────────────────────── */

export async function exportAsPptx(presentation: Presentation): Promise<void> {
  const blob = await exportToPptx(presentation);
  downloadBlob(blob, `${safeTitle(presentation.title)}.pptx`);
}

export async function exportAsPng(
  presentation: Presentation,
  slideRefs: RefObject<HTMLElement | null>[],
  quality: '720p' | '1080p' | '1440p',
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  const { toPng } = await import('html-to-image');
  const scale = resolutionScale(quality);
  const total = slideRefs.length;

  for (let i = 0; i < slideRefs.length; i++) {
    const ref = slideRefs[i];
    onProgress?.(i + 1, total);

    if (!ref.current) continue;

    const dataUrl = await toPng(ref.current, {
      width: 960,
      height: 540,
      pixelRatio: scale,
    });

    const blob = await (await fetch(dataUrl)).blob();
    const num = String(i + 1).padStart(2, '0');
    downloadBlob(blob, `${safeTitle(presentation.title)}_slide${num}.png`);

    // Small delay between downloads so browser doesn't block them
    if (i < slideRefs.length - 1) {
      await new Promise((r) => setTimeout(r, 150));
    }
  }
}

export async function exportAsPdf(
  presentation: Presentation,
  slideRefs: RefObject<HTMLElement | null>[],
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  // 960×540 px → points: 1px = 0.75pt → 720×405 pt = 10in × 5.625in
  const W_PT = 720;
  const H_PT = 405;

  const [{ toPng }, { jsPDF }] = await Promise.all([
    import('html-to-image'),
    import('jspdf'),
  ]);

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: [W_PT, H_PT],
  });

  const total = slideRefs.length;

  for (let i = 0; i < slideRefs.length; i++) {
    const ref = slideRefs[i];
    onProgress?.(i + 1, total);

    if (!ref.current) continue;

    const dataUrl = await toPng(ref.current, {
      width: 960,
      height: 540,
      pixelRatio: 2, // retina quality for PDF
    });

    if (i > 0) pdf.addPage([W_PT, H_PT], 'landscape');
    pdf.addImage(dataUrl, 'PNG', 0, 0, W_PT, H_PT);
  }

  const pdfBlob = pdf.output('blob');
  downloadBlob(pdfBlob, `${safeTitle(presentation.title)}.pdf`);
}
