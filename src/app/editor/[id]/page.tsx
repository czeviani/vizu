'use client';
import { use, useEffect, useState, useRef, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { useRouter } from 'next/navigation';
import type { Presentation, SlideElement, Slide, ImageElement } from '@/types/slide';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '@/types/slide';
import { storage } from '@/lib/storage';
import { usePresentation } from '@/hooks/usePresentation';
import { Toolbar } from '@/components/editor/Toolbar';
import { SlidePanel } from '@/components/editor/SlidePanel';
import { SlideCanvas } from '@/components/editor/SlideCanvas';
import { PropertiesPanel } from '@/components/editor/PropertiesPanel';
import { PreviewModal } from '@/components/editor/PreviewModal';
import { t } from '@/lib/i18n';

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [zoom, setZoom] = useState(0.7);
  const [saveStatus, setSaveStatus] = useState<'saved' | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const p = storage.get(id);
    if (!p) {
      setNotFound(true);
    } else {
      setPresentation(p);
    }
    setLoaded(true);
  }, [id]);

  const {
    presentation: pres,
    canUndo, canRedo, undo, redo,
    addSlide, duplicateSlide, removeSlide, moveSlide,
    updateSlide, addElement, updateElement, removeElement,
    duplicateElement, setTheme, setTitle, resetPresentation,
  } = usePresentation(presentation ?? ({} as Presentation));

  useEffect(() => {
    if (presentation) resetPresentation(presentation);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presentation]);

  const activeSlide: Slide | null = pres.slides?.[activeIndex] ?? null;
  const selectedElements: SlideElement[] = activeSlide
    ? activeSlide.elements.filter((e) => selectedIds.includes(e.id))
    : [];

  useEffect(() => {
    if (!pres.id || !pres.slides) return;
    storage.set(pres);
    setSaveStatus('saved');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSaveStatus(null), 1500);
  }, [pres]);

  // Clipboard paste — handles Ctrl+V image paste
  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (!activeSlide) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const src = ev.target?.result as string;
            if (!src) return;
            const imgEl: ImageElement = {
              id: uuid(), type: 'image', src, alt: 'Imagem colada',
              objectFit: 'cover',
              x: 200, y: 130, width: 400, height: 240,
              rotation: 0, opacity: 1, zIndex: 10, locked: false, visible: true,
              border: { width: 0, color: '', style: 'none', radius: 0 },
              shadow: { enabled: false, x: 0, y: 4, blur: 12, color: 'rgba(0,0,0,0.15)' },
            };
            addElement(activeSlide.id, imgEl);
            setSelectedIds([imgEl.id]);
          };
          reader.readAsDataURL(file);
          return;
        }
      }
    },
    [activeSlide, addElement]
  );

  // Global keyboard shortcuts
  const stateRef = useRef({ activeSlide, selectedIds, pres, duplicateElement, undo, redo });
  stateRef.current = { activeSlide, selectedIds, pres, duplicateElement, undo, redo };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const { activeSlide: slide, selectedIds: ids, pres: p, duplicateElement: dupEl, undo: u, redo: r } = stateRef.current;
      const ctrl = e.ctrlKey || e.metaKey;
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable;

      if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); u(); }
      if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); r(); }
      if (ctrl && e.key === '=') { e.preventDefault(); setZoom((z) => Math.min(2, z + 0.1)); }
      if (ctrl && e.key === '-') { e.preventDefault(); setZoom((z) => Math.max(0.25, z - 0.1)); }
      if (ctrl && e.key === '0') { e.preventDefault(); setZoom(0.7); }
      if (e.key === 'F5' || (ctrl && e.key === 'Enter')) { e.preventDefault(); setShowPreview(true); }
      if (ctrl && e.key === 's') {
        e.preventDefault();
        if (p.id) storage.set(p);
        setSaveStatus('saved');
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => setSaveStatus(null), 1500);
      }
      if (ctrl && e.key === 'd' && !isInput) {
        e.preventDefault();
        if (ids.length === 1 && slide) dupEl(slide.id, ids[0]);
      }
      if (e.key === 'Escape' && !isInput) {
        setSelectedIds([]);
      }
    };

    window.addEventListener('keydown', handleKey);
    window.addEventListener('paste', handlePaste as EventListener);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('paste', handlePaste as EventListener);
    };
  }, [handlePaste]); // stable: most state accessed via stateRef

  // Loading / not-found states
  if (!loaded) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text)' }}>
        {t.loading}
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: 'var(--bg)', color: 'var(--text)' }}>
        <p>{t.not_found}</p>
        <button onClick={() => router.push('/')} style={{ padding: '8px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          {t.go_home}
        </button>
      </div>
    );
  }

  if (!pres.id || !pres.slides) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text)' }}>
        {t.loading}
      </div>
    );
  }

  const handleSelectSlide = (index: number) => {
    setActiveIndex(index);
    setSelectedIds([]);
  };

  return (
    <div
      style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        background: 'var(--bg)', color: 'var(--text)',
        overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <Toolbar
        presentation={pres}
        activeSlideId={activeSlide?.id ?? null}
        selectedElements={selectedElements}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onAddElement={(slideId, el) => addElement(slideId, el)}
        onUpdateElement={(elId, updater) => {
          if (activeSlide) updateElement(activeSlide.id, elId, updater);
        }}
        onSetTitle={setTitle}
        onPreview={() => setShowPreview(true)}
        zoom={zoom}
        onZoom={setZoom}
        saveStatus={saveStatus}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((v) => !v)}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <SlidePanel
          presentation={pres}
          activeIndex={activeIndex}
          onSelectSlide={handleSelectSlide}
          onAddSlide={addSlide}
          onDuplicateSlide={duplicateSlide}
          onRemoveSlide={removeSlide}
          onMoveSlide={moveSlide}
        />

        <div
          style={{
            flex: 1, overflow: 'auto', background: 'var(--canvas-bg)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 40,
          }}
        >
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              marginBottom: `${SLIDE_HEIGHT * zoom - SLIDE_HEIGHT + 40}px`,
            }}
          >
            <SlideCanvas
              slide={activeSlide}
              presentation={pres}
              selectedIds={selectedIds}
              onSelectIds={setSelectedIds}
              onUpdateElement={(elementId, updater) => {
                if (activeSlide) updateElement(activeSlide.id, elementId, updater);
              }}
              onUpdateSlide={(updater) => {
                if (activeSlide) updateSlide(activeSlide.id, updater);
              }}
              onAddElement={(el) => {
                if (activeSlide) addElement(activeSlide.id, el);
              }}
              scale={zoom}
              showGrid={showGrid}
            />
          </div>
        </div>

        <PropertiesPanel
          presentation={pres}
          slide={activeSlide}
          selectedElements={selectedElements}
          onUpdateElement={(elId, updater) => {
            if (activeSlide) updateElement(activeSlide.id, elId, updater);
          }}
          onUpdateSlide={(updater) => {
            if (activeSlide) updateSlide(activeSlide.id, updater);
          }}
          onSetTheme={setTheme}
          onDuplicateElement={(elId) => { if (activeSlide) duplicateElement(activeSlide.id, elId); }}
          onRemoveElement={(elId) => { if (activeSlide) removeElement(activeSlide.id, elId); }}
          onBringToFront={(elId) => {
            if (activeSlide) {
              const maxZ = Math.max(0, ...activeSlide.elements.map((e) => e.zIndex));
              updateElement(activeSlide.id, elId, (e) => ({ ...e, zIndex: maxZ + 1 }));
            }
          }}
          onSendToBack={(elId) => {
            if (activeSlide) {
              const minZ = Math.min(0, ...activeSlide.elements.map((e) => e.zIndex));
              updateElement(activeSlide.id, elId, (e) => ({ ...e, zIndex: Math.max(0, minZ - 1) }));
            }
          }}
        />
      </div>

      {showPreview && (
        <PreviewModal
          presentation={pres}
          startIndex={activeIndex}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
