'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Presentation, TextElement, ShapeElement } from '@/types/slide';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '@/types/slide';

interface Props {
  presentation: Presentation;
  startIndex: number;
  onClose: () => void;
}

export function PreviewModal({ presentation, startIndex, onClose }: Props) {
  const [index, setIndex] = useState(startIndex);
  const slide = presentation.slides[index];

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const next = useCallback(
    () => setIndex((i) => Math.min(presentation.slides.length - 1, i + 1)),
    [presentation.slides.length]
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') next();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [next, prev, onClose]);

  if (!slide) return null;

  const bg = slide.background;
  let backgroundStyle: React.CSSProperties = {};
  if (bg.type === 'color') backgroundStyle = { background: bg.color };
  else if (bg.type === 'gradient' && bg.gradient)
    backgroundStyle = {
      background: `linear-gradient(${bg.gradient.direction}deg, ${bg.gradient.from}, ${bg.gradient.to})`,
    };
  else if (bg.type === 'image' && bg.image)
    backgroundStyle = { backgroundImage: `url(${bg.image})`, backgroundSize: 'cover', backgroundPosition: 'center' };

  const sorted = [...slide.elements].filter((e) => e.visible).sort((a, b) => a.zIndex - b.zIndex);

  // Scale to fit viewport
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 720;
  const scale = Math.min((vw * 0.95) / SLIDE_WIDTH, (vh * 0.9) / SLIDE_HEIGHT);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.95)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Slide */}
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
        <div
          style={{
            position: 'relative',
            width: SLIDE_WIDTH,
            height: SLIDE_HEIGHT,
            ...backgroundStyle,
            overflow: 'hidden',
            borderRadius: 2,
          }}
        >
          {sorted.map((el) => {
            const base: React.CSSProperties = {
              position: 'absolute',
              left: el.x,
              top: el.y,
              width: el.width,
              height: el.height,
              opacity: el.opacity,
              transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
              zIndex: el.zIndex,
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
                      s.shape === 'circle' ? '50%' : s.shape === 'rounded-rectangle' ? s.border.radius || 12 : s.border.radius,
                    boxShadow: s.shadow.enabled ? `${s.shadow.x}px ${s.shadow.y}px ${s.shadow.blur}px ${s.shadow.color}` : undefined,
                  }}
                />
              );
            }

            if (el.type === 'text') {
              const t = el as TextElement;
              const va = t.verticalAlign === 'middle' ? 'center' : t.verticalAlign === 'bottom' ? 'flex-end' : 'flex-start';
              return (
                <div key={el.id} style={{ ...base, display: 'flex', alignItems: va, padding: t.padding, boxSizing: 'border-box', background: t.background === 'transparent' ? undefined : t.background }}>
                  <div
                    style={{
                      fontFamily: t.style.fontFamily,
                      fontSize: t.style.fontSize,
                      fontWeight: t.style.fontWeight,
                      fontStyle: t.style.fontStyle,
                      textDecoration: t.style.textDecoration,
                      color: t.style.color,
                      textAlign: t.style.textAlign,
                      lineHeight: t.style.lineHeight,
                      letterSpacing: t.style.letterSpacing,
                      textTransform: t.style.textTransform,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      width: '100%',
                    }}
                    dangerouslySetInnerHTML={{ __html: t.content.replace(/\n/g, '<br/>') }}
                  />
                </div>
              );
            }

            if (el.type === 'image') {
              return (
                <div key={el.id} style={{ ...base, overflow: 'hidden', borderRadius: el.width * 0.02 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={(el as any).src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              );
            }

            return <div key={el.id} style={base} />;
          })}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: '#fff' }}>
        <button
          onClick={prev}
          disabled={index === 0}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '8px 16px', color: '#fff', cursor: 'pointer', opacity: index === 0 ? 0.3 : 1 }}
        >
          ← Prev
        </button>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
          {index + 1} / {presentation.slides.length}
        </span>
        <button
          onClick={next}
          disabled={index === presentation.slides.length - 1}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '8px 16px', color: '#fff', cursor: 'pointer', opacity: index === presentation.slides.length - 1 ? 0.3 : 1 }}
        >
          Next →
        </button>
        <button
          onClick={onClose}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '8px 16px', color: '#fff', cursor: 'pointer', marginLeft: 16 }}
        >
          ✕ Close
        </button>
      </div>
    </div>
  );
}
