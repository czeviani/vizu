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
import { ContextMenu } from '@/components/editor/ContextMenu';
import type { ContextMenuItem } from '@/components/editor/ContextMenu';
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
  const [welcomeToast, setWelcomeToast] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementId: string | null } | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Clipboard interno para Ctrl+C / Ctrl+V de elementos
  const clipboardRef = useRef<SlideElement[]>([]);

  // Estado de painéis colapsáveis com persistência em localStorage
  // Inicializa sempre false para evitar hydration mismatch (SSR vs client)
  const [slidePanelCollapsed, setSlidePanelCollapsed] = useState(false);
  const [propsPanelCollapsed, setPropsPanelCollapsed] = useState(false);

  // Sincroniza com localStorage após mount
  useEffect(() => {
    setSlidePanelCollapsed(localStorage.getItem('vizu-slide-panel') === 'collapsed');
    setPropsPanelCollapsed(localStorage.getItem('vizu-props-panel') === 'collapsed');
  }, []);

  useEffect(() => {
    const load = async () => {
      let p = storage.get(id);
      if (!p) {
        // Not in localStorage — try Supabase
        await storage.init();
        p = storage.get(id);
      }
      if (!p) {
        setNotFound(true);
      } else {
        setPresentation(p);
        const createdAt = new Date(p.metadata?.createdAt ?? 0).getTime();
        const isNew = Date.now() - createdAt < 10000;
        if (isNew) {
          setTimeout(() => setWelcomeToast(true), 800);
          setTimeout(() => setWelcomeToast(false), 4800);
        }
      }
      setLoaded(true);
    };
    load();
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
  const stateRef = useRef({ activeSlide, selectedIds, pres, duplicateElement, undo, redo, updateElement, addElement });
  stateRef.current = { activeSlide, selectedIds, pres, duplicateElement, undo, redo, updateElement, addElement };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const { activeSlide: slide, selectedIds: ids, pres: p, duplicateElement: dupEl, undo: u, redo: r, updateElement: updEl, addElement: addEl } = stateRef.current;
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

      // Ctrl+C — copiar elementos selecionados
      if (ctrl && e.key === 'c' && !isInput) {
        if (slide && ids.length > 0) {
          clipboardRef.current = slide.elements
            .filter(el => ids.includes(el.id))
            .map(el => ({ ...el }));
        }
      }

      // Ctrl+V — colar elementos do clipboard interno
      if (ctrl && e.key === 'v' && !isInput) {
        if (clipboardRef.current.length > 0 && slide) {
          const newIds: string[] = [];
          clipboardRef.current.forEach(el => {
            const newEl = { ...el, id: uuid(), x: el.x + 16, y: el.y + 16 };
            addEl(slide.id, newEl);
            newIds.push(newEl.id);
          });
          setSelectedIds(newIds);
        }
      }

      // T — inserir texto
      if ((e.key === 't' || e.key === 'T') && !isInput) {
        if (slide) {
          const newEl = {
            id: uuid(), type: 'text' as const,
            content: 'Clique para editar',
            x: 320, y: 230, width: 320, height: 80,
            rotation: 0, opacity: 1, zIndex: 10, locked: false, visible: true,
            style: {
              fontFamily: 'Inter', fontSize: 24, fontWeight: 400,
              fontStyle: 'normal' as const, textDecoration: 'none' as const,
              textAlign: 'left' as const,
              color: '#1a1a1a', lineHeight: 1.4, letterSpacing: 0,
              textTransform: 'none' as const,
            },
            background: 'transparent',
            border: { width: 0, color: 'transparent', style: 'none' as const, radius: 0 },
            padding: 8,
            verticalAlign: 'top' as const,
          };
          addEl(slide.id, newEl);
          setSelectedIds([newEl.id]);
        }
      }

      // R — inserir retângulo
      if ((e.key === 'r' || e.key === 'R') && !isInput) {
        if (slide) {
          const newEl = {
            id: uuid(), type: 'shape' as const,
            shape: 'rectangle' as const,
            fill: '#6d5ae6',
            border: { width: 0, color: 'transparent', style: 'none' as const, radius: 8 },
            shadow: { enabled: false, x: 0, y: 4, blur: 12, color: 'rgba(0,0,0,0.15)' },
            x: 280, y: 190, width: 400, height: 160,
            rotation: 0, opacity: 1, zIndex: 10, locked: false, visible: true,
          };
          addEl(slide.id, newEl);
          setSelectedIds([newEl.id]);
        }
      }

      // Arrow keys — mover elementos selecionados
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (ids.length > 0 && slide) {
          const target = e.target as HTMLElement;
          if (!target.isContentEditable && !['INPUT', 'TEXTAREA'].includes(target.tagName)) {
            e.preventDefault();
            const delta = e.shiftKey ? 10 : 1;
            const dx = e.key === 'ArrowRight' ? delta : e.key === 'ArrowLeft' ? -delta : 0;
            const dy = e.key === 'ArrowDown' ? delta : e.key === 'ArrowUp' ? -delta : 0;
            ids.forEach(elId => {
              updEl(slide.id, elId, (el) => ({
                ...el, x: Math.max(0, el.x + dx), y: Math.max(0, el.y + dy),
              }));
            });
          }
        }
      }

      // Ctrl+A — selecionar tudo
      if (ctrl && e.key === 'a' && !isInput) {
        e.preventDefault();
        if (slide) setSelectedIds(slide.elements.map(el => el.id));
      }
    };

    window.addEventListener('keydown', handleKey);
    window.addEventListener('paste', handlePaste as EventListener);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('paste', handlePaste as EventListener);
    };
  }, [handlePaste]); // stable: most state accessed via stateRef

  // Handlers de colapso dos painéis
  const handleToggleSlidePanel = useCallback(() => {
    setSlidePanelCollapsed(v => {
      const next = !v;
      localStorage.setItem('vizu-slide-panel', next ? 'collapsed' : 'expanded');
      return next;
    });
  }, []);

  const handleTogglePropsPanel = useCallback(() => {
    setPropsPanelCollapsed(v => {
      const next = !v;
      localStorage.setItem('vizu-props-panel', next ? 'collapsed' : 'expanded');
      return next;
    });
  }, []);

  // Gera os itens do menu de contexto baseado no elemento clicado
  const getContextMenuItems = useCallback((elementId: string | null): ContextMenuItem[] => {
    if (!activeSlide) return [];

    if (!elementId) {
      // Canvas vazio
      return [
        {
          label: 'Inserir texto',
          shortcut: 'T',
          icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>,
          action: () => {
            const newEl = {
              id: uuid(), type: 'text' as const,
              content: 'Clique para editar',
              x: 320, y: 230, width: 320, height: 80,
              rotation: 0, opacity: 1, zIndex: 10, locked: false, visible: true,
              style: {
                fontFamily: 'Inter', fontSize: 24, fontWeight: 400,
                fontStyle: 'normal' as const, textDecoration: 'none' as const,
                textAlign: 'left' as const,
                color: '#1a1a1a', lineHeight: 1.4, letterSpacing: 0,
                textTransform: 'none' as const,
              },
              background: 'transparent',
              border: { width: 0, color: 'transparent', style: 'none' as const, radius: 0 },
              padding: 8,
              verticalAlign: 'top' as const,
            };
            addElement(activeSlide.id, newEl);
            setSelectedIds([newEl.id]);
          },
        },
        {
          label: 'Inserir forma',
          shortcut: 'R',
          icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>,
          action: () => {
            const newEl = {
              id: uuid(), type: 'shape' as const,
              shape: 'rectangle' as const,
              fill: '#6d5ae6',
              border: { width: 0, color: 'transparent', style: 'none' as const, radius: 8 },
              shadow: { enabled: false, x: 0, y: 4, blur: 12, color: 'rgba(0,0,0,0.15)' },
              x: 280, y: 190, width: 400, height: 160,
              rotation: 0, opacity: 1, zIndex: 10, locked: false, visible: true,
            };
            addElement(activeSlide.id, newEl);
            setSelectedIds([newEl.id]);
          },
        },
        { separator: true, label: '', action: () => {} },
        {
          label: 'Colar',
          shortcut: 'Ctrl+V',
          disabled: clipboardRef.current.length === 0,
          action: () => {
            if (clipboardRef.current.length > 0) {
              const newIds: string[] = [];
              clipboardRef.current.forEach(el => {
                const newEl = { ...el, id: uuid(), x: el.x + 16, y: el.y + 16 };
                addElement(activeSlide.id, newEl);
                newIds.push(newEl.id);
              });
              setSelectedIds(newIds);
            }
          },
        },
        { separator: true, label: '', action: () => {} },
        {
          label: 'Selecionar tudo',
          shortcut: 'Ctrl+A',
          action: () => setSelectedIds(activeSlide.elements.map(e => e.id)),
        },
        { separator: true, label: '', action: () => {} },
        {
          label: 'Adicionar slide depois',
          action: () => addSlide('blank', activeIndex),
        },
        {
          label: 'Duplicar slide atual',
          action: () => { if (activeSlide) duplicateSlide(activeSlide.id); },
        },
      ];
    }

    // Elemento selecionado — ações comuns
    const el = activeSlide.elements.find(e => e.id === elementId);
    if (!el) return [];

    const commonItems: ContextMenuItem[] = [
      {
        label: 'Copiar',
        shortcut: 'Ctrl+C',
        icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
        action: () => {
          clipboardRef.current = [{ ...el }];
        },
      },
      {
        label: 'Duplicar',
        shortcut: 'Ctrl+D',
        icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
        action: () => duplicateElement(activeSlide.id, elementId),
      },
      { separator: true, label: '', action: () => {} },
      {
        label: 'Trazer à frente',
        action: () => {
          const maxZ = Math.max(0, ...activeSlide.elements.map(e => e.zIndex));
          updateElement(activeSlide.id, elementId, (e) => ({ ...e, zIndex: maxZ + 1 }));
        },
      },
      {
        label: 'Enviar ao fundo',
        action: () => {
          const minZ = Math.min(0, ...activeSlide.elements.map(e => e.zIndex));
          updateElement(activeSlide.id, elementId, (e) => ({ ...e, zIndex: Math.max(0, minZ - 1) }));
        },
      },
      { separator: true, label: '', action: () => {} },
      {
        label: el.locked ? 'Desbloquear' : 'Bloquear',
        action: () => updateElement(activeSlide.id, elementId, (e) => ({ ...e, locked: !e.locked })),
      },
      {
        label: el.visible ? 'Ocultar' : 'Mostrar',
        action: () => updateElement(activeSlide.id, elementId, (e) => ({ ...e, visible: !e.visible })),
      },
      { separator: true, label: '', action: () => {} },
      {
        label: 'Excluir',
        shortcut: 'Del',
        danger: true,
        icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>,
        action: () => { removeElement(activeSlide.id, elementId); setSelectedIds([]); },
      },
    ];

    // Para texto, adicionar "Editar texto" no topo
    if (el.type === 'text') {
      return [
        {
          label: 'Editar texto',
          action: () => { setSelectedIds([elementId]); },
        },
        ...commonItems,
      ];
    }

    return commonItems;
  }, [activeSlide, activeIndex, addElement, addSlide, duplicateElement, duplicateSlide, removeElement, updateElement]);

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
        onRemoveElement={(elId) => { if (activeSlide) removeElement(activeSlide.id, elId); }}
        onDuplicateElement={(elId) => { if (activeSlide) duplicateElement(activeSlide.id, elId); }}
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
          collapsed={slidePanelCollapsed}
          onToggleCollapse={handleToggleSlidePanel}
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
              onContextMenu={(e, elementId) => {
                if (elementId) setSelectedIds([elementId]);
                setContextMenu({ x: e.clientX, y: e.clientY, elementId });
              }}
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
          collapsed={propsPanelCollapsed}
          onToggleCollapse={handleTogglePropsPanel}
        />
      </div>

      {showPreview && (
        <PreviewModal
          presentation={pres}
          startIndex={activeIndex}
          onClose={() => setShowPreview(false)}
        />
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems(contextMenu.elementId)}
          onClose={() => setContextMenu(null)}
        />
      )}

      {welcomeToast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
        }}>
          <div className="toast toast-info">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            Apresentação criada! Clique em qualquer texto para editar.
            <div className="toast-progress" />
          </div>
        </div>
      )}
    </div>
  );
}
