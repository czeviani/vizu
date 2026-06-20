'use client';
import type { ImageElement } from '@/types/slide';
import { t } from '@/lib/i18n';

interface Props {
  element: ImageElement;
}

export function ImageEl({ element: el }: Props) {
  const shadow = el.shadow.enabled
    ? `${el.shadow.x}px ${el.shadow.y}px ${el.shadow.blur}px ${el.shadow.color}`
    : undefined;

  if (!el.src) {
    return (
      <div
        style={{
          width: '100%', height: '100%',
          background: 'linear-gradient(135deg, #e2e8f0 0%, #f1f5f9 100%)',
          borderRadius: el.border.radius,
          border: el.border.style !== 'none' ? `${el.border.width}px ${el.border.style} ${el.border.color}` : '2px dashed #cbd5e1',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#94a3b8', fontSize: 12, flexDirection: 'column', gap: 8,
          userSelect: 'none',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
        <span style={{ textAlign: 'center', padding: '0 8px', lineHeight: 1.4 }}>
          {t.img_no_src}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%', height: '100%',
        borderRadius: el.border.radius,
        border: el.border.style !== 'none' ? `${el.border.width}px ${el.border.style} ${el.border.color}` : undefined,
        overflow: 'hidden',
        boxShadow: shadow,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={el.src}
        alt={el.alt}
        style={{ width: '100%', height: '100%', objectFit: el.objectFit, display: 'block' }}
        draggable={false}
      />
    </div>
  );
}
