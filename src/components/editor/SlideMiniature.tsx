'use client';
import type { Slide, Presentation, TextElement, ShapeElement } from '@/types/slide';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '@/types/slide';

interface Props {
  slide: Slide;
  presentation: Presentation;
}

const THUMB_W = 120;
const THUMB_H = 68;
const SCALE = THUMB_W / SLIDE_WIDTH;

export function SlideMiniature({ slide, presentation: _ }: Props) {
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

        return <div key={el.id} style={{ ...base, background: 'rgba(0,0,0,0.1)' }} />;
      })}
    </div>
  );
}
