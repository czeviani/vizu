'use client';
import * as LucideIcons from 'lucide-react';
import type {
  Slide,
  Presentation,
  TextElement,
  ShapeElement,
  IconElement,
  TableElement,
  ChartElement,
} from '@/types/slide';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '@/types/slide';
import { ChartEl } from './elements/ChartEl';

interface Props {
  slide: Slide;
  presentation: Presentation;
  /** Largura renderizada em px. Default = SLIDE_WIDTH (tamanho real do slide) — o chamador
   *  aplica `transform: scale(...)` para encaixar no espaço disponível (ex.: cards da galeria,
   *  captura para export). Para um tile pequeno nativo (sem wrapper de escala), passe um valor
   *  menor (ex.: 120, usado na sidebar de slides). */
  width?: number;
}

export function SlideMiniature({ slide, presentation: _, width = SLIDE_WIDTH }: Props) {
  const THUMB_W = width;
  const THUMB_H = width * (SLIDE_HEIGHT / SLIDE_WIDTH);
  const SCALE = width / SLIDE_WIDTH;

  const bg = slide.background;
  let backgroundStyle: React.CSSProperties = { background: '#ffffff' };
  if (bg.type === 'color') backgroundStyle = { background: bg.color };
  else if (bg.type === 'gradient' && bg.gradient)
    backgroundStyle = {
      background: `linear-gradient(${bg.gradient.direction}deg, ${bg.gradient.from}, ${bg.gradient.to})`,
    };
  else if (bg.type === 'image' && bg.image)
    backgroundStyle = { backgroundImage: `url(${bg.image})`, backgroundSize: 'cover', backgroundPosition: 'center' };

  const sorted = [...slide.elements]
    .filter((e) => e.visible)
    .sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'relative',
        width: THUMB_W,
        height: THUMB_H,
        overflow: 'hidden',
        flexShrink: 0,
        ...backgroundStyle,
      }}
    >
      {sorted.map((el) => {
        const base: React.CSSProperties = {
          position: 'absolute',
          left: el.x * SCALE,
          top: el.y * SCALE,
          width: el.width * SCALE,
          height: el.height * SCALE,
          opacity: el.opacity,
          transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
        };

        if (el.type === 'shape') {
          const s = el as ShapeElement;
          return (
            <div
              key={el.id}
              style={{
                ...base,
                background: s.fill,
                borderRadius:
                  s.shape === 'circle'
                    ? '50%'
                    : s.shape === 'rounded-rectangle'
                    ? (s.border.radius || 12) * SCALE
                    : s.border.radius * SCALE,
              }}
            />
          );
        }

        if (el.type === 'text') {
          const t = el as TextElement;
          return (
            <div
              key={el.id}
              style={{
                ...base,
                fontSize: t.style.fontSize * SCALE,
                color: t.style.color,
                fontWeight: t.style.fontWeight,
                fontStyle: t.style.fontStyle,
                textAlign: t.style.textAlign,
                lineHeight: t.style.lineHeight,
                overflow: 'hidden',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                padding: t.padding * SCALE,
              }}
            >
              {t.content}
            </div>
          );
        }

        if (el.type === 'image') {
          return (
            <div
              key={el.id}
              style={{
                ...base,
                background: '#e2e8f0',
                borderRadius: el.width * 0.05 * SCALE,
              }}
            />
          );
        }

        if (el.type === 'icon') {
          const ic = el as IconElement;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const Icon = (LucideIcons as any)[ic.iconName] as
            | React.ComponentType<{ size: number; color: string; strokeWidth: number }>
            | undefined;
          const size = Math.min(el.width, el.height) * SCALE * 0.7;
          return (
            <div
              key={el.id}
              style={{
                ...base,
                background: ic.background === 'transparent' ? undefined : ic.background,
                borderRadius: ic.border.radius * SCALE,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {Icon && <Icon size={size} color={ic.color} strokeWidth={1.5} />}
            </div>
          );
        }

        if (el.type === 'chart') {
          const ch = el as ChartElement;
          return (
            <div key={el.id} style={base}>
              <ChartEl element={ch} />
            </div>
          );
        }

        if (el.type === 'table') {
          const tb = el as TableElement;
          return (
            <div key={el.id} style={{ ...base, overflow: 'hidden' }}>
              <table style={{ width: '100%', height: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <tbody>
                  {tb.rows.map((row, ri) => {
                    const isHeader = tb.headerRow && ri === 0;
                    const isAlt = tb.alternateRowColor && ri % 2 === 1 && !isHeader;
                    return (
                      <tr key={ri}>
                        {row.map((cell, ci) => {
                          const isHeaderCol = tb.headerCol && ci === 0;
                          const cellBg = isHeader || isHeaderCol ? tb.headerBackground : isAlt ? tb.alternateColor : 'transparent';
                          const color = isHeader || isHeaderCol ? tb.headerTextColor : cell.style?.color ?? '#0f172a';
                          return (
                            <td
                              key={ci}
                              style={{
                                background: cell.background !== 'transparent' ? cell.background : cellBg,
                                color,
                                border: `${Math.max(0.5, SCALE)}px solid ${tb.borderColor}`,
                                padding: 6 * SCALE,
                                fontWeight: isHeader || isHeaderCol ? 600 : 400,
                                fontSize: Math.max(4, 13 * SCALE),
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {cell.content}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        }

        return <div key={el.id} style={{ ...base, background: 'rgba(0,0,0,0.1)' }} />;
      })}
    </div>
  );
}
