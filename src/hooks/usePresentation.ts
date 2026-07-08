'use client';
import { useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { useHistory } from './useHistory';
import type {
  Presentation, Slide, SlideElement, Theme, LayoutType,
  TextElement, ShapeElement, IconElement, ImageElement, TableElement, ChartElement, ThemeColors,
} from '@/types/slide';
import { createSlideFromLayout, createBlankSlide } from '@/lib/templates';
import { storage } from '@/lib/storage';

export function usePresentation(initial: Presentation) {
  const { state: presentation, set, undo, redo, canUndo, canRedo, reset } = useHistory<Presentation>(initial);

  const save = useCallback(
    (p?: Presentation) => { storage.set(p ?? presentation); },
    [presentation]
  );

  const update = useCallback(
    (updater: (p: Presentation) => Presentation) => {
      set((prev) => {
        const next = updater(prev);
        storage.set(next);
        return next;
      });
    },
    [set]
  );

  // --- Slide operations ---

  const addSlide = useCallback(
    (layout: LayoutType = 'blank', afterIndex?: number) => {
      update((p) => {
        const slide = layout === 'blank' ? createBlankSlide() : createSlideFromLayout(layout, p.theme);
        const slides = [...p.slides];
        const idx = afterIndex !== undefined ? afterIndex + 1 : slides.length;
        slides.splice(idx, 0, slide);
        return { ...p, slides };
      });
    },
    [update]
  );

  const duplicateSlide = useCallback(
    (slideId: string) => {
      update((p) => {
        const idx = p.slides.findIndex((s) => s.id === slideId);
        if (idx === -1) return p;
        const copy: Slide = {
          ...p.slides[idx],
          id: uuid(),
          elements: p.slides[idx].elements.map((e) => ({ ...e, id: uuid() })),
        };
        const slides = [...p.slides];
        slides.splice(idx + 1, 0, copy);
        return { ...p, slides };
      });
    },
    [update]
  );

  const removeSlide = useCallback(
    (slideId: string) => {
      update((p) => ({ ...p, slides: p.slides.filter((s) => s.id !== slideId) }));
    },
    [update]
  );

  const moveSlide = useCallback(
    (slideId: string, toIndex: number) => {
      update((p) => {
        const slides = [...p.slides];
        const fromIndex = slides.findIndex((s) => s.id === slideId);
        if (fromIndex === -1) return p;
        const [slide] = slides.splice(fromIndex, 1);
        slides.splice(toIndex, 0, slide);
        return { ...p, slides };
      });
    },
    [update]
  );

  const updateSlide = useCallback(
    (slideId: string, updater: (s: Slide) => Slide) => {
      update((p) => ({
        ...p,
        slides: p.slides.map((s) => (s.id === slideId ? updater(s) : s)),
      }));
    },
    [update]
  );

  // --- Element operations ---

  const addElement = useCallback(
    (slideId: string, element: SlideElement) => {
      updateSlide(slideId, (s) => ({ ...s, elements: [...s.elements, element] }));
    },
    [updateSlide]
  );

  const updateElement = useCallback(
    (slideId: string, elementId: string, updater: (e: SlideElement) => SlideElement) => {
      updateSlide(slideId, (s) => ({
        ...s,
        elements: s.elements.map((e) => (e.id === elementId ? updater(e) : e)),
      }));
    },
    [updateSlide]
  );

  const removeElement = useCallback(
    (slideId: string, elementId: string) => {
      updateSlide(slideId, (s) => ({
        ...s,
        elements: s.elements.filter((e) => e.id !== elementId),
      }));
    },
    [updateSlide]
  );

  const duplicateElement = useCallback(
    (slideId: string, elementId: string) => {
      updateSlide(slideId, (s) => {
        const el = s.elements.find((e) => e.id === elementId);
        if (!el) return s;
        const copy = { ...el, id: uuid(), x: el.x + 16, y: el.y + 16, zIndex: el.zIndex + 1 };
        return { ...s, elements: [...s.elements, copy] };
      });
    },
    [updateSlide]
  );

  const reorderElements = useCallback(
    (slideId: string, elementIds: string[]) => {
      updateSlide(slideId, (s) => ({
        ...s,
        elements: s.elements
          .map((e) => ({ ...e, zIndex: elementIds.indexOf(e.id) }))
          .sort((a, b) => a.zIndex - b.zIndex),
      }));
    },
    [updateSlide]
  );

  // --- Theme (with color propagation) ---

  const setTheme = useCallback(
    (newTheme: Theme) => {
      update((p) => {
        const oldColors: ThemeColors = p.theme.colors;
        const newColors: ThemeColors = newTheme.colors;

        // Build map: normalized old color → new color
        const colorMap = new Map<string, string>();
        (Object.keys(oldColors) as (keyof ThemeColors)[]).forEach((key) => {
          const oldHex = oldColors[key].toLowerCase();
          if (oldHex !== newColors[key].toLowerCase()) {
            colorMap.set(oldHex, newColors[key]);
          }
        });

        const mapColor = (c: string): string => colorMap.get(c.toLowerCase()) ?? c;

        // Propagate to all slides
        const slides = p.slides.map((slide) => {
          // Update slide background
          let background = { ...slide.background };
          if (background.type === 'color' && background.color) {
            background = { ...background, color: mapColor(background.color) };
          } else if (background.type === 'gradient' && background.gradient) {
            background = {
              ...background,
              gradient: {
                ...background.gradient,
                from: mapColor(background.gradient.from),
                to: mapColor(background.gradient.to),
              },
            };
          }

          // Update element colors
          const mapBorder = <B extends { color: string }>(border: B): B =>
            border.color && border.color !== 'transparent' ? { ...border, color: mapColor(border.color) } : border;
          const mapShadow = <S extends { color: string }>(shadow: S): S =>
            shadow.color ? { ...shadow, color: mapColor(shadow.color) } : shadow;

          const elements = slide.elements.map((el): SlideElement => {
            if (el.type === 'text') {
              const te = el as TextElement;
              return {
                ...te,
                style: { ...te.style, color: mapColor(te.style.color) },
                background: te.background !== 'transparent' ? mapColor(te.background) : te.background,
                border: mapBorder(te.border),
              };
            }
            if (el.type === 'shape') {
              const se = el as ShapeElement;
              return { ...se, fill: mapColor(se.fill), border: mapBorder(se.border), shadow: mapShadow(se.shadow) };
            }
            if (el.type === 'image') {
              const ie = el as ImageElement;
              return { ...ie, border: mapBorder(ie.border), shadow: mapShadow(ie.shadow) };
            }
            if (el.type === 'icon') {
              const ie = el as IconElement;
              return {
                ...ie,
                color: mapColor(ie.color),
                background: ie.background !== 'transparent' ? mapColor(ie.background) : ie.background,
                border: mapBorder(ie.border),
              };
            }
            if (el.type === 'table') {
              const tb = el as TableElement;
              return {
                ...tb,
                borderColor: mapColor(tb.borderColor),
                headerBackground: mapColor(tb.headerBackground),
                headerTextColor: mapColor(tb.headerTextColor),
                alternateColor: mapColor(tb.alternateColor),
                rows: tb.rows.map((row) =>
                  row.map((cell) => ({
                    ...cell,
                    background: cell.background !== 'transparent' ? mapColor(cell.background) : cell.background,
                    style: cell.style.color ? { ...cell.style, color: mapColor(cell.style.color) } : cell.style,
                  }))
                ),
              };
            }
            if (el.type === 'chart') {
              const ch = el as ChartElement;
              return { ...ch, colors: ch.colors.map(mapColor) };
            }
            if (el.type === 'line') {
              return { ...el, color: mapColor(el.color) };
            }
            return el;
          });

          return { ...slide, background, elements };
        });

        return { ...p, theme: newTheme, slides };
      });
    },
    [update]
  );

  const setTitle = useCallback(
    (title: string) => { update((p) => ({ ...p, title })); },
    [update]
  );

  const resetPresentation = useCallback(
    (p: Presentation) => reset(p),
    [reset]
  );

  return {
    presentation,
    undo,
    redo,
    canUndo,
    canRedo,
    addSlide,
    duplicateSlide,
    removeSlide,
    moveSlide,
    updateSlide,
    addElement,
    updateElement,
    removeElement,
    duplicateElement,
    reorderElements,
    setTheme,
    setTitle,
    save,
    resetPresentation,
  };
}
